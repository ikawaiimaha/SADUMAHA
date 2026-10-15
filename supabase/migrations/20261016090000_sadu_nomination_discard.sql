-- Discarding a draft nomination case created by mistake.
-- Cases are never deleted (works and files reference them, and the bucket is append-only). The
-- case's own Coordinator may mark a draft as discarded; a discarded case is hidden in the app and
-- can no longer be edited, given works or files, or submitted.
begin;

alter table public.artist_dossiers add column discarded_at timestamptz;

-- Runs after sadu_committee_gate (triggers fire in name order), which already limits who may
-- update a draft to its Coordinator.
create function public.sadu_guard_discard() returns trigger
language plpgsql set search_path to '' as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then return new; end if;
  if TG_OP = 'INSERT' then
    if new.discarded_at is not null then raise exception 'A new case cannot start discarded' using errcode = '42501'; end if;
    return new;
  end if;
  if old.discarded_at is not null then
    raise exception 'A discarded case cannot change' using errcode = '42501';
  end if;
  if new.discarded_at is not null then
    if public.sadu_dossier_role() <> 'COORDINATOR' or old.status <> 'INCOMPLETE_DOSSIER' or new.status <> 'INCOMPLETE_DOSSIER' then
      raise exception 'Only a draft case can be discarded, by its Coordinator' using errcode = '42501';
    end if;
    new.discarded_at := clock_timestamp();
  end if;
  return new;
end $$;
create trigger sadu_guard_discard before insert or update on public.artist_dossiers
for each row execute function public.sadu_guard_discard();

-- Works: also closed once the case is discarded.
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
  return new;
end $$;

-- Storage: no new files for a discarded case.
drop policy nomination_upload on storage.objects;
create policy nomination_upload on storage.objects for insert to authenticated
with check (
  bucket_id = 'artist-dossiers' and (storage.foldername(objects.name))[1] = 'nominations'
  and public.sadu_dossier_role() = 'COORDINATOR'
  and exists (select 1 from public.artist_dossiers d where d.id = (storage.foldername(objects.name))[2]
    and d.discarded_at is null
    and (d.created_by is null or d.created_by = (select auth.uid()))
    and (((storage.foldername(objects.name))[3] in ('works', 'cv') and d.status = 'INCOMPLETE_DOSSIER')
      or ((storage.foldername(objects.name))[3] = 'decision-evidence' and d.status = 'PENDING_COMMITTEE_REVIEW'))));

commit;
