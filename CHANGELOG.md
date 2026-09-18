# Audit repair package — 19 September 2026

## Standalone institutional roster

- Added `/join` and `/artist/register`, global bilingual registration links, and SPA rewrites for direct navigation on Vercel.
- Added separate sample legal and catalogue names, progressive representation fields, and one PDF CV plus one PDF general portfolio.
- Kept the RHF drafting engine mounted across routes; immediate device backup requests and debounced status announcements preserve the existing recovery, conflict and storage-failure controls.
- Added three fictional pre-registered artist entities with simulated verification, pending-review registration snapshots, and `/roster` programme creation using existing artist IDs.
- Verified 31 automated tests, TypeScript/build, registration and programme creation, Arabic/mobile layout and direct-route reload/recovery.

## Artist profile, proposals and draft recovery

- Added a four-step bilingual artist intake linked from the presentation and connected role bar. Two fictional briefs share a sample profile while retaining separate proposals and budgets.
- Added optional device-only text backup with schema checks, revision conflicts, Web Locks, explicit restore, truthful status messages and text export. Contacts, file contents and submission receipts are excluded from backup.
- Added local PDF/JPEG/PNG previews, versioned submission snapshots, coordinator revision feedback and completeness checks. No artistic selection or real institutional registration is implied.
- Preserved the leadership hierarchy, oversight boundaries and presentation frame. Updated the final chapter's entry point and narrative.
- Refreshed two relevant original Drive templates and documented source limits in ARTIST_INTAKE_DEMO.md.
- Verified 26 automated tests, TypeScript/build, browser submit–revise–resubmit flow, recovery, cross-tab conflict, Arabic field directions and phone-width overflow.

## SDC Chairman brief and publishing demonstration

- Scoped the Chairman brief to SDC directorate readiness, seven monthly publication titles, and routed executive reviews. Unreported unit and issue status remains unknown.
- Added a separate fictional publishing case: coordinator attaches a prepared proof, publishing manager checks and routes its version, Chairman records a demo release or return, and publishing manager separately records sample print dispatch.
- Added version, role, evidence-check, and acknowledgement guards. A revised proof invalidates the current review and decision; prior events remain in session history. No digital signing or actual print dispatch is implied.
- Removed three unexplained ready-programme seeds. An exhibition delivery only clears its own sample risk, not an entire festival or directorate.
- Updated presentation chapters 2, 8, and 9 and added source reconciliation covering the official SDC structure, magazine catalogue, and refreshed Drive deliverables template.
- Verified 16 workflow tests and TypeScript/production build; checked the connected publishing flow in the browser.

## Cultural Affairs portfolio

- Broadened Directorate oversight into awards and criticism, forums/festivals/arts, and publishing. These are proposed portfolio groups, not a confirmed organisation chart.
- Added ten source-linked programme/output references and retained the fictional exhibition as the only connected delivery report. Unreported programmes do not count as on track; department magazines do not imply a direct reporting line.
- Added area filters, explicit reporting coverage, bilingual source labels, and the missing novel category for the Arab Creativity Award.
- Updated chapter 3 and source reconciliation. Manager-only operational actions and the stable presentation frame remain in place.
- Verified ten workflow tests, TypeScript/build, English/Arabic filtering, mobile overflow, and the manager-to-Directorate risk roll-up.

## Leadership portrait composition

- Unified the three leadership headings: name first, existing theme beneath. Al Qaseer's name is now the chapter heading in both languages; the extra icon is removed.
- Replaced the landscape contain treatment with individually positioned 4:5 presentation crops. SVG viewports reference the original JPEGs unchanged, retaining the existing illustrations rather than generating new faces or attire.
- Kept the opening portrait largest, followed by 92% and 84% height for the next two. Crop positions bring the eye levels close while retaining the full headwear.
- Removed the inner beige portrait box. A subtle border follows the portrait itself, with a plain caption below.
- Aligned desktop callout and caption rows. Reserved consistent heading space, balanced long title wrapping, and placed the portrait beside both heading and description to use the fixed frame more effectively.
- Verified the stacked phone layout and corrected its initial grid-row compression so images, captions, and text cannot overlap. The stable outer card and navigation remain unchanged.
- Supersedes the earlier full-image contain framing in the presentation. Original assets and Directorate dashboard composition are unchanged.

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
