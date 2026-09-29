# Textual verification, asset escrow and iterative execution audit

## Changes
- Exact source text/references and translation/context are mandatory when text is declared. HIP-only verification binds dossier ID, work title and exact declaration; changed content fails closed. Committee and Director retain nomination decision authority.
- Committee endorsement and Director queue eligibility both check verification. No-content declarations still require normal Committee review.
- Agreement acceptance and release of executive holds no longer assert CONTRACT_EXECUTED. Production advance prerequisites are unchanged.
- Private asset escrow requires a locked submitted checklist and current valid Storage evidence for every declared category/zone. Invoker-view RLS preserves account isolation. Technical reads submitted art files, not passport intake; it cannot edit scenarios. One-minute links are minted on demand.
- Prototype completion is revision-bound, Technician-only and blocked until Artist approval. First decision/completion timestamps remain unchanged. Rejected and older tests remain historical.

## Validation
- npm run build: TypeScript, 115 guard tests and Vite pass (existing bundle-size warning).
- Playwright textual-production-gates.spec.ts: 4 passed across desktop/mobile, no captured page errors. Role-switch persistence and changed-content/revision invalidation verified.
- supabase/tests/asset-escrow.sql: rollback fixture passes locally; missing assets, private passport isolation, PR/cross-artist denial, Technical read-only access and user_metadata role forgery tested.
- git diff --check passes. New controls use logical spacing and native dialog keyboard behavior. React best-practices checklist applied.

## Limits and rollout
- SQL applied only to local SADUMAHA Supabase. File is deliberately in supabase/local, outside automatic Git migration deployment. Apply after prerequisite scenario/contract-intake schemas during a separate hosted rollout.
- HIP verification and iterative photos/tickets remain session rehearsal records, not authenticated legal signatures or persistent audit evidence. The existing PostgreSQL Committee pipeline has not been extended to store textual approvals.
- Escrow is a storage-evidence gate, not an automatic legal execution status or payment release. The authenticated ledger does not map demo artist IDs to real Auth users. No hosted upload/download flow or large-file transfer was performed in this audit.
- No emails sent; no real religious source content invented; no external links accepted as delivered assets.
