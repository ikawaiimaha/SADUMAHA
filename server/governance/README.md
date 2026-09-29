# SADU governance integration blueprint

`supabase/local/governance-blueprint.sql` defines the relational model in a private namespace. It is installed locally only, with RLS on every table and no browser schema access. It does not replace or migrate the existing public tables. `validation.ts` supplies framework-neutral server domain middleware; no HTTP endpoints are deployed by this change.

## Required server integration

1. Authenticate the access token with the identity provider and resolve active program membership from the database. Never accept role/program/ownership claims from request JSON. Admin is an administrative role, not an automatic override of institutional approvals.
2. Use a transaction and row lock to read the current participation, artwork revisions, asset verification, policy and approvals. Apply `authorize` and the operation-specific gate before writing. Enforce unique idempotency keys for external events and outbox records. Service credentials must stay on the server.
3. Artist submission requires the approved artwork count, required bilingual fields, complete textual declaration, verified stored image content and configured resolution. Print readiness additionally requires current-revision Editorial approval. Do not take scan results or image sizes from client metadata.
4. Immigration uses an explicitly approved, effective policy. The six-calendar-month rule uses month-end clamping, not 180 days. National-ID country rules are configurable and not activated by this blueprint. IQ/PK appear in tests only; they are not asserted as current law.
5. Render the master contract from an immutable validated snapshot, save its SHA-256, then create the sealed contract record. Provider callbacks must be signature-verified and matched to the contract hash, signer and unique provider event before recording a signature. No DocuSign account or legal-signature certification is provisioned here.
6. Give external vendors only `vendorProjection` for their assigned ticket. Never serialize a full profile, vault row, passport key or contract. The private namespace is intentionally inaccessible until a scoped adapter is implemented.
7. A server worker checks un-actioned shipping tickets using `shippingSLADue`, locks the ticket and queues a deduplicated Admin alert. Receiving and its assigned-Coordinator notification must commit atomically. Workers, not clients, mark delivery receipts. The earlier asset-reminder cron is separate from this future shipping SLA worker.
8. Label rendering must use the approved bilingual snapshot and escape text in the selected renderer. `labelTitle` brackets religious-text titles; it does not confer cultural clearance. A future visual-manifest endpoint should return only reference ID, current label and authorized thumbnail link.
9. CMS delivery must use an allowlisted public payload, publication consent and current approvals; never copy profile or vault JSON wholesale. Configure signed webhooks, retry/idempotency and destination credentials separately.
10. `visaRejectionGate` requires PR authority, a decision reference and legally approved templates for each required language. It does not invent legal wording, send an email, or certify an authority decision. Configure official contact destinations and translation review before enabling delivery.

## Encryption boundary

Vault records contain private object references, hashes and key references. These columns do not themselves encrypt a file. A production upload service must implement and verify the approved encryption/KMS, storage policies, content scanning, access logging and retention controls before setting verification timestamps. No plaintext passport content or keys belong in this schema or a public payload.

## Source and verification

The UAE government's entry guidance states a six-month passport-validity requirement from entry: [official guidance](https://u.ae/en/information-and-services/visa-and-emirates-id/Visa-information/do-you-need-an-entry-permit-or-a-visa-to-enter-the-uae). PR must validate the applicable visa category and approve the operative policy; this source does not establish nationality-specific National ID rules.

Tests: `tests/governanceMiddleware.test.ts` (role isolation, date boundaries, asset completeness/revisions, projection and template gates); `supabase/tests/governance-blueprint.sql` (private schema, RLS coverage, sealed contract immutability). No hosted database changes or external services were called.
