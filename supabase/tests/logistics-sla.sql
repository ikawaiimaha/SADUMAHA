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


do $$begin perform set_config('test.freight.token',public.sadu_issue_consignment('44444444-4444-4444-8444-444444444444','THIRD_PARTY_GALLERY','Test Gallery','gallery@example.invalid'),true);end $$;
reset role;
insert into auth.users(id,raw_app_meta_data) values('88888888-8888-4888-8888-888888888888','{"institutional_role":"EXTERNAL_VENDOR"}'),('99999999-9999-4999-8999-999999999999','{"institutional_role":"HIP"}');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"LOGISTICS"}}',true);
insert into public.sadu_freight_assignments(consignment_id,vendor_id,curator_id,closure_start,reopens_on,facility_timezone) select id,'88888888-8888-4888-8888-888888888888','99999999-9999-4999-8999-999999999999','2026-07-25','2026-09-02','Europe/Paris' from public.sadu_consignments;
do $$begin if not exists(select 1 from public.sadu_freight_assignments where details_due='2026-07-20') then raise exception 'Incorrect deadline';end if;end $$;
reset role;
select sadu_private.escalate_freight_closures();select sadu_private.escalate_freight_closures();
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"88888888-8888-4888-8888-888888888888","role":"authenticated","app_metadata":{"institutional_role":"EXTERNAL_VENDOR"}}',true);
do $$begin
 if (select count(*) from public.sadu_freight_alerts where status='OPEN')<>1 then raise exception 'Missing or duplicate vendor alert';end if;
 if (select count(*) from public.sadu_consignments)<>1 then raise exception 'Missing assigned consignment';end if;
 if exists(select 1 from public.sadu_artwork_checklist) then raise exception 'Vendor dossier leak';end if;
 if exists(select 1 from storage.objects) then raise exception 'Vendor storage leak';end if;
 begin update public.sadu_freight_assignments set closure_start=current_date;raise exception 'Vendor changed closure';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated","app_metadata":{"institutional_role":"EXTERNAL_VENDOR"}}',true);
do $$begin if exists(select 1 from public.sadu_consignments) or exists(select 1 from public.sadu_freight_alerts) then raise exception 'Unassigned vendor data leak';end if;end $$;
select set_config('request.jwt.claims','{"sub":"99999999-9999-4999-8999-999999999999","role":"authenticated","app_metadata":{"institutional_role":"HIP"}}',true);
do $$begin if not exists(select 1 from public.sadu_freight_alerts) then raise exception 'Curator missing alert';end if;end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"ARTIST"}}',true);
do $$begin if not exists(select 1 from public.sadu_freight_alerts) then raise exception 'Artist missing alert';end if;end $$;
reset role;set local role anon;
select public.sadu_receive_consignment(current_setting('test.freight.token'),'{"packing_list":"Crate 1: artwork A","length_cm":100,"width_cm":80,"height_cm":40,"weight_kg":84,"insurance_value":5000,"currency":"EUR","country":"France","city":"Paris","district":"Test","street":"Test","building":"Gallery","map_url":"https://maps.google.com/?q=test","hours":"8 AM - noon, call one hour prior","phone":"+33123456789"}');
reset role;select sadu_private.escalate_freight_closures();
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"88888888-8888-4888-8888-888888888888","role":"authenticated","app_metadata":{"institutional_role":"EXTERNAL_VENDOR"}}',true);
do $$begin
 if not exists(select 1 from public.sadu_consignments where details->>'currency'='EUR' and details->>'weight_kg'='84') then raise exception 'Vendor missing direct gallery data';end if;
 if not exists(select 1 from public.sadu_freight_alerts where status='RESOLVED' and resolved_at is not null) then raise exception 'Alert not resolved';end if;
end $$;

reset role;
insert into auth.users(id,raw_app_meta_data) values('55555555-5555-4555-8555-555555555555','{"institutional_role":"LOGISTICS"}'),('66666666-6666-4666-8666-666666666666','{"institutional_role":"BIENNIAL_DIRECTOR"}');
insert into public.sadu_logistics_routing(officer_id,head_id) values('55555555-5555-4555-8555-555555555555','66666666-6666-4666-8666-666666666666');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"ARTIST"}}',true);
insert into public.sadu_logistics_tickets(consignment_id) select id from public.sadu_consignments;
reset role;update public.sadu_logistics_tickets set ready_at=clock_timestamp()-interval '49 hours';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"LOGISTICS"}}',true);
update public.sadu_logistics_tickets set opened_at='2000-01-01';
do $$begin if exists(select 1 from public.sadu_logistics_tickets where opened_at<'2026-01-01' or actioned_at is not null) then raise exception 'Opening falsely counted as action or spoofed';end if;end $$;
reset role;select sadu_private.escalate_logistics_sla();select sadu_private.escalate_logistics_sla();
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated","app_metadata":{"institutional_role":"BIENNIAL_DIRECTOR"}}',true);
do $$begin if not exists(select 1 from public.sadu_logistics_tickets where escalated_at is not null) then raise exception 'Head missing escalation';end if;end $$;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"LOGISTICS"}}',true);
do $$begin begin update public.sadu_logistics_tickets set action_note='ok';raise exception 'Trivial action accepted';exception when others then if SQLERRM not like 'Meaningful action%' then raise;end if;end;end $$;
update public.sadu_logistics_tickets set action_note='Carrier contacted; case reference TEST-01';
do $$begin if not exists(select 1 from public.sadu_logistics_tickets where actioned_at is not null and escalated_at is not null) then raise exception 'Action or history lost';end if;end $$;
select set_config('request.jwt.claims','{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated","app_metadata":{"institutional_role":"TECHNICAL"}}',true);
do $$begin if exists(select 1 from public.sadu_logistics_tickets) then raise exception 'Technical freight ticket leak';end if;end $$;
rollback;
