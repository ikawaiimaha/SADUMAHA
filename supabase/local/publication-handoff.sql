-- Local only, after materials-receiving.sql and bilingual Editorial controls.
begin;
create policy scenario_publication_read on public.sadu_exhibition_scenarios for select to authenticated using(status='SUBMITTED' and auth.jwt()->'app_metadata'->>'institutional_role' in ('EDITORIAL','PR_PROTOCOL','HIP'));
create policy titles_management_read on public.sadu_exhibition_titles for select to authenticated using(auth.jwt()->'app_metadata'->>'institutional_role' in ('CHAIRMAN','BIENNIAL_DIRECTOR'));
create table public.sadu_media_reviews(
 object_name text primary key references public.sadu_scenario_media(object_name),
 object_id uuid not null,reviewed_at timestamptz not null default clock_timestamp(),reviewed_by uuid not null default auth.uid()
);
alter table public.sadu_media_reviews enable row level security;
revoke all on public.sadu_media_reviews from anon,authenticated;
grant select on public.sadu_media_reviews to authenticated;
grant insert(object_name) on public.sadu_media_reviews to authenticated;
create policy review_read on public.sadu_media_reviews for select to authenticated using(exists(select 1 from public.sadu_scenario_media m where m.object_name=sadu_media_reviews.object_name));
create policy review_insert on public.sadu_media_reviews for insert to authenticated with check(auth.jwt()->'app_metadata'->>'institutional_role'='EDITORIAL' and reviewed_by=auth.uid());
create function public.sadu_stamp_media_review() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or auth.jwt()->'app_metadata'->>'institutional_role' is distinct from 'EDITORIAL' then raise exception 'Editorial required' using errcode='42501';end if;
 select o.id into new.object_id from storage.objects o join public.sadu_scenario_media m on m.object_name=o.name join public.sadu_exhibition_scenarios s on s.id=m.scenario_id where m.object_name=new.object_name and m.category in ('PRINT','AV') and s.status='SUBMITTED' and o.bucket_id='logistics-secure' and (o.metadata->>'size')::bigint>0;
 if new.object_id is null then raise exception 'Completed submitted artwork upload required';end if;
 new.reviewed_at=clock_timestamp();new.reviewed_by=auth.uid();return new;
end $$;
revoke all on function public.sadu_stamp_media_review() from public,anon;
create trigger media_review_receipt before insert on public.sadu_media_reviews for each row execute function public.sadu_stamp_media_review();
create view public.sadu_media_inventory with(security_invoker=true) as select m.scenario_id,m.object_name,m.file_name,m.category,
 (o.id is not null and (o.metadata->>'size')::bigint>0) as received,o.created_at as received_at,
 case when r.object_id=o.id then r.reviewed_at end as reviewed_at
 from public.sadu_scenario_media m left join storage.objects o on o.bucket_id='logistics-secure' and o.name=m.object_name left join public.sadu_media_reviews r on r.object_name=m.object_name;
revoke all on public.sadu_media_inventory from anon,authenticated;grant select on public.sadu_media_inventory to authenticated;
create table public.sadu_publication_queue(
 scenario_id uuid primary key references public.sadu_exhibition_scenarios(id),payload jsonb not null,
 status text not null default 'PENDING_CMS_CONNECTION' check(status in ('PENDING_CMS_CONNECTION','DELIVERED','FAILED','CANCELLED')),
 approved_at timestamptz not null default clock_timestamp(),approved_by uuid not null default auth.uid(),delivered_at timestamptz,
 check(status<>'DELIVERED' or delivered_at is not null)
);
alter table public.sadu_publication_queue enable row level security;
revoke all on public.sadu_publication_queue from anon,authenticated;
grant select on public.sadu_publication_queue to authenticated;grant insert(scenario_id) on public.sadu_publication_queue to authenticated;
create policy publication_read on public.sadu_publication_queue for select to authenticated using(exists(select 1 from public.sadu_exhibition_scenarios s where s.id=scenario_id));
create policy publication_insert on public.sadu_publication_queue for insert to authenticated with check(auth.jwt()->'app_metadata'->>'institutional_role'='EDITORIAL' and approved_by=auth.uid());
create or replace function public.sadu_prepare_publication() returns trigger language plpgsql security invoker set search_path='' as $$
declare title_row public.sadu_exhibition_titles; items jsonb; expected integer; actual integer;
begin
 if auth.uid() is null or auth.jwt()->'app_metadata'->>'institutional_role' is distinct from 'EDITORIAL' then raise exception 'Editorial required' using errcode='42501';end if;
 perform 1 from public.sadu_exhibition_scenarios where id=new.scenario_id and status='SUBMITTED';
 if not found then raise exception 'Submitted scenario required';end if;
 select * into title_row from public.sadu_exhibition_titles where scenario_id=new.scenario_id and status='LOCKED';
 if not found then raise exception 'Locked bilingual exhibition title required';end if;
 select expected_count into expected from public.sadu_asset_scope where scenario_id=new.scenario_id;
 select count(*) into actual from public.sadu_artwork_checklist where scenario_id=new.scenario_id;
 if expected is null or actual<>expected or actual=0 then raise exception 'Complete approved artwork set required';end if;
 if exists(select 1 from public.sadu_artwork_checklist a where a.scenario_id=new.scenario_id and (
 a.translation_status<>'TRANSLATION_COMPLETED' or a.religious_text is null or
 (length(trim(coalesce(a.source->>'bio','')))>0 and (length(trim(coalesce(a.translation_ar->>'bio','')))=0 or length(trim(coalesce(a.translation_en->>'bio','')))=0)) or
 exists(select 1 from (values ('ar'),('en')) lang(code) cross join (values ('title'),('medium'),('concept')) field(key) where length(trim(coalesce((case when a.source->>'language'=lang.code then a.source else case when lang.code='ar' then a.translation_ar else a.translation_en end end)->>field.key,'')))=0) or
 length(trim(coalesce(case when a.source->>'language'='ar' then a.source->>'title' else a.translation_ar->>'title' end,'')))=0 or
 length(trim(coalesce(case when a.source->>'language'='en' then a.source->>'title' else a.translation_en->>'title' end,'')))=0 or
 not exists(select 1 from public.sadu_media_inventory i where i.object_name=a.media_object_name and i.received and i.reviewed_at is not null))) then raise exception 'Bilingual text and individual media review required';end if;
 select jsonb_agg(jsonb_build_object('reference_id',a.id,'ar',jsonb_build_object('title',(case when a.source->>'language'='ar' then a.source else a.translation_ar end)->>'title','medium',(case when a.source->>'language'='ar' then a.source else a.translation_ar end)->>'medium','concept',(case when a.source->>'language'='ar' then a.source else a.translation_ar end)->>'concept','bio',(case when a.source->>'language'='ar' then a.source else a.translation_ar end)->>'bio'),'en',jsonb_build_object('title',(case when a.source->>'language'='en' then a.source else a.translation_en end)->>'title','medium',(case when a.source->>'language'='en' then a.source else a.translation_en end)->>'medium','concept',(case when a.source->>'language'='en' then a.source else a.translation_en end)->>'concept','bio',(case when a.source->>'language'='en' then a.source else a.translation_en end)->>'bio'),'media_object',a.media_object_name,'year',a.production_year,'height_cm',a.height_cm,'width_cm',a.width_cm) order by a.id) into items from public.sadu_artwork_checklist a where a.scenario_id=new.scenario_id;
 new.payload=jsonb_build_object('schema_version',1,'exhibition_title',jsonb_build_object('ar',title_row.title_ar,'en',title_row.title_en),'artworks',items);
 new.status='PENDING_CMS_CONNECTION';new.approved_at=clock_timestamp();new.approved_by=auth.uid();new.delivered_at=null;return new;
end $$;
revoke all on function public.sadu_prepare_publication() from public,anon;
create trigger publication_snapshot before insert on public.sadu_publication_queue for each row execute function public.sadu_prepare_publication();
alter publication supabase_realtime add table public.sadu_media_reviews,public.sadu_publication_queue;
commit;
