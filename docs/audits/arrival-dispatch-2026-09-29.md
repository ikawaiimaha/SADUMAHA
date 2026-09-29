# Arrival dispatch audit

Implemented a Stage 7 rehearsal handoff: Director records the recipient designation on approval, PR reviews structured arrival details, and the assigned Coordinator records a generated package without editing raw prose or the attachment list.

## Guards and corrections

- Approved dossiers only; explicit GUEST_ARTIST/JURY_MEMBER designation required.
- DXB → Marhaba; SHJ → Hala; unknown airport blocks dispatch without fallback.
- Guest manifests never contain the judging-document descriptor. Jury manifests do, but explicitly report that the approved PDF has not been supplied.
- Wrong role, wrong assigned Coordinator, unpublished theme/guidelines, missing reviews and invalid timestamps reject the transition.
- Identity review binds to the recipient name, so a corrected legal name invalidates the old review. Itinerary edits reset PR itinerary review.
- Duplicate dispatches retain the original receipt. Changed itineraries create new snapshots after review, keeping history visible and marking old snapshots historical.
- Session records survive desk changes; refresh clears them. Template values render as React text, not raw HTML.

## Verification

- Production build and 112 guard tests.
- Desktop/mobile browser tests exercise PR → Coordinator, both airports, guest/jury manifests, immutable template controls, remount persistence, duplicate disabling and unknown-airport blocking.

## Production boundary

No actual mail, service booking, confidential PDF storage, signed download links or server authorization was added. The current role selector is a rehearsal tool. Production release needs an approved PDF, authorized identity/appointment source and server-side dispatch with private document lookup and delivery receipts. A role-based frontend manifest alone cannot secure a confidential attachment.

Existing large-bundle warning remains. No remote Supabase changes were made.
