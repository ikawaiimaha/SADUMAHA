# Operational visibility review

Implemented current-revision Editorial label readiness in HIP/Director, PR itinerary approval, and a minimal authenticated Technical calendar.

## Audit improvements
- File upload alone never creates print readiness; amendment withdraws the green state.
- Arrival preferences never masquerade as approved tickets.
- SQL denies Technical access to intake identity and ticket references, restricts receipt creation to trusted PR role, stamps server time, and prevents duplicate approvals.
- Calendar removes superseded travel dates, replacement finalized packets and ineligible contracts.
- Client clears results on account changes, ignores stale requests and displays database failures separately from approval.
- RTL date ranges use bidirectional isolation. Inputs have labels; status feedback is live; pending actions are guarded.

## Verification
- Production build, TypeScript and 125 guard tests passed.
- Four desktop/mobile browser cases passed (existing guest intake plus operational visibility); mobile screenshot inspected.
- Local SQL transaction tests passed: PR approval, duplicate rejection, Technical projection, denied identity/reference access and unauthorized mutation, date-change invalidation. Fixtures rolled back.

## Limits
Publication roster is session state. Calendar requires the local-only SQL to be reviewed and installed separately on hosted Supabase. Polling interval is 15 seconds. PR reference is a recorded human review, not airline integration. No external email or bookings occur. Existing bundle-size warning remains.
