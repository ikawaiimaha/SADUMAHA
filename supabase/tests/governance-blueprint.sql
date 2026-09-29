begin;
do $$begin
 if exists(select 1 from pg_tables where schemaname='sadu_governance' and not rowsecurity) then raise exception 'RLS missing';end if;
 if has_schema_privilege('authenticated','sadu_governance','USAGE') or has_schema_privilege('anon','sadu_governance','USAGE') then raise exception 'Private blueprint exposed';end if;
end$$;
insert into auth.users(id) values('11111111-1111-4111-8111-111111111111');
insert into sadu_governance.programs(id,name,starts_on,ends_on) values('22222222-2222-4222-8222-222222222222','Test','2026-10-07','2026-11-15');
insert into sadu_governance.artist_profiles(id,user_id,legal_name,nationality_code) values('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','Test','AE');
insert into sadu_governance.participations(id,program_id,artist_id,coordinator_id) values('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111');
insert into sadu_governance.contracts(participation_id,revision,snapshot,pdf_object_key,pdf_sha256) values('44444444-4444-4444-8444-444444444444',1,'{}','private/test.pdf',repeat('a',64));
do $$begin begin update sadu_governance.contracts set snapshot='{"tampered":true}';raise exception 'Mutable sealed contract';exception when others then if SQLERRM not like 'Immutable receipt%' then raise;end if;end;end$$;
set local role authenticated;
do $$begin begin perform 1 from sadu_governance.document_vault;raise exception 'Browser vault access';exception when insufficient_privilege then null;end;end$$;
rollback;
