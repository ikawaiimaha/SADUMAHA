# SADU fictional journey — reviewed local release candidate

29 September 2026. Status: reviewed for a fictional demonstration, not a production release. Nothing was pushed or deployed. Real SADU, Alpha, databases, email and external integrations remain paused.

## What changed

- One Noura Al Mazrouei / Kufic Horizon journey now connects eight stages and fourteen tasks: brief, selection, invitation, terms, artist acceptance, materials, Editorial, PR, Technical, advance, receipt, delivery tranche, return and final tranche.
- A shared artist task list shows each task's responsible desk, status, dependencies and sequence. All tasks, Outstanding and My desk filters use the same state. This candidate demonstrates one artist; it is not a multi-artist operational rollout.
- Verbal instructions, emails, meetings and documents are equal source types. A record stores the attributed speaker/sender, time, exact scope, recording desk and an optional source reference. A document is not required.
- Confirmation or disagreement is a separate event. Corrected statements retain superseded history. Task completion separately requires the responsible desk, confirmation, task evidence and prerequisites. Completed evidence labels are preserved in the downloadable JSON.
- PR and Technical independently supply evidence. Finance separately records the three sample tranches. Metadata collection does not wait for payment. Duplicate completion cannot create duplicate ledger entries.
- Draft invitation PDF and a review JSON are available from the shared record. The PDF remains explicitly a draft, even after Coordinator preparation.
- The focused English journey is the default local route. The earlier workbench remains at `/workbench`, and existing deep links are retained. A separate release entry and Vite configuration omit the workbench, pilot, public assets, environment-file loading and business integrations from the packaged candidate.

## Evidence and authority

The owner's available evidence consists of emails, attachments, firsthand work and verbal explanations. This implementation does not assume undisclosed contracts or require nonexistent documentary authority to record a conversation. The earlier source authority, requirements reconciliation and ownership registers remain the context for interpreting claims; AI summaries are not corroborating evidence.

The roles, sequence, AED 45,000 fee and 30/40/30 milestones in this candidate are explicit fictional design choices. They do not establish institutional delegation, engineering acceptance, spending authority, legal policy or publication permission. 84 kg is a declared sample weight, not proof of floor safety. The third tranche follows closure, safe return and condition reconciliation in this sample; it is not a universal post-opening rule.

## Review and verification

- `npm run build:rehearsal`: TypeScript, all 145 guard tests and isolated Vite build passed. Five new tests cover decision provenance, disputes, independent payment gates, task ownership, evidence checks, revisions and duplicate prevention.
- Browser review exercised all fourteen tasks in the compiled candidate, resulting in an empty Outstanding list and exactly three ledger entries totaling AED 45,000.
- Negative browser checks: wrong desk could not confirm; a dispute prevented completion; a corrected email statement retained the original verbal record; PR clearance alone left Finance blocked. Draft text survived desk switching.
- Compiled candidate PDF and JSON downloads succeeded. JSON contains fourteen completions and their evidence snapshots. No browser console errors were observed during the compiled journey.
- Desktop and 390 px responsive review performed. Mobile task navigation is height-limited; no horizontal page overflow observed. This is a visual/semantic review, not a full assistive-technology certification.
- A missing Tailwind source scan in the isolated build was caught in compiled-preview review and fixed before packaging. Current screenshots show the corrected build.
- The release archive is assembled only from the final Vite manifest and index.html, excluding stale build chunks. SHA-256 and source provenance are saved alongside it.

## Run and demonstrate

From the existing workspace, run `npm run build:rehearsal`, then `npm run preview:rehearsal`. Preview is local at http://127.0.0.1:3012/. The distributable static folder can be served by a local HTTP server; do not open index.html directly with file://.

Start with Committee, use a fictional example or enter fictional source details, record the statement, enter a confirmation note, confirm, check the task evidence, and complete. Open next available task to continue. The same pattern applies at each desk. Use Outstanding to show what remains. Download the review record before refresh.

## Limits and release boundary

State is memory-only and resets on reload. JSON is a review export, not a restore/import mechanism or tamper-proof audit log. Desk switching is a simulation, not authentication. Package checks are clearly labelled placeholders, not inspected uploads. No real mail, payment, signature, carrier action, encrypted vault, automatic reminders, wall-fit computation or government/CMS integration is supplied by this focused candidate.

No production deployment or source commit is included in this release preparation. The repository already contained unrelated pending pilot/freight changes; those were preserved and are not certified by this review. The isolated static archive is the reviewed deliverable. Prior bilingual work remains in the broader workbench; this focused presentation is English.

## Changed source files for this slice

- `src/components/RehearsalJourney.tsx`: focused UI, shared task list, decisions, documents and ledger.
- `src/data/rehearsalJourney.ts`: scenario, task graph, guarded reducer and evidence snapshots.
- `tests/rehearsalJourney.test.ts`: five focused guard tests.
- `src/main.tsx`: default rehearsal and lazy workbench routing.
- `src/rehearsal-main.tsx`, `src/rehearsal.css`, `rehearsal/index.html`, `vite.rehearsal.config.ts`: isolated release entry/build.
- `package.json`: rehearsal build/preview commands and guard-test inclusion.
- `SADU_ARCHITECTURE.md` and this review: scope and release documentation.

The existing local `src/utils/invitationLetterPdf.ts` and its invitation types are reused for the draft PDF. Earlier local changes outside this list are not newly attributed to this slice.
