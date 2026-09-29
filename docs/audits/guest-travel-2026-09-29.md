# Guest self-service and PR queue audit

Implemented private authenticated travel intake, immutable document packets, retry without duplicate registration, minimal PR roster, missing-submission cards, search/sort and polling. Original companion records remain accessible under Earlier companion requests.

## Checks
- TypeScript, production build and 124 guard tests.
- Local rollback SQL: owner-only insert, accepted contract gate, date order, server name snapshot, immutable rows, PR read, denied Coordinator/cross-owner/user-metadata spoof reads and denied PR uploads.
- Local private Storage API: uploaded/retrieved fictional PDF bytes and verified server size.
- Mocked browser flow on desktop/mobile: invalid PDF rejected, interrupted photo upload retried, single registered intake, PR queue update, missing guests, search/sort, no page errors or horizontal overflow.

## Boundaries
- SQL applied locally only, intentionally outside automatic deployment migrations.
- Stage 5/VIP identity provisioning and invitation mail delivery are not implemented; no emails sent.
- New self-service requires an owned accepted database agreement; session approvals do not create database privileges.
- PR roster helper uses a narrowly scoped private SECURITY DEFINER function, checks authenticated identity and trusted app_metadata role, returns only accepted contract ID/name, has no PUBLIC execution grant; public wrapper is SECURITY INVOKER.
- Storage and row access are RLS-enforced. A green uploaded badge is not a scan-quality review. Content scanning/server image decoding, formal PR adjudication and durable upload retry remain production follow-ups.
- Existing chunk-size warning remains; no dependency upgrade or unrelated redesign.
