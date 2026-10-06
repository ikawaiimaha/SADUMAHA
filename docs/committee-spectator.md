# Committee spectator gallery

Local connected route: `/committee-gallery`.

Select `PREPARATORY_COMMITTEE_SPECTATOR` in `/connected-pilot` to enter. A spectator session cannot select a different role; use a separate browser session for an active meeting operator. These are local simulated accounts, not production identity provisioning.

The gallery reads the same persisted `themeWorkflow`, spatial ledger, nomination snapshots and artwork revisions as the active connected workspace. `SHORTLISTED` nominations on the current locked `COMMITTEE_REVIEW` board are exposed as `PENDING_COMMITTEE_REVIEW`. Confidential benchmark slots, sovereign acquisitions, stale nominations, withdrawn records and inactive allocations are omitted.

The API returns a field allowlist. All other dossier endpoints and all mutation endpoints deny the spectator role. Media requests recheck eligibility and verify stored bytes against their recorded hash. No document, financial, passport or signing-envelope data is included.

Theme definitions, nationality and medium are shown as missing when absent from the existing records; this view does not invent them. Image resolution depends on the submitted source image.

External deployment and production identity provisioning remain paused. Tablet visual validation with populated institutional records remains a separate acceptance check.
