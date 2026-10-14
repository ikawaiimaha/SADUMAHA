-- LOCAL rehearsal implementation. Review identity provisioning before remote use.
-- institutional_role is the existing trusted TOP-LEVEL custom access-token claim,
-- never user_metadata. Role assignment/token-hook provisioning is not supplied here.
begin;

alter table public.bilateral_contracts
  add column if not exists dossier_id text references public.artist_dossiers(id),
  add column if not exists coordinator_id uuid default auth.uid();

-- Only trusted server/admin code records verified evidence and registers upload slots.
-- Client-supplied filenames/metadata cannot classify a document or grant clearance.
create table public.sadu_clearances (
  dossier_id text primary key references public.artist_dossiers(id),
  pr_cleared_at timestamptz,
  technical_cleared_at timestamptz,
  physical_received_at timestamptz
);
alter table public.sadu_clearances enable row level security;
revoke all on public.sadu_clearances from anon, authenticated;
grant select on public.sadu_clearances to authenticated;
create policy "Finance reads evidence timestamps" on public.sadu_clearances
  for select to authenticated using (auth.jwt()->>'institutional_role' = 'FINANCE');

drop policy if exists "Coordinators draft contracts" on public.bilateral_contracts;
drop policy if exists "Finance executes payments" on public.bilateral_contracts;
drop policy if exists "Artists view own contracts" on public.bilateral_contracts;
drop policy if exists "Artists sign own contracts" on public.bilateral_contracts;
drop policy if exists "PR can view approved dossiers" on public.artist_dossiers;
create policy "Committee and director read dossier scope" on public.artist_dossiers
for select to authenticated using (auth.jwt()->>'institutional_role' in ('PREPARATORY_COMMITTEE','BIENNIAL_DIRECTOR'));

create policy "Assigned coordinator reads contracts" on public.bilateral_contracts
for select to authenticated using (
  auth.jwt()->>'institutional_role' = 'COORDINATOR' and coordinator_id = auth.uid());
create policy "Assigned coordinator creates drafts" on public.bilateral_contracts
for insert to authenticated with check (
  auth.jwt()->>'institutional_role' = 'COORDINATOR' and coordinator_id = auth.uid()
  and artist_id is not null and dossier_id is not null
  and status in ('NOT_DRAFTED','DRAFT') and is_signed = false and signed_at is null);
create policy "Assigned coordinator edits drafts only" on public.bilateral_contracts
for update to authenticated using (
  auth.jwt()->>'institutional_role' = 'COORDINATOR' and coordinator_id = auth.uid()
  and status in ('NOT_DRAFTED','DRAFT') and is_signed = false
) with check (
  auth.jwt()->>'institutional_role' = 'COORDINATOR' and coordinator_id = auth.uid()
  and status in ('NOT_DRAFTED','DRAFT','SENT_TO_ARTIST') and is_signed = false and signed_at is null);
create policy "Artist reads mapped contracts" on public.bilateral_contracts
for select to authenticated using (
  auth.jwt()->>'institutional_role' = 'ARTIST' and artist_id = auth.uid()
  and status in ('SENT_TO_ARTIST','CONTRACT_DISPUTED','ARTIST_APPROVED','LOCKED'));
create policy "Artist accepts dispatched contract" on public.bilateral_contracts
for update to authenticated using (
  auth.jwt()->>'institutional_role' = 'ARTIST' and artist_id = auth.uid()
  and status = 'SENT_TO_ARTIST' and is_signed = false
) with check (
  auth.jwt()->>'institutional_role' = 'ARTIST' and artist_id = auth.uid()
  and status = 'ARTIST_APPROVED' and is_signed = true and signed_at is not null);
create policy "Finance reads accepted cleared contracts" on public.bilateral_contracts
for select to authenticated using (
  auth.jwt()->>'institutional_role' = 'FINANCE'
  and status in ('ARTIST_APPROVED','LOCKED') and is_signed = true
  and exists (select 1 from public.sadu_clearances e where e.dossier_id = bilateral_contracts.dossier_id
    and e.pr_cleared_at is not null and e.technical_cleared_at is not null));

-- RLS controls rows, not column changes. Prevent the signer from rewriting terms.
create function public.sadu_guard_contract_update() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if current_user = 'authenticated' then
    if new.artist_id is distinct from old.artist_id or new.coordinator_id is distinct from old.coordinator_id
      or new.dossier_id is distinct from old.dossier_id or new.id is distinct from old.id then
      raise exception 'Contract identities are immutable' using errcode = '42501';
    end if;
    if auth.jwt()->>'institutional_role' = 'ARTIST'
      and (to_jsonb(new) - array['is_signed','signed_at','signature_reference','status','updated_at'])
        is distinct from (to_jsonb(old) - array['is_signed','signed_at','signature_reference','status','updated_at']) then
      raise exception 'Artist may accept but cannot rewrite terms' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.sadu_guard_contract_update() from public;
create trigger sadu_contract_update_guard before update on public.bilateral_contracts
for each row execute function public.sadu_guard_contract_update();

create table public.sadu_documents (
  bucket_id text not null check (bucket_id in ('artist-dossiers','contracts','logistics-secure')),
  object_name text not null,
  artist_user_id uuid not null,
  coordinator_id uuid not null,
  dossier_id text not null references public.artist_dossiers(id),
  contract_id text references public.bilateral_contracts(id),
  kind text not null check (kind in ('CV','MOCKUP','ARTWORK_IMAGE','CONTRACT','PASSPORT','VISA','DELIVERY_RECEIPT')),
  primary key (bucket_id,object_name),
  check ((storage.foldername(object_name))[1] = artist_user_id::text),
  check ((bucket_id = 'artist-dossiers' and kind in ('CV','MOCKUP','ARTWORK_IMAGE'))
    or (bucket_id = 'contracts' and kind = 'CONTRACT' and contract_id is not null)
    or (bucket_id = 'logistics-secure' and kind in ('PASSPORT','VISA','DELIVERY_RECEIPT')))
);
alter table public.sadu_documents enable row level security;
revoke all on public.sadu_documents from anon, authenticated;
grant select on public.sadu_documents to authenticated;
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
    (kind = 'CONTRACT' and exists (select 1 from public.bilateral_contracts c where c.id = contract_id and c.artist_id = artist_user_id))
    or (kind = 'DELIVERY_RECEIPT' and exists (select 1 from public.bilateral_contracts c where c.dossier_id = sadu_documents.dossier_id and c.artist_id = artist_user_id)
      and exists (select 1 from public.sadu_clearances e where e.dossier_id = sadu_documents.dossier_id
      and e.pr_cleared_at is not null and e.technical_cleared_at is not null and e.physical_received_at is not null))
  ))
);

insert into storage.buckets (id,name,public) values
  ('artist-dossiers','artist-dossiers',false), ('contracts','contracts',false), ('logistics-secure','logistics-secure',false)
on conflict (id) do update set public = false;

-- Storage already has RLS enabled; do not change ownership of its managed schema.
create policy "SADU reads registered authorized documents" on storage.objects
for select to authenticated using (
  exists (select 1 from public.sadu_documents d where d.bucket_id = objects.bucket_id and d.object_name = objects.name));
create policy "SADU artist uploads own registered travel documents" on storage.objects
for insert to authenticated with check (
  auth.jwt()->>'institutional_role' = 'ARTIST' and bucket_id = 'logistics-secure'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (select 1 from public.sadu_documents d where d.bucket_id = objects.bucket_id and d.object_name = objects.name
    and d.artist_user_id = auth.uid() and d.kind in ('PASSPORT','VISA')));
create policy "SADU coordinator uploads draft contract" on storage.objects
for insert to authenticated with check (
  auth.jwt()->>'institutional_role' = 'COORDINATOR' and bucket_id = 'contracts'
  and exists (select 1 from public.sadu_documents d join public.bilateral_contracts c on c.id = d.contract_id
    where d.bucket_id = objects.bucket_id and d.object_name = objects.name and d.coordinator_id = auth.uid()
      and c.coordinator_id = auth.uid() and c.artist_id = d.artist_user_id and c.dossier_id = d.dossier_id
      and c.status in ('NOT_DRAFTED','DRAFT') and c.is_signed = false));
create policy "SADU draft dossier uploads" on storage.objects
for insert to authenticated with check (
  bucket_id = 'artist-dossiers' and auth.jwt()->>'institutional_role' in ('PREPARATORY_COMMITTEE','COORDINATOR')
  and exists (select 1 from public.sadu_documents d join public.artist_dossiers a on a.id = d.dossier_id
    where d.bucket_id = objects.bucket_id and d.object_name = objects.name
      and a.status in ('DRAFT','INCOMPLETE_DOSSIER')));
-- Files are append-only for authenticated users. No upsert/delete permissions are granted.
commit;
