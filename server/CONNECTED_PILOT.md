# Connected local pilot

Run `npm run build:rehearsal`, then `npm run start:connected-pilot`. Open
http://127.0.0.1:3025/review and unlock the existing private preview gate.
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
