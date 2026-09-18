# Audit repair package — 18 September 2026

## Stable presentation frame

- Replaced content-dependent slide heights and vertical centring with one viewport-sized frame across all nine chapters, including the demonstration notice, toolbar, and footer.
- Put opening-slide text beside the uncropped portrait, matching the structure of the other portrait chapters. Preserved leadership prominence through typography, portrait scale, and the opening accent.
- Anchored Previous, Autoplay, and Next below the card. Mobile content scrolls within the reading card; chapter changes reset its scroll position without moving navigation.
- Reserved image space before loading and removed chapter-entry motion. Kept captions below each portrait and made role-choice labels readable in the compact final slide.
- Supersedes the earlier full-width first-slide layout and variable-height navigation treatment described below. Directorate workspace layouts are unchanged.

## Leadership presentation hierarchy

- Made chapter 2 compact with text beside the uncropped portrait and its caption below the image. The layout mirrors in Arabic and stacks on mobile; chapter 1 is unchanged.
- Distinguished Al Owais as the second tier: full name as the chapter 2 heading, a medium-width uncropped portrait, and a dedicated dashboard row between the lead portrait and Al Qaseer. The first chapter retains the largest portrait, largest name heading, and exclusive top accent.
- Chapter navigation returns to the top so each name and portrait is introduced from the beginning when slide heights differ.
- Made H.H. Sheikh Dr. Sultan bin Muhammad Al Qasimi the opening chapter, with the largest heading and a full-width portrait that retains the complete source image.
- Added his full-width portrait card above the Chairman and Director cards in the active Directorate dashboard, in both languages.
- Preserved proposed-content labels. Presentation prominence does not grant system or institutional authority.

## Presentation media repair

- Restored three portrait chapters in the active `src/components/StoryMode.tsx`. Their earlier versions were only present in an inactive root-level file in the input ZIP.
- Reused the three images already committed under `public/`, with root-relative URLs. The live image URLs returned HTTP 200 before the fix; missing storage was not the cause.
- Updated navigation to accommodate nine chapters, added bilingual chapter labels and portrait alternative text, and allowed long names to wrap without overlapping the body.
- Marked the new slide copy as a proposed SADU experience, without attributing statements, approvals, or endorsements to the people shown.

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
