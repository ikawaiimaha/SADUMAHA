-- Requires installation-manifest.sql. Rollback-only fixtures.
begin;
insert into auth.users(id) values('11111111-1111-4111-8111-111111111111');
insert into public.bilateral_contracts(id,artist_id,artist_name,status) values('catalog-test','11111111-1111-4111-8111-111111111111','Fictional metadata test','ARTIST_APPROVED');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","institutional_role":"ARTIST"}',true);
insert into public.sadu_exhibition_scenarios(id,contract_id,artist_id,artwork_checklist) values('22222222-2222-4222-8222-222222222222','catalog-test','11111111-1111-4111-8111-111111111111','[{"id":"33333333-3333-4333-8333-333333333333","name":"Wall 1","artworkCount":1,"medium":"Print","displaySpecifications":"Matte glass","printRequired":true,"avRequired":false,"darkRoom":false}]');
insert into public.sadu_scenario_media values('11111111-1111-4111-8111-111111111111/scenarios/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/PRINT/test.png','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','PRINT','test.png','{"title":"Balance","medium":"Ink","year":"2026","height":"100","width":"80","depth":"2"}');
insert into storage.objects(bucket_id,name,metadata) values('logistics-secure','11111111-1111-4111-8111-111111111111/scenarios/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/PRINT/test.png','{"size":100,"mimetype":"image/png"}');
do $$begin begin insert into public.sadu_artwork_checklist(id,scenario_id,zone_id,media_object_name,source,production_year,height_cm,width_cm,weight_kg,crate_count,religious_text) values('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111/scenarios/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/PRINT/test.png','{"title":"Balance","language":"ar","medium":"Ink","concept":"A study of balance","bio":"Fictional biography"}',2026,100,80,20,1,null); raise exception 'Missing declaration accepted';exception when others then if SQLERRM not like 'Explicit religious text declaration required%' then raise;end if;end;end $$;
insert into public.sadu_artwork_checklist(id,scenario_id,zone_id,media_object_name,source,production_year,height_cm,width_cm,weight_kg,crate_count,religious_text) values('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111/scenarios/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/PRINT/test.png','{"title":"Balance","language":"ar","medium":"Ink","concept":"A study of balance","bio":"Fictional biography"}',2026,100,80,20,1,false);


insert into public.sadu_exhibition_titles(scenario_id,title_ar,title_en) values('22222222-2222-4222-8222-222222222222','معرض','Test Exhibition');
do $$begin
 update public.sadu_exhibition_titles set status='LOCKED';
 if exists(select 1 from public.sadu_exhibition_titles where status='LOCKED') then raise exception 'Artist locked title';end if;
end $$;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"HIP"}}',true);
update public.sadu_exhibition_titles set status='LOCKED';
do $$begin
 if not exists(select 1 from public.sadu_exhibition_titles where status='LOCKED' and locked_at is not null) then raise exception 'Title not locked';end if;
 begin update public.sadu_exhibition_titles set title_en='Overwrite';raise exception 'Editable title';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"ARTIST"}}',true);
select public.sadu_issue_consignment('44444444-4444-4444-8444-444444444444','ARTIST_STUDIO',null,null);
-- Historical shipping fixture: bypass date-window triggers only during setup.
reset role;set local session_replication_role=replica;
insert into public.sadu_freight_bookings(id,artwork_id,artist_id,ready_date,address,map_url) values('66666666-6666-4666-8666-666666666666','44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','2026-09-03','{"country":"AE","city":"Sharjah","district":"Test","street":"Test","building":"Test"}','https://maps.google.com/test');
set local session_replication_role=origin;set local role authenticated;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"LOGISTICS"}}',true);
do $$begin begin
 insert into public.sadu_arrival_receipts(booking_id,facility,all_crates_received) values('66666666-6666-4666-8666-666666666666','Museum dock',true);raise exception 'Undispatched arrival allowed';
 exception when others then if SQLERRM not like 'Dispatched artwork required%' then raise;end if;end;end $$;
update public.sadu_freight_bookings set status='IN_TRANSIT';
insert into public.sadu_arrival_receipts(booking_id,facility,all_crates_received) values('66666666-6666-4666-8666-666666666666','Museum dock',true);
do $$begin
 if exists(select 1 from public.sadu_freight_bookings where status<>'IN_TRANSIT') then raise exception 'Arrival changed condition status';end if;
 begin insert into public.sadu_arrival_receipts(booking_id,facility,all_crates_received) values('66666666-6666-4666-8666-666666666666','Museum dock',true);raise exception 'Duplicate receipt';exception when unique_violation then null;end;
 begin delete from public.sadu_arrival_receipts;raise exception 'Receipt deleted';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"TECHNICAL"}}',true);
do $$begin
 if not exists(select 1 from public.sadu_arrival_receipts where facility='Museum dock') then raise exception 'Technical missing receipt';end if;
 if exists(select 1 from public.sadu_freight_bookings) then raise exception 'Technical sees private freight address';end if;
 begin insert into public.sadu_arrival_receipts(booking_id,facility,all_crates_received) values('66666666-6666-4666-8666-666666666666','Museum dock',true);raise exception 'Technical records arrival';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated","app_metadata":{"institutional_role":"ARTIST"}}',true);
do $$begin if exists(select 1 from public.sadu_arrival_receipts) then raise exception 'Other artist sees receipt';end if;end $$;
rollback;
