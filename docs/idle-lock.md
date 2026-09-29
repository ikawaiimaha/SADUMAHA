# Idle workspace lock

Keyboard, pointer, touch and wheel activity reset the timer until locked. A warning appears after nine minutes and locking occurs after ten minutes. Visibility/focus checks use elapsed wall-clock time so suspended tabs cannot silently reset inactivity. The last activity time is retained in session storage; only an in-memory fallback is available if browser storage is denied.

The lock hides and makes the workspace inert without unmounting it. Drafts and upload tasks remain mounted. Escape does not dismiss the lock. Rehearsal mode explicitly offers a privacy-only resume action. The authenticated password pilot requires a successful same-account password sign-in. Passwords are cleared after the attempt and are not persisted by this component. Same-user authentication events no longer reset the media workspace.

This is a client-side unattended-screen control, not server-side session revocation or protection from developer tools. Database authorization still requires RLS. Production timeout and MFA policies need separate backend enforcement.

Verification: exact warning/lock boundaries and suspended-clock tests; browser rehearsal lock, Escape resistance and preserved draft; TypeScript and production build. Live password verification and a real active-upload cycle remain unverified without an authenticated test account.
