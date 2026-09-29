# Third-party gallery consignment — 29 September 2026

## Implemented

The shared FreightPickupScheduler used by ArtistPortalWorkspace, LogisticsWorkspace and workspaces/LogisticsDashboard now includes GalleryConsignmentLedger. The authenticated `/pilot` also exposes it. Each artwork requires an explicit studio/gallery origin. Studio pickup inserts are guarded in the database. Existing bookings remain intact; booked origins cannot be replaced.

Artists with an owned accepted agreement can prepare a seven-day, single-submission gallery link. Gallery contact name and email are required. The pilot **does not send email**: the UI explains that the artist must share the prepared link. No message was sent during verification.

`/gallery-consignment` accepts structured packed dimensions, gross weight, declared insurance value/currency, facility address, map URL, opening hours and courier contact. Submission atomically consumes the token, timestamps and locks the data as CONSIGNMENT_DATA_RECEIVED. Logistics reads it under RLS and can download a PDF manifest. Declared insurance value does not constitute insurance approval.

## Security review

- 256-bit random tokens, SHA-256 hashes only in a private schema. Raw token returned only at issue time; regeneration invalidates the old link.
- Token in URL fragment, not query string. Removed from address bar after successful submission. Treat the link as a secret bearer capability; forwarding grants submission authority, not verified gallery identity.
- Public RPC wrappers are security-invoker. Narrow private security-definer implementations intentionally mediate the capability, with empty search paths, explicit grants, accepted-agreement/ownership validation, bounded input and atomic token locking.
- Anonymous users cannot SELECT or mutate the consignment table. Authenticated reads limited to owner or trusted Logistics claim. No client UPDATE/DELETE privileges.
- Gallery links cannot be replayed, used after expiration or submitted after agreement acceptance is revoked. Submitted data/origin cannot be overwritten.
- Role switching in rehearsal does not grant database access. User-editable metadata cannot grant Logistics access.
- Private fields are rendered as text, including PDF canvas rendering; no untrusted HTML.

## Verification

- Production build and 105 guard tests.
- `supabase/tests/gallery-consignment.sql`: rollback tests for expired/replaced/replayed capabilities, invalid data, anonymous reads, forged role, cross-artist issuance and immutable receipt.
- `supabase/tests/gallery-api-local.mjs`: real local HTTP flow from owner issuance to anonymous submission and Logistics readback; replay and anonymous reads rejected.
- Existing catalog/freight SQL regression and two-client shipment/translation Realtime test passed.
- Browser inspection: labeled bilingual controls, disabled incomplete submission, stone reading surfaces; no console errors observed. Screenshot saved under the local visualizations directory. Authenticated UI and generated PDF were not visually exercised end to end.

## Deployment and practical boundaries

Applied **locally only** via `supabase/local/gallery-consignment.sql`, after catalog-freight.sql. Hosted database and mail transport unchanged. Before hosted rollout, configure HTTPS, rate limiting and approved transactional email transport; review the capability endpoints and retention policy.

This intake describes one consolidated consignment per artwork. Differently sized multiple crates still need a future per-crate extension; the form explicitly tells the gallery to coordinate before submitting. Gallery records appear in the separate consignment ledger, not as fabricated studio pickup bookings. They do not clear receipt/Finance gates or book transport.

PDF manifests use rasterized text to preserve mixed Arabic/Latin rendering and paginate long entries. They are printable snapshots, not accessible tagged PDFs or carrier-certified documents. Post-submission corrections currently require a separately authorized amendment mechanism; artists and galleries cannot silently rewrite records.
