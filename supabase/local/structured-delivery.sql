-- Local only, after pending-assets.sql. Declared values are not payment approvals.
begin;
create table public.sadu_artwork_values (
 artwork_id uuid primary key references public.sadu_artwork_checklist(id),
 artist_id uuid not null default auth.uid(),
 title text not null default '',
 amount_minor bigint not null check(amount_minor between 0 and 100000000000),
 currency text not null check(currency in ('AED','USD','EUR')),
 purpose text not null check(purpose in ('DECLARED_SALE_VALUE','INSURANCE_VALUE')),
 recorded_at timestamptz not null default clock_timestamp()
);
alter table public.sadu_artwork_values enable row level security;
revoke all on public.sadu_artwork_values from anon,authenticated;
grant select on public.sadu_artwork_values to authenticated;
grant insert(artwork_id,amount_minor,currency,purpose) on public.sadu_artwork_values to authenticated;
create function sadu_private.finance_artwork_visible(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and auth.jwt()->'app_metadata'->>'institutional_role'='FINANCE' and exists(select 1 from public.sadu_artwork_checklist a join public.sadu_exhibition_scenarios s on s.id=a.scenario_id where a.id=p_id and s.status='SUBMITTED');
$$;
revoke all on function sadu_private.finance_artwork_visible(uuid) from public,anon;
grant execute on function sadu_private.finance_artwork_visible(uuid) to authenticated;
create policy artwork_value_read on public.sadu_artwork_values for select to authenticated using(artist_id=auth.uid() or sadu_private.finance_artwork_visible(artwork_id));
create policy artwork_value_insert on public.sadu_artwork_values for insert to authenticated with check(artist_id=auth.uid() and exists(select 1 from public.sadu_artwork_checklist a join public.sadu_exhibition_scenarios s on s.id=a.scenario_id where a.id=artwork_id and s.artist_id=auth.uid() and s.status='DRAFT'));
create function public.sadu_value_stamp() returns trigger language plpgsql security invoker set search_path='' as $$begin
 select source->>'title' into new.title from public.sadu_artwork_checklist where id=new.artwork_id;
 if new.title is null then raise exception 'Owned artwork required';end if;
 new.artist_id:=auth.uid();new.recorded_at:=clock_timestamp();return new;
end $$;
revoke all on function public.sadu_value_stamp() from public;
create trigger value_stamp before insert on public.sadu_artwork_values for each row execute function public.sadu_value_stamp();
create function public.sadu_complete_delivery() returns trigger language plpgsql security invoker set search_path='' as $$
declare expected int; actual int;
begin
 if new.status='SUBMITTED' and old.status='DRAFT' then
  select expected_count into expected from public.sadu_asset_scope where scenario_id=new.id;
  select count(*) into actual from public.sadu_artwork_checklist where scenario_id=new.id;
  if expected is null or expected<>actual then raise exception 'Approved artwork count must match the complete delivery';end if;
  if exists(select 1 from public.sadu_artwork_checklist a where a.scenario_id=new.id and not exists(select 1 from public.sadu_artwork_values v where v.artwork_id=a.id)) then raise exception 'Every artwork requires a structured declared value';end if;
 end if;return new;
end $$;
revoke all on function public.sadu_complete_delivery() from public;
create trigger complete_delivery before update on public.sadu_exhibition_scenarios for each row execute function public.sadu_complete_delivery();
-- Translation staff may read the approved count without access to confidential contract data.
alter policy scope_read on public.sadu_asset_scope using(exists(select 1 from public.sadu_exhibition_scenarios s where s.id=scenario_id) or auth.jwt()->'app_metadata'->>'institutional_role' in ('EDITORIAL','PR_PROTOCOL','HIP'));
commit;
