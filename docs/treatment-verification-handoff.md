# Conditional treatment: verification handoff — 10 October 2026

## Completed task

Verify the synthetic Laura / Mounir treatment journey through the browser, server and stored evidence. This verification is complete for the tested local revision; it is not a production security certification or a live institutional approval.

Codex executed the checks and fixed the entry routing: Artist and Museum Operations accounts with a treatment record now open My tasks. The treatment workspace also shows its work title and uses a general evidence-photograph label.

## Recorded results and attribution

- Codex: `npm run lint` passed; `npm run test:guards` passed all 282 tests. The Committee's 7 tests are included in that guard suite.
- Codex: `npm run test:treatment:browser` built the rehearsal and passed both desktop and 390px mobile journeys.
- User's PowerShell transcript independently confirms two subsequent successful runs: `2 passed (41.3s)` and `2 passed (44.4s)`.
- Native Claude Code permission diagnostic, launched by Codex after adding the exact rule: build succeeded and `2 passed (42.8s)`, with `permission_denials: []`. It used `--permission-mode dontAsk`, `--setting-sources user,project`, no command-line allow override and no permission bypass. This verifies the saved rule in native Claude Code; it does not establish that an existing Cline session has reloaded it.
- Cline's earlier inability to execute commands is a separate permission issue. Do not claim Cline ran the checks, or call the browser journey unverified solely because a fresh Cline session has no execution output.

The browser tests exercised recorded external permission, named assignment and acceptance, rejection of a PDF as a trial photograph, upload and preview of the actual image bytes, artist confirmation of the exact image/revision, independent venue/engineering/Finance holds, method-only amendment and renewed permission/sample approval, completion evidence and letter count, restart with expired sessions and a fresh sign-in, and Arabic RTL/mobile overflow checks. External browser requests were blocked and asserted absent.

## Latest usability verification — 10 October 2026

After Cline added concise blockers and collapsed treatment details, Codex ran the new checks. The first browser run exposed an actual UI defect: the Coordinator could see the owner/deadline form before current-revision authorization, although the server would reject that assignment. Codex gated both that form and its button to match the existing server rule. The blocker helper also now resolves the prerequisite's owner independently: an artist awaiting a photograph is directed to the assigned technician, not told to upload it themselves. Named in-app decision-makers and outdated authorizations are distinguished in the messages. Server authority and evidence gates were not changed.

The browser spec now explicitly chooses the venue condition, opens evidence through the mobile tab, targets the outer record's summary, and checks the artist's waiting state. Three regression tests cover named technician attribution, authorization revision/decision-maker routing and requested replacement photographs.

Latest results, executed by **Codex** after these corrections:
- `npm run lint`: passed.
- `npm run test:guards`: **285 passed, 0 failed** (includes the 7 Committee tests).
- `npm run test:treatment:browser`: fresh build succeeded; **2 passed (49.4s)**, covering the complete desktop and 390px mobile journeys.
- `git diff --check`: passed; Git reports existing line-ending normalization warnings.

Assertions now include one visible task blocker in the tested waiting states, correct missing requirement and owner, no premature assignment/upload/completion form, collapsed details that open on request, Arabic blocker text and horizontal overflow, adjacent evidence/action panes on desktop, mobile evidence navigation, and the existing amendment/restart/evidence gates. The desktop and mobile `batch-blocker-arabic.png` screenshots were also inspected. This is coverage of the exercised treatment states, not an audit of every recovery state or SADU screen. The build still reports its existing chunk-size and mixed-import warnings.

Cline execution remains separately unverified; these are not Cline's test results. No commit, push, deployment or real integration was performed.

## Mobile header follow-up — 10 October 2026

Cline's mobile header changes were inspected and executed by Codex. TypeScript passed and all 285 guard tests passed. Installed Playwright is 1.63.0, so `toBeInViewport({ ratio: 1 })` is supported. The initial browser run passed desktop but failed mobile: the Coordinator's blocker was partially below the 390×844 viewport (visible ratio approximately 0.973). This was a real layout failure, not a permissions or Playwright compatibility error.

Codex reduced mobile section gaps and owner-row padding in `src/components/OperationalWorkspace.css`, preserving text sizes and touch targets. The spec in `tests/e2e/treatment-flow.spec.ts` now checks the first screen in both English and Arabic, verifies no horizontal overflow, and exercises the collapsed role control using the keyboard. The existing expandable simulation control in `ConnectedPilot.tsx` was retained without further source changes.

The fresh build and full desktop/mobile journeys then passed: **2 passed (48.8s)**. Both `first-screen-en.png` and `first-screen-ar.png` were visually inspected under `.local/treatment-browser-results/treatment-flow-conditional-1ae74-doffs-amendment-and-restart-mobile/`. The current role/demo label, task heading, complete blocker and evidence-access button fit without vertical scrolling at 390×844 in the exercised Coordinator state. This does not establish first-screen fit for every task, screen size or browser zoom level. Existing build warnings remain. No server, permission, evidence-gate or approval code was changed; no commit, push or deployment occurred. Cline execution remains separately unverified.

## Commit-scope verification — 10 October 2026

For the requested commit, Codex exported only the staged treatment/workspace files plus the existing committed repository into an isolated local directory. Unrelated curatorial, freight, database and local-tooling edits were excluded. TypeScript passed, all **282 guard tests** passed, all **24 workflow tests** passed, and the fresh rehearsal build plus desktop/mobile treatment journeys passed (**2 passed, 48.2s**). The earlier 285-test results above describe the larger working tree; three additional curatorial tests remain outside this commit. Local preview data and passwords were excluded. This verifies that the selected changes work without the unrelated edits.

The standard application build (`npx vite build`) also passed in that isolated copy. Its existing large-chunk and mixed-import warnings remain; they did not fail either build.

## Committee translation verification — 10 October 2026

Codex inspected the full `src/i18n/mockupArabic.ts` diff. The seven removed copy entries correspond to replaced text elsewhere; the eighth removed line was a trailing-comma change. The Group A recommendation translations and the artwork-allocation error translation were retained.

Browser verification found two small UI issues, now corrected: `ExecutiveDashboard` did not supply a language provider, leaving the Committee controls on the Arabic fallback inside an English shell; and the recommendation textarea's implicit label included its retained draft text after switching roles. The dashboard now provides the existing language context and a language switch, and the minute field has an explicit stable label. No workflow authority or server gates changed.

`npm run test:committee:browser` builds the actual dashboard into an isolated local fixture and starts its own loopback server. All **4 cases passed**: English and Arabic, at desktop 1440px and phone 390px. They exercise a legacy board missing its minute, blocked premature Director endorsement, minimum-length validation, role switching with a draft, recording the current minute, separate Director endorsement, journal recovery after reload, direction/language switching, and no horizontal overflow. Browser errors and external requests were absent. The Arabic phone screenshot was also inspected. Existing headings outside Group A remain English; this is not a claim of complete dashboard localization.

Evidence is retained in `.local/committee-browser-1791645241711/`. This test covers the per-tab browser sandbox; `tests/committeeRecommendation.test.mjs` separately covers the authoritative HTTP path and restart persistence. The current guard suite passed **290 tests, 0 failed**, and `npm run lint` and `git diff --check` passed, executed by Codex after the fixes. These are not Cline execution results. The existing treatment preview and its stored data were not changed. No permission settings, commit, push, deployment or live integrations were changed.

## Repeat only when needed

From `C:\Users\squir\Documents\ChatGPT\SADUMAHA-main`:

```text
npm run test:treatment:browser
```

The command builds fresh files and starts its own temporary loopback server with a fresh synthetic store for each test. It does not require an existing server on port 3025. It does not change `.local/connected-pilot`, send messages, book freight, pay anyone, or deploy.

Implementation: `tests/e2e/treatment-flow.spec.ts`, `playwright.treatment.config.ts`, and the script in `package.json`. Local output: `.local/treatment-browser-results/`; retained synthetic stores: `.local/treatment-browser-run-*`. A passing result applies to the files tested, not to future edits. Rerun when relevant code changes or a new failure warrants it; do not restart completed verification just because a new conversation lacks history.

## Permission boundary and next work

### Cline workspace trust repaired — 10 October 2026

Codex reproduced the exact denial using the working directory in the current Cline session metadata: `c:\Users\squir\Documents\ChatGPT\SADUMAHA-main`. Claude's configuration trusted only the uppercase-drive key `C:/Users/squir/Documents/ChatGPT/SADUMAHA-main`. With Cline's path, the CLI debug log said `Dropped 4 project-scoped permissions.allow entries — workspace not yet trusted`; the exact Committee test was denied. The same launch using the uppercase path passed all 9 tests.

After verifying both paths resolve to the same directory, Codex backed up the user configuration under `C:/Users/squir/.claude/backups/config-before-sadu-trust-1791645810831.json` and added trust for the lowercase-drive key. No global command grant or bypass mode was added. A new diagnostic with Cline's exact path, `--permission-mode acceptEdits` and `--setting-sources user,project`, without command-line permission grants, then passed all **9 Committee tests** with `permission_denials: []`. The untrusted-workspace warning disappeared. Evidence: `.local/cline-permissions-1791645760124/` (before), `.local/cline-permissions-1791645772370/` (uppercase control), `.local/cline-permissions-1791645811255/` (after). This verifies the CLI path and launch configuration used by the provider; it is not a claim that Codex clicked through Cline's UI.

Both project settings files retain the existing lint, guard, treatment-browser and Committee-unit commands. Exact grants were added for `npm run test:committee:browser`, `git diff --check`, and `git diff -U0 -- src/i18n/mockupArabic.ts`. Native file-edit tools handle source changes; unrestricted shell execution is not granted. Cline's provider still has no interactive approval bridge for commands outside the allowlist, as documented in [upstream issue 14699](https://github.com/cline/cline/issues/14699). Do not repeatedly request already-recorded passing checks, silently switch shells, or widen permissions. If an already-running session caches the old trust state, reload the VS Code window and start a fresh Cline turn.

## Repository and database hardening — 14 October 2026

Executed by **Claude Code** on 14 October 2026 (local only; nothing committed, pushed or deployed):
- Pinned the `"latest"` devDependencies, moved build tools to devDependencies, renamed the package `sadu`, extended `.gitignore`, added `.github/workflows/ci.yml` (lint, all node suites, build, and SQL tests against a fresh local Supabase). Installed `supabase` 2.120.0 as a devDependency.
- Wired 8 previously unrun test files into `test:guards`; `tests/themeSelection.test.tsx` stays out (it cannot import CSS under node). `tests/mounirGallery1.acceptance.test.mjs` is untracked and must be committed with `package.json`.
- Rewrote 5 stale tests in `tests/prWorkspace.test.tsx` to reach their states through transitions the reducer currently allows; no reducer change.
- Added migrations `20261014090000` (role table + token hook, theme policies, storage policy tightening), `20261014100000` (baseline of hand-applied schema) and `20261014110000` (escrow view audience; fixes a PR/Editorial/HIP read of escrow data). Updated fixtures in 12 SQL tests for later guards; two tests move the closed 2026 pickup cutoff inside their rolled-back transaction.
- Results: `npm run lint` passed; `test:guards` 308/308, `test:workflows` 24/24, `test:review` 50/50, `test:demo` 61/61; `npm run test:sql` 28/28; `supabase db advisors --local --type security` reported no issues; a real sign-in confirmed the hook issues the provisioned role and strips a forged `app_metadata` role.
- HIP retirement (same day, separate commit): browser role `HIP` → `GENERAL_COORDINATOR`, database duties moved by migration `20261014120000`, dead `AppShell`/`WorkspaceRouter`/`HeadOfProgramsView` removed. Executed by Claude Code: lint passed; guards 308/308, workflows 24/24, review 50/50, demo 61/61; SQL 28/28; shadow replay matches. The general Playwright suite (`npm run test:e2e`) fails before any role step for all 18 affected tests because the app now opens on the prelaunch password gate; that suite was already broken and does not verify this change.
- Not done: deleting ~30 stale root files (permission classifier refused; command listed in that conversation), removing the unused `@google/genai`/`@microsoft/clarity` packages and `bun.lock`. CI has not run yet.

## Commit plan for the current working tree — 13 October 2026

Prepared by Claude Code; nothing was staged or committed. The tree holds four independent changes. Commit them separately, in this order, and stage by file or by hunk (`git add -p`). Several files contain hunks for more than one group. Untracked files that a group depends on are listed explicitly, so no commit imports a missing file.

1. **Authority and compliance wording.** `src/components/RoleSelection.tsx`, `ArtistPortalWorkspace.tsx`, `ContractDisputeModal.tsx`; the matching `src/i18n/mockupArabic.ts` hunks (role descriptions and badges, contract clause 2, illustrative-terms notice, session negotiation record).
2. **Committee recommendation browser check and dashboard language.** `src/components/ExecutiveDashboard.tsx`; the Committee hunks in `mockupArabic.ts`; in `package.json`, the `test:committee:browser` script and the `committeeRecommendation` addition to `test:guards`; untracked `tests/committeeWorkspace.browser.mjs`, `tests/fixtures/committee-preview.html` and `tests/fixtures/committee-preview.tsx`.
3. **Freight packing, return destination and change control.** `src/data/consignment.ts`, `GalleryConsignmentForm.tsx`, `FreightClosureLedger.tsx`, `LogisticsActionQueue.tsx`, `src/lib/useOperationalRows.ts`, the `FreightChangeControl` hunks in `src/App.tsx` and `AuthenticatedPilot.tsx`, `tests/workflowHandoffs.test.ts`, the three modified `supabase/tests/*.sql` files and the new freight section of `SADU_ARCHITECTURE.md`; untracked `src/components/FreightChangeControl.tsx`, `supabase/local/freight-changes.sql` and `supabase/tests/freight-changes.sql`. The SQL follows the repository's existing local-script convention (applied after logistics-sla.sql), not `supabase/migrations/`.
4. **Invitation archive mount.** The `InvitationArchive` import, state and render hunks in `src/App.tsx`. The component, model and tests are already committed.

Keep out of these commits: `supabase/local/.*.tmp`, `scripts/__pycache__/`, `repomix-output.xml`, `my-prototype/`, the `.gitignore` line-ending-only change, agent-instruction files and local tooling, unless the user asks for them separately. The two untracked storage migrations and `supabase/tests/storage_boundaries.sql` belong to the earlier storage work, not to these groups.

Before each commit, run `npm run lint` and `npm run test:guards` on the staged state; for group 2, also run `npm run test:committee:browser`. The SQL tests need the local Supabase containers, which were not running on 13 October 2026, so these SQL edits have not been executed.

No commit or deployment was performed by this verification task. The working tree contains unrelated work: do not stage it wholesale. The completed treatment test is not an instruction to start a HIP migration, change institutional authority or enable integrations. Follow the user's next product instruction, retaining the existing evidence and authority gates.
