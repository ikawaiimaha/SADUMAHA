-- The asset escrow view is security_invoker, so it inherited scenario_publication_read
-- (EDITORIAL, PR_PROTOCOL, HIP may read SUBMITTED scenarios for publication). That let
-- publication-only roles see contract ids, artwork checklists and escrow readiness.
-- Restrict the view to its original audience: the owning artist and coordinator,
-- Logistics, the Biennial Director and Technical. Base-table publication reads are unchanged.
begin;

create or replace view public.sadu_asset_escrow with (security_invoker = true) as
select s.id as scenario_id,
  s.contract_id,
  s.status,
  s.submitted_at,
  s.artwork_checklist,
  s.status = 'SUBMITTED' and s.submitted_at is not null and jsonb_array_length(s.artwork_checklist) > 0
  and not exists (
    select 1
    from jsonb_array_elements(s.artwork_checklist) z(value)
    cross join (values ('PRINT','printRequired'), ('AV','avRequired'), ('BLUEPRINT','requires_spatial_planning')) required(category, flag)
    where coalesce((z.value ->> required.flag)::boolean, false)
      and not exists (
        select 1
        from public.sadu_scenario_media m
        join storage.objects o on o.bucket_id = 'logistics-secure' and o.name = m.object_name
        where m.scenario_id = s.id and m.zone_id::text = (z.value ->> 'id')
          and m.category = required.category
          and (o.metadata ->> 'size')::bigint >= 1 and (o.metadata ->> 'size')::bigint <= 2147483648
          and (m.category = 'PRINT' and (o.metadata ->> 'mimetype') in ('image/png','image/tiff')
            or m.category = 'AV' and (o.metadata ->> 'mimetype') in ('video/mp4','video/quicktime')
            or m.category = 'BLUEPRINT' and (o.metadata ->> 'mimetype') = 'application/pdf'
              and (o.metadata ->> 'size')::bigint <= 20971520))) as escrow_ready
from public.sadu_exhibition_scenarios s
where s.artist_id = auth.uid() or s.coordinator_id = auth.uid()
  or public.sadu_institutional_role() in ('LOGISTICS','BIENNIAL_DIRECTOR','TECHNICAL');

commit;
