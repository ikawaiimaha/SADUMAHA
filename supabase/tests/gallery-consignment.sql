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

do $$begin perform set_config('test.gallery.token',public.sadu_issue_consignment('44444444-4444-4444-8444-444444444444','THIRD_PARTY_GALLERY','Fictional Gallery','gallery@example.invalid'),true); end$$;
do $$begin perform set_config('test.gallery.old',current_setting('test.gallery.token'),true); end$$;
do $$begin perform set_config('test.gallery.token',public.sadu_issue_consignment('44444444-4444-4444-8444-444444444444','THIRD_PARTY_GALLERY','Fictional Gallery','gallery@example.invalid'),true); end$$;
do $$begin perform set_config('test.gallery.payload','{"packing_list":"Crate 1: artwork A","length_cm":100,"width_cm":80,"height_cm":40,"weight_kg":84,"insurance_value":5000,"currency":"AED","country":"France","city":"Paris","district":"Test","street":"Test","building":"Gallery","map_url":"https://maps.google.com/?q=test","hours":"8 AM - noon, call one hour prior","phone":"+33123456789"}',true); end$$;
reset role;
update sadu_private.consignment_tokens set expires_at=now()-interval '1 second';
set local role anon;
do $$begin
 begin perform public.sadu_receive_consignment(current_setting('test.gallery.token'),current_setting('test.gallery.payload')::jsonb);raise exception 'TEST expired accepted';exception when others then if SQLERRM not like 'Link invalid%' then raise;end if;end;
end$$;
reset role;
update sadu_private.consignment_tokens set expires_at=now()+interval '7 days';
set local role anon;
do $$begin
 begin perform public.sadu_receive_consignment(current_setting('test.gallery.old'),current_setting('test.gallery.payload')::jsonb);raise exception 'TEST stale token accepted';exception when others then if SQLERRM not like 'Link invalid%' then raise;end if;end;
 begin perform public.sadu_receive_consignment(current_setting('test.gallery.token'),'{"length_cm":-1}'::jsonb);raise exception 'TEST invalid payload accepted';exception when others then if SQLERRM not like 'Positive numeric%' then raise;end if;end;
 begin perform * from public.sadu_consignments;raise exception 'TEST anonymous read';exception when insufficient_privilege then null;end;
 perform public.sadu_receive_consignment(current_setting('test.gallery.token'),current_setting('test.gallery.payload')::jsonb);
 begin perform public.sadu_receive_consignment(current_setting('test.gallery.token'),current_setting('test.gallery.payload')::jsonb);raise exception 'TEST replay accepted';exception when others then if SQLERRM not like 'Link invalid%' then raise;end if;end;
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","user_metadata":{"institutional_role":"LOGISTICS"}}',true);
do $$begin
 if exists(select 1 from public.sadu_consignments) then raise exception 'TEST forged role leak';end if;
 begin perform public.sadu_issue_consignment('44444444-4444-4444-8444-444444444444','ARTIST_STUDIO',null,null);raise exception 'TEST cross artist';exception when others then if SQLERRM not like 'Owned accepted%' then raise;end if;end;
end$$;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"LOGISTICS"}}',true);
do $$begin
 if not exists(select 1 from public.sadu_consignments where status='CONSIGNMENT_DATA_RECEIVED' and received_at is not null and details->>'weight_kg'='84') then raise exception 'TEST missing logistics data';end if;
 begin update public.sadu_consignments set details='{}';raise exception 'TEST mutable submission';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$begin
 begin perform public.sadu_issue_consignment('44444444-4444-4444-8444-444444444444','ARTIST_STUDIO',null,null);raise exception 'TEST submitted origin mutable';exception when others then if SQLERRM not like 'Origin locked%' then raise;end if;end;
end$$;
rollback;
