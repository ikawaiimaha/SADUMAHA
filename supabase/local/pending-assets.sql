-- Local only. Persist a reviewed scope count; do not infer executive approval from artist input.
begin;
alter policy scenario_read on public.sadu_exhibition_scenarios using (artist_id=auth.uid() or coordinator_id=auth.uid() or auth.jwt()->'app_metadata'->>'institutional_role' in ('LOGISTICS','BIENNIAL_DIRECTOR'));
create table public.sadu_asset_scope (
 scenario_id uuid primary key references public.sadu_exhibition_scenarios(id),
 expected_count int not null check(expected_count between 1 and 3000),
 approval_reference text not null check(length(trim(approval_reference)) between 3 and 500),
 approved_at timestamptz not null default clock_timestamp(),approved_by uuid not null default auth.uid()
);
alter table public.sadu_asset_scope enable row level security;
revoke all on public.sadu_asset_scope from anon,authenticated;
grant select on public.sadu_asset_scope to authenticated;
grant insert(scenario_id,expected_count,approval_reference) on public.sadu_asset_scope to authenticated;
create policy scope_read on public.sadu_asset_scope for select to authenticated using (exists(select 1 from public.sadu_exhibition_scenarios s where s.id=scenario_id));
create policy scope_insert on public.sadu_asset_scope for insert to authenticated with check(auth.jwt()->'app_metadata'->>'institutional_role'='BIENNIAL_DIRECTOR' and approved_by=auth.uid() and exists(select 1 from public.sadu_exhibition_scenarios s where s.id=scenario_id));
create table public.sadu_asset_reminders(scenario_id uuid primary key references public.sadu_asset_scope(scenario_id),queued_at timestamptz not null default clock_timestamp(),status text not null default 'PENDING_DELIVERY' check(status in ('PENDING_DELIVERY','CANCELLED','SENT')));
alter table public.sadu_asset_reminders enable row level security;
revoke all on public.sadu_asset_reminders from anon,authenticated;
grant select on public.sadu_asset_reminders to authenticated;
create policy reminder_read on public.sadu_asset_reminders for select to authenticated using(exists(select 1 from public.sadu_exhibition_scenarios s where s.id=scenario_id));
-- Owner-only scheduler, no email transport configured.
create function sadu_private.queue_asset_reminders() returns void language plpgsql security definer set search_path='' as $$
begin
 update public.sadu_asset_reminders q set status='CANCELLED' where q.status='PENDING_DELIVERY' and (not exists(select 1 from public.sadu_exhibition_scenarios s join public.bilateral_contracts c on c.id=s.contract_id where s.id=q.scenario_id and c.status in ('ARTIST_APPROVED','LOCKED')) or exists(select 1 from public.sadu_asset_scope a where a.scenario_id=q.scenario_id and (select count(*) from public.sadu_artwork_checklist w where w.scenario_id=a.scenario_id)>=a.expected_count));
 insert into public.sadu_asset_reminders(scenario_id)
 select a.scenario_id from public.sadu_asset_scope a join public.sadu_exhibition_scenarios s on s.id=a.scenario_id join public.bilateral_contracts c on c.id=s.contract_id
 where c.status in ('ARTIST_APPROVED','LOCKED') and a.approved_at<=clock_timestamp()-interval '48 hours' and (select count(*) from public.sadu_artwork_checklist w where w.scenario_id=a.scenario_id)<a.expected_count on conflict do nothing;
end $$;
revoke all on function sadu_private.queue_asset_reminders() from public,anon,authenticated;
select cron.schedule('sadu-pending-assets-local','*/15 * * * *','select sadu_private.queue_asset_reminders();');
alter policy label_read on public.sadu_artwork_checklist using (
 exists(select 1 from public.sadu_exhibition_scenarios s where s.id=scenario_id and (s.artist_id=auth.uid() or s.coordinator_id=auth.uid())) or auth.jwt()->'app_metadata'->>'institutional_role' in ('EDITORIAL','PR_PROTOCOL','LOGISTICS','HIP','BIENNIAL_DIRECTOR'));
commit;
