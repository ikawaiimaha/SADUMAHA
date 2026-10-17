-- Run after migrations; all test records roll back.
-- The General Coordinator reads every case, its works, decisions, sent decks, ideas and files,
-- and cannot create, change or upload anything.
begin;
insert into auth.users(id) values ('d1111111-1111-4111-8111-111111111111'),('d2222222-2222-4222-8222-222222222222');
set local role authenticated;
-- C = Coordinator, G = General Coordinator.
select set_config('request.jwt.claims','{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"COORDINATOR"}}',true);
do $$begin
 insert into public.artist_dossiers(id,name,arabic_name,category,nationality,medium,event_id) values('gc-case','Fictional artist','فنان افتراضي','Emerging','Test','Ink','islamic-arts-festival');
 insert into storage.objects(bucket_id,name) values('artist-dossiers','nominations/gc-case/works/1.png');
 insert into public.sadu_case_works(dossier_id,title,source_credit,published_in,image_path,position) values('gc-case','Work 1','Fictional credit','Fictional catalogue, 2025','nominations/gc-case/works/1.png',1);
 insert into public.sadu_art_ideas(event_id,title) values('islamic-arts-festival','Light through mashrabiya');
end$$;

select set_config('request.jwt.claims','{"sub":"d2222222-2222-4222-8222-222222222222","role":"authenticated","app_metadata":{"institutional_role":"GENERAL_COORDINATOR"}}',true);
do $$begin
 if not exists(select 1 from public.artist_dossiers where id='gc-case') then raise exception 'General Coordinator cannot read cases';end if;
 if not exists(select 1 from public.sadu_case_works where dossier_id='gc-case') then raise exception 'General Coordinator cannot read works';end if;
 if not exists(select 1 from storage.objects where name='nominations/gc-case/works/1.png') then raise exception 'General Coordinator cannot read work images';end if;
 if not exists(select 1 from public.sadu_art_ideas where title='Light through mashrabiya') then raise exception 'General Coordinator cannot read ideas';end if;
 perform 1 from public.sadu_nomination_decisions; perform 1 from public.sadu_committee_batches; perform 1 from public.sadu_committee_batch_cases;
 begin insert into public.artist_dossiers(id,name,arabic_name,category,nationality,medium,event_id) values('gc-new','New','جديد','Emerging','Test','Ink','islamic-arts-festival');raise exception 'General Coordinator created a case';exception when insufficient_privilege then null;end;
 update public.artist_dossiers set biography='Changed' where id='gc-case';
 if exists(select 1 from public.artist_dossiers where id='gc-case' and biography='Changed') then raise exception 'General Coordinator edited a case';end if;
 begin insert into public.sadu_case_works(dossier_id,title,source_credit,published_in,image_path,position) values('gc-case','Extra','Credit','Catalogue','nominations/gc-case/works/1.png',2);raise exception 'General Coordinator added a work';exception when insufficient_privilege then null;end;
 begin insert into storage.objects(bucket_id,name) values('artist-dossiers','nominations/gc-case/works/2.png');raise exception 'General Coordinator uploaded';exception when insufficient_privilege then null;end;
 begin insert into public.sadu_art_ideas(event_id,title) values('islamic-arts-festival','Her idea');raise exception 'General Coordinator added an idea';exception when insufficient_privilege then null;end;
end$$;
reset role;
rollback;
