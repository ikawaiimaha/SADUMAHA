begin;
update storage.buckets set file_size_limit=2147483648 where id='logistics-secure';
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
   foreach cat in array array['PRINT','AV'] loop
    if (cat='PRINT' and (z->>'printRequired')::boolean) or (cat='AV' and (z->>'avRequired')::boolean) then
     if not exists(select 1 from public.sadu_scenario_media m join storage.objects o on o.name=m.object_name and o.bucket_id='logistics-secure' where m.scenario_id=new.id and m.zone_id=(z->>'id')::uuid and m.category=cat and (o.metadata->>'size')::bigint between 1 and 2147483648 and ((cat='PRINT' and o.metadata->>'mimetype' in ('image/png','image/tiff')) or (cat='AV' and o.metadata->>'mimetype' in ('video/mp4','video/quicktime')))) then raise exception 'Uploaded media missing for zone';end if;
    end if;
   end loop;
  end loop;
  new.submitted_at:=now();
 end if;
 return new;
end $$;
commit;
