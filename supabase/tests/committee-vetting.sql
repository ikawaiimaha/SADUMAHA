-- Run after migrations; all test records roll back.
-- Stage 4: the Committee records a recommendation minute and never approves or rejects;
-- the Biennial Director makes the executive decision.
begin;
insert into public.artist_dossiers(id,name,arabic_name,category,nationality,medium,status,cv_url,portfolio_url,mockups_url,event_id,biography,rationale) values
 ('committee-test','Fictional artist','فنان','Emerging','Test','Ink','INCOMPLETE_DOSSIER','cv.pdf','portfolio.pdf','mockup.png','islamic-arts-festival','Fictional biography','Fictional rationale'),
 ('committee-not-recommended','Fictional artist','فنان','Emerging','Test','Ink','PENDING_COMMITTEE_REVIEW','cv.pdf','portfolio.pdf','mockup.png',null,null,null),
 ('committee-hold','Fictional artist','فنان','Emerging','Test','Ink','HIP_BLOCKED','cv.pdf','portfolio.pdf','mockup.png',null,null,null),
 ('committee-legacy','Fictional artist','فنان','Emerging','Test','Ink','COMMITTEE_REJECTED','cv.pdf','portfolio.pdf','mockup.png',null,null,null);
-- A nomination case needs at least 3 credited works before submission.
insert into public.sadu_case_works(dossier_id,title,source_credit,image_path)
select 'committee-test','Work '||n,'Fictional credit','nominations/committee-test/works/'||n||'.png' from generate_series(1,3) n;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"COORDINATOR"}}',true);
do $$begin
 begin update public.artist_dossiers set status='PENDING_DIRECTOR_REVIEW' where id='committee-test';raise exception 'Coordinator bypass';exception when insufficient_privilege then null;end;
 update public.artist_dossiers set status='PENDING_COMMITTEE_REVIEW' where id='committee-test';if not FOUND then raise exception 'Submission failed';end if;
 update public.artist_dossiers set medium='Changed' where id='committee-test';if FOUND then raise exception 'Submitted dossier mutable';end if;
end$$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","app_metadata":{"institutional_role":"BIENNIAL_DIRECTOR"}}',true);
do $$begin update public.artist_dossiers set status='DIRECTOR_APPROVED' where id='committee-test';if FOUND then raise exception 'Director decided before a Committee minute';end if;end$$;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated","app_metadata":{"institutional_role":"PREPARATORY_COMMITTEE"}}',true);
do $$begin
 begin update public.artist_dossiers set status='PENDING_DIRECTOR_REVIEW',committee_recommendation='RECOMMENDED',committee_minutes='Collective recommendation minute',medium='Changed' where id='committee-test';raise exception 'Committee edited content';exception when insufficient_privilege then null;end;
 -- COMMITTEE_REJECTED is no longer a Committee outcome.
 begin update public.artist_dossiers set status='COMMITTEE_REJECTED',committee_recommendation='NOT_RECOMMENDED',committee_minutes='Collective minute: scope mismatch' where id='committee-not-recommended';raise exception 'Committee rejected a dossier';exception when insufficient_privilege then null;end;
 -- A recommendation and a minute of at least 10 characters are both required.
 begin update public.artist_dossiers set status='PENDING_DIRECTOR_REVIEW',committee_recommendation='RECOMMENDED',committee_minutes='  short  ' where id='committee-test';raise exception 'Short minute accepted';exception when raise_exception then if SQLERRM not like 'A recommendation and a minute%' then raise;end if;end;
 begin update public.artist_dossiers set status='PENDING_DIRECTOR_REVIEW',committee_minutes='Collective minute without an outcome' where id='committee-test';raise exception 'Missing recommendation accepted';exception when raise_exception then if SQLERRM not like 'A recommendation and a minute%' then raise;end if;end;
 begin update public.artist_dossiers set status='PENDING_DIRECTOR_REVIEW',committee_recommendation='APPROVED',committee_minutes='Collective approval minute' where id='committee-test';raise exception 'Unknown recommendation accepted';exception when check_violation then null;end;
 update public.artist_dossiers set status='PENDING_DIRECTOR_REVIEW',committee_recommendation='RECOMMENDED',committee_minutes='  Collective recommendation minute  ' where id='committee-test';if not FOUND then raise exception 'Recommendation failed';end if;
 if not exists(select 1 from public.artist_dossiers where id='committee-test' and committee_minutes='Collective recommendation minute' and committee_reviewed_at is not null and committee_reviewed_by=auth.uid()) then raise exception 'Missing reviewer evidence';end if;
 update public.artist_dossiers set status='PENDING_DIRECTOR_REVIEW',committee_recommendation='NOT_RECOMMENDED',committee_minutes='Collective minute: scope mismatch' where id='committee-not-recommended';if not FOUND then raise exception 'Not-recommended minute was not forwarded';end if;
 update public.artist_dossiers set committee_recommendation='RECOMMENDED' where id='committee-not-recommended';if FOUND then raise exception 'Recorded minute overwritten';end if;
 update public.artist_dossiers set status='PENDING_DIRECTOR_REVIEW',committee_recommendation='RECOMMENDED',committee_minutes='Collective recommendation minute' where id='committee-hold';if FOUND then raise exception 'Compliance hold bypassed';end if;
 update public.artist_dossiers set status='PENDING_DIRECTOR_REVIEW',committee_recommendation='RECOMMENDED',committee_minutes='Collective recommendation minute' where id='committee-legacy';if FOUND then raise exception 'Legacy rejection reopened';end if;
end$$;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated","app_metadata":{"institutional_role":"HIP"},"user_metadata":{"institutional_role":"PREPARATORY_COMMITTEE"}}',true);
do $$begin
 update public.artist_dossiers set status='PENDING_DIRECTOR_REVIEW',committee_recommendation='RECOMMENDED',committee_minutes='Unauthorized minute' where id='committee-test';if FOUND then raise exception 'HIP update permitted';end if;
 delete from public.artist_dossiers where id='committee-test';if FOUND then raise exception 'HIP delete permitted';end if;
end$$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","app_metadata":{"institutional_role":"BIENNIAL_DIRECTOR"}}',true);
do $$begin
 update public.artist_dossiers set status='DIRECTOR_APPROVED' where id='committee-test';if not FOUND then raise exception 'Director decision on a recommended dossier failed';end if;
 update public.artist_dossiers set status='DIRECTOR_VETOED',rejection_reason='Replay' where id='committee-test';if FOUND then raise exception 'Director replay allowed';end if;
 -- The executive decision is the Director's even without a Committee recommendation.
 begin update public.artist_dossiers set status='DIRECTOR_VETOED' where id='committee-not-recommended';raise exception 'Veto without a reason accepted';exception when raise_exception then if SQLERRM not like 'Director veto requires a reason%' then raise;end if;end;
 update public.artist_dossiers set status='DIRECTOR_VETOED',rejection_reason='Scope outside the brief' where id='committee-not-recommended';if not FOUND then raise exception 'Director decision on a not-recommended dossier failed';end if;
 update public.artist_dossiers set status='DIRECTOR_APPROVED' where id='committee-legacy';if FOUND then raise exception 'Director acted on a legacy rejection';end if;
end$$;
reset role;
-- A future overly permissive policy still cannot grant HIP mutation through the trigger.
create policy test_unsafe_hip on public.artist_dossiers for all to authenticated using(true) with check(true);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated","app_metadata":{"institutional_role":"HIP"}}',true);
do $$begin
 begin update public.artist_dossiers set status='COMMITTEE_REJECTED' where id='committee-test';raise exception 'Trigger HIP bypass';exception when insufficient_privilege then null;end;
 begin delete from public.artist_dossiers where id='committee-test';raise exception 'Trigger HIP delete bypass';exception when insufficient_privilege then null;end;
end$$;
rollback;
