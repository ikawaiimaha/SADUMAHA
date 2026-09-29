-- Local only, after label-formatting.sql and asset-escrow.sql.
begin;
create policy technical_submitted_labels on public.sadu_artwork_checklist for select to authenticated using (
 auth.jwt()->'app_metadata'->>'institutional_role'='TECHNICAL'
 and exists(select 1 from public.sadu_exhibition_scenarios s where s.id=scenario_id and s.status='SUBMITTED')
);
commit;
