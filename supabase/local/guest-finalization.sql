-- LOCAL ONLY. Apply after guest-travel.sql. No mail transport is configured.
begin;
alter table public.sadu_guest_intakes add column identity jsonb not null default '{}'::jsonb;
alter table public.sadu_guest_intakes add column departure_airport text check(departure_airport in ('DXB','SHJ','OTHER'));
create function public.sadu_valid_guest_identity(v jsonb, arrival date) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare k text;begin
 if jsonb_typeof(v)<>'object' then return false;end if;
 foreach k in array array['passportNumber','passportExpiry','nationality','birthDate','birthPlace','email','phone'] loop
  if jsonb_typeof(v->k) is distinct from 'string' or length(trim(v->>k)) not between 1 and 200 then return false;end if;
 end loop;
 if (v->>'birthDate') !~ '^\d{4}-\d{2}-\d{2}$' or (v->>'passportExpiry') !~ '^\d{4}-\d{2}-\d{2}$' then return false;end if;
 if (v->>'birthDate')::date>=arrival or (v->>'passportExpiry')::date<=arrival or (v->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then return false;end if;
 return not exists(select 1 from jsonb_each(v) where jsonb_typeof(value)<>'string' or length(value#>>'{}')>200);
 exception when others then return false;
end $$;
revoke all on function public.sadu_valid_guest_identity(jsonb,date) from public,anon;
grant execute on function public.sadu_valid_guest_identity(jsonb,date) to authenticated;
create table public.sadu_guest_finalizations (
 intake_id uuid primary key references public.sadu_guest_intakes(id),
 artist_id uuid not null references auth.users(id),
 finalized_at timestamptz not null default clock_timestamp()
);
alter table public.sadu_guest_finalizations enable row level security;
revoke all on public.sadu_guest_finalizations from anon,authenticated;
grant select,insert on public.sadu_guest_finalizations to authenticated;
create policy final_read on public.sadu_guest_finalizations for select to authenticated using (artist_id=auth.uid() or auth.jwt()->'app_metadata'->>'institutional_role'='PR_PROTOCOL');
create policy final_insert on public.sadu_guest_finalizations for insert to authenticated with check (
 artist_id=auth.uid() and exists(select 1 from public.sadu_guest_queue q join public.sadu_guest_intakes r on r.id=q.id join public.bilateral_contracts c on c.id=q.contract_id
 where q.id=intake_id and q.artist_id=auth.uid() and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED')
 and q.passport_uploaded and q.photo_uploaded and (q.companion_name is null or q.companion_uploaded)
 and q.airport in ('DXB','SHJ','OTHER') and r.departure_airport in ('DXB','SHJ','OTHER') and public.sadu_valid_guest_identity(r.identity,r.arrival))
);
create function public.sadu_guest_finalization_time() returns trigger language plpgsql security invoker set search_path='' as $$begin new.finalized_at=clock_timestamp();return new;end $$;
revoke all on function public.sadu_guest_finalization_time() from public,anon;
grant execute on function public.sadu_guest_finalization_time() to authenticated;
create trigger guest_finalization_time before insert on public.sadu_guest_finalizations for each row execute function public.sadu_guest_finalization_time();
-- PR sees completed packets only. Guests retain access to their own drafts for retry.
alter policy guest_read on public.sadu_guest_intakes using (artist_id=auth.uid() or (auth.jwt()->'app_metadata'->>'institutional_role'='PR_PROTOCOL' and exists(select 1 from public.sadu_guest_finalizations f where f.intake_id=id)));
create view public.sadu_guest_submission_queue with (security_invoker=true) as select q.*,r.identity,r.departure_airport,f.finalized_at from public.sadu_guest_queue q join public.sadu_guest_intakes r on r.id=q.id left join public.sadu_guest_finalizations f on f.intake_id=q.id;
revoke all on public.sadu_guest_submission_queue from anon,authenticated;
grant select on public.sadu_guest_submission_queue to authenticated;
create function public.sadu_finalize_guest(p_id uuid) returns timestamptz language plpgsql security invoker set search_path='' as $$
declare at timestamptz;begin
 if not exists(select 1 from public.sadu_guest_intakes where id=p_id and artist_id=auth.uid()) then raise exception 'Own intake required';end if;
 insert into public.sadu_guest_finalizations(intake_id,artist_id) values(p_id,auth.uid()) on conflict(intake_id) do nothing;
 select finalized_at into at from public.sadu_guest_finalizations where intake_id=p_id;return at;
end $$;
revoke all on function public.sadu_finalize_guest(uuid) from public,anon;
grant execute on function public.sadu_finalize_guest(uuid) to authenticated;
-- One central rule, no guest-specific manual deadline entry. 30 days is configurable.
create table public.sadu_guest_deadline_policy(id boolean primary key default true check(id),lead_days integer not null check(lead_days between 1 and 180));
insert into public.sadu_guest_deadline_policy values(true,30);
alter table public.sadu_guest_deadline_policy enable row level security;
revoke all on public.sadu_guest_deadline_policy from anon,authenticated;
grant select on public.sadu_guest_deadline_policy to authenticated;
create policy deadline_read on public.sadu_guest_deadline_policy for select to authenticated using(true);
create table public.sadu_guest_travel_plans (
 id uuid primary key default gen_random_uuid(),contract_id text not null references public.bilateral_contracts(id),artist_id uuid not null references auth.users(id),
 arrival date not null,departure date not null check(departure>=arrival),created_at timestamptz not null default clock_timestamp()
);
alter table public.sadu_guest_travel_plans enable row level security;
revoke all on public.sadu_guest_travel_plans from anon,authenticated;
grant select,insert on public.sadu_guest_travel_plans to authenticated;
create policy plan_read on public.sadu_guest_travel_plans for select to authenticated using(artist_id=auth.uid() or auth.jwt()->'app_metadata'->>'institutional_role'='PR_PROTOCOL');
create policy plan_insert on public.sadu_guest_travel_plans for insert to authenticated with check(artist_id=auth.uid() and exists(select 1 from public.bilateral_contracts c where c.id=contract_id and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED')));
create function public.sadu_guest_plan_time() returns trigger language plpgsql security invoker set search_path='' as $$begin if exists(select 1 from (select * from public.sadu_guest_travel_plans where contract_id=new.contract_id and artist_id=auth.uid() order by created_at desc,id desc limit 1)p where p.arrival=new.arrival and p.departure=new.departure) then return null;end if;new.created_at=clock_timestamp();return new;end $$;
revoke all on function public.sadu_guest_plan_time() from public,anon;
grant execute on function public.sadu_guest_plan_time() to authenticated;
create trigger plan_time before insert on public.sadu_guest_travel_plans for each row execute function public.sadu_guest_plan_time();
create table public.sadu_guest_reminder_outbox (
 id uuid primary key default gen_random_uuid(),contract_id text not null references public.bilateral_contracts(id),artist_id uuid not null,
 plan_id uuid not null references public.sadu_guest_travel_plans(id),deadline timestamptz not null,
 stage text not null check(stage in ('14_DAYS','7_DAYS','FINAL')),
 status text not null default 'PENDING_DELIVERY' check(status in ('PENDING_DELIVERY','CANCELLED','SENT')),
 created_at timestamptz not null default clock_timestamp(),sent_at timestamptz,
 unique(plan_id,deadline,stage),check((status='SENT')=(sent_at is not null))
);
alter table public.sadu_guest_reminder_outbox enable row level security;
revoke all on public.sadu_guest_reminder_outbox from anon,authenticated;
grant select on public.sadu_guest_reminder_outbox to authenticated;
create policy reminder_read on public.sadu_guest_reminder_outbox for select to authenticated using(artist_id=auth.uid() or auth.jwt()->'app_metadata'->>'institutional_role'='PR_PROTOCOL');
-- Privileged local scheduler: only the DB owner can execute. Never accepts a caller-supplied clock.
create function sadu_private.queue_guest_reminders() returns void language plpgsql security invoker set search_path='' as $$
begin
 update public.sadu_guest_reminder_outbox o set status='CANCELLED' where status='PENDING_DELIVERY' and (
 exists(select 1 from public.sadu_guest_finalizations f join public.sadu_guest_intakes r on r.id=f.intake_id join public.sadu_guest_travel_plans p on p.id=o.plan_id where r.contract_id=o.contract_id and r.arrival=p.arrival and r.departure=p.departure)
 or not exists(select 1 from public.bilateral_contracts c where c.id=o.contract_id and c.status in ('ARTIST_APPROVED','LOCKED'))
 or exists(select 1 from public.sadu_guest_travel_plans newer join public.sadu_guest_travel_plans old on old.id=o.plan_id where newer.contract_id=o.contract_id and (newer.created_at,newer.id)>(old.created_at,old.id))
 or o.deadline<>(select (r.arrival-p.lead_days+time '23:59:59') at time zone 'Asia/Dubai' from public.sadu_guest_travel_plans r cross join public.sadu_guest_deadline_policy p where r.id=o.plan_id));
 insert into public.sadu_guest_reminder_outbox(contract_id,artist_id,plan_id,deadline,stage)
 select r.contract_id,r.artist_id,r.id,d.deadline,case when now()>=d.deadline then 'FINAL' when now()>=d.deadline-interval '7 days' then '7_DAYS' else '14_DAYS' end
 from (select distinct on(contract_id) * from public.sadu_guest_travel_plans order by contract_id,created_at desc,id desc) r
 join public.bilateral_contracts c on c.id=r.contract_id and c.status in ('ARTIST_APPROVED','LOCKED') cross join public.sadu_guest_deadline_policy p
 cross join lateral(select (r.arrival-p.lead_days+time '23:59:59') at time zone 'Asia/Dubai' as deadline)d
 where now()>=d.deadline-interval '14 days' and not exists(select 1 from public.sadu_guest_finalizations f join public.sadu_guest_intakes i on i.id=f.intake_id where i.contract_id=r.contract_id and i.arrival=r.arrival and i.departure=r.departure)
 on conflict(plan_id,deadline,stage) do nothing;
 update public.sadu_guest_reminder_outbox o set status='CANCELLED' where o.status='PENDING_DELIVERY' and ((o.stage='14_DAYS' and now()>=o.deadline-interval '7 days') or (o.stage='7_DAYS' and now()>=o.deadline));
end $$;
revoke all on function sadu_private.queue_guest_reminders() from public,anon,authenticated;
commit;
