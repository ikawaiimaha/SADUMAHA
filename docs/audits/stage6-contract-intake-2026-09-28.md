# Stage 6 contract configuration audit — 28 September 2026

## Delivered
- Strict Director-approved ingestion; separate disputed-agreement queue, mandatory amendment justification, no repeated Director approval.
- Numeric grant, shipping presets, configurable payment presets including 30/70, and zero-tranche payment prevention.
- Artist status CONTRACT_PENDING_SIGNATURE on dispatch; separate invitation identity gate retained before PDF generation. English/Arabic PDF labels with rehearsal watermark.
- Accepted Artist view exposes authenticated passport PDF and high-resolution TIFF/PNG uploads to private logistics-secure storage. TUS progress and explicit retry instructions; file headers checked before transfer; existing objects cannot be overwritten.
- Database ownership and accepted-contract checks; PR reads passports, Technical/Editorial read artwork. No anonymous registry access. Upload status requires an actual stored object, not just a registry row.

## Audit fixes
- Removed amendment fallback to DIRECTOR_APPROVED; retained executive decision independently.
- Removed local disputed-state override that could outlive the actual agreement status.
- Matched App guards to damage/impound/archive holds before updating artist status.
- Replaced misleading three-tranche heading and hid zero schedule rows; zero amounts cannot be paid.
- Disabled legacy simulated image receipts before acceptance and labelled them as simulations.

## Verification
- TypeScript, guard tests and Vite production build.
- Local SQL rollback tests: unsigned/cross-artist registration rejected; PR/Technical document segregation; cross-artist Storage visibility denied.
- Actual local authenticated TUS upload of a fictional passport PDF; server byte count checked and exact test fixtures cleaned up.
- Browser: published upstream theme/guidelines/boundaries, dispatched 30/70 agreement, confirmed legal name, requested an amendment, verified Coordinator reason and saved terms, revised to 50/30/20, accepted, verified secure-intake visibility and unauthenticated upload locks. English and RTL visual inspection. No browser console errors observed.

## Limits
- Contract negotiation remains session rehearsal for Kufic Horizon. Signing and email dispatch are simulated. PDF generation follows identity confirmation, not unverified initial dispatch.
- Authenticated intake requires a separately mapped accepted database agreement; the demo role picker provides no authority. SQL applied only to local Supabase; not automatically deployed by GitHub integration.
- SQL tests use synthetic Storage metadata; the HTTP test additionally verifies one real small passport transfer. No real identity files, hosted upload or full 2 GiB transfer was tested.
- Uploading evidence does not automatically verify a passport or grant PR/Technical clearance. No malware scan or production electronic signature is claimed.
- Existing oversized bundle warning remains. Security policies require the existing local bilateral_contracts schema/ownership RLS; they are not a standalone production migration.
