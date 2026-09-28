# Heavy-media audit

Uploads use pinned tus-js-client 4.3.1 with 6 MiB chunks, automatic retries, progress, and explicit same-page Resume/Retry. Completed objects are verified against the original file size before counting toward submission. Account changes and unmount stop the transfer. Token refresh alone preserves it. Resume does not persist across browser closure.

The supported file limit is 2 GiB. Local bucket and SQL validation were upgraded with supabase/local/heavy-media-upgrade.sql. The existing local config was updated to 2GiB and the SADUMAHA stack restarted with data preservation. The running storage limit is 2147483648 bytes. Hosted settings remain unchanged. The existing untracked config is not included in this commit.

Verification: production build and 87 tests passed. The local HTTP integration test uploaded 54 MiB, recovered the offset using HEAD after reconnecting, resumed and verified stored size. Unique test fixtures were cleaned up. An actual 2 GiB transfer and browser interruption walkthrough were not performed.

No mail transport exists in SADU. The shared vaultNotification function prepares HTML/text envelopes with the institutional notice at both ends, escaped content and trusted-origin links. Auto-generated headers do not prevent recipients attaching files to replies. Inbound attachment rejection needs a mail-provider rule. This implementation does not claim live email enforcement.

Reference: https://supabase.com/docs/guides/storage/uploads/resumable-uploads
