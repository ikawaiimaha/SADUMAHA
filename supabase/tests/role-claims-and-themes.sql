-- Run after migration 20261014090000; all test records roll back.
\set ON_ERROR_STOP on
begin;
create function pg_temp.check_true(ok boolean, message text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %', message; end if; raise notice 'PASS: %', message; end $$;

-- Token hook: the role table is the only source; stale or forged claims are removed.
insert into auth.users(id,aud,role,email) values
 ('11111111-1111-4111-8111-111111111111','authenticated','authenticated','finance@example.com'),
 ('22222222-2222-4222-8222-222222222222','authenticated','authenticated','norole@example.com');
insert into public.sadu_user_roles(user_id,institutional_role,granted_reason) values
 ('11111111-1111-4111-8111-111111111111','FINANCE','Synthetic test grant');
do $$ begin
  begin
    insert into public.sadu_user_roles(user_id,institutional_role,granted_reason) values ('22222222-2222-4222-8222-222222222222','HIP','Retired role');
    raise exception 'FAIL: HIP role provisioned';
  exception when check_violation then raise notice 'PASS: HIP cannot be provisioned'; end;
end $$;
select pg_temp.check_true(has_function_privilege('supabase_auth_admin','public.sadu_custom_access_token(jsonb)','execute')
  and has_table_privilege('supabase_auth_admin','public.sadu_user_roles','select'),'auth server can run the hook and read roles');
select pg_temp.check_true(
  (select qual='true' from pg_policies where tablename='sadu_user_roles' and roles='{supabase_auth_admin}' and cmd='SELECT'),
  'only the auth server has a role-table policy');
select pg_temp.check_true(
  (select c->>'institutional_role'='FINANCE' and c->'app_metadata'->>'institutional_role'='FINANCE' and c->'app_metadata'->>'provider'='email'
   from (select public.sadu_custom_access_token('{"user_id":"11111111-1111-4111-8111-111111111111","claims":{"sub":"11111111-1111-4111-8111-111111111111","institutional_role":"ADMIN","app_metadata":{"provider":"email","institutional_role":"ADMIN"}}}')->'claims' c) t),
  'hook issues the provisioned role at both claim paths and overrides a forged one');
select pg_temp.check_true(
  (select not (c ? 'institutional_role') and not (c->'app_metadata' ? 'institutional_role')
   from (select public.sadu_custom_access_token('{"user_id":"22222222-2222-4222-8222-222222222222","claims":{"institutional_role":"CHAIRMAN","app_metadata":{"institutional_role":"CHAIRMAN"}}}')->'claims' c) t),
  'hook strips role claims from users without a role row');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","institutional_role":"ADMIN"}',true);
do $$ begin
  begin
    perform 1 from public.sadu_user_roles;
    raise exception 'FAIL: browser role read the role table';
  exception when insufficient_privilege then raise notice 'PASS: browsers cannot read roles'; end;
  begin
    insert into public.sadu_user_roles(user_id,institutional_role,granted_reason) values ('22222222-2222-4222-8222-222222222222','ADMIN','Self-escalation');
    raise exception 'FAIL: browser role granted itself a role';
  exception when insufficient_privilege then raise notice 'PASS: browsers cannot grant roles'; end;
  begin
    perform public.sadu_custom_access_token('{}');
    raise exception 'FAIL: browser role executed the token hook';
  exception when insufficient_privilege then raise notice 'PASS: browsers cannot call the token hook'; end;
end $$;
reset role;

-- Themes: status-bound transitions, no deletes, ratification cannot rewrite text.
insert into public.themes(id,arabic_name,english_name,definition,status) values
 ('theme-draft','مسودة','Draft','Synthetic','DRAFT'),
 ('theme-ratify','مصادقة','Ratify','Synthetic','PENDING_CHAIRMAN_APPROVAL'),
 ('theme-polish','تحرير','Polish','Synthetic','PENDING_EDITORIAL_POLISH'),
 ('theme-published','منشور','Published','Synthetic','PUBLISHED_OFFICIAL');
set local role authenticated;

select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated","app_metadata":{"institutional_role":"PREPARATORY_COMMITTEE"}}',true);
do $$ begin
  delete from public.themes;
  raise exception 'FAIL: Committee deleted themes';
exception when insufficient_privilege then raise notice 'PASS: Committee cannot delete themes'; end $$;
do $$ begin
  begin
    insert into public.themes(id,status) values ('theme-forged','PUBLISHED_OFFICIAL');
    raise exception 'FAIL: Committee inserted a published theme';
  exception when insufficient_privilege then raise notice 'PASS: Committee drafts only'; end;
  insert into public.themes(id,english_name,status) values ('theme-new','New','DRAFT');
  update public.themes set definition='Revised', status='PENDING_CHAIRMAN_APPROVAL' where id='theme-draft';
  if not found then raise exception 'FAIL: Committee could not submit its draft'; end if;
  update public.themes set definition='Rewritten' where id in ('theme-polish','theme-published');
  if found then raise exception 'FAIL: Committee edited a theme past its stage'; end if;
  begin
    update public.themes set status='PUBLISHED_OFFICIAL' where id='theme-new';
    raise exception 'FAIL: Committee published a theme';
  exception when insufficient_privilege then raise notice 'PASS: Committee cannot publish'; end;
end $$;

select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated","app_metadata":{"institutional_role":"CHAIRMAN"}}',true);
do $$ begin
  begin
    update public.themes set english_name='Chairman rewrite', status='PENDING_EDITORIAL_POLISH' where id='theme-ratify';
    raise exception 'FAIL: ratification rewrote theme text';
  exception when insufficient_privilege then raise notice 'PASS: ratification cannot rewrite text'; end;
  begin
    update public.themes set status='PUBLISHED_OFFICIAL' where id='theme-ratify';
    raise exception 'FAIL: Chairman skipped editorial polish';
  exception when insufficient_privilege then raise notice 'PASS: Chairman cannot publish'; end;
  update public.themes set status='PENDING_EDITORIAL_POLISH' where id='theme-ratify';
  if not found then raise exception 'FAIL: Chairman could not ratify'; end if;
  update public.themes set status='DRAFT' where id='theme-published';
  if found then raise exception 'FAIL: Chairman reopened a published theme'; end if;
end $$;

select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","app_metadata":{"institutional_role":"EDITORIAL_DEPARTMENT"}}',true);
do $$ begin
  update public.themes set arabic_name='تحرير نهائي', status='PUBLISHED_OFFICIAL' where id='theme-polish';
  if not found then raise exception 'FAIL: Editorial could not publish'; end if;
  update public.themes set definition='Silent edit' where id='theme-published';
  if found then raise exception 'FAIL: published theme was edited'; end if;
  begin
    update public.themes set id='theme-renamed' where id='theme-ratify';
    raise exception 'FAIL: theme identity changed';
  exception when insufficient_privilege then raise notice 'PASS: theme identity is immutable'; end;
end $$;

select set_config('request.jwt.claims','{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated","app_metadata":{"institutional_role":"FINANCE"}}',true);
select pg_temp.check_true((select array_agg(id order by id)=array['theme-polish','theme-published'] from public.themes),'other roles read only published themes');
select set_config('request.jwt.claims','{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated","user_metadata":{"institutional_role":"PREPARATORY_COMMITTEE"}}',true);
select pg_temp.check_true((select count(*)=0 from public.themes where status<>'PUBLISHED_OFFICIAL'),'user_metadata cannot grant theme access');
reset role;
set local role anon;
do $$ begin
  perform 1 from public.themes;
  raise exception 'FAIL: anonymous users queried themes';
exception when insufficient_privilege then raise notice 'PASS: anonymous users have no theme access'; end $$;
reset role;
rollback;
