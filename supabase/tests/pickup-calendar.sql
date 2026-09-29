begin;
-- Exercise the real guard in isolation so historical dates do not require falsifying the server clock.
create temporary table calendar_fixture(ready_date date,requested_date date,change_status text,status text);
insert into calendar_fixture values('2026-09-03',null,null,'PENDING_ORIGIN_DISPATCH');
create trigger calendar_guard before insert or update on calendar_fixture for each row execute function public.sadu_guard_pickup_calendar();
do $$begin
 if public.sadu_pickup_deadline()<>date '2026-09-10' then raise exception 'TEST: cutoff mismatch';end if;
 begin insert into calendar_fixture values('2026-12-03',null,null,'PENDING_ORIGIN_DISPATCH');raise exception 'TEST: December allowed';exception when others then if SQLERRM not like 'Pickup outside%' then raise;end if;end;
 begin update calendar_fixture set requested_date='2026-12-03',change_status='PENDING';raise exception 'TEST: December amendment allowed';exception when others then if SQLERRM not like 'Requested pickup outside%' then raise;end if;end;
 begin update calendar_fixture set ready_date='2026-12-03',change_status='APPROVED';raise exception 'TEST: December approval allowed';exception when others then if SQLERRM not like 'Pickup outside%' then raise;end if;end;
 if not exists(select 1 from pg_trigger where tgrelid='public.sadu_freight_bookings'::regclass and tgname='zz_pickup_calendar' and tgenabled='O') then raise exception 'TEST: real booking guard not attached';end if;
end $$;
update calendar_fixture set status='IN_TRANSIT';
update calendar_fixture set status='CUSTOMS_CLEARANCE';
update calendar_fixture set status='RECEIVED_CONDITION_CHECKED';
rollback;
