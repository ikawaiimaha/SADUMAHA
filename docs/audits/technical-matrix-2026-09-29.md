# Centralized technical execution matrix

The existing system had room claims and venue approval tickets but no structured Stage 4 hardware requirements connecting them. This change adds hardware/specification/mounting intake to ArtistNominationForm, displays requirements in Committee/Director review, registers matching venue tickets from SharedSpatialLedger and shows the same approval in Technical.

The matrix is read-only in Technical. A claimed room alone remains pending. Only the designated venue authority (or its configured same-role delegate) can clear the ticket through the existing rehearsal Venue Host perspective. Technician, HIP and Coordinator role selection does not itself approve that ticket.

Clearance identity binds dossier revision, requirement ID/content, room, claim time, curator and assigned coordinator. Revised specifications cannot reuse old approval. The existing financial evidence gates and inventory requests are unchanged. Pending amendments, damage and executive holds lock the matrix. An empty historical requirements list does not fabricate equipment or clearance.

Validation: production build, 113 guard tests, desktop/mobile browser handoff test. Tests cover missing room, wrong authority, repeated approval, revised specs/mounting/scope/allocation and read-only Technical access. Existing bundle-size warning remains.

Limits: session-only records, no authenticated multi-user synchronization, engineering certification or database migration. Offline agreements must be recorded and confirmed by the designated authority. No PDF was modified: the request supplied no new questionnaire text or target fillable PDF.
