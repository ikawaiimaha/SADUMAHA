# Materials gate and receiving audit

Implemented bilingual exhibition-title intake and HIP title lock in authenticated scenario workflows. CSV/PDF materials exports require the lock and existing complete bilingual approval evidence. This is publication authority, not artist nomination veto.

Implemented immutable Logistics arrival receipts with facility, actor, server time and all-crates confirmation. The in-app shared feed uses Realtime plus refresh fallback. Arrival does not alter condition clearance or financial milestones. Technical reads minimal receipt data without freight addresses. Auth changes invalidate pending UI results.

Verification:
- Production build and 134 guard checks passed; final TypeScript check passed.
- Four desktop/mobile browser cases passed: title completeness, receiving confirmation, successful PDF/manifest export, blocked unapproved-title export and failed private image fetch.
- Local transactional SQL test passed: artist cannot lock; HIP can; text immutable; undispatched receipt denied; Logistics receipt accepted; duplicate and deletion denied; Technical can read receipt but not freight address or record arrival; other artists cannot read it.
- Mobile RTL screenshot inspected; no horizontal overflow. Browser harness bootstrap overlay was removed by dispatching its readiness event.

Boundaries: migration applied locally only. No operating-system push/email delivery. Title revisions and receipt corrections need a future controlled correction path; no overwrite is granted. Historical titles are not implicitly approved. Existing large-bundle warning remains.
