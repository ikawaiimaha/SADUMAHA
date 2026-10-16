-- Scouting (docs/pilot-slice-nomination.md, "Scouting before nomination").
-- From 16 Nov 2026 Coordinators build artist cases from published sources only, without contacting
-- the artist. A draft case is that scouting case; "Ready for Committee" turns it into a nomination.
-- Two additions: every new work names where it was published, and art ideas that are not tied to
-- an artist yet have their own list.
begin;

-- Works: where each work was published ---------------------------------------------------------
alter table public.sadu_case_works
  add column published_in text check (published_in is null or length(btrim(published_in)) between 2 and 500);

create or replace function public.sadu_guard_case_works() returns trigger
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
  if not found or d.status <> 'INCOMPLETE_DOSSIER' or d.discarded_at is not null
     or (d.created_by is not null and d.created_by <> auth.uid()) then
    raise exception 'Works change only while the case is a draft, by its Coordinator' using errcode = '42501';
  end if;
  if TG_OP = 'DELETE' then return old; end if;
  if new.image_path not like 'nominations/' || new.dossier_id || '/works/%' then
    raise exception 'Work images must be stored in the case folder';
  end if;
  -- Scouting uses published works only, so each new work says where it was published.
  if TG_OP = 'INSERT' and nullif(btrim(new.published_in), '') is null then
    raise exception 'Each work needs the place it was published (exhibition, catalogue, website or press)';
  end if;
  return new;
end $$;

-- Art ideas not tied to an artist yet -----------------------------------------------------------
create table public.sadu_art_ideas (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.sadu_events(id),
  title text not null check (length(btrim(title)) between 3 and 200),
  note text check (note is null or length(note) <= 4000),
  links text[] not null default '{}' check (cardinality(links) <= 10),
  dossier_id text references public.artist_dossiers(id),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create index on public.sadu_art_ideas (event_id);
alter table public.sadu_art_ideas enable row level security;
revoke all on public.sadu_art_ideas from anon, authenticated, public;
grant select, insert, update on public.sadu_art_ideas to authenticated;
create policy art_ideas_read on public.sadu_art_ideas for select to authenticated
using (public.sadu_dossier_role() = 'COORDINATOR');
create policy art_ideas_add on public.sadu_art_ideas for insert to authenticated
with check (public.sadu_dossier_role() = 'COORDINATOR' and created_by = (select auth.uid()));
create policy art_ideas_edit on public.sadu_art_ideas for update to authenticated
using (public.sadu_dossier_role() = 'COORDINATOR' and created_by = (select auth.uid()))
with check (public.sadu_dossier_role() = 'COORDINATOR' and created_by = (select auth.uid()));

-- An idea keeps its author and event; it may be linked to a case of the same event; an archived
-- idea no longer changes. Nothing is deleted.
create function public.sadu_guard_art_ideas() returns trigger
language plpgsql set search_path to '' as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then return new; end if;
  if TG_OP = 'INSERT' then
    if new.archived_at is not null then raise exception 'A new idea cannot start archived' using errcode = '42501'; end if;
    new.created_by := auth.uid(); new.created_at := clock_timestamp();
  else
    if old.archived_at is not null then raise exception 'An archived idea cannot change' using errcode = '42501'; end if;
    if new.id is distinct from old.id or new.event_id is distinct from old.event_id
       or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then
      raise exception 'An idea keeps its author and event' using errcode = '42501';
    end if;
    if new.archived_at is not null then new.archived_at := clock_timestamp(); end if;
  end if;
  if new.dossier_id is not null and not exists (select 1 from public.artist_dossiers d
      where d.id = new.dossier_id and d.event_id = new.event_id and d.discarded_at is null) then
    raise exception 'An idea can be linked only to a case for the same event';
  end if;
  new.updated_at := clock_timestamp();
  return new;
end $$;
create trigger sadu_guard_art_ideas before insert or update on public.sadu_art_ideas
for each row execute function public.sadu_guard_art_ideas();

commit;
