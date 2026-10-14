-- Local only after logistics-sla.sql.
begin;
create or replace function sadu_private.receive_consignment(t text, d jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare ticket sadu_private.consignment_tokens; k text; v numeric;
begin
 if t is null or t !~ '^[a-f0-9]{64}$' then raise exception 'Link invalid, expired or already used';end if;
 select * into ticket from sadu_private.consignment_tokens where token_hash=encode(extensions.digest(t,'sha256'),'hex') for update;
 if not found or ticket.used_at is not null or ticket.expires_at<=now() then raise exception 'Link invalid, expired or already used';end if;
 if not exists(select 1 from public.sadu_consignments g join public.sadu_artwork_checklist w on w.id=g.artwork_id join public.sadu_exhibition_scenarios s on s.id=w.scenario_id join public.bilateral_contracts c on c.id=s.contract_id where g.id=ticket.consignment_id and c.artist_id=g.artist_id and c.status in ('ARTIST_APPROVED','LOCKED')) then raise exception 'Link invalid, expired or already used';end if;
 if d is null or jsonb_typeof(d)<>'object' or octet_length(d::text)>20000 then raise exception 'Invalid consignment data';end if;
 foreach k in array array['length_cm','width_cm','height_cm','weight_kg','insurance_value'] loop
  if jsonb_typeof(d->k) is distinct from 'number' then raise exception 'Positive numeric measurements required';end if;
  v:=(d->>k)::numeric;if v<=0 or v>100000000 then raise exception 'Positive numeric measurements required';end if;
 end loop;
 foreach k in array array['country','city','district','street','building','hours','phone','map_url','packing_list','return_country','return_city','return_address'] loop
  if jsonb_typeof(d->k) is distinct from 'string' or length(trim(d->>k)) not between 1 and 500 then raise exception 'Complete address and courier instructions required';end if;
 end loop;
 if coalesce(d->>'currency','') not in ('AED','USD','EUR') or d->>'map_url' !~ '^https://(maps\.google\.com|www\.google\.com|maps\.app\.goo\.gl|goo\.gl|www\.makani\.ae|makani\.ae)/[^[:space:]]*$' then raise exception 'Valid currency and map URL required';end if;
 if coalesce(d->>'packing_type','') not in ('MUSEUM_CRATE','SOFT_PACK','NO_PACKAGING') then raise exception 'Explicit packing declaration required';end if;
 -- Whitelist fields rather than retaining arbitrary untrusted JSON.
 select jsonb_object_agg(key,value) into d from jsonb_each(d) where key=any(array['length_cm','width_cm','height_cm','weight_kg','insurance_value','packing_type','currency','country','city','district','street','building','hours','phone','map_url','packing_list','return_country','return_city','return_address']);
 update public.sadu_consignments set details=d,status='CONSIGNMENT_DATA_RECEIVED',received_at=now() where id=ticket.consignment_id and status='AWAITING_GALLERY';
 if not found then raise exception 'Link invalid, expired or already used';end if;
 update sadu_private.consignment_tokens set used_at=now() where consignment_id=ticket.consignment_id;
end $$;
alter table public.sadu_consignments add column freight_revision integer not null default 1;
create table public.sadu_freight_changes(
 id uuid primary key default gen_random_uuid(),consignment_id uuid not null references public.sadu_consignments,
 base_revision integer not null,kind text not null check(kind in ('PACKING','RETURN','CLOSURE')),proposal jsonb not null,
 estimated_cost_minor bigint not null check(estimated_cost_minor between 0 and 10000000000),currency text not null check(currency in ('AED','USD','EUR')),payer text not null check(payer in ('ARTIST','DEPARTMENT','GALLERY')),
 reason text not null check(length(trim(reason)) between 10 and 1000),before_snapshot jsonb not null,
 status text not null default 'PENDING' check(status in ('PENDING','APPROVED','REJECTED')),requested_at timestamptz not null default clock_timestamp(),requested_by uuid not null default auth.uid(),
 logistics_by uuid,logistics_at timestamptz,finance_by uuid,finance_at timestamptz,decision_note text,decided_at timestamptz,decided_by uuid
);
create unique index one_pending_freight_change on public.sadu_freight_changes(consignment_id) where status='PENDING';
alter table public.sadu_freight_changes enable row level security;
revoke all on public.sadu_freight_changes from anon,authenticated;
grant select on public.sadu_freight_changes to authenticated;
grant insert(consignment_id,kind,proposal,estimated_cost_minor,currency,payer,reason) on public.sadu_freight_changes to authenticated;
create policy freight_changes_read on public.sadu_freight_changes for select to authenticated using(auth.jwt()->'app_metadata'->>'institutional_role' in ('LOGISTICS','FINANCE') or exists(select 1 from public.sadu_consignments c where c.id=consignment_id));
create policy freight_changes_request on public.sadu_freight_changes for insert to authenticated with check(requested_by=auth.uid());
create or replace function sadu_private.prepare_freight_change() returns trigger language plpgsql security definer set search_path='' as $$
declare c public.sadu_consignments;k text;
begin
 select * into c from public.sadu_consignments where id=new.consignment_id for update;
 if auth.uid() is null or not coalesce((c.artist_id=auth.uid() or auth.jwt()->'app_metadata'->>'institutional_role'='LOGISTICS' or (auth.jwt()->'app_metadata'->>'institutional_role'='EXTERNAL_VENDOR' and exists(select 1 from public.sadu_freight_assignments a where a.consignment_id=c.id and a.vendor_id=auth.uid()))),false) then raise exception 'Owned or assigned freight authority required' using errcode='42501';end if;
 if c.status<>'CONSIGNMENT_DATA_RECEIVED' and not (new.kind='CLOSURE' and c.status='AWAITING_GALLERY') then raise exception 'Submitted baseline required';end if;
 if new.proposal is null or jsonb_typeof(new.proposal)<>'object' or octet_length(new.proposal::text)>10000 then raise exception 'Structured proposal required';end if;
 if new.kind='PACKING' then
 if coalesce(new.proposal->>'packing_type','') not in ('MUSEUM_CRATE','SOFT_PACK') then raise exception 'Completed protective packaging required';end if;
 foreach k in array array['length_cm','width_cm','height_cm','weight_kg'] loop if jsonb_typeof(new.proposal->k) is distinct from 'number' or (new.proposal->>k)::numeric<=0 or (new.proposal->>k)::numeric>100000000 then raise exception 'Measured packed dimensions and weight required';end if;end loop;
 if length(trim(coalesce(new.proposal->>'packing_list',''))) not between 1 and 500 then raise exception 'Packing contents required';end if;
 select jsonb_object_agg(key,value) into new.proposal from jsonb_each(new.proposal) where key=any(array['packing_type','length_cm','width_cm','height_cm','weight_kg','packing_list']);
 elsif new.kind='RETURN' then
 foreach k in array array['return_country','return_city','return_address'] loop if length(trim(coalesce(new.proposal->>k,''))) not between 1 and 500 then raise exception 'Exact return destination required';end if;end loop;
 select jsonb_object_agg(key,value) into new.proposal from jsonb_each(new.proposal) where key=any(array['return_country','return_city','return_address']);
 else
 if not exists(select 1 from public.sadu_freight_assignments where consignment_id=c.id) then raise exception 'Recorded closure baseline required';end if;
 if coalesce(new.proposal->>'closure_start','') !~ '^\d{4}-\d{2}-\d{2}$' or coalesce(new.proposal->>'reopens_on','') !~ '^\d{4}-\d{2}-\d{2}$' or (new.proposal->>'reopens_on')::date<=(new.proposal->>'closure_start')::date or not exists(select 1 from pg_catalog.pg_timezone_names where name=new.proposal->>'facility_timezone') then raise exception 'Valid closure dates and timezone required';end if;
 select jsonb_object_agg(key,value) into new.proposal from jsonb_each(new.proposal) where key=any(array['closure_start','reopens_on','facility_timezone']);
 end if;
 new.base_revision=c.freight_revision;new.before_snapshot=jsonb_build_object('details',c.details,'closure',(select jsonb_build_object('closure_start',a.closure_start,'reopens_on',a.reopens_on,'facility_timezone',a.facility_timezone) from public.sadu_freight_assignments a where a.consignment_id=c.id));new.requested_at=clock_timestamp();new.requested_by=auth.uid();return new;
end $$;
revoke all on function sadu_private.prepare_freight_change() from public,anon,authenticated;
create trigger prepare_freight_change before insert on public.sadu_freight_changes for each row execute function sadu_private.prepare_freight_change();
create or replace function sadu_private.decide_freight_change(change_id uuid,approve boolean,note text) returns void language plpgsql security definer set search_path='' as $$
declare r public.sadu_freight_changes;c public.sadu_consignments;role_name text:=auth.jwt()->'app_metadata'->>'institutional_role';
begin
 if auth.uid() is null or role_name not in ('LOGISTICS','FINANCE') or role_name is null then raise exception 'Logistics or Finance decision required' using errcode='42501';end if;
 if approve is null or length(trim(coalesce(note,''))) not between 10 and 1000 then raise exception 'Decision reference required';end if;
 select * into r from public.sadu_freight_changes where id=change_id for update;
 if r.id is null or r.status<>'PENDING' then raise exception 'Pending request required';end if;
 select * into c from public.sadu_consignments where id=r.consignment_id for update;
 if c.freight_revision<>r.base_revision then raise exception 'Stale revision';end if;
 if not approve then update public.sadu_freight_changes set status='REJECTED',decision_note=coalesce(decision_note||E'\n','')||role_name||': '||note,decided_at=clock_timestamp(),decided_by=auth.uid() where id=r.id;return;end if;
 if role_name='LOGISTICS' then
 if r.logistics_at is not null or r.finance_by=auth.uid() then raise exception 'Independent unrepeated decision required';end if;
 update public.sadu_freight_changes set logistics_by=auth.uid(),logistics_at=clock_timestamp(),decision_note=coalesce(decision_note||E'\n','')||'Logistics: '||note where id=r.id;
 else
 if r.finance_at is not null or r.logistics_by=auth.uid() then raise exception 'Independent unrepeated decision required';end if;
 update public.sadu_freight_changes set finance_by=auth.uid(),finance_at=clock_timestamp(),decision_note=coalesce(decision_note||E'\n','')||'Finance: '||note where id=r.id;
 end if;
 select * into r from public.sadu_freight_changes where id=change_id;
 if r.logistics_at is not null and r.finance_at is not null then
 if r.kind='CLOSURE' then update public.sadu_freight_assignments set closure_start=(r.proposal->>'closure_start')::date,reopens_on=(r.proposal->>'reopens_on')::date,facility_timezone=r.proposal->>'facility_timezone' where consignment_id=r.consignment_id;
 else update public.sadu_consignments set details=details||r.proposal where id=r.consignment_id;end if;
 update public.sadu_consignments set freight_revision=freight_revision+1 where id=r.consignment_id;
 update public.sadu_freight_changes set status='APPROVED',decided_at=clock_timestamp(),decided_by=auth.uid() where id=r.id;
 end if;
end $$;
revoke all on function sadu_private.decide_freight_change(uuid,boolean,text) from public,anon;
grant execute on function sadu_private.decide_freight_change(uuid,boolean,text) to authenticated;
create function public.sadu_decide_freight_change(change_id uuid,approve boolean,note text) returns void language sql security invoker set search_path='' as $$select sadu_private.decide_freight_change(change_id,approve,note)$$;
revoke all on function public.sadu_decide_freight_change(uuid,boolean,text) from public,anon;grant execute on function public.sadu_decide_freight_change(uuid,boolean,text) to authenticated;
create function sadu_private.packing_ready_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.sadu_consignments c where c.id=new.consignment_id and c.details->>'packing_type' in ('MUSEUM_CRATE','SOFT_PACK') and length(trim(coalesce(c.details->>'return_address','')))>0) or exists(select 1 from public.sadu_freight_changes where consignment_id=new.consignment_id and status='PENDING') then raise exception 'Shipping held: packing, return destination or pending amendment';end if;return new;
end $$;
revoke all on function sadu_private.packing_ready_guard() from public,anon,authenticated;
create trigger packing_ready_guard before insert on public.sadu_logistics_tickets for each row execute function sadu_private.packing_ready_guard();

-- Version the closure alert so approved date changes do not reuse a stale deadline.
alter table public.sadu_freight_alerts add column freight_revision integer not null default 1;
alter table public.sadu_freight_alerts drop constraint sadu_freight_alerts_pkey;
alter table public.sadu_freight_alerts add primary key(consignment_id,freight_revision);
create or replace function sadu_private.escalate_freight_closures() returns void language plpgsql security definer set search_path='' as $$
begin
 update public.sadu_freight_alerts r set status='RESOLVED',resolved_at=clock_timestamp() from public.sadu_consignments c where r.consignment_id=c.id and r.status='OPEN' and (c.status<>'AWAITING_GALLERY' or c.freight_revision<>r.freight_revision);
 insert into public.sadu_freight_alerts(consignment_id,freight_revision) select a.consignment_id,c.freight_revision from public.sadu_freight_assignments a join public.sadu_consignments c on c.id=a.consignment_id where c.status='AWAITING_GALLERY' and clock_timestamp()>=a.details_due::timestamp at time zone a.facility_timezone on conflict do nothing;
end $$;

alter publication supabase_realtime add table public.sadu_freight_changes;
commit;
