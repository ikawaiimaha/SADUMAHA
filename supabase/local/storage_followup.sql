begin;
drop policy if exists "PR can view approved dossiers" on public.artist_dossiers;
create policy "Committee and director read dossier scope" on public.artist_dossiers
for select to authenticated using (auth.jwt()->>'institutional_role' in ('PREPARATORY_COMMITTEE','BIENNIAL_DIRECTOR'));

drop policy "Document registry role boundaries" on public.sadu_documents;
create policy "Document registry role boundaries" on public.sadu_documents
for select to authenticated using (
  (auth.jwt()->>'institutional_role' = 'COORDINATOR' and coordinator_id = auth.uid() and bucket_id in ('artist-dossiers','contracts'))
  or (auth.jwt()->>'institutional_role' in ('PREPARATORY_COMMITTEE','BIENNIAL_DIRECTOR') and bucket_id = 'artist-dossiers')
  or (auth.jwt()->>'institutional_role' = 'ARTIST' and artist_user_id = auth.uid()
    and (kind in ('PASSPORT','VISA') or (kind = 'CONTRACT' and exists (
      select 1 from public.bilateral_contracts c where c.id = contract_id and c.artist_id = auth.uid()
        and c.status in ('SENT_TO_ARTIST','CONTRACT_DISPUTED','ARTIST_APPROVED','LOCKED')))))
  or (auth.jwt()->>'institutional_role' = 'PR_PROTOCOL' and kind in ('PASSPORT','VISA') and bucket_id = 'logistics-secure')
  or (auth.jwt()->>'institutional_role' = 'FINANCE' and (
    (kind = 'CONTRACT' and exists (select 1 from public.bilateral_contracts c where c.id = contract_id and c.artist_id = artist_user_id))
    or (kind = 'DELIVERY_RECEIPT' and exists (select 1 from public.bilateral_contracts c where c.dossier_id = sadu_documents.dossier_id and c.artist_id = artist_user_id)
      and exists (select 1 from public.sadu_clearances e where e.dossier_id = sadu_documents.dossier_id
      and e.pr_cleared_at is not null and e.technical_cleared_at is not null and e.physical_received_at is not null))
  ))
);

commit;