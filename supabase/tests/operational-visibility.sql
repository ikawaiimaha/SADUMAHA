begin;
insert into auth.users(id) values('11111111-1111-4111-8111-111111111111');
insert into public.bilateral_contracts(id,artist_id,artist_name,status) values('guest-final-test','11111111-1111-4111-8111-111111111111','Fictional','ARTIST_APPROVED');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"ARTIST"}}',true);
insert into public.sadu_guest_travel_plans(contract_id,artist_id,arrival,departure) values('guest-final-test','11111111-1111-4111-8111-111111111111',current_date+30,current_date+35);
insert into public.sadu_guest_travel_plans(contract_id,artist_id,arrival,departure) values('guest-final-test','11111111-1111-4111-8111-111111111111',current_date+30,current_date+35);
insert into public.sadu_guest_intakes(id,contract_id,artist_id,arrival,departure,airport,departure_airport,photo_extension,identity) values('22222222-2222-4222-8222-222222222222','guest-final-test','11111111-1111-4111-8111-111111111111',current_date+30,current_date+35,'SHJ','DXB','jpg','{"passportNumber":"SAMPLE","passportExpiry":"2099-01-01","nationality":"Sample","birthDate":"1990-01-01","birthPlace":"Sample","email":"sample@example.test","phone":"000"}');
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
select public.sadu_finalize_guest('22222222-2222-4222-8222-222222222222');select public.sadu_finalize_guest('22222222-2222-4222-8222-222222222222');
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"PR_PROTOCOL"}}',true);
do $$begin if not exists(select 1 from public.sadu_guest_submission_queue where contract_id='guest-final-test' and finalized_at is not null) then raise exception 'PR missing complete packet';end if;end $$;

insert into public.sadu_guest_itinerary_approvals(intake_id,ticket_reference) values('22222222-2222-4222-8222-222222222222','TEST-ONLY');
do $$begin
 begin insert into public.sadu_guest_itinerary_approvals(intake_id,ticket_reference) values('22222222-2222-4222-8222-222222222222','DOUBLE');raise exception 'Duplicate approval allowed';exception when unique_violation then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated","app_metadata":{"institutional_role":"TECHNICAL"}}',true);
do $$begin
 if (select count(*) from public.sadu_operational_guest_calendar() where contract_id='guest-final-test')<>1 then raise exception 'Technical cannot see approved window';end if;
 if exists(select 1 from public.sadu_guest_intakes where contract_id='guest-final-test') then raise exception 'Technical sees identity';end if;
 if exists(select 1 from public.sadu_guest_itinerary_approvals) then raise exception 'Technical sees ticket references';end if;
 begin insert into public.sadu_guest_itinerary_approvals(intake_id,ticket_reference) values('22222222-2222-4222-8222-222222222222','FORGED');raise exception 'Technical approval allowed';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"institutional_role":"ARTIST"}}',true);
insert into public.sadu_guest_travel_plans(contract_id,artist_id,arrival,departure) values('guest-final-test','11111111-1111-4111-8111-111111111111',current_date+40,current_date+45);
select set_config('request.jwt.claims','{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated","app_metadata":{"institutional_role":"TECHNICAL"}}',true);
do $$begin if exists(select 1 from public.sadu_operational_guest_calendar() where contract_id='guest-final-test') then raise exception 'Superseded dates visible';end if;end $$;
rollback;
