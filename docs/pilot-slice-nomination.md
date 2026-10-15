# Pilot slice: artist nomination case and Committee decision

Status: proposed, 2026-10-15, for the next event, the Islamic Arts Festival. This is the one
workflow SADU will make work end to end with real people before anything else is extended.
Everything not listed here is paused (see "Not in this slice").

## How selection actually works

1. **Coordinator builds the case.** Before any artist is contacted, the Coordinator prepares a case
   for each proposed artist: who they are, why they fit this festival, and examples of their work.
2. **Committee reviews.** The Preparatory Committee reviews the cases and records its outcome with
   a minute.
3. **Decision.** (See "Open question" for who gives the final approval.)
4. **Invitation.** Only an approved artist is invited to submit a proposal.
5. **Proposal approved.** Then, and only then, the artist submits works, prices, shipping details,
   labels, names, passports and visa information.

This slice covers steps 1 to 4. Steps 5 onward are later slices.

## The problem it solves

Cases are assembled from emails, downloaded images, Word files and slides. The Committee sees
them in different formats, decisions and their reasons live in meeting notes, and nobody has one
list of who was proposed, why, and what was decided.

## What "working" means

1. A Coordinator creates a nomination case for the Islamic Arts Festival and completes it.
2. The Committee sees every submitted case in one consistent format, including in a meeting.
3. The outcome and its minute are recorded against the case; nobody can change the case after it
   is submitted.
4. Approved artists appear on an "Invite" list; the rest are kept with their reasons.
5. Any case or the whole list exports to the shared folder for colleagues outside the pilot.

## The nomination case

| Field | Notes |
|---|---|
| Event | Islamic Arts Festival (one list per event and edition) |
| Artist name | Arabic and English |
| Nationality, base city | |
| Category | Emerging or Established |
| Medium / practice | |
| Rationale | Why this artist for this festival and its theme (Arabic and/or English) |
| Proposed participation | Existing work or new commission; indicative scale if known |
| Selected works | 3 to 8 images, each with title, year, medium, dimensions, and source/credit |
| CV or biography | File or text, from public or artist-provided sources |
| Links | Website, gallery, press |
| Prepared by | The Coordinator, with date |

Required before submission to the Committee: name in both languages, nationality, category,
medium, rationale, at least 3 works with credit, and CV or biography. SADU blocks submission
until these are present.

**Data:** a case uses professional information about the artist (public CV, published works).
No passports, contact or bank details are collected at this stage. Images keep their source and
credit so the Committee knows where each came from.

## Screens

**Coordinator (in /pilot)**
- *My cases* for the selected event: one row per artist, with completeness and status (Draft,
  Submitted, Recommended, Not recommended, Approved, Declined).
- *Case editor*: the fields above, works with image upload, a "Submit to Committee" button that
  stays disabled until the case is complete.

**Committee (in /pilot)**
- *Cases for review*: every submitted case for the event, in the same layout.
- *Meeting view*: one case per screen, large images, read-only, for presenting in the room.
- *Record outcome*: Recommended or Not recommended, with a required minute.

**Decision and invitation**
- The final decision (see Open question) is recorded with a reason if declined.
- Approved artists move to an *Invite* list. The invitation itself is the first step of the next
  slice.

## Export to the shared folder

Colleagues who are not in the pilot keep working from the department's shared folder.

- **"Export"** on a case and **"Export all"** on the event list. In Edge or Chrome the Coordinator
  picks the shared folder once and SADU writes straight into it; other browsers download a ZIP with
  the same layout.
- **Layout:** `SADU export/<Event>/<Artist name (English)> - <case id>/` with
  `Case - <name>.pdf` (a one-page-per-section case sheet suitable for the Committee),
  `CV - <name>.<ext>`, `Work 1 - <title>.<ext>` …, and `Case summary.csv`.
  "Export all" adds `SADU export/<Event>/Nominations.csv` with one row per case (status, outcome,
  minute, decision). CSV files are UTF-8 with BOM so Excel shows Arabic correctly.
- **One-way copy:** every export includes `READ ME - exported from SADU <date>.txt`. Exporting again
  writes a new dated copy; files in the folder are never edited in place, and edits there do not
  reach SADU.
- Each export is recorded (who, when, which cases).

## What already exists (verified 2026-10-15)

- **`artist_dossiers`** with the `artist_status` state machine. The trigger
  `sadu_guard_committee_gate` already enforces: only a Coordinator creates a dossier; submission to
  the Committee needs core fields plus CV and portfolio; the Committee records a recommendation and
  a minute of at least 10 characters (migration `20261014140000`); the Director decides afterwards,
  and a veto needs a reason. Tested in `supabase/tests/committee-vetting.sql`.
- **Storage:** private, append-only bucket `artist-dossiers` with Coordinator and Committee upload
  rules while a dossier is in draft.
- **Roles** reach the browser through the access token, and `/pilot` routes panels per role.
- **Session-only prototypes** in `/workbench` (`ArtistNominationForm`, `PrepCommitteeWorkspace`,
  `DirectorWorkspace`) show the intended screens but save nothing.

## What must be built

1. **Event on the dossier:** link each case to an event and edition (the Islamic Arts Festival).
2. **Case fields:** rationale, proposed participation, links, base city; a `case works` table
   (title, year, medium, dimensions, source/credit, image) and a CV or biography.
3. **Completeness rule** in the existing submission trigger: rationale, at least 3 credited works,
   CV or biography (replacing the current portfolio-URL check).
4. **Coordinator screens** in `/pilot`: *My cases* and the case editor, saving to the database.
5. **Committee screens** in `/pilot`: review list, meeting view, record outcome.
6. **Decision and Invite list** (after the open question is answered).
7. **Export** to the shared folder, built in the browser (File System Access API with a ZIP
   fallback), plus the export record.
8. **Tests:** SQL tests for each rule (cannot submit an incomplete case; nobody edits a submitted
   case; the Committee cannot change case content; the Coordinator cannot record outcomes), and
   one browser test for create → submit → outcome → export.

## Running the pilot

- **People:** the builder and one volunteer as Coordinators; Committee members as reviewers; the
  builder as administrator (creates accounts and roles).
- **Event:** the real nomination round for the Islamic Arts Festival.
- **Before starting**, record how cases are prepared today: hours per case, formats used, and how
  decisions are recorded.
- **Measure:** hours per case; time from submission to outcome; cases returned for missing
  information; whether the Committee used the meeting view; a short survey for each participant.
- **Success:** every case for the round prepared and decided in SADU, the shared folder kept up to
  date by export alone, and the Committee willing to use it for the next round.

## Not in this slice

Artist accounts and uploads, proposals, contracts, prices, shipping, labels, passports and visas,
spatial planning, translation memory, publishing, dashboards, UAE PASS, integrations and
presentation builds. They follow one at a time, starting with the invitation and proposal slice.

## Decisions (2026-10-15)

- **Coordinators:** the builder of SADU and one volunteer Coordinator.
- **Administrator:** the builder.
- **Data:** real artist information at nomination stage is professional and public-facing only.
- **Shared folder:** cases are exported one-way to the shared folder.
- **Artists:** chosen through this process; no artist uses SADU in this slice.

## Open question

**Who gives the final approval?** The project rule (AGENTS.md) is that the Committee records a
recommendation minute and the Biennial Director decides; SADU enforces this today. In the
nomination process described for the Islamic Arts Festival, the Committee approves the artist.
Either the Director still confirms each Committee outcome, or for nominations the Committee's
decision is final. The answer sets step 6 and may change the project rule.
