-- The festival brief and the reasons behind decisions.
-- The festival management sets the theme, venues, number of artists and the media and disciplines
-- wanted, but none of it is written down for the people scouting, and rejections rest on reasons
-- nobody recorded. Two additions make both visible without setting any rule for the Committee:
-- the brief is recorded before scouting (each new version kept, the latest is current), and each
-- decision notes whether the reason given was in the brief.
begin;

create table public.sadu_event_briefs (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.sadu_events(id),
  theme text not null check (length(btrim(theme)) between 2 and 1000),
  venues text check (venues is null or length(venues) <= 1000),
  artist_count integer check (artist_count is null or artist_count between 1 and 1000),
  media text check (media is null or length(media) <= 2000),
  other_requirements text check (other_requirements is null or length(other_requirements) <= 4000),
  -- Who set it and where it was given (a meeting, an email), so the brief is never the scout's guess.
  source text not null check (length(btrim(source)) between 5 and 500),
  recorded_by uuid not null default auth.uid() references auth.users(id),
  recorded_at timestamptz not null default now()
);
create index on public.sadu_event_briefs (event_id, recorded_at);
alter table public.sadu_event_briefs enable row level security;
revoke all on public.sadu_event_briefs from anon, authenticated, public;
-- Versions are added, never edited or deleted.
grant select, insert on public.sadu_event_briefs to authenticated;
create policy event_briefs_read on public.sadu_event_briefs for select to authenticated
using (public.sadu_dossier_role() in ('COORDINATOR', 'GENERAL_COORDINATOR'));
create policy event_briefs_add on public.sadu_event_briefs for insert to authenticated
with check (public.sadu_dossier_role() = 'COORDINATOR' and recorded_by = (select auth.uid()));

create function public.sadu_stamp_event_brief() returns trigger
language plpgsql set search_path to '' as $$
begin
  if current_user not in ('postgres', 'service_role', 'supabase_admin') then
    new.recorded_by := auth.uid();
    new.recorded_at := clock_timestamp();
  end if;
  new.theme := btrim(new.theme);
  new.source := btrim(new.source);
  return new;
end $$;
create trigger sadu_stamp_event_brief before insert on public.sadu_event_briefs
for each row execute function public.sadu_stamp_event_brief();

-- Whether the reason given was in the brief. Optional, recorded with the decision, and like the
-- decision it cannot change afterwards.
alter table public.sadu_nomination_decisions
  add column reason_in_brief text check (reason_in_brief is null or reason_in_brief in ('IN_BRIEF', 'NOT_IN_BRIEF', 'NO_REASON_GIVEN'));

commit;
