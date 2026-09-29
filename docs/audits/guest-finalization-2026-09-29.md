# Unified guest intake audit

Inspected source field labels from visa form (6).xlsx, الوثيقة التعريفية (2).xlsx and guest-list (3).docx; no real identity records copied. Canonical JSONB identity, travel preferences and file packet are read by PR only after immutable finalization. Optional family fields are not declared mandatory merely because a blank template includes them. Existing booking/visa outcomes remain separate operational decisions.

## Validation
- Build and 125 guard tests pass.
- Desktop/mobile mocked browser flow: save travel dates without passport, required identity/airports, reject invalid PDF, retry upload without duplicate intake, finalize and read PR queue.
- Local SQL: missing-file finalization denied, PR draft privacy, repeated finalization preserves timestamp, duplicate plan suppression, all three reminder windows, changed-plan cancellation, completion cancellation and client denial of scheduler/delivery mutations.
- Existing guest privacy regression updated for PR finalized-only access and passes.

## Limits
- Local schema and local pg_cron only. No hosted changes or outbound email.
- 30-day lead is central configuration from the user's requested approach, not an immigration guarantee.
- No arrival record means reminders cannot be date-derived; UI flags this explicitly.
- Existing Stage 5/VIP accounts/invitations remain unprovisioned.
- Header/MIME/size checks do not establish pristine scans or malware safety; PR inspects documents.
- Current form restores saved text on agreement selection, but interrupted uploads after browser refresh still require a new complete packet; no durable cross-session file resume is claimed.
- The original forms include further repeatable family/local-reference tables; current additional identity fields are optional text, not a certified export/replacement for every government form or official visa submission.
