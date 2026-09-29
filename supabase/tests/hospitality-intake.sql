-- Transaction-scoped fictional fixtures. No personal data or persistent test records.
begin;
insert into auth.users(id) values('11111111-1111-4111-8111-111111111111');
insert into public.bilateral_contracts(id,artist_id,artist_name,status) values
 ('hospitality-test','11111111-1111-4111-8111-111111111111','Fictional test','ARTIST_APPROVED'),
 ('hospitality-unsigned','11111111-1111-4111-8111-111111111111','Unsigned test','SENT_TO_ARTIST');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","institutional_role":"ARTIST","app_metadata":{"institutional_role":"ARTIST"}}',true);
insert into public.sadu_companion_requests(id,contract_id,artist_id,companion_name,self_funded_ack,object_name,file_name) values
 ('22222222-2222-4222-8222-222222222222','hospitality-test','11111111-1111-4111-8111-111111111111','Fictional companion',true,'11111111-1111-4111-8111-111111111111/companion-intake/22222222-2222-4222-8222-222222222222/passport.pdf','passport.pdf');
insert into storage.objects(bucket_id,name) select 'logistics-secure',object_name from public.sadu_companion_requests where contract_id='hospitality-test';
do $$begin
 begin
 insert into public.sadu_companion_requests(id,contract_id,artist_id,companion_name,self_funded_ack,object_name,file_name) values
 ('33333333-3333-4333-8333-333333333333','hospitality-unsigned','11111111-1111-4111-8111-111111111111','Invalid request',true,'11111111-1111-4111-8111-111111111111/companion-intake/33333333-3333-4333-8333-333333333333/a.pdf','a.pdf');
 raise exception 'Unsigned contract bypass';exception when insufficient_privilege then null;end;
 begin
 update public.sadu_companion_requests set companion_name='Tampered' where contract_id='hospitality-test';
 raise exception 'Immutable request bypass';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"PR_PROTOCOL"}}',true);
do $$begin
 if (select count(*) from public.sadu_companion_requests where contract_id='hospitality-test')<>1 then raise exception 'PR cannot see companion queue';end if;
 if not exists(select 1 from storage.objects where name like '%/companion-intake/22222222%') then raise exception 'PR cannot read companion PDF';end if;
end $$;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"COORDINATOR"}}',true);
do $$begin
 if exists(select 1 from public.sadu_companion_requests where contract_id='hospitality-test') or exists(select 1 from storage.objects where name like '%/companion-intake/22222222%') then raise exception 'Coordinator privacy leak';end if;
end $$;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","user_metadata":{"institutional_role":"PR_PROTOCOL"}}',true);
do $$begin
 if exists(select 1 from public.sadu_companion_requests where contract_id='hospitality-test') or exists(select 1 from storage.objects where name like '%/companion-intake/22222222%') then raise exception 'Untrusted metadata or cross-artist leak';end if;
 begin
 insert into storage.objects(bucket_id,name) values('logistics-secure','11111111-1111-4111-8111-111111111111/companion-intake/22222222-2222-4222-8222-222222222222/other.pdf');
 raise exception 'Unregistered file bypass';exception when insufficient_privilege then null;end;
end $$;
rollback;
