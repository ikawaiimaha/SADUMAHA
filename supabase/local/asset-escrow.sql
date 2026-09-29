-- Requires the previously reviewed exhibition-scenarios and contract-intake schemas.
-- Additive, locally tested; do not deploy before the prerequisite schemas.
begin;
create policy scenario_technical_read on public.sadu_exhibition_scenarios
for select to authenticated using (
 status='SUBMITTED' and auth.jwt()->'app_metadata'->>'institutional_role'='TECHNICAL'
);
-- Invoker semantics preserve scenario, registry and private-object RLS.
create view public.sadu_asset_escrow with (security_invoker=true) as
select s.id as scenario_id,s.contract_id,s.status,s.submitted_at,s.artwork_checklist,
 (s.status='SUBMITTED' and s.submitted_at is not null
  and jsonb_array_length(s.artwork_checklist)>0
  and not exists (
   select 1 from jsonb_array_elements(s.artwork_checklist) z
   cross join (values ('PRINT','printRequired'),('AV','avRequired')) required(category,flag)
   where (z->>required.flag)::boolean and not exists (
    select 1 from public.sadu_scenario_media m join storage.objects o
     on o.bucket_id='logistics-secure' and o.name=m.object_name
    where m.scenario_id=s.id and m.zone_id::text=z->>'id' and m.category=required.category
     and (o.metadata->>'size')::bigint between 1 and 2147483648
     and ((m.category='PRINT' and o.metadata->>'mimetype' in ('image/png','image/tiff'))
      or (m.category='AV' and o.metadata->>'mimetype' in ('video/mp4','video/quicktime')))
   )
  )) as escrow_ready
from public.sadu_exhibition_scenarios s;
revoke all on public.sadu_asset_escrow from public,anon,authenticated;
grant select on public.sadu_asset_escrow to authenticated;
comment on view public.sadu_asset_escrow is 'Live media-evidence readiness only. Not a legal signature, contract status, cultural clearance or payment authorization.';
commit;
