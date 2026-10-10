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

## Repeat only when needed

From `C:\Users\squir\Documents\ChatGPT\SADUMAHA-main`:

```text
npm run test:treatment:browser
```

The command builds fresh files and starts its own temporary loopback server with a fresh synthetic store for each test. It does not require an existing server on port 3025. It does not change `.local/connected-pilot`, send messages, book freight, pay anyone, or deploy.

Implementation: `tests/e2e/treatment-flow.spec.ts`, `playwright.treatment.config.ts`, and the script in `package.json`. Local output: `.local/treatment-browser-results/`; retained synthetic stores: `.local/treatment-browser-run-*`. A passing result applies to the files tested, not to future edits. Rerun when relevant code changes or a new failure warrants it; do not restart completed verification just because a new conversation lacks history.

## Permission boundary and next work

The exact rule `Bash(npm run test:treatment:browser)` is present in both `.claude/settings.json` and `.claude/settings.local.json`. This adds one command, not a broad shell permission. These files do not override a separate Cline, provider or managed denial. If a new invocation remains denied, report that boundary once; do not repeatedly ask the user to run checks whose passing output is already recorded, silently switch shells, or grant broader permissions.

No commit or deployment was performed by this verification task. The working tree contains unrelated work: do not stage it wholesale. The completed treatment test is not an instruction to start a HIP migration, change institutional authority or enable integrations. Follow the user's next product instruction, retaining the existing evidence and authority gates.
