begin;
insert into auth.users(id) values('11111111-1111-4111-8111-111111111111');
insert into public.bilateral_contracts(id,artist_id,artist_name,status) values('scenario-test','11111111-1111-4111-8111-111111111111','Fictional scenario test','ARTIST_APPROVED');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","institutional_role":"ARTIST"}',true);
insert into public.sadu_exhibition_scenarios(id,contract_id,artist_id,artwork_checklist) values('22222222-2222-4222-8222-222222222222','scenario-test','11111111-1111-4111-8111-111111111111','[{"id":"33333333-3333-4333-8333-333333333333","name":"Wall 1","artworkCount":1,"medium":"Print","displaySpecifications":"Matte glass","printRequired":true,"avRequired":false,"darkRoom":false}]');
do $$begin
 begin update public.sadu_exhibition_scenarios set status='SUBMITTED' where contract_id='scenario-test'; raise exception 'TEST failed: missing media accepted'; exception when others then if SQLERRM not like 'Uploaded media missing%' and SQLERRM not like 'Every artwork requires%' then raise;end if;end;
end$$;
insert into public.sadu_scenario_media values('11111111-1111-4111-8111-111111111111/scenarios/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/PRINT/test.png','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','PRINT','test.png');
-- SQL fixture represents an object already committed by Storage, not an actual upload.
insert into storage.objects(bucket_id,name,metadata) values('logistics-secure','11111111-1111-4111-8111-111111111111/scenarios/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/PRINT/test.png','{"size":100,"mimetype":"image/png"}');
insert into public.sadu_artwork_checklist(scenario_id,zone_id,media_object_name,source,production_year,height_cm,width_cm,weight_kg,crate_count) values('22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111/scenarios/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/PRINT/test.png','{"title":"Test","language":"en","medium":"Ink","concept":"Test concept"}',2026,100,80,20,1);
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
-- A real passport registry fixture makes the negative disclosure assertion meaningful.
reset role;
insert into public.sadu_contract_intake(id,contract_id,artist_id,kind,object_name,file_name) values ('55555555-5555-4555-8555-555555555555','scenario-test','11111111-1111-4111-8111-111111111111','PASSPORT','11111111-1111-4111-8111-111111111111/contract-intake/55555555-5555-4555-8555-555555555555/passport.pdf','passport.pdf');
set local role authenticated;
-- Technical can inspect only submitted scenario media, not passport intake.
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated","app_metadata":{"institutional_role":"TECHNICAL"}}',true);
do $$begin
 if not exists(select 1 from public.sadu_asset_escrow where contract_id='scenario-test' and escrow_ready) then raise exception 'Technical escrow missing';end if;
 if not exists(select 1 from storage.objects where bucket_id='logistics-secure' and name like '%/PRINT/test.png') then raise exception 'Technical download inaccessible';end if;
 if exists(select 1 from public.sadu_contract_intake where kind='PASSPORT') then raise exception 'Passport disclosure';end if;
 update public.sadu_exhibition_scenarios set status='DRAFT' where contract_id='scenario-test';if FOUND then raise exception 'Technical edited scenario';end if;
end$$;
-- Missing bytes revoke readiness even when the final checklist was once submitted.
reset role;
update storage.objects set metadata=jsonb_set(metadata,'{size}','0') where name like '%/PRINT/test.png' and bucket_id='logistics-secure';
set local role authenticated;
do $$begin if exists(select 1 from public.sadu_asset_escrow where contract_id='scenario-test' and escrow_ready) then raise exception 'Missing asset still ready';end if;end$$;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated","app_metadata":{"institutional_role":"PR_PROTOCOL"}}',true);
do $$begin if exists(select 1 from public.sadu_asset_escrow where contract_id='scenario-test') then raise exception 'PR escrow leak';end if;end$$;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated","user_metadata":{"institutional_role":"TECHNICAL"}}',true);
do $$begin if exists(select 1 from public.sadu_asset_escrow where contract_id='scenario-test') then raise exception 'Editable role claim escalation';end if;end$$;
rollback;
