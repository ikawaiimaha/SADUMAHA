# Inter-agency resource and institutional metrics audit

## Implemented
- Shared Technical → assigned Coordinator → Finance request ledger, SAF/SMA selection, required date, immutable request reference and bilingual downloadable rehearsal PDF.
- 48-hour elapsed-time gate, immediate denial contingency, referenced agency response/delivery date, independent Finance approval. No banking or mail side effects.
- Scope-bound tickets cannot act after contract revision, amendment, damage hold, impound or archive. Late confirmation pauses unfunded rental requests. Repeated requests/decisions do not overwrite history.
- Derived distinct-person KPIs and per-Coordinator dossier/artwork workloads. Unknown counts remain explicit. Director reassignment requires reason and retains prior assignment; dispatched agreements are protected.

## Verification
- Build and 117 guard tests passed; existing bundle-size warning remains.
- Desktop/mobile browser tests cover the locked-to-48-hour-to-Finance path and PDF download; workload reassignment and veto updates also tested.
- Downloaded PDF rendered with bundled Poppler and visually inspected: one page, legible, no clipping, clear rehearsal/no-dispatch notice. Mobile Finance ledger inspected visually.
- Visual audit reduced empty-state clutter: inactive Coordinator cards are hidden by default behind a labelled toggle. Logical spacing, labelled inputs, native details and disabled states retained.

## Operational limits
- Session-only rehearsal state; refreshing discards tickets. No external SAF/SMA portal, email transport, durable deadline worker, guaranteed supply, accounting entry or payment is implemented.
- An agency response reference is manually recorded evidence, not authenticated agency attestation. PDFs are prototype requests, not official letterhead or authorizations.
- Executed totals can correctly be zero while agreements are only accepted; PR guest totals count primary verified people, not inferred companions or hotel nights.
- Already-dispatched dossier reassignment requires a separate coordinated transfer to avoid breaking contract/venue access. This dashboard does not override those locks.
