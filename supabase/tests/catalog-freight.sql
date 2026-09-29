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
insert into public.sadu_artwork_checklist(id,scenario_id,zone_id,media_object_name,source,production_year,height_cm,width_cm,weight_kg,crate_count) values('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111/scenarios/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/PRINT/test.png','{"title":"Balance","language":"en","medium":"Ink","concept":"A study of balance","bio":"Fictional biography"}',2026,100,80,20,1);
update public.sadu_exhibition_scenarios set status='SUBMITTED' where contract_id='catalog-test';
insert into public.sadu_freight_bookings(id,artwork_id,artist_id,ready_date,address,map_url) values('66666666-6666-4666-8666-666666666666','44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111',current_date+7,'{"country":"France","city":"Paris","district":"Test","street":"Test","building":"Test"}','https://maps.google.com/?q=fictional');
do $$begin
 begin update public.sadu_artwork_checklist set width_cm=1;raise exception 'TEST: source mutation';exception when insufficient_privilege then null;end;
 begin update public.sadu_freight_bookings set ready_date=current_date+8;raise exception 'TEST: direct date mutation';exception when others then if SQLERRM not like 'Valid artist date-change%' then raise;end if;end;
end$$;
update public.sadu_freight_bookings set requested_date=current_date+8,change_reason='Travel change',change_status='PENDING';
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"LOGISTICS"}}',true);
do $$begin
 if not exists(select 1 from public.sadu_artwork_checklist where translation_status='PENDING_TRANSLATION' and width_cm=80) then raise exception 'TEST: dimensions blocked by translation';end if;
 begin update public.sadu_freight_bookings set status='IN_TRANSIT';raise exception 'TEST: pending change dispatch';exception when others then if SQLERRM not like 'No direct date edits%' then raise;end if;end;
end$$;
update public.sadu_freight_bookings set change_status='APPROVED';
update public.sadu_freight_bookings set status='IN_TRANSIT';
do $$begin
 begin update public.sadu_freight_bookings set status='RECEIVED_CONDITION_CHECKED';raise exception 'TEST: receipt without evidence';exception when others then if SQLERRM not like 'Condition inspection%' then raise;end if;end;
end$$;
update public.sadu_freight_bookings set status='CUSTOMS_CLEARANCE';
update public.sadu_freight_bookings set status='RECEIVED_CONDITION_CHECKED',condition_reference='Inspected INTACT report 123';
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"EDITORIAL"}}',true);
update public.sadu_artwork_checklist set translation_ar='{"title":"ميزان","medium":"حبر","concept":"دراسة التوازن","bio":"سيرة تجريبية"}',translation_status='TRANSLATION_COMPLETED';
do $$begin
 if not exists(select 1 from public.sadu_artwork_checklist where translation_status='TRANSLATION_COMPLETED' and translated_by=auth.uid() and translated_at is not null) then raise exception 'TEST: translation not recorded';end if;
 update public.sadu_artwork_checklist set translation_ar='{}';if found then raise exception 'TEST: approved translation mutable';end if;
end$$;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","user_metadata":{"institutional_role":"EDITORIAL"}}',true);
do $$begin
 if exists(select 1 from public.sadu_artwork_checklist) or exists(select 1 from public.sadu_freight_bookings) then raise exception 'TEST: cross-artist or untrusted role leak';end if;
end$$;
rollback;
