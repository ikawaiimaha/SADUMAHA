# Local fictional SADU review

Implemented 29 September 2026. This is a working local backend and frontend, not a production identity service or an activated government integration.

Run `npm run build:rehearsal`, then `npm run start:rehearsal`. Open http://127.0.0.1:3013/review. The root page retains the 14-task journey. A static preview or a static website deployment cannot run this Node backend; it will show an explicit backend-unavailable message on the review page.

Three fictional accounts are configured server-side: Artist, General_Exhibition_Coordinator and Director. HIP is absent and rejected by this service. No real staff accounts were created, and historical/paused HIP modules were not migrated or deleted. Selecting an account is intentionally a demo sign-in, not proof of identity. Do not expose this service publicly or enter real personal data.

The API derives the actor from an HttpOnly, SameSite session cookie. It checks exhibition/artist scope, role, current state, revision and optimistic version on every mutation. The server binds only to 127.0.0.1, rejects non-local Host headers and rejects cross-origin writes. Sessions expire after eight hours and are lost on restart.

The review record persists in `.local/rehearsal-review.json` (Git-ignored). Writes are serialized and saved via atomic file replacement. Use one server process for this file. This is local JSON persistence, not the proposed SQL schema, encrypted storage or a production database. The existing 14-task journey remains browser-session state; its review-record export is unchanged.

Flow: Artist saves and submits → General Exhibition Coordinator requests revision with required notes, or forwards the current snapshot → Artist edits a new revision after critique → Director sees only finalized records and selects Approve & Publish. The latter freezes the revision and atomically creates one allowlisted outbox snapshot. Repeated or stale approvals cannot duplicate it. Earlier revision content and decision history remain saved. In-app alerts and outstanding tasks derive from these transitions.

No sender/worker is configured. Outbox entries remain Pending_Sync / Paused. No webhook URL, remote account, payment, email, government integration, passport validation, deadline policy or document vault is activated by this slice. Those other requested features remain separate work.

Verification: `npm run test:review` covers role/scope denial, critique and revision preservation, Director projection, current-revision publication, stale/forged commands, duplicate/concurrent approvals, file reopening and HTTP session/origin controls. The full rehearsal build also runs the existing guard suite and TypeScript. Browser review completed a critique/resubmit/publish cycle, checked the unsaved-draft submission lock, reloaded the approved record and observed no console errors.
