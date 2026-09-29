# Technical rider audit

Implemented Stage 4 medium tagging and automatic rider requirement, 20 MiB PDF intake/header check, submission/Committee/Director revalidation, and shared read-only references. Technical sees artwork-bound files; venue host operations/curator readers are filtered by active venue claim. Links are revoked on unmount/file replacement. Upload reads use a generation guard to avoid a late file selection replacing the current one.

Hardening: missing riders cannot dispatch an approved sculptural dossier. Medium amendments requiring a new safety rider are blocked instead of inheriting the old one. No retrospective sample safety evidence is invented. Other contractual, engineering and venue approval gates are preserved.

Validation: npm run build with 122 guard tests passed. Existing large bundle warning remains. Browser tests use isolated fictional session dossiers and verify file validation and reader routing, not production authenticated authorization.

Limits: session-only files and role/venue selectors are not security boundaries. No hosted permissions or supervisor/curator accounts were changed. The earlier authenticated Stage 6 blueprint escrow remains separate. A production implementation must persist the Stage 4 dossier/rider and map trusted staff assignments before real-world use. There is no approved-rider amendment upload flow yet; changes requiring new evidence remain blocked.

Desktop and mobile reader-routing tests passed after correcting a test selector: invalid PDF rejected, valid file appears at Technical and its assigned venue, and is absent at another venue. Technical matrix approvals are also blocked when a required rider is missing.
