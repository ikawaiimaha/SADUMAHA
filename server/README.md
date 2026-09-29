# Local fictional SADU review

Implemented 29 September 2026. This is a working local backend and frontend, not a production identity service or an activated government integration.

Run `npm run build:rehearsal`, then `npm run start:rehearsal`. Open http://127.0.0.1:3013/review. The root page is the executive presentation; the 14-task journey is at /journey. A static preview or a static website deployment cannot run this Node backend; it will show an explicit backend-unavailable message on the review page.

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

## Gallery labels and test QR URLs

Director approval now generates a vector PDF (150 x 100 mm) with the frozen artist display name, artwork title, height/width, year and QR. The service is `server/gallery-labels.mjs` (jsPDF and qrcode). Generation failure aborts the approval and outbox write. PDF bytes, SHA-256, template version and immutable input snapshot are stored together in the local JSON record; this is not a live database deployment. Earlier approvals are not backfilled. Coordinator amendments preserve old PDFs and exclude them from the current batch.

`SDC_CMS_BASE_URL` defaults to `https://sdc.gov.ae/en/biennial2026/artist/`. The service appends the stable artist ID, for example `demo-kufic-horizon`. The local rehearsal defaults `SDC_LABEL_TEST_MODE` to enabled; set it to `false` to exclude generated test URLs from batches. Test labels are `Test_Ready`, have a QR, and display `TEST URL - NOT LIVE-VERIFIED`. A syntactically valid URL does not prove an SDC page exists. No network check, CMS write or external delivery occurs.

Without test mode, a QR requires an exact SDC profile URL and Coordinator-recorded verification with attribution and notes. Otherwise the individual PDF is `Draft_No_QR` and excluded from batches. This records a human assertion, not an automated live-page check. Verification is not inherited by new revisions.

Only the assigned Coordinator can download `/api/review/labels/:id.pdf` or `/api/review/labels/batch.pdf`. The latter contains only the current approved labels. The current journey contains one artist and one publication artwork; the PDF renderer supports 1-100 pages, but this is not yet a multi-artist exhibition database. Print at actual size. The current template accepts basic Latin English text only; unsupported glyphs and overflowing titles fail explicitly. Label dimensions are entered and reviewed separately from the wall-study fixtures.

Verification: 165 tests plus TypeScript and production rehearsal build pass, including generation rollback, duplicate/concurrent approval, byte persistence, QR states, historical exclusion and authenticated downloads.

## Crate-to-wall logistics

The approved publication artwork can now be registered by the Artist as one physical Artwork_Record with a stable UUID, approved revision, shipping details and `physical_status`. The fictional journey supports one artwork in one crate; split crates and multiple artworks require a separate package-to-artwork model. This record is distinct from the separate wall-study fixtures. The artist enters collection and Sharjah delivery points, carrier/reference, handling and gross crate weight; none is inferred from net artwork weight. Details freeze once movement begins. The original saved metadata remains in local history.

`server/logistics-store.mjs` persists `.local/rehearsal-logistics.json`, implements runtime validations and generates an A4 vector PDF using jsPDF/qrcode. `server/schemas/logistics.schema.json` describes the local contract; the unapplied SQL proposal includes the enum. There is no live database migration.

Authenticated endpoints:
- GET `/api/review/logistics`: assigned Artist/Coordinator shipment and history.
- POST `/api/review/logistics`: `{version, action:"save", logistics:{origin,destination,carrier,handling,gross_weight_kg}}` for Artist after Director approval; `{version, action:"arrive", artwork_id, note}` for Coordinator records On_Site_Sharjah; action `status` additionally takes `physical_status` for forward movement.
- GET `/api/review/logistics/:id/manifest.pdf`: assigned Artist/Coordinator downloads the current approved revision's manifest. For pending shipments, printing is blocked when approval is superseded until metadata is refreshed. Once movement has begun, the original snapshot remains downloadable with a historical notice.

The QR contains only the stable artwork UUID, never a mutating URL or private contact details. Coordinator UI supports keyboard scanners/manual entry and camera QR detection where BarcodeDetector is available. Camera activation requires a user click; frames stay local, and tracks stop on recognition, cancellation or unmount. A scan fills the ID; an explicit arrival action records the observation/location with server actor and timestamp. Unknown IDs, wrong roles, stale versions, invalid transitions and backward changes fail. Repeated arrival scans are idempotent. On-site receipt may be recorded without asserting an unobserved customs stage. Installed requires prior on-site receipt and means a recorded physical observation, not technical acceptance.

Source check, 29 September 2026: refreshed the operational tracker (Drive ID 1avjg_IV_Kq_mZFzQCdRvhgND0LnQbpPF; status 11 August, records through 21 July 2026) after reviewing the 13 September responsibilities reconciliation. It separates package weights, contents, origin/destination, condition and installation work. It is a derivative tracker, not proof of current execution or staff delegation. Coordinator arrival recording is the user's requested fictional design; no real institutional authority is asserted. Only invented data enters this demo. External integrations remain paused.

Verification for crate tracking: 169 tests and the rehearsal build pass. Browser test saved fictional shipment details, downloaded the manifest as Artist, recorded arrival by manual ID as Coordinator and checked persistence after reload. The A4 PDF was rendered and visually inspected. Camera hardware scanning was not exercised; manual entry and keyboard-scanner input remain available.

## Smart curation

`src/curation/keywords.mjs` extracts at most eight local suggestions from the saved concept during Artist submit. It normalizes Unicode/case, removes common English/Arabic stop words, folds a small English alias vocabulary, ranks art terms and repeated words, and saves tags plus extractor version/source/time on the exact publication-artwork revision. This is a keyword heuristic, not semantic analysis or translation. A negated theme can still appear. It does not change word-count policy, approvals, publication payloads, payments or logistics. No external AI service receives text.

The Coordinator-only `curationArtworks` projection contains the current submitted publication artwork; unsubmitted revisions and history are excluded. This single-artwork local model uses an explicit publication-artwork key under the artist, separate from physical crate and wall-study identifiers. `SmartCuration.tsx` accepts an artwork array and applies exact AND matching through `filterArtworks`; tests use multiple records to verify grouping. The real journey still has one artwork, not a newly provisioned multi-artist database. A new artist revision does not inherit old tags. Legacy submitted records offer explicit Coordinator `tag_existing` extraction through the existing versioned action endpoint, recorded in decision history without changing their content or approval.

The unapplied SQL proposal adds `thematic_tag` and an `artwork_tag` relation keyed by submission, artwork and revision. Local persistence remains the review JSON store. There is no production migration, new institutional authority or integration activation. Tests cover deterministic ranking, empty/noisy text, Unicode, tag limits, exact multi-tag filtering, role denial, forged input, revision freshness, legacy approval preservation and reopening persisted tags.

Smart curation verification: 173 tests, TypeScript and rehearsal production build passed. Browser checks extracted themes for the existing approved revision, selected architecture + bronze together, cleared selections and reloaded the saved suggestions. Multi-record and no-match behavior are covered by tests; the local demo has one record.

## Audit remediation (29 September 2026)

See `reviews/SADU_Fictional_Audit_2026-09-29.md` for current scope, defect findings and the implemented/proposed feature matrix. The 14-task checklist now replays a validated session journal across same-tab refresh/navigation; it remains separate from backend review, wall-study and crate state. Physical receipt no longer depends on advance payment, while delivery authorization still requires the advance and receipt. The review UI selects the actual current revision, resolves superseded alerts, reflects test-mode batch policy, protects shipment edits and puts review work before auxiliary tools. Shipped crates retain a marked historical manifest when publication changes; long details move QR identification onto another page. Landing-page background motion has a pause control. None of these changes activate the real application or integrations.

## Stable entity revisions and change impacts

See [ENTITY_GOVERNANCE.md](ENTITY_GOVERNANCE.md) for the implemented graph schema, safe decision codes, invalidation matrix, API and local provider adapters. The review service now returns the governance projection and Logistics impact array; external providers remain paused.
