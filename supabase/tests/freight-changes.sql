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
insert into auth.users(id) values('88888888-8888-4888-8888-888888888888'),('99999999-9999-4999-8999-999999999999');
insert into public.sadu_user_roles(user_id,institutional_role,granted_reason) values('88888888-8888-4888-8888-888888888888','EXTERNAL_VENDOR','Synthetic test grant'),('99999999-9999-4999-8999-999999999999','GENERAL_COORDINATOR','Synthetic test grant');
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
select set_config('request.jwt.claims','{"sub":"99999999-9999-4999-8999-999999999999","role":"authenticated","app_metadata":{"institutional_role":"GENERAL_COORDINATOR"}}',true);
do $$begin if not exists(select 1 from public.sadu_freight_alerts) then raise exception 'Curator missing alert';end if;end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"ARTIST"}}',true);
do $$begin if not exists(select 1 from public.sadu_freight_alerts) then raise exception 'Artist missing alert';end if;end $$;
reset role;set local role anon;
select public.sadu_receive_consignment(current_setting('test.freight.token'),'{"packing_type":"NO_PACKAGING","return_country":"France","return_city":"Paris","return_address":"Gallery address","packing_list":"Crate 1: artwork A","length_cm":100,"width_cm":80,"height_cm":40,"weight_kg":84,"insurance_value":5000,"currency":"EUR","country":"France","city":"Paris","district":"Test","street":"Test","building":"Gallery","map_url":"https://maps.google.com/?q=test","hours":"8 AM - noon, call one hour prior","phone":"+33123456789"}');
reset role;select sadu_private.escalate_freight_closures();
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"88888888-8888-4888-8888-888888888888","role":"authenticated","app_metadata":{"institutional_role":"EXTERNAL_VENDOR"}}',true);
do $$begin
 if not exists(select 1 from public.sadu_consignments where details->>'currency'='EUR' and details->>'weight_kg'='84') then raise exception 'Vendor missing direct gallery data';end if;
 if not exists(select 1 from public.sadu_freight_alerts where status='RESOLVED' and resolved_at is not null) then raise exception 'Alert not resolved';end if;
end $$;

reset role;
insert into auth.users(id) values('55555555-5555-4555-8555-555555555555'),('66666666-6666-4666-8666-666666666666');
insert into public.sadu_user_roles(user_id,institutional_role,granted_reason) values('55555555-5555-4555-8555-555555555555','LOGISTICS','Synthetic test grant'),('66666666-6666-4666-8666-666666666666','BIENNIAL_DIRECTOR','Synthetic test grant');
insert into public.sadu_logistics_routing(officer_id,head_id) values('55555555-5555-4555-8555-555555555555','66666666-6666-4666-8666-666666666666');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"ARTIST"}}',true);

do $$begin begin insert into public.sadu_logistics_tickets(consignment_id) select id from public.sadu_consignments;raise exception 'Bare artwork ready';exception when others then if SQLERRM not like 'Shipping held:%' then raise;end if;end;end $$;
insert into public.sadu_freight_changes(consignment_id,kind,proposal,estimated_cost_minor,currency,payer,reason) select id,'PACKING','{"packing_type":"MUSEUM_CRATE","length_cm":120,"width_cm":100,"height_cm":60,"weight_kg":100,"packing_list":"Crate 1: artwork A"}',50000,'EUR','DEPARTMENT','Crating quote TEST-01 and completed dimensions' from public.sadu_consignments;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"LOGISTICS"}}',true);
select public.sadu_decide_freight_change(id,true,'Packing inspection TEST-01') from public.sadu_freight_changes;
do $$begin if exists(select 1 from public.sadu_consignments where details->>'packing_type'<>'NO_PACKAGING') then raise exception 'One approval applied change';end if;end $$;
select set_config('request.jwt.claims','{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated","app_metadata":{"institutional_role":"FINANCE"}}',true);
select public.sadu_decide_freight_change(id,true,'Budget variance approved TEST-02') from public.sadu_freight_changes;
do $$begin if not exists(select 1 from public.sadu_freight_changes where status='APPROVED' and before_snapshot->'details'->>'packing_type'='NO_PACKAGING' and finance_at is not null and logistics_at is not null) then raise exception 'Approval trail missing';end if;end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"ARTIST"}}',true);
do $$begin if not exists(select 1 from public.sadu_consignments where freight_revision=2 and details->>'packing_type'='MUSEUM_CRATE') then raise exception 'Packing change not applied';end if;end $$;
insert into public.sadu_freight_changes(consignment_id,kind,proposal,estimated_cost_minor,currency,payer,reason) select id,'RETURN','{"return_country":"Spain","return_city":"Madrid","return_address":"Studio address"}',10000,'EUR','ARTIST','Gallery return destination correction' from public.sadu_consignments;
do $$begin begin insert into public.sadu_logistics_tickets(consignment_id) select id from public.sadu_consignments;raise exception 'Pending change not held';exception when others then if SQLERRM not like 'Shipping held:%' then raise;end if;end;end $$;
select set_config('request.jwt.claims','{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated","app_metadata":{"institutional_role":"FINANCE"}}',true);
select public.sadu_decide_freight_change(id,false,'Return quote insufficient TEST-03') from public.sadu_freight_changes where status='PENDING';
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"ARTIST"}}',true);
do $$begin if exists(select 1 from public.sadu_consignments where details->>'return_country'<>'France') then raise exception 'Rejected destination applied';end if;end $$;
insert into public.sadu_logistics_tickets(consignment_id) select id from public.sadu_consignments;
insert into public.sadu_freight_changes(consignment_id,kind,proposal,estimated_cost_minor,currency,payer,reason) select id,'CLOSURE','{"closure_start":"2026-07-31","reopens_on":"2026-09-02","facility_timezone":"Europe/Paris"}',0,'EUR','GALLERY','Gallery revised notice TEST-04' from public.sadu_consignments;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"LOGISTICS"}}',true);
select public.sadu_decide_freight_change(id,true,'Gallery notice verified TEST-04') from public.sadu_freight_changes where status='PENDING';
select set_config('request.jwt.claims','{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated","app_metadata":{"institutional_role":"FINANCE"}}',true);
select public.sadu_decide_freight_change(id,true,'Zero variance reviewed TEST-05') from public.sadu_freight_changes where status='PENDING';
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"ARTIST"}}',true);
do $$begin if not exists(select 1 from public.sadu_freight_assignments where closure_start='2026-07-31' and details_due='2026-07-26') then raise exception 'Closure amendment not applied';end if;
 if not exists(select 1 from public.sadu_freight_changes where kind='CLOSURE' and before_snapshot->'closure'->>'closure_start'='2026-07-25') then raise exception 'Old closure lost';end if;end $$;
select set_config('request.jwt.claims','{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}',true);
do $$begin begin insert into public.sadu_freight_changes(consignment_id,kind,proposal,estimated_cost_minor,currency,payer,reason) select '00000000-0000-4000-8000-000000000000','RETURN','{}',0,'AED','ARTIST','Untrusted attempt';raise exception 'Missing role bypass';exception when insufficient_privilege then null;end;end $$;
rollback;
