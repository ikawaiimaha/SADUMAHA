-- Nomination cases (docs/pilot-slice-nomination.md).
-- A Coordinator builds a case for each proposed artist; the Committee and the Director decide by
-- email; the Coordinator records that decision in SADU with the email as evidence. The rule is
-- unchanged (the Committee recommends, the Director decides); only where it is recorded moves.
begin;

-- Events -------------------------------------------------------------------------------------
create table public.sadu_events (
  id text primary key check (id ~ '^[a-z0-9-]{3,60}$'),
  name_en text not null check (length(btrim(name_en)) between 3 and 200),
  name_ar text not null check (length(btrim(name_ar)) between 3 and 200),
  edition text check (edition is null or length(btrim(edition)) between 1 and 60),
  active boolean not null default true
);
alter table public.sadu_events enable row level security;
revoke all on public.sadu_events from anon, authenticated, public;
grant select on public.sadu_events to authenticated;
create policy events_read on public.sadu_events for select to authenticated using (true);
insert into public.sadu_events (id, name_en, name_ar)
values ('islamic-arts-festival', 'Islamic Arts Festival', 'مهرجان الفنون الإسلامية');

-- Case fields on the dossier -------------------------------------------------------------------
alter table public.artist_dossiers
  add column event_id text references public.sadu_events(id),
  add column created_by uuid references auth.users(id),
  add column base_city text check (base_city is null or length(btrim(base_city)) <= 120),
  add column biography text check (biography is null or length(biography) <= 6000),
  add column rationale text check (rationale is null or length(rationale) <= 6000),
  add column participation text check (participation is null or participation in ('EXISTING_WORK', 'NEW_COMMISSION')),
  add column links text[] not null default '{}' check (cardinality(links) <= 10),
  add column sent_to_committee_at timestamptz;
create index on public.artist_dossiers (event_id);
create index on public.artist_dossiers (created_by);

-- Duplicates of stage4_review_read, kept from an earlier schema.
drop policy if exists "Committee and director read dossier scope" on public.artist_dossiers;
drop policy if exists "Coordinators manage dossiers retained read" on public.artist_dossiers;

-- Works shown in the case ------------------------------------------------------------------------
create table public.sadu_case_works (
  id uuid primary key default gen_random_uuid(),
  dossier_id text not null references public.artist_dossiers(id),
  position smallint not null default 0 check (position between 0 and 20),
  title text not null check (length(btrim(title)) between 1 and 300),
  year text check (year is null or length(btrim(year)) <= 20),
  medium text check (medium is null or length(btrim(medium)) <= 300),
  dimensions text check (dimensions is null or length(btrim(dimensions)) <= 120),
  source_credit text not null check (length(btrim(source_credit)) between 2 and 500),
  image_path text not null,
  created_at timestamptz not null default now()
);
create index on public.sadu_case_works (dossier_id);
alter table public.sadu_case_works enable row level security;
revoke all on public.sadu_case_works from anon, authenticated, public;
grant select, insert, update, delete on public.sadu_case_works to authenticated;
create policy case_works_read on public.sadu_case_works for select to authenticated
using (public.sadu_dossier_role() in ('COORDINATOR', 'PREPARATORY_COMMITTEE', 'BIENNIAL_DIRECTOR'));
create policy case_works_write on public.sadu_case_works for all to authenticated
using (public.sadu_dossier_role() = 'COORDINATOR')
with check (public.sadu_dossier_role() = 'COORDINATOR');

-- Works change only while the case is a draft, only by its Coordinator, and only with an image
-- stored under the case's own folder.
create function public.sadu_guard_case_works() returns trigger
language plpgsql set search_path to '' as $$
declare row_dossier text; d public.artist_dossiers%rowtype;
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    if TG_OP = 'DELETE' then return old; else return new; end if;
  end if;
  row_dossier := case when TG_OP = 'DELETE' then old.dossier_id else new.dossier_id end;
  if TG_OP = 'UPDATE' and new.dossier_id is distinct from old.dossier_id then
    raise exception 'A work cannot move to another case' using errcode = '42501';
  end if;
  select * into d from public.artist_dossiers where id = row_dossier;
  if not found or d.status <> 'INCOMPLETE_DOSSIER' or (d.created_by is not null and d.created_by <> auth.uid()) then
    raise exception 'Works change only while the case is a draft, by its Coordinator' using errcode = '42501';
  end if;
  if TG_OP = 'DELETE' then return old; end if;
  if new.image_path not like 'nominations/' || new.dossier_id || '/works/%' then
    raise exception 'Work images must be stored in the case folder';
  end if;
  return new;
end $$;
create trigger sadu_guard_case_works before insert or update or delete on public.sadu_case_works
for each row execute function public.sadu_guard_case_works();

-- A case is ready for the Committee when these are present.
create function public.sadu_nomination_complete(d public.artist_dossiers) returns boolean
language sql stable set search_path to '' as $$
  select nullif(btrim(d.name), '') is not null and nullif(btrim(d.arabic_name), '') is not null
    and nullif(btrim(d.nationality), '') is not null and nullif(btrim(d.medium), '') is not null
    and nullif(btrim(d.category), '') is not null and nullif(btrim(d.biography), '') is not null
    and nullif(btrim(d.rationale), '') is not null and d.event_id is not null
    and (select count(*) from public.sadu_case_works w where w.dossier_id = d.id) >= 3
$$;

-- Dossier gate: the earlier rules plus event, ownership and the nomination completeness rule.
create or replace function public.sadu_guard_committee_gate() returns trigger
language plpgsql set search_path to '' as $function$
declare actor text;
begin
 -- Trusted maintenance/automated compliance only. Never expose service credentials to clients.
 if current_user in ('postgres','service_role','supabase_admin') then
  if TG_OP='DELETE' then return old;else return new;end if;
 end if;
 actor=public.sadu_dossier_role();
 if auth.uid() is null or actor not in ('COORDINATOR','PREPARATORY_COMMITTEE','BIENNIAL_DIRECTOR') or TG_OP='DELETE' then
  raise exception 'Dossier mutation is not authorized' using errcode='42501';
 end if;
 if TG_OP='INSERT' then
  if actor<>'COORDINATOR' or new.status::text<>'INCOMPLETE_DOSSIER' or new.committee_minutes is not null or new.committee_recommendation is not null or new.committee_reviewed_at is not null or new.committee_reviewed_by is not null or new.sent_to_committee_at is not null then
   raise exception 'New dossiers must begin incomplete without committee evidence' using errcode='42501';
  end if;
  if new.event_id is null then raise exception 'A case belongs to an event';end if;
  new.created_by=auth.uid();
  return new;
 end if;
 if actor='COORDINATOR' then
  if old.status::text<>'INCOMPLETE_DOSSIER' or new.status::text not in ('INCOMPLETE_DOSSIER','PENDING_COMMITTEE_REVIEW')
   or (old.created_by is not null and old.created_by<>auth.uid())
   or new.id is distinct from old.id or new.created_by is distinct from old.created_by or new.sent_to_committee_at is distinct from old.sent_to_committee_at
   or new.committee_minutes is distinct from old.committee_minutes or new.committee_recommendation is distinct from old.committee_recommendation
   or new.committee_reviewed_at is distinct from old.committee_reviewed_at or new.committee_reviewed_by is distinct from old.committee_reviewed_by then
   raise exception 'Coordinator cannot bypass Committee or alter reviewed dossiers' using errcode='42501';
  end if;
  if new.status::text='PENDING_COMMITTEE_REVIEW' and not public.sadu_nomination_complete(new) then
   raise exception 'Complete the case before submission: names, nationality, category, medium, biography, rationale, event and at least 3 credited works';
  end if;
 elsif actor='PREPARATORY_COMMITTEE' then
  if old.status::text<>'PENDING_COMMITTEE_REVIEW' or new.status::text<>'PENDING_DIRECTOR_REVIEW'
   or (to_jsonb(new)-array['status','committee_minutes','committee_recommendation','updated_at']) is distinct from (to_jsonb(old)-array['status','committee_minutes','committee_recommendation','updated_at']) then
   raise exception 'Committee may record only a recommendation minute' using errcode='42501';
  end if;
  if new.committee_recommendation is null or length(trim(coalesce(new.committee_minutes,'')))<10 or length(new.committee_minutes)>4000 then
   raise exception 'A recommendation and a minute of 10 to 4000 characters are required';
  end if;
  new.committee_minutes=trim(new.committee_minutes);
  new.committee_reviewed_at=clock_timestamp();new.committee_reviewed_by=auth.uid();
 elsif actor='BIENNIAL_DIRECTOR' then
  if old.status::text<>'PENDING_DIRECTOR_REVIEW' or old.committee_reviewed_at is null or old.committee_reviewed_by is null or new.status::text not in ('DIRECTOR_APPROVED','DIRECTOR_VETOED')
   or (to_jsonb(new)-array['status','rejection_reason','updated_at']) is distinct from (to_jsonb(old)-array['status','rejection_reason','updated_at']) then
   raise exception 'Director decides only after a Committee minute and cannot edit the dossier' using errcode='42501';
  end if;
  if new.status::text='DIRECTOR_VETOED' and nullif(trim(new.rejection_reason),'') is null then raise exception 'Director veto requires a reason';end if;
 end if;
 new.updated_at=clock_timestamp();return new;
end $function$;

-- Marking ready cases as sent to the Committee (the presentation went out by email).
create function public.sadu_mark_nominations_sent(case_ids text[]) returns integer
language plpgsql security definer set search_path to '' as $$
declare marked integer;
begin
  if auth.uid() is null or public.sadu_dossier_role() <> 'COORDINATOR' then
    raise exception 'Only a Coordinator marks cases as sent' using errcode = '42501';
  end if;
  update public.artist_dossiers set sent_to_committee_at = clock_timestamp()
  where id = any(case_ids) and status = 'PENDING_COMMITTEE_REVIEW' and sent_to_committee_at is null
    and (created_by is null or created_by = auth.uid());
  get diagnostics marked = row_count;
  return marked;
end $$;
revoke all on function public.sadu_mark_nominations_sent(text[]) from public, anon;
grant execute on function public.sadu_mark_nominations_sent(text[]) to authenticated;

-- Decisions recorded from email --------------------------------------------------------------------
create table public.sadu_nomination_decisions (
  id uuid primary key default gen_random_uuid(),
  dossier_id text not null references public.artist_dossiers(id),
  committee_recommendation text not null check (committee_recommendation in ('RECOMMENDED', 'NOT_RECOMMENDED')),
  director_decision text not null check (director_decision in ('APPROVED', 'DECLINED', 'RETURNED')),
  decided_on date not null,
  email_reference text not null check (length(btrim(email_reference)) between 5 and 500),
  minute text not null check (length(btrim(minute)) between 10 and 4000),
  evidence_path text not null,
  source text not null default 'EMAIL' check (source = 'EMAIL'),
  recorded_by uuid not null default auth.uid() references auth.users(id),
  recorded_at timestamptz not null default now()
);
create index on public.sadu_nomination_decisions (dossier_id);
alter table public.sadu_nomination_decisions enable row level security;
revoke all on public.sadu_nomination_decisions from anon, authenticated, public;
grant select, insert on public.sadu_nomination_decisions to authenticated;
create policy decisions_read on public.sadu_nomination_decisions for select to authenticated
using (public.sadu_dossier_role() in ('COORDINATOR', 'PREPARATORY_COMMITTEE', 'BIENNIAL_DIRECTOR'));
create policy decisions_record on public.sadu_nomination_decisions for insert to authenticated
with check (public.sadu_dossier_role() = 'COORDINATOR' and recorded_by = (select auth.uid()));

-- Validates the record and applies it to the case in the same transaction. SECURITY DEFINER so the
-- status change goes through the trusted path of the dossier gate; every check is made here first.
create function public.sadu_apply_nomination_decision() returns trigger
language plpgsql security definer set search_path to '' as $$
declare d public.artist_dossiers%rowtype;
begin
  if auth.uid() is null or public.sadu_dossier_role() <> 'COORDINATOR' then
    raise exception 'Only a Coordinator records a decision from email' using errcode = '42501';
  end if;
  select * into d from public.artist_dossiers where id = new.dossier_id for update;
  if not found or d.status <> 'PENDING_COMMITTEE_REVIEW' then
    raise exception 'A decision is recorded only for a case waiting for the Committee' using errcode = '42501';
  end if;
  if d.created_by is not null and d.created_by <> new.recorded_by then
    raise exception 'Only the case Coordinator records its decision' using errcode = '42501';
  end if;
  if new.decided_on > current_date or new.decided_on < (d.created_at at time zone 'Asia/Dubai')::date then
    raise exception 'The decision date must fall between the case creation and today';
  end if;
  if new.evidence_path not like 'nominations/' || new.dossier_id || '/decision-evidence/%'
     or not exists (select 1 from storage.objects o where o.bucket_id = 'artist-dossiers' and o.name = new.evidence_path) then
    raise exception 'Attach the decision email as evidence before recording the decision';
  end if;
  new.minute := btrim(new.minute);
  new.email_reference := btrim(new.email_reference);
  new.recorded_at := clock_timestamp();

  if new.director_decision = 'RETURNED' then
    update public.artist_dossiers set status = 'INCOMPLETE_DOSSIER', sent_to_committee_at = null,
      committee_recommendation = null, committee_minutes = null, committee_reviewed_at = null, committee_reviewed_by = null,
      updated_at = clock_timestamp()
    where id = new.dossier_id;
  else
    update public.artist_dossiers set
      status = case when new.director_decision = 'APPROVED' then 'DIRECTOR_APPROVED' else 'DIRECTOR_VETOED' end,
      committee_recommendation = new.committee_recommendation, committee_minutes = new.minute,
      committee_reviewed_at = new.decided_on::timestamptz, committee_reviewed_by = new.recorded_by,
      rejection_reason = case when new.director_decision = 'DECLINED' then new.minute else null end,
      updated_at = clock_timestamp()
    where id = new.dossier_id;
  end if;
  return new;
end $$;
revoke all on function public.sadu_apply_nomination_decision() from public, anon, authenticated;
create trigger sadu_apply_nomination_decision before insert on public.sadu_nomination_decisions
for each row execute function public.sadu_apply_nomination_decision();

-- Exports to the shared folder ------------------------------------------------------------------
create table public.sadu_export_log (
  id uuid primary key default gen_random_uuid(),
  exported_by uuid not null default auth.uid() references auth.users(id),
  exported_at timestamptz not null default now(),
  event_id text not null references public.sadu_events(id),
  kind text not null check (kind in ('CASE', 'ALL', 'PRESENTATION')),
  dossier_ids text[] not null check (cardinality(dossier_ids) between 1 and 500)
);
alter table public.sadu_export_log enable row level security;
revoke all on public.sadu_export_log from anon, authenticated, public;
grant select, insert on public.sadu_export_log to authenticated;
create policy export_log_read on public.sadu_export_log for select to authenticated
using (public.sadu_dossier_role() = 'COORDINATOR');
create policy export_log_record on public.sadu_export_log for insert to authenticated
with check (public.sadu_dossier_role() = 'COORDINATOR' and exported_by = (select auth.uid()));

-- Storage: nominations/<case id>/{works,cv,decision-evidence}/… in the private artist-dossiers
-- bucket. Append-only like the rest of the bucket (no update or delete policies).
create policy nomination_upload on storage.objects for insert to authenticated
with check (
  bucket_id = 'artist-dossiers' and (storage.foldername(objects.name))[1] = 'nominations'
  and public.sadu_dossier_role() = 'COORDINATOR'
  and exists (select 1 from public.artist_dossiers d where d.id = (storage.foldername(objects.name))[2]
    and (d.created_by is null or d.created_by = (select auth.uid()))
    and (((storage.foldername(objects.name))[3] in ('works', 'cv') and d.status = 'INCOMPLETE_DOSSIER')
      or ((storage.foldername(objects.name))[3] = 'decision-evidence' and d.status = 'PENDING_COMMITTEE_REVIEW'))));
create policy nomination_read on storage.objects for select to authenticated
using (
  bucket_id = 'artist-dossiers' and (storage.foldername(objects.name))[1] = 'nominations'
  and public.sadu_dossier_role() in ('COORDINATOR', 'PREPARATORY_COMMITTEE', 'BIENNIAL_DIRECTOR'));

commit;
