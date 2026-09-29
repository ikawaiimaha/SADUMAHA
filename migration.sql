-- SADU Stage 4 Committee gate. Run as database owner in Supabase SQL Editor.
-- Manual rollout only: deliberately outside supabase/migrations (GitHub auto-deploy).
-- Inspected legacy schema uses TEXT status. Keep that column type to preserve
-- dependencies; create/extend the enum for enum-based installations and consumers.
-- Review existing write policies first: this replaces ALL dossier mutation policies.
-- SELECT-only policies are retained; read access from old ALL policies is preserved.
-- No dossier rows are deleted or automatically reclassified.
begin;
do $$begin
 if to_regclass('public.artist_dossiers') is null then raise exception 'artist_dossiers must exist';end if;
 if to_regtype('public.artist_status') is null then
  create type public.artist_status as enum ('INCOMPLETE_DOSSIER','HIP_BLOCKED','PENDING_DIRECTOR_REVIEW','DIRECTOR_APPROVED','DIRECTOR_VETOED');
 end if;
end $$;
alter type public.artist_status add value if not exists 'PENDING_COMMITTEE_REVIEW';
alter type public.artist_status add value if not exists 'COMMITTEE_REJECTED';
commit;
-- Enum values are committed before use, including when SQL Editor wraps statements.
begin;
alter table public.artist_dossiers enable row level security;
alter table public.artist_dossiers add column if not exists committee_minutes text;
alter table public.artist_dossiers add column if not exists committee_reviewed_at timestamptz;
alter table public.artist_dossiers add column if not exists committee_reviewed_by uuid;

-- Trusted app_metadata takes precedence over the legacy server-issued claim.
create or replace function public.sadu_dossier_role() returns text
language sql stable security invoker set search_path='' as $$
 select coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role','');
$$;
revoke all on function public.sadu_dossier_role() from public;
grant execute on function public.sadu_dossier_role() to authenticated;

do $$declare p record; read_name text;
begin
 for p in select policyname,cmd,qual,permissive,roles from pg_policies where schemaname='public' and tablename='artist_dossiers' and cmd in ('ALL','INSERT','UPDATE','DELETE') loop
  if p.cmd='ALL' then
   read_name=left(p.policyname,45)||' retained read';
   execute format('drop policy if exists %I on public.artist_dossiers',read_name);
   execute format('create policy %I on public.artist_dossiers as %s for select to %s using (%s)',read_name,p.permissive,
    (select string_agg(quote_ident(r),',') from unnest(p.roles) r),coalesce(p.qual,'true'));
  end if;
  execute format('drop policy %I on public.artist_dossiers',p.policyname);
 end loop;
end $$;
revoke insert,update,delete on public.artist_dossiers from anon;
grant select,insert,update on public.artist_dossiers to authenticated;
-- DELETE is absent from every role. RLS denies it even if a legacy column/table grant remains.
drop policy if exists stage4_review_read on public.artist_dossiers;
create policy stage4_review_read on public.artist_dossiers for select to authenticated
 using(public.sadu_dossier_role() in ('COORDINATOR','PREPARATORY_COMMITTEE','BIENNIAL_DIRECTOR'));
create policy stage4_draft_insert on public.artist_dossiers for insert to authenticated
 with check(public.sadu_dossier_role()='COORDINATOR' and status::text='INCOMPLETE_DOSSIER');
create policy stage4_submit on public.artist_dossiers for update to authenticated
 using(public.sadu_dossier_role()='COORDINATOR' and status::text='INCOMPLETE_DOSSIER')
 with check(public.sadu_dossier_role()='COORDINATOR' and status::text in ('INCOMPLETE_DOSSIER','PENDING_COMMITTEE_REVIEW'));
create policy stage4_committee_decision on public.artist_dossiers for update to authenticated
 using(public.sadu_dossier_role()='PREPARATORY_COMMITTEE' and status::text='PENDING_COMMITTEE_REVIEW')
 with check(public.sadu_dossier_role()='PREPARATORY_COMMITTEE' and status::text in ('PENDING_DIRECTOR_REVIEW','COMMITTEE_REJECTED'));
create policy stage5_director_decision on public.artist_dossiers for update to authenticated
 using(public.sadu_dossier_role()='BIENNIAL_DIRECTOR' and status::text='PENDING_DIRECTOR_REVIEW' and committee_reviewed_at is not null and committee_reviewed_by is not null)
 with check(public.sadu_dossier_role()='BIENNIAL_DIRECTOR' and status::text in ('DIRECTOR_APPROVED','DIRECTOR_VETOED'));

-- RLS compares rows; this trigger prevents collateral field edits and protects history.
create or replace function public.sadu_guard_committee_gate() returns trigger
language plpgsql security invoker set search_path='' as $$
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
  if actor<>'COORDINATOR' or new.status::text<>'INCOMPLETE_DOSSIER' or new.committee_minutes is not null or new.committee_reviewed_at is not null or new.committee_reviewed_by is not null then
   raise exception 'New dossiers must begin incomplete without committee evidence' using errcode='42501';
  end if;
  return new;
 end if;
 if actor='COORDINATOR' then
  if old.status::text<>'INCOMPLETE_DOSSIER' or new.status::text not in ('INCOMPLETE_DOSSIER','PENDING_COMMITTEE_REVIEW')
   or new.id is distinct from old.id or new.committee_minutes is distinct from old.committee_minutes or new.committee_reviewed_at is distinct from old.committee_reviewed_at or new.committee_reviewed_by is distinct from old.committee_reviewed_by then
   raise exception 'Coordinator cannot bypass Committee or alter reviewed dossiers' using errcode='42501';
  end if;
  if new.status::text='PENDING_COMMITTEE_REVIEW' and (nullif(trim(new.name),'') is null or nullif(trim(new.arabic_name),'') is null or nullif(trim(new.nationality),'') is null or nullif(trim(new.medium),'') is null or nullif(trim(new.category),'') is null or nullif(trim(new.cv_url),'') is null or nullif(trim(new.portfolio_url),'') is null or (new.is_commissioned and nullif(trim(new.mockups_url),'') is null)) then
   raise exception 'Complete dossier fields and attachment references before submission';
  end if;
 elsif actor='PREPARATORY_COMMITTEE' then
  if old.status::text<>'PENDING_COMMITTEE_REVIEW' or new.status::text not in ('PENDING_DIRECTOR_REVIEW','COMMITTEE_REJECTED')
   or (to_jsonb(new)-array['status','committee_minutes','updated_at']) is distinct from (to_jsonb(old)-array['status','committee_minutes','updated_at']) then
   raise exception 'Committee may record only a decision and minutes' using errcode='42501';
  end if;
  if length(coalesce(new.committee_minutes,''))>4000 or (new.status::text='COMMITTEE_REJECTED' and nullif(trim(new.committee_minutes),'') is null) then raise exception 'Rejection requires consensus minutes (maximum 4000 characters)';end if;
  new.committee_reviewed_at=clock_timestamp();new.committee_reviewed_by=auth.uid();
 elsif actor='BIENNIAL_DIRECTOR' then
  if old.status::text<>'PENDING_DIRECTOR_REVIEW' or old.committee_reviewed_at is null or old.committee_reviewed_by is null or new.status::text not in ('DIRECTOR_APPROVED','DIRECTOR_VETOED')
   or (to_jsonb(new)-array['status','rejection_reason','updated_at']) is distinct from (to_jsonb(old)-array['status','rejection_reason','updated_at']) then
   raise exception 'Director requires Committee endorsement and cannot edit the dossier' using errcode='42501';
  end if;
  if new.status::text='DIRECTOR_VETOED' and nullif(trim(new.rejection_reason),'') is null then raise exception 'Director veto requires a reason';end if;
 end if;
 new.updated_at=clock_timestamp();return new;
end $$;
revoke all on function public.sadu_guard_committee_gate() from public;
drop trigger if exists sadu_committee_gate on public.artist_dossiers;
create trigger sadu_committee_gate before insert or update or delete on public.artist_dossiers for each row execute function public.sadu_guard_committee_gate();
commit;
-- Audit output: no HIP UPDATE/DELETE/ALL policy should exist.
select policyname,cmd,qual,with_check from pg_policies where schemaname='public' and tablename='artist_dossiers' order by cmd,policyname;
-- HIP_BLOCKED is a trusted automated hold, not a required step for clean dossiers.
-- Only the trusted compliance service may release a hold after rechecking current rules.
-- This migration does not invent a database blocklist, classify existing dossiers,
-- backfill endorsement evidence, or connect the rehearsal frontend to the database.
