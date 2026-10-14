# SADU local storage policy validation

Target: local SADUMAHA-main only. No remote link, pull, push, or hosted SQL execution was used.
Studio: http://127.0.0.1:55323/ ; API: http://127.0.0.1:55321/ ; database: port 55322.
Default 5432x ports belong to another project and were left untouched.

Canonical migration: ../migrations/20260928120746_sadu_storage_boundaries.sql.
`storage_hardening.sql` and `storage_followup.sql` retain the local iteration scripts; do not reapply them to the migrated database.

## Access model

- Three private buckets: artist-dossiers, contracts, logistics-secure.
- Existing trusted top-level institutional_role JWT claim is required. user_metadata never grants access. Provisioning the custom token hook/roles is not implemented by this change.
- Contract artist_id maps to the Auth UID. dossier_id separately references the text dossier key; coordinator_id scopes coordinator access.
- Coordinator can create/edit drafts and dispatch once. Dispatched, signed, locked and disputed rows cannot be rewritten. Reopening an amendment requires a future explicit validated server operation; clients cannot unlock it.
- Artist may read their dispatched/accepted contract and accept it, but cannot rewrite its terms or identities.
- Finance reads accepted contracts only when independent PR and Technical timestamps exist. Arrival is not an Advance prerequisite. Delivery receipt documents additionally require physical receipt.
- PR can read registered passport/visa documents only. Finance and Committee cannot read passports.
- Trusted server/admin code must register exact file paths, types and identity mappings in sadu_documents, and record reviewed evidence in sadu_clearances. Browser roles cannot write those tables. File names are not evidence of document type or authenticity.
- Storage uploads are append-only: no client overwrite, rename or delete. Artist uploads require both their UID folder and a pre-registered passport/visa slot. Dossier uploads require a draft dossier; contract uploads require a draft assigned contract.
- No frontend backend integration, real files, banking, signatures, or hosted deployment were added. Existing theme and other dossier policies are outside this focused storage change and have not been certified production-safe.

## Verification

Run in PowerShell from the repository root:

```powershell
Get-Content -Raw supabase/tests/storage_boundaries.sql | docker exec -i supabase_db_SADUMAHA-main psql -U postgres -d postgres -v ON_ERROR_STOP=1
npx supabase db advisors --local --type security --level warn
npx supabase migration list --local
npx supabase db diff --local --schema public,storage --use-pg-delta
```

SQL tests impersonate anonymous/authenticated roles and synthetic trusted claims, exercise positive and negative RLS cases, then roll back all fictional fixture metadata. These are database policy tests, not Storage HTTP upload tests. Real end-to-end Auth/Storage testing remains necessary before remote promotion.

Local migration replay succeeded. The pg-delta comparison emits a function-definition formatting difference for sadu_guard_contract_update; no table or policy differences were emitted. Both Authentication > Policies and Storage > Policies were inspected in local Studio. Security advisors reported no issues.
