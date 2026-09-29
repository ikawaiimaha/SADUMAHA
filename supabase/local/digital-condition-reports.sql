-- LOCAL ONLY: authenticated condition evidence, no legal signature certification.
begin;
create schema if not exists sadu_private;
create function sadu_private.condition_contracts() returns table(id text,artist_id uuid,artist_name text) language sql security definer set search_path='' as $$
 select c.id,c.artist_id,c.artist_name from public.bilateral_contracts c where auth.uid() is not null and coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role')='LOGISTICS' and c.status in ('ARTIST_APPROVED','LOCKED')
$$;
revoke all on function sadu_private.condition_contracts() from public,anon;
grant usage on schema sadu_private to authenticated;
grant execute on function sadu_private.condition_contracts() to authenticated;
create function public.sadu_condition_contracts() returns table(id text,artist_id uuid,artist_name text) language sql security invoker set search_path='' as $$select * from sadu_private.condition_contracts()$$;
revoke all on function public.sadu_condition_contracts() from public,anon;
grant execute on function public.sadu_condition_contracts() to authenticated;

create table public.sadu_condition_reports (
 id uuid primary key default gen_random_uuid(), contract_id text not null references public.bilateral_contracts(id),
 artist_id uuid not null references auth.users(id), reporter_id uuid not null default auth.uid(),
 description text not null check(length(trim(description)) between 3 and 2000),
 photos jsonb not null check(jsonb_typeof(photos)='array' and jsonb_array_length(photos) between 1 and 5),
 status text not null default 'DRAFT' check(status in ('DRAFT','DAMAGED_PENDING_ARTIST_APPROVAL','REPAIR_AUTHORIZED','ARTIST_REPAIR_PLANNED')),
 decision_at timestamptz, decided_by uuid, created_at timestamptz not null default now()
);
alter table public.sadu_condition_reports enable row level security;
revoke all on public.sadu_condition_reports from anon,authenticated;
grant select,insert on public.sadu_condition_reports to authenticated;
grant update(status) on public.sadu_condition_reports to authenticated;
create policy condition_read on public.sadu_condition_reports for select to authenticated using (
 (artist_id=auth.uid() and status<>'DRAFT') or coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role') in ('LOGISTICS','TECHNICAL')
);
create policy condition_insert on public.sadu_condition_reports for insert to authenticated with check (
 coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role')='LOGISTICS' and reporter_id=auth.uid() and status='DRAFT'
 and exists(select 1 from public.sadu_condition_contracts() c where c.id=contract_id and c.artist_id=sadu_condition_reports.artist_id)
);
create policy condition_update on public.sadu_condition_reports for update to authenticated using (
 (status='DRAFT' and reporter_id=auth.uid() and coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role')='LOGISTICS')
 or (status='DAMAGED_PENDING_ARTIST_APPROVAL' and artist_id=auth.uid())
) with check (
 (reporter_id=auth.uid() and coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role')='LOGISTICS') or artist_id=auth.uid()
);
create function public.sadu_validate_condition_report() returns trigger language plpgsql security invoker set search_path='' as $$
declare p text;
begin
 if TG_OP='INSERT' then
  new.created_at:=now();new.decision_at:=null;new.decided_by:=null;
  for p in select jsonb_array_elements_text(new.photos) loop
   if p !~ ('^'||new.artist_id::text||'/condition-reports/'||new.id::text||'/[a-f0-9-]+\.(jpg|png)$') then raise exception 'Invalid evidence path';end if;
  end loop;
 elsif old.status='DRAFT' and new.status='DAMAGED_PENDING_ARTIST_APPROVAL' then
  if old.reporter_id<>auth.uid() or coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role') is distinct from 'LOGISTICS' then raise exception 'Registrar required';end if;
  for p in select jsonb_array_elements_text(old.photos) loop
   if not exists(select 1 from storage.objects where bucket_id='logistics-secure' and name=p and (metadata->>'size')::bigint between 1 and 10485760 and metadata->>'mimetype' in ('image/png','image/jpeg')) then raise exception 'Upload evidence before routing';end if;
  end loop;
 elsif old.status='DAMAGED_PENDING_ARTIST_APPROVAL' and new.status in ('REPAIR_AUTHORIZED','ARTIST_REPAIR_PLANNED') then
  if old.artist_id<>auth.uid() then raise exception 'Owning artist required';end if;
  new.decision_at:=now();new.decided_by:=auth.uid();
 else raise exception 'Condition report transition forbidden';
 end if;
 return new;
end $$;
revoke all on function public.sadu_validate_condition_report() from public;
create trigger validate_condition_report before insert or update on public.sadu_condition_reports for each row execute function public.sadu_validate_condition_report();
create policy condition_photo_upload on storage.objects for insert to authenticated with check (
 bucket_id='logistics-secure' and exists(select 1 from public.sadu_condition_reports r where r.reporter_id=auth.uid() and r.status='DRAFT' and r.photos ? name)
);
create policy condition_photo_read on storage.objects for select to authenticated using (
 bucket_id='logistics-secure' and exists(select 1 from public.sadu_condition_reports r where r.photos ? name)
);
create policy condition_photo_read_boundary on storage.objects as restrictive for select to authenticated using (
 bucket_id<>'logistics-secure' or (storage.foldername(name))[2] is distinct from 'condition-reports' or exists(select 1 from public.sadu_condition_reports r where r.photos ? name)
);
create policy condition_photo_write_boundary on storage.objects as restrictive for insert to authenticated with check (
 bucket_id<>'logistics-secure' or (storage.foldername(name))[2] is distinct from 'condition-reports' or
 (coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role')='LOGISTICS' and exists(select 1 from public.sadu_condition_reports r where r.reporter_id=auth.uid() and r.status='DRAFT' and r.photos ? name))
);
create policy condition_photo_no_update on storage.objects as restrictive for update to authenticated using (bucket_id<>'logistics-secure' or (storage.foldername(name))[2] is distinct from 'condition-reports');
create policy condition_photo_no_delete on storage.objects as restrictive for delete to authenticated using (bucket_id<>'logistics-secure' or (storage.foldername(name))[2] is distinct from 'condition-reports');
alter publication supabase_realtime add table public.sadu_condition_reports;
commit;
