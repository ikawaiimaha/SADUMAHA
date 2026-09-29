-- Local only after freight-closure.sql.
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
 foreach k in array array['country','city','district','street','building','hours','phone','map_url','packing_list'] loop
  if jsonb_typeof(d->k) is distinct from 'string' or length(trim(d->>k)) not between 1 and 500 then raise exception 'Complete address and courier instructions required';end if;
 end loop;
 if coalesce(d->>'currency','') not in ('AED','USD','EUR') or d->>'map_url' !~ '^https://(maps\.google\.com|www\.google\.com|maps\.app\.goo\.gl|goo\.gl|www\.makani\.ae|makani\.ae)/[^[:space:]]*$' then raise exception 'Valid currency and map URL required';end if;
 -- Whitelist fields rather than retaining arbitrary untrusted JSON.
 select jsonb_object_agg(key,value) into d from jsonb_each(d) where key=any(array['length_cm','width_cm','height_cm','weight_kg','insurance_value','currency','country','city','district','street','building','hours','phone','map_url','packing_list']);
 update public.sadu_consignments set details=d,status='CONSIGNMENT_DATA_RECEIVED',received_at=now() where id=ticket.consignment_id and status='AWAITING_GALLERY';
 if not found then raise exception 'Link invalid, expired or already used';end if;
 update sadu_private.consignment_tokens set used_at=now() where consignment_id=ticket.consignment_id;
end $$;
create table public.sadu_logistics_routing(singleton boolean primary key default true check(singleton),officer_id uuid not null references auth.users,head_id uuid not null references auth.users);
alter table public.sadu_logistics_routing enable row level security;
revoke all on public.sadu_logistics_routing from anon,authenticated;
grant select,insert on public.sadu_logistics_routing to authenticated;
create policy routing_admin on public.sadu_logistics_routing for all to authenticated using(auth.jwt()->'app_metadata'->>'institutional_role'='ADMIN') with check(auth.jwt()->'app_metadata'->>'institutional_role'='ADMIN');
create table public.sadu_logistics_tickets(
 consignment_id uuid primary key references public.sadu_consignments,artist_id uuid not null,officer_id uuid not null,head_id uuid not null,
 ready_at timestamptz not null default clock_timestamp(),opened_at timestamptz,actioned_at timestamptz,action_note text,escalated_at timestamptz
);
alter table public.sadu_logistics_tickets enable row level security;
revoke all on public.sadu_logistics_tickets from anon,authenticated;
grant select on public.sadu_logistics_tickets to authenticated;
grant insert(consignment_id) on public.sadu_logistics_tickets to authenticated;
grant update(opened_at,action_note) on public.sadu_logistics_tickets to authenticated;
create policy ticket_read on public.sadu_logistics_tickets for select to authenticated using(auth.uid() in (artist_id,officer_id,head_id) or auth.jwt()->'app_metadata'->>'institutional_role'='ADMIN');
create policy ticket_ready on public.sadu_logistics_tickets for insert to authenticated with check(artist_id=auth.uid());
create policy ticket_action on public.sadu_logistics_tickets for update to authenticated using(officer_id=auth.uid() and auth.jwt()->'app_metadata'->>'institutional_role'='LOGISTICS' and actioned_at is null) with check(officer_id=auth.uid() and auth.jwt()->'app_metadata'->>'institutional_role'='LOGISTICS');
create function sadu_private.logistics_ready() returns trigger language plpgsql security definer set search_path='' as $$
declare route public.sadu_logistics_routing;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501';end if;
 select g.artist_id into new.artist_id from public.sadu_consignments g join public.sadu_artwork_checklist a on a.id=g.artwork_id join public.sadu_exhibition_scenarios s on s.id=a.scenario_id join public.bilateral_contracts c on c.id=s.contract_id where g.id=new.consignment_id and g.artist_id=auth.uid() and g.status='CONSIGNMENT_DATA_RECEIVED' and length(trim(coalesce(g.details->>'packing_list','')))>0 and c.status in ('ARTIST_APPROVED','LOCKED');
 if new.artist_id is null then raise exception 'Owned complete gallery packing list and accepted agreement required';end if;
 select * into route from public.sadu_logistics_routing where singleton;
 if not exists(select 1 from auth.users where id=route.officer_id and raw_app_meta_data->>'institutional_role'='LOGISTICS') or not exists(select 1 from auth.users where id=route.head_id and raw_app_meta_data->>'institutional_role' in ('BIENNIAL_DIRECTOR','CHAIRMAN')) then raise exception 'Configure provisioned Logistics officer and department head accounts';end if;
 new.officer_id=route.officer_id;new.head_id=route.head_id;new.ready_at=clock_timestamp();return new;
end $$;
revoke all on function sadu_private.logistics_ready() from public,anon,authenticated;
create trigger logistics_ready before insert on public.sadu_logistics_tickets for each row execute function sadu_private.logistics_ready();
create or replace function public.sadu_logistics_action() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is distinct from old.officer_id or auth.jwt()->'app_metadata'->>'institutional_role' is distinct from 'LOGISTICS' or old.actioned_at is not null then raise exception 'Assigned officer action required';end if;
 new.opened_at=coalesce(old.opened_at,clock_timestamp());
 if old.ready_at<=clock_timestamp()-interval '48 hours' then new.escalated_at=coalesce(old.escalated_at,clock_timestamp());end if;
 if new.action_note is distinct from old.action_note then
 if length(trim(coalesce(new.action_note,''))) not between 10 and 1000 then raise exception 'Meaningful action reference required';end if;
 new.actioned_at=clock_timestamp();
 end if;return new;
end $$;
revoke all on function public.sadu_logistics_action() from public,anon;
create trigger logistics_action before update of opened_at,action_note on public.sadu_logistics_tickets for each row execute function public.sadu_logistics_action();
create function sadu_private.escalate_logistics_sla() returns void language sql security definer set search_path='' as $$
 update public.sadu_logistics_tickets set escalated_at=clock_timestamp() where actioned_at is null and escalated_at is null and ready_at<=clock_timestamp()-interval '48 hours';
$$;
revoke all on function sadu_private.escalate_logistics_sla() from public,anon,authenticated;
select cron.schedule('sadu-logistics-action-sla-local','*/15 * * * *','select sadu_private.escalate_logistics_sla();');
alter publication supabase_realtime add table public.sadu_logistics_tickets;
commit;
