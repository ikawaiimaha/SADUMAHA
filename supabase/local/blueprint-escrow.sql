-- Local only; requires exhibition-scenarios, catalog-freight, and asset-escrow.
begin;
alter table public.sadu_scenario_media drop constraint sadu_scenario_media_category_check;
alter table public.sadu_scenario_media add constraint sadu_scenario_media_category_check check(category in ('PRINT','AV','BLUEPRINT'));
alter table public.sadu_scenario_media drop constraint sadu_scenario_media_check;
alter table public.sadu_scenario_media add constraint sadu_scenario_media_check check((category='PRINT' and lower(file_name) ~ '\.(png|tif|tiff)$') or (category='AV' and lower(file_name) ~ '\.(mp4|mov)$') or (category='BLUEPRINT' and lower(file_name) ~ '\.pdf$'));
create or replace function public.validate_exhibition_scenario() returns trigger language plpgsql security invoker set search_path='' as $$
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
   if z ? 'requires_spatial_planning' and jsonb_typeof(z->'requires_spatial_planning') is distinct from 'boolean' then raise exception 'Spatial requirement must be boolean';end if;
   foreach cat in array array['PRINT','AV','BLUEPRINT'] loop
    if (cat='PRINT' and (z->>'printRequired')::boolean) or (cat='AV' and (z->>'avRequired')::boolean) or (cat='BLUEPRINT' and coalesce((z->>'requires_spatial_planning')::boolean,false)) then
     if not exists(select 1 from public.sadu_scenario_media m join storage.objects o on o.name=m.object_name and o.bucket_id='logistics-secure' where m.scenario_id=new.id and m.zone_id=(z->>'id')::uuid and m.category=cat and (o.metadata->>'size')::bigint between 1 and 2147483648 and ((cat='PRINT' and o.metadata->>'mimetype' in ('image/png','image/tiff')) or (cat='AV' and o.metadata->>'mimetype' in ('video/mp4','video/quicktime')) or (cat='BLUEPRINT' and o.metadata->>'mimetype'='application/pdf' and (o.metadata->>'size')::bigint<=20971520))) then raise exception 'Uploaded media missing for zone';end if;
    end if;
   end loop;
  end loop;
  new.submitted_at:=now();
 end if;
 return new;
end $$;
create or replace view public.sadu_asset_escrow with (security_invoker=true) as
select s.id as scenario_id,s.contract_id,s.status,s.submitted_at,s.artwork_checklist,
 (s.status='SUBMITTED' and s.submitted_at is not null
  and jsonb_array_length(s.artwork_checklist)>0
  and not exists (
   select 1 from jsonb_array_elements(s.artwork_checklist) z
   cross join (values ('PRINT','printRequired'),('AV','avRequired'),('BLUEPRINT','requires_spatial_planning')) required(category,flag)
   where coalesce((z->>required.flag)::boolean,false) and not exists (
    select 1 from public.sadu_scenario_media m join storage.objects o
     on o.bucket_id='logistics-secure' and o.name=m.object_name
    where m.scenario_id=s.id and m.zone_id::text=z->>'id' and m.category=required.category
     and (o.metadata->>'size')::bigint between 1 and 2147483648
     and ((m.category='PRINT' and o.metadata->>'mimetype' in ('image/png','image/tiff'))
      or (m.category='AV' and o.metadata->>'mimetype' in ('video/mp4','video/quicktime')) or (m.category='BLUEPRINT' and o.metadata->>'mimetype'='application/pdf' and (o.metadata->>'size')::bigint<=20971520))
   )
  )) as escrow_ready
from public.sadu_exhibition_scenarios s;

-- This additional prerequisite never grants a role execution authority.
create or replace function public.sadu_require_execution_escrow() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.status='CONTRACT_EXECUTED' and (TG_OP='INSERT' or old.status is distinct from new.status) then
  if not exists(select 1 from public.sadu_asset_escrow e where e.contract_id=new.id and e.escrow_ready) then raise exception 'Execution blocked: submitted private assets and required blueprints missing';end if;
 end if;
 return new;
end $$;
revoke all on function public.sadu_require_execution_escrow() from public;
create or replace trigger execution_escrow before insert or update on public.bilateral_contracts for each row execute function public.sadu_require_execution_escrow();
create or replace function public.sadu_blueprint_not_label() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from public.sadu_scenario_media where object_name=new.media_object_name and category='BLUEPRINT') then raise exception 'A blueprint cannot replace catalog artwork media';end if;
 return new;
end $$;
revoke all on function public.sadu_blueprint_not_label() from public;
create or replace trigger label_blueprint_guard before insert on public.sadu_artwork_checklist for each row execute function public.sadu_blueprint_not_label();
commit;
