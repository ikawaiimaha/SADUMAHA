# Artist intake demonstration — 19 September 2026

## Scope and walkthrough

Use **Join Institutional Roster / انضم إلى سجل الفنانين** in the global navigation. `/join` and `/artist/register` open the standalone Tier 1 form directly, including on reload. `/roster` opens the fictional staff demonstration: name a programme in English and Arabic, select existing profiles, and create a session-only programme draft linked to their IDs. Three pre-registered profiles have an explicit **Verified · simulated** label. A submitted registration appears as **Awaiting review**; it is not automatically verified or selected.

Registration separates sample legal names from bilingual catalogue names, contact and representation information. Optional institutional CV and general portfolio PDF dropzones belong to the profile. Registration does not require a programme concept, budget or application. Subsequent programme proposals reuse the same in-session profile.

Open the presentation's last chapter and choose **Artist intake**, or use the connected workspace role bar, for the separate Tier 2 proposal workflow. The existing leadership sequence remains unchanged.

1. Load the clearly labelled sample text or enter fictional profile details.
2. Move between Profile, Representation, Programme proposal, and Review and submit. Drafts can remain incomplete.
3. Switch between Material and Memory and Shared Stories Workshop. They share a profile but keep separate concepts, requirements, files and budgets.
4. Optionally enable device backup. Reload, choose Artist intake, and explicitly restore the saved text. Re-enter sample legal names and contacts and reselect files.
5. Review and submit a sample proposal. Open coordinator review, expand its dossier, and either request a revision with a reason or record a completeness check.
6. A revision produces a new submission version. Earlier versions and their feedback remain in the session.

## Data and responsibility boundaries

- One sample profile ID, separate programme IDs, and copied submission snapshots. Each submission excludes the other programme's draft.
- Names preserve punctuation and mixed scripts. Arabic and English fields retain their own direction in both interface languages. Translation support permits one language pending editorial follow-up.
- No passport, identity scan, banking data, real nationality record or signature is collected. Representation is contact information, not proof of delegated authority.
- The coordinator checks completeness. Selection, publication, technical acceptance, spending and signing require their own institutional authority; they are not inferred from this action or a job title.
- No intake action is assigned to Mr. Al Qaseer or automatically routed for the Chairman's signature.
- No actual application is transmitted. A receipt is a browser-session demonstration, not institutional registration or approval.

## Draft recovery and its limits

React Hook Form owns the form. A persistent backup provider subscribes separately from the form, so navigation between the story, registration and workspaces does not restart the save engine or clear the in-memory draft. The `useIntakeDraftBackup` hook requests a local save immediately after observed changes. `useDebounce` stabilizes its status announcement after 350 ms; storage is not held until that delay. A best-effort save also runs when the page becomes hidden. Backup remains opt-in; this is not a zero-data-loss guarantee.

The versioned localStorage envelope contains only allowlisted profile/proposal text. Legal names, email, phone, representative contacts, files, review outcomes and receipts are excluded. Older draft envelopes are migrated with empty legal-name fields, preserving earlier catalogue names and proposal text. Names, biography and free text are still potentially personal information: use sample data only. Storage is not encrypted or authenticated and is local to this browser origin and device.

Web Locks serialize cooperating tabs. Revision comparison rejects stale writes; a storage event pauses saving when another tab changes the draft. The user may export their current text before choosing to restore the saved version. Corrupt/incompatible records and storage failures do not replace the current in-memory form. Without Web Locks or usable storage, backup reports unavailable and offers text export. There is no server endpoint or false server-saved status.

File selection supports one optional PDF CV, one optional general portfolio PDF, and five optional PDF/JPEG/PNG files per proposal. Each is limited to 10 MB, with a 40 MB section limit. Basic format-header checks supplement the picker; they are not malware scanning. Files remain local object URLs and disappear on reload. Original names are retained; links and text are alternatives. These are demonstration limits, not SDC policy.

## Source reconciliation

The existing source-authority and responsibility registers were revisited, followed by a targeted refresh of these originals on 19 September 2026:

| Source | Edition / date | What it supports | What it does not establish |
| --- | --- | --- | --- |
| [SCB2026_Deliverables_library.csv](https://drive.google.com/file/d/1LGqkDSrZPujLabOJsRsehhT8YUk0vvwj/view), ID 1LGqkDSrZPujLabOJsRsehhT8YUk0vvwj | SCB 2026 template; modified 27 January 2026; source rows undated | Bilingual editorial outputs, images, rights references, technical requirements and installation documentation as distinct deliverables | Mandatory intake fields, approved upload limits, selection rubric or authority. Placeholder owner/status values are not delegations. |
| [Technical Requirements From.docx](https://docs.google.com/document/d/155k3SGvlv_9ycW8z1OCCIAE8yUZXoYvA/edit), ID 155k3SGvlv_9ycW8z1OCCIAE8yUZXoYvA | 24th Islamic Art Festival form; modified 1 July 2021 | Separate artist/contact, exhibition/location/coordinator, item description, quantity and notes fields | Current institutional policy, an approval workflow, or permission to expose personal data. Older form purpose and edition remain relevant limits. |

The standalone three-step registration, seeded roster, programme-selection links, two-tier roster/proposal model, four-step proposal interface, translation-support option, sample budget ceilings and coordinator queue are **design inferences / proposed demonstration behavior**. Neither source establishes a live intake mandate or confirmed institutional delegation. The source templates were not altered, and private source records were not copied into the public demonstration.

Pasted recommendations were selectively adopted. This version does not assert that strict script rejection verifies names, that 72 DPI controls web image quality, that every artist must supply identity documents at registration, that a fixed 40/30/30 rubric is mandated, or that a UI confirmation creates a digital signature. Production work remains paused.

## Verification

`npm run test:demo` covers shared state and the intake model/storage failure cases. `npm run build` runs TypeScript checking and the Vite production build. Browser verification covers draft recovery, programme separation, submission/revision/completeness review, bilingual layout and responsive presentation. Detailed release results accompany the delivered source ZIP.

### Roster source refresh — 19 September 2026

The S10/S11 entries in the source register were revisited. The original 24th Islamic Art Festival technical form above was fetched again for its limited artist/contact vocabulary. The [preferred-name research PDF](https://drive.google.com/file/d/1yiSwGAvjW4NRQRhtV7EXBbEio6bVnJ8n/view), modified 25 February 2026, was refreshed as an attributed research pointer only: it distinguishes observed name variants from unconfirmed artist preference. Its linked primary sources were not independently authenticated here, so it establishes no legal-name verification or intake mandate. No names or private source records from that research populate the fictional seeds.

The owner's explicit request supplies the design scope for separate legal/catalogue fields, roster registration and seeded profiles. Required sample fields, PDF limits, local recovery exclusions and simulated verification are demonstration choices, not asserted SDC rules.
