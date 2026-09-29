# SDC headless publication connector

Apply local scripts in order: materials-receiving.sql, publication-handoff.sql, publication-worker.sql (and their existing prerequisites). Hosted schema application remains separate.

Set server-only variables from env.example in a trusted worker environment:
- SDC_CMS_WEBHOOK_URL: empty until IT provides an HTTPS endpoint under sdc.gov.ae.
- SDC_CMS_WEBHOOK_TOKEN: IT-issued bearer credential.
- SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY: server database access, never browser variables.

Run `npm run cms:worker` as a supervised Node process; use `npm run cms:worker -- --once` for one cycle. Empty endpoint/token exits without contacting a destination. The repo does not deploy this process automatically. Do not point the worker at production until the local schemas and RLS have been reviewed and migrated.

Editorial Ready for Public creates the queue entry transactionally. The active worker polls every 15 seconds, claims eligible rows, rechecks accepted contract and object-bound review evidence, generates private media URLs valid for 300 seconds, and POSTs JSON. URLs must be ingested by the CMS, not stored as permanent public links. Private blueprints/passports and internal object names are not transmitted. Bios are included only when present in the approved bilingual text.

Contract version 1:
- Header `Idempotency-Key`: `sadu:<scenario_id>:<approved_at>`
- JSON `event_id`, `schema_version`, bilingual `exhibition_title`, `artworks` (reference, bilingual public text, year, dimensions, temporary media URL and expiry).
- Required success: HTTP 2xx JSON `{ "accepted": true, "event_id": "<same event_id>" }` after ingesting the snapshot/media. CMS must deduplicate by event_id.
- Redirects, mismatched acknowledgments, expired/replaced assets and network errors fail closed. Backoff retries preserve the event_id. A crash after CMS acceptance may retry; CMS idempotency is mandatory.
- Synced means delivery acknowledged, not independent confirmation the website is publicly visible.

IT must finalize endpoint mapping, permitted media formats, authentication/rotation, withdrawals, versioned corrections and worker hosting. No official SDC API behavior is assumed to exist. New versions require a future approved revision workflow; current rows are immutable to browser roles.
