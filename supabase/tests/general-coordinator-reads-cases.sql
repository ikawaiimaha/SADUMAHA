-- Run after migrations; all test records roll back.
-- The General Coordinator reads every case, its works, decisions, sent decks, ideas and files,
-- and cannot create, change or upload anything.
begin;
insert into auth.users(id) values ('d1111111-1111-4111-8111-111111111111'),('d2222222-2222-4222-8222-222222222222');
set local role authenticated;
-- C = Coordinator, G = General Coordinator. C builds a draft case and a decided case sent in a deck.
select set_config('request.jwt.claims','{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"COORDINATOR"}}',true);
do $$begin
 insert into public.artist_dossiers(id,name,arabic_name,category,nationality,medium,event_id) values('gc-case','Fictional artist','فنان افتراضي','Emerging','Test','Ink','islamic-arts-festival');
 insert into public.artist_dossiers(id,name,arabic_name,category,nationality,medium,event_id,biography,rationale)
 values('gc-decided','Decided artist','فنان مقرر','Emerging','Test','Ink','islamic-arts-festival','Fictional biography','Why this artist fits');
 insert into storage.objects(bucket_id,name) select 'artist-dossiers','nominations/gc-decided/works/'||n||'.png' from generate_series(1,3) n;
 insert into storage.objects(bucket_id,name) values('artist-dossiers','nominations/gc-case/works/1.png');
 insert into public.sadu_case_works(dossier_id,title,source_credit,published_in,image_path,position) values('gc-case','Work 1','Fictional credit','Fictional catalogue, 2025','nominations/gc-case/works/1.png',1);
 insert into public.sadu_case_works(dossier_id,title,source_credit,published_in,image_path,position)
 select 'gc-decided','Work '||n,'Fictional credit','Fictional catalogue, 2025','nominations/gc-decided/works/'||n||'.png',n from generate_series(1,3) n;
 update public.artist_dossiers set status='PENDING_COMMITTEE_REVIEW' where id='gc-decided';
 insert into storage.objects(bucket_id,name) values('artist-dossiers','nominations/committee-batches/islamic-arts-festival/gc.pptx');
 perform public.sadu_record_committee_batch('islamic-arts-festival',array['gc-decided'],'nominations/committee-batches/islamic-arts-festival/gc.pptx','Committee presentation','en',repeat('c',64),1000);
 insert into storage.objects(bucket_id,name) values('artist-dossiers','nominations/gc-decided/decision-evidence/e.pdf');
 insert into public.sadu_nomination_decisions(dossier_id,committee_recommendation,director_decision,decided_on,email_reference,minute,evidence_path)
 values('gc-decided','RECOMMENDED','APPROVED',current_date,'Email from the Committee','Recommended; the Director confirmed.','nominations/gc-decided/decision-evidence/e.pdf');
 insert into public.sadu_art_ideas(event_id,title) values('islamic-arts-festival','Light through mashrabiya');
end$$;

select set_config('request.jwt.claims','{"sub":"d2222222-2222-4222-8222-222222222222","role":"authenticated","app_metadata":{"institutional_role":"GENERAL_COORDINATOR"}}',true);
do $$begin
 if not exists(select 1 from public.artist_dossiers where id='gc-case') then raise exception 'General Coordinator cannot read cases';end if;
 if not exists(select 1 from public.sadu_case_works where dossier_id='gc-case') then raise exception 'General Coordinator cannot read works';end if;
 if not exists(select 1 from storage.objects where name='nominations/gc-case/works/1.png') then raise exception 'General Coordinator cannot read work images';end if;
 if not exists(select 1 from public.sadu_art_ideas where title='Light through mashrabiya') then raise exception 'General Coordinator cannot read ideas';end if;
 if not exists(select 1 from public.sadu_nomination_decisions where dossier_id='gc-decided') then raise exception 'General Coordinator cannot read decisions';end if;
 if not exists(select 1 from public.sadu_committee_batches where deck_path like '%/gc.pptx') then raise exception 'General Coordinator cannot read sent decks';end if;
 if not exists(select 1 from public.sadu_committee_batch_cases where dossier_id='gc-decided') then raise exception 'General Coordinator cannot read the cases in a deck';end if;
 if not exists(select 1 from storage.objects where name='nominations/gc-decided/decision-evidence/e.pdf') then raise exception 'General Coordinator cannot read decision emails';end if;
 begin insert into public.artist_dossiers(id,name,arabic_name,category,nationality,medium,event_id) values('gc-new','New','جديد','Emerging','Test','Ink','islamic-arts-festival');raise exception 'General Coordinator created a case';exception when insufficient_privilege then null;end;
 update public.artist_dossiers set biography='Changed' where id='gc-case';
 if exists(select 1 from public.artist_dossiers where id='gc-case' and biography='Changed') then raise exception 'General Coordinator edited a case';end if;
 begin insert into public.sadu_case_works(dossier_id,title,source_credit,published_in,image_path,position) values('gc-case','Extra','Credit','Catalogue','nominations/gc-case/works/1.png',2);raise exception 'General Coordinator added a work';exception when insufficient_privilege then null;end;
 begin insert into storage.objects(bucket_id,name) values('artist-dossiers','nominations/gc-case/works/2.png');raise exception 'General Coordinator uploaded';exception when insufficient_privilege then null;end;
 begin insert into public.sadu_art_ideas(event_id,title) values('islamic-arts-festival','Her idea');raise exception 'General Coordinator added an idea';exception when insufficient_privilege then null;end;
end$$;
reset role;
rollback;
