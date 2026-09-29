# 29 September 2026 — Dossier-to-venue technical matrix

Stage 4 dossiers can record a structured technicalRequirements array (hardware, specifications, mounting). Declared entries require complete specifications; Committee and Director read the same data during review. The assigned Coordinator's Stage 6 room claim registers exact-scope venue clearance tickets from those requirements. Claiming a room is not approval. The designated Venue Host records clearance using the existing rehearsal authority/delegation gate.

Stage 7 Technical reads a Greenlighted Technical Matrix from the same dossier, claim and approval records. CLEARED_BY_CURATOR appears only after venue approval for that precise scope, with authority and timestamp. No repeat request is needed for unchanged requirements. Specification, mounting, room-allocation or approved-scope revision changes require their own clearance. Pending amendments, damage and executive holds prevent a green state. Equipment inventory, technical evidence, and Finance approvals remain separate.

This does not establish named officials' delegation, ingest undocumented conversations, or create production authorization. All claims and approvals remain session-only rehearsal records. No permission is inferred from artwork approval alone.

# 29 September 2026 — Role-based arrival dispatch rehearsal

Director approval records GUEST_ARTIST or JURY_MEMBER as a recipient designation; this is separate from artist category and workflow status. Coordinators cannot edit that designation or the generated arrival text. Existing fictional commission seed is explicitly GUEST_ARTIST; unknown designations fail closed.

PR owns itinerary and identity review. Assigned Coordinators can record a simulated arrival dispatch only for approved dossiers after theme and guideline publication and completed PR package checks. DXB maps only to Marhaba, SHJ only to Hala; other airports require manual review. Identity review binds to the exact recipient name. Itinerary edits invalidate itinerary review. Receipts preserve recipient, designation, approved revision, itinerary, provider and attachment-manifest snapshots; repeats are idempotent and old snapshots remain historical.

Only JURY_MEMBER manifests include JUDGING_MECHANISM_PDF. This is a rehearsal descriptor, not an actual confidential attachment, public URL, or production access-control implementation. The approved PDF and live mail transport are not supplied. No email is sent, booking promised, or PR/Finance evidence cleared. A production sender must recheck authenticated assignment and recipient designation server-side and retrieve the approved private document; the client tag is never authorization.

# 29 September 2026 — Database Committee decision gate

`migration.sql` is a manual deployment script, tested locally only. It creates/extends artist_status while retaining the inspected legacy TEXT status column, replaces dossier mutation policies, and enforces Coordinator submission → Committee decision → Director decision. Rejections require consensus minutes, and the server records reviewer/time. HIP has no dossier write/delete policy; an invoker trigger also rejects HIP mutations if a broad policy is introduced. Existing rows are not reclassified and historic approvals are not fabricated.

Automated restriction matches now enter HIP_BLOCKED in the session workflow. Clean dossiers enter PENDING_COMMITTEE_REVIEW. HIP_BLOCKED is a hold, not a manual HIP veto or mandatory intermediate state for clean dossiers. Database hold release remains a trusted compliance-service operation; no database blocklist engine or frontend persistence is introduced by this migration.

---
# 28 September 2026 — Stage 6 configuration and secure intake

Director-approved candidates and disputed agreements have separate Coordinator queues. Dispatch puts the artist in CONTRACT_PENDING_SIGNATURE while the invitation record separately retains the identity-confirmation prerequisite. The legal name remains required before generating the localized, watermarked rehearsal PDF. Amendments preserve Director approval, name and history and return through CONTRACT_DISPUTED; accepted terms are not silently editable.

Shipping presets and 30/70, 30/40/30 and 50/30/20 schedules are available. Zero-value milestones cannot be disbursed. The accepted Artist view reveals private passport/imagery intake using owned, accepted database contracts and Supabase RLS. Rehearsal acceptance does not create or authorize a database agreement. Local schema: supabase/local/contract-intake.sql. No hosted deployment, email dispatch or legally binding signature is implemented. See docs/audits/stage6-contract-intake-2026-09-28.md.

---
# 28 September 2026 — Stage 3 master-boundaries gate

HIP publishes an immutable CURATORIAL_DIRECTIVES_PUBLISHED snapshot only after theme and bilingual guideline publication, review of medium/style/nationality categories and resolution of Director restriction sign-off. No restrictions is a valid explicit category declaration. Coordinator dashboards and nomination entry remain closed until publication. Committee scouting submissions also require publication. Coordinators see the exact active snapshot; Committee retains nomination decision authority. This gate is session-only and does not claim backend authorization.

---
# 28 September 2026 — Heavy-media transfer upgrade

Scenario uploads now support 2 GiB through TUS with 6 MiB chunks, progress, automatic retries and same-page resume. Storage size verification precedes final-deliverables eligibility. Local limits and SQL validation are upgraded; remote deployment remains separate. The shared vault-only email envelope is prepared for future transport integration. No live mail sender or inbound attachment rejection exists. See docs/audits/heavy-media-2026-09-28.md.

---
# 28 September 2026 — Authenticated exhibition scenarios

The Artist declares spatial zones and print/video requirements against an accepted, owned database contract. The artwork_checklist JSON is submitted only when private logistics-secure objects exist for every declared zone/category. Submitted records are immutable. Assigned Coordinators and Logistics read structured checklists under RLS. Demo role selection never supplies database authority. Local SQL and rollback tests are retained under supabase/local/exhibition-scenarios.sql and supabase/tests/exhibition-scenarios.sql; no hosted migration was applied. The 50 MB/file pilot limit, authentication requirement and incomplete HTTP upload verification are documented in the audit.

---
# 28 September 2026 — Committee nomination authority (executive correction)

This correction supersedes earlier HIP nomination/cultural clearance gates. HIP is limited to Stage 3 guidelines and confidential dynamic restriction proposals; activation still requires Director sign-off. Complete Coordinator proposals and Committee scouting submissions enter PENDING_COMMITTEE_REVIEW automatically. The Committee records collective endorsement to PENDING_DIRECTOR_REVIEW or COMMITTEE_REJECTED with mandatory rejection minutes. Recorded decisions are immutable within the session, and assigned Coordinators can read the outcome and minutes.

Automated compliance remains separate from curatorial judgment. Pending dossiers display a current active-rule match badge without exposing confidential parameters. Matches block Committee endorsement; the Director rechecks active restrictions at approval. No nationality/medium quotas or new automatic restrictions are introduced. Portfolio links allow HTTP(S) only; uploaded portfolio images are retained as local session Files for actual inspection rather than filename-only placeholders.

HIP's downstream nomination, catalog, spatial and dispatch modules are removed from its screen. The existing catalog aggregator is available in Editorial, and simulated dossier dispatch is assigned-Coordinator-only. Historical records are retained; session UI decisions are not authenticated multi-member voting or database authorization.

---
# 28 September 2026 — Invitation and legal identity rehearsal

The assigned Coordinator prepares validated terms, then records INVITATION_DISPATCHED. No contract exists until the Artist confirms their full passport name. Original committee spelling, confirmed name and timestamps remain in shared session state. A full-name field supports international names without guessing first/family-name boundaries. Confirmation locks the name, creates the agreement from the frozen terms and generates a watermarked, non-binding PDF summary. Published theme/guidelines remain required unless the explicit isolated rehearsal toggle is enabled. Existing amendments retain the confirmed name and return through the Coordinator.

Dispatch is a simulated notification with an Open Artist Portal Preview action, not an emailed encrypted link or authenticated identity check. Records survive desk changes, not refresh. No production database persistence, authentication, external dispatch or legal signature is implemented by this feature.

---
# 28 September 2026 — Editorial identity-asset lifecycle

The Arabic text lock enables the identity-asset log. Theme text publication no longer freezes asset intake: late design files and replacement versions can be recorded without editing the published bilingual statement. Approved versions remain read-only historical records. Replacement versions require their own inspection confirmation and separate Editorial session approval; later approval supersedes earlier versions without deleting them. Draft removal is reversible.

The log validates filename extension/MIME, nonempty files and a 10 MB per-file limit, with a maximum of 20 stored versions (including history and removed drafts). SHA-256 content digests reject duplicate files even when renamed. Image previews use object URLs in image elements; PDFs have a sandboxed preview and an inspection download fallback. This is local UI validation, not a production malware-scanning or file-storage service.

Records, files and approval timestamps survive desk changes through shared session memory and are explicitly lost on refresh. Sample filenames remain in a separate collapsed examples section with no fictitious verification badges. Before Chairman ratification, Editorial shows a waiting state instead of sample approved prose.

---
# 28 September 2026 — Executive summaries and operational evidence

The Director can open an automatically generated agreement summary from the shared Stage 4 dossier and any recorded Stage 6 terms. Missing financial terms remain unreported; opening the summary does not sign or approve an agreement.

The existing Kufic Horizon Logistics rehearsal now records CRATE or PLASTIC_CYLINDER packaging, carrier/inspection reference and up to ten local JPEG/PNG/WebP unboxing images (10 MB each). The record survives desk switching in App memory; images are not uploaded to a server, and do not automatically certify receipt or condition. Saved evidence is read-only for the session.

Technical records an external supplier delivery against an approved, assigned dossier, requiring a Central Finance Vendor ID, invoice reference, delivered-work description and evidence reference. Only the assigned Coordinator can sign off. Finance sees only signed-off entries and can record receipt once. Neither this receipt nor supplier sign-off releases artist payments or clears technical evidence. IDs/references are unverified session entries, not integrations with Central Finance.

Existing executive mandate panels, pending-budget Chairman labels, global HIP submission timestamp, separate Editorial sample/live logs and role-change nested/window scroll reset remain in place.

---
# 28 September 2026 — Shared dossier and dispatch ledger

App owns one session dossier list across nomination, Coordinator vetting submission, Director decisions and HIP dispatch tracking. Coordinator queues use assignedCoordinatorId; the source guest roster remains separate from approved dossiers. Approval no longer creates placeholder financial contracts.

Approved nationality, medium, scope and artwork count remain unchanged while a Coordinator amendment awaits Director review. Approval rechecks compliance, increments the revision and retains before/after history. Active agreements block scope approval through this ledger. HIP records simulated dispatch only after theme and bilingual guideline publication, with an immutable scope snapshot per revision. Contract dispatch checks the approved count and pending amendments and preserves approval history.

These are session records that survive role changes, not refresh or cross-user database synchronization. No external dispatch, authentication or database integration is implied.

---
# 28 September 2026 — Chairman audit remediation

Chairman selection and budget drafts now use session storage keyed by event and docket revision; returning to a desk retains the draft, while a newly forwarded docket starts fresh. Ratification remains in App state and requires the Chairman role, a complete presented batch, a matching proposal and a positive finite budget. The oversight view selection also survives desk switching.

Coordination, Technical, PR and Finance can record a session escalation with reason, evidence reference and requested decision. Intake derives the department from the active role, requires all fields, and rejects duplicate pending submissions. References are user-entered session references, not authenticated document uploads. Submitted records and responses survive role switches, but not refresh.

Deferral remains PENDING_EXECUTIVE_ACTION and retains a decision history; later approval/rejection resolves the record. Repeated deferral and terminal re-decisions are blocked. Neither intake nor executive disposition changes specialist clearance, venue authorization, contract terms or payment gates.

The portfolio displays the current session theme and ratified budget separately from source program titles. Evidence counts use localized words rather than bidi-sensitive fractions. No database, authentication or external actions are added.

---

# 28 September 2026 — Evidence-backed Chairman oversight

The Chairman opens a portfolio view of existing program references, then a separate Biennial decisions view retaining Stage 1 ratification and downstream handoffs. Operational evidence is derived from the existing commission state: PR and Technical require their gate and valid recorded timestamp; Logistics requires its receipt status and timestamp; Finance requires an actual session ledger entry, not authorization alone. Missing evidence has no invented reference or health percentage.

Calendar overlap uses the intersection of known date ranges. Shared program coordinator/venue names alone do not establish exclusive booking conflicts. Explicit shared exclusive-resource bookings are required for that classification. Missing assignment schedules remain unknown, not a zero-conflict assurance. Existing program references are not live delivery reports.

Executive escalation records are owned by App and start empty; the provided engineering-waiver fixture and invented report identifiers are intentionally not seeded. Disposition callbacks are Chairman-only and idempotent, and never modify specialist clearance or payment state. No production backend, external waiver or resource allocation is implied. An originating-department escalation submission workflow is not yet connected.

---

# 28 September 2026 — Honored guest roster and participation tracks

The locally inspected `قائمة فناني التكريم (2).docx` contains 53 distinct guest rows assigned to nine coordinators (24/10/4/4/3/2/2/2/2), confirmed by the owner. Source spellings are retained, including Paco Feenandez. The heading specifies House of Wisdom, Saturday 10 October 2026. Hospitality dates 6–11 October come from the separate invitation source. Shurooq clearance is an owner-specified operational dependency; the roster supplies no authorization evidence.

Participation tracks are HONORED_GUEST, SOLO_EXHIBITION and GENERAL_COMPETITION. They are distinct from single-work versus solo contract scope. Only solo proposals require 15–20 whole artworks. Honored guests require identity for vetting, not invented artworks or career classifications, and are excluded from artwork balance ratios. The source roster is a read-only reference, not a set of approved dossiers or attendance confirmations.

Coordinator demo selection filters source guests and draft queues; only the assigned coordinator may submit a dossier. `assignedCoordinatorId` and `participationTrack` are frontend fields intended to map to assigned_coordinator_id and participation_category when a reviewed database migration is implemented. No Supabase seed, authenticated coordinator accounts or RLS changes are included. Kufic Horizon contracting remains assigned to the fictional demo coordinator. Real source guests are never automatically given grants or contracts. All source event cards explicitly show external venue clearance as not recorded.

---

# 28 September 2026 — Connected rehearsal UX

The gateway is a short operational introduction; the institutional story remains optional. Presenter handoffs default to manual Continue. Optional 3.5-second forwarding has a visible countdown and Pause; changing desks or resetting a proposal set cancels pending navigation. All existing approval prerequisites remain in force.

Kufic Horizon remains a single 84 kg work in the active contracting rehearsal. The 2026 solo-exhibition letter is a separate source reference, never a generated current-deal document. Solo validation remains available in the schema for future separate fixtures. Current agreements record the published theme at drafting; an unpublished theme is explicitly identified rather than replaced by the source letter's theme.

Operational form drafts and local identity assets survive role changes within this app session. Refresh clears these session drafts and approvals; existing browser text-draft recovery remains separate. The artist arrival package uses an artist welcome guide, not a juror-only requirement. No Auth, banking, booking or production database integration is implied. The operational handoff summary reads existing evidence and does not change gates.

---

# 28 September 2026 — Solo invitation source scope

The owner supplied an Arabic transcription identified as source 6 (letter ش.ث/خ.س/001, dated 24 February 2026). The scan was not independently inspected in this implementation. Stage 6 now distinguishes single-work agreements from solo exhibitions; only solo exhibitions require 15–20 whole artworks. The source-scoped rehearsal preview records the 12th Biennial theme ميزان, event dates 7 October–15 November 2026, hosting 6–11 October, round-trip artwork transport and insurance, hospitality/accommodation, the three exact attachment labels, and the source coordinator contact and dual signatory titles. Form 100 is an owner-proposed mapping, not a literal source identifier. Generated previews adapt the recipient to the current fictional record, allocate no official outgoing reference, and remain session-bound and watermarked. This does not change payment prerequisites or create external actions.

# 28 September 2026 — Owner clarification: split payments and accountable handoffs

This update supersedes earlier conflicting payment and stage wording. All records remain fictional and session-bound. Browser-persisted text drafts do not restore approvals.

- Stage 3: HIP proposes dynamic restriction changes with a reason; Director approves or rejects before activation. Changes are logged within the session.
- Stage 4: scouts prepare dossiers; the assigned demo Coordinator alone submits for vetting. Commissioned works require mockups; existing works require images and provenance. Matching active restrictions excludes dossiers from the Director queue.
- Stage 5: Emerging/Established ratio is informational, excludes vetoed dossiers, and imposes no numeric quota. A veto requires an explicit institutional reason and returns feedback to Coordinator.
- Stage 6: external venues require a fictional clearance reference before agreement generation. Artist amendment returns to Coordinator without repeated Stage 5 approval. No live legal signatures.
- Stage 7: Advance requires accepted agreement and PR/Technical evidence, never physical arrival. Delivery requires Logistics PHYSICAL_ASSET_RECEIVED. SAF technician requests are separate from structural evidence and do not imply external allocation.
- Stage 8: Completion requires exhibition closure, safe return reference and condition reconciliation reference. Finance records each tranche separately in a session ledger. No banking actions occur.
- Session demo uses one assigned Coordinator and the Kufic Horizon commission for contracting/logistics/finance. Production identity, external integrations and multi-commission execution remain outside this prototype.

# 26 September 2026 — Fictional commission remediation (supersedes conflicting rules below)

The owner explicitly revised the Stage 6–7 design. Earlier statements calling this file immutable do not prevent this authorized change. This document is a prototype specification, not an institutional delegation instrument.

- One default commission: Noura Al Mazrouei, **Kufic Horizon: Architectural Bronze & Black Oxide**, 84 kg. All seeded artist/contract views use this identity. Stage 6 begins without a contract; the Coordinator drafts its amount and three percentages (existing illustrative defaults: AED 45,000 and 40/30/30).
- App owns the local commission reducer. Coordinator, Artist and Finance consume the same agreement. The three milestones are Advance, Delivery and Post-Opening; there is no combined final 70% action.
- PR records passport/visa evidence only. No imagery, technical review or finance permission follows from PR completion.
- Technical records the fictional floor-load and mounting-spec checks. Weight alone cannot certify structural safety. These controls simulate a specialist review, not an engineering calculation.
- Finance alone records advance authorization, guarded in both the UI and reducer. Agreement acceptance plus both recorded evidence gates are required. This prerequisite is an owner-specified demo rule, not a confirmed institutional payment policy.
- Authorization is not settlement. No money transfer occurs. Delivery and Post-Opening remain individually pending; their evidence workflows are outside this change.
- Evidence and approval persist across role switches, reset on refresh, and are invalidated when agreement terms change. There is no backend, identity upload or real signing.
- Technical is a tenth prototype workspace. Local role checks illustrate separation of responsibilities and do not constitute production access control.

Source basis refreshed 26 September: shipping/insurance form (Drive ID `1Uu2DAkNJ476HEFYEipRHA7ZHehnqOr96`, 2026, modified 1 July 2026) supports requested weight, dimensions, handling and installation evidence; Technical Requirements From (ID `155k3SGvlv_9ycW8z1OCCIAE8yUZXoYvA`, 24th Islamic Art Festival, modified 1 July 2021) supports technical item/quantity/description fields. Neither establishes floor capacity, a named reviewer or payment authority. Use the artops source register and Edition 2 role reconciliation for claim limits. The owner's supplied scenario is a design assumption, not evidence derived from the earlier audit screenshots.

The historical specification below remains a record of the earlier design; its conflicting PR/Finance rules are superseded by this section.

---

# SADU Institutional Architecture & AI Governance Ruleset

> **CRITICAL SYSTEM PROMPT INSTRUCTION FOR AI AGENTS:**  
> This document is the absolute, immutable ruleset and single source of truth for the SADU (Sharjah Calligraphy Biennial / Multaqa) institutional governance portal. Any AI coding agent, system prompt, or automated refactoring workflow MUST treat this exact chronological workflow, role division, operational gate, and state machine as immutable law for all code generation. No role titles, authorities, or gate sequences may be altered, merged, or diluted.

---

## 1. Chronological Operational Workflow (The Multaqa Stages)

### Stage 1: Theme Proposal & Executive Ratification
* **Preparatory Committee (اللجنة التحضيرية):** Formulates 3 theme proposals, writing the initial explanation and curatorial intent for each across three mandatory artistic criteria:
  1. *Aesthetic Framework:* Define the visual and stylistic parameters.
  2. *Contemporary & Historical Relevance:* Justify the theme's position within international art standards.
  3. *Curatorial Justification:* The rigorous defense of why this theme is necessary.
* **Chairman (H.E. Abdullah Al Owais / رئيس الدائرة):** Reviews the 3 proposals and officially selects/approves one theme and assigns the budget. Once locked, the theme does not go directly to the HIP; instead, the system updates the status to **Pending Editorial Polish** and routes the theme to the Editorial Department.

### Stage 2: Editorial Polish & Final Phrasing
* **Editorial Department (قسم التحرير):**
  * Receives the Chairman-approved theme in the Approved Theme Queue.
  * Takes the Preparatory Committee's raw explanation, aesthetic framework, and curatorial intent.
  * Rewrites it into the final, polished bilingual (Arabic/English) institutional text:
    - *Official Theme Essay (Arabic)*
    - *Official Theme Essay (English)*
  * **Publishing Gate:** Holds exclusive authority to click **"Publish Official Theme"**. Once Editorial publishes the final text, it updates global state to **Published**, becoming the immutable official theme visible to the HIP and Coordinators.

### Stage 3: Curatorial Guidelines & Dynamic Blocklists
* **HIP (Head of International Programs / منسق معرض عام):**
  * Receives the polished official theme published by Editorial.
  * Drafts the operational curatorial brief and exhibition guidelines based on the approved, phrased theme.
  * Manages the **"Dynamic Blocklist"** (an active array of restricted tags, e.g., temporarily restricting certain nationalities or mediums due to real-time political/security directives).
  * **System Invariant:** If a Coordinator or Committee member attempts to submit an artist matching an active blocked tag, the system immediately rejects the submission with an alert:  
    `"Submission blocked by current HIP security/administrative directives."`

### Stage 4: Artist Nomination (The Multaqa Protocol)
* **Preparatory Committee & Coordinators (اللجنة التحضيرية والمنسقون):** Collaboratively nominate artists.
* **Strict Dossier Schema (Hard Validation):** The system blocks submission unless the dossier contains all mandatory components:
  1. `artistName` (String, Required)
  2. `artistCategory` (Enum: `'Emerging'` or `'Established'`, Required)
  3. `cvUpload` (CV in PDF format / boolean flag, Required)
  4. `previousWorks` (Images of Previous Work / boolean flag, Required)
  5. `newWorkMockup` (Mockups/Sketches of the proposed new work / boolean flag, Required)
* **Strategic Tagging:** Each nominated artist must be tagged as either **Emerging Artist** or **Established Artist** to maintain exhibition balance.

### Stage 5: Director's Veto & Balance Review
* **Biennial Director (Mohammed Al Qaseer):**
  * Reviews the submitted dossiers in the candidate pool.
  * **Balance Review:** The UI provides a visual ratio and progress bar of Emerging vs. Established artists currently in the proposed pool to ensure institutional goals are met.
  * **Absolute Veto Power:** Holds absolute veto power over any artist. Clicking "Veto/Reject" requires selecting a reason from a dropdown (e.g., Budget, Security, Curatorial Mismatch, Administrative Directive) and automatically routes the status and rejection feedback back to the Coordinators.

### Stage 6: Contracting & Logistics
* **Coordinator (المنسق العام):** Drafts customized bilateral artist contracts specifying production values and shipping terms based on Director-approved artists.
* **Artist (الفنان):** External access portal to approve contract terms and upload passports and print-quality high-resolution artwork files.
* **PR (التشريفات):** Verifies passports and print-quality images for catalog publishing, delegation logistics, and exhibition wall text.
* **Finance (المالية):** Executes payment tranches based on the locked contract and Chairman budget allocation.

---

## 2. Institutional Roles Mapping (9 Distinct Roles)

1. **Chairman** (H.E. Abdullah Al Owais - Executive Gate & Budget Allocation)
2. **Biennial Director** (Mohammed Al Qaseer - Executive Veto, Balance Review & Artist Selection)
3. **Preparatory Committee** (Theme Formulation & Initial Curatorial Intent)
4. **Editorial** (قسم التحرير - Theme Rewriting & Bilingual Polishing)
5. **HIP** (Head of International Programs / منسق معرض عام - Curatorial Guidelines & Dynamic Blocklists)
6. **Coordinator** (Program Operations & Dossier Assembly)
7. **Artist** (External Access - Portfolio & Dossier Intake)
8. **Finance** (المالية - Contracts & Tranche Disbursements)
9. **PR** (التشريفات - Passports & Print Verification)

---

## 3. System Invariants & Enforcement Gates

1. **Editorial Polish Gate:** When Chairman Al Owais approves a theme and locks the budget, it is not sent immediately to the HIP. The theme enters **Pending Editorial Polish** status. Only the Editorial Department can craft the official Arabic and English theme essays and execute the **"Publish Official Theme"** action to unlock Stage 3 for the HIP and Coordinators.
2. **Zero Fluff Theme Gate:** Chairman cannot approve until 3 distinct themes have Aesthetic Framework, Contemporary Relevance, and Curatorial Justification.
3. **Dynamic Blocklist Gate:** Any nomination matching an active HIP blocked tag triggers an immediate system rejection: `"Submission blocked by current HIP security/administrative directives."`
4. **Dossier Schema Gate:** Submissions missing `artistName`, `artistCategory` ('Emerging'/'Established'), `cvUpload`, `previousWorks`, or `newWorkMockup` are strictly blocked.
5. **Director Balance & Veto Gate:** The Director's dashboard renders a visual ratio bar of Emerging vs. Established artists. Vetoes require selecting a reason from a dropdown (Budget, Security, Curatorial Mismatch, Administrative Directive) and routes the status back to Coordinators.
6. **Financial Lock Gate:** Finance cannot execute payment tranches until contracts are locked post-Chairman budget authorization.

## Spatial request rehearsal and venue calendar

The Technical execution ledger includes an isolated Mounir Fatmi spatial-request rehearsal. Its session draft survives role changes, but not a page refresh. The sequential path is PENDING_CURATOR_REVIEW (Vinyl), REJECTED_ASSET_RISK, then APPROVED_ALTERNATIVE (Carpet). Reviewed requests lock their modification type; repeated actions preserve decision timestamps. The generated work-order badge is simulated and does not dispatch externally or satisfy the commission technical/finance gates.

Below Chairman theme decisions, the Geographic Portfolio displays the supplied EVT-KALBA-13 sample booking for 25 September–1 October 2026. This read-only, unverified reference is distinct from the existing Kalba Cultural Festival reference. It does not establish live reservation enforcement or infer resource conflicts.

## Travel and technical request bridges

PR's recorded evidence gate enables a session-only travel packet keyed by artist ID. Primary visa and itinerary PDFs are required; an escort visa is optional. Dispatch freezes the packet and exposes its actual sample files to the matching Artist portal. These browser-memory downloads are a rehearsal bridge, not authenticated storage, real document dispatch, or a production security boundary. Refresh discards the packet.

The Technical request ledger stores equipment and mounting choices per artist in session state. Each submission produces an inventory task for Technical & AV and a separate pending venue review for the scenario's Sharjah Art Museum curator. Requests do not clear engineering, venue, or financial gates; duplicate equipment/mounting pairs are blocked. The scenario authority must be replaced by verified venue jurisdiction before production use.

## Cultural declaration and production evidence bridges

The initial nomination form requires an explicit Yes/No textual-cultural declaration and a nonblank full translation/context for Yes. HIP reviews the exact stored declaration for every dossier; only HIP can record clearance while it is a draft. Assigned-Coordinator Stage 4 submission and Director approval both guard this clearance. New nominations cannot inherit a caller-supplied clearance. The pre-approved demonstration dossier carries an explicitly seeded sample review. No new global lifecycle status is introduced.

Artist digital masters (.mov/.mp4/.m2v, up to 2 GB each and five records) bridge by artist ID to Technical Digital Deliverables. They are local File references, not remote uploads or malware-scanned storage. There is no external-sharing-link input. Technical can request a titled prototype review with up to five PNG/JPEG sample photos (10 MB each). The Artist records an immutable approve/reject timestamp; this decision does not satisfy venue, engineering or Finance clearance. All production files and tickets are session-only and discarded on refresh.

## Fleet dispatch, deployment phases, and executive installation holds

Stage 6 captures crate reference, external dimensions (cm), and gross packed weight (kg). Fleet tickets require an accepted agreement and valid crate data; missing measurements cannot fall back to artwork weight. Each ticket snapshots the crate specifications, records PENDING_FLEET_ASSIGNMENT, and permits a Logistics-only simulated IN_TRANSIT transition. Fleet state is not physical receipt evidence or a real booking.

Technical equipment requests carry PROTOTYPING or FINAL_INSTALLATION. Duplicate detection includes the phase. Prototyping cards explicitly instruct return to inventory before opening; the badge is not evidence of actual return.

Director installation monitoring includes only accepted, physically received, non-closed commissions. A nonblank executive mandate sets EXECUTIVE_IMPOUND and resets technical evidence. The Technical ledger is disabled and the reducer blocks technical actions, new disbursements, closure, fleet dispatch, and agreement mutation during the hold. Only the assigned Coordinator UI can record explicit alteration acknowledgement; Technical must re-record its checks afterward. Mandate text and decision timestamps remain in the session audit history. None of these controls establishes production authentication or external dispatch.

## Shared venue claims

The 2026 session venue ledger defines Sharjah Art Museum Hall 1, Calligraphy Square Main Atrium, and House of Wisdom Lobby. The Coordinator desk can claim an available space only for an approved artwork dossier assigned to that coordinator, with recorded medium and no pending scope amendment. The atomic functional state update rechecks availability and ownership; existing claims cannot be replaced. Claims snapshot artist, medium, coordinator, and timestamp. HIP and Curatorial Canvas read the same session ledger. This prevents conflicting claims within one demo session, not across browser sessions or concurrent production users; server-side uniqueness and authenticated permissions remain required for production. A claim is not external venue authorization.

## Revision and spatial handoff guards

Stage 6 uses a shared publication eligibility predicate in the Coordinator form and App dispatch handler. Both official theme and HIP guidelines must be published. The explicit isolated rehearsal toggle defaults off and bypasses only these publication checks, leaving dossier and agreement validation intact.

Agreement amendments preserve fleet tickets with their originating agreement revision and a superseded marker. Physical receipts are moved immutably into visible receipt history, also revision-marked and superseded; only newly recorded current evidence qualifies for milestones. Superseded fleet tickets cannot depart or block a replacement request.

Shared space claims snapshot venue jurisdiction and responsible curator role from the session venue registry. Each artist has one claimed room. Venue-modifying technical requests (including Lighting Rig, Ceiling Mount and Wall Anchor) require the matching artist claim and snapshot that routing evidence. Freestanding equipment supply does not invent a structural approval task. Clearance references now derive from claims and remain pending venue review; claiming never implies external authorization.

## Living profile and curatorial directory

Rehearsal artists have a master profile independent of contracts, keyed by dossier artist ID. Biography (Arabic/English), affiliations and up to ten sample PDF publications (20 MB each) are saved explicitly to IndexedDB. HIP and Committee read the same profiles with combined text/medium/nationality/edition filters. Registration retains previously saved profiles and never overwrites artist text; contract biography fields remain separate. PDF File objects survive page reloads on the same browser origin. Clearing browser data removes these prototype records. This is not authenticated departmental storage or cross-device synchronization; server-backed artist identity and private press storage remain necessary for production. Participation metadata reflects registered rehearsal dossiers, not verified historical attendance.

## Geographic delegation rehearsal

The Coordinator desk offers an explicitly labelled General Coordinator rehearsal selection. Only this selection can bulk-delegate a region to a known coordinator. Region tags use exact country/nationality aliases; unknown or ambiguous origins remain unclassified rather than inferred from names. The shared dossier assignment drives coordinator queues and the commission's contracting ownership. Each changed dossier retains an append-only handoff record. Regional transfers are atomic: any affected contract, spatial claim or pending scope amendment blocks the entire batch. Country grouping is operational routing, never a compliance decision. These demo permissions and histories remain session-bound and are separate from authenticated Supabase pilot roles. The reference honored-guest roster is not silently reassigned because its source contains no verified country fields.

## Condition reporting and emergency contingency

Stage 6 explicitly records transit insurance liability (ARTIST or DEPARTMENT), independently of free-text shipping method. Existing agreements without liability cannot infer it from courier descriptions. Logistics records immutable condition reports only after PHYSICAL_ASSET_RECEIVED (the existing delivered-equivalent gate), with a contract revision and receipt reference. Damaged reports require 1–5 sample JPEG/PNG files, each at most 10 MB. Department liability automatically creates an INSURANCE_CLAIM_PENDING queue entry; artist liability allows explicit dispatch of the sample evidence to the matching Artist Portal. No external claim is filed.

Any reported damage locks fleet movement, installation, new tranche recording, closure and contract mutation; changing agreement state cannot erase the hold. Plan B records a priority request with a positive secondary grant, emergency flight details and justification. Director and Finance see the same request immediately; Finance may decide only after Director approval. Decisions are idempotent, timestamped, and do not pay money, book flights, revise the contract or clear the damage hold. A future separately authorized recovery/condition reconciliation workflow is required to release damaged work. Files and emergency records remain session-bound rehearsal data.

## Exhibition metadata and catalog deadlines

After ARTIST_APPROVED/LOCKED, the Artist submits bilingual exhibition titles and a curatorial statement directly to HIP's Live Catalog Aggregator through the commission reducer. Submissions retain contract/revision/timestamp history and survive role switches within the session; they are not emailed or published automatically. Invalid, duplicate and unauthorized submissions are blocked. Prior-revision submissions are labelled historical until resubmitted after current agreement acceptance.

The master catalog schedule holds the supplied photography deadline (15 August 2026) and physical delivery deadline (10 September 2026). The Artist sees these read-only dates and a photography status derived from the existing intake record. Publication clearance requires a verified status, filename, upload timestamp, current verification timestamp and at least 300 DPI; replacement uploads clear old verification evidence. Metadata submission is not cultural clearance or publication approval. No new PR approval authority is introduced by the read-only indicator.

## Missing deliverables and fabrication routing

HIP can create per-dossier urgent checklist requests for video masters, technical specs and layout/fabrication approval. Requests are keyed by artist ID; the assigned Coordinator queue and matching Artist Portal read the same session records. Deadlines are interpreted at 23:59:59 Asia/Dubai, and countdowns show overdue time after expiry. Past/invalid dates, empty lists and duplicate requests are blocked. Requests are reminder records, not automatic evidence clearance, external messages or durable notifications.

Coordinator fabrication orders are a third execution track. Approved dossiers collect item, vendor/technician and requested original-asset disposition. Only Technical records readiness, without changing venue approval, installation clearance or Finance. Damage/impound holds disable the commission's fabrication workflow. Discard is a requested instruction only and never executes or authorizes destruction. Fabrication records and nudges survive role switches within the current session, not refreshes; production authentication and server persistence remain outside this prototype module.

## Artwork roster and controlled catalog amendments

Accepted artists build bilingual artwork labels with production year, medium, positive centimetre dimensions and sample PNG/TIFF images (50 MB each, up to 100 items). Submission atomically snapshots an immutable numbered revision and locks editing. HIP and Editorial read the same session records and image files. Artists can request amendment but only the currently assigned Coordinator queue can authorize reopening; requests and permissions retain actor/time events and previous submissions remain visible. These controls are session rehearsal permissions, not server authorization. Files are held in memory, lost on refresh, and resolution/content must be inspected by Editorial; accepted format does not certify print quality. Removing an item removes it only from the editable draft, never a submitted revision.

## Bank, collection address and advance-dependent metadata

Accepted artists submit fictional bank-holder/IBAN details and an explicit collection country, city and exact address. IBAN input permits letters and digits, normalizes spacing/case, and checks MOD-97; this is not bank/account ownership verification. Finance reads bank details, while Logistics receives only the submitted collection location and never derives it from nationality. These records remain session memory only.

Finance can record an Art Loan Fee payment with a positive AED amount and reference after agreement acceptance and PR/Technical clearance. Holds block recording and repeat actions cannot overwrite payment evidence. The Artist sees Payment Transferred explicitly qualified as a simulation. This separate fee never substitutes for the production advance. Metadata submission and the artwork-label entry point require an accepted agreement plus a DISBURSED advance and matching-revision ledger evidence. The reducer independently enforces the metadata gate. Bank/address edits lock after the loan payment record; subsequent corrections need a future controlled amendment workflow.

## Acquisition and return close-out rehearsal

The existing intake did not contain a sale price, return postal address or packing instructions. A dedicated artist-submitted Acquisition & Return Intake now captures these explicitly for the single commissioned artwork; the production grant and collection address are never substituted. Director acquisition requires an accepted agreement, physical receipt and those terms. It snapshots the price in USD, records ACQUIRED_BY_INSTITUTION, creates a pending Finance payout entry, and cancels (without deleting) the pending return manifest. Acquisition is blocked after a return AWB is recorded.

Logistics generates a manifest from the submitted return address and packing instructions, and attaches a sample PDF AWB. Archive requires that evidence and sets global ARCHIVED_CLOSED. The commission reducer rejects every subsequent action; operational views become historical and adjacent per-artist fabrication/scope/contract controls are blocked. Shared theme governance and other artists remain independent. Acquired works cannot fabricate return evidence: their archive stays locked pending a separately designed accession workflow. Records and PDF files are session-only; this is not a legal purchase, executed payout, durable archive or real freight booking.

## Artist layout and domestic first-mile collection

Accepted artists upload sample PDF/PNG/JPEG layouts directly to the commission state (20 MB/file). Technical shows the latest current-agreement layout pinned to the artist/contract installation record, retaining earlier files as historical. A layout is visual guidance, not structural approval. Domestic pickup eligibility comes from the explicitly submitted UAE collection country, never nationality. Artist requests require Emirate, area, street, building, future pickup date and onsite contact/phone. Logistics receives PENDING_COLLECTION with a snapshot of the approved Stage 6 crate, while repeat current-revision tickets, post-receipt pickups and archived/held modifications are blocked.

The existing commission model has one approved crate, so the queue reports one crate explicitly. No verified fleet capacity catalogue exists; truck allocation remains pending Logistics review, rather than pretending to dispatch a 3-ton vehicle automatically. Requests/files are session-only and do not book vehicles or notify external carriers.

## Production and AV specifications

Each artwork label can opt into Production & Display Specs, recording printing/framing (paper, frame profile and dimensions), AV requirements, and an optional PDF technical sheet up to 10 MB. Enabled sections require at least one specification; attached PDFs must pass extension/MIME/size and file-signature checks before roster submission. Asynchronous file checks ignore stale selections. Specifications and PDFs snapshot with the submitted roster revision and inherit its locks and Coordinator-approved amendment flow.

Technical opens individual artwork entries from the active artist installation record and sees only the latest submitted instructions, never draft edits. Pending amendments display a reconfirmation warning. These remain session-only instructions, not engineering approval, private server storage or verified document safety.

## Venue-host clearance and absence routing rehearsal

Structural and fabrication ticket cards register a venue clearance record from the artist's claimed venue, with proposed floor-protection and visitor-perimeter conditions. Fabrication readiness is separate from permission to install. The read-only Venue Host perspective permits only its designated rehearsal identity (or its configured same-role backup during ON_LEAVE) to record APPROVED_FOR_INSTALLATION. Unclaimed venues, fabrication still in production, impounds, damage and archives block clearance. Approval is idempotent and records Coordinator/vendor recipient notifications within the session; no Outlook or external messages are sent.

Active Delegate is available for each role and venue authority. ON_LEAVE requires a named backup, reassigns the pending queue to that same-role backup identity, and makes the original role workspace inert until the acting reviewer matches the assignment. Returning from leave restores the primary queue. Director vetting, HIP cultural-review and PR review queues show routing indicators; other existing role work remains in its workspace with the same delegate gate. These are explicit rehearsal selectors, not authenticated staff identities. Production-secure delegation, persistent staff memberships, server-enforced authorization and external vendor delivery remain unimplemented and must not be inferred from this UI.
