-- SADU role claims and policy hardening.
--
-- 1. One trusted source of institutional roles (sadu_user_roles), issued into every
--    access token by the custom access token hook. Policies read the claim either at
--    the top level or under app_metadata; the hook writes both, identically, and
--    strips any value for users without a role row.
-- 2. Least-privilege theme policies: no deletes, status-bound transitions, and
--    Chairman ratification cannot rewrite theme text.
-- 3. Fail closed on the legacy broad dossier policies if they are still present.
--    The Stage 4/5 dossier workflow policies remain in the root migration.sql.
-- 4. Finance reads contract files only for signed, PR- and Technical-cleared
--    contracts (matching the contract row policy); coordinators upload only into
--    dossier document slots assigned to them.
--
-- HIP is deliberately not provisionable (AGENTS.md). Existing policies that mention
-- HIP are left untouched for legacy rows; no new account can receive the role.

begin;

create table public.sadu_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  institutional_role text not null check (institutional_role in (
    'ADMIN','ARTIST','BIENNIAL_DIRECTOR','CHAIRMAN','COORDINATOR','EDITORIAL',
    'EDITORIAL_DEPARTMENT','EXTERNAL_VENDOR','FINANCE','LOGISTICS',
    'PREPARATORY_COMMITTEE','PR_PROTOCOL','TECHNICAL')),
  granted_reason text not null check (length(btrim(granted_reason)) >= 5),
  granted_at timestamptz not null default now()
);
alter table public.sadu_user_roles enable row level security;
-- Provisioning is a trusted server/admin operation (service_role); browsers cannot read or write roles.
revoke all on public.sadu_user_roles from anon, authenticated, public;
grant select on public.sadu_user_roles to supabase_auth_admin;
create policy "Auth server reads institutional roles" on public.sadu_user_roles
for select to supabase_auth_admin using (true);

create function public.sadu_custom_access_token(event jsonb) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  claims jsonb := coalesce(event->'claims', '{}'::jsonb);
  role_name text;
begin
  select r.institutional_role into role_name
  from public.sadu_user_roles r where r.user_id = (event->>'user_id')::uuid;
  claims := (claims - 'institutional_role')
    || jsonb_build_object('app_metadata', coalesce(claims->'app_metadata', '{}'::jsonb) - 'institutional_role');
  if role_name is not null then
    claims := claims || jsonb_build_object('institutional_role', role_name)
      || jsonb_build_object('app_metadata', (claims->'app_metadata') || jsonb_build_object('institutional_role', role_name));
  end if;
  return jsonb_set(event, '{claims}', claims);
end $$;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.sadu_custom_access_token(jsonb) to supabase_auth_admin;
revoke execute on function public.sadu_custom_access_token(jsonb) from authenticated, anon, public;

create function public.sadu_institutional_role() returns text
language sql stable security invoker set search_path = '' as $$
  select coalesce(nullif(auth.jwt()->'app_metadata'->>'institutional_role', ''), auth.jwt()->>'institutional_role', '');
$$;
revoke all on function public.sadu_institutional_role() from public;
grant execute on function public.sadu_institutional_role() to authenticated;

-- Themes ---------------------------------------------------------------------
drop policy if exists "Committee can draft themes" on public.themes;
drop policy if exists "Chairman can ratify themes" on public.themes;
drop policy if exists "Editorial can publish themes" on public.themes;
revoke all on public.themes from anon;
revoke delete, truncate on public.themes from authenticated;

create policy themes_read on public.themes for select to authenticated using (
  public.sadu_institutional_role() in ('PREPARATORY_COMMITTEE','CHAIRMAN','EDITORIAL_DEPARTMENT')
  or status = 'PUBLISHED_OFFICIAL');
create policy themes_committee_draft on public.themes for insert to authenticated with check (
  public.sadu_institutional_role() = 'PREPARATORY_COMMITTEE' and status = 'DRAFT');
create policy themes_committee_revise on public.themes for update to authenticated
using (public.sadu_institutional_role() = 'PREPARATORY_COMMITTEE' and status in ('DRAFT','PROPOSED'))
with check (public.sadu_institutional_role() = 'PREPARATORY_COMMITTEE'
  and status in ('DRAFT','PROPOSED','PENDING_CHAIRMAN_APPROVAL'));
create policy themes_chairman_ratify on public.themes for update to authenticated
using (public.sadu_institutional_role() = 'CHAIRMAN' and status = 'PENDING_CHAIRMAN_APPROVAL')
with check (public.sadu_institutional_role() = 'CHAIRMAN' and status = 'PENDING_EDITORIAL_POLISH');
create policy themes_editorial_publish on public.themes for update to authenticated
using (public.sadu_institutional_role() = 'EDITORIAL_DEPARTMENT' and status = 'PENDING_EDITORIAL_POLISH')
with check (public.sadu_institutional_role() = 'EDITORIAL_DEPARTMENT'
  and status in ('PENDING_EDITORIAL_POLISH','PUBLISHED_OFFICIAL'));

-- RLS controls rows, not columns. Keep identity fixed and ratification text-neutral.
create function public.sadu_guard_theme_update() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.id is distinct from old.id or new.created_at is distinct from old.created_at then
    raise exception 'Theme identity and creation time are immutable' using errcode = '42501';
  end if;
  if current_user = 'authenticated' and public.sadu_institutional_role() = 'CHAIRMAN'
    and (new.arabic_name, new.english_name, new.definition)
      is distinct from (old.arabic_name, old.english_name, old.definition) then
    raise exception 'Ratification cannot rewrite theme text' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end $$;
revoke all on function public.sadu_guard_theme_update() from public;
create trigger sadu_theme_update_guard before update on public.themes
for each row execute function public.sadu_guard_theme_update();

-- Legacy dossier policies: drop the unscoped ones if a database still has them ----
drop policy if exists "Coordinators manage dossiers" on public.artist_dossiers;
drop policy if exists "Director can execute vetoes and approvals" on public.artist_dossiers;

-- Storage document boundaries ---------------------------------------------------
drop policy "Document registry role boundaries" on public.sadu_documents;
create policy "Document registry role boundaries" on public.sadu_documents
for select to authenticated using (
  (auth.jwt()->>'institutional_role' = 'COORDINATOR' and coordinator_id = auth.uid() and bucket_id in ('artist-dossiers','contracts'))
  or (auth.jwt()->>'institutional_role' in ('PREPARATORY_COMMITTEE','BIENNIAL_DIRECTOR') and bucket_id = 'artist-dossiers')
  or (auth.jwt()->>'institutional_role' = 'ARTIST' and artist_user_id = auth.uid()
    and (kind in ('PASSPORT','VISA') or (kind = 'CONTRACT' and exists (
      select 1 from public.bilateral_contracts c where c.id = contract_id and c.artist_id = auth.uid()
        and c.status in ('SENT_TO_ARTIST','CONTRACT_DISPUTED','ARTIST_APPROVED','LOCKED')))))
  or (auth.jwt()->>'institutional_role' = 'PR_PROTOCOL' and kind in ('PASSPORT','VISA') and bucket_id = 'logistics-secure')
  or (auth.jwt()->>'institutional_role' = 'FINANCE' and (
    (kind = 'CONTRACT' and exists (select 1 from public.bilateral_contracts c where c.id = contract_id and c.artist_id = artist_user_id
      and c.status in ('ARTIST_APPROVED','LOCKED') and c.is_signed = true
      and exists (select 1 from public.sadu_clearances e where e.dossier_id = c.dossier_id
        and e.pr_cleared_at is not null and e.technical_cleared_at is not null)))
    or (kind = 'DELIVERY_RECEIPT' and exists (select 1 from public.bilateral_contracts c where c.dossier_id = sadu_documents.dossier_id and c.artist_id = artist_user_id)
      and exists (select 1 from public.sadu_clearances e where e.dossier_id = sadu_documents.dossier_id
      and e.pr_cleared_at is not null and e.technical_cleared_at is not null and e.physical_received_at is not null))
  ))
);

drop policy "SADU draft dossier uploads" on storage.objects;
create policy "SADU draft dossier uploads" on storage.objects
for insert to authenticated with check (
  bucket_id = 'artist-dossiers' and auth.jwt()->>'institutional_role' in ('PREPARATORY_COMMITTEE','COORDINATOR')
  and exists (select 1 from public.sadu_documents d join public.artist_dossiers a on a.id = d.dossier_id
    where d.bucket_id = objects.bucket_id and d.object_name = objects.name
      and a.status in ('DRAFT','INCOMPLETE_DOSSIER')
      and (auth.jwt()->>'institutional_role' <> 'COORDINATOR' or d.coordinator_id = auth.uid())));

commit;
