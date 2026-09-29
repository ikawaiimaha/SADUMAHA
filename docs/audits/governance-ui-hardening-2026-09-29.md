# Governance and UI hardening — 29 September 2026

## Authority and scope

Reviewed `SADU_ARCHITECTURE.md` before editing. The file uses numbered stages and dated amendments, rather than literal Sections I–VIII. Explicit superseding amendments govern Committee nomination decisions, HIP Stage 3 boundaries, and independent financial milestones.

This is a focused frontend review of the shared session router, theme workspaces, CSS, and dialogs. It is not a certification of production authorization, all historical screens, or deployed Supabase policies.

## Corrections

- Committee submission now snapshots exactly three complete proposals with distinct Arabic titles. English remains optional at this stage. Switching roles cannot reopen submitted proposals; the Director must return them for revision.
- Director forwarding preserves Committee content and adds only Director advice. Chairman ratification retains that snapshot and adds Chairman directives. Editorial publication cannot replace the executive record.
- Editorial publication derives from the official enum and accepted global callback, rather than local success state. Arabic and English editing gates fail closed. Unsupported theme aliases were removed; HIP and Chairman props use `ThemeStatus`.
- HIP restriction editing is disabled until official theme publication, with matching callback guards. Arabic-lock status now correctly explains whether HIP is awaiting refinement or translation. The artist metadata queue was removed from the Stage 3 HIP desk.
- Existing independent lifecycle types remain distinct: a guideline's `PUBLISHED` status is not an unsupported theme status. Existing specialist-evidence and Finance approval gates remain separate.
- Remaining physical CSS margins/padding in Storybook styles use logical properties. The source scan found no one-sided physical Tailwind spacing/alignment utilities.
- Inbox, command search, workflow details, legacy veto, and printable report overlays use the shared native dialog. Modal focus initialization, Tab wrapping, Escape dismissal and focus restoration are preserved. Search no longer hijacks Tab to cycle categories. The mobile drawer restores focus to its opener.
- Locked Director notes and Committee reset controls visibly explain their disabled state. Existing cream/stone surfaces and demo autofill actions are retained.

## Validation

- `npm run build`: TypeScript, 109 guard tests, and production bundling.
- `npx playwright test tests/e2e/governance-hardening.spec.ts`: desktop and mobile coverage for Committee → Director → Chairman → Editorial → HIP, role-remount locks, invalid budget, bilingual text publication and executive mandate preservation.
- Browser keyboard tests cover Inbox, search, report and workflow-details dialogs in Arabic and English. Retained sample components are mounted in a test-only harness; no obsolete route was reintroduced.
- `git diff --check` and physical CSS/utility scan.

## Remaining limits

- Old `accessibility-patch.spec.ts` tests target the retired “Other sample workspaces” navigation and fail at entry. They are not evidence of a current product regression; the new tests target current navigation and isolated retained components.
- The production build still warns about the existing main bundle exceeding 500 kB.
- Rehearsal role selection and in-memory callback guards are not server authorization. No remote database policies or users were modified in this change.
- This does not claim full WCAG conformance, authenticated multi-user concurrency validation, or immutable legal audit storage.
