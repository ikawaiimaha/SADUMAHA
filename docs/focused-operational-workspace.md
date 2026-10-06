# Focused collection and print workspace

## Scope

`/connected-pilot` opens operational roles on their task workspace. Collection and print keep their existing local service, shared record versions, permission checks, evidence files and approval transitions. External dispatch, payments and shipping remain paused. Other institutional workspaces remain available separately; this change does not claim an application-wide localization or production rollout.

## Interface

- `OperationalWorkspace` places one selected task beside its evidence on desktop. Narrow screens offer Action / View evidence controls for the same task and scroll to it on explicit task selection. Both panes stay mounted so switching to inspect evidence retains form input.
- `operationalWorkspace.ts` projects the existing service response into Action, Waiting and Done tasks. It never authorizes a transition. Conflicting collection sources route to correction, rather than a confirmation that cannot succeed.
- `OperationalForms` renders only the selected action. Assignment, evidence upload and return are separate modes. Unsaved input prevents mode, role or workspace changes.
- Arabic is the initial interface language. English switches the shell, tasks, forms, evidence controls and amendment dialog. Original file names and source content remain unchanged. Real named account labels remain distinguishable.
- PDF canvas direction is explicitly LTR so the Arabic shell does not distort document glyph placement; the PDF retains its own page layout. Verified on the synthetic proof in the Arabic workspace.
- Evidence opens inline, with optional larger preview. Current proof, earlier files, provenance and specifications remain distinguishable. PDF/image bytes are still checked against their stored hash.
- The compact collection strip retains packing and departure blockers. Readiness never implies booking, physical handover or payment authority.
- Explicit Tailwind source discovery includes the connected components, restoring utilities such as `min-h-12` and `text-lg` in the rehearsal build.

## Recovery and review

A selected task stays selected when another becomes actionable. If an update arrives during editing, saved input remains available in the recovery comparison and saving is blocked. The original form stays mounted but hidden while the recovery card is visible. Inputs are not silently rebased to a newer record. Refresh establishes connection state; discard/reopen establishes a new editing baseline.

Date inputs mark drafts on input as well as change. Canceling amendment review retains the entered value and leaves the stored record unchanged. HTTP validation errors are distinct from uncertain network outcomes. Successful writes followed by failed refresh are reported as saved, with further mutations paused pending refresh.

A restarted local service can expire the role simulation session. The shell retains the cached view and input, locks writes, and offers session restoration. This is a local simulation recovery mechanism, not production identity recovery. Working text now autosaves to a separate private local draft store. See `docs/operational-draft-recovery.md` for recovery boundaries and verification.

## Verification — 6 October 2026

- Full rehearsal build: TypeScript, 265 guard tests, 24 workflow tests, 50 review tests, Vite build passed.
- Final focused regression run: 10 task-projection/form tests passed, including the additional conflicting-source correction test.
- Browser: Arabic/English change retained input; simultaneous synthetic update disabled saving without removing the draft; reassigned task required acceptance; evidence-bound preflight saved and persisted.
- Browser: pickup amendment review canceled without changing the stored date; native date edits displayed the unsaved-draft guard.
- Browser: local service restart disabled writes, preserved the draft and restored the same role session successfully.
- Browser layout checks: mobile 390px and desktop widths; evidence remains beside decisions above the mobile breakpoint. No horizontal document overflow in the tested mobile view.
- Existing bundle-size warning remains. These checks do not establish production security, institutional sign-off or document quality certification.

The isolated `.local/operations-check` fixture uses a fictional artwork and explicitly synthetic proof/inspection sheet. No real artwork data or external integration was introduced by this UI verification.
