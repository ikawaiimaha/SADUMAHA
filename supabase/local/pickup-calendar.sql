-- Local-only; requires catalog-freight.sql. No hosted deployment.
-- Fixed 2026 edition cutoff mirrors CATALOG_SCHEDULE.delivery.
begin;
create or replace function public.sadu_pickup_deadline() returns date
language sql immutable security invoker set search_path='' as $$select date '2026-09-10'$$;
revoke all on function public.sadu_pickup_deadline() from public;
grant execute on function public.sadu_pickup_deadline() to authenticated;
create or replace function public.sadu_guard_pickup_calendar() returns trigger
language plpgsql security invoker set search_path='' as $$
declare today date:=(now() at time zone 'Asia/Dubai')::date;
begin
 if TG_OP='INSERT' then
  if new.ready_date is null or new.ready_date<today or new.ready_date>public.sadu_pickup_deadline() then
   raise exception 'Pickup outside the approved 2026 intake window';
  end if;
 else
  if new.ready_date is distinct from old.ready_date or (new.change_status='APPROVED' and new.change_status is distinct from old.change_status) then
   if new.ready_date is null or new.ready_date<today or new.ready_date>public.sadu_pickup_deadline() then raise exception 'Pickup outside the approved 2026 intake window';end if;
  end if;
  if new.requested_date is distinct from old.requested_date and new.requested_date is not null then
   if new.requested_date<today or new.requested_date>public.sadu_pickup_deadline() then raise exception 'Requested pickup outside the approved 2026 intake window';end if;
  end if;
  if new.status='IN_TRANSIT' and old.status is distinct from new.status and new.ready_date>public.sadu_pickup_deadline() then raise exception 'Dispatch exceeds the approved 2026 intake window';end if;
 end if;
 return new;
end $$;
revoke all on function public.sadu_guard_pickup_calendar() from public;
-- Runs after booking_guard has resolved a date-change approval to its final ready_date.
create or replace trigger zz_pickup_calendar before insert or update on public.sadu_freight_bookings
for each row execute function public.sadu_guard_pickup_calendar();
commit;
