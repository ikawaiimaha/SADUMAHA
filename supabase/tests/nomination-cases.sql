-- Run after migrations; all test records roll back.
-- Nomination cases: Coordinator builds the case, the decision arrives by email and is recorded
-- with evidence; submitted cases and recorded decisions cannot change.
begin;
insert into auth.users(id) values
 ('b1111111-1111-4111-8111-111111111111'),('b2222222-2222-4222-8222-222222222222'),
 ('b3333333-3333-4333-8333-333333333333'),('b4444444-4444-4444-8444-444444444444');
set local role authenticated;
-- C1 = owner Coordinator, C2 = another Coordinator, K = Committee, A = Artist.
select set_config('request.jwt.claims','{"sub":"b1111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"COORDINATOR"}}',true);
do $$begin
 begin insert into public.artist_dossiers(id,name,arabic_name,category,nationality,medium) values('case-no-event','Fictional','فنان','Emerging','Test','Ink');raise exception 'Case without event accepted';exception when raise_exception then if SQLERRM not like 'A case belongs to an event%' then raise;end if;end;
 insert into public.artist_dossiers(id,name,arabic_name,category,nationality,medium,event_id,biography,rationale)
 values('case-approve','Fictional artist','فنان افتراضي','Emerging','Test','Ink','islamic-arts-festival','Fictional biography','Why this artist fits'),
       ('case-return','Second artist','فنان ثان','Established','Test','Wood','islamic-arts-festival','Fictional biography','Why this artist fits');
 if (select created_by from public.artist_dossiers where id='case-approve')<>'b1111111-1111-4111-8111-111111111111' then raise exception 'Owner not recorded';end if;
 -- Work images go only in the case's own folder; uploads only by the owner while a draft.
 insert into storage.objects(bucket_id,name) values('artist-dossiers','nominations/case-approve/works/1.png'),('artist-dossiers','nominations/case-return/works/1.png');
 begin insert into public.sadu_case_works(dossier_id,title,source_credit,image_path) values('case-approve','Bad path','Credit','nominations/case-return/works/1.png');raise exception 'Foreign image path accepted';exception when raise_exception then if SQLERRM not like 'Work images must be stored%' then raise;end if;end;
 insert into public.sadu_case_works(dossier_id,title,source_credit,image_path,position)
 select 'case-approve','Work '||n,'Fictional credit','nominations/case-approve/works/'||n||'.png',n from generate_series(1,2) n;
 insert into public.sadu_case_works(dossier_id,title,source_credit,image_path,position)
 select 'case-return','Work '||n,'Fictional credit','nominations/case-return/works/'||n||'.png',n from generate_series(1,3) n;
 -- Two works are not enough.
 begin update public.artist_dossiers set status='PENDING_COMMITTEE_REVIEW' where id='case-approve';raise exception 'Incomplete case submitted';exception when raise_exception then if SQLERRM not like 'Complete the case before submission%' then raise;end if;end;
 insert into public.sadu_case_works(dossier_id,title,source_credit,image_path,position) values('case-approve','Work 3','Fictional credit','nominations/case-approve/works/3.png',3);
end$$;

-- Another Coordinator cannot change the case, add works, or upload into it.
select set_config('request.jwt.claims','{"sub":"b2222222-2222-4222-8222-222222222222","role":"authenticated","app_metadata":{"institutional_role":"COORDINATOR"}}',true);
do $$begin
 begin update public.artist_dossiers set rationale='Changed' where id='case-approve';raise exception 'Other Coordinator edited the case';exception when insufficient_privilege then null;end;
 begin insert into public.sadu_case_works(dossier_id,title,source_credit,image_path) values('case-approve','Extra','Credit','nominations/case-approve/works/9.png');raise exception 'Other Coordinator added a work';exception when insufficient_privilege then null;end;
 begin insert into storage.objects(bucket_id,name) values('artist-dossiers','nominations/case-approve/works/9.png');raise exception 'Other Coordinator uploaded';exception when insufficient_privilege then null;end;
 if not exists(select 1 from public.artist_dossiers where id='case-approve') then raise exception 'Coordinators should read each other''s cases';end if;
end$$;

-- The artist sees nothing and cannot upload.
select set_config('request.jwt.claims','{"sub":"b4444444-4444-4444-8444-444444444444","role":"authenticated","app_metadata":{"institutional_role":"ARTIST"}}',true);
do $$begin
 if exists(select 1 from public.artist_dossiers) or exists(select 1 from public.sadu_case_works) then raise exception 'Artist read nomination cases';end if;
 if exists(select 1 from storage.objects where bucket_id='artist-dossiers' and name like 'nominations/%') then raise exception 'Artist read nomination files';end if;
 begin insert into storage.objects(bucket_id,name) values('artist-dossiers','nominations/case-approve/works/8.png');raise exception 'Artist uploaded';exception when insufficient_privilege then null;end;
end$$;

-- Owner submits both; submitted cases and their works are locked; mark as sent once.
select set_config('request.jwt.claims','{"sub":"b1111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"COORDINATOR"}}',true);
do $$begin
 update public.artist_dossiers set status='PENDING_COMMITTEE_REVIEW' where id in ('case-approve','case-return');
 if (select count(*) from public.artist_dossiers where status='PENDING_COMMITTEE_REVIEW' and id in ('case-approve','case-return'))<>2 then raise exception 'Submission failed';end if;
 update public.artist_dossiers set rationale='Changed' where id='case-approve';if FOUND then raise exception 'Submitted case editable';end if;
 begin delete from public.sadu_case_works where dossier_id='case-approve';raise exception 'Submitted works deletable';exception when insufficient_privilege then null;end;
 begin insert into storage.objects(bucket_id,name) values('artist-dossiers','nominations/case-approve/works/7.png');raise exception 'Upload into submitted case';exception when insufficient_privilege then null;end;
 if public.sadu_mark_nominations_sent(array['case-approve','case-return'])<>2 then raise exception 'Mark sent failed';end if;
 if public.sadu_mark_nominations_sent(array['case-approve'])<>0 then raise exception 'Marked sent twice';end if;
end$$;

-- The Committee role cannot record an email decision; that is the Coordinator's record.
select set_config('request.jwt.claims','{"sub":"b3333333-3333-4333-8333-333333333333","role":"authenticated","app_metadata":{"institutional_role":"PREPARATORY_COMMITTEE"}}',true);
do $$begin
 if (select count(*) from public.sadu_case_works where dossier_id='case-approve')<>3 then raise exception 'Committee cannot read works';end if;
 begin insert into public.sadu_nomination_decisions(dossier_id,committee_recommendation,director_decision,decided_on,email_reference,minute,evidence_path)
  values('case-approve','RECOMMENDED','APPROVED',current_date,'Email from Committee','Recommended unanimously','nominations/case-approve/decision-evidence/e.pdf');
  raise exception 'Committee recorded an email decision';exception when insufficient_privilege then null;end;
end$$;

-- Owner records decisions from email.
select set_config('request.jwt.claims','{"sub":"b1111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"COORDINATOR"}}',true);
do $$begin
 -- Evidence is required and must exist.
 begin insert into public.sadu_nomination_decisions(dossier_id,committee_recommendation,director_decision,decided_on,email_reference,minute,evidence_path)
  values('case-approve','RECOMMENDED','APPROVED',current_date,'Email from Committee','Recommended unanimously','nominations/case-approve/decision-evidence/e.pdf');
  raise exception 'Decision without evidence accepted';exception when raise_exception then if SQLERRM not like 'Attach the decision email%' then raise;end if;end;
 insert into storage.objects(bucket_id,name) values('artist-dossiers','nominations/case-approve/decision-evidence/e.pdf'),('artist-dossiers','nominations/case-return/decision-evidence/e.pdf');
 begin insert into public.sadu_nomination_decisions(dossier_id,committee_recommendation,director_decision,decided_on,email_reference,minute,evidence_path)
  values('case-approve','RECOMMENDED','APPROVED',current_date+1,'Email from Committee','Recommended unanimously','nominations/case-approve/decision-evidence/e.pdf');
  raise exception 'Future decision date accepted';exception when raise_exception then if SQLERRM not like 'The decision date must fall%' then raise;end if;end;
 begin insert into public.sadu_nomination_decisions(dossier_id,committee_recommendation,director_decision,decided_on,email_reference,minute,evidence_path)
  values('case-approve','RECOMMENDED','APPROVED',current_date,'Email from Committee','short','nominations/case-approve/decision-evidence/e.pdf');
  raise exception 'Short minute accepted';exception when check_violation then null;end;

 insert into public.sadu_nomination_decisions(dossier_id,committee_recommendation,director_decision,decided_on,email_reference,minute,evidence_path)
 values('case-approve','RECOMMENDED','APPROVED',current_date,'  Email from the Committee, 14 Oct  ','  Recommended; the Director confirmed.  ','nominations/case-approve/decision-evidence/e.pdf');
 if not exists(select 1 from public.artist_dossiers where id='case-approve' and status='DIRECTOR_APPROVED' and committee_recommendation='RECOMMENDED' and committee_minutes='Recommended; the Director confirmed.' and committee_reviewed_by='b1111111-1111-4111-8111-111111111111') then raise exception 'Approval not applied';end if;
 -- Recorded decisions cannot change, and a decided case takes no second decision.
 begin update public.sadu_nomination_decisions set minute='Rewritten minute text' where dossier_id='case-approve';raise exception 'Decision editable';exception when insufficient_privilege then null;end;
 begin delete from public.sadu_nomination_decisions where dossier_id='case-approve';raise exception 'Decision deletable';exception when insufficient_privilege then null;end;
 begin insert into public.sadu_nomination_decisions(dossier_id,committee_recommendation,director_decision,decided_on,email_reference,minute,evidence_path)
  values('case-approve','RECOMMENDED','DECLINED',current_date,'Second email','Changed our mind later','nominations/case-approve/decision-evidence/e.pdf');
  raise exception 'Second decision accepted';exception when insufficient_privilege then null;end;

 -- Returned for more information: back to draft, editable again, history kept.
 insert into public.sadu_nomination_decisions(dossier_id,committee_recommendation,director_decision,decided_on,email_reference,minute,evidence_path)
 values('case-return','NOT_RECOMMENDED','RETURNED',current_date,'Email from the Committee','Add works from the last five years','nominations/case-return/decision-evidence/e.pdf');
 if not exists(select 1 from public.artist_dossiers where id='case-return' and status='INCOMPLETE_DOSSIER' and sent_to_committee_at is null and committee_recommendation is null) then raise exception 'Return not applied';end if;
 update public.artist_dossiers set rationale='Updated rationale' where id='case-return';if not FOUND then raise exception 'Returned case not editable';end if;
 if (select count(*) from public.sadu_nomination_decisions)<>2 then raise exception 'Decision history incomplete';end if;

 -- Export records.
 insert into public.sadu_export_log(event_id,kind,dossier_ids) values('islamic-arts-festival','ALL',array['case-approve','case-return']);
end$$;

select set_config('request.jwt.claims','{"sub":"b4444444-4444-4444-8444-444444444444","role":"authenticated","app_metadata":{"institutional_role":"ARTIST"}}',true);
do $$begin
 begin insert into public.sadu_export_log(event_id,kind,dossier_ids) values('islamic-arts-festival','CASE',array['case-approve']);raise exception 'Artist recorded an export';exception when insufficient_privilege then null;end;
 if exists(select 1 from public.sadu_nomination_decisions) then raise exception 'Artist read decisions';end if;
end$$;
reset role;
rollback;
