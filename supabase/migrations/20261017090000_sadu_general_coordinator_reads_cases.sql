-- The General Coordinator (المنسقة) follows every artist case and its decisions, read only.
-- Read policies gain GENERAL_COORDINATOR; every write policy stays with the Coordinator.
begin;

drop policy "stage4_review_read" on public.artist_dossiers;
create policy "stage4_review_read" on public.artist_dossiers for select to authenticated
using (public.sadu_dossier_role() in ('COORDINATOR', 'GENERAL_COORDINATOR', 'PREPARATORY_COMMITTEE', 'BIENNIAL_DIRECTOR'));

drop policy case_works_read on public.sadu_case_works;
create policy case_works_read on public.sadu_case_works for select to authenticated
using (public.sadu_dossier_role() in ('COORDINATOR', 'GENERAL_COORDINATOR', 'PREPARATORY_COMMITTEE', 'BIENNIAL_DIRECTOR'));

drop policy decisions_read on public.sadu_nomination_decisions;
create policy decisions_read on public.sadu_nomination_decisions for select to authenticated
using (public.sadu_dossier_role() in ('COORDINATOR', 'GENERAL_COORDINATOR', 'PREPARATORY_COMMITTEE', 'BIENNIAL_DIRECTOR'));

drop policy committee_batches_read on public.sadu_committee_batches;
create policy committee_batches_read on public.sadu_committee_batches for select to authenticated
using (public.sadu_dossier_role() in ('COORDINATOR', 'GENERAL_COORDINATOR', 'PREPARATORY_COMMITTEE', 'BIENNIAL_DIRECTOR'));

drop policy committee_batch_cases_read on public.sadu_committee_batch_cases;
create policy committee_batch_cases_read on public.sadu_committee_batch_cases for select to authenticated
using (public.sadu_dossier_role() in ('COORDINATOR', 'GENERAL_COORDINATOR', 'PREPARATORY_COMMITTEE', 'BIENNIAL_DIRECTOR'));

drop policy art_ideas_read on public.sadu_art_ideas;
create policy art_ideas_read on public.sadu_art_ideas for select to authenticated
using (public.sadu_dossier_role() in ('COORDINATOR', 'GENERAL_COORDINATOR'));

-- Work images, CVs, decision emails and sent decks.
drop policy nomination_read on storage.objects;
create policy nomination_read on storage.objects for select to authenticated
using (
  bucket_id = 'artist-dossiers' and (storage.foldername(objects.name))[1] = 'nominations'
  and public.sadu_dossier_role() in ('COORDINATOR', 'GENERAL_COORDINATOR', 'PREPARATORY_COMMITTEE', 'BIENNIAL_DIRECTOR'));

commit;
