# Editorial policy audit

Changes: explicit public-field translation SOP, source-aware Arabic/English queue, immutable database approval receipts, shared bilingual dossier text, and complete-label CSV gating. Internal flight documents are excluded; measurements remain available to Logistics.

Fixed: Arabic source previously requested Arabic again; missing English could pass export; legacy approvals lacked a bilingual completion distinction. Supplemental legacy translation preserves historical approval and cannot alter already approved French-source Arabic.

Verification: production build and guard suite; focused local SQL allow/deny tests (Editorial authority, required English, source immutability, repeated approval lock, artist visibility, measurements before translation); desktop/mobile Arabic-to-English browser flow. SQL fixtures rolled back. Browser test uses a mocked transport; RLS is verified separately against local Postgres.

Limits: SQL installed locally only. Source biographies are dossier-specific, not synchronized into the separate master directory. Existing session publication roster is a separate rehearsal surface. No external emails or hosted schema deployment. Existing bundle-size warning remains.
