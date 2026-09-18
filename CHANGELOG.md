# Audit repair package — 18 September 2026

## Included changes

- Initialized the selected sample programme to prevent blank-screen startup.
- Restored KPI labels, icons, and filter actions for existing callers.
- Applied the configured demo tab rules to shared navigation and role changes.
- Restricted TypeScript and the `@` alias to the active `src` tree; added React type declarations.
- Made browser preferences tolerant of unavailable local storage.
- Fixed quotation-template defaults and incompatible component props.
- Removed the 45-record PDF limit, wrapped long cells, and corrected UTC timestamps.
- Added browser print/PDF handling for Arabic and mixed-script reports.
- Corrected report, bank-display, and contract-preview claims; clearly marked demonstrations.
- Enforced the example Finance gate's own stated registered-supplier prerequisite, without claiming it is verified law.
- Fixed long Arabic status labels overflowing the tested mobile screen.
- Bound development to localhost and made builds run TypeScript checking first.

## Verification

The audited source passed TypeScript checking, the Vite production build, and 94 browser assertions in Edge/Chromium against both development and production preview. The tests covered all 11 selectable roles and selected navigation, storage, RFQ, Finance, report, and RTL paths.

A 60-record vector PDF retained all 60 records across 3 pages. A 60-row Arabic print test retained all row identifiers across 6 pages. One 390 px Arabic logistics screen was visually checked.

The GitHub packaging step checks source/asset identity against the audited copy and repeats a clean npm install and production build from this standalone folder. The standalone packaged build also passed all 94 browser assertions. Vite's large-chunk warning remains.

## Not included

The shared exhibition/custody model discussed after the audit is a proposal. No shared-state architecture, comprehensive programme filtering, backend migration, authentication, database, or live integration has been added in this package.
