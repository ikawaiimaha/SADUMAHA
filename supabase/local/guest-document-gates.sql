-- LOCAL ONLY after guest-finalization.sql and operational-visibility.sql. Country list supplied by user/PR correspondence, not a verified statutory matrix.
begin;
create table public.sadu_guest_document_policy(
 id boolean primary key default true check(id),
 version text not null,
 national_id_countries text[] not null,
 reference text not null
);
insert into public.sadu_guest_document_policy values(true,'PR-INTAKE-2026-09-29',array['IQ','PK','AF'],'User-supplied PR intake requirement; confirm applicability with PR');
alter table public.sadu_guest_document_policy enable row level security;
revoke all on public.sadu_guest_document_policy from anon,authenticated;
grant select on public.sadu_guest_document_policy to authenticated;
create policy document_policy_read on public.sadu_guest_document_policy for select to authenticated using(true);
alter table public.sadu_guest_intakes add column document_policy jsonb;
create or replace function public.sadu_valid_guest_identity(v jsonb, arrival date) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare k text;begin
 if jsonb_typeof(v)<>'object' then return false;end if;
 foreach k in array array['passportNumber','passportExpiry','nationality','birthDate','birthPlace','email','phone'] loop
  if jsonb_typeof(v->k) is distinct from 'string' or length(trim(v->>k)) not between 1 and 200 then return false;end if;
 end loop;
 if (v->>'birthDate') !~ '^\d{4}-\d{2}-\d{2}$' or (v->>'passportExpiry') !~ '^\d{4}-\d{2}-\d{2}$' then return false;end if;
 if (v->>'birthDate')::date>=arrival or (v->>'passportExpiry')::date<(arrival+interval '6 months')::date or (v->>'nationality') !~ '^[A-Z]{2}$' or (v->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then return false;end if;
 return not exists(select 1 from jsonb_each(v) where jsonb_typeof(value)<>'string' or length(value#>>'{}')>200);
 exception when others then return false;
end $$;

create function public.sadu_guest_document_snapshot() returns trigger language plpgsql security invoker set search_path='' as $$
declare p public.sadu_guest_document_policy;
begin
 select * into p from public.sadu_guest_document_policy where id=true;
 if p.version is null then raise exception 'Guest document policy unavailable';end if;
 if not public.sadu_valid_guest_identity(new.identity,new.arrival) then raise exception 'Complete identity and six-calendar-month passport validity required';end if;
 new.document_policy=jsonb_build_object('version',p.version,'reference',p.reference,'passport_months',6,'national_id_required',(new.identity->>'nationality')=any(p.national_id_countries));
 return new;
end $$;
revoke all on function public.sadu_guest_document_snapshot() from public,anon;
create trigger guest_document_snapshot before insert on public.sadu_guest_intakes for each row execute function public.sadu_guest_document_snapshot();
drop policy guest_upload on storage.objects;
create policy guest_upload on storage.objects for insert to authenticated with check (
 bucket_id='logistics-secure' and exists(select 1 from public.sadu_guest_intakes r join public.bilateral_contracts c on c.id=r.contract_id
 where r.artist_id=auth.uid() and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED')
 and name in (r.artist_id::text||'/guest-intake/'||r.id::text||'/passport.pdf',r.artist_id::text||'/guest-intake/'||r.id::text||'/photo.'||r.photo_extension,
 case when r.document_policy->>'national_id_required'='true' then r.artist_id::text||'/guest-intake/'||r.id::text||'/national-id.pdf' end,
 case when r.companion_name is not null then r.artist_id::text||'/guest-intake/'||r.id::text||'/companion.pdf' end))
);
drop policy guest_download on storage.objects;
create policy guest_download on storage.objects for select to authenticated using (
 bucket_id='logistics-secure' and exists(select 1 from public.sadu_guest_intakes r where name in (
 r.artist_id::text||'/guest-intake/'||r.id::text||'/passport.pdf',r.artist_id::text||'/guest-intake/'||r.id::text||'/photo.'||r.photo_extension,
 case when r.document_policy->>'national_id_required'='true' then r.artist_id::text||'/guest-intake/'||r.id::text||'/national-id.pdf' end,
 case when r.companion_name is not null then r.artist_id::text||'/guest-intake/'||r.id::text||'/companion.pdf' end))
);
drop policy guest_read_boundary on storage.objects;
create policy guest_read_boundary on storage.objects as restrictive for select to authenticated using (
 bucket_id<>'logistics-secure' or (storage.foldername(name))[2] is distinct from 'guest-intake' or exists(select 1 from public.sadu_guest_intakes r where name in (
 r.artist_id::text||'/guest-intake/'||r.id::text||'/passport.pdf',r.artist_id::text||'/guest-intake/'||r.id::text||'/photo.'||r.photo_extension,
 case when r.document_policy->>'national_id_required'='true' then r.artist_id::text||'/guest-intake/'||r.id::text||'/national-id.pdf' end,
 case when r.companion_name is not null then r.artist_id::text||'/guest-intake/'||r.id::text||'/companion.pdf' end))
);
drop policy guest_insert_boundary on storage.objects;
create policy guest_insert_boundary on storage.objects as restrictive for insert to authenticated with check (
 bucket_id<>'logistics-secure' or (storage.foldername(name))[2] is distinct from 'guest-intake' or exists(select 1 from public.sadu_guest_intakes r join public.bilateral_contracts c on c.id=r.contract_id
 where r.artist_id=auth.uid() and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED') and name in (
 r.artist_id::text||'/guest-intake/'||r.id::text||'/passport.pdf',r.artist_id::text||'/guest-intake/'||r.id::text||'/photo.'||r.photo_extension,
 case when r.document_policy->>'national_id_required'='true' then r.artist_id::text||'/guest-intake/'||r.id::text||'/national-id.pdf' end,
 case when r.companion_name is not null then r.artist_id::text||'/guest-intake/'||r.id::text||'/companion.pdf' end))
);

create policy final_document_boundary on public.sadu_guest_finalizations as restrictive for insert to authenticated with check(
 exists(select 1 from public.sadu_guest_intakes r where r.id=intake_id and r.artist_id=auth.uid()
 and r.document_policy->>'version' is not null and public.sadu_valid_guest_identity(r.identity,r.arrival)
 and (r.document_policy->>'national_id_required'='false' or
 (r.document_policy->>'national_id_required'='true' and exists(select 1 from storage.objects o where o.bucket_id='logistics-secure'
 and o.name=r.artist_id::text||'/guest-intake/'||r.id::text||'/national-id.pdf'
 and (o.metadata->>'size')::bigint between 1 and 10485760 and o.metadata->>'mimetype'='application/pdf'))))
);
create or replace view public.sadu_guest_submission_queue with (security_invoker=true) as
 select q.*,r.identity,r.departure_airport,f.finalized_at,
 (r.document_policy->>'national_id_required')::boolean as national_id_required,
 exists(select 1 from storage.objects o where o.bucket_id='logistics-secure' and o.name=r.artist_id::text||'/guest-intake/'||r.id::text||'/national-id.pdf'
 and (o.metadata->>'size')::bigint between 1 and 10485760 and o.metadata->>'mimetype'='application/pdf') as national_id_uploaded,
 r.document_policy
 from public.sadu_guest_queue q join public.sadu_guest_intakes r on r.id=q.id left join public.sadu_guest_finalizations f on f.intake_id=q.id;

-- New PR itinerary approvals cannot rely on a legacy incomplete document packet.
create policy itinerary_document_boundary on public.sadu_guest_itinerary_approvals as restrictive for insert to authenticated with check (
 exists(select 1 from public.sadu_guest_submission_queue q where q.id=intake_id and q.document_policy->>'version' is not null
 and public.sadu_valid_guest_identity(q.identity,q.arrival)
 and (q.national_id_required=false or (q.national_id_required=true and q.national_id_uploaded)))
);
commit;
