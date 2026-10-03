# Local print-release loop

Open `/overview#print-release`, then expand the print demonstration. It shares the publishing reducer with the existing publishing workspace. This is an isolated browser-session simulation: refresh/reset clears it; no live database, supplier, email, payment or printer is connected.

1. Coordinator attaches the prepared proof.
2. Publishing manager checks both languages and the sample rights note, then routes that revision.
3. Chairman records the sample release. This existing demonstration route is not verified institutional delegation.
4. Publishing manager records dispatch, then the supplier's acknowledgment reference for that same revision. The manager is the recorder, not the supplier's authenticated identity.
5. Printing can start only after acknowledgment. Completion requires a quality/completion evidence reference.
6. Correction requires a reason. After dispatch, it also requires a stop/recall confirmation or completed-stock disposition reference. The Coordinator can then attach the successor proof. Reviews, approval and supplier acknowledgment restart; the old revision and production history remain.

The bilingual proof is an inline synthetic template reused across demo revisions. This tests revision routing, not actual corrected PDF bytes, cryptographic file integrity, supplier authentication or press automation. A production implementation must bind approval to immutable stored proof bytes and verify supplier evidence through authenticated backend operations. Software cannot recall an offline copy or stop a physical press.

`node --import tsx --test tests/livingRecord.test.ts tests/printRelease.test.ts`

Tests exercise sequencing, wrong roles, stale revisions, duplicate actions, missing evidence, production holds and retained post-completion history. Existing ArtistStatus/ThemeStatus, financial authority and live integrations are unchanged.
