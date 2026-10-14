-- Authenticated spatial pilot: separate from the session rehearsal and legacy tables.
begin;
create table public.sadu_pilot_members (
 user_id uuid primary key references auth.users(id),
 role text not null check (role in ('COORDINATOR','BIENNIAL_DIRECTOR','HIP','TECHNICAL'))
);
create table public.sadu_pilot_dossiers (
 id uuid primary key default gen_random_uuid(),
 coordinator_id uuid not null references public.sadu_pilot_members(user_id) default auth.uid(),
 artist_name text not null check (length(trim(artist_name)) between 1 and 200),
 nationality text not null check (length(trim(nationality)) between 1 and 100),
 medium text not null check (length(trim(medium)) between 1 and 200),
 status text not null default 'DRAFT' check (status in ('DRAFT','APPROVED')),
 created_at timestamptz not null default now()
);
create index on public.sadu_pilot_dossiers(coordinator_id);
create table public.sadu_pilot_spaces (
 id text primary key, venue text not null, room text not null, curator text not null
);
insert into public.sadu_pilot_spaces values
 ('sam-hall-1','Sharjah Art Museum','Hall 1','Sharjah Art Museum — Venue Curator'),
 ('calligraphy-atrium','Calligraphy Square','Main Atrium','Calligraphy Square — Venue Curator'),
 ('wisdom-lobby','House of Wisdom','Lobby','House of Wisdom — Venue Curator');
create table public.sadu_pilot_claims (
 id uuid primary key default gen_random_uuid(),
 space_id text not null unique references public.sadu_pilot_spaces(id),
 dossier_id uuid not null unique references public.sadu_pilot_dossiers(id),
 claimed_by uuid not null default auth.uid() references public.sadu_pilot_members(user_id),
 claimed_at timestamptz not null default now()
);
create index on public.sadu_pilot_claims(claimed_by);
create table public.sadu_pilot_requests (
 id uuid primary key default gen_random_uuid(),
 claim_id uuid not null references public.sadu_pilot_claims(id),
 equipment text not null check (equipment in ('AV Projectors','Lighting Rig','Pedestal')),
 mounting text not null check (mounting in ('Floor Freestanding','Ceiling Mount','Wall Anchor')),
 phase text not null check (phase in ('PROTOTYPING','FINAL_INSTALLATION')),
 requested_by uuid not null default auth.uid() references public.sadu_pilot_members(user_id),
 created_at timestamptz not null default now(),
 unique(claim_id,equipment,mounting,phase)
);
create index on public.sadu_pilot_requests(requested_by);
alter table public.sadu_pilot_members enable row level security;
alter table public.sadu_pilot_dossiers enable row level security;
alter table public.sadu_pilot_spaces enable row level security;
alter table public.sadu_pilot_claims enable row level security;
alter table public.sadu_pilot_requests enable row level security;
revoke all on public.sadu_pilot_members,public.sadu_pilot_dossiers,public.sadu_pilot_spaces,public.sadu_pilot_claims,public.sadu_pilot_requests from anon,authenticated;
grant select on public.sadu_pilot_members,public.sadu_pilot_dossiers,public.sadu_pilot_spaces,public.sadu_pilot_claims,public.sadu_pilot_requests to authenticated;
grant insert(artist_name,nationality,medium) on public.sadu_pilot_dossiers to authenticated;
grant update(status) on public.sadu_pilot_dossiers to authenticated;
grant insert(space_id,dossier_id) on public.sadu_pilot_claims to authenticated;
grant insert(claim_id,equipment,mounting,phase) on public.sadu_pilot_requests to authenticated;
create policy self_membership on public.sadu_pilot_members for select to authenticated using(user_id=(select auth.uid()));
create policy dossier_read on public.sadu_pilot_dossiers for select to authenticated using(
 exists(select 1 from public.sadu_pilot_members m where m.user_id=(select auth.uid()) and (m.role in ('HIP','TECHNICAL','BIENNIAL_DIRECTOR') or coordinator_id=m.user_id)));
create policy dossier_create on public.sadu_pilot_dossiers for insert to authenticated with check(
 coordinator_id=(select auth.uid()) and status='DRAFT' and exists(select 1 from public.sadu_pilot_members where user_id=(select auth.uid()) and role='COORDINATOR'));
create policy director_review on public.sadu_pilot_dossiers for update to authenticated using(
 status='DRAFT' and exists(select 1 from public.sadu_pilot_members where user_id=(select auth.uid()) and role='BIENNIAL_DIRECTOR')) with check(
 status='APPROVED' and exists(select 1 from public.sadu_pilot_members where user_id=(select auth.uid()) and role='BIENNIAL_DIRECTOR'));
create policy spaces_read on public.sadu_pilot_spaces for select to authenticated using(exists(select 1 from public.sadu_pilot_members where user_id=(select auth.uid())));
create policy claims_read on public.sadu_pilot_claims for select to authenticated using(exists(select 1 from public.sadu_pilot_members where user_id=(select auth.uid())));
create policy claim_owned_approved on public.sadu_pilot_claims for insert to authenticated with check(
 claimed_by=(select auth.uid()) and exists(select 1 from public.sadu_pilot_members where user_id=(select auth.uid()) and role='COORDINATOR')
 and exists(select 1 from public.sadu_pilot_dossiers d where d.id=dossier_id and d.coordinator_id=(select auth.uid()) and d.status='APPROVED'));
create policy requests_read on public.sadu_pilot_requests for select to authenticated using(
 exists(select 1 from public.sadu_pilot_members m where m.user_id=(select auth.uid()) and (m.role in ('HIP','TECHNICAL','BIENNIAL_DIRECTOR') or exists(select 1 from public.sadu_pilot_claims c where c.id=claim_id and c.claimed_by=m.user_id))));
create policy request_authorized on public.sadu_pilot_requests for insert to authenticated with check(
 requested_by=(select auth.uid()) and exists(select 1 from public.sadu_pilot_members m where m.user_id=(select auth.uid()) and (m.role='TECHNICAL' or (m.role='COORDINATOR' and exists(select 1 from public.sadu_pilot_claims c where c.id=claim_id and c.claimed_by=m.user_id)))));
commit;
