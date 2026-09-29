-- Local-only additive extension. Requires exhibition-scenarios.sql.
begin;
create table public.sadu_artwork_checklist (
 id uuid primary key default gen_random_uuid(),
 scenario_id uuid not null references public.sadu_exhibition_scenarios(id),
 zone_id uuid not null,
 media_object_name text not null unique references public.sadu_scenario_media(object_name),
 source jsonb not null,
 translation_ar jsonb,
 production_year integer not null check(production_year between 1 and 2100),
 height_cm numeric not null check(height_cm>0 and height_cm<100000),
 width_cm numeric not null check(width_cm>0 and width_cm<100000),
 weight_kg numeric not null check(weight_kg>0 and weight_kg<100000),
 crate_count integer not null check(crate_count between 1 and 100),
 translation_status text not null default 'PENDING_TRANSLATION' check(translation_status in ('PENDING_TRANSLATION','TRANSLATION_COMPLETED')),
 translated_by uuid, translated_at timestamptz,
 created_at timestamptz not null default now()
);
create index on public.sadu_artwork_checklist(scenario_id);
alter table public.sadu_artwork_checklist enable row level security;
create policy label_read on public.sadu_artwork_checklist for select to authenticated using (
 exists(select 1 from public.sadu_exhibition_scenarios s where s.id=scenario_id and (s.artist_id=auth.uid() or s.coordinator_id=auth.uid()))
 or coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role') in ('EDITORIAL','PR_PROTOCOL','LOGISTICS','HIP')
);
create policy label_insert on public.sadu_artwork_checklist for insert to authenticated with check (
 exists(select 1 from public.sadu_exhibition_scenarios s where s.id=scenario_id and s.artist_id=auth.uid() and s.status='DRAFT')
);
create policy label_translate on public.sadu_artwork_checklist for update to authenticated using (
 translation_status='PENDING_TRANSLATION' and coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role')='EDITORIAL'
) with check(coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role')='EDITORIAL');
revoke all on public.sadu_artwork_checklist from anon,authenticated;
grant select,insert on public.sadu_artwork_checklist to authenticated;
grant update(translation_ar,translation_status) on public.sadu_artwork_checklist to authenticated;
create function public.sadu_validate_label() returns trigger language plpgsql security invoker set search_path='' as $$
declare k text; s public.sadu_exhibition_scenarios; zone jsonb;
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
  new.translation_status:='PENDING_TRANSLATION';new.translation_ar:=null;new.translated_by:=null;new.translated_at:=null;new.created_at:=now();
 else
  if old.translation_status<>'PENDING_TRANSLATION' or new.translation_status<>'TRANSLATION_COMPLETED' or coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role')<>'EDITORIAL' then raise exception 'Editorial approval required';end if;
  if (to_jsonb(new)-array['translation_ar','translation_status','translated_by','translated_at']) is distinct from (to_jsonb(old)-array['translation_ar','translation_status','translated_by','translated_at']) then raise exception 'Submitted source and dimensions are immutable';end if;
  foreach k in array array['title','medium','concept'] loop
   if jsonb_typeof(new.translation_ar->k) is distinct from 'string' or length(trim(new.translation_ar->>k)) not between 1 and 2000 then raise exception 'Arabic translation incomplete';end if;
  end loop;
  if length(trim(coalesce(new.source->>'bio','')))>0 and length(trim(coalesce(new.translation_ar->>'bio','')))=0 then raise exception 'Biography translation required';end if;
  if new.translation_ar ? 'bio' and (jsonb_typeof(new.translation_ar->'bio')<>'string' or length(new.translation_ar->>'bio')>2000) then raise exception 'Invalid biography translation';end if;
  if cardinality(regexp_split_to_array(trim(new.translation_ar->>'concept'),'\s+'))>50 then raise exception 'Arabic concept exceeds 50 words';end if;
  new.translated_by:=auth.uid();new.translated_at:=now();
 end if;
 return new;
end $$;
revoke all on function public.sadu_validate_label() from public;
create trigger label_validate before insert or update on public.sadu_artwork_checklist for each row execute function public.sadu_validate_label();
-- Protect the final-deliverables button at the database layer too.
create function public.sadu_require_labels() returns trigger language plpgsql security invoker set search_path='' as $$
declare z jsonb;
begin
 if exists(select 1 from public.sadu_artwork_checklist a where a.scenario_id=new.id and not exists(select 1 from jsonb_array_elements(new.artwork_checklist) as entry(value) where entry.value->>'id'=a.zone_id::text)) then raise exception 'Cannot remove a zone with locked artwork metadata';end if;
 if new.status='SUBMITTED' and old.status='DRAFT' then
  for z in select value from jsonb_array_elements(new.artwork_checklist) loop
   if (select count(*) from public.sadu_artwork_checklist where scenario_id=new.id and zone_id=(z->>'id')::uuid)<>(z->>'artworkCount')::integer then raise exception 'Every artwork requires catalog and rational metadata';end if;
  end loop;
 end if;
 return new;
end $$;
revoke all on function public.sadu_require_labels() from public;
create trigger scenario_labels before update on public.sadu_exhibition_scenarios for each row execute function public.sadu_require_labels();

create table public.sadu_freight_bookings (
 id uuid primary key default gen_random_uuid(),
 artwork_id uuid not null unique references public.sadu_artwork_checklist(id),
 artist_id uuid not null references auth.users(id),
 ready_date date not null,
 unavailable_start date,unavailable_end date,
 address jsonb not null,
 map_url text not null check(map_url ~ '^https://(maps\.google\.com|www\.google\.com|maps\.app\.goo\.gl|goo\.gl|www\.makani\.ae|makani\.ae)/'),
 status text not null default 'PENDING_ORIGIN_DISPATCH' check(status in ('PENDING_ORIGIN_DISPATCH','IN_TRANSIT','CUSTOMS_CLEARANCE','RECEIVED_CONDITION_CHECKED')),
 requested_date date,change_reason text,change_status text check(change_status in ('PENDING','APPROVED','REJECTED')),
 condition_reference text,
 history jsonb not null default '[]',updated_at timestamptz not null default now(),
 check((unavailable_start is null and unavailable_end is null) or (unavailable_start is not null and unavailable_end is not null and unavailable_end>=unavailable_start)),
 check(unavailable_start is null or ready_date not between unavailable_start and unavailable_end)
);
create index on public.sadu_freight_bookings(artist_id);
alter table public.sadu_freight_bookings enable row level security;
create policy freight_read on public.sadu_freight_bookings for select to authenticated using (artist_id=auth.uid() or coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role')='LOGISTICS');
create policy freight_insert on public.sadu_freight_bookings for insert to authenticated with check (artist_id=auth.uid() and exists(select 1 from public.sadu_artwork_checklist a join public.sadu_exhibition_scenarios s on s.id=a.scenario_id where a.id=artwork_id and s.artist_id=auth.uid()));
create policy freight_update on public.sadu_freight_bookings for update to authenticated using (artist_id=auth.uid() or coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role')='LOGISTICS') with check (artist_id=auth.uid() or coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role')='LOGISTICS');
revoke all on public.sadu_freight_bookings from anon,authenticated;
grant select,insert on public.sadu_freight_bookings to authenticated;
grant update(ready_date,requested_date,change_reason,change_status,status,condition_reference) on public.sadu_freight_bookings to authenticated;
create function public.sadu_guard_booking() returns trigger language plpgsql security invoker set search_path='' as $$
declare k text; role_name text:=coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role'); event_name text;
begin
 if TG_OP='INSERT' then
  if new.artist_id is distinct from auth.uid() or new.ready_date<current_date then raise exception 'Owned current pickup date required';end if;
  if not exists(select 1 from public.sadu_artwork_checklist a join public.sadu_exhibition_scenarios s on s.id=a.scenario_id join public.bilateral_contracts c on c.id=s.contract_id where a.id=new.artwork_id and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED')) then raise exception 'Accepted owned agreement required for freight';end if;
  foreach k in array array['country','city','district','street','building'] loop
   if jsonb_typeof(new.address->k) is distinct from 'string' or length(trim(new.address->>k)) not between 1 and 250 then raise exception 'Complete structured address required';end if;
  end loop;
  new.status:='PENDING_ORIGIN_DISPATCH';new.requested_date:=null;new.change_reason:=null;new.change_status:=null;new.condition_reference:=null;new.history:='[]';event_name:='BOOKED';
 else
  if (to_jsonb(new)-array['ready_date','requested_date','change_reason','change_status','status','condition_reference','history','updated_at']) is distinct from (to_jsonb(old)-array['ready_date','requested_date','change_reason','change_status','status','condition_reference','history','updated_at']) then raise exception 'Booking identity and address are locked';end if;
  if old.status='RECEIVED_CONDITION_CHECKED' then raise exception 'Received shipment is locked';end if;
  if role_name='LOGISTICS' then
   if new.requested_date is distinct from old.requested_date or new.change_reason is distinct from old.change_reason then raise exception 'Artist owns change request';end if;
   if new.change_status is distinct from old.change_status then
    if old.change_status is distinct from 'PENDING' or new.change_status not in ('APPROVED','REJECTED') or new.status<>old.status or old.status<>'PENDING_ORIGIN_DISPATCH' then raise exception 'Pending date-change decision required';end if;
    new.ready_date:=case when new.change_status='APPROVED' then old.requested_date else old.ready_date end;event_name:='DATE_CHANGE_'||new.change_status;
   else
    if new.ready_date<>old.ready_date or new.status=old.status or old.change_status='PENDING' then raise exception 'No direct date edits or dispatch with pending change';end if;
    if not ((old.status='PENDING_ORIGIN_DISPATCH' and new.status='IN_TRANSIT') or (old.status='IN_TRANSIT' and new.status in ('CUSTOMS_CLEARANCE','RECEIVED_CONDITION_CHECKED')) or (old.status='CUSTOMS_CLEARANCE' and new.status='RECEIVED_CONDITION_CHECKED')) then raise exception 'Invalid shipment transition';end if;
    if new.status='RECEIVED_CONDITION_CHECKED' and length(trim(coalesce(new.condition_reference,'')))<3 then raise exception 'Condition inspection reference required';end if;
    event_name:=new.status;
   end if;
  else
   if new.artist_id is distinct from auth.uid() or old.status<>'PENDING_ORIGIN_DISPATCH' or old.change_status='PENDING' or new.status<>old.status or new.ready_date<>old.ready_date or new.condition_reference is distinct from old.condition_reference or new.change_status is distinct from 'PENDING' or new.requested_date is null or new.requested_date<current_date or new.requested_date=old.ready_date or length(trim(coalesce(new.change_reason,'')))<3 then raise exception 'Valid artist date-change request required';end if;
   event_name:='DATE_CHANGE_REQUESTED';
  end if;
  new.history:=old.history;
 end if;
 if new.requested_date between new.unavailable_start and new.unavailable_end then raise exception 'Requested date conflicts with artist travel';end if;
 new.updated_at:=now();new.history:=new.history||jsonb_build_array(jsonb_build_object('event',event_name,'at',now(),'actor',auth.uid(),'date',new.ready_date,'requested_date',new.requested_date));
 return new;
end $$;
revoke all on function public.sadu_guard_booking() from public;
create trigger booking_guard before insert or update on public.sadu_freight_bookings for each row execute function public.sadu_guard_booking();
alter publication supabase_realtime add table public.sadu_artwork_checklist,public.sadu_freight_bookings;
commit;
