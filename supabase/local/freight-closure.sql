-- Local only after gallery-consignment.sql. No vendor accounts or emails are created.
begin;
create table public.sadu_freight_assignments(
 consignment_id uuid primary key references public.sadu_consignments(id),
 artist_id uuid not null references auth.users(id),vendor_id uuid not null references auth.users(id),curator_id uuid not null references auth.users(id),
 closure_start date not null,reopens_on date not null check(reopens_on>closure_start),
 facility_timezone text not null,details_due date generated always as (closure_start-5) stored,
 recorded_at timestamptz not null default clock_timestamp(),recorded_by uuid not null default auth.uid()
);
alter table public.sadu_freight_assignments enable row level security;
revoke all on public.sadu_freight_assignments from anon,authenticated;
grant select on public.sadu_freight_assignments to authenticated;
grant insert(consignment_id,vendor_id,curator_id,closure_start,reopens_on,facility_timezone) on public.sadu_freight_assignments to authenticated;
create policy freight_assignment_read on public.sadu_freight_assignments for select to authenticated using(artist_id=auth.uid() or vendor_id=auth.uid() or curator_id=auth.uid() or auth.jwt()->'app_metadata'->>'institutional_role'='LOGISTICS');
create policy freight_assignment_insert on public.sadu_freight_assignments for insert to authenticated with check(auth.jwt()->'app_metadata'->>'institutional_role'='LOGISTICS' and recorded_by=auth.uid());
create function sadu_private.validate_freight_assignment() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or auth.jwt()->'app_metadata'->>'institutional_role' is distinct from 'LOGISTICS' then raise exception 'Logistics authority required' using errcode='42501';end if;
 select artist_id into new.artist_id from public.sadu_consignments where id=new.consignment_id and origin='THIRD_PARTY_GALLERY';
 if new.artist_id is null then raise exception 'Gallery consignment required';end if;
 if not exists(select 1 from auth.users where id=new.vendor_id and raw_app_meta_data->>'institutional_role'='EXTERNAL_VENDOR') then raise exception 'Provisioned freight vendor account required';end if;
 if not exists(select 1 from auth.users where id=new.curator_id and raw_app_meta_data->>'institutional_role' in ('HIP','VENUE_AUTHORITY')) then raise exception 'Provisioned curator account required';end if;
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=new.facility_timezone) then raise exception 'IANA facility timezone required';end if;
 new.recorded_by=auth.uid();new.recorded_at=clock_timestamp();return new;
end $$;
revoke all on function sadu_private.validate_freight_assignment() from public,anon,authenticated;
create trigger freight_assignment_validate before insert on public.sadu_freight_assignments for each row execute function sadu_private.validate_freight_assignment();
-- Vendor sees only assigned consignment records, never artist dossiers/passports or contract finances.
create policy consignment_vendor_read on public.sadu_consignments for select to authenticated using(
 auth.jwt()->'app_metadata'->>'institutional_role'='EXTERNAL_VENDOR' and exists(select 1 from public.sadu_freight_assignments a where a.consignment_id=sadu_consignments.id and a.vendor_id=auth.uid())
);
create table public.sadu_freight_alerts(
 consignment_id uuid primary key references public.sadu_freight_assignments(consignment_id),
 status text not null default 'OPEN' check(status in ('OPEN','RESOLVED')),priority text not null default 'HIGH' check(priority='HIGH'),
 created_at timestamptz not null default clock_timestamp(),resolved_at timestamptz
);
alter table public.sadu_freight_alerts enable row level security;
revoke all on public.sadu_freight_alerts from anon,authenticated;
grant select on public.sadu_freight_alerts to authenticated;
create policy freight_alert_read on public.sadu_freight_alerts for select to authenticated using(exists(select 1 from public.sadu_freight_assignments a where a.consignment_id=sadu_freight_alerts.consignment_id));
create function sadu_private.escalate_freight_closures() returns void language plpgsql security definer set search_path='' as $$
begin
 insert into public.sadu_freight_alerts(consignment_id)
 select a.consignment_id from public.sadu_freight_assignments a join public.sadu_consignments c on c.id=a.consignment_id
 where c.status='AWAITING_GALLERY' and clock_timestamp()>=a.details_due::timestamp at time zone a.facility_timezone
 on conflict do nothing;
 update public.sadu_freight_alerts r set status='RESOLVED',resolved_at=clock_timestamp() from public.sadu_consignments c
 where r.consignment_id=c.id and r.status='OPEN' and c.status<>'AWAITING_GALLERY';
end $$;
revoke all on function sadu_private.escalate_freight_closures() from public,anon,authenticated;
select cron.schedule('sadu-freight-closure-local','*/15 * * * *','select sadu_private.escalate_freight_closures();');
alter publication supabase_realtime add table public.sadu_freight_assignments,public.sadu_freight_alerts;
commit;
