# Edition-bounded pickup calendar audit

- Fixed: a valid HTML calendar date could previously be in December despite the September delivery deadline.
- UI: min is the current Dubai calendar day, max is CATALOG_SCHEDULE.delivery (2026-09-10). Shared validation covers initial booking, artist amendments and Logistics approval. Expired intake is disabled with an explicit message. Dates outside the window do not silently roll to another month.
- Local SQL: invoker trigger checks new bookings, changed ready dates, requested dates, resolved approvals and out-of-window dispatch; no RLS grants widened. Historical tracking is retained. SQL cutoff and TypeScript edition constant are tested; both require an approved coordinated update for a future edition.
- Existing publication revision lock/current-only design export is retained. This patch does not implement hosted publication persistence or change sample records.

Verification: npm run build passed (120 guard tests); desktop/mobile pickup-calendar browser tests passed; local pickup-calendar.sql applied and rollback SQL tests passed. SQL tests use the real trigger on a temporary fixture plus verify its attachment to the real booking table; they do not falsify the server date or claim a successful live artist booking. Existing bundle-size warning remains.

Deployment: frontend committed for the normal Git deployment. supabase/local/pickup-calendar.sql is local-only and is not in auto-deployed migrations. Hosted enforcement still requires a reviewed deployment. Historical catalog-freight fixture suites that assume intake is still open need a controlled historical test clock before rerunning with this cutoff enabled.

Reference consulted: https://supabase.com/docs/guides/database/postgres/triggers
