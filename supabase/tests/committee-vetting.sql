-- Run after migration.sql; all test records roll back.
begin;
insert into public.artist_dossiers(id,name,arabic_name,category,nationality,medium,status,cv_url,portfolio_url,mockups_url) values
 ('committee-test','Fictional artist','فنان','Emerging','Test','Ink','INCOMPLETE_DOSSIER','cv.pdf','portfolio.pdf','mockup.png'),
 ('committee-reject','Fictional artist','فنان','Emerging','Test','Ink','PENDING_COMMITTEE_REVIEW','cv.pdf','portfolio.pdf','mockup.png'),
 ('committee-hold','Fictional artist','فنان','Emerging','Test','Ink','HIP_BLOCKED','cv.pdf','portfolio.pdf','mockup.png');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"COORDINATOR"}}',true);
do $$begin
 begin update public.artist_dossiers set status='PENDING_DIRECTOR_REVIEW' where id='committee-test';raise exception 'Coordinator bypass';exception when insufficient_privilege then null;end;
 update public.artist_dossiers set status='PENDING_COMMITTEE_REVIEW' where id='committee-test';if not FOUND then raise exception 'Submission failed';end if;
 update public.artist_dossiers set medium='Changed' where id='committee-test';if FOUND then raise exception 'Submitted dossier mutable';end if;
end$$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","app_metadata":{"institutional_role":"BIENNIAL_DIRECTOR"}}',true);
do $$begin update public.artist_dossiers set status='DIRECTOR_APPROVED' where id='committee-test';if FOUND then raise exception 'Director bypass';end if;end$$;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated","app_metadata":{"institutional_role":"PREPARATORY_COMMITTEE"}}',true);
do $$begin
 begin update public.artist_dossiers set status='PENDING_DIRECTOR_REVIEW',medium='Changed' where id='committee-test';raise exception 'Committee edited content';exception when insufficient_privilege then null;end;
 begin update public.artist_dossiers set status='COMMITTEE_REJECTED',committee_minutes=' ' where id='committee-test';raise exception 'Missing rejection minutes accepted';exception when raise_exception then if SQLERRM not like 'Rejection requires%' then raise;end if;end;
 update public.artist_dossiers set status='PENDING_DIRECTOR_REVIEW',committee_minutes='Collective endorsement' where id='committee-test';if not FOUND then raise exception 'Endorsement failed';end if;
 if not exists(select 1 from public.artist_dossiers where id='committee-test' and committee_reviewed_at is not null and committee_reviewed_by=auth.uid()) then raise exception 'Missing reviewer evidence';end if;
 update public.artist_dossiers set status='COMMITTEE_REJECTED',committee_minutes='Consensus: unsuitable scope' where id='committee-reject';if not FOUND then raise exception 'Rejection failed';end if;
 update public.artist_dossiers set status='PENDING_DIRECTOR_REVIEW' where id='committee-reject';if FOUND then raise exception 'Rejection overwritten';end if;
 update public.artist_dossiers set status='PENDING_DIRECTOR_REVIEW' where id='committee-hold';if FOUND then raise exception 'Compliance hold bypassed';end if;
end$$;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated","app_metadata":{"institutional_role":"HIP"},"user_metadata":{"institutional_role":"PREPARATORY_COMMITTEE"}}',true);
do $$begin
 update public.artist_dossiers set status='COMMITTEE_REJECTED',committee_minutes='Unauthorized' where id='committee-test';if FOUND then raise exception 'HIP update permitted';end if;
 delete from public.artist_dossiers where id='committee-test';if FOUND then raise exception 'HIP delete permitted';end if;
end$$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","app_metadata":{"institutional_role":"BIENNIAL_DIRECTOR"}}',true);
do $$begin
 update public.artist_dossiers set status='DIRECTOR_APPROVED' where id='committee-test';if not FOUND then raise exception 'Director endorsement handoff failed';end if;
 update public.artist_dossiers set status='DIRECTOR_VETOED',rejection_reason='Replay' where id='committee-test';if FOUND then raise exception 'Director replay allowed';end if;
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
