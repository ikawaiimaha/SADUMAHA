begin;
insert into auth.users(id) values('11111111-1111-4111-8111-111111111111');
insert into public.bilateral_contracts(id,artist_id,artist_name,status) values('scenario-test','11111111-1111-4111-8111-111111111111','Fictional scenario test','ARTIST_APPROVED');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","institutional_role":"ARTIST"}',true);
insert into public.sadu_exhibition_scenarios(id,contract_id,artist_id,artwork_checklist) values('22222222-2222-4222-8222-222222222222','scenario-test','11111111-1111-4111-8111-111111111111','[{"id":"33333333-3333-4333-8333-333333333333","name":"Wall 1","artworkCount":2,"medium":"Print","displaySpecifications":"Matte glass","printRequired":true,"avRequired":false,"darkRoom":false}]');
do $$begin
 begin update public.sadu_exhibition_scenarios set status='SUBMITTED' where contract_id='scenario-test'; raise exception 'TEST failed: missing media accepted'; exception when others then if SQLERRM not like 'Uploaded media missing%' then raise;end if;end;
end$$;
insert into public.sadu_scenario_media values('11111111-1111-4111-8111-111111111111/scenarios/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/PRINT/test.png','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','PRINT','test.png');
-- SQL fixture represents an object already committed by Storage, not an actual upload.
insert into storage.objects(bucket_id,name,metadata) values('logistics-secure','11111111-1111-4111-8111-111111111111/scenarios/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/PRINT/test.png','{"size":100,"mimetype":"image/png"}');
update public.sadu_exhibition_scenarios set status='SUBMITTED' where contract_id='scenario-test';
do $$begin
 if (select status from public.sadu_exhibition_scenarios where contract_id='scenario-test')<>'SUBMITTED' then raise exception 'Submission failed';end if;
 update public.sadu_exhibition_scenarios set artwork_checklist='[]' where contract_id='scenario-test'; if FOUND then raise exception 'Immutable lock failed';end if;
end$$;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated","institutional_role":"ARTIST"}',true);
do $$begin if exists(select 1 from public.sadu_exhibition_scenarios where contract_id='scenario-test') then raise exception 'Cross artist data leak';end if;end$$;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated","institutional_role":"PR_PROTOCOL"}',true);
do $$begin if exists(select 1 from public.sadu_scenario_media) then raise exception 'PR media leak';end if;end$$;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated","app_metadata":{"institutional_role":"LOGISTICS"}}',true);
do $$begin if not exists(select 1 from public.sadu_exhibition_scenarios where contract_id='scenario-test') then raise exception 'Logistics checklist invisible';end if;end$$;
rollback;
