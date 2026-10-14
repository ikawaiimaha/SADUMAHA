-- Retire HIP in the database. AGENTS.md: HIP is permanently removed and master
-- coordination belongs to the General Exhibition Coordinator. Every duty the database
-- gave HIP (exhibition title locking, label/scope/title/publication reads, the guest
-- calendar, pilot dossier and request reads, curator assignment) now belongs to
-- GENERAL_COORDINATOR. No HIP rows exist to convert; none are fabricated.
--
-- Cross-user account checks now read sadu_user_roles, the same source the token
-- hook issues claims from, instead of auth.users.raw_app_meta_data.
begin;

alter table public.sadu_user_roles drop constraint sadu_user_roles_institutional_role_check;
alter table public.sadu_user_roles add constraint sadu_user_roles_institutional_role_check check (institutional_role in (
  'ADMIN','ARTIST','BIENNIAL_DIRECTOR','CHAIRMAN','COORDINATOR','EDITORIAL',
  'EDITORIAL_DEPARTMENT','EXTERNAL_VENDOR','FINANCE','GENERAL_COORDINATOR','LOGISTICS',
  'PREPARATORY_COMMITTEE','PR_PROTOCOL','TECHNICAL','VENUE_AUTHORITY'));

update public.sadu_pilot_members set role = 'GENERAL_COORDINATOR' where role = 'HIP';
alter table public.sadu_pilot_members drop constraint sadu_pilot_members_role_check;
alter table public.sadu_pilot_members add constraint sadu_pilot_members_role_check
  check (role in ('COORDINATOR','BIENNIAL_DIRECTOR','GENERAL_COORDINATOR','TECHNICAL'));

-- Policies -------------------------------------------------------------------
drop policy dossier_read on public.sadu_pilot_dossiers;
create policy dossier_read on public.sadu_pilot_dossiers for select to authenticated using (
  exists (select 1 from public.sadu_pilot_members m where m.user_id = (select auth.uid())
    and (m.role in ('GENERAL_COORDINATOR','TECHNICAL','BIENNIAL_DIRECTOR') or sadu_pilot_dossiers.coordinator_id = m.user_id)));

drop policy requests_read on public.sadu_pilot_requests;
create policy requests_read on public.sadu_pilot_requests for select to authenticated using (
  exists (select 1 from public.sadu_pilot_members m where m.user_id = (select auth.uid())
    and (m.role in ('GENERAL_COORDINATOR','TECHNICAL','BIENNIAL_DIRECTOR')
      or exists (select 1 from public.sadu_pilot_claims c where c.id = sadu_pilot_requests.claim_id and c.claimed_by = m.user_id))));

drop policy label_read on public.sadu_artwork_checklist;
create policy label_read on public.sadu_artwork_checklist for select to authenticated using (
  exists (select 1 from public.sadu_exhibition_scenarios s where s.id = sadu_artwork_checklist.scenario_id
    and (s.artist_id = auth.uid() or s.coordinator_id = auth.uid()))
  or auth.jwt()->'app_metadata'->>'institutional_role' in ('EDITORIAL','PR_PROTOCOL','LOGISTICS','GENERAL_COORDINATOR','BIENNIAL_DIRECTOR'));

drop policy scope_read on public.sadu_asset_scope;
create policy scope_read on public.sadu_asset_scope for select to authenticated using (
  exists (select 1 from public.sadu_exhibition_scenarios s where s.id = sadu_asset_scope.scenario_id)
  or auth.jwt()->'app_metadata'->>'institutional_role' in ('EDITORIAL','PR_PROTOCOL','GENERAL_COORDINATOR'));

drop policy titles_read on public.sadu_exhibition_titles;
create policy titles_read on public.sadu_exhibition_titles for select to authenticated using (
  exists (select 1 from public.sadu_exhibition_scenarios s where s.id = sadu_exhibition_titles.scenario_id)
  or auth.jwt()->'app_metadata'->>'institutional_role' in ('GENERAL_COORDINATOR','EDITORIAL','PR_PROTOCOL'));

drop policy titles_lock on public.sadu_exhibition_titles;
create policy titles_lock on public.sadu_exhibition_titles for update to authenticated
using (auth.jwt()->'app_metadata'->>'institutional_role' = 'GENERAL_COORDINATOR' and status = 'PENDING_CURATOR_REVIEW')
with check (auth.jwt()->'app_metadata'->>'institutional_role' = 'GENERAL_COORDINATOR' and status = 'LOCKED');

drop policy scenario_publication_read on public.sadu_exhibition_scenarios;
create policy scenario_publication_read on public.sadu_exhibition_scenarios for select to authenticated using (
  status = 'SUBMITTED' and auth.jwt()->'app_metadata'->>'institutional_role' in ('EDITORIAL','PR_PROTOCOL','GENERAL_COORDINATOR'));

-- Functions ------------------------------------------------------------------
create or replace function public.sadu_lock_exhibition_title() returns trigger
language plpgsql set search_path to '' as $function$
begin
 if auth.jwt()->'app_metadata'->>'institutional_role' is distinct from 'GENERAL_COORDINATOR' or old.status<>'PENDING_CURATOR_REVIEW' or new.status<>'LOCKED'
 or new.title_ar is distinct from old.title_ar or new.title_en is distinct from old.title_en or new.scenario_id is distinct from old.scenario_id then raise exception 'Curator title lock required';end if;
 new.locked_at=clock_timestamp();new.locked_by=auth.uid();return new;
end $function$;

create or replace function sadu_private.operational_guest_calendar()
returns table(contract_id text, artist_name text, arrival date, departure date, arrival_airport text, departure_airport text, approved_at timestamp with time zone)
language sql stable security definer set search_path to '' as $function$
 select r.contract_id,r.artist_name,r.arrival,r.departure,r.airport,r.departure_airport,a.approved_at
 from public.sadu_guest_itinerary_approvals a join public.sadu_guest_intakes r on r.id=a.intake_id join public.bilateral_contracts c on c.id=r.contract_id
 where auth.uid() is not null and auth.jwt()->'app_metadata'->>'institutional_role' in ('TECHNICAL','PR_PROTOCOL','BIENNIAL_DIRECTOR','GENERAL_COORDINATOR')
 and c.status in ('ARTIST_APPROVED','LOCKED')
 and not exists(select 1 from public.sadu_visa_refusals v where v.contract_id=r.contract_id)
 and exists(select 1 from (select * from public.sadu_guest_travel_plans p where p.contract_id=r.contract_id order by created_at desc,id desc limit 1)p where p.arrival=r.arrival and p.departure=r.departure)
 and not exists(select 1 from public.sadu_guest_intakes n join public.sadu_guest_finalizations f on f.intake_id=n.id where n.contract_id=r.contract_id and (n.created_at,n.id)>(r.created_at,r.id));
$function$;

create or replace function sadu_private.validate_freight_assignment() returns trigger
language plpgsql security definer set search_path to '' as $function$
begin
 if auth.uid() is null or auth.jwt()->'app_metadata'->>'institutional_role' is distinct from 'LOGISTICS' then raise exception 'Logistics authority required' using errcode='42501';end if;
 select artist_id into new.artist_id from public.sadu_consignments where id=new.consignment_id and origin='THIRD_PARTY_GALLERY';
 if new.artist_id is null then raise exception 'Gallery consignment required';end if;
 if not exists(select 1 from public.sadu_user_roles where user_id=new.vendor_id and institutional_role='EXTERNAL_VENDOR') then raise exception 'Provisioned freight vendor account required';end if;
 if not exists(select 1 from public.sadu_user_roles where user_id=new.curator_id and institutional_role in ('GENERAL_COORDINATOR','VENUE_AUTHORITY')) then raise exception 'Provisioned curator account required';end if;
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=new.facility_timezone) then raise exception 'IANA facility timezone required';end if;
 new.recorded_by=auth.uid();new.recorded_at=clock_timestamp();return new;
end $function$;

create or replace function sadu_private.logistics_ready() returns trigger
language plpgsql security definer set search_path to '' as $function$
declare route public.sadu_logistics_routing;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501';end if;
 select g.artist_id into new.artist_id from public.sadu_consignments g join public.sadu_artwork_checklist a on a.id=g.artwork_id join public.sadu_exhibition_scenarios s on s.id=a.scenario_id join public.bilateral_contracts c on c.id=s.contract_id where g.id=new.consignment_id and g.artist_id=auth.uid() and g.status='CONSIGNMENT_DATA_RECEIVED' and length(trim(coalesce(g.details->>'packing_list','')))>0 and c.status in ('ARTIST_APPROVED','LOCKED');
 if new.artist_id is null then raise exception 'Owned complete gallery packing list and accepted agreement required';end if;
 select * into route from public.sadu_logistics_routing where singleton;
 if not exists(select 1 from public.sadu_user_roles where user_id=route.officer_id and institutional_role='LOGISTICS') or not exists(select 1 from public.sadu_user_roles where user_id=route.head_id and institutional_role in ('BIENNIAL_DIRECTOR','CHAIRMAN')) then raise exception 'Configure provisioned Logistics officer and department head accounts';end if;
 new.officer_id=route.officer_id;new.head_id=route.head_id;new.ready_at=clock_timestamp();return new;
end $function$;

commit;
