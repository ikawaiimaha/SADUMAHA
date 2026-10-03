# Actionable handoffs — local presentation

The overview uses one NextActionCard pattern for collection and printing: next action, named owner, blocker and expandable source evidence. This keeps detailed history out of the primary action area. Status meaning is expressed in text, not colour alone. Cards use logical spacing and keyboard-accessible controls.

Collection now requires backup acceptance, a valid October rehearsal date, a packing specification and named packing owner, a simulated Finance cost authorization reference, and completion evidence. Zero cost still requires review. Reopening packing removes current readiness and preserves prior event references. Date validation never silently rewrites December as September. Ready, booked and physically collected are separate; this demo cannot book or record actual transport.

Print acknowledgment can retain channel, sender, simulated receipt time, recorder and exact revision. A verbal message or transcript is not independently verified approval. The demo states when receipt is simulated and when source metadata was not recorded. Older reference-only records remain readable.

No ArtistStatus/ThemeStatus or institutional authority is changed. Both demonstrations are browser-session simulations; reset/refresh clears them. No real correspondence, passport, external integration or live database is used. This is not authenticated backend authorization.

## Production work requiring institutional scope

- Confirm programme-specific brief, decision authorities, exception permissions and retention policy. Do not turn historical remarks, nationality or religious-text keywords into automatic rejection rules.
- Connect these handoffs to the authoritative backend with authenticated roles, transactions, immutable file versions and concurrency controls.
- Introduce authorized inbound-message capture with source identifiers, deduplication, failed-delivery recovery and an unassigned queue for ambiguous dossier matching. Never treat capture as approval.
- Separate original evidence from transcription/summaries, and record who confirmed proposed changes. Protect attachments, searches and exports with the same access rules.
- Add scoped large-file intake/retry and human quality review under approved storage arrangements.
- Surface role-filtered action queues and consolidated overdue handoffs; measure completion time and recovery without inventing savings.

These items remain a scoped engineering backlog, not connected capabilities. The current work intentionally retains paused external communications, shipping and payments.

Verification: `node --import tsx --test tests/collectionReadiness.test.ts tests/pitchCollection.test.ts tests/printRelease.test.ts tests/livingRecord.test.ts` and `npx tsc --noEmit`.
