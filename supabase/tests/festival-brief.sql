-- Run after migrations; all test records roll back.
-- A Coordinator records versions of the festival brief and notes whether a decision's reason was in
-- it; the General Coordinator reads both; nobody edits or deletes a brief.
begin;
insert into auth.users(id) values ('b1111111-1111-4111-8111-111111111111'),('b2222222-2222-4222-8222-222222222222');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"b1111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"COORDINATOR"}}',true);
do $$begin
 insert into public.sadu_event_briefs(event_id,theme,venues,artist_count,media,source)
 values('islamic-arts-festival','  Light  ','Sharjah Art Museum',40,'Calligraphy, installation','Festival management meeting');
 if not exists(select 1 from public.sadu_event_briefs where theme='Light' and recorded_by='b1111111-1111-4111-8111-111111111111') then raise exception 'Brief not recorded by its author';end if;
 -- A brief naming someone else as its author is stamped with the real author.
 insert into public.sadu_event_briefs(event_id,theme,source,recorded_by,recorded_at) values('islamic-arts-festival','Other','Festival management','b2222222-2222-4222-8222-222222222222','2020-01-01');
 if exists(select 1 from public.sadu_event_briefs where theme='Other' and (recorded_by<>'b1111111-1111-4111-8111-111111111111' or recorded_at<'2026-01-01')) then raise exception 'Brief author or time forged';end if;
 begin insert into public.sadu_event_briefs(event_id,theme,source) values('islamic-arts-festival','Light','x');raise exception 'Brief accepted without a source';exception when check_violation then null;end;
 begin update public.sadu_event_briefs set theme='Changed';raise exception 'A brief was edited';exception when insufficient_privilege then null;end;
 begin delete from public.sadu_event_briefs;raise exception 'A brief was deleted';exception when insufficient_privilege then null;end;

 insert into public.artist_dossiers(id,name,arabic_name,category,nationality,medium,event_id,biography,rationale)
 values('fb-case','Fictional artist','فنان افتراضي','Emerging','Test','Ink','islamic-arts-festival','Fictional biography','Fits the theme of light');
 insert into storage.objects(bucket_id,name) select 'artist-dossiers','nominations/fb-case/works/'||n||'.png' from generate_series(1,3) n;
 insert into public.sadu_case_works(dossier_id,title,source_credit,published_in,image_path,position)
 select 'fb-case','Work '||n,'Fictional credit','Fictional catalogue, 2025','nominations/fb-case/works/'||n||'.png',n from generate_series(1,3) n;
 update public.artist_dossiers set status='PENDING_COMMITTEE_REVIEW' where id='fb-case';
 insert into storage.objects(bucket_id,name) values('artist-dossiers','nominations/committee-batches/islamic-arts-festival/fb.pptx');
 perform public.sadu_record_committee_batch('islamic-arts-festival',array['fb-case'],'nominations/committee-batches/islamic-arts-festival/fb.pptx','Committee presentation','en',repeat('f',64),1000);
 insert into storage.objects(bucket_id,name) values('artist-dossiers','nominations/fb-case/decision-evidence/e.pdf');
 begin insert into public.sadu_nomination_decisions(dossier_id,committee_recommendation,director_decision,decided_on,email_reference,minute,evidence_path,reason_in_brief)
 values('fb-case','NOT_RECOMMENDED','DECLINED',current_date,'Email from the Committee','Only Arabic calligraphy this edition.','nominations/fb-case/decision-evidence/e.pdf','MAYBE');raise exception 'Unknown reason_in_brief accepted';exception when check_violation then null;end;
 insert into public.sadu_nomination_decisions(dossier_id,committee_recommendation,director_decision,decided_on,email_reference,minute,evidence_path,reason_in_brief)
 values('fb-case','NOT_RECOMMENDED','DECLINED',current_date,'Email from the Committee','Only Arabic calligraphy this edition.','nominations/fb-case/decision-evidence/e.pdf','NOT_IN_BRIEF');
end$$;

select set_config('request.jwt.claims','{"sub":"b2222222-2222-4222-8222-222222222222","role":"authenticated","app_metadata":{"institutional_role":"GENERAL_COORDINATOR"}}',true);
do $$begin
 if not exists(select 1 from public.sadu_event_briefs where theme='Light') then raise exception 'General Coordinator cannot read the brief';end if;
 if not exists(select 1 from public.sadu_nomination_decisions where dossier_id='fb-case' and reason_in_brief='NOT_IN_BRIEF') then raise exception 'General Coordinator cannot read the reason note';end if;
 begin insert into public.sadu_event_briefs(event_id,theme,source) values('islamic-arts-festival','Hers','Festival management');raise exception 'General Coordinator recorded a brief';exception when insufficient_privilege then null;end;
end$$;
reset role;
rollback;
