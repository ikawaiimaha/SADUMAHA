# Invitation and identity rehearsal audit — 28 September 2026

## Implemented and checked
- Assigned Coordinator prepares validated terms and records an invitation; no premature contract is created.
- Artist must confirm a nonblank legal name and acknowledgement in a keyboard-accessible modal.
- Shared reducer rejects incorrect actors, missing publication eligibility, invalid venue data, repeat dispatch/confirmation and generic name overwrite.
- Frozen invitation terms and approved dossier scope cannot be silently changed while identity is pending.
- Confirmation preserves the original committee spelling, locks the legal name and timestamps, creates the agreement, and generates a non-binding PDF summary. Existing contract amendment flow retains the name.
- Browser walkthrough verified publication lock, explicit isolated rehearsal, corrected-name propagation to Coordinator dossier, remount persistence, PDF link and Arabic layout.
- Download event automation timed out, but the actual downloaded PDF was found in Downloads and rendered: one readable page with corrected name, agreed terms and rehearsal notice.
- Browser console: no warnings/errors in the tested flow. TypeScript, 78 guard tests and production build passed; existing bundle-size warning remains.

## Critique addressed
Queue and navigation labels now distinguish invitation/identity pending from agreement/signature pending. Mixed-script name and timestamp use bidirectional isolation. Existing press-profile display name is explicitly distinguished from the session legal name. PDF generation is lazy-loaded, exposes retry on failure and revokes object URLs on unmount.

## Limits
This audit covers the invitation/identity addition, not all eight stages. The happy path used the explicit isolated rehearsal toggle after checking normal publication lock. Records are session-only. There is no authenticated bearer link, external email, server identity verification or permanent database name update. The PDF is a rasterized prototype terms summary, not a signed legal agreement or accessible archival PDF.
