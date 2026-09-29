# Local fictional SADU review

Implemented 29 September 2026. This is a working local backend and frontend, not a production identity service or an activated government integration.

Run `npm run build:rehearsal`, then `npm run start:rehearsal`. Open http://127.0.0.1:3013/review. The root page retains the 14-task journey. A static preview or a static website deployment cannot run this Node backend; it will show an explicit backend-unavailable message on the review page.

Three fictional accounts are configured server-side: Artist, General_Exhibition_Coordinator and Director. HIP is absent and rejected by this service. No real staff accounts were created, and historical/paused HIP modules were not migrated or deleted. Selecting an account is intentionally a demo sign-in, not proof of identity. Do not expose this service publicly or enter real personal data.

The API derives the actor from an HttpOnly, SameSite session cookie. It checks exhibition/artist scope, role, current state, revision and optimistic version on every mutation. The server binds only to 127.0.0.1, rejects non-local Host headers and rejects cross-origin writes. Sessions expire after eight hours and are lost on restart.

The review record persists in `.local/rehearsal-review.json` (Git-ignored). Writes are serialized and saved via atomic file replacement. Use one server process for this file. This is local JSON persistence, not the proposed SQL schema, encrypted storage or a production database. The existing 14-task journey remains browser-session state; its review-record export is unchanged.

Flow: Artist saves and submits → General Exhibition Coordinator requests revision with required notes, or forwards the current snapshot → Artist edits a new revision after critique → Director sees only finalized records and selects Approve & Publish. The latter freezes the revision and atomically creates one allowlisted outbox snapshot. Repeated or stale approvals cannot duplicate it. Earlier revision content and decision history remain saved. In-app alerts and outstanding tasks derive from these transitions.

No sender/worker is configured. Outbox entries remain Pending_Sync / Paused. No webhook URL, remote account, payment, email, government integration, passport validation, deadline policy or document vault is activated by this slice. Those other requested features remain separate work.

Verification: `npm run test:review` covers role/scope denial, critique and revision preservation, Director projection, current-revision publication, stale/forged commands, duplicate/concurrent approvals, file reopening and HTTP session/origin controls. The full rehearsal build also runs the existing guard suite and TypeScript. Browser review completed a critique/resubmit/publish cycle, checked the unsaved-draft submission lock, reloaded the approved record and observed no console errors.

## Bounding-box wall planning

The Artist account can create/update wall artwork records with required positive `width_cm` and `height_cm`. The assigned General Exhibition Coordinator can configure `Wall_Space.max_width_cm` / `max_height_cm`, drag artwork cards onto a scaled SVG wall, move placed blocks with pointer/touch or arrow keys, enter exact positions and save a validated layout. The default 600 × 300 cm wall is fictional; no wall dimensions are inferred for the bronze sculpture.

The frontend and backend share `src/spatial/geometry.mjs`: axis-aligned bounding boxes, centimetre coordinates from the wall top-left, no rotation, strict interior overlap detection and edge-touching allowed. No minimum hanging gap, load capacity, obstacle map or engineering acceptance is implied. Out-of-bounds, overlapping and unplaced works produce named warnings and block layout save. The server repeats validation independently of the UI.

`server/schemas/spatial.schema.json` describes the persisted local contract; `server/spatial-store.mjs` explicitly enforces dimensions, ownership, roles, versions and geometry on mutation. `.local/rehearsal-spatial.json` holds the local wall, artwork records, positions and history. This store is independent of the frozen publication text revisions. Geometry changes never authorize publication or payment. Existing review records are preserved; no historic dimensions are invented or backfilled. Only the assigned Artist and Coordinator can access the spatial endpoint. Updating artwork dimensions removes that work's old placement; resizing a wall preserves positions and flags newly invalid ones. Previous snapshots remain in history.

The SQL proposal has matching centimetre fields, a wall entity assigned through the artist's submission, and artwork placement relationships. It remains a draft; no production SQL migration has been applied. Spatial tests cover individual edge violations, area-only false positives, touching/overlap, malformed inputs, role/scope denial, stale saves, changed dimensions, concurrent writes, persistence and HTTP controls.
