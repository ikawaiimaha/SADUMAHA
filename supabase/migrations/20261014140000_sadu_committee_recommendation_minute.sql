-- Stage 4: the Committee records a recommendation minute; it never approves or rejects
-- (AGENTS.md: "Committee outputs a recommendation minute, not a database approval").
-- Previously the Committee could move a dossier to COMMITTEE_REJECTED, which kept it from the
-- Director. Now both outcomes go to PENDING_DIRECTOR_REVIEW with a required minute and an
-- explicit recommendation, and the Biennial Director makes the executive decision.
-- Existing COMMITTEE_REJECTED rows are left exactly as recorded; nothing is reopened.
begin;

alter table public.artist_dossiers add column committee_recommendation text
  check (committee_recommendation in ('RECOMMENDED','NOT_RECOMMENDED'));

drop policy stage4_committee_decision on public.artist_dossiers;
create policy stage4_committee_decision on public.artist_dossiers for update to authenticated
using (public.sadu_dossier_role() = 'PREPARATORY_COMMITTEE' and status = 'PENDING_COMMITTEE_REVIEW')
with check (public.sadu_dossier_role() = 'PREPARATORY_COMMITTEE' and status = 'PENDING_DIRECTOR_REVIEW');

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
  if actor<>'COORDINATOR' or new.status::text<>'INCOMPLETE_DOSSIER' or new.committee_minutes is not null or new.committee_recommendation is not null or new.committee_reviewed_at is not null or new.committee_reviewed_by is not null then
   raise exception 'New dossiers must begin incomplete without committee evidence' using errcode='42501';
  end if;
  return new;
 end if;
 if actor='COORDINATOR' then
  if old.status::text<>'INCOMPLETE_DOSSIER' or new.status::text not in ('INCOMPLETE_DOSSIER','PENDING_COMMITTEE_REVIEW')
   or new.id is distinct from old.id or new.committee_minutes is distinct from old.committee_minutes or new.committee_recommendation is distinct from old.committee_recommendation
   or new.committee_reviewed_at is distinct from old.committee_reviewed_at or new.committee_reviewed_by is distinct from old.committee_reviewed_by then
   raise exception 'Coordinator cannot bypass Committee or alter reviewed dossiers' using errcode='42501';
  end if;
  if new.status::text='PENDING_COMMITTEE_REVIEW' and (nullif(trim(new.name),'') is null or nullif(trim(new.arabic_name),'') is null or nullif(trim(new.nationality),'') is null or nullif(trim(new.medium),'') is null or nullif(trim(new.category),'') is null or nullif(trim(new.cv_url),'') is null or nullif(trim(new.portfolio_url),'') is null or (new.is_commissioned and nullif(trim(new.mockups_url),'') is null)) then
   raise exception 'Complete dossier fields and attachment references before submission';
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

commit;
