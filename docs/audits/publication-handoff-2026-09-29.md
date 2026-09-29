# Publication handoff audit — 29 September 2026

Added shared title headers, per-file stored/reviewed receipts, Editorial public-readiness gate, local outbox and a server-only polling connector. Physical logistics and Finance gates are unchanged.

Security: RLS ownership/role checks; invoker views/triggers; no anon exposure; explicit snapshot field allowlist; object-ID-bound reviews; private short-lived URLs; HTTPS SDC hostname restriction; redirect blocking; server-only secrets; delivery acknowledgments; leased retries with idempotency. Browser clients cannot set delivery/sync results.

Verification: local rollback SQL verifies title/media prerequisites, Editorial-only queueing, duplicate prevention, read isolation and prohibited client delivery writes. Three worker tests cover missing/invalid configuration, acknowledgment matching, sanitized outgoing payload and retry state. Desktop/mobile browser flow verifies upload versus approval, disabled readiness gate, approval and pending delivery. Mobile screenshot inspected; timestamp bidi presentation corrected. Build and 134 existing guard checks passed before worker addition; final build includes worker checks.

Limitations: local SQL only. No external API, credentials or deployed worker; no live SDC website update was attempted. Metadata and media receipts are not malware or legal certification. Revision/withdrawal and CMS-specific protocol remain integration work. Existing large-bundle warning persists.
