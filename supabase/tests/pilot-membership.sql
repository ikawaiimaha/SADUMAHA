-- Run after migrations; all test records roll back.
-- Spatial-pilot membership follows sadu_user_roles, and only active members have access.
begin;
insert into auth.users(id) values
 ('a1111111-1111-4111-8111-111111111111'),('a2222222-2222-4222-8222-222222222222'),
 ('a3333333-3333-4333-8333-333333333333'),('a4444444-4444-4444-8444-444444444444');
-- C coordinator, D director, T technical, X artist (not a pilot role).
insert into public.sadu_user_roles(user_id,institutional_role,granted_reason) values
 ('a1111111-1111-4111-8111-111111111111','COORDINATOR','Synthetic test grant'),
 ('a2222222-2222-4222-8222-222222222222','BIENNIAL_DIRECTOR','Synthetic test grant'),
 ('a3333333-3333-4333-8333-333333333333','TECHNICAL','Synthetic test grant'),
 ('a4444444-4444-4444-8444-444444444444','ARTIST','Synthetic test grant');
do $$begin
 if (select count(*) from public.sadu_pilot_members where user_id in ('a1111111-1111-4111-8111-111111111111','a2222222-2222-4222-8222-222222222222','a3333333-3333-4333-8333-333333333333') and active)<>3 then raise exception 'Pilot roles were not enrolled';end if;
 if exists(select 1 from public.sadu_pilot_members where user_id='a4444444-4444-4444-8444-444444444444') then raise exception 'Non-pilot role was enrolled';end if;
 if (select role from public.sadu_pilot_members where user_id='a2222222-2222-4222-8222-222222222222')<>'BIENNIAL_DIRECTOR' then raise exception 'Enrolled with the wrong role';end if;
end$$;

set local role authenticated;
-- Coordinator creates a dossier; the artist cannot see rooms.
select set_config('request.jwt.claims','{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into public.sadu_pilot_dossiers(artist_name,nationality,medium) values('Fictional artist','Test','Ink');
select set_config('request.jwt.claims','{"sub":"a4444444-4444-4444-8444-444444444444","role":"authenticated"}',true);
do $$begin if exists(select 1 from public.sadu_pilot_spaces) then raise exception 'Artist read pilot rooms';end if;end$$;
-- Director approves; technical can read rooms.
select set_config('request.jwt.claims','{"sub":"a2222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$begin update public.sadu_pilot_dossiers set status='APPROVED' where artist_name='Fictional artist';if not FOUND then raise exception 'Director approval failed';end if;end$$;
select set_config('request.jwt.claims','{"sub":"a3333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
do $$begin if not exists(select 1 from public.sadu_pilot_spaces) then raise exception 'Technical could not read rooms';end if;end$$;
reset role;

-- Removing a role with no pilot records deletes the membership.
delete from public.sadu_user_roles where user_id='a3333333-3333-4333-8333-333333333333';
do $$begin if exists(select 1 from public.sadu_pilot_members where user_id='a3333333-3333-4333-8333-333333333333') then raise exception 'Unreferenced membership kept';end if;end$$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a3333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
do $$begin if exists(select 1 from public.sadu_pilot_spaces) then raise exception 'Removed technical still reads rooms';end if;end$$;
reset role;

-- Changing the coordinator to a non-pilot role keeps the referenced row but removes access.
update public.sadu_user_roles set institutional_role='ARTIST' where user_id='a1111111-1111-4111-8111-111111111111';
do $$begin if not exists(select 1 from public.sadu_pilot_members where user_id='a1111111-1111-4111-8111-111111111111' and not active) then raise exception 'Referenced membership not deactivated';end if;end$$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$begin
 if exists(select 1 from public.sadu_pilot_spaces) then raise exception 'Deactivated member reads rooms';end if;
 if exists(select 1 from public.sadu_pilot_dossiers) then raise exception 'Deactivated member reads own dossier';end if;
 if exists(select 1 from public.sadu_pilot_members) then raise exception 'Deactivated member sees membership';end if;
 begin insert into public.sadu_pilot_dossiers(artist_name,nationality,medium) values('Second artist','Test','Ink');raise exception 'Deactivated member created a dossier';exception when insufficient_privilege then null;end;
end$$;
reset role;

-- Restoring the role restores access to the same records.
update public.sadu_user_roles set institutional_role='COORDINATOR' where user_id='a1111111-1111-4111-8111-111111111111';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$begin if not exists(select 1 from public.sadu_pilot_dossiers where artist_name='Fictional artist') then raise exception 'Restored member lost own dossier';end if;end$$;
reset role;

-- A role change updates the pilot role.
update public.sadu_user_roles set institutional_role='TECHNICAL' where user_id='a2222222-2222-4222-8222-222222222222';
do $$begin if (select role from public.sadu_pilot_members where user_id='a2222222-2222-4222-8222-222222222222')<>'TECHNICAL' then raise exception 'Role change not synced';end if;end$$;
rollback;
