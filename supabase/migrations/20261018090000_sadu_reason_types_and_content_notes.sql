-- Reason types and content notes, as the General Exhibition Coordinator set them on 17 October 2026.
-- Reason types: each decision can carry one or more types of reason, so reasons can be compared
-- across cases. The minute stays the reason as given; the types add nothing the Committee did not say.
-- Content notes: a concern about an artist's content comes from the team noticing it, or from someone
-- who tells the team the artist is known for something among artists. The Director sees it first;
-- if he wants to check something, he consults the Chairman. So a note is kept apart from the case:
-- only its author and the Director read it, it never goes into a deck or an export, and it records
-- when it was raised with the Director and whether he consulted the Chairman.
begin;

-- Reason types on a decision. Optional, recorded with the decision, and like it cannot change.
alter table public.sadu_nomination_decisions
  add column reason_types text[] check (
    reason_types is null or (
      cardinality(reason_types) between 1 and 8
      and reason_types <@ array['THEME', 'QUALITY', 'SHOWN_RECENTLY', 'CONTENT', 'LOGISTICS', 'BUDGET', 'BALANCE', 'OTHER']::text[]));

create table public.sadu_content_notes (
  id uuid primary key default gen_random_uuid(),
  dossier_id text not null references public.artist_dossiers(id),
  -- TEAM: someone on the team noticed it. REPORTED: someone told the team.
  origin text not null check (origin in ('TEAM', 'REPORTED')),
  -- Who told the team, when REPORTED (a role or a name, as the author chooses to record it).
  reported_by text check (reported_by is null or length(btrim(reported_by)) between 2 and 200),
  note text not null check (length(btrim(note)) between 10 and 2000),
  recorded_by uuid not null default auth.uid() references auth.users(id),
  recorded_at timestamptz not null default now(),
  raised_with_director_on date,
  chairman_consulted_on date,
  check (origin = 'REPORTED' or reported_by is null),
  check (chairman_consulted_on is null or (raised_with_director_on is not null and chairman_consulted_on >= raised_with_director_on))
);
create index on public.sadu_content_notes (dossier_id);
alter table public.sadu_content_notes enable row level security;
revoke all on public.sadu_content_notes from anon, authenticated, public;
-- Never deleted; only the two dates are ever set after the note is written.
grant select, insert on public.sadu_content_notes to authenticated;
grant update (raised_with_director_on, chairman_consulted_on) on public.sadu_content_notes to authenticated;
create policy content_notes_read on public.sadu_content_notes for select to authenticated
using (recorded_by = (select auth.uid()) or public.sadu_dossier_role() = 'BIENNIAL_DIRECTOR');
create policy content_notes_add on public.sadu_content_notes for insert to authenticated
with check (public.sadu_dossier_role() = 'COORDINATOR' and recorded_by = (select auth.uid()));
create policy content_notes_dates on public.sadu_content_notes for update to authenticated
using (public.sadu_dossier_role() = 'COORDINATOR' and recorded_by = (select auth.uid()))
with check (public.sadu_dossier_role() = 'COORDINATOR' and recorded_by = (select auth.uid()));

create function public.sadu_guard_content_note() returns trigger
language plpgsql set search_path to '' as $$
declare today date := (now() at time zone 'Asia/Dubai')::date;
begin
  if TG_OP = 'INSERT' then
    if current_user not in ('postgres', 'service_role', 'supabase_admin') then
      new.recorded_by := auth.uid();
      new.recorded_at := clock_timestamp();
    end if;
    if not exists (select 1 from public.artist_dossiers d where d.id = new.dossier_id and d.discarded_at is null) then
      raise exception 'A content note needs a case that has not been discarded';
    end if;
    new.note := btrim(new.note);
    new.reported_by := nullif(btrim(new.reported_by), '');
    if new.raised_with_director_on is not null or new.chairman_consulted_on is not null then
      raise exception 'Record the note first, then when it was raised';
    end if;
    return new;
  end if;
  -- UPDATE: each date is set once, never changed or cleared, and never in the future.
  if old.raised_with_director_on is not null and new.raised_with_director_on is distinct from old.raised_with_director_on
     or old.chairman_consulted_on is not null and new.chairman_consulted_on is distinct from old.chairman_consulted_on then
    raise exception 'A recorded date cannot be changed' using errcode = '42501';
  end if;
  if new.raised_with_director_on > today or new.chairman_consulted_on > today then
    raise exception 'The date cannot be in the future';
  end if;
  if new.raised_with_director_on < (old.recorded_at at time zone 'Asia/Dubai')::date then
    raise exception 'A note cannot be raised with the Director before it was recorded';
  end if;
  return new;
end $$;
create trigger sadu_guard_content_note before insert or update on public.sadu_content_notes
for each row execute function public.sadu_guard_content_note();

commit;
