-- Local only. Requires catalog-freight.sql. Existing sources remain immutable.
begin;
alter table public.sadu_artwork_checklist add column translation_en jsonb;
alter table public.sadu_artwork_checklist add column translation_receipts jsonb not null default '[]';
alter table public.sadu_artwork_checklist add column translation_policy jsonb generated always as ('{"title":{"requires_translation":true},"medium":{"requires_translation":true},"concept":{"requires_translation":true},"bio":{"requires_translation":true},"dimensions":{"requires_translation":false},"flight_itinerary":{"requires_translation":false}}'::jsonb) stored;
grant update(translation_en) on public.sadu_artwork_checklist to authenticated;
alter policy label_translate on public.sadu_artwork_checklist using ((translation_status='PENDING_TRANSLATION' or (source->>'language'<>'en' and translation_en is null)) and auth.jwt()->'app_metadata'->>'institutional_role'='EDITORIAL') with check(auth.jwt()->'app_metadata'->>'institutional_role'='EDITORIAL');
alter policy label_read on public.sadu_artwork_checklist using (
 exists(select 1 from public.sadu_exhibition_scenarios s where s.id=scenario_id and (s.artist_id=auth.uid() or s.coordinator_id=auth.uid()))
 or auth.jwt()->'app_metadata'->>'institutional_role' in ('EDITORIAL','PR_PROTOCOL','LOGISTICS','HIP')
);
create or replace function public.sadu_validate_label() returns trigger language plpgsql security invoker set search_path='' as $$
declare k text; s public.sadu_exhibition_scenarios; zone jsonb; target jsonb; lang text;
begin
 if TG_OP='INSERT' then
  select * into s from public.sadu_exhibition_scenarios where id=new.scenario_id for update;
  if s.artist_id is distinct from auth.uid() or s.status<>'DRAFT' then raise exception 'Owned draft scenario required';end if;
  select value into zone from jsonb_array_elements(s.artwork_checklist) where value->>'id'=new.zone_id::text;
  if zone is null or (select count(*) from public.sadu_artwork_checklist where scenario_id=new.scenario_id and zone_id=new.zone_id)>=(zone->>'artworkCount')::integer then raise exception 'Zone missing or artwork count exceeded';end if;
  if not exists(select 1 from public.sadu_scenario_media m join storage.objects o on o.name=m.object_name and o.bucket_id='logistics-secure' where m.object_name=new.media_object_name and m.scenario_id=new.scenario_id and m.zone_id=new.zone_id and (o.metadata->>'size')::bigint>0) then raise exception 'Uploaded artwork file required';end if;
  if not exists(select 1 from public.bilateral_contracts c where c.id=s.contract_id and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED')) then raise exception 'Accepted contract required';end if;
  foreach k in array array['title','medium','concept','language'] loop
   if jsonb_typeof(new.source->k) is distinct from 'string' or length(trim(new.source->>k)) not between 1 and 2000 then raise exception 'Source metadata incomplete';end if;
  end loop;
  if new.source->>'language' not in ('en','fr','ar') or cardinality(regexp_split_to_array(trim(new.source->>'concept'),'\s+'))>50 then raise exception 'Invalid language or concept exceeds 50 words';end if;
  if (new.source ? 'bio' and (jsonb_typeof(new.source->'bio')<>'string' or length(new.source->>'bio')>2000)) or (new.source ? 'title_ar' and jsonb_typeof(new.source->'title_ar')<>'string') then raise exception 'Invalid optional source text';end if;
  new.translation_status:='PENDING_TRANSLATION';new.translation_ar:=null;new.translation_en:=null;new.translation_receipts:='[]';new.translated_by:=null;new.translated_at:=null;new.created_at:=now();
 else
  if (old.translation_status<>'PENDING_TRANSLATION' and not (old.source->>'language'<>'en' and old.translation_en is null)) or new.translation_status<>'TRANSLATION_COMPLETED' or (auth.jwt()->'app_metadata'->>'institutional_role')<>'EDITORIAL' then raise exception 'Editorial approval required';end if;
  if (to_jsonb(new)-array['translation_policy','translation_ar','translation_en','translation_receipts','translation_status','translated_by','translated_at']) is distinct from (to_jsonb(old)-array['translation_policy','translation_ar','translation_en','translation_receipts','translation_status','translated_by','translated_at']) then raise exception 'Submitted source and dimensions are immutable';end if;
  if new.source->>'language'='ar' then new.translation_ar:=new.source;end if;
  if new.source->>'language'='en' then new.translation_en:=new.source;end if;
  foreach lang in array array['ar','en'] loop
   target:=case when lang='ar' then new.translation_ar else new.translation_en end;
   foreach k in array array['title','medium','concept'] loop
    if jsonb_typeof(target->k) is distinct from 'string' or length(trim(target->>k)) not between 1 and 2000 then raise exception 'Bilingual public text incomplete';end if;
   end loop;
   if length(trim(coalesce(new.source->>'bio','')))>0 and (jsonb_typeof(target->'bio') is distinct from 'string' or length(trim(target->>'bio')) not between 1 and 2000) then raise exception 'Biography translation required';end if;
   if cardinality(regexp_split_to_array(trim(target->>'concept'),'\s+'))>50 then raise exception 'Translated concept exceeds 50 words';end if;
  end loop;
  if old.translation_status='TRANSLATION_COMPLETED' and old.source->>'language'='fr' and new.translation_ar is distinct from old.translation_ar then raise exception 'Existing approved Arabic is locked';end if;
  new.translation_receipts:=old.translation_receipts||case when old.translation_status='TRANSLATION_COMPLETED' then jsonb_build_array(jsonb_build_object('actor',old.translated_by,'at',old.translated_at,'source',old.source,'ar',old.translation_ar,'en',old.translation_en,'legacy',true)) else '[]'::jsonb end||jsonb_build_array(jsonb_build_object('actor',auth.uid(),'at',clock_timestamp(),'source',old.source,'ar',new.translation_ar,'en',new.translation_en));
  new.translated_by:=auth.uid();new.translated_at:=now();
 end if;
 return new;
end $$;

commit;
