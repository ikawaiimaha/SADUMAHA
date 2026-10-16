-- Run after migrations; all test records roll back.
-- Scouting: art ideas not tied to an artist yet. Coordinators only; an idea keeps its author and
-- event, links only to a case of the same event, and stops changing once archived.
begin;
insert into auth.users(id) values
 ('c1111111-1111-4111-8111-111111111111'),('c2222222-2222-4222-8222-222222222222'),('c3333333-3333-4333-8333-333333333333');
insert into public.sadu_events(id,name_en,name_ar) values('other-event','Other event','فعالية أخرى');
set local role authenticated;
-- C1 = author Coordinator, C2 = another Coordinator, K = Committee.
select set_config('request.jwt.claims','{"sub":"c1111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"COORDINATOR"}}',true);
do $$
declare idea uuid;
begin
 insert into public.artist_dossiers(id,name,arabic_name,category,nationality,medium,event_id) values
  ('scout-case','Fictional artist','فنان افتراضي','Emerging','Test','Ink','islamic-arts-festival'),
  ('scout-other','Other artist','فنان آخر','Emerging','Test','Ink','other-event');
 insert into public.sadu_art_ideas(event_id,title,note) values('islamic-arts-festival','Light through mashrabiya','A large work with patterned shade') returning id into idea;
 if (select created_by from public.sadu_art_ideas where id=idea)<>'c1111111-1111-4111-8111-111111111111' then raise exception 'Idea author not recorded';end if;
 -- A supplied author is replaced by the signed-in Coordinator.
 insert into public.sadu_art_ideas(event_id,title,created_by) values('islamic-arts-festival','Spoofed author','c2222222-2222-4222-8222-222222222222');
 if (select created_by from public.sadu_art_ideas where title='Spoofed author')<>'c1111111-1111-4111-8111-111111111111' then raise exception 'Idea added for someone else';end if;
 begin update public.sadu_art_ideas set dossier_id='scout-other' where id=idea;raise exception 'Idea linked to another event''s case';exception when raise_exception then if SQLERRM not like 'An idea can be linked only%' then raise;end if;end;
 update public.sadu_art_ideas set dossier_id='scout-case', note='Fits this artist' where id=idea;
 if (select dossier_id from public.sadu_art_ideas where id=idea)<>'scout-case' then raise exception 'Idea not linked';end if;
 begin update public.sadu_art_ideas set event_id='other-event' where id=idea;raise exception 'Idea moved event';exception when insufficient_privilege then null;end;
 perform set_config('sadu.test_idea', idea::text, true);
end$$;

-- Another Coordinator reads the idea but cannot change it.
select set_config('request.jwt.claims','{"sub":"c2222222-2222-4222-8222-222222222222","role":"authenticated","app_metadata":{"institutional_role":"COORDINATOR"}}',true);
do $$begin
 if not exists(select 1 from public.sadu_art_ideas) then raise exception 'Coordinators should read each other''s ideas';end if;
 update public.sadu_art_ideas set title='Changed by another' where id=current_setting('sadu.test_idea')::uuid;
 if exists(select 1 from public.sadu_art_ideas where title='Changed by another') then raise exception 'Other Coordinator edited the idea';end if;
end$$;

-- The Committee does not see scouting ideas.
select set_config('request.jwt.claims','{"sub":"c3333333-3333-4333-8333-333333333333","role":"authenticated","app_metadata":{"institutional_role":"PREPARATORY_COMMITTEE"}}',true);
do $$begin
 if exists(select 1 from public.sadu_art_ideas) then raise exception 'Committee read scouting ideas';end if;
 begin insert into public.sadu_art_ideas(event_id,title) values('islamic-arts-festival','Committee idea');raise exception 'Committee added an idea';exception when insufficient_privilege then null;end;
end$$;

-- The author archives the idea; it then no longer changes.
select set_config('request.jwt.claims','{"sub":"c1111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"COORDINATOR"}}',true);
do $$begin
 update public.sadu_art_ideas set archived_at=now() where id=current_setting('sadu.test_idea')::uuid;
 if (select archived_at from public.sadu_art_ideas where id=current_setting('sadu.test_idea')::uuid) is null then raise exception 'Archive not recorded';end if;
 begin update public.sadu_art_ideas set note='After archive' where id=current_setting('sadu.test_idea')::uuid;raise exception 'Archived idea edited';exception when insufficient_privilege then null;end;
 begin delete from public.sadu_art_ideas where id=current_setting('sadu.test_idea')::uuid;raise exception 'Idea deleted';exception when insufficient_privilege then null;end;
end$$;
reset role;
rollback;
