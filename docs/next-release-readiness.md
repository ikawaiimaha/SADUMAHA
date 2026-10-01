# Connected journey release boundary

The October 2026 prioritization memo supersedes earlier claims about automatic
payment, blanket geofencing, immutable hashes, and production readiness.

## Implemented in this increment

- `/connected-pilot` exposes the existing authoritative local service independently
  of executive presentation mode. Remote deployments keep this route unavailable.
- Server-derived role queues explain pending work and blockers. Mutation handlers
  retain authority; queue entries are guidance, not permission grants.
- Conflict responses refresh the shared view without silently resubmitting edits.
- Removed the shipping-manifest download that invariably returned an error.
- Added competing-write, rollback and restart checks alongside the existing HTTP
  submission-to-return test. These exercise one local server, not a production
  multi-process database or a two-person usability session.

## Release blockers still requiring implementation and verification

1. Connect pre-dispatch evidence and damage resolution to this same persisted
   journey. The browser artist-care demonstration remains a separate store.
2. Provide contract amendment records and affected-item revision routing. Current
   accepted agreements block direct resubmission; this is not an amendment workflow.
3. Connect attributed verbal instructions and explicit confirmation/delegation;
   recording an instruction must never execute the attributed person's approval.
4. Replace the strict receipt geofence with supporting evidence plus a separately
   authorized, recorded exception path. Preserve independent Finance authorization.
5. Test aborted uploads, stale edits across independent browser sessions, and
   recovery with retained documents before marking the release reviewed.
6. Measure actual staff task durations, missing information and follow-up counts
   against an observed manual baseline. Script runtime is not operational ROI.

Local account selection simulates identity. The JSON repository serializes writes
within one server process. Neither is a production identity or database assurance.
External communications, signatures and institutional integrations remain paused.
