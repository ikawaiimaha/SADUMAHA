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
reset role;select sadu_private.queue_guest_reminders();
do $$begin if exists(select 1 from public.sadu_guest_reminder_outbox where contract_id='guest-final-test' and status='PENDING_DELIVERY') then raise exception 'Reminder not cancelled';end if;end $$;
-- All escalation windows use a database clock and relative dates, not a test-only clock override.
insert into public.bilateral_contracts(id,artist_id,artist_name,status) values
 ('reminder-14','11111111-1111-4111-8111-111111111111','Fictional','ARTIST_APPROVED'),
 ('reminder-7','11111111-1111-4111-8111-111111111111','Fictional','ARTIST_APPROVED'),
 ('reminder-final','11111111-1111-4111-8111-111111111111','Fictional','ARTIST_APPROVED');
insert into public.sadu_guest_travel_plans(contract_id,artist_id,arrival,departure) values
 ('reminder-14','11111111-1111-4111-8111-111111111111',current_date+40,current_date+45),
 ('reminder-7','11111111-1111-4111-8111-111111111111',current_date+35,current_date+40),
 ('reminder-final','11111111-1111-4111-8111-111111111111',current_date+29,current_date+34);
select sadu_private.queue_guest_reminders();select sadu_private.queue_guest_reminders();
do $$begin
 if (select count(*) from public.sadu_guest_reminder_outbox where status='PENDING_DELIVERY' and ((contract_id='reminder-14' and stage='14_DAYS') or (contract_id='reminder-7' and stage='7_DAYS') or (contract_id='reminder-final' and stage='FINAL')))<>3 then raise exception 'Escalation windows incorrect';end if;
end $$;
insert into public.sadu_guest_travel_plans(contract_id,artist_id,arrival,departure) values('reminder-final','11111111-1111-4111-8111-111111111111',current_date+80,current_date+85);
select sadu_private.queue_guest_reminders();
do $$begin if exists(select 1 from public.sadu_guest_reminder_outbox where contract_id='reminder-final' and status='PENDING_DELIVERY') then raise exception 'Old arrival reminder remains active';end if;end $$;
set local role authenticated;
do $$begin
 begin perform sadu_private.queue_guest_reminders();raise exception 'Caller can run privileged scheduler';exception when insufficient_privilege then null;end;
 begin update public.sadu_guest_reminder_outbox set status='SENT',sent_at=now();raise exception 'Caller can forge delivery';exception when insufficient_privilege then null;end;
end $$;
rollback;
