-- LOCAL ONLY after installation-manifest.sql and catalog-freight.sql.
begin;
create table public.sadu_exhibition_titles(
 scenario_id uuid primary key references public.sadu_exhibition_scenarios(id),
 title_ar text not null check(length(trim(title_ar)) between 1 and 250),
 title_en text not null check(length(trim(title_en)) between 1 and 250),
 status text not null default 'PENDING_CURATOR_REVIEW' check(status in ('PENDING_CURATOR_REVIEW','LOCKED')),
 submitted_at timestamptz not null default clock_timestamp(),locked_at timestamptz,locked_by uuid
);
alter table public.sadu_exhibition_titles enable row level security;
revoke all on public.sadu_exhibition_titles from anon,authenticated;
grant select on public.sadu_exhibition_titles to authenticated;
grant insert(scenario_id,title_ar,title_en) on public.sadu_exhibition_titles to authenticated;
grant update(status) on public.sadu_exhibition_titles to authenticated;
create policy titles_read on public.sadu_exhibition_titles for select to authenticated using(
 exists(select 1 from public.sadu_exhibition_scenarios s where s.id=scenario_id)
 or auth.jwt()->'app_metadata'->>'institutional_role' in ('HIP','EDITORIAL','PR_PROTOCOL')
);
create policy titles_insert on public.sadu_exhibition_titles for insert to authenticated with check(
 exists(select 1 from public.sadu_exhibition_scenarios s join public.bilateral_contracts c on c.id=s.contract_id where s.id=scenario_id and s.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED'))
);
create policy titles_lock on public.sadu_exhibition_titles for update to authenticated using(
 auth.jwt()->'app_metadata'->>'institutional_role'='HIP' and status='PENDING_CURATOR_REVIEW'
) with check(auth.jwt()->'app_metadata'->>'institutional_role'='HIP' and status='LOCKED');
create function public.sadu_lock_exhibition_title() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if auth.jwt()->'app_metadata'->>'institutional_role' is distinct from 'HIP' or old.status<>'PENDING_CURATOR_REVIEW' or new.status<>'LOCKED'
 or new.title_ar is distinct from old.title_ar or new.title_en is distinct from old.title_en or new.scenario_id is distinct from old.scenario_id then raise exception 'Curator title lock required';end if;
 new.locked_at=clock_timestamp();new.locked_by=auth.uid();return new;
end $$;
revoke all on function public.sadu_lock_exhibition_title() from public,anon;
create trigger lock_exhibition_title before update on public.sadu_exhibition_titles for each row execute function public.sadu_lock_exhibition_title();
create table public.sadu_arrival_receipts(
 booking_id uuid primary key references public.sadu_freight_bookings(id),
 artwork_id uuid not null references public.sadu_artwork_checklist(id),
 artist_id uuid not null,coordinator_id uuid,artist_name text not null,artwork_title text not null,
 all_crates_received boolean not null check(all_crates_received),
 facility text not null check(length(trim(facility)) between 3 and 200),
 recorded_at timestamptz not null default clock_timestamp(),recorded_by uuid not null default auth.uid()
);
alter table public.sadu_arrival_receipts enable row level security;
revoke all on public.sadu_arrival_receipts from anon,authenticated;
grant select on public.sadu_arrival_receipts to authenticated;
grant insert(booking_id,facility,all_crates_received) on public.sadu_arrival_receipts to authenticated;
create policy arrival_read on public.sadu_arrival_receipts for select to authenticated using(
 artist_id=auth.uid() or coordinator_id=auth.uid() or auth.jwt()->'app_metadata'->>'institutional_role' in ('LOGISTICS','TECHNICAL')
);
create policy arrival_record on public.sadu_arrival_receipts for insert to authenticated with check(auth.jwt()->'app_metadata'->>'institutional_role'='LOGISTICS' and recorded_by=auth.uid());
-- Minimal receipt snapshot; cannot expose freight addresses, passports or commercial terms.
create function sadu_private.stamp_arrival() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or auth.jwt()->'app_metadata'->>'institutional_role' is distinct from 'LOGISTICS' then raise exception 'Logistics authority required' using errcode='42501';end if;
 select b.artwork_id,s.artist_id,s.coordinator_id,c.artist_name,a.source->>'title'
 into new.artwork_id,new.artist_id,new.coordinator_id,new.artist_name,new.artwork_title
 from public.sadu_freight_bookings b join public.sadu_artwork_checklist a on a.id=b.artwork_id
 join public.sadu_exhibition_scenarios s on s.id=a.scenario_id join public.bilateral_contracts c on c.id=s.contract_id
 where b.id=new.booking_id and b.status in ('IN_TRANSIT','CUSTOMS_CLEARANCE','RECEIVED_CONDITION_CHECKED') and c.status in ('ARTIST_APPROVED','LOCKED');
 if new.artwork_id is null then raise exception 'Dispatched artwork required';end if;
 new.recorded_at=clock_timestamp();new.recorded_by=auth.uid();return new;
end $$;
revoke all on function sadu_private.stamp_arrival() from public,anon,authenticated;
create trigger stamp_arrival before insert on public.sadu_arrival_receipts for each row execute function sadu_private.stamp_arrival();
alter publication supabase_realtime add table public.sadu_arrival_receipts,public.sadu_exhibition_titles;
commit;
