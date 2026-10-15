# Pilot slice: artist dossier and document collection

Status: proposed, 2026-10-15. This is the one workflow SADU will make work end to end with real
people before anything else is extended. Everything not listed here is paused (see "Not in this
slice").

## The problem it solves

Coordinators collect each artist's CV, portfolio, mockups, passport and bank form by email,
WhatsApp and WeTransfer, then copy them into folders and spreadsheets. Links expire, files arrive
in pieces, nobody can see what is still missing, and passports travel through personal inboxes.

## What "working" means

1. A Coordinator creates a dossier and invites the artist.
2. The artist signs in once and uploads every required document in one place.
3. The Coordinator, the artist and (later) PR and Finance all see the same checklist of what is
   present and what is missing.
4. When the checklist is complete, the Coordinator submits the dossier to the Committee and it
   locks. Changes after that need a new version, never an overwrite.

## Two stages (collect sensitive data only when needed)

| Stage | When | Documents | Who reads them |
|---|---|---|---|
| 1. Nomination | Before Committee review | CV, portfolio, mockups (commissioned works only) | Coordinator, Committee, Director |
| 2. Engagement | Only after the Director approves | Passport, bank form | Passport: PR only. Bank form: Finance only |

Artists who are not selected never send a passport or bank details. This keeps personal data to
the minimum (UAE PDPL) and matches the existing rule that Finance never sees passports.

**Hosting rule:** the current Supabase project is in ap-southeast-2 (Sydney). Stage 2 stays
switched off there. Real passports and bank forms go in only after the Sharjah Digital Department
approves where the data is hosted. Stage 1 uses real CVs and portfolios, but only from artists who
have confirmed, inside SADU before their first upload, that they consent to their files being
stored outside the UAE for this pilot. The confirmation is recorded with its date.

## Screens

**Coordinator (in /pilot)**
- *My dossiers*: one row per artist with a completeness bar (e.g. "2 of 3") and status.
- *New dossier*: name (Arabic and English), nationality, category, medium, commissioned yes/no.
- *Dossier page*: the checklist, an "Invite artist" action, each file with who uploaded it and
  when, and "Submit to Committee" (enabled only when the checklist is complete).

**Artist (in /pilot)**
- *Your dossier*: the checklist with one upload per item, the deadline, and a plain message for
  anything rejected or missing. Nothing else from SADU is visible to the artist.

**PR and Finance (stage 2 only)**
- PR: passports waiting for inspection. Finance: bank forms for approved artists. Read-only
  checklists otherwise.

## Export to the shared folder

Colleagues who are not in the pilot keep working from the department's shared folder, so every
dossier can be exported there without slowing anyone down.

- **"Export to shared folder"** on the dossier page (and "Export all" on *My dossiers*). In Edge or
  Chrome the Coordinator picks the shared folder once and SADU writes the files straight into it;
  other browsers download a ZIP with the same layout.
- **Layout**, one folder per artist:
  `SADU export/<Artist name (English)> - <dossier id>/`
  containing `CV - <name>.pdf`, `Portfolio - <name>.pdf`, `Mockup 1 - <name>.<ext>` …, and
  `Dossier summary.csv` (Arabic and English fields, status, who uploaded each file and when;
  saved as UTF-8 with BOM so Excel shows Arabic correctly). "Export all" also writes
  `SADU export/Artists.csv`, one row per dossier.
- **One-way copy.** Every export includes `READ ME - exported from SADU <date>.txt` saying the
  copy is not updated automatically and changes made in the folder do not reach SADU. Exporting
  again writes a new dated copy; it never edits files in place.
- **Stage 2 documents are never exported.** Passports and bank forms stay in SADU, so personal
  data does not spread through the shared folder.
- Each export is recorded (who, when, which dossiers).

Committee and Director screens are not part of this slice; the slice ends at "submitted to
Committee". The Committee minute and Director decision rules already exist in the database.

## What already exists (verified 2026-10-15)

- **`artist_dossiers`**: full dossier table with the `artist_status` state machine. The trigger
  `sadu_guard_committee_gate` already enforces: only a Coordinator creates a dossier; submission to
  the Committee requires name, Arabic name, nationality, medium, category, CV and portfolio (plus
  mockups when commissioned); Committee and Director can change only status and minutes.
- **Storage**: private buckets `artist-dossiers` and `logistics-secure`, append-only (no update or
  delete policies). `sadu_documents` registers upload slots by kind (CV, MOCKUP, PASSPORT, …) with
  role-scoped reads: PR sees passports only, Finance never does.
- **Roles**: `sadu_user_roles` includes ARTIST; the role reaches the browser through the access
  token, and `/pilot` routes panels per role (`src/lib/sessionRole.ts`).
- **Large uploads**: resumable uploads (`src/lib/resumableMedia.ts`) already work from `/pilot`.
- **Validators**: `src/data/prFileValidation.ts`, `identityAssets.ts` (file type and header checks).

## What must be built

1. **Link a dossier to its artist**: add `artist_user_id` to `artist_dossiers`; RLS lets the artist
   read only their own dossier and its slots.
2. **Register slots from the app**: a role-checked `SECURITY DEFINER` function the Coordinator
   calls to create the required slots for a dossier (today only trusted server code can write
   `sadu_documents`, and nothing does).
3. **Artist uploads for stage 1**: storage policy letting the artist upload CV, PORTFOLIO and
   MOCKUP into their own registered slots while the dossier is `INCOMPLETE_DOSSIER`. Add the
   PORTFOLIO and BANK_FORM kinds.
4. **Fill the dossier from uploads**: set `cv_url`, `portfolio_url`, `mockups_url` from the
   registered files so the existing submission gate works unchanged.
5. **Coordinator and artist screens** in `/pilot` (above), replacing the session-only
   `ArtistNominationForm` for this flow.
6. **Inviting artists (pilot)**: an administrator creates the artist's account with Supabase
   "Invite user" (sends a sign-in email) and adds the ARTIST role row. Automating this is a later
   step; the file-backed invitation flow in `server/pilot-invitations.mjs` is the reference design.
6a. **Consent**: a dated consent confirmation per artist, required before the artist's first
   upload (enforced in the database, not only on screen).
6b. **Export**: the shared-folder export above, built in the browser (File System Access API with
   a ZIP fallback); no server needed.
7. **Stage 2** (behind a switch, off on the Sydney project): passport and bank-form slots after
   `DIRECTOR_APPROVED`, with the PR and Finance views.
8. **Tests**: SQL tests for every new policy (artist sees only their dossier; cannot upload after
   submission; Finance cannot read passports), and one browser test for the full stage 1 path.

## Running the pilot

- **People**: 2 coordinators (the builder and one volunteer) and 3 to 5 consenting artists, for
  4 weeks.
- **Before starting**, record for each coordinator: hours per week spent chasing documents, and
  messages (email/WhatsApp) per dossier.
- **Measure during the pilot**: days from invitation to complete dossier; messages per dossier;
  re-uploads; documents that went missing; a 5-question survey per coordinator and artist.
- **Success**: complete dossiers with no documents sent outside SADU, fewer messages per dossier
  than the baseline, and both coordinators willing to use it for the next nomination round.

## Not in this slice

Committee and Director screens, contracts and e-signature, travel and visas, logistics and NFC
receiving, spatial planning, translation memory, publishing, portfolio dashboards, UAE PASS,
ERP and WhatsApp integrations, and presentation builds. They come back one at a time, each only
when a pilot user needs it.

## Decisions (2026-10-15)

- **Coordinators:** the builder of SADU (also a Coordinator) and one volunteer Coordinator.
- **Administrator:** the builder, who creates artist accounts and role rows during the pilot.
- **Data:** real CVs and portfolios, with each artist's recorded consent (see Hosting rule).
- **Shared folder:** dossiers are exported one-way to the shared folder (see Export).
- **Still open:** which 3 to 5 artists take part.
