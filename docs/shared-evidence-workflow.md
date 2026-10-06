# Shared evidence, collection and print release

Implemented 5 October 2026 in the existing **connected local pilot**, at `/connected-pilot`. This extends its single-process, transactional file repository and simulated account sessions. Different browser sessions share the saved record. It is not a production identity system, a hosted database rollout or a replacement for the separate browser-only pitch checkpoints.

## What changed

| Requested improvement | Implementation |
| --- | --- |
| Inspectable evidence | Private, versioned PNG/JPEG/PDF files; source/sender/known receipt time; server timestamp and actor; stored-byte SHA-256 verification; in-page PDF/image preview and original download. |
| Shared authoritative records | Collection and print packages use the same local repository. Server derives the actor, checks access/current version, serializes writes and retains idempotency receipts. Print review uses the existing shared print reducer. |
| Clear readiness | Collection preparation, reviewed packing file and existing condition/agreement clearance appear separately. Expired plans remain held. The draft manifest rechecks departure prerequisites; readiness does not book transport or record custody. |
| Complete print instructions | A package binds the exact PDF to supplier, quantity, size/bleed, stock, finishing, technical profile and delivery date. Preflight, bilingual/rights review, approval, supplier acknowledgment, printing, completed quantity, deliveries and acceptance remain distinct. |
| Accountable deadlines | Unaccepted Logistics handoffs and expired pickup windows appear in the existing queue. The General Exhibition Coordinator can assign named Technical/Finance/Editorial tasks with explicit due times. Assigned reviewers must accept before acting; late acceptance retains its timestamp. |

The `Evidence & release` section keeps secondary files, history and forms behind expandable sections. The PDF viewer is loaded only when needed, renders locally using PDF.js, and does not execute PDF forms or offer embedded document actions. The original download remains available. Header checks and human review are not malware scanning or automatic print certification.

## Try it locally

Use the existing connected-pilot launcher and password configuration. Build the current rehearsal assets with `npm run build:rehearsal`, then run `npm run start:connected-pilot` and open `http://127.0.0.1:3025/connected-pilot`. Do not start a second process against a repository already in use. The isolated collection-only launcher retains its narrower scope and does not become a printing server.

### Collection

1. Logistics records and confirms collection information, accepts responsibility and chooses a local pickup date.
2. Record a packing plan. Technical and Finance complete their separate reviews. Where the General Coordinator has assigned a named task, that owner accepts first.
3. In **Evidence & release**, attach a synthetic packing photograph or PDF with its source and sender. Unknown receipt time stays unknown.
4. Open the evidence, inspect it and use **Verify current packing file**. This records completion against the exact packing scope and file; a reference-only completion cannot satisfy departure readiness.
5. Review the separate condition/agreement hold. The existing artist condition-report and coordinator-review workflow clears that hold; this feature does not create another condition engine.
6. Change the plan or packing scope and check that old evidence remains available but cannot clear the revised plan. Past pickup dates surface a replanning task without inventing a cancellation or a collection.

### Printing

1. The Exhibition Coordinator or General Exhibition Coordinator uploads a synthetic proof PDF and creates a print package with the required production specification.
2. Technical or Editorial attaches the PDF preflight report and records its result for the exact proof/profile. A failed result holds Editorial routing.
3. Editorial records bilingual and permissions-to-use review. The Chairman records the proposed rehearsal authorization. This is the existing demonstration route, not a newly established institutional delegation.
4. Editorial records dispatch and supplier acknowledgment of the current file/package. These are recorded facts, not outgoing communications. Supplier identity is not independently authenticated in this simulation.
5. Editorial records printing and actual completed quantity. Deliveries may be partial; their sum cannot exceed reported production. The General Exhibition Coordinator records inspection/acceptance of each delivery separately.
6. A defect creates an immediate hold. A dispatched package cannot be replaced until supplier stop acknowledgment or stock disposition is recorded. A successor package preserves prior files, decisions and deliveries, and requires new reviews and acknowledgment.

## Data and access

Files are streamed into UUID-named local staging objects, limited to 10 MB, then attached only after successful hashing and a transaction/version check. Failed staging objects are retained for explicit cleanup rather than deleted automatically. A file cannot be read through the API without the relevant session, exhibition and workflow access. Sovereign-acquisition restrictions and archived-record freezes remain in force.

Decisions store the actual session actor and server time. Print decisions also retain the package revision, proof ID/hash and specification hash. Packing verification retains the evidence ID and packing-scope hash. Hashes provide an integrity comparison, not a legal signature or a truth assessment.

Readiness and elapsed-date checks are derived on request using the server clock and the collection location's timezone. The browser refreshes approximately every five seconds and on focus. There is no new background notification scheduler. Named due times are entered in the user's device timezone and stored as UTC instants. No universal deadline or escalation authority has been invented.

## Verification

`tests/pilotOperations.test.mjs` covers file access and corruption, changed packing scopes, independent sessions, restart/file recovery, partial delivery and separate acceptance, idempotent retries, correction stops, failed preflight, named-task acceptance, elapsed pickup dates, concurrent writes and invalid uploads. It is included in `test:guards`.

The existing connected journey test now uploads and verifies actual packing evidence before downloading the draft manifest; its clock is explicit to avoid a date-dependent result. Existing collection-only tests continue to cover the narrower isolated demonstration.

Verification performed during implementation:

- The amendment regression run passed 11 integration tests covering the connected journey, operations, collection and isolated collection runtime.
- The full rehearsal build passed: TypeScript, 236 guard tests, 24 workflow tests, 50 review tests and the Vite production build (310 tests, zero failures or skips). TypeScript and the UI build were repeated after the final dialog focus/contrast fixes. Existing bundle-size and mixed-import warnings remain.
- Browser: uploaded a synthetic PDF through the form, saved its print specification, refreshed, switched to Editorial, and opened the exact PDF in the in-page renderer. Rendered pixels and extracted text matched the synthetic document. No browser console errors were observed in that check.
- Amendment browser check: cancelled packing and pickup previews without changing the record; retained the edited date and packing reason; confirmed a pickup change and saw packing readiness return to a hold with source confirmation retained. Cancelled a revised print quantity, retained the input, then confirmed it and saw revision 2 with fresh preflight/review requirements and revision 1 still accessible.

The preview check used a newly created loopback-only synthetic fixture, not the pilot's existing data. Browser verification does not establish real-user usability, production security or staff-time savings.

## Amendment impact review

Before changing an existing collection address, pickup date, packing plan or print package, the connected workspace requests a read-only preview from the server. The server applies the actual transition to a private copy and compares the results. The bilingual dialog shows changed values, completed checks that need renewal, the named owner (or explicitly unassigned role), the next action and unaffected records.

The user can return to their unchanged draft, or confirm and save. The server recomputes the review fingerprint inside the write transaction and rejects missing, mismatched or stale acknowledgments. This fingerprint binds a review to the actor, proposed command and repository version; it is not an identity credential or legal signature. Accepted amendments retain the review reference and affected check keys with the attributed decision. Preview reads do not create decisions, tasks, notifications or revisions.

- Pickup changes retain confirmed source details but clear packing prerequisites under the existing dependency rule.
- Reopening packing retains the pickup plan and requires renewal of completed packing reviews; pending reviews are not described as revoked approvals.
- Print replacement requires a new technical preflight, Editorial review and authorization. Existing supplier-stop requirements still apply. Previous production and deliveries stay historical and do not count toward a successor order.
- Resaving identical collection details or the same pickup date preserves existing confirmations and packing checks. A deliberately created new print revision still requires fresh reviews, even when its visible specification is unchanged.
- A concurrent update requires a fresh preview. Cancelling keeps the entered form values and does not alter the shared record.

The same collection preview is available in the isolated collection runtime. Its allowlist remains limited to collection and simulated sessions. Regression tests exercise preview-only reads, tampered/stale acknowledgments, named and unassigned owners, changed backup ownership, retained unrelated records, print stop gates, idempotent print retries and restart recovery.

## Remaining production boundary and next refinement

The connected pilot is still single-process and uses fictional account selection. Real multi-user deployment requires institution-approved authentication, staff provisioning, transactional database/storage, retention, malware handling, supplier identity and restore operations. No external integration, payment, email, booking or deployment was enabled here.

The next useful product improvement is to let the coordinator assign the explicitly unowned renewal tasks directly from the existing action queue after an amendment, with a due time and recorded acceptance. Do not infer assignment or approval merely because the impact preview was confirmed.
# Revision-specific renewal handoffs — 2026-10-05

Six connected-pilot improvements extend the existing amendment preview:

1. Fresh task cycles bind the affected collection or print checks to the new revision. Superseded task IDs cannot be used for a later revision.
2. The General Exhibition Coordinator assigns named, eligible owners and explicit deadlines, with a reason. Assignment cannot change institutional approval powers.
3. Owners accept or return a task with a reason. Return routes the outstanding responsibility back to the Coordinator; reassignment and changed Logistics ownership require fresh acceptance.
4. The shared queue and task register show prerequisites, unassigned responsibility and server-clock overdue status, with Mine / Unassigned / Overdue / Outstanding filters.
5. Task links open the relevant workflow form and available authorized evidence objects. Print tasks retain exact proof and preflight references; verified packing retains its scoped file reference.
6. Completion follows successful domain actions, preserving actor, timestamp, revision and evidence references. Technical non-applicability has its own recorded outcome. Historical completion does not imply current departure clearance, payment authorization or physical printing.

Implementation: `server/renewal-tasks.mjs`, collection/operations services, `RenewalQueue.tsx`, and the existing connected workspaces. The repository remains the loopback-only, single-process local rehearsal backend with simulated accounts and polling. Live identity, messaging, shipping and payment providers remain paused. This does not deploy changes to Vercel or migrate a hosted database.

Verification includes HTTP role/owner enforcement, reason-bearing return, future deadlines, prior-revision rejection, backup reassignment, technical exemption, exact evidence references, idempotent operations, concurrent stale-write rejection and restart recovery. Browser inspection covers assignment, acceptance, return, completion, focus navigation and PDF evidence viewing. See `.local/renewal-audit/audit.html` for this run's screenshots and limits.
