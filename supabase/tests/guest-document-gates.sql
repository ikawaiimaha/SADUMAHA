begin;
insert into auth.users(id) values('11111111-1111-4111-8111-111111111111');
insert into public.bilateral_contracts(id,artist_id,artist_name,status) values('guest-final-test','11111111-1111-4111-8111-111111111111','Fictional','ARTIST_APPROVED');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"ARTIST"}}',true);
insert into public.sadu_guest_travel_plans(contract_id,artist_id,arrival,departure) values('guest-final-test','11111111-1111-4111-8111-111111111111',current_date+30,current_date+35);
insert into public.sadu_guest_travel_plans(contract_id,artist_id,arrival,departure) values('guest-final-test','11111111-1111-4111-8111-111111111111',current_date+30,current_date+35);
insert into public.sadu_guest_intakes(id,contract_id,artist_id,arrival,departure,airport,departure_airport,photo_extension,identity,document_policy) values('22222222-2222-4222-8222-222222222222','guest-final-test','11111111-1111-4111-8111-111111111111',current_date+30,current_date+35,'SHJ','DXB','jpg','{"passportNumber":"SAMPLE","passportExpiry":"2099-01-01","nationality":"IQ","birthDate":"1990-01-01","birthPlace":"Sample","email":"sample@example.test","phone":"000"}','{"national_id_required":false}');
do $$begin
 if (select count(*) from public.sadu_guest_travel_plans where contract_id='guest-final-test')<>1 then raise exception 'Duplicate travel plans';end if;
 begin perform public.sadu_finalize_guest('22222222-2222-4222-8222-222222222222');raise exception 'Missing files bypass';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"PR_PROTOCOL"}}',true);
do $$begin if exists(select 1 from public.sadu_guest_intakes where contract_id='guest-final-test') then raise exception 'PR sees draft';end if;end $$;
reset role;
select sadu_private.queue_guest_reminders();select sadu_private.queue_guest_reminders();
do $$begin if (select count(*) from public.sadu_guest_reminder_outbox where contract_id='guest-final-test' and status='PENDING_DELIVERY')<>1 then raise exception 'Reminder idempotency failure';end if;end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"ARTIST"}}',true);
insert into storage.objects(bucket_id,name,metadata) values
('logistics-secure','11111111-1111-4111-8111-111111111111/guest-intake/22222222-2222-4222-8222-222222222222/passport.pdf','{"size":100,"mimetype":"application/pdf"}'),
('logistics-secure','11111111-1111-4111-8111-111111111111/guest-intake/22222222-2222-4222-8222-222222222222/photo.jpg','{"size":100,"mimetype":"image/jpeg"}');
do $$begin
 if not exists(select 1 from public.sadu_guest_intakes where document_policy->>'national_id_required'='true') then raise exception 'Policy spoof succeeded';end if;
 begin perform public.sadu_finalize_guest('22222222-2222-4222-8222-222222222222');raise exception 'Missing national ID accepted';exception when insufficient_privilege then null;end;
end $$;
insert into storage.objects(bucket_id,name,metadata) values('logistics-secure','11111111-1111-4111-8111-111111111111/guest-intake/22222222-2222-4222-8222-222222222222/national-id.pdf','{"size":100,"mimetype":"application/pdf"}');
select public.sadu_finalize_guest('22222222-2222-4222-8222-222222222222');select public.sadu_finalize_guest('22222222-2222-4222-8222-222222222222');
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"PR_PROTOCOL"}}',true);
do $$begin if not exists(select 1 from public.sadu_guest_submission_queue where contract_id='guest-final-test' and finalized_at is not null) then raise exception 'PR missing complete packet';end if;end $$;
insert into public.sadu_guest_itinerary_approvals(intake_id,ticket_reference) values('22222222-2222-4222-8222-222222222222','TEST VERIFIED');
do $$begin if not exists(select 1 from storage.objects where name like '%22222222-2222-4222-8222-222222222222/national-id.pdf') then raise exception 'PR cannot see finalized ID';end if;end $$;
reset role;select sadu_private.queue_guest_reminders();
do $$begin if exists(select 1 from public.sadu_guest_reminder_outbox where contract_id='guest-final-test' and status='PENDING_DELIVERY') then raise exception 'Reminder not cancelled';end if;end $$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"COORDINATOR"}}',true);
do $$begin
 if exists(select 1 from public.sadu_guest_intakes where contract_id='guest-final-test') then raise exception 'Coordinator sees identity';end if;
 if exists(select 1 from storage.objects where name like '%22222222-2222-4222-8222-222222222222%') then raise exception 'Coordinator sees private ID';end if;
end $$;
do $$declare role_name text;begin
 foreach role_name in array array['FINANCE','TECHNICAL','BIENNIAL_DIRECTOR','HIP'] loop
 perform set_config('request.jwt.claims',jsonb_build_object('sub','55555555-5555-4555-8555-555555555555','role','authenticated','app_metadata',jsonb_build_object('institutional_role',role_name))::text,true);
 if exists(select 1 from storage.objects where name like '%22222222-2222-4222-8222-222222222222%') then raise exception 'Non-PR sees private document';end if;
 end loop;
end $$;
reset role;
do $$begin
 if public.sadu_valid_guest_identity('{"passportNumber":"X","passportExpiry":"2027-02-27","nationality":"IQ","birthDate":"1990-01-01","birthPlace":"X","email":"x@example.test","phone":"0"}','2026-08-31') then raise exception 'Short validity accepted';end if;
 if not public.sadu_valid_guest_identity('{"passportNumber":"X","passportExpiry":"2027-02-28","nationality":"IQ","birthDate":"1990-01-01","birthPlace":"X","email":"x@example.test","phone":"0"}','2026-08-31') then raise exception 'Month-end boundary rejected';end if;
end $$;
rollback;
