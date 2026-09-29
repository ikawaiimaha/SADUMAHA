-- LOCAL ONLY: reviewed guest intake. No hosted deployment or external email.
begin;
create table public.sadu_guest_intakes (
 id uuid primary key default gen_random_uuid(),
 contract_id text not null references public.bilateral_contracts(id),
 artist_id uuid not null references auth.users(id),
 artist_name text not null default '',
 contract_status text not null default '',
 arrival date not null, departure date not null check(departure>=arrival),
 airport text not null check(airport in ('DXB','SHJ','OTHER')),
 companion_name text check(companion_name is null or length(trim(companion_name)) between 1 and 200),
 companion_ack boolean not null default false,
 photo_extension text not null check(photo_extension in ('jpg','png')),
 created_at timestamptz not null default now(),
 check(companion_name is null or companion_ack)
);
create index on public.sadu_guest_intakes(contract_id,created_at desc);
alter table public.sadu_guest_intakes enable row level security;
revoke all on public.sadu_guest_intakes from anon,authenticated;
grant select,insert on public.sadu_guest_intakes to authenticated;
create policy guest_read on public.sadu_guest_intakes for select to authenticated using (
 artist_id=auth.uid() or auth.jwt()->'app_metadata'->>'institutional_role'='PR_PROTOCOL'
);
create policy guest_insert on public.sadu_guest_intakes for insert to authenticated with check (
 artist_id=auth.uid() and exists(select 1 from public.bilateral_contracts c where c.id=contract_id and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED'))
);
create policy guest_owner_contract_read on public.bilateral_contracts for select to authenticated using (artist_id=auth.uid() and status in ('ARTIST_APPROVED','LOCKED'));
create function public.sadu_guest_snapshot() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 select c.artist_name,c.status into new.artist_name,new.contract_status from public.bilateral_contracts c
 where c.id=new.contract_id and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED');
 if new.artist_name is null then raise exception 'Owned accepted agreement required';end if;
 new.created_at=clock_timestamp();
 return new;
end $$;
revoke all on function public.sadu_guest_snapshot() from public,anon;
grant execute on function public.sadu_guest_snapshot() to authenticated;
create trigger guest_snapshot before insert on public.sadu_guest_intakes for each row execute function public.sadu_guest_snapshot();
-- Strictly mapped filenames; no public links, replacement or arbitrary folders.
create policy guest_upload on storage.objects for insert to authenticated with check (
 bucket_id='logistics-secure' and exists(select 1 from public.sadu_guest_intakes r join public.bilateral_contracts c on c.id=r.contract_id
 where r.artist_id=auth.uid() and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED')
 and name in (r.artist_id::text||'/guest-intake/'||r.id::text||'/passport.pdf',r.artist_id::text||'/guest-intake/'||r.id::text||'/photo.'||r.photo_extension,
 case when r.companion_name is not null then r.artist_id::text||'/guest-intake/'||r.id::text||'/companion.pdf' end))
);
create policy guest_download on storage.objects for select to authenticated using (
 bucket_id='logistics-secure' and exists(select 1 from public.sadu_guest_intakes r where name in (
 r.artist_id::text||'/guest-intake/'||r.id::text||'/passport.pdf',r.artist_id::text||'/guest-intake/'||r.id::text||'/photo.'||r.photo_extension,
 case when r.companion_name is not null then r.artist_id::text||'/guest-intake/'||r.id::text||'/companion.pdf' end))
);
-- Restrictive guards prevent legacy permissive policies exposing this namespace.
create policy guest_read_boundary on storage.objects as restrictive for select to authenticated using (
 bucket_id<>'logistics-secure' or (storage.foldername(name))[2] is distinct from 'guest-intake' or exists(select 1 from public.sadu_guest_intakes r where name in (
 r.artist_id::text||'/guest-intake/'||r.id::text||'/passport.pdf',r.artist_id::text||'/guest-intake/'||r.id::text||'/photo.'||r.photo_extension,
 case when r.companion_name is not null then r.artist_id::text||'/guest-intake/'||r.id::text||'/companion.pdf' end))
);
create policy guest_insert_boundary on storage.objects as restrictive for insert to authenticated with check (
 bucket_id<>'logistics-secure' or (storage.foldername(name))[2] is distinct from 'guest-intake' or exists(select 1 from public.sadu_guest_intakes r join public.bilateral_contracts c on c.id=r.contract_id
 where r.artist_id=auth.uid() and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED') and name in (
 r.artist_id::text||'/guest-intake/'||r.id::text||'/passport.pdf',r.artist_id::text||'/guest-intake/'||r.id::text||'/photo.'||r.photo_extension,
 case when r.companion_name is not null then r.artist_id::text||'/guest-intake/'||r.id::text||'/companion.pdf' end))
);
create policy guest_no_update on storage.objects as restrictive for update to public using (bucket_id<>'logistics-secure' or (storage.foldername(name))[2] is distinct from 'guest-intake');
create policy guest_no_delete on storage.objects as restrictive for delete to public using (bucket_id<>'logistics-secure' or (storage.foldername(name))[2] is distinct from 'guest-intake');
create policy guest_anon_boundary on storage.objects as restrictive for select to anon using (bucket_id<>'logistics-secure' or (storage.foldername(name))[2] is distinct from 'guest-intake');
-- No anonymous table grants; authenticated-only boundary evaluation.
-- Readiness means stored files, not document quality, visa eligibility or PR approval.
create view public.sadu_guest_queue with (security_invoker=true) as
 select r.*,
 exists(select 1 from storage.objects o where o.bucket_id='logistics-secure' and o.name=r.artist_id::text||'/guest-intake/'||r.id::text||'/passport.pdf' and (o.metadata->>'size')::bigint between 1 and 10485760 and o.metadata->>'mimetype'='application/pdf') as passport_uploaded,
 exists(select 1 from storage.objects o where o.bucket_id='logistics-secure' and o.name=r.artist_id::text||'/guest-intake/'||r.id::text||'/photo.'||r.photo_extension and (o.metadata->>'size')::bigint between 1 and 10485760 and o.metadata->>'mimetype' in ('image/jpeg','image/png')) as photo_uploaded,
 exists(select 1 from storage.objects o where o.bucket_id='logistics-secure' and o.name=r.artist_id::text||'/guest-intake/'||r.id::text||'/companion.pdf' and (o.metadata->>'size')::bigint between 1 and 10485760 and o.metadata->>'mimetype'='application/pdf') as companion_uploaded
 from public.sadu_guest_intakes r;
revoke all on public.sadu_guest_queue from anon,authenticated;
grant select on public.sadu_guest_queue to authenticated;
-- Minimal PR roster includes guests who have not submitted files; no financial terms.
create schema if not exists sadu_private;
revoke all on schema sadu_private from public,anon;
grant usage on schema sadu_private to authenticated;
create function sadu_private.pr_guest_roster() returns table(id text,artist_name text)
language sql stable security definer set search_path='' as $$
 select c.id,c.artist_name from public.bilateral_contracts c
 where auth.uid() is not null and auth.jwt()->'app_metadata'->>'institutional_role'='PR_PROTOCOL'
 and c.status in ('ARTIST_APPROVED','LOCKED');
$$;
revoke all on function sadu_private.pr_guest_roster() from public,anon;
grant execute on function sadu_private.pr_guest_roster() to authenticated;
create function public.sadu_pr_guest_roster() returns table(id text,artist_name text)
language sql stable security invoker set search_path='' as $$select * from sadu_private.pr_guest_roster();$$;
revoke all on function public.sadu_pr_guest_roster() from public,anon;
grant execute on function public.sadu_pr_guest_roster() to authenticated;
commit;
