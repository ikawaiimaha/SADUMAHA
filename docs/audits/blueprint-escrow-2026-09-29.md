# Blueprint escrow audit

Changes: SpatialZone requirement flag, PDF category, 20 MiB/header validation, resumable transfer reuse, draft recovery validation, catalog-media exclusion, final submission/escrow database checks, execution prerequisite trigger, and accurate private-vault wording.

Authorization: existing invoker/RLS rules retained. Uploaded files remain bound to scenario/zone, not technician identity. Technical role access uses trusted app_metadata. No new write or execution grants. No email, new public links, or hosted deployment.

Verification: build/121 guard tests passed; local SQL rollback suite verifies missing blueprint rejection, successful locked submission, Technical reading, unrelated artist/PR denial, passport isolation, missing-byte readiness revocation, forged role denial and blocked execution. Object fixtures represent completed Storage metadata, not actual HTTP uploads.

Limits: required planning is declared in authenticated Stage 6 zones; Stage 4 session dossier mapping is not implemented. No production delegation identity provisioning. PDF header/MIME validation does not certify safe content or structural approval. Existing >500 kB bundle warning remains. Local schema at supabase/local/blueprint-escrow.sql requires earlier scenario/catalog/escrow scripts.

Browser verification: desktop/mobile fixture tests passed for PDF input, rejection of renamed non-PDF bytes and disabled final submission. Visual audit found intrinsic fieldset/file-input overflow; min-width and bounded file-input fixes were added, with an explicit viewport overflow assertion.
