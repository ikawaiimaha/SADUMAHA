# Recovery and dossier history

Draft text and upload identifiers are cached for 24 hours, scoped by project, authenticated artist and scenario. File bytes and identity documents are not cached by this feature. A submitted scenario stays read-only; conflicting or malformed drafts are ignored.

After restarting the browser, reopen the same contract and select the same file in the same zone/category. The saved destination and TUS fingerprint recover the transfer. Requests use the current session credential; storage and database permissions still apply. Expired upload URLs or cleared browser storage may require restarting.

The dossier timeline displays only existing timestamped evidence. Missing events are not inferred from status. Contract events in shared tracking are joined by artist ID. This is read-only rehearsal history, not an immutable production ledger or a log of every click.

Verification includes TypeScript, regression tests, production build and browser inspection. TUS tests use simulated transport. A live authenticated large-file interruption and restart test remains required before production certification.

Reference: https://supabase.com/docs/guides/storage/uploads/resumable-uploads
