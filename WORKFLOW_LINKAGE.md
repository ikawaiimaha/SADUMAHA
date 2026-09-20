# SADU workflow linkage — 20 September 2026

Local changes against `02ee603b7ac48719b5d38f8cc492ebacc03e9a8e`. No deployment or backend changes.

## Demonstration path

1. Open `/join`, fill fictional profile details, review and register.
2. Open the demo roster. Switch to the sample coordinator and record a simulated profile review.
3. Include that profile in a new bilingual programme draft. Its sample brief becomes available in Artist intake.
4. Open programme proposals. Enter a proposal, review and submit its version.
5. In Coordination, inspect the dossier and record completeness or return it with feedback.
6. In **Selection simulation**, review the checked version and explicitly confirm simulated selection. This creates exactly one delivery record linked to the programme, artist, proposal and version.
7. In Logistics, enter the displayed asset ID and confirm the sample identity/seal check.
8. In Technical, record sample condition evidence. Exceptions prevent handover; revisions retain earlier evidence versions.
9. In Exhibition manager, open the linked handover dossier, acknowledge the exact evidence version and record the handover.
10. Chairman and Directorate show the same scoped delivery totals. Artist intake displays the activated delivery reference and handover status.

Use in-app links and role buttons during the demonstration. A full page reload starts a new session.

## Audit findings addressed

| Finding | Correction | Main files |
|---|---|---|
| W01 | Sample loading replaces only the active proposal. Programme changes remount uncontrolled fields so the screen cannot carry the preceding draft's values. Shared profile and other drafts are preserved. | `ArtistIntake.tsx`, `artistIntake.ts` |
| W02 | Editorial certification/print-lock claims replaced with sample check language, including the role introduction. Programme/record/version checks live in shared session context and survive navigation. | `EditorialDashboard.tsx`, `WorkspaceContext.tsx`, `editorialSamples.ts`, `RoleOnboarding.tsx`, `mockData.ts` |
| W03 | New roster profiles can receive an explicitly simulated coordinator review. Re-registering an edited profile returns it to pending. | `artistRoster.ts`, `ProgrammeRoster.tsx`, `ArtistIntakeContext.tsx` |
| W04 | Created programme briefs enter the intake selector and have independent proposal drafts. Submission requires the current profile to match a reviewed participant. Dynamic brief/text metadata is included in the optional recovery allowlist. | `artistIntake.ts`, `ArtistIntakeContext.tsx`, `ProgrammeRoster.tsx` |
| W05 | Separate selection activation creates a version-linked delivery record atomically. Existing role/sequence/evidence-version guards apply per asset. Leadership totals derive from those records. | `intakeWorkflow.ts`, `ProposalDelivery.tsx`, `livingRecord.ts`, `LivingRecordWorkspace.tsx` |
| W06 | Editorial sample records appear only in their assigned programme. Other programme selections show an explicit empty state. | `EditorialDashboard.tsx`, `editorialSamples.ts` |
| W07 | Word counts come from displayed text; gate percentages come from the displayed fraction: 18/22 = 82%, 9/20 = 45%. | `metrics.ts`, `EditorialDashboard.tsx`, `InstitutionalBreadcrumb.tsx` |
| W08 | Registration receipt derives from the roster entry, with an explicit edit mode. Returning to `/join` retains the receipt and current review state. | `RosterRegistration.tsx` |

All source filenames above are under `src/components`, `src/context`, `src/data` or `src/utils` as appropriate.

## Evidence and authority limits

Revisited the workspace requirements/authority reconciliation and refreshed the original [SCB2026_Deliverables_library.csv](https://drive.google.com/file/d/1LGqkDSrZPujLabOJsRsehhT8YUk0vvwj/view) on 20 September 2026. Drive reports modification at 2026-01-27 06:51:21 UTC; no edition/version was provided. This is a candidate deliverables library with 38 rows, not a delegation instrument. Engagement, dates and evidence fields are blank; default owner/status values do not establish institutional responsibility.

The coordinator completeness check is therefore kept separate from selection. The new selection role, manager acknowledgement and sample programme parameters are design simulations. None assigns powers to named officials or proves selection, signing, spending, rights clearance or legal custody authority.

## Verification

- 42 unit tests and 7 guard tests passed.
- 6 Playwright browser tests passed on installed Chrome: desktop 1440×1000 and mobile emulation 390×844.
- Coverage: complete linked journey, coordinator/manager boundaries, two-step acknowledgement, duplicate activation, evidence versions, independent programmes, retained receipts, draft isolation, editorial navigation/scope, English and Arabic counts, and Arabic executive summary.
- TypeScript and production build passed. Vite still reports the existing large-chunk warning; this patch does not address bundle splitting.
- Browser screenshots and traces are local ignored test outputs. View `playwright-report/index.html` after a run.

Reproduce:

```powershell
npm ci
npm run lint
npm run test:demo
npm run test:guards
npx playwright install chromium
npm run test:e2e
npx vite build --outDir .build/workflow-verification
```

If Chromium download is unavailable and Chrome is installed:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm run test:e2e
```

The test runner starts its own local Vite server on port 4177. Tests navigate through the UI to preserve session state.

## Remaining boundaries

- This is a session-only fictional mockup. Refresh clears registrations, submissions, decisions, files and delivery actions. Optional device backup retains allowed draft text/briefs, not verification or decisions; there is no server sync.
- The interactive artist remains `DEMO-ART-001`. The three seeded roster profiles support planning reuse; they are not additional signed-in artists. Programmes containing only those profiles cannot accept a proposal from the interactive artist.
- New roster programmes use clearly labelled sample brief, space and budget defaults. Editing production briefs and inviting real artists remain future work.
- Linked totals describe delivery acknowledgements, not full exhibition readiness. The original prepared delivery/publishing cases and unreported portfolio milestones remain separately labelled. Resetting those prepared cases does not reset linked proposals.
- Legacy Editorial and the connected publishing demonstration remain separate sample workflows. Editorial checks do not route to a printer or an executive signatory queue.
- The legacy global programme selector remains desktop-only; the new intake and linked-delivery selectors work on mobile. Mobile editorial retention was tested; legacy scope switching was tested on desktop.
- No authentication, durable audit ledger, actual identity verification, digital signing, rights clearance, cloud upload, transmission, institutional approval or production-readiness claim is introduced.
