-- Local-reviewed additive schema. Apply only after contract identity mapping is configured.
begin;
alter table public.bilateral_contracts add column if not exists coordinator_id uuid;
create table public.sadu_exhibition_scenarios (
 id uuid primary key default gen_random_uuid(), contract_id text not null unique references public.bilateral_contracts(id),
 artist_id uuid not null references auth.users(id), coordinator_id uuid references auth.users(id),
 artwork_checklist jsonb not null default '[]', status text not null default 'DRAFT' check(status in ('DRAFT','SUBMITTED')),
 submitted_at timestamptz, created_at timestamptz not null default now()
);
alter table public.sadu_exhibition_scenarios enable row level security;
create policy scenario_read on public.sadu_exhibition_scenarios for select to authenticated using (
 artist_id=auth.uid() or coordinator_id=auth.uid() or coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role')='LOGISTICS');
create policy scenario_insert on public.sadu_exhibition_scenarios for insert to authenticated with check (
 artist_id=auth.uid() and status='DRAFT' and exists(select 1 from public.bilateral_contracts c where c.id=contract_id and c.artist_id=auth.uid() and c.coordinator_id is not distinct from sadu_exhibition_scenarios.coordinator_id and c.status in ('ARTIST_APPROVED','LOCKED')));
create policy scenario_update on public.sadu_exhibition_scenarios for update to authenticated using (artist_id=auth.uid() and status='DRAFT') with check(artist_id=auth.uid());
grant select,insert on public.sadu_exhibition_scenarios to authenticated;
grant update(artwork_checklist,status) on public.sadu_exhibition_scenarios to authenticated;
create table public.sadu_scenario_media (
 object_name text primary key, scenario_id uuid not null references public.sadu_exhibition_scenarios(id), zone_id uuid not null,
 category text not null check(category in ('PRINT','AV')), file_name text not null,
 check((category='PRINT' and lower(file_name) ~ '\.(png|tif|tiff)$') or (category='AV' and lower(file_name) ~ '\.(mp4|mov)$')),
 check(length(file_name) between 1 and 255)
);
alter table public.sadu_scenario_media enable row level security;
create policy media_read on public.sadu_scenario_media for select to authenticated using (exists(select 1 from public.sadu_exhibition_scenarios s where s.id=scenario_id));
create policy media_insert on public.sadu_scenario_media for insert to authenticated with check(exists(select 1 from public.sadu_exhibition_scenarios s where s.id=scenario_id and s.artist_id=auth.uid() and s.status='DRAFT') and object_name=auth.uid()::text||'/scenarios/'||scenario_id::text||'/'||zone_id::text||'/'||category||'/'||file_name);
grant select,insert on public.sadu_scenario_media to authenticated;
insert into storage.buckets(id,name,public) values('logistics-secure','logistics-secure',false) on conflict(id) do nothing;
create policy scenario_upload on storage.objects for insert to authenticated with check(bucket_id='logistics-secure' and exists(select 1 from public.sadu_scenario_media m join public.sadu_exhibition_scenarios s on s.id=m.scenario_id where m.object_name=name and s.artist_id=auth.uid() and s.status='DRAFT'));
create policy scenario_download on storage.objects for select to authenticated using(bucket_id='logistics-secure' and exists(select 1 from public.sadu_scenario_media m where m.object_name=name));
create function public.validate_exhibition_scenario() returns trigger language plpgsql security invoker set search_path='' as $$
declare z jsonb; cat text; n integer; seen text[]:=array[]::text[];
begin
 if TG_OP='UPDATE' and (old.status='SUBMITTED' or new.id<>old.id or new.contract_id<>old.contract_id or new.artist_id<>old.artist_id or new.coordinator_id is distinct from old.coordinator_id) then raise exception 'Scenario is immutable'; end if;
 if not exists(select 1 from public.bilateral_contracts c where c.id=new.contract_id and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED')) then raise exception 'Accepted owned contract required';end if;
 if jsonb_typeof(new.artwork_checklist)<>'array' or jsonb_array_length(new.artwork_checklist)>30 then raise exception 'Invalid checklist';end if;
 if new.status='SUBMITTED' then
  if jsonb_array_length(new.artwork_checklist)=0 then raise exception 'Zones required';end if;
  for z in select value from jsonb_array_elements(new.artwork_checklist) loop
   if coalesce(z->>'id','')='' or (z->>'id')=any(seen) then raise exception 'Unique zone ID required';end if;
   perform (z->>'id')::uuid; seen:=array_append(seen,z->>'id');
   n:=(z->>'artworkCount')::integer;
   if n is null or n<1 or n>100 or length(trim(coalesce(z->>'name',''))) not between 1 and 150 or length(trim(coalesce(z->>'medium',''))) not between 1 and 250 or length(trim(coalesce(z->>'displaySpecifications',''))) not between 1 and 4000 or jsonb_typeof(z->'avRequired') is distinct from 'boolean' or jsonb_typeof(z->'darkRoom') is distinct from 'boolean' or jsonb_typeof(z->'printRequired') is distinct from 'boolean' or not ((z->>'avRequired')::boolean or (z->>'printRequired')::boolean) then raise exception 'Complete zone fields and declare media';end if;
   foreach cat in array array['PRINT','AV'] loop
    if (cat='PRINT' and (z->>'printRequired')::boolean) or (cat='AV' and (z->>'avRequired')::boolean) then
     if not exists(select 1 from public.sadu_scenario_media m join storage.objects o on o.name=m.object_name and o.bucket_id='logistics-secure' where m.scenario_id=new.id and m.zone_id=(z->>'id')::uuid and m.category=cat and (o.metadata->>'size')::bigint between 1 and 52428800 and ((cat='PRINT' and o.metadata->>'mimetype' in ('image/png','image/tiff')) or (cat='AV' and o.metadata->>'mimetype' in ('video/mp4','video/quicktime')))) then raise exception 'Uploaded media missing for zone';end if;
    end if;
   end loop;
  end loop;
  new.submitted_at:=now();
 end if;
 return new;
end $$;
revoke all on function public.validate_exhibition_scenario() from public;
create trigger scenario_validation before insert or update on public.sadu_exhibition_scenarios for each row execute function public.validate_exhibition_scenario();
commit;
