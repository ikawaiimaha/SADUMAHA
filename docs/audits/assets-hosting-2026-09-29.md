# Assets and hosting review

Changes: upload-bound metadata, catalog matching, Director scope receipts, pending-asset counts and local reminder queue; session accommodation exception decisions and venue equipment enquiries.

Audit: financial decisions remain separate from PR booking; duplicate decisions preserve history. Five nights applies only to the supplied October window. Equipment is explicitly unverified. Registry metadata is mandatory for new media, and catalog fields must match; partial uploads remain pending. Server time establishes the 48-hour deadline. Client accounts cannot run the privileged scheduler or forge a sent status.

Verification: TypeScript, production build and 131 guard tests; transactional local SQL tests for missing metadata, scope time permissions, early/due reminder behavior, deduplication and completion cancellation. Browser coverage exercises Coordinator → Director → Finance → PR in desktop/mobile.

Limits: hosted SQL installation and email sender are not configured. Expected count is a Director-reviewed bridge receipt rather than an automatic migration of historic Stage 5 data. Hotel exceptions and equipment enquiries are rehearsal-session records; no real budget, hotel or inventory changes occur. A verified equipment catalog was not supplied. Legacy files remain distinguishable from new bundles. Existing SQL fixture suites predating mandatory bundle metadata require upgraded fixture data when run against this extension.


Expanded scope: generated and applied the isolated private governance schema locally, with server validation middleware and four additional tests. SQL tests confirm RLS coverage, denied browser vault access and immutable sealed contracts. Middleware was separately type-checked. External integrations remain unconfigured; see server/governance/README.md. A browser test selector initially failed because option text was part of a label; corrected to the combobox accessible role, then both viewport runs passed.
