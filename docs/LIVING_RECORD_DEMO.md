# SADU Living Record demonstration

This release connects one fictional exhibition case across the presentation, Chairman, Directorate, Logistics, Technical, Coordination, and Finance views. It does not connect the older sample workspaces to a backend. They remain available under **Other sample workspaces**.

## Presentation sequence

1. His Highness Sheikh Dr. Sultan bin Muhammad Al Qasimi — vision and preservation.
2. His Excellency Abdullah bin Mohammed Al Owais — accountability and decisions.
3. Mr. Mohammed Ibrahim Al Qaseer — programme delivery and handover.
4. One case, one living record.
5. Arrival is the first checkpoint.
6. Evidence makes the handover reviewable.
7. Review first; confirm deliberately.
8. Operational evidence, executive clarity.
9. Follow the record across roles.

The full English and Arabic copy is in `src/data/storyChapters.ts`. All chapters share one viewport frame. The first three use source-specific 4:5 portrait viewports, with decreasing visual scale and aligned captions. The original images are unchanged. The Ruler's portrait is unboxed. IBM Plex Sans Arabic and Inter are loaded explicitly; the presentation frame, direction, progress order, and navigation mirror in Arabic.

## Five-minute demonstration

1. Enter the platform from the presentation. Chairman starts at **3 / 4** sample programmes ready, **60%** required case evidence present, and **0** executive reviews.
2. Open **Review delivery exception**, then **Open responsible workspace**. In Logistics, enter `DEMO-MF-04` and check the exterior/seal acknowledgement. Record arrival. Evidence completeness becomes **80%**; readiness remains **3 / 4**.
3. Open Technical and attach the prepared sample condition report. Evidence completeness becomes **100%**, while readiness remains **3 / 4**. Selecting a condition exception blocks handover review.
4. Open Directorate and **Review Handover**. Inspect the dossier and report reference. Check the explicit demo acknowledgement, then **Confirm demo handover**. The row becomes read-only, with sample actor `DEMO-DIRECTORATE`, browser timestamp, report version, and declaration reference `DEMO-ACK-1`.
5. Return to Chairman. Readiness is **4 / 4**, calculated from the shared case. This is operational readiness, not opening authorization.
6. In Coordination, flag the artist statement as missing. Evidence completeness falls to **80%**. Directorate assigns follow-up, after which Coordination can restore the sample statement and return it to **100%**.
7. In Finance, submit the sample pack. It stays out of the executive queue until Directorate reviews and escalates it. Chairman then shows **1** executive review, with delegation validation still required. No sign or payment action exists.
8. Reset the fictional case through its confirmation dialog, or reload the browser to begin a new session.

## Data and authority boundaries

- The reducer is the single source of truth for this case. No separate KPI increments or independent per-role arrays are used.
- Three other sample programmes are explicitly seeded as ready. The fourth is ready only after the current report version is acknowledged.
- Evidence completeness counts five required case records: agreement, plan, artist statement, receipt, and condition report. It measures presence, not verification, legal compliance, or completed-programme archival certification.
- Receipt mismatch, missing receipt, condition exception, wrong demo role, absent acknowledgement, stale report version, and duplicate acceptance cannot advance the handover.
- Earlier condition outcomes and versions remain available in the session report history. Accepted reports cannot be replaced through the demonstration controls.
- State exists only in memory. The history is not durable, authenticated, signed, or protected from client modification. Role selection is for demonstration and is not authorization.
- All actions are attributed to sample role IDs, never to the officials pictured. No credentials, UAE Pass integration, PIN, digital seal, or signature verification are simulated.
- The report link is a bilingual demonstration template. It contains no real inspection photos, signatures, private contact information, bank details, or original operational attachments.

## Source reconciliation — 18 September 2026

The local SADU Source Authority Register and Contract Responsibilities review were consulted before implementation. Two relevant original Drive files were refreshed:

- The 2026 bilingual shipping and insurance request form (file modified 1 July 2026) supports separate artwork/package identity, packing, condition evidence, handling, and installation information. It does not delegate custody acceptance.
- The operational tracker (status 11 August 2026, source records through 21 July; file modified 11 August) reports package-level dependencies and condition-report gaps. It is a derivative, dated review, not evidence of today's delivery state or an authenticated delegation.

The crate, actions, results, IDs, seeded programme readiness, and example finance pack in this release are fictional design choices. The source documents do not establish Directorate custody powers, Chairman signatory thresholds, or mandatory use of a particular UI pattern. Those remain institutional validation matters.

Public title and narrative references:

- [Sharjah Department of Culture — About SDC](https://sdc.gov.ae/en/about-sdc), checked 18 September 2026: cultural continuity and the Ruler's institutional designation. The website flags its English translation as machine translated.
- [SDC — fourth evening of the Sharjah Arabic Poetry Festival, 9 January 2026](https://sdc.gov.ae/en/media-center/news/9/1/2026/in-the-fourth-evening-of-the-sharjah-arabic-poetry-festival-texts-reaching-toward-distant): Chairman and Cultural Affairs Director titles. Public titles do not establish project-specific delegations.
- [IBM Plex primary repository](https://github.com/IBM/plex): Arabic family and UI use. Visual weight parity is a design calibration requiring human bilingual review, not a certification.

## Verification

Run `npm run test:demo` for the state-transition tests and `npm run build` for TypeScript and the Vite build.

Browser checks cover English/Arabic, all nine chapter positions, portrait scale, captions, mobile reading surfaces, receipt mismatch, condition exception, revised reports, explicit acknowledgement, cancellation, Finance routing, statement follow-up, and reset. The existing Vite large-chunk warning remains; this release does not change the application's bundling strategy.
