-- Local-only. Apply after catalog-freight.sql. No hosted deployment.
begin;
create schema if not exists sadu_private;
create table public.sadu_consignments (
 id uuid primary key default gen_random_uuid(),
 artwork_id uuid not null unique references public.sadu_artwork_checklist(id),
 artist_id uuid not null references auth.users(id),
 origin text not null check(origin in ('ARTIST_STUDIO','THIRD_PARTY_GALLERY')),
 contact_name text, contact_email text,
 status text not null check(status in ('STUDIO_SELECTED','AWAITING_GALLERY','CONSIGNMENT_DATA_RECEIVED')),
 details jsonb, created_at timestamptz not null default now(), received_at timestamptz
);
create table sadu_private.consignment_tokens (
 consignment_id uuid primary key references public.sadu_consignments(id),
 token_hash text not null unique, expires_at timestamptz not null,
 used_at timestamptz
);
alter table public.sadu_consignments enable row level security;
alter table sadu_private.consignment_tokens enable row level security;
revoke all on public.sadu_consignments from anon,authenticated;
revoke all on sadu_private.consignment_tokens from public,anon,authenticated;
grant select on public.sadu_consignments to authenticated;
create policy consignment_read on public.sadu_consignments for select to authenticated using (
 artist_id=auth.uid() or coalesce(auth.jwt()->'app_metadata'->>'institutional_role',auth.jwt()->>'institutional_role')='LOGISTICS'
);
-- Privileged operation is deliberately isolated: verifies owned accepted contract,
-- holds the artwork lock and never accepts caller-provided ownership/status.
create function sadu_private.issue_consignment(a uuid, o text, n text, e text) returns text
language plpgsql security definer set search_path='' as $$
declare owner_id uuid; cid uuid; secret text; oldrow public.sadu_consignments;
begin
 select s.artist_id into owner_id from public.sadu_artwork_checklist w
 join public.sadu_exhibition_scenarios s on s.id=w.scenario_id
 join public.bilateral_contracts c on c.id=s.contract_id
 where w.id=a and c.artist_id=auth.uid() and c.status in ('ARTIST_APPROVED','LOCKED') for update of w;
 if auth.uid() is null or owner_id is distinct from auth.uid() then raise exception 'Owned accepted agreement required';end if;
 if o is null or o not in ('ARTIST_STUDIO','THIRD_PARTY_GALLERY') then raise exception 'Dispatch origin required';end if;
 select * into oldrow from public.sadu_consignments where artwork_id=a;
 if oldrow.status='CONSIGNMENT_DATA_RECEIVED' or exists(select 1 from public.sadu_freight_bookings where artwork_id=a) then raise exception 'Origin locked after submission or booking';end if;
 if o='THIRD_PARTY_GALLERY' and (length(trim(coalesce(n,''))) not between 1 and 200 or length(coalesce(e,''))>254 or coalesce(e,'') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then raise exception 'Gallery name and email required';end if;
 insert into public.sadu_consignments(artwork_id,artist_id,origin,contact_name,contact_email,status)
 values(a,auth.uid(),o,case when o='THIRD_PARTY_GALLERY' then trim(n) end,case when o='THIRD_PARTY_GALLERY' then trim(e) end,case when o='ARTIST_STUDIO' then 'STUDIO_SELECTED' else 'AWAITING_GALLERY' end)
 on conflict(artwork_id) do update set origin=excluded.origin,contact_name=excluded.contact_name,contact_email=excluded.contact_email,status=excluded.status returning id into cid;
 if o='ARTIST_STUDIO' then delete from sadu_private.consignment_tokens where consignment_id=cid;return null;end if;
 secret:=encode(extensions.gen_random_bytes(32),'hex');
 insert into sadu_private.consignment_tokens values(cid,encode(extensions.digest(secret,'sha256'),'hex'),now()+interval '7 days',null)
 on conflict(consignment_id) do update set token_hash=excluded.token_hash,expires_at=excluded.expires_at,used_at=null;
 return secret;
end $$;
-- Capability authorization replaces login only for this single write operation.
-- The public form cannot read any dossier, address, contact or token table.
create function sadu_private.receive_consignment(t text, d jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare ticket sadu_private.consignment_tokens; k text; v numeric;
begin
 if t is null or t !~ '^[a-f0-9]{64}$' then raise exception 'Link invalid, expired or already used';end if;
 select * into ticket from sadu_private.consignment_tokens where token_hash=encode(extensions.digest(t,'sha256'),'hex') for update;
 if not found or ticket.used_at is not null or ticket.expires_at<=now() then raise exception 'Link invalid, expired or already used';end if;
 if not exists(select 1 from public.sadu_consignments g join public.sadu_artwork_checklist w on w.id=g.artwork_id join public.sadu_exhibition_scenarios s on s.id=w.scenario_id join public.bilateral_contracts c on c.id=s.contract_id where g.id=ticket.consignment_id and c.artist_id=g.artist_id and c.status in ('ARTIST_APPROVED','LOCKED')) then raise exception 'Link invalid, expired or already used';end if;
 if d is null or jsonb_typeof(d)<>'object' or octet_length(d::text)>20000 then raise exception 'Invalid consignment data';end if;
 foreach k in array array['length_cm','width_cm','height_cm','weight_kg','insurance_value'] loop
  if jsonb_typeof(d->k) is distinct from 'number' then raise exception 'Positive numeric measurements required';end if;
  v:=(d->>k)::numeric;if v<=0 or v>100000000 then raise exception 'Positive numeric measurements required';end if;
 end loop;
 foreach k in array array['country','city','district','street','building','hours','phone','map_url'] loop
  if jsonb_typeof(d->k) is distinct from 'string' or length(trim(d->>k)) not between 1 and 500 then raise exception 'Complete address and courier instructions required';end if;
 end loop;
 if coalesce(d->>'currency','') not in ('AED','USD','EUR') or d->>'map_url' !~ '^https://(maps\.google\.com|www\.google\.com|maps\.app\.goo\.gl|goo\.gl|www\.makani\.ae|makani\.ae)/[^[:space:]]*$' then raise exception 'Valid currency and map URL required';end if;
 -- Whitelist fields rather than retaining arbitrary untrusted JSON.
 select jsonb_object_agg(key,value) into d from jsonb_each(d) where key=any(array['length_cm','width_cm','height_cm','weight_kg','insurance_value','currency','country','city','district','street','building','hours','phone','map_url']);
 update public.sadu_consignments set details=d,status='CONSIGNMENT_DATA_RECEIVED',received_at=now() where id=ticket.consignment_id and status='AWAITING_GALLERY';
 if not found then raise exception 'Link invalid, expired or already used';end if;
 update sadu_private.consignment_tokens set used_at=now() where consignment_id=ticket.consignment_id;
end $$;
revoke all on function sadu_private.issue_consignment(uuid,text,text,text) from public,anon,authenticated;
revoke all on function sadu_private.receive_consignment(text,jsonb) from public,anon,authenticated;
grant usage on schema sadu_private to anon,authenticated;
grant execute on function sadu_private.issue_consignment(uuid,text,text,text) to authenticated;
grant execute on function sadu_private.receive_consignment(text,jsonb) to anon,authenticated;
create function public.sadu_issue_consignment(a uuid,o text,n text,e text) returns text language sql security invoker set search_path='' as $$select sadu_private.issue_consignment(a,o,n,e)$$;
create function public.sadu_receive_consignment(t text,d jsonb) returns void language sql security invoker set search_path='' as $$select sadu_private.receive_consignment(t,d)$$;
revoke all on function public.sadu_issue_consignment(uuid,text,text,text) from public,anon;
revoke all on function public.sadu_receive_consignment(text,jsonb) from public;
grant execute on function public.sadu_issue_consignment(uuid,text,text,text) to authenticated;
grant execute on function public.sadu_receive_consignment(text,jsonb) to anon,authenticated;
-- Existing bookings retain history; new studio bookings require explicit origin.
create function public.sadu_check_booking_origin() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.sadu_consignments where artwork_id=new.artwork_id and artist_id=auth.uid() and origin='ARTIST_STUDIO') then raise exception 'Select Artist Studio origin; gallery pickups use the consignment ledger';end if;
 return new;
end $$;
revoke all on function public.sadu_check_booking_origin() from public;
create trigger freight_origin before insert on public.sadu_freight_bookings for each row execute function public.sadu_check_booking_origin();
alter publication supabase_realtime add table public.sadu_consignments;
commit;
