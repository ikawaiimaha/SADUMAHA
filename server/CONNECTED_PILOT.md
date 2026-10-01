# Connected local pilot

Run `npm run build:rehearsal`, then `npm run start:connected-pilot`. Open
http://127.0.0.1:3025/connected-pilot and unlock the existing private preview gate.
The server binds to loopback and stores state under `.local/connected-pilot`.
No external connectors are activated. Do not deploy the local account selector.

The shared journey uses Artist submission, Editorial review, Coordinator wall
placement and readiness, Museum Operations clearance, Director publication,
sample agreement acceptance, PR/Technical evidence, Finance authorizations,
Logistics receipt/condition reconciliation and return closure. Payment amounts
are fictional records; acceptance is not a legal signature.

Receipt normally requests GPS and applies the existing museum boundary policy.
`SADU_PILOT_SIMULATED_LOCATION=true` explicitly enables test coordinates and a
synthetic-location audit entry. Never use that setting for real receipt evidence.

`tests/connectedPilot.test.mjs` exercises the actual HTTP routes, byte hashes,
documents, unauthorized and stale commands, completion gates and restart recovery.
Run it with `node --import tsx --test tests/connectedPilot.test.mjs` or the build.
It emits a JSON measurement file and PDFs in a unique temporary evidence folder.
Execution milliseconds are not staff turnaround or time-savings measurements.

Release gaps: institutional identity; transactional multi-user persistence;
private encrypted storage and retention; content scanning/high-resolution checks;
full contract/amendment and return proof; remaining screen adapters; bilingual
print validation; real geolocation trial; notification delivery and outcome baseline.
Local file recovery is tested; disaster recovery is not certified.

## Stage 8 master record

The Director can POST `/api/review/ecosystem/archive-close` with artworkId and
the current versionHash after publication, accepted agreement, reconciled return
and all three sample Finance tranches. `archival-record.mjs` aggregates an
allowlisted snapshot, generates the PDF, and persists both in the same transaction
as `ARCHIVED_CLOSED`. A generation failure rolls back closure and its audit event.
The archive is idempotent, frozen and survives restart. Source edits are blocked.

Only assigned Director/General Exhibition Coordinator accounts may GET
`/api/review/ecosystem/archive/:artworkId.pdf`. The connected dashboards show its
download link only after closure. PDF and snapshot hashes are checked on export.
Every page contains the source-media hash and snapshot hash. The PDF's own hash is
stored separately and returned as `X-Content-SHA256`; a paper hash is not a signature.

`archival-pdf.mjs` uses existing jsPDF with bundled OFL Amiri for Arabic and embeds
the reference image with revision-bound numbered condition pins. No remote images
or sensitive raw message/banking/passport payloads are fetched or serialized.
Malformed source images block closure, rather than being silently omitted.

This host currently joins one pilot dossier's agreement and payments and rejects
multi-dossier state to avoid cross-dossier leakage. A production repository must
provide explicit dossier-scoped contract/ledger joins. The separate browser-only
CollectionCloseout workflow does not trigger this authenticated backend service.
The SQL additions are reference schema, not a deployed migration.

## Acquisition fork

`acquisition.mjs` supplies `nextAccessionNumber` and the acquisition state machine:
AWAITING_ARTIST_SIGNATURE → SIMULATED_ARTIST_ACCEPTED → ACQUIRED_SIMULATED →
TRANSFER_ROUTED. Initiation requires a current published revision, a separate
agreed purchase price in AED minor units and an evidence reference. It freezes
that revision and voids return freight. Archived/returned dossiers cannot be acquired.
Approval allocates YYYY.Edition.Sequence within the repository transaction;
the SQL reference includes a unique index and transactional counter. This is an
institutional numbering convention, not certification of TMS/Axiell compatibility.

The title template is an unsigned draft for legal review. LocalSignatureProvider
returns SIMULATED_NOT_SIGNED; no legally signed transfer, actual ownership change,
payment or vendor connection is asserted outside this explicitly fictional store.
Production signature verification and acquisition payment reconciliation remain
separate release gates. Acquired objects cannot use the return-based archive gate.

POST `/api/review/acquisition/{initiate,sign,approve,route}` implements the fork.
SDC destinations are Main Storage or Sharjah Art Museum. Sovereign routing is
restricted to Director/General Exhibition Coordinator. The buyer cannot be changed
by choosing an inconsistent destination.

Sovereign privacy starts at initiation, not just at final approval. The pilot host
blocks all dossier endpoints for other roles, including raw files, spatial records,
labels, budget and decision history. The Artist receives only an isolated signing
envelope (`/api/review/signing-envelope` and its PDF), scoped to their authenticated
artist ID. This immutable title PDF is created before routing and contains no
destination. Logistics has no sovereign dossier or manifest access. Other backend
hosts must install equivalent query/storage policies before adopting these routes.

Reference: https://help.collections.axiell.com/en/Topics/Acquisition%20items.htm

## Persisted pre-dispatch checkpoint

After publication and agreement acceptance, the Artist submits a PNG condition
photograph, explicit damage declaration and structured shipping details through
`POST /api/review/pilot/pre-dispatch`. A successful upload is bound to the exact
revision and store version; interrupted uploads do not create evidence records.
Staged files from failed uploads are retained for explicit cleanup.

The General Coordinator records CLEAR, REPAIR or CANCEL through
`POST /api/review/pilot/pre-dispatch/review`. Damaged reports cannot be cleared.
Repair requires a new photograph and another review. Previous reports and review
reasons remain stored. Cancellation stops dispatch, not the legal agreement.
As-is acceptance is deliberately unavailable until insurance and packing controls
are connected. These actions neither authorize nor record Finance payments.

The draft manifest and receipt action require current reviewed evidence. The
manifest contains the condition report ID and photo hash. Evidence downloads
recheck role scope and file integrity. External shipping and customs integrations
remain paused. Both main and rehearsal entries expose the loopback-only route.
