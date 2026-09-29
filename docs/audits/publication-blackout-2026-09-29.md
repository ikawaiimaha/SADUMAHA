# Publication and pickup audit — 29 September 2026

Implemented:
- Required bilingual exhibition and artwork text in the session roster, with local image attachment.
- Immutable submitted snapshots, Editorial-only revision approval, image inspection acknowledgement and automatic PDF proof export.
- Current-only design view; amendment immediately removes the previous approved export while retaining audit history. Coordinator visibility is assignment-filtered.
- Duplicate approval guard, stale revision guard, asynchronous export cancellation on workspace/revision change, image object URL cleanup, disabled action states and logical CSS.
- Inclusive blackout validation and explanatory errors in the authenticated freight scheduler, including requested-date approval.

Verification:
- npm run build: TypeScript, 119 guard tests and Vite passed. Existing bundle-size warning remains.
- Publication browser harness: desktop and mobile passed, no page errors or horizontal overflow. Verified approval, PDF download, desk switch and amendment withdrawal.
- PDF rendered with Poppler and inspected alongside mobile screenshot; Arabic and English visible without clipping.
- supabase/tests/publication-blackout.sql executed locally and rolled back successfully: both blackout boundaries rejected, permitted change approved, metadata/translation locks and shipment guards retained.

Limits:
- The new publication approval is explicitly a session rehearsal, not a production Supabase publication service. Existing authenticated scenario uploads/checklists are separate; no claim is made that this unifies both persistence models.
- PDF is a watermarked raster review proof, not a press-ready vector label. Already downloaded files cannot be revoked. Long text paginates.
- Image extension/size validation does not certify print quality; a human inspection is required.
- No real Fatima attachment, title or artwork data was inferred. Browser tests use fictional files and isolated components, not production user authentication.
- No hosted database deployment, email, transport booking or external publishing occurred.
