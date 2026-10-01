# Local collection and pickup workflow

Open `/connected-pilot` on the local connected server. The existing artwork action queue links to **Collection & pickup**. No new dashboard is introduced.

1. As **Logistics**, record the actual collection address, city, country, contact, source reference, IANA timezone, available date range and any closure ranges. These are per-artwork records, not artist nationality or gallery-headquarters fields.
2. Record conflicting information explicitly. Resolve it through a new revision before confirmation. The active Logistics owner must attest that the current source was checked.
3. Select a local calendar pickup date within availability and outside every closure. Closure start and end dates are both blocked. This is date-level planning, not a timeslot or carrier booking. The year is explicit; synthetic historical dates are permitted for rehearsal.
4. As **General Exhibition Coordinator**, assign distinct primary and backup Logistics accounts and record a handover reason. Use **Activate backup** or **Return to primary** to transfer responsibility explicitly. Only that account can modify collection records; the Coordinator assigns responsibility but cannot confirm on Logistics' behalf.
5. The backup inherits no new role powers. The local role selector includes a separate `Logistics — backup officer` test identity. These remain simulated accounts, not provisioned production staff.

Saving changed collection details preserves the previous revisions and clears confirmation and pickup planning. Transactions reject stale versions and preserve state on failure. Archived, acquired or already-received artworks cannot be replanned through this flow. Existing pilot data receives an additive collection-workflow flag on server start, without fabricated collection details.

Pre-dispatch uploads and draft manifests require a valid collection plan in addition to existing condition and approval gates. Manifest origin comes from the current confirmed collection record; the old free-text origin cannot override it. No carrier booking, email, real payment or external integration is triggered. Existing Finance controls remain separate. Physical arrival retains its existing evidence checks; an already-moving shipment is not made impossible to receive solely because a historical pickup plan is absent.

Contact/address information stays in collection records. Decision logs contain action, actor, target and revision references only. Handover reasons remain in dedicated history. This is the local single-process persistence adapter; production transactional storage and authenticated staff assignments are separate work.

Verification:

```powershell
node --import tsx --test tests/pilotCollection.test.mjs tests/pilotActions.test.mjs tests/pilotDispatch.test.mjs tests/connectedPilot.test.mjs
```

Tests cover missing information, invalid dates/timezones, inclusive closure boundaries, conflicts, confirmation, amended-plan invalidation, independent artwork records, proxy/role restrictions, backup activation, concurrent edits and restart recovery. Test repositories and evidence remain in isolated temporary directories.

## Isolated collection demonstration

Run from any terminal directory:

```powershell
node "C:\Users\squir\Documents\ChatGPT\SADUMAHA-main\scripts\sadu-collection-demo.mjs"
```

Open `http://127.0.0.1:3036/connected-pilot`. Use synthetic information only. This is a separate, loopback-only application with simulated accounts, not the existing pilot or a deployed institutionally authenticated workspace. No prelaunch password is inherited from the real application. The launcher passes only basic operating-system environment variables; it does not load project .env files. Its locally built UI uses no external fonts, telemetry or integration adapters. A same-origin CSP restricts browser requests.

Each launch without arguments creates a new `.local/collection-demo-runs/run-*` directory. Stop with Ctrl+C. To resume, supply the printed run name (for example `node scripts/sadu-collection-demo.mjs run-ABC123` from the repository). Existing run directories are retained; no reset deletes files. The repository is single-process only: do not run two servers against the same run directory. Sessions must be reselected after restart, while collection records persist.

The server exposes only simulated session selection, the bounded dossier summary, and collection reads/commands. All other API paths and methods return 403. The fixture contains no payments, and collection commands never update artwork approval or physical shipment status. Dates are synthetic local calendar dates, not live bookable slots.

Demo sequence: Logistics A records source details and an inclusive closure, confirms the source, and attempts a blocked date. Discard the date draft before switching accounts. The Coordinator assigns Logistics B and activates the backup with a reason. B receives the outstanding task; A becomes read-only. B chooses an available date. Amend the address to demonstrate invalidation and refresh to inspect persistence. Ownership/queue changes refresh on focus or within five seconds; API permissions apply immediately.

Unsaved drafts survive refreshed versions. Conflicts require explicit latest-record review before retry; updates are never silently resubmitted. A successful save followed by a failed refresh is labelled separately and further commands wait for refresh. Discarding a draft does not modify the saved record.

Repeatable checks from the repository:

```powershell
node --import tsx --test --test-concurrency=1 tests/collectionDemo.test.mjs tests/pilotCollection.test.mjs tests/connectedPilot.test.mjs
node --import tsx --test tests/collectionDemo.browser.test.mjs
npx tsc --noEmit
```

The browser test creates its own temporary fixture and loopback server. It verifies the handoff, inclusive closure rejection, retained edits during concurrent updates, save/refresh failure messaging, discard, tablet/mobile overflow, no external browser requests, and no payment changes. Screenshots and state are retained in the printed temporary directory. These synthetic tests do not measure real staff time or certify production security.
