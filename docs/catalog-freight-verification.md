# Catalog metadata, translation and freight — local verification

## Implemented

- The authenticated Exhibition Scenario now registers one immutable catalog record per uploaded artwork file. Required data includes original-language title, materials, year, a concept of at most 50 words, dimensions, packed weight and crate count. An Arabic draft can be supplied; official Arabic approval belongs to Editorial.
- Every declared artwork must have a registered uploaded file and metadata before final scenario submission. The database enforces this, not just the button.
- Source text and official Arabic use JSONB. Original text is retained. Editorial supplies the official Arabic title, materials, concept and biography (when provided), with server-recorded approver and timestamp.
- Logistics can read measurements while text is PENDING_TRANSLATION. Translation completion updates all subscribed metadata views. This resolves the contradictory request to both start planning immediately and block Logistics until translation: planning is available immediately; official label export waits for translation approval.
- Coordinator and PR export translation-completed labels as UTF-8 CSV, with quoting and spreadsheet-formula neutralization. CSV is a timestamped snapshot, not a live document.
- Pickup requests require an accepted owned agreement, structured country/city/district/street/building, date controls, optional complete unavailability range, and an HTTPS Google Maps/Makani URL. The pin is artist supplied, not independently verified.
- Submitted addresses/dates lock. Artists request a date change; Logistics accepts or rejects it. Pending changes block dispatch. Original and amended dates remain in server-written history. Stale UI decisions use conditional updates.
- Logistics records ordered shipment milestones. A condition-report reference is mandatory for Received & Condition Checked. Artist views subscribe to Supabase Realtime and have a 15-second refresh fallback.

## Verification performed

- npm run build: TypeScript, 104 guard tests and Vite passed. Existing large-bundle warning remains.
- supabase/tests/catalog-freight.sql: local transactional role, source immutability, date-change, inspection-reference, translation and unauthorized-access tests passed.
- supabase/tests/exhibition-scenarios.sql: updated regression passed with the new per-artwork requirement.
- supabase/tests/catalog-realtime-local.mjs: authenticated Logistics API update and Editorial translation approval both reached a separate Artist client through real local Supabase Realtime; history readback passed. Synthetic fixtures were removed.
- Browser: Editorial disclosure opens by keyboard; Logistics and Editorial show an honest signed-out state. RTL viewport checked without horizontal overflow. An authenticated browser walkthrough with real institutional accounts was not performed.

## Rollout and remaining boundaries

The schema is in supabase/local/catalog-freight.sql, intentionally outside automatic GitHub migrations. Applied to the local SADUMAHA database only, after exhibition-scenarios.sql. No hosted schema, real booking, external email or financial transfer was performed.

The authenticated freight tracker is per artwork, with a crate count; it does not replace the existing single-crate rehearsal receiving ledger or automatically authorize Finance. A tracking reference is not proof of a complete physical inspection. Customs documents, custody transfers and independent condition-evidence verification remain follow-up work.

This change does not introduce jury scoring, IT impersonation, legal delegation mandates, or a new Finance power to reject passports. Those require separately defined authority and evidence rules.
