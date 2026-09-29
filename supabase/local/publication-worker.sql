-- Local only after publication-handoff.sql. Worker uses server credentials, never browser keys.
begin;
alter table public.sadu_publication_queue add column sync_status text not null default 'Pending_Sync' check(sync_status in ('Pending_Sync','Synced','Failed_Sync')),
 add column attempts integer not null default 0,add column next_attempt_at timestamptz not null default now(),add column lease_until timestamptz,add column last_error text;
grant select,update on public.sadu_publication_queue to service_role;
create policy publication_admin_read on public.sadu_publication_queue for select to authenticated using(auth.jwt()->'app_metadata'->>'institutional_role'='ADMIN');
commit;
