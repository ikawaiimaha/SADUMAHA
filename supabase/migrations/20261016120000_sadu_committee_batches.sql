-- Committee batches: which deck went to the Committee, and which version of each case it carried.
-- Until now a case kept only sent_to_committee_at, which a return clears, and nothing recorded the
-- file that was emailed. A batch keeps the PowerPoint the Coordinator sent (stored in SADU, with
-- its language and SHA-256), the cases in it in slide order, and each case's version at sending.
-- Batches are append-only, so the history survives a case being returned and sent again, and each
-- decision recorded from email is linked to the batch the Committee read.
begin;

create table public.sadu_committee_batches (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.sadu_events(id),
  sent_at timestamptz not null default now(),
  sent_by uuid not null references auth.users(id),
  deck_path text not null,
  deck_file_name text not null check (length(btrim(deck_file_name)) between 1 and 200),
  deck_language text not null check (deck_language in ('ar', 'en')),
  deck_sha256 text not null check (deck_sha256 ~ '^[0-9a-f]{64}$'),
  deck_bytes bigint not null check (deck_bytes > 0)
);
create index on public.sadu_committee_batches (event_id);

-- case_version is the case's updated_at when the batch was recorded; a submitted case is locked,
-- so it names the exact content the Committee received.
create table public.sadu_committee_batch_cases (
  batch_id uuid not null references public.sadu_committee_batches(id),
  dossier_id text not null references public.artist_dossiers(id),
  position smallint not null check (position between 1 and 500),
  case_version timestamptz not null,
  primary key (batch_id, dossier_id)
);
create index on public.sadu_committee_batch_cases (dossier_id);

-- Read by the roles that read cases; written only through sadu_record_committee_batch().
alter table public.sadu_committee_batches enable row level security;
alter table public.sadu_committee_batch_cases enable row level security;
revoke all on public.sadu_committee_batches, public.sadu_committee_batch_cases from anon, authenticated, public;
grant select on public.sadu_committee_batches, public.sadu_committee_batch_cases to authenticated;
create policy committee_batches_read on public.sadu_committee_batches for select to authenticated
using (public.sadu_dossier_role() in ('COORDINATOR', 'PREPARATORY_COMMITTEE', 'BIENNIAL_DIRECTOR'));
create policy committee_batch_cases_read on public.sadu_committee_batch_cases for select to authenticated
using (public.sadu_dossier_role() in ('COORDINATOR', 'PREPARATORY_COMMITTEE', 'BIENNIAL_DIRECTOR'));

-- Records a sent deck. Every case in it must be ready for the Committee in this event; a case from
-- another Coordinator may be in the deck, since the deck is what the Committee received. The case's
-- sent date is set on its first batch in the current round and kept on later resends.
create function public.sadu_record_committee_batch(
  event_id text, case_ids text[], deck_path text, deck_file_name text, deck_language text, deck_sha256 text, deck_bytes bigint
) returns uuid
language plpgsql security definer set search_path to '' as $$
declare batch uuid; sent timestamptz := clock_timestamp(); found_count integer;
begin
  if auth.uid() is null or public.sadu_dossier_role() <> 'COORDINATOR' then
    raise exception 'Only a Coordinator records a batch sent to the Committee' using errcode = '42501';
  end if;
  if coalesce(cardinality(case_ids), 0) = 0 or cardinality(case_ids) > 500
     or cardinality(case_ids) <> (select count(distinct x) from unnest(case_ids) x) then
    raise exception 'A batch lists each case once, between 1 and 500 cases';
  end if;
  if deck_path not like 'nominations/committee-batches/' || event_id || '/%.pptx'
     or not exists (select 1 from storage.objects o where o.bucket_id = 'artist-dossiers' and o.name = deck_path) then
    raise exception 'Store the presentation in SADU before recording it as sent';
  end if;
  perform 1 from public.artist_dossiers d where d.id = any(case_ids) for update;
  select count(*) into found_count from public.artist_dossiers d
  where d.id = any(case_ids) and d.event_id = sadu_record_committee_batch.event_id
    and d.status = 'PENDING_COMMITTEE_REVIEW' and d.discarded_at is null;
  if found_count <> cardinality(case_ids) then
    raise exception 'Only cases ready for the Committee in this event can be recorded as sent' using errcode = '42501';
  end if;

  insert into public.sadu_committee_batches (event_id, sent_at, sent_by, deck_path, deck_file_name, deck_language, deck_sha256, deck_bytes)
  values (event_id, sent, auth.uid(), deck_path, btrim(deck_file_name), deck_language, lower(deck_sha256), deck_bytes)
  returning id into batch;
  insert into public.sadu_committee_batch_cases (batch_id, dossier_id, position, case_version)
  select batch, d.id, ids.n, d.updated_at
  from unnest(case_ids) with ordinality as ids(id, n) join public.artist_dossiers d on d.id = ids.id;
  update public.artist_dossiers d set sent_to_committee_at = sent
  where d.id = any(case_ids) and d.sent_to_committee_at is null;
  return batch;
end $$;
revoke all on function public.sadu_record_committee_batch(text, text[], text, text, text, text, bigint) from public, anon;
grant execute on function public.sadu_record_committee_batch(text, text[], text, text, text, text, bigint) to authenticated;

-- Replaced by batches: marking cases as sent without the deck would leave no record of what was read.
drop function public.sadu_mark_nominations_sent(text[]);

-- Decisions name the batch the Committee read: the latest batch holding the case since it was
-- last sent. Set here, never by the client.
alter table public.sadu_nomination_decisions add column batch_id uuid references public.sadu_committee_batches(id);

create or replace function public.sadu_apply_nomination_decision() returns trigger
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
  new.batch_id := (select bc.batch_id from public.sadu_committee_batch_cases bc
    join public.sadu_committee_batches b on b.id = bc.batch_id
    where bc.dossier_id = new.dossier_id and d.sent_to_committee_at is not null and b.sent_at >= d.sent_to_committee_at
    order by b.sent_at desc limit 1);

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

-- Storage: decks go to nominations/committee-batches/<event id>/…, uploaded by a Coordinator.
-- The existing nomination_read policy already lets the three roles read them.
drop policy nomination_upload on storage.objects;
create policy nomination_upload on storage.objects for insert to authenticated
with check (
  bucket_id = 'artist-dossiers' and (storage.foldername(objects.name))[1] = 'nominations'
  and public.sadu_dossier_role() = 'COORDINATOR'
  and ((exists (select 1 from public.artist_dossiers d where d.id = (storage.foldername(objects.name))[2]
    and d.discarded_at is null
    and (d.created_by is null or d.created_by = (select auth.uid()))
    and (((storage.foldername(objects.name))[3] in ('works', 'cv') and d.status = 'INCOMPLETE_DOSSIER')
      or ((storage.foldername(objects.name))[3] = 'decision-evidence' and d.status = 'PENDING_COMMITTEE_REVIEW'))))
    or ((storage.foldername(objects.name))[2] = 'committee-batches'
      and exists (select 1 from public.sadu_events e where e.id = (storage.foldername(objects.name))[3]))));

commit;
