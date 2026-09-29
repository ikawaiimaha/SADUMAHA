# Condition reports, repair instructions and PR validation

## Changes

- Session damage reports now appear immediately in the owning Artist Portal, with photo previews, a review acknowledgement and two recorded repair-responsibility choices. Pending review pauses the portal and blocks other Artist reducer actions. Decisions are immutable and timestamped.
- Damage sets DAMAGED_PENDING_ARTIST_APPROVAL. Choosing Department repair produces REPAIR_AUTHORIZED; choosing personal repair produces ARTIST_REPAIR_PLANNED. Neither state asserts completed repairs, clears damage holds, releases funds or certifies legal consent. Executive impounds are preserved.
- DigitalConditionReports adds a separate authenticated database flow to Logistics, Artist and Technical workspaces and `/pilot`. Logistics selects an accepted database agreement, records damage details, uploads private photo evidence and routes the report. The authenticated Artist reviews and decides; Technical can read the instructions. Realtime/polling refreshes the queue.
- RLS limits report/photo access to the owning Artist and trusted Logistics/Technical roles. Drafts remain hidden from the Artist. Publication requires actual nonempty JPEG/PNG Storage objects. Only the original registrar publishes a draft; only the mapped Artist records the decision. Files cannot be replaced/deleted through client roles; report text and photo paths cannot be updated. Server timestamps/actor IDs cannot be client-written.
- Logistics contract discovery uses a narrowly scoped function returning only accepted agreement ID, artist ID and name, without broadening access to financial contract terms.
- Passport selection now requires PDF MIME, extension, nonzero bounded size and `%PDF-` signature. Personal photos require matching JPEG/PNG extension/MIME/signature, successful browser decoding and at least 1200 × 1200 pixels, up to 10 MB. This is an explicit prototype threshold, not an official immigration rule.
- Invalid replacements clear the selected document. Async selection guards prevent stale validation restoring an older file. PR travel dispatch requires a valid submitted visa intake including a personal photo; PR visual checks remain mandatory.

## Verification

- Build, TypeScript and 108 guard tests passed, including repair authority/idempotency/continuing damage hold and invalid PR formats/resolution.
- `supabase/tests/digital-condition-reports.sql` passed locally: missing evidence, wrong actor, immutable report/decision, forged role and cross-artist photo access.
- `supabase/tests/condition-api-local.mjs` passed against local HTTP endpoints: real private PNG upload, Artist download, recorded decision, replay denial and unrelated Editorial denial.
- Reviewed semantic labels, photo URL expiry and logical spacing. No full authenticated browser journey was performed this turn. Existing bundle-size warning remains.

## Boundaries

Local SQL only: `supabase/local/digital-condition-reports.sql`. Hosted database remains unchanged. The session QR demo still stores sample File objects in memory; authenticated database reports are explicitly selected and submitted separately, never inferred from fictional session IDs.

These are prototype repair instructions, not legally binding electronic signatures. A production signature and post-repair inspection process remains necessary before CLEARED_FOR_EXHIBITION. There is no new automatic repair completion transition.

Format/resolution checks cannot identify blur, camera origin or immigration acceptability. Personal-photo decoding runs in the browser; it is not a server-side forensic guarantee. PR must inspect submissions. Persistent passport/personal-photo dossiers and server-side image decoding are not introduced by this change. A failed authenticated evidence upload leaves a draft that cannot notify the Artist until complete; retry currently starts a new report.
