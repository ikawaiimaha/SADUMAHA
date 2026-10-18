-- Run after migrations; all test records roll back.
-- Reason types are recorded with a decision. A content note is read only by its author and the
-- Director, records where it came from, and takes each of its two dates once.
begin;
insert into auth.users(id) values ('c1111111-1111-4111-8111-111111111111'),('c2222222-2222-4222-8222-222222222222'),
 ('c3333333-3333-4333-8333-333333333333'),('c4444444-4444-4444-8444-444444444444');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"c1111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"COORDINATOR"}}',true);
do $$begin
 insert into public.artist_dossiers(id,name,arabic_name,category,nationality,medium,event_id,biography,rationale)
 values('cn-case','Fictional artist','فنان افتراضي','Emerging','Test','Ink','islamic-arts-festival','Fictional biography','Fits the theme of light');
 insert into storage.objects(bucket_id,name) select 'artist-dossiers','nominations/cn-case/works/'||n||'.png' from generate_series(1,3) n;
 insert into public.sadu_case_works(dossier_id,title,source_credit,published_in,image_path,position)
 select 'cn-case','Work '||n,'Fictional credit','Fictional catalogue, 2025','nominations/cn-case/works/'||n||'.png',n from generate_series(1,3) n;

 -- Content notes ------------------------------------------------------------------------------
 insert into public.sadu_content_notes(dossier_id,origin,reported_by,note) values('cn-case','REPORTED','  An artist at the 2025 festival ','Fictional: known among artists for a contested series.');
 if not exists(select 1 from public.sadu_content_notes where dossier_id='cn-case' and recorded_by='c1111111-1111-4111-8111-111111111111' and reported_by='An artist at the 2025 festival') then raise exception 'Note not recorded by its author';end if;
 begin insert into public.sadu_content_notes(dossier_id,origin,note) values('cn-case','GOSSIP','Fictional note text');raise exception 'Unknown origin accepted';exception when check_violation then null;end;
 begin insert into public.sadu_content_notes(dossier_id,origin,reported_by,note) values('cn-case','TEAM','Someone','Fictional note text');raise exception 'A team note named a reporter';exception when check_violation then null;end;
 begin insert into public.sadu_content_notes(dossier_id,origin,note,raised_with_director_on) values('cn-case','TEAM','Fictional note text',current_date);raise exception 'A note was born already raised';exception when raise_exception then null;end;
 -- Dates: raised first, then the Chairman; each set once.
 begin update public.sadu_content_notes set chairman_consulted_on=current_date where dossier_id='cn-case';raise exception 'Chairman date before the Director';exception when check_violation then null;end;
 begin update public.sadu_content_notes set raised_with_director_on=current_date+1 where dossier_id='cn-case';raise exception 'Future date accepted';exception when raise_exception then null;end;
 update public.sadu_content_notes set raised_with_director_on=current_date where dossier_id='cn-case';
 update public.sadu_content_notes set chairman_consulted_on=current_date where dossier_id='cn-case';
 begin update public.sadu_content_notes set raised_with_director_on=null where dossier_id='cn-case';raise exception 'A date was cleared';exception when insufficient_privilege then null;end;
 begin update public.sadu_content_notes set note='Changed note text' where dossier_id='cn-case';raise exception 'A note was edited';exception when insufficient_privilege then null;end;
 begin delete from public.sadu_content_notes;raise exception 'A note was deleted';exception when insufficient_privilege then null;end;

 -- Reason types on a decision -----------------------------------------------------------------
 update public.artist_dossiers set status='PENDING_COMMITTEE_REVIEW' where id='cn-case';
 insert into storage.objects(bucket_id,name) values('artist-dossiers','nominations/committee-batches/islamic-arts-festival/cn.pptx');
 perform public.sadu_record_committee_batch('islamic-arts-festival',array['cn-case'],'nominations/committee-batches/islamic-arts-festival/cn.pptx','Committee presentation','en',repeat('c',64),1000);
 insert into storage.objects(bucket_id,name) values('artist-dossiers','nominations/cn-case/decision-evidence/e.pdf');
 begin insert into public.sadu_nomination_decisions(dossier_id,committee_recommendation,director_decision,decided_on,email_reference,minute,evidence_path,reason_types)
 values('cn-case','NOT_RECOMMENDED','DECLINED',current_date,'Email from the Committee','Over budget for this edition.','nominations/cn-case/decision-evidence/e.pdf',array['PRICE']);raise exception 'Unknown reason type accepted';exception when check_violation then null;end;
 begin insert into public.sadu_nomination_decisions(dossier_id,committee_recommendation,director_decision,decided_on,email_reference,minute,evidence_path,reason_types)
 values('cn-case','NOT_RECOMMENDED','DECLINED',current_date,'Email from the Committee','Over budget for this edition.','nominations/cn-case/decision-evidence/e.pdf',array[]::text[]);raise exception 'Empty reason types accepted';exception when check_violation then null;end;
 insert into public.sadu_nomination_decisions(dossier_id,committee_recommendation,director_decision,decided_on,email_reference,minute,evidence_path,reason_types)
 values('cn-case','NOT_RECOMMENDED','DECLINED',current_date,'Email from the Committee','Over budget for this edition.','nominations/cn-case/decision-evidence/e.pdf',array['BUDGET','LOGISTICS']);
end$$;

-- Another Coordinator and the General Coordinator do not see the note; the Director does.
select set_config('request.jwt.claims','{"sub":"c2222222-2222-4222-8222-222222222222","role":"authenticated","app_metadata":{"institutional_role":"COORDINATOR"}}',true);
do $$begin
 if exists(select 1 from public.sadu_content_notes where dossier_id='cn-case') then raise exception 'Another coordinator read the note';end if;
 if not exists(select 1 from public.sadu_nomination_decisions where dossier_id='cn-case' and 'BUDGET'=any(reason_types)) then raise exception 'Reason types not readable';end if;
 update public.sadu_content_notes set raised_with_director_on=current_date;
end$$;
select set_config('request.jwt.claims','{"sub":"c3333333-3333-4333-8333-333333333333","role":"authenticated","app_metadata":{"institutional_role":"GENERAL_COORDINATOR"}}',true);
do $$begin
 if exists(select 1 from public.sadu_content_notes) then raise exception 'General Coordinator read the note';end if;
 begin insert into public.sadu_content_notes(dossier_id,origin,note) values('cn-case','TEAM','Fictional note text');raise exception 'General Coordinator wrote a note';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claims','{"sub":"c4444444-4444-4444-8444-444444444444","role":"authenticated","app_metadata":{"institutional_role":"BIENNIAL_DIRECTOR"}}',true);
do $$begin
 if not exists(select 1 from public.sadu_content_notes where dossier_id='cn-case' and chairman_consulted_on=current_date) then raise exception 'Director cannot read the note';end if;
end$$;
reset role;
rollback;
