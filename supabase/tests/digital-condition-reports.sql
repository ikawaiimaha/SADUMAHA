begin;
insert into auth.users(id) values('11111111-1111-4111-8111-111111111111');
insert into public.bilateral_contracts(id,artist_id,artist_name,status) values('condition-test','11111111-1111-4111-8111-111111111111','Fictional test artist','ARTIST_APPROVED');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","app_metadata":{"institutional_role":"LOGISTICS"}}',true);
insert into public.sadu_condition_reports(id,contract_id,artist_id,description,photos) values('22222222-2222-4222-8222-222222222222','condition-test','11111111-1111-4111-8111-111111111111','Loose screws','["11111111-1111-4111-8111-111111111111/condition-reports/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333.png"]');
do $$begin
 begin update public.sadu_condition_reports set status='DAMAGED_PENDING_ARTIST_APPROVAL';raise exception 'TEST missing evidence accepted';exception when others then if SQLERRM not like 'Upload evidence%' then raise;end if;end;
end$$;
insert into storage.objects(bucket_id,name,metadata) values('logistics-secure','11111111-1111-4111-8111-111111111111/condition-reports/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333.png','{"size":100,"mimetype":"image/png"}');
update public.sadu_condition_reports set status='DAMAGED_PENDING_ARTIST_APPROVAL';
do $$begin
 update public.sadu_condition_reports set status='REPAIR_AUTHORIZED';if found then raise exception 'TEST logistics authorized repair';end if;
end$$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","institutional_role":"ARTIST"}',true);
do $$begin
 if not exists(select 1 from public.sadu_condition_reports where status='DAMAGED_PENDING_ARTIST_APPROVAL') then raise exception 'TEST artist alert missing';end if;
 if not exists(select 1 from storage.objects where name like '%/condition-reports/%') then raise exception 'TEST evidence hidden';end if;
 begin update public.sadu_condition_reports set description='overwritten';raise exception 'TEST report mutable';exception when insufficient_privilege then null;end;
end$$;
update public.sadu_condition_reports set status='REPAIR_AUTHORIZED';
do $$begin
 if not exists(select 1 from public.sadu_condition_reports where decided_by=auth.uid() and decision_at is not null and status='REPAIR_AUTHORIZED') then raise exception 'TEST decision missing';end if;
 update public.sadu_condition_reports set status='ARTIST_REPAIR_PLANNED';if found then raise exception 'TEST decision overwritten';end if;
end$$;
select set_config('request.jwt.claims','{"sub":"66666666-6666-4666-8666-666666666666","user_metadata":{"institutional_role":"LOGISTICS"}}',true);
do $$begin
 if exists(select 1 from public.sadu_condition_reports) then raise exception 'TEST cross-artist leak';end if;
 if exists(select 1 from storage.objects where name like '%/condition-reports/%') then raise exception 'TEST private evidence leak';end if;
end$$;
rollback;
