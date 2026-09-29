-- Local only, after editorial-policy.sql. Existing unbundled media stays historical.
begin;
alter table public.sadu_scenario_media add column asset_metadata jsonb;
create function public.sadu_require_asset_bundle() returns trigger language plpgsql security invoker set search_path='' as $$
declare k text;
begin
 if new.category='BLUEPRINT' then return new;end if;
 foreach k in array array['title','medium','year','height','width','depth'] loop
  if jsonb_typeof(new.asset_metadata->k) is distinct from 'string' or length(trim(new.asset_metadata->>k)) not between 1 and 250 then raise exception 'Artwork metadata required before upload';end if;
 end loop;
 if new.asset_metadata->>'year' !~ '^\d{4}$' or (new.asset_metadata->>'year')::int not between 1000 and extract(year from current_date)::int then raise exception 'Invalid production year';end if;
 foreach k in array array['height','width','depth'] loop
  if new.asset_metadata->>k !~ '^[0-9]+(\.[0-9]+)?$' or (new.asset_metadata->>k)::numeric<=0 or (new.asset_metadata->>k)::numeric>=100000 then raise exception 'Invalid artwork dimensions';end if;
 end loop;return new;
end $$;
revoke all on function public.sadu_require_asset_bundle() from public;
create trigger asset_bundle before insert on public.sadu_scenario_media for each row execute function public.sadu_require_asset_bundle();
create function public.sadu_match_asset_bundle() returns trigger language plpgsql security invoker set search_path='' as $$
declare b jsonb;
begin
 select asset_metadata into b from public.sadu_scenario_media where object_name=new.media_object_name;
 if b is not null and (new.source->>'title' is distinct from b->>'title' or new.source->>'medium' is distinct from b->>'medium' or new.production_year is distinct from (b->>'year')::int or new.height_cm is distinct from (b->>'height')::numeric or new.width_cm is distinct from (b->>'width')::numeric) then raise exception 'Catalog data must match the immutable uploaded artwork bundle';end if;
 return new;
end $$;
revoke all on function public.sadu_match_asset_bundle() from public;
create trigger asset_bundle_match before insert on public.sadu_artwork_checklist for each row execute function public.sadu_match_asset_bundle();
commit;
