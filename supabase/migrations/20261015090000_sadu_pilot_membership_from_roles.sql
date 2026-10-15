-- One source of roles: spatial-pilot membership follows sadu_user_roles.
-- Previously sadu_pilot_members was a second, hand-maintained role list: staff had to be
-- enrolled twice, and removing an institutional role left room-booking access in place.
-- Now a trigger keeps membership in step with sadu_user_roles. Members whose dossiers,
-- claims or requests still reference them are deactivated instead of deleted, and every
-- pilot policy admits active members only.
begin;

alter table public.sadu_pilot_members add column active boolean not null default true;

-- The caller's active pilot role, or null. SECURITY DEFINER so policies need no RLS on members.
create function public.sadu_pilot_role() returns text
language sql stable security definer set search_path to '' as $$
  select m.role from public.sadu_pilot_members m where m.user_id = (select auth.uid()) and m.active
$$;
revoke all on function public.sadu_pilot_role() from public, anon;
grant execute on function public.sadu_pilot_role() to authenticated;

create function public.sadu_sync_pilot_membership() returns trigger
language plpgsql security definer set search_path to '' as $$
declare
  target uuid;
  next_role text;
begin
  if TG_OP = 'UPDATE' and old.user_id is distinct from new.user_id then
    update public.sadu_pilot_members set active = false where user_id = old.user_id;
  end if;
  if TG_OP = 'DELETE' then target := old.user_id; next_role := null;
  else target := new.user_id; next_role := new.institutional_role; end if;

  if next_role in ('COORDINATOR', 'BIENNIAL_DIRECTOR', 'GENERAL_COORDINATOR', 'TECHNICAL') then
    insert into public.sadu_pilot_members (user_id, role, active) values (target, next_role, true)
    on conflict (user_id) do update set role = excluded.role, active = true;
  else
    -- Keep rows that records reference (foreign keys); they lose access through active = false.
    delete from public.sadu_pilot_members m where m.user_id = target
      and not exists (select 1 from public.sadu_pilot_dossiers d where d.coordinator_id = target)
      and not exists (select 1 from public.sadu_pilot_claims c where c.claimed_by = target)
      and not exists (select 1 from public.sadu_pilot_requests r where r.requested_by = target);
    update public.sadu_pilot_members set active = false where user_id = target;
  end if;
  return null;
end $$;
revoke all on function public.sadu_sync_pilot_membership() from public, anon, authenticated;

create trigger sadu_sync_pilot_membership
after insert or update or delete on public.sadu_user_roles
for each row execute function public.sadu_sync_pilot_membership();

-- Backfill: enrol everyone whose institutional role is a pilot role, and deactivate
-- hand-enrolled members without one.
insert into public.sadu_pilot_members (user_id, role, active)
select r.user_id, r.institutional_role, true from public.sadu_user_roles r
where r.institutional_role in ('COORDINATOR', 'BIENNIAL_DIRECTOR', 'GENERAL_COORDINATOR', 'TECHNICAL')
on conflict (user_id) do update set role = excluded.role, active = true;
update public.sadu_pilot_members m set active = false
where not exists (select 1 from public.sadu_user_roles r where r.user_id = m.user_id
  and r.institutional_role in ('COORDINATOR', 'BIENNIAL_DIRECTOR', 'GENERAL_COORDINATOR', 'TECHNICAL'));

-- Policies: same rules as before, but only active members count.
drop policy self_membership on public.sadu_pilot_members;
create policy self_membership on public.sadu_pilot_members for select to authenticated
using (user_id = (select auth.uid()) and active);

drop policy spaces_read on public.sadu_pilot_spaces;
create policy spaces_read on public.sadu_pilot_spaces for select to authenticated
using ((select public.sadu_pilot_role()) is not null);

drop policy claims_read on public.sadu_pilot_claims;
create policy claims_read on public.sadu_pilot_claims for select to authenticated
using ((select public.sadu_pilot_role()) is not null);

drop policy dossier_read on public.sadu_pilot_dossiers;
create policy dossier_read on public.sadu_pilot_dossiers for select to authenticated
using ((select public.sadu_pilot_role()) in ('GENERAL_COORDINATOR', 'TECHNICAL', 'BIENNIAL_DIRECTOR')
  or ((select public.sadu_pilot_role()) is not null and coordinator_id = (select auth.uid())));

drop policy dossier_create on public.sadu_pilot_dossiers;
create policy dossier_create on public.sadu_pilot_dossiers for insert to authenticated
with check (coordinator_id = (select auth.uid()) and status = 'DRAFT'
  and (select public.sadu_pilot_role()) = 'COORDINATOR');

drop policy director_review on public.sadu_pilot_dossiers;
create policy director_review on public.sadu_pilot_dossiers for update to authenticated
using (status = 'DRAFT' and (select public.sadu_pilot_role()) = 'BIENNIAL_DIRECTOR')
with check (status = 'APPROVED' and (select public.sadu_pilot_role()) = 'BIENNIAL_DIRECTOR');

drop policy claim_owned_approved on public.sadu_pilot_claims;
create policy claim_owned_approved on public.sadu_pilot_claims for insert to authenticated
with check (claimed_by = (select auth.uid()) and (select public.sadu_pilot_role()) = 'COORDINATOR'
  and exists (select 1 from public.sadu_pilot_dossiers d where d.id = sadu_pilot_claims.dossier_id
    and d.coordinator_id = (select auth.uid()) and d.status = 'APPROVED'));

drop policy request_authorized on public.sadu_pilot_requests;
create policy request_authorized on public.sadu_pilot_requests for insert to authenticated
with check (requested_by = (select auth.uid()) and ((select public.sadu_pilot_role()) = 'TECHNICAL'
  or ((select public.sadu_pilot_role()) = 'COORDINATOR' and exists (select 1 from public.sadu_pilot_claims c
    where c.id = sadu_pilot_requests.claim_id and c.claimed_by = (select auth.uid())))));

drop policy requests_read on public.sadu_pilot_requests;
create policy requests_read on public.sadu_pilot_requests for select to authenticated
using ((select public.sadu_pilot_role()) in ('GENERAL_COORDINATOR', 'TECHNICAL', 'BIENNIAL_DIRECTOR')
  or ((select public.sadu_pilot_role()) is not null and exists (select 1 from public.sadu_pilot_claims c
    where c.id = sadu_pilot_requests.claim_id and c.claimed_by = (select auth.uid()))));

commit;
