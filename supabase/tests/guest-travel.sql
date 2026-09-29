-- Rollback-only privacy and milestone checks with fictional data.
begin;
insert into auth.users(id) values('11111111-1111-4111-8111-111111111111');
insert into public.bilateral_contracts(id,artist_id,artist_name,status) values ('guest-test','11111111-1111-4111-8111-111111111111','Fictional Guest','ARTIST_APPROVED'),('guest-unsigned','11111111-1111-4111-8111-111111111111','Unsigned','SENT_TO_ARTIST');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"ARTIST"}}',true);
insert into public.sadu_guest_intakes(id,contract_id,artist_id,artist_name,arrival,departure,airport,photo_extension) values('22222222-2222-4222-8222-222222222222','guest-test','11111111-1111-4111-8111-111111111111','Forged name','2026-10-06','2026-10-11','SHJ','jpg');
do $$begin
 if (select artist_name from public.sadu_guest_queue where contract_id='guest-test')<>'Fictional Guest' then raise exception 'Name spoof';end if;
 if (select passport_uploaded from public.sadu_guest_queue where contract_id='guest-test') then raise exception 'Missing upload shown ready';end if;
 begin
 insert into public.sadu_guest_intakes(contract_id,artist_id,arrival,departure,airport,photo_extension) values('guest-unsigned','11111111-1111-4111-8111-111111111111','2026-10-06','2026-10-11','SHJ','jpg');
 raise exception 'Unsigned bypass';exception when raise_exception then if sqlerrm='Unsigned bypass' then raise;end if;end;
 begin
 update public.sadu_guest_intakes set airport='DXB' where contract_id='guest-test';raise exception 'Mutation bypass';exception when insufficient_privilege then null;end;
 begin
 insert into public.sadu_guest_intakes(contract_id,artist_id,arrival,departure,airport,photo_extension) values('guest-test','11111111-1111-4111-8111-111111111111','2026-10-11','2026-10-06','SHJ','jpg');raise exception 'Date bypass';exception when check_violation then null;end;
end $$;
insert into storage.objects(bucket_id,name,metadata) values('logistics-secure','11111111-1111-4111-8111-111111111111/guest-intake/22222222-2222-4222-8222-222222222222/passport.pdf','{"size":100,"mimetype":"application/pdf"}');
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"PR_PROTOCOL"}}',true);
do $$begin
 if (select count(*) from public.sadu_pr_guest_roster() where id='guest-test')<>1 then raise exception 'PR roster hidden';end if;
 if exists(select 1 from public.sadu_guest_queue where contract_id='guest-test') or exists(select 1 from storage.objects where name like '%/guest-intake/22222222%') then raise exception 'PR draft packet leak';end if;
 begin
 insert into storage.objects(bucket_id,name) values('logistics-secure','11111111-1111-4111-8111-111111111111/guest-intake/22222222-2222-4222-8222-222222222222/photo.jpg');raise exception 'PR upload bypass';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"COORDINATOR"},"user_metadata":{"institutional_role":"PR_PROTOCOL"}}',true);
do $$begin
 if exists(select 1 from public.sadu_pr_guest_roster() where id='guest-test') or exists(select 1 from public.sadu_guest_queue where contract_id='guest-test') or exists(select 1 from storage.objects where name like '%/guest-intake/22222222%') then raise exception 'Coordinator/cross-owner privacy leak';end if;
end $$;
reset role;
set local role anon;
do $$begin
 begin perform * from public.sadu_guest_queue;raise exception 'Anonymous queue bypass';exception when insufficient_privilege then null;end;
 begin perform * from public.sadu_pr_guest_roster();raise exception 'Anonymous roster bypass';exception when insufficient_privilege then null;end;
end $$;
rollback;
