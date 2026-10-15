-- Transactional RLS tests; no documents or personal data remain afterward.
\set ON_ERROR_STOP on
begin;
create function pg_temp.check_true(ok boolean, message text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %', message; end if; raise notice 'PASS: %', message; end $$;
insert into public.artist_dossiers(id,name,arabic_name,category,nationality,medium) values
('test-dossier-a','Fictional A','Demo','Emerging','Demo','Demo'),('test-dossier-b','Fictional B','Demo','Emerging','Demo','Demo');
insert into public.bilateral_contracts(id,artist_id,coordinator_id,dossier_id,artist_name,status,is_signed) values
('test-contract-a','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','test-dossier-a','Fictional A','DRAFT',false),
('test-contract-b','22222222-2222-4222-8222-222222222222','44444444-4444-4444-8444-444444444444','test-dossier-b','Fictional B','ARTIST_APPROVED',true);
insert into public.sadu_documents(bucket_id,object_name,artist_user_id,coordinator_id,dossier_id,contract_id,kind) values
('contracts','11111111-1111-4111-8111-111111111111/agreement.pdf','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','test-dossier-a','test-contract-a','CONTRACT'),
('contracts','22222222-2222-4222-8222-222222222222/agreement.pdf','22222222-2222-4222-8222-222222222222','44444444-4444-4444-8444-444444444444','test-dossier-b','test-contract-b','CONTRACT'),
('logistics-secure','11111111-1111-4111-8111-111111111111/passport.pdf','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','test-dossier-a',null,'PASSPORT'),
('logistics-secure','11111111-1111-4111-8111-111111111111/receipt.pdf','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','test-dossier-a',null,'DELIVERY_RECEIPT'),
('artist-dossiers','11111111-1111-4111-8111-111111111111/passport_mockup.pdf','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','test-dossier-a',null,'MOCKUP');
insert into storage.objects(bucket_id,name) select bucket_id,object_name from public.sadu_documents;
select pg_temp.check_true((select count(*)=3 from storage.buckets where id in ('contracts','logistics-secure','artist-dossiers') and not public),'three private buckets');
insert into public.sadu_documents(bucket_id,object_name,artist_user_id,coordinator_id,dossier_id,kind) values ('logistics-secure','11111111-1111-4111-8111-111111111111/visa.pdf','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','test-dossier-a','VISA');
set local role anon;
select pg_temp.check_true((select count(*)=0 from storage.objects),'anonymous reads denied');
reset role;
set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","institutional_role":"COORDINATOR"}';
set local role authenticated;
select pg_temp.check_true((select count(*)=1 from public.bilateral_contracts),'coordinator sees assigned contract only');
update public.bilateral_contracts set production_cost=100,status='SENT_TO_ARTIST' where id='test-contract-a';
with changed as (update public.bilateral_contracts set production_cost=999 where id='test-contract-a' returning id)
select pg_temp.check_true((select count(*)=0 from changed),'dispatched contract cannot be edited');
select pg_temp.check_true((select count(*)=0 from storage.objects where bucket_id='logistics-secure'),'coordinator cannot read passports');
reset role;
insert into public.sadu_documents(bucket_id,object_name,artist_user_id,coordinator_id,dossier_id,kind) values
('artist-dossiers','11111111-1111-4111-8111-111111111111/cv.pdf','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','test-dossier-a','CV'),
('artist-dossiers','22222222-2222-4222-8222-222222222222/cv.pdf','22222222-2222-4222-8222-222222222222','44444444-4444-4444-8444-444444444444','test-dossier-b','CV');
set local role authenticated;
savepoint dossier_upload;
insert into storage.objects(bucket_id,name) values ('artist-dossiers','11111111-1111-4111-8111-111111111111/cv.pdf');
select pg_temp.check_true((select count(*)=1 from storage.objects where name='11111111-1111-4111-8111-111111111111/cv.pdf'),'coordinator uploads into own draft dossier slot');
rollback to savepoint dossier_upload;
do $$ begin
  begin
    insert into storage.objects(bucket_id,name) values ('artist-dossiers','22222222-2222-4222-8222-222222222222/cv.pdf');
    raise exception 'FAIL: coordinator uploaded into another coordinator''s dossier';
  exception when insufficient_privilege then raise notice 'PASS: dossier uploads are scoped to the assigned coordinator'; end;
end $$;
reset role;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","institutional_role":"ARTIST"}';
set local role authenticated;
select pg_temp.check_true((select count(*)=1 from storage.objects where bucket_id='contracts'),'artist reads own contract uploaded by coordinator');
insert into storage.objects(bucket_id,name) values ('logistics-secure','11111111-1111-4111-8111-111111111111/visa.pdf');
select pg_temp.check_true((select count(*)=2 from storage.objects where bucket_id='logistics-secure'),'artist uploads to own registered folder');
with changed as (update storage.objects set name='11111111-1111-4111-8111-111111111111/moved.pdf' where name like '%/visa.pdf' returning id)
select pg_temp.check_true((select count(*)=0 from changed),'artist cannot rename classified objects');
do $$ begin
  begin
    insert into storage.objects(bucket_id,name) values ('logistics-secure','22222222-2222-4222-8222-222222222222/visa.pdf');
    raise exception 'FAIL: cross-artist upload allowed';
  exception when insufficient_privilege then raise notice 'PASS: cross-artist upload denied'; end;
  begin
    insert into storage.objects(bucket_id,name) values ('logistics-secure','11111111-1111-4111-8111-111111111111/passport_fake.pdf');
    raise exception 'FAIL: unregistered upload allowed';
  exception when insufficient_privilege then raise notice 'PASS: filename cannot classify a document'; end;
  begin
    update public.bilateral_contracts set production_cost=1,is_signed=true,status='ARTIST_APPROVED',signed_at=now() where id='test-contract-a';
    raise exception 'FAIL: signing rewrote terms';
  exception when insufficient_privilege then raise notice 'PASS: signing cannot rewrite terms'; end;
end $$;
update public.bilateral_contracts set is_signed=true,status='ARTIST_APPROVED',signed_at=now() where id='test-contract-a';
select pg_temp.check_true((select is_signed from public.bilateral_contracts where id='test-contract-a'),'artist can accept own dispatched contract');
reset role;
set local request.jwt.claims = '{"sub":"55555555-5555-4555-8555-555555555555","institutional_role":"FINANCE"}';
set local role authenticated;
select pg_temp.check_true((select count(*)=0 from public.bilateral_contracts),'Finance denied before evidence');
select pg_temp.check_true((select count(*)=0 from storage.objects where bucket_id='contracts'),'Finance cannot read signed contract files before evidence');
reset role;
insert into public.sadu_clearances(dossier_id,pr_cleared_at) values ('test-dossier-a',now());
set local role authenticated;
select pg_temp.check_true((select count(*)=0 from public.bilateral_contracts),'PR alone does not unlock Finance');
reset role;
update public.sadu_clearances set technical_cleared_at=now() where dossier_id='test-dossier-a';
set local role authenticated;
select pg_temp.check_true((select count(*)=1 from public.bilateral_contracts),'both gates unlock accepted contract without crate arrival');
select pg_temp.check_true((select count(*)=1 from storage.objects where bucket_id='contracts'),'Finance sees only cleared contract file');
select pg_temp.check_true((select count(*)=0 from storage.objects where bucket_id='logistics-secure'),'Finance sees neither passport nor unreceived delivery');
do $$ begin
  begin
    update public.sadu_clearances set physical_received_at=now();
    raise exception 'FAIL: Finance forged logistics evidence';
  exception when insufficient_privilege then raise notice 'PASS: Finance cannot forge evidence'; end;
end $$;
reset role;
update public.sadu_clearances set physical_received_at=now() where dossier_id='test-dossier-a';
set local role authenticated;
select pg_temp.check_true((select count(*)=1 from storage.objects where bucket_id='logistics-secure'),'Finance sees received delivery evidence only');
reset role;
set local request.jwt.claims = '{"sub":"55555555-5555-4555-8555-555555555555","institutional_role":"PR_PROTOCOL"}';
set local role authenticated;
select pg_temp.check_true((select count(*)=2 from storage.objects),'PR sees only classified travel documents');
select pg_temp.check_true((select count(*)=0 from public.artist_dossiers),'PR cannot inspect dossier URLs');
reset role;
set local request.jwt.claims = '{"sub":"55555555-5555-4555-8555-555555555555","institutional_role":"PREPARATORY_COMMITTEE"}';
set local role authenticated;
select pg_temp.check_true((select count(*)=1 from storage.objects where name not like 'nominations/%'),'committee sees dossier files only');
reset role;
set local request.jwt.claims = '{"sub":"55555555-5555-4555-8555-555555555555","user_metadata":{"institutional_role":"PR_PROTOCOL"}}';
set local role authenticated;
select pg_temp.check_true((select count(*)=0 from storage.objects),'user_metadata cannot grant role access');
reset role;
rollback;
