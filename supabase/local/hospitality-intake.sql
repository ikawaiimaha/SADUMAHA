-- LOCAL ONLY. Apply after contract-intake.sql. Never enables hosted deployment.
-- Inspect existing storage policies first: permissive policies combine with OR.
begin;
create table public.sadu_companion_requests (
 id uuid primary key default gen_random_uuid(),
 contract_id text not null references public.bilateral_contracts(id),
 artist_id uuid not null references auth.users(id),
 companion_name text not null check(length(trim(companion_name)) between 1 and 200),
 self_funded_ack boolean not null check(self_funded_ack),
 object_name text not null unique,
 file_name text not null check(file_name ~ '^[a-zA-Z0-9._-]{1,180}$' and file_name ~* '\.pdf$'),
 created_at timestamptz not null default now(),
 check(object_name=artist_id::text||'/companion-intake/'||id::text||'/'||file_name)
);
alter table public.sadu_companion_requests enable row level security;
revoke all on public.sadu_companion_requests from anon, authenticated;
grant select, insert on public.sadu_companion_requests to authenticated;
create policy companion_read on public.sadu_companion_requests for select to authenticated using (
 artist_id=auth.uid() or coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role')='PR_PROTOCOL'
);
create policy companion_register on public.sadu_companion_requests for insert to authenticated with check (
 artist_id=auth.uid() and exists(select 1 from public.bilateral_contracts c
 where c.id=contract_id and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED'))
);
create policy companion_upload on storage.objects for insert to authenticated with check (
 bucket_id='logistics-secure' and exists(select 1 from public.sadu_companion_requests r
 join public.bilateral_contracts c on c.id=r.contract_id
 where r.object_name=name and r.artist_id=auth.uid() and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED'))
);
create policy companion_download on storage.objects for select to authenticated using (
 bucket_id='logistics-secure' and exists(select 1 from public.sadu_companion_requests r where r.object_name=name)
);
-- Restrictive guard prevents older broad policies granting access to this prefix.
create policy companion_read_boundary on storage.objects as restrictive for select to authenticated using (
 bucket_id<>'logistics-secure' or (storage.foldername(name))[2] is distinct from 'companion-intake'
 or exists(select 1 from public.sadu_companion_requests r where r.object_name=name)
);
create policy companion_write_boundary on storage.objects as restrictive for insert to authenticated with check (
 bucket_id<>'logistics-secure' or (storage.foldername(name))[2] is distinct from 'companion-intake'
 or exists(select 1 from public.sadu_companion_requests r join public.bilateral_contracts c on c.id=r.contract_id
 where r.object_name=name and r.artist_id=auth.uid() and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED'))
);
create policy companion_no_replacement on storage.objects as restrictive for update to authenticated using (
 bucket_id<>'logistics-secure' or (storage.foldername(name))[2] is distinct from 'companion-intake'
);
create policy companion_no_delete on storage.objects as restrictive for delete to authenticated using (
 bucket_id<>'logistics-secure' or (storage.foldername(name))[2] is distinct from 'companion-intake'
);
commit;
