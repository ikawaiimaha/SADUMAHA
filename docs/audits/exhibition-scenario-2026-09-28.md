# Exhibition scenario and private ingestion

Artist declares up to 30 zones with integer artwork counts, medium, display specification, print/video requirements and dark-room flag. Every declared media category in each zone needs an actual successful upload. Uploads target the private logistics-secure bucket with immutable unique object paths. File headers, extensions and 50 MB per-file limit are checked; this is not malware scanning or resolution certification.

Supabase stores artwork_checklist JSON and locks the submitted record. Coordinator and Logistics views read the persisted checklist under RLS. Existing fictional session contracts cannot authorize uploads: Artist chooses an accepted database contract owned by the authenticated account. The authenticated pilot also exposes the intake. Missing configuration, authentication, mapping or schema fails closed.

Local SQL applied: supabase/local/exhibition-scenarios.sql. No hosted database modified, and SQL is intentionally outside the auto-deployed migrations directory. Local tests in supabase/tests/exhibition-scenarios.sql verify missing media rejection, successful finalization, immutable submission, cross-artist denial, PR isolation and Logistics visibility, using transactional Storage metadata fixtures and rollback. This does not claim an HTTP upload test or malware inspection. Deployment needs reviewed existing contract ownership mappings and accepted statuses.

Failed uploads retain registry entries, never count as uploaded, and allow retry with a new unique object. Removed zones do not delete uploaded evidence. Refresh reloads saved drafts and confirms object presence. Orphan-retention cleanup and resumable large-video uploads remain future operational work. The 50 MB cap is explicit pilot scope.

Schema notes: database ownership and assigned coordinator come from bilateral_contracts, never demo role selection or user_metadata. No secret key or public asset URL is used. No UPDATE/DELETE storage grant is introduced. Security-invoker trigger validates media existence and metadata at finalization. Auth changes clear displayed rows and invalidate stale responses.

Verification: 84 automated guards/render tests pass; browser /pilot confirms unauthenticated final submission disabled and no console errors. Authenticated HTTP upload walkthrough remains unverified. Module is lazy-loaded to preserve the initial bundle boundary.
