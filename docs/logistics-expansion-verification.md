# Logistics expansion verification

## Implemented boundaries

- Hospitality shows `Pending approved entitlement / بانتظار اعتماد مخصصات الاستضافة`. No grant-to-flight or hotel-night matrix is assumed.
- Companion PDFs use authenticated `logistics-secure` uploads and an immutable request registry. Only the owning artist and PR can read registered requests. Failed uploads are omitted from the displayed queue. Self-funding acknowledgment is a request record, not a visa approval.
- `supabase/local/hospitality-intake.sql` was applied to the local SADUMAHA Docker database only, after the existing contract-intake schema. It is intentionally outside automatic hosted migrations.
- Gallery capacity uses actual session spatial claims and roster widths, adding 40 cm per artwork. Missing measurements never show a false passing result. This is a linear planning estimate, not engineering clearance.
- The single-work rehearsal contract explicitly selects international freight or local fabrication. Local fabrication requires a sample vendor, excludes freight/pickup creation, and records proof approval before delivery. Historical production events retain their agreement revision.
- Each approved crate has a revision-bound QR/manual ID and downloadable rehearsal PDF. The current contract schema supports one crate per agreement. No multi-crate allocation is implied.
- Receipt and condition inspection are atomic for QR intake. Damage requires evidence. An intact report for the current receipt is required for the delivery tranche. Completion still requires exhibition close-out and reconciliation.

## Verification

- TypeScript and production build passed; existing bundle-size warning remains.
- 102 guard tests passed, including local-production routing, immutable accepted terms, meterage, stale QR IDs, damaged receipts, and separate payment milestones.
- Local transactional RLS tests passed: owner registration; unsigned-contract denial; immutable request; PR access; Coordinator denial; forged user metadata denial; cross-artist and unregistered-file denial.
- Local authenticated storage transfer test passed using a fictional PDF; server byte count and returned content matched. Only temporary test fixtures were cleaned up.
- Browser checked the active Logistics and PR desks, capacity input, pending entitlement, and RTL layout. No horizontal overflow in the inspected PR viewport.

## Limits

- Hosted rollout and real institutional account onboarding remain separate. The browser walkthrough did not sign into a real PR/Artist account or perform a complete contract-to-receipt journey.
- Session planning/receipts are not persistent database approvals. Companion queue refresh is manual on demand and automatic when entering the workspace.
- QR receiving supports a keyboard scanner or manual ID; no camera-scanning integration is claimed.
