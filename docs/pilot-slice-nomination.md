# Pilot slice: artist nomination case, Committee presentation and decision record

Status: proposed, 2026-10-15, for the next event, the Islamic Arts Festival. This is the one
workflow SADU will make work end to end with real people before anything else is extended.
Everything not listed here is paused (see "Not in this slice").

## How selection actually works

1. **Coordinator builds the case.** Before any artist is contacted, the Coordinator prepares a case
   for each proposed artist: who they are, why they fit this festival, and examples of their work.
2. **Committee and Director decide by email.** The Coordinator sends the cases to the Preparatory
   Committee as a presentation by email (Outlook). The Committee recommends and the Biennial
   Director, who sits on the Committee, confirms each nomination. The reply comes back by email.
3. **Coordinator records the decision.** The outcome is entered in SADU with the email as evidence.
4. **Invitation.** Only an approved artist is invited to submit a proposal.
5. **Proposal approved.** Then the artist submits works, prices, shipping details, labels, names,
   passports and visa information.

This slice covers steps 1 to 3 and produces the list for step 4. Steps 4 onward are later slices.

The Committee and Director do not use SADU in this slice. The project rule is unchanged (the
Committee recommends, the Director decides); only the place where their decision is written down
moves into SADU.

## The problem it solves

Cases are assembled by hand from emails, downloaded images, Word files and slides; every round
the presentation is rebuilt from scratch; decisions and their reasons live in email threads; and
there is no single list of who was proposed, why, and what was decided.

## What "working" means

1. The Coordinator creates a nomination case for the Islamic Arts Festival and completes it.
2. One click produces the Committee presentation (PPTX and PDF) for all submitted cases.
3. When the decision email arrives, the Coordinator records the outcome per artist, attaching the
   email. Submitted cases and recorded decisions cannot be edited.
4. Approved artists appear on an "Invite" list; the rest are kept with their reasons.
5. Cases, the presentation and the decision list export to the shared folder.

## The nomination case

| Field | Notes |
|---|---|
| Event | Islamic Arts Festival (one list per event and edition) |
| Artist name | Arabic and English |
| Nationality, base city | |
| Category | Emerging or Established |
| Medium / practice | |
| Biography | Short text in Arabic and/or English (used on the slide) |
| Rationale | Why this artist for this festival and its theme |
| Proposed participation | Existing work or new commission; indicative scale if known |
| Selected works | 3 to 8 images, each with title, year, medium, dimensions and source/credit |
| CV | Optional file, from public or artist-provided sources |
| Links | Website, gallery, press |
| Prepared by | The Coordinator, with date |

Required before a case can go into a presentation: name in both languages, nationality,
category, medium, biography, rationale, and at least 3 works with credit. SADU blocks submission
until these are present.

**Data:** professional, public-facing information only. No passports, contact or bank details at
this stage. Every image keeps its source and credit.

## Screens (all in /pilot, Coordinator role)

- **My cases** for the selected event: one row per artist with completeness and status (Draft,
  Ready, Sent to Committee, Approved, Declined, Returned for more information).
- **Case editor:** the fields above, works with image upload, and "Mark ready" (disabled until the
  case is complete). A ready case is locked; changing it creates a new version.
- **Committee presentation:** choose the ready cases and the language (Arabic or English), preview
  the slides, then download PPTX and/or PDF. Marking the batch "Sent to Committee" records the date.
  A "Copy email text" button gives a short covering message listing the artists, to paste into
  Outlook.
- **Record decision from email**, per artist: Committee recommendation (Recommended / Not
  recommended), Director confirmation (Approved / Declined / Returned for more information), the
  decision date, the email reference (sender, date, subject), the minute or reason, and the email
  itself saved as PDF or .msg. Declines and returns require a reason.
- **Invite list:** approved artists, ready for the invitation slice.

## The presentation

- **Slides:** title (event, round, date, prepared by); summary table of all proposed artists (name,
  nationality, category, medium, participation); for each artist a profile slide (photo or key
  work, biography, rationale, facts) and a works slide (3 to 6 images with captions and credits);
  closing slide listing the decisions requested.
- **Formats:** PPTX generated in the browser (editable in PowerPoint) and PDF from a print-ready
  view. Arabic slides are right-to-left with Arabic fonts; English slides left-to-right.
- **Style:** SADU's institutional palette and typography; no animation.

## Export to the shared folder

Colleagues who are not in the pilot keep working from the department's shared folder.

- **"Export"** on a case and **"Export all"** on the event list. In Edge or Chrome the Coordinator
  picks the shared folder once and SADU writes straight into it; other browsers download a ZIP with
  the same layout.
- **Layout:** `SADU export/<Event>/` containing the presentation files
  (`Committee presentation <date>.pptx` / `.pdf`), `Nominations.csv` (one row per case with status,
  recommendation, decision, date and reason), and one folder per artist
  (`<Artist name (English)> - <case id>/` with `CV`, `Work 1 - <title>` …, and `Case summary.csv`).
  CSV files are UTF-8 with BOM so Excel shows Arabic correctly.
- **One-way copy:** every export includes `READ ME - exported from SADU <date>.txt`. Exporting again
  writes a new dated copy; files are never edited in place, and edits in the folder do not reach
  SADU. Decision emails stay in SADU and are not copied.
- Each export is recorded (who, when, which cases).

## What already exists (verified 2026-10-15)

- **`artist_dossiers`** with the `artist_status` state machine. The trigger
  `sadu_guard_committee_gate` enforces that only a Coordinator creates a dossier, that core fields
  are present before the Committee step, that the Committee records a recommendation with a minute
  of at least 10 characters, and that the Director decides afterwards with a reason for a veto
  (`supabase/tests/committee-vetting.sql`).
- **Storage:** private, append-only bucket `artist-dossiers` with Coordinator upload rules while a
  dossier is in draft.
- **Roles** reach the browser through the access token, and `/pilot` routes panels per role.
- **Session-only prototypes** in `/workbench` (`ArtistNominationForm`, `PrepCommitteeWorkspace`,
  `DirectorWorkspace`) show intended screens but save nothing.

## What must be built

1. **Event on the dossier:** link each case to an event and edition.
2. **Case fields:** biography, rationale, proposed participation, base city, links; a `case works`
   table (title, year, medium, dimensions, source/credit, image).
3. **Completeness rule** in the existing trigger, matching "Required before a case can go into a
   presentation".
4. **Decision recorded from email:** extend the trigger so a Coordinator may record the Committee
   recommendation and the Director confirmation together, only with a decision date, an email
   reference and an attached evidence file; mark the record as recorded from email and by whom;
   make it immutable. The Committee and Director paths stay as they are for later use.
5. **Coordinator screens:** My cases, case editor, record decision, Invite list.
6. **Presentation:** slide preview, PPTX (`pptxgenjs`) and PDF (print view), Arabic and English.
7. **Export** to the shared folder (File System Access API with ZIP fallback) and its record.
8. **Tests:** SQL tests (incomplete case cannot be marked ready; ready case cannot be edited; a
   decision needs evidence; recorded decisions cannot change; only Coordinators record from email)
   and a browser test for create → ready → presentation → record decision → export.

## Running the pilot

- **People:** the builder (Coordinator and administrator) and one volunteer Coordinator.
- **Event:** the real nomination round for the Islamic Arts Festival.
- **Before starting**, record how cases are prepared today: hours per case, hours to build the
  presentation, and how decisions are tracked.
- **Measure:** hours per case; hours to produce the presentation; days from sending to decision;
  cases returned for missing information; a short survey for both Coordinators and, informally, the
  Committee's view of the presentation.
- **Success:** the round's presentation produced from SADU, every decision recorded with its email,
  the shared folder kept current by export alone, and both Coordinators choosing to use it for the
  next round.

## Not in this slice

Committee and Director accounts, artist accounts and uploads, invitations, proposals, contracts,
prices, shipping, labels, passports and visas, spatial planning, translation memory, publishing,
dashboards, UAE PASS, integrations and presentation builds of the wider system. The next slice is
the invitation and artist proposal.

## Decisions (2026-10-15)

- **Coordinators:** the builder of SADU and one volunteer Coordinator.
- **Administrator:** the builder.
- **Approval:** the Committee recommends and the Director confirms each nomination; the Director is
  a Committee member. Both reach the Coordinator by email and are recorded in SADU with evidence.
- **Committee use:** the Committee does not use SADU; it receives a PPTX/PDF presentation by email.
- **Data:** professional, public-facing information only at nomination stage.
- **Shared folder:** one-way export of cases, presentation and decision list.
- **Artists:** chosen through this process; no artist uses SADU in this slice.
