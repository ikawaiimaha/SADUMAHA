begin;
insert into auth.users(id) values('11111111-1111-4111-8111-111111111111');
insert into public.bilateral_contracts(id,artist_id,artist_name,status) values('catalog-test','11111111-1111-4111-8111-111111111111','Fictional metadata test','ARTIST_APPROVED');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","institutional_role":"ARTIST"}',true);
insert into public.sadu_exhibition_scenarios(id,contract_id,artist_id,artwork_checklist) values('22222222-2222-4222-8222-222222222222','catalog-test','11111111-1111-4111-8111-111111111111','[{"id":"33333333-3333-4333-8333-333333333333","name":"Wall 1","artworkCount":1,"medium":"Print","displaySpecifications":"Matte glass","printRequired":true,"avRequired":false,"darkRoom":false}]');
insert into public.sadu_scenario_media values('11111111-1111-4111-8111-111111111111/scenarios/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/PRINT/test.png','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','PRINT','test.png');
insert into storage.objects(bucket_id,name,metadata) values('logistics-secure','11111111-1111-4111-8111-111111111111/scenarios/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/PRINT/test.png','{"size":100,"mimetype":"image/png"}');
do $$begin
 begin update public.sadu_exhibition_scenarios set status='SUBMITTED' where contract_id='catalog-test';raise exception 'TEST: missing labels accepted';exception when others then if SQLERRM not like 'Every artwork requires%' then raise;end if;end;
end$$;
insert into public.sadu_artwork_checklist(id,scenario_id,zone_id,media_object_name,source,production_year,height_cm,width_cm,weight_kg,crate_count) values('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111/scenarios/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/PRINT/test.png','{"title":"Balance","language":"ar","medium":"Ink","concept":"A study of balance","bio":"Fictional biography"}',2026,100,80,20,1);
update public.sadu_exhibition_scenarios set status='SUBMITTED' where contract_id='catalog-test';
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"LOGISTICS"}}',true);
do $$begin
 if not exists(select 1 from public.sadu_artwork_checklist where width_cm=80 and translation_status='PENDING_TRANSLATION') then raise exception 'Dimensions blocked';end if;
 update public.sadu_artwork_checklist set translation_status='TRANSLATION_COMPLETED';if found then raise exception 'Logistics approval';end if;
end $$;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"EDITORIAL"}}',true);
do $$begin
 begin update public.sadu_artwork_checklist set translation_ar='{}',translation_status='TRANSLATION_COMPLETED';raise exception 'Missing English accepted';exception when others then if SQLERRM not like 'Bilingual public text%' then raise;end if;end;
end $$;
update public.sadu_artwork_checklist set translation_en='{"title":"Balance","medium":"Ink","concept":"A study of balance","bio":"Fictional biography"}',translation_status='TRANSLATION_COMPLETED';
do $$begin
 if not exists(select 1 from public.sadu_artwork_checklist where translation_ar=source and translation_en->>'title'='Balance' and translated_by=auth.uid() and jsonb_array_length(translation_receipts)=1 and translation_policy->'flight_itinerary'->>'requires_translation'='false') then raise exception 'Approval projection invalid';end if;
 update public.sadu_artwork_checklist set translation_en='{}';if found then raise exception 'Approved text mutable';end if;
 begin update public.sadu_artwork_checklist set source='{}';raise exception 'Source mutation';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"ARTIST"}}',true);
do $$begin if not exists(select 1 from public.sadu_artwork_checklist where translation_en->>'title'='Balance') then raise exception 'Owner missing approved text';end if;end $$;
rollback;
