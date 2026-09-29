-- LOCAL ONLY, after guest-finalization.sql. No bookings or external notifications.
begin;
create table public.sadu_guest_itinerary_approvals (
 intake_id uuid primary key references public.sadu_guest_finalizations(intake_id),
 reviewed_by uuid not null default auth.uid(),approved_at timestamptz not null default clock_timestamp(),
 ticket_reference text not null check(length(trim(ticket_reference)) between 1 and 200)
);
alter table public.sadu_guest_itinerary_approvals enable row level security;
revoke all on public.sadu_guest_itinerary_approvals from anon,authenticated;
grant select,insert on public.sadu_guest_itinerary_approvals to authenticated;
create policy itinerary_read on public.sadu_guest_itinerary_approvals for select to authenticated using (
 auth.jwt()->'app_metadata'->>'institutional_role'='PR_PROTOCOL' or exists(select 1 from public.sadu_guest_intakes r where r.id=intake_id and r.artist_id=auth.uid())
);
create policy itinerary_insert on public.sadu_guest_itinerary_approvals for insert to authenticated with check (
 auth.jwt()->'app_metadata'->>'institutional_role'='PR_PROTOCOL' and reviewed_by=auth.uid()
 and exists(select 1 from public.sadu_guest_intakes r where r.id=intake_id and
 exists(select 1 from (select * from public.sadu_guest_travel_plans p where p.contract_id=r.contract_id order by created_at desc,id desc limit 1)p where p.arrival=r.arrival and p.departure=r.departure)
 and not exists(select 1 from public.sadu_guest_intakes n join public.sadu_guest_finalizations f on f.intake_id=n.id where n.contract_id=r.contract_id and (n.created_at,n.id)>(r.created_at,r.id)))
);
create function public.sadu_itinerary_stamp() returns trigger language plpgsql security invoker set search_path='' as $$begin new.reviewed_by=auth.uid();new.approved_at=clock_timestamp();return new;end $$;
revoke all on function public.sadu_itinerary_stamp() from public,anon;
grant execute on function public.sadu_itinerary_stamp() to authenticated;
create trigger itinerary_stamp before insert on public.sadu_guest_itinerary_approvals for each row execute function public.sadu_itinerary_stamp();
-- Explicit minimal projection. Technical cannot query passport/identity tables.
create function sadu_private.operational_guest_calendar() returns table(contract_id text,artist_name text,arrival date,departure date,arrival_airport text,departure_airport text,approved_at timestamptz)
language sql stable security definer set search_path='' as $$
 select r.contract_id,r.artist_name,r.arrival,r.departure,r.airport,r.departure_airport,a.approved_at
 from public.sadu_guest_itinerary_approvals a join public.sadu_guest_intakes r on r.id=a.intake_id join public.bilateral_contracts c on c.id=r.contract_id
 where auth.uid() is not null and auth.jwt()->'app_metadata'->>'institutional_role' in ('TECHNICAL','PR_PROTOCOL','BIENNIAL_DIRECTOR','HIP')
 and c.status in ('ARTIST_APPROVED','LOCKED')
 and exists(select 1 from (select * from public.sadu_guest_travel_plans p where p.contract_id=r.contract_id order by created_at desc,id desc limit 1)p where p.arrival=r.arrival and p.departure=r.departure)
 and not exists(select 1 from public.sadu_guest_intakes n join public.sadu_guest_finalizations f on f.intake_id=n.id where n.contract_id=r.contract_id and (n.created_at,n.id)>(r.created_at,r.id));
$$;
revoke all on function sadu_private.operational_guest_calendar() from public,anon;
grant execute on function sadu_private.operational_guest_calendar() to authenticated;
create function public.sadu_operational_guest_calendar() returns table(contract_id text,artist_name text,arrival date,departure date,arrival_airport text,departure_airport text,approved_at timestamptz)
language sql stable security invoker set search_path='' as $$select * from sadu_private.operational_guest_calendar();$$;
revoke all on function public.sadu_operational_guest_calendar() from public,anon;
grant execute on function public.sadu_operational_guest_calendar() to authenticated;
commit;
