begin;
insert into auth.users(id) values('11111111-1111-4111-8111-111111111111');
insert into public.bilateral_contracts(id,artist_id,artist_name,status) values
 ('intake-test','11111111-1111-4111-8111-111111111111','Fictional intake','ARTIST_APPROVED'),
 ('intake-unsigned','11111111-1111-4111-8111-111111111111','Fictional unsigned','SENT_TO_ARTIST');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","institutional_role":"ARTIST"}',true);
insert into public.sadu_contract_intake(id,contract_id,artist_id,kind,object_name,file_name) values
 ('22222222-2222-4222-8222-222222222222','intake-test','11111111-1111-4111-8111-111111111111','PASSPORT','11111111-1111-4111-8111-111111111111/contract-intake/22222222-2222-4222-8222-222222222222/passport.pdf','passport.pdf'),
 ('33333333-3333-4333-8333-333333333333','intake-test','11111111-1111-4111-8111-111111111111','ARTWORK_IMAGE','11111111-1111-4111-8111-111111111111/contract-intake/33333333-3333-4333-8333-333333333333/master.png','master.png');
-- Storage metadata fixtures exercise RLS; actual transfer is tested separately.
insert into storage.objects(bucket_id,name) select 'logistics-secure',object_name from public.sadu_contract_intake where contract_id='intake-test';
do $$begin
 begin
 insert into public.sadu_contract_intake(id,contract_id,artist_id,kind,object_name,file_name) values
 ('44444444-4444-4444-8444-444444444444','intake-unsigned','11111111-1111-4111-8111-111111111111','PASSPORT','11111111-1111-4111-8111-111111111111/contract-intake/44444444-4444-4444-8444-444444444444/a.pdf','a.pdf');
 raise exception 'Unsigned agreement bypass';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"PR_PROTOCOL"}}',true);
do $$begin
 if (select count(*) from public.sadu_contract_intake where contract_id='intake-test')<>1 then raise exception 'PR boundary failure';end if;
 if exists(select 1 from public.sadu_contract_intake where contract_id='intake-test' and kind<>'PASSPORT') then raise exception 'PR artwork leak';end if;
end $$;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"TECHNICAL"}}',true);
do $$begin
 if (select count(*) from public.sadu_contract_intake where contract_id='intake-test')<>1 or exists(select 1 from public.sadu_contract_intake where contract_id='intake-test' and kind='PASSPORT') then raise exception 'Technical boundary failure';end if;
end $$;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","institutional_role":"ARTIST"}',true);
do $$begin
 if exists(select 1 from public.sadu_contract_intake where contract_id='intake-test') or exists(select 1 from storage.objects where name like '%/contract-intake/%') then raise exception 'Cross-artist leak';end if;
 begin insert into public.sadu_contract_intake(id,contract_id,artist_id,kind,object_name,file_name) values
 ('66666666-6666-4666-8666-666666666666','intake-test','55555555-5555-4555-8555-555555555555','PASSPORT','55555555-5555-4555-8555-555555555555/contract-intake/66666666-6666-4666-8666-666666666666/a.pdf','a.pdf');raise exception 'Cross-contract upload bypass';exception when insufficient_privilege then null;end;
end $$;
rollback;
