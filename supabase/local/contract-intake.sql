-- Local-only rollout. Uses authenticated contract ownership, never the rehearsal role selector.
begin;
create table public.sadu_contract_intake (
 id uuid primary key default gen_random_uuid(),
 contract_id text not null references public.bilateral_contracts(id),
 artist_id uuid not null references auth.users(id),
 kind text not null check(kind in ('PASSPORT','ARTWORK_IMAGE')),
 object_name text not null unique,
 file_name text not null check(length(file_name) between 1 and 255),
 created_at timestamptz not null default now(),
 check(object_name=artist_id::text||'/contract-intake/'||id::text||'/'||file_name),
 check((kind='PASSPORT' and file_name ~* '\.pdf$') or (kind='ARTWORK_IMAGE' and file_name ~* '\.(png|tif|tiff)$'))
);
alter table public.sadu_contract_intake enable row level security;
revoke all on public.sadu_contract_intake from anon,authenticated;
grant select,insert on public.sadu_contract_intake to authenticated;
create policy intake_read on public.sadu_contract_intake for select to authenticated using (
 artist_id=auth.uid() or
 (kind='PASSPORT' and coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role')='PR_PROTOCOL') or
 (kind='ARTWORK_IMAGE' and coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role') in ('TECHNICAL','EDITORIAL'))
);
create policy intake_register on public.sadu_contract_intake for insert to authenticated with check (
 artist_id=auth.uid() and exists(select 1 from public.bilateral_contracts c where c.id=contract_id and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED'))
);
create policy intake_upload on storage.objects for insert to authenticated with check (
 bucket_id='logistics-secure' and exists(select 1 from public.sadu_contract_intake d join public.bilateral_contracts c on c.id=d.contract_id
 where d.object_name=name and d.artist_id=auth.uid() and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED'))
);
create policy intake_download on storage.objects for select to authenticated using (
 bucket_id='logistics-secure' and exists(select 1 from public.sadu_contract_intake d where d.object_name=name)
);
commit;
