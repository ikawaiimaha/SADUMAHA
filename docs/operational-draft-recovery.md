# Private operational draft recovery

Scope: the existing `/connected-pilot` selected-task workspace. One active draft per account and artwork, bound to role, exhibition, task, panel and shared record version. Synthetic local rehearsal only.

## User experience

1. Edit an available collection or print form. After 650 ms without further input, working text saves to the local service. The status explicitly says this is a private draft, not a submitted decision.
2. Refresh or restart, then select the same simulated account if its session expired. A compact recovery card offers Resume or Discard; saved input is behind a disclosure.
3. Resume retains text, dates, closure periods, factual source-conflict flag and available evidence references. Inspection results return to Hold; approval assertions remain unchecked. Uploads require reattaching the actual file.
4. If the shared version or permissions changed, inspect “What changed?”: original shared value, current shared value and any corresponding unsubmitted input are separate. Changes to proof, quantity, pickup, packing, ownership, deadlines and review status are visible. Remaining reviews use the existing queue's actual owners and acceptance states. Inspect the draft as a reference and reopen current work. There is no silent merging, rebasing, replay or inherited approval.
5. Another tab's draft update produces a conflict. Input stays in the current page; reviewing the saved copy and explicitly replacing local input resolves it. Failed/unknown saves never display a success claim.

The leave-page warning remains for unconfirmed saves and uncertain submissions. It does not interrupt refresh after a confirmed durable draft save. Existing role/task navigation guards still protect the active form.

## Implementation

- `server/pilot-drafts.mjs`: bounded private draft API; same-origin/session middleware; own-account access; live sovereign/access checks; independent transactional storage and optimistic revisions. Clearing retains a revision tombstone.
- `server/draft-comparison.mjs`: workflow-scoped read projection captured by the server at the first matching-version save. Autosaves retain the original reference through restart. Late saves and older drafts without a baseline cannot claim historical values; unchanged compared fields never imply that permissions or other holds are clear.
- `src/lib/workspaceDraft.ts` and `useWorkspaceDraft.ts`: serialized writes, debounce, conflict recovery and submission-intent marker. Unknown outcomes freeze further draft writes until a fresh read.
- `DraftForm.tsx`, `DraftRecovery.tsx`, `OperationalForms.tsx`, `OperationalWorkspace.tsx`: explicit restore UI, minimal form capture, safe field recovery and current-task authorization.
- `ConnectedPilot.tsx`: separates durable recovery from unsaved leave-page protection.

No external telemetry, file upload service, email, shipping, payment or production database is used. Local draft storage requires the same host protection as the existing pilot repository. One process owns it. No draft history, automatic merge, multi-draft switcher, production SSO or disaster-recovery certification is claimed.

## Verification and audit — 6 October 2026

- Full rehearsal verification passed: TypeScript, 265 guard tests, 24 workflow tests, 50 review tests and Vite build (339 tests total). Final UI-only adjustments also passed TypeScript/build. The existing >500 kB bundle warning remains.
- Automated recovery tests cover restart, session expiry, cross-account privacy, sovereign revocation, archival lock, spectator restrictions, input bounds, excluded assertions/file bytes, concurrent writers, tombstones, stale business versions and attempted submissions.
- Client tests cover serialized autosave/intent/clear and the freeze following ambiguous network failure.
- Browser verification covers Arabic print text recovery with Pass reset to Hold, changed assignment blocking, account-isolated recovery, same-user tab conflict and explicit replacement, mobile layout and collection source recovery (including closure dates and the factual conflict flag). A restored print draft was explicitly reviewed, submitted, persisted and cleared without releasing the other print gates. No unexpected browser errors were observed.
- Audit fixes: removed redundant leave-page prompts after confirmed autosave; disabled inactive recovery controls; clarified changed-record status; replaced raw reference IDs with readable names; corrected controlled closure-date input handling.
- Browser comparison checks: pickup 17 → 19 October retains an unsubmitted 23 October; print quantity 250 → 300 retains an unsubmitted 275. The exact prior preflight becomes pending. Collapsed details keep remaining changes and owners available without stacking disabled forms. Focus moves to the recovered draft, and its text explicitly distinguishes private input from shared state.
- Field comparison is now implemented with explicit baseline limits. Stale drafts still require starting from the current task; unrelated version increments do not silently grant permission to resume. Next candidate: a user-reviewed transfer of selected non-approval values into a fresh draft, only after task/revision checks and a separate impact review. Do not add automatic merge or approval inheritance.

Full release checks and screenshot evidence are recorded in `.local/release-check-20261006-1534.log` and `.local/change-review-audit/`. These local artifacts are not published test data.
