# SADU SOURCE OF TRUTH
- All state transitions must adhere strictly to established ThemeStatus and ArtistStatus enums.
- Arabic RTL parity is mandatory: NEVER use physical CSS (pl-, pr-, ml-, mr-, text-left, text-right). Exclusively use Tailwind logical properties (ps-, pe-, ms-, me-, text-start, text-end).
- Institutional role labels must use official Arabic terminology (رئيس الدائرة, مدير الملتقى, اللجنة التحضيرية, قسم التحرير, المنسقة, المالية).
- "Head of International Programs" (HIP) is permanently removed; master coordination belongs exclusively to General Exhibition Coordinator (Fatima Al Zarooni / Um Suhail).
- Decouple curatorial assessment from executive decisions: Committee outputs a recommendation minute, not a database approval.

This file states the rules that apply now. Dated history, rationale, source notes and verification notes are in `docs/ARCHITECTURE_CHANGELOG.md`; where changelog entries conflict, the later entry supersedes the earlier one. This file is a version-controlled architecture anchor and prototype specification, not a technically immutable or signed record, and not an institutional delegation instrument. Existing enums are in `src/types.ts`; additional workflow models must be mapped explicitly, not silently renamed.

## Roles and authority

- `GENERAL_COORDINATOR` = General Exhibition Coordinator / المنسقة (server `General_Exhibition_Coordinator`): master coordination, including the supervisory identity and regional delegation inside the Coordinator desk. Alone publishes curatorial boundaries (Stage 3), drafts the curatorial brief, sends deliverable reminders, verifies declared artwork text, locks exhibition titles, assigns collection/renewal owners.
- `COORDINATOR` = Exhibition Coordinator / منسق المعرض (server `Exhibition_Coordinator`): the assigned coordinator. Declares artwork text, submits dossiers for assigned artists only (`assignedCoordinatorId`), prepares terms, invitations, room claims and fabrication orders, authorizes reopening of submitted rosters. المنسق العام is no longer used.
- HIP is retired. The role key `HIP` is now `GENERAL_COORDINATOR`; HIP is not provisionable and cannot record new verifications or lock titles. Verifications recorded with `actor: 'HIP'` remain valid history. `HIP_BLOCKED` remains a stored dossier status; user-facing text calls it a compliance hold.
- Committee (اللجنة التحضيرية): drafts themes; records attributed recommendation minutes on curatorial proposals and Stage 4 nominations; never approves or rejects.
- Biennial Director (مدير الملتقى): endorses curatorial proposals (`CURATE_ENDORSE`, Director only), vetoes with an explicit institutional reason (feedback returns to the Coordinator), approves restriction changes before activation, records expected Stage 5 artwork count receipts.
- Chairman (رئيس الدائرة): moves themes from `PENDING_CHAIRMAN_APPROVAL` to `PENDING_EDITORIAL_POLISH`; cannot change text. Escalation dispositions are Chairman-only, idempotent, and never change specialist clearance or payment state.
- Editorial (قسم التحرير): polishes and publishes themes; alone records translations and revision-specific publication approvals. Both `EDITORIAL` and `EDITORIAL_DEPARTMENT` keys remain because existing policies use both.
- PR (التشريفات): passport/visa/itinerary evidence only; no imagery, technical or Finance permission follows from PR completion.
- Technical, Logistics, Finance (المالية), Artist, `VENUE_AUTHORITY`, `EXTERNAL_VENDOR`: as scoped in the stage rules below.
- Assigning responsibility grants no approval power. Local role selection, rehearsal selectors and demo accounts are not authenticated staff identities or institutional delegation.

## Runtimes and data stores

- Browser sandbox / rehearsal: session state in App memory survives role switches, not refresh (unless stated). The Curatorial workspace (`SpatialLedgerWorkspace.tsx`) applies the shared engine to a per-tab `sessionStorage` journal and does not call the server ledger; sandbox and connected pilot are separate stores. Artist master profiles use IndexedDB (same origin only). Presentation checkpoints are not authentication or server authorization.
- Focused fictional release: `RehearsalJourney` / `rehearsalJourney` model, session-only; built separately with `npm run build:rehearsal`, served with `npm run preview:rehearsal`, no pilot/workbench entry or integration imports.
- Connected pilot: single-process, transactional, file-backed JSON store (`state.json`; private drafts in `private-drafts.json`). Not a production database, identity system or backup guarantee. One process owns each repository; failed commands leave state byte-identical.
- Collection-only demo: fresh synthetic `.local/collection-demo-runs/run-*` repository, loopback only, allowlisted SAVE/CONFIRM/PLAN/ASSIGN commands, no credentials or env files loaded.
- Curatorial persistence path: `POST /api/review/spatial-ledger/command` → `service.mutate` (`server/spatial-ledger.mjs`) → `repository.transaction` → `applyLedger` → `applyCuration` (`src/lib/curatorialBoard.ts`). Actor comes from the signed-in session, never the request body.
- Not deployed: `server/curatorial-board-schema.sql` (`committee_recommendation`) is a reference design nothing loads; `sadu_governance` schema and `server/governance` middleware have no connected adapter, KMS, signature verification, SLA worker, CMS webhook or email delivery.
- Supabase: schema is applied and tested locally only. No hosted database was changed; hosted rollout is pending for every local script.

## Permissions and database

- `public.sadu_user_roles` is the only source of `institutional_role`. The access-token hook `public.sadu_custom_access_token` (enabled in `supabase/config.toml`) writes the role to the top-level and `app_metadata` claims and strips both for users without a row. A role written directly into `app_metadata` grants nothing.
- Rows are provisioned by trusted server code (service role) with a reason; browsers cannot read or write them. `VENUE_AUTHORITY` and `GENERAL_COORDINATOR` are provisionable; HIP is not.
- Spatial-pilot membership (`sadu_pilot_members`) is derived, never edited by hand: a trigger on `sadu_user_roles` enrols `COORDINATOR`, `BIENNIAL_DIRECTOR`, `GENERAL_COORDINATOR` and `TECHNICAL`, and removes other roles. Members still referenced by dossiers, claims or requests are kept with `active = false`; pilot policies admit active members only (`sadu_pilot_role()`).
- Nomination cases (`docs/pilot-slice-nomination.md`): a Coordinator owns each case (`artist_dossiers.created_by`) and edits it and its works (`sadu_case_works`) only as a draft; files live under `artist-dossiers/nominations/<case>/`. Submission needs both names, nationality, category, medium, biography, rationale, an event and at least 3 credited works. The Committee and Director decide by email; the case Coordinator records that decision in `sadu_nomination_decisions` (append-only, with the email stored as evidence), which applies the outcome: approved, declined, or returned to draft. A draft created by mistake is discarded (`discarded_at`), never deleted. The Committee presentation (PPTX via `pptxgenjs`, PDF via the print view) and the one-way shared-folder export (File System Access API, ZIP fallback; decision emails excluded) are built in the browser and logged in `sadu_export_log`.
- The browser reads the role from the access-token claims (`src/lib/sessionRole.ts`), never from `session.user.app_metadata`, which the hook does not change. This is for display only; RLS decides.
- Cross-user account checks (freight vendor/curator, Logistics officer/department head) read `sadu_user_roles`, not `auth.users` metadata. No name-based or first-user fallback for routing.
- Demo role selection never supplies database authority. RLS policies, security-invoker views and minimal role-checked helpers govern reads; submitted records and Storage objects are immutable; replacements never inherit approval.
- Themes: Committee drafts/revises `DRAFT`/`PROPOSED` and submits to the Chairman; no role deletes a theme; published themes are immutable; other authenticated roles read only published themes.
- `sadu_asset_escrow`: owning artist/coordinator, Logistics, Biennial Director and Technical only. PR, Editorial and General Exhibition Coordinator keep publication reads of submitted scenarios but no escrow data.
- Migrations rebuild the whole local schema from scratch (`supabase db reset`; CI does this on every PR):
  - `20261014090000` role table, token hook, theme policies, storage tightening;
  - `20261014100000` baseline of the schema previously hand-applied from `supabase/local/*.sql` and `migration.sql` (schema only);
  - `20261014110000` escrow view audience;
  - `20261014120000` HIP grants moved to `GENERAL_COORDINATOR`;
  - `20261014130000` configuration rows the baseline could not capture (guest deadline and document policies, draft visa notice template).
- Do not re-apply `supabase/local/*.sql` to a migrated database; they are authored history.
- Exception: `supabase/local/freight-changes.sql` (after `logistics-sla.sql`) is local-only, not in `supabase/migrations/`, because the freight tables it alters come from local scripts.

## Workflow gates by stage

### Themes (Stages 1–3)
- Chain (workbench, `src/hooks/useThemePipeline.ts`): Committee drafts three proposals (one at a time; Compare all three before Submit) → Biennial Director reviews, may append notes but not change proposal text, and presents to the Chairman or returns the batch → Chairman (`PENDING_CHAIRMAN_APPROVAL` → `PENDING_EDITORIAL_POLISH`) selects one proposal and ratifies a budget → Editorial locks the Arabic text, translates and alone publishes → General Exhibition Coordinator drafts Arabic guidelines, Editorial publishes them bilingually, and the General Exhibition Coordinator publishes the immutable `CURATORIAL_DIRECTIVES_PUBLISHED` boundaries.
- The Committee cannot replace a submitted batch. Only a Director return reopens it (text retained) and clears the Chairman's docket until a new batch is presented.
- Chairman ratification (session) requires the Chairman role, a complete presented batch, a matching proposal and a positive finite budget. The Chairman desk opens on Biennial Program Decisions when a ratification or escalation is waiting and shows the count on the tab.
- Editing the English translation withdraws the reviewer's confirmation; publishing needs it re-confirmed.
- Auto-forward (opt-in) moves the presenter to the next owner's desk 3.5 s after a handoff; a Director return cancels a pending move.
- Boundaries publish only after theme and bilingual guideline publication, category review and Director restriction sign-off. "No restrictions" is a valid explicit declaration. Coordinator dashboards, nomination entry and Committee scouting stay closed until publication.
- Restriction changes are proposed with a reason and activated only after Director approval. No nationality/medium quotas.

### Nominations, vetting and textual verification (Stages 4–5)
- Complete proposals enter `PENDING_COMMITTEE_REVIEW`; automated restriction matches enter `HIP_BLOCKED` (a hold, not a veto); release is a trusted compliance-service operation.
- Commissioned works require mockups; existing works require images and provenance; honored guests require identity only. Only solo proposals require 15–20 whole artworks. Tracks: `HONORED_GUEST`, `SOLO_EXHIBITION`, `GENERAL_COMPETITION`.
- Sculpture / 3D Installation requires a Technical & Safety Rider PDF (≤ 20 MiB) before submission, endorsement or Director eligibility; changing medium clears it.
- Declared text: the Coordinator declares exact original text and full translation; the General Exhibition Coordinator verifies against the immutable snapshot. Without matching verification the nomination cannot be recommended or decided by the Director. No text is inferred from identity, medium or nationality. Not a cryptographic signature.
- Stage 4 Committee minute (`reviewByCommittee` in `src/data/vetting.ts`; database: `committee_recommendation`, migration `20261014140000`): the Committee records `RECOMMENDED` or `NOT_RECOMMENDED` with a minute of 10–4000 characters, once. Both outcomes move the dossier to `PENDING_DIRECTOR_REVIEW`; the Biennial Director decides (approve, or veto with a reason). The Committee cannot recommend a dossier that fails compliance (incomplete, unverified text, restriction match), but may forward it unrecommended. The Committee can no longer set `COMMITTEE_REJECTED`; existing `COMMITTEE_REJECTED` dossiers and `ENDORSED`/`REJECTED` minutes are kept as recorded history and are not reopened.
- Committee recommendation minute: `CURATE_COMMITTEE_RECOMMEND` (Committee only), minute ≥ 10 characters, bound to the exact proposal revision and current locked Defense Board snapshot; changes no status, slot or artwork; duplicates refused; a new revision or re-lock makes it stale. `CURATE_ENDORSE` refuses unless every selected, not-yet-endorsed proposal has a current minute.
- Legacy: `CURATE_COMMITTEE_APPROVE` is accepted only by `restoreLedger` replay; live commands return 422. No minute is fabricated; Director endorsement stays disabled with a reason until a real minute exists.
- Emerging/Established ratio is informational and excludes vetoed dossiers.

### Contracts and payment tranches (Stages 6–8)
- Invitation: no contract exists until the Artist confirms full passport name; external venues need a clearance reference; theme and guidelines must be published (isolated rehearsal toggle, default off, bypasses only publication checks).
- Agreement acceptance routes to `LOGISTICS_PENDING_PR`, never `CONTRACT_EXECUTED`; removing a hold cannot assert execution. `CONTRACT_EXECUTED` additionally requires a submitted escrow receipt with all declared files. Acceptance is a simulation, not a legal or provider-verified signature.
- Amendments return through `CONTRACT_DISPUTED` / the Coordinator without repeated Stage 5 approval; accepted terms are not silently editable; term changes invalidate evidence.
- Advance: Finance alone authorizes; requires accepted agreement plus PR and Technical evidence, never physical arrival or final media delivery. Delivery requires Logistics `PHYSICAL_ASSET_RECEIVED`. Completion requires closure, safe-return and condition-reconciliation references.
- Payment schedule: the Coordinator chooses 30/70/0, 30/40/30 or 50/30/20 (`CoordinatorContractWorkspace`); every agreement keeps three milestone records (advance, delivery, completion). "30% advance / 70% post-delivery" sets completion to zero rather than merging milestones, so there is never a combined final 70% action.
- Authorization is not disbursement: no money moves; each tranche is recorded separately; zero-value milestones cannot be disbursed. Art Loan Fee never substitutes for the advance.
- Holds (`EXECUTIVE_IMPOUND`, damage, refusal, archive) block disbursement, closure, dispatch and contract mutation.
- Escalation intake and executive disposition never change specialist clearance, venue authorization, contract terms or payment gates.

### Logistics, freight and collection
- Collection readiness is a derived sub-workflow (`src/logistics/collectionRules.mjs`), not an ArtistStatus/ThemeStatus transition. Only the accepted active Logistics owner records, confirms or plans; the General Exhibition Coordinator assigns primary/backup owners with reason and due time; reassignment never inherits acceptance.
- Packing requires a plan, named owner, technical clearance or recorded non-applicability, separate Finance cost approval (including zero cost) and completion evidence. Changes clear dependent checks; legacy records stay blocked rather than receiving fabricated approvals.
- Amendments require a server-derived impact review; renewal tasks close only from the actual workflow change; no manual completion switch.
- Pickup calendar: latest pickup is the `CATALOG_SCHEDULE` delivery deadline, 10 September 2026; dates must be today or later (Asia/Dubai) and outside the inclusive blackout; after the cutoff intake is closed until an approved schedule update.
- Gallery intake requires packing type (`MUSEUM_CRATE`, `SOFT_PACK`, `NO_PACKAGING`), packing list, return address; `packing_ready_guard` refuses Ready for Shipping otherwise. Changes go only through `sadu_freight_changes`, approved independently by Logistics and Finance (different accounts).
- 48-elapsed-hour SLA; opening is not action. Physical arrival does not change condition, contract, Finance or publication status.
- Nothing books transport, records custody, notifies carriers or authorizes payment automatically.

### Guests and visa
- Only owners of accepted database contracts submit travel intake; finalization creates an immutable server-timestamped receipt; PR sees finalized packets only.
- Document deadline: arrival minus 30 days at 23:59:59 Asia/Dubai; passport valid six calendar months from arrival; National ID required for IQ, PK, AF (institutional configuration, server-snapshotted).
- PR alone records `REJECTED_BY_AUTHORITY`; it locks the agreement; notices hold as `TEMPLATE_APPROVAL_REQUIRED` until trusted template approval.
- Reminders are queued in-app notices, not sent emails. No booking, visa or financial clearance is inferred.

### Publication, catalog and editorial
- Public fields require Arabic and English; Editorial alone records translations bound to the immutable row; source values kept verbatim.
- The live catalog aggregator (`LiveCatalogAggregator`) belongs to Editorial; artists submit catalog metadata into it.
- Export requires the locked title, full Director-recorded artwork count, bilingual completion and explicit religious-title flags. PDFs are raster proofs, not print masters; hashes are not signatures.
- Approved snapshots change only through controlled versioning; amendments withdraw readiness; replacements require new approvals.
- Print defects hold progression; replacing a dispatched job requires recorded supplier stop or stock disposition.

### Condition and treatment
- Logistics records immutable condition reports only after `PHYSICAL_ASSET_RECEIVED`; damage locks movement, installation, tranches, closure and contract mutation.
- Conditional treatment (`server/pilot-treatment.mjs`, `s.treatments[artworkId]`) is a synthetic pilot case run by the General Exhibition Coordinator (the server admits only `General_Exhibition_Coordinator` to record the case and external permission): record → authorization (external permission `performedInSadu:false` or decision-maker approval `performedInSadu:true`; recorder cannot approve) → `ASSIGN_TASK` key `treatment-trial` with explicit acceptance → PNG/JPEG trial photo → artist decision on that exact photo/revision → completion. A new revision stales authorization, photo and approval; requirements and assignment survive. It changes no status, payment or shipment record and creates no institutional authority or consent.

## Bilingual and UI rules
- Arabic RTL parity everywhere, logical CSS only. Stored values and exports stay unchanged; translation happens at display time (`src/i18n/journey.ts` for the journey at `/`). Shared `sadu_lang` preference, default Arabic. The invitation PDF remains English.
- Avoid bidi-sensitive fractions in counts; unknown values display as unreported/unknown, never zero.

## Integrations
- All live integrations are paused. Nothing sends email, files claims, books transport/hotels/flights or moves money. `SDC_CMS_WEBHOOK_URL`/`SDC_CMS_WEBHOOK_TOKEN` stay empty; `Synced` means acknowledged delivery only.

## Verification and CI
- Local: `npm run lint` (type-check of `src`), `npm run test:guards`, `test:workflows`, `test:review`, `test:demo` (node suites); `npm run test:sql` (every `supabase/tests/*.sql`, needs `supabase start`); `npm run test:e2e` (Playwright desktop + mobile; unlocks the prelaunch gate with a per-run password through the real endpoint); `npm run test:committee:browser` and `npm run test:treatment:browser` (own builds and servers).
- CI (`.github/workflows/ci.yml`, pinned `ubuntu-24.04` and action versions) runs on pull requests and `main`: `check` (lint, node suites, build), `browser` (Playwright), `database` (fresh `supabase start` from migrations, SQL tests, security advisors).
- `scripts/find-dead-code.mjs` reports modules unreachable from every runtime root; keep it at 0.
- Committee minutes: `tests/committeeRecommendation.test.mjs`, `tests/curatorialBoard.test.ts`.

## Resolved conflicts — 2026-10-14
The changelog contained three conflicting entries. They were resolved by the source-of-truth rules above, or by what the code already does:
- Stage 4 Committee decision: the source-of-truth rule wins. The Committee records a recommendation minute and the Director decides; the earlier "Committee alone endorses or rejects nominations" gate is retired in the app and the database (see Nominations above).
- Payment schedules: both entries hold. Three presets are offered and every agreement keeps three milestone records; a 70% post-delivery preset zeroes completion instead of merging milestones (see Contracts above).
- Catalog aggregator: Editorial owns it, as the code already implements; the HIP reference predates the HIP retirement.
