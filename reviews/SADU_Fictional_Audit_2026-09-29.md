# SADU fictional rehearsal — audit and reviewed fixes

29 September 2026. Baseline: `afe3006`. Scope: the separate local rehearsal served at 127.0.0.1:3013, its frontend, local Node stores, PDF services, schema proposals and automated checks. The real application, Alpha, production database, real accounts and external integrations were not resumed or audited live. Unrelated pre-existing working changes were preserved.

## Verdict

The fictional build is useful for demonstrating separation of responsibilities and reviewing concrete workflows. It is not a unified production system. Its largest remaining weakness is fragmented identity and state: the 14-task checklist, publication artwork, wall studies and physical shipment use separate stores or identifiers. Their shared artist name does not establish synchronization. A polished executive page must not imply otherwise.

The email-derived scenarios are valuable design inputs, not evidence that every institutional process is absent, that named employees caused the problems, or that SADU already implements the suggested remedies.

## Captured flow and health

1. **Executive entry — usable, motion control improved.** Clear fictional branding and inactive UAE PASS. Continuous decorative animation previously had no user pause. Added pause/resume alongside reduced-motion support. The opening claim now explicitly describes a fictional demonstration. Screenshot: `01-entry-before.png`; post-fix `08-entry-after.png`.
2. **Coordinator review — usable, hierarchy improved.** Smart Filter, crate tracking and wall planning previously preceded the review itself. Current tasks and submission now lead; secondary tools use keyboard-accessible disclosure controls that retain their mounted state. Screenshot: `02-review-before.png`, `05-review-after.png`.
3. **Task/decision journey — data-loss issue fixed.** The screen explicitly warned that all records disappeared on refresh. Recorded actions now persist in this tab's session storage and replay through the same guarded reducer. Invalid saved data is preserved without overwrite. Unsaved form text and closing the tab remain limits. Browser verification recorded, confirmed and completed a fictional brief, refreshed and retained it. Screenshots: `03-journey-before.png`, `04-journey-after.png`.
4. **Artist forms and workspaces — navigation protection improved.** Shipment edits previously disappeared on desk changes; account switching also remained possible while a child workspace was saving. The parent now guards shipment changes, scanning and spatial loading/saving. Save/submit buttons follow the label fields. Explicit discard remains available. Screenshot: `06-shipment-after.png`.
5. **PDF and change handling — historical recovery improved.** A new publication revision previously blocked manifest printing even after a crate had moved, while shipment fields were frozen: an unrecoverable UI loop. Moving crates now retain a visibly historical manifest from the original shipping snapshot. Pending shipments still require updated approval before printing. Long shipping fields move the QR onto a separate identification page rather than overlap it. Both pages rendered and inspected in this audit.
6. **Role, filter and spatial surfaces — working within narrow scope.** Coordinator thematic filters, existing artwork placements and authenticated local endpoints remain available. They are single-artist or sample-wall tools, not an exhibition-wide registry. Screenshot: `07-tools-after.png`.

Evidence images are saved in `C:/Users/squir/Documents/ChatGPT/artops/reviews/SADU_Audit_2026-09-29/`. These are current-run captures, not reused release screenshots. Screenshot evidence cannot establish a complete accessibility or security certification.

## Defects fixed

| Priority | Finding | Remediation and evidence |
|---|---|---|
| P1 | Refresh discarded recorded checklist decisions and completion | Validated session journal; corrupt/forged replay regression test; browser refresh verified |
| P1 | Recording physical arrival depended on advance authorization | Receipt can be recorded when observed; delivery payment still requires receipt and advance. No payment or approval is inferred from arrival |
| P1 | Post-shipment publication amendment made manifest unavailable with no recovery path | Historical manifest retains original revision and physical record; immutable shipment preserved; regression test |
| P2 | Director could see an older approved revision presented as the current submission | Explicit current revision identity; history is retained but no longer becomes the active review. Superseded alerts resolve |
| P2 | Batch button could offer test labels after server test mode was disabled | Server exposes current test-mode policy; UI and backend eligibility agree; regression test |
| P2 | Shipment drafts and in-flight child operations were unguarded across desk changes | Dirty/busy/scanning guards and before-unload protection; explicit discard |
| P2 | Review action buried behind unrelated modules | Review-first hierarchy and related-tool disclosures |
| P2 | Label fields appeared after save/submit buttons | Actions moved below their fields |
| P2 | Long manifest details could collide with QR | A4 overflow produces a separate ID/QR page; rendered with maximum-length stress values |
| P2 | Continuous background motion had no pause control | User pause/resume and existing reduced-motion CSS |

## What exists, and what remains proposed

| Capability discussed so far | Actual status in this rehearsal |
|---|---|
| Executive scrollytelling | Working local page; official assets placeholders; illustrative dashboard, not live embedded metrics |
| 14-task journey and Finance gates | Working simulated desks, attributed statements and separate confirmation; three fictional payment tranches; no transfers |
| Verbal/email decisions | Recorded attribution, optional reference, confirmation/dispute and immutable earlier statements |
| Two-tier submission approval | Functional local server transitions, stale-version checks and role/session checks; account chooser is not real identity verification |
| Gallery labels/QR | Vector PDFs saved against approval; test URLs visibly unverified; basic Latin English only |
| Spatial planning | 2D centimetre bounds/overlap and saved positions; no weight, depth, floor planning or engineering acceptance |
| Crate tracking | One artwork in one crate; manifest, manual/scanner input and forward physical observations; camera hardware not tested |
| Thematic tagging | Deterministic local keyword suggestions and AND filtering; not semantic judgment, an artist waitlist or pre-vetting |
| Invitation archive | Fictional draft PDF in task journey; no secure invitation-link onboarding or live dispatch |
| Shared canonical bilingual names | Proposed; no approved-name revision model or bilingual PDF rendering |
| Translation lifecycle | Proposed; no translator account, source/translation revision linkage or proof invalidation |
| Contract template engine / obligation extraction | Proposed; no legal template approval, signature service or purchasing authorization |
| Technical equipment register / production routing | Proposed; wall dimensions and crate data are not an equipment request workflow |
| Feasibility intake / institutional response SLA | Proposed; no agreed rule configuration or external escalation |
| Deadline reminders / extensions | Proposed; no reminder delivery service, receipts or exception process |
| Withdrawal and replacements | Proposed; no safe commitment reconciliation or approved candidate pool |
| Delegated gallery access | Proposed; no scoped representative invitation/revocation workflow |
| Encrypted asset and bank vaults | Not implemented in this isolated build; local JSON is not a sovereign vault |
| CMS / UAE PASS / vendor integrations | Paused; publication outbox is local. No government compliance or data-residency claim is established |
| Passport validity / high-resolution asset inspection / 250–300 word policy | Not implemented as a complete enforced intake in this rehearsal. Earlier isolated guards are not proof of operational coverage here |
| Arabic coverage and real application | Earlier work retained separately, not loaded by this English rehearsal and not reverified in this audit |

## Improvements with the highest practical value

### 1. One artwork identity with purpose-specific evidence

Give each exhibition participation, artwork, package and submitted revision its own stable ID. Link the existing stores through those IDs without merging physically different objects. Generate each desk's outstanding work from shared events. Keep record receipt, technical acceptance, publication approval and payment authorization distinct. Acceptance test: one observed arrival is visible everywhere it is relevant, but never auto-pays an artist or certifies condition.

### 2. A change-impact preview

Before accepting a changed name, translation, dimension or scope, show which labels, manifests, layout decisions and publication outputs depend on that exact revision. Classify them as unaffected, needs review or historical. Preserve already executed actions. Acceptance test: correcting an Arabic name flags the specific catalogue/label versions, while a concept edit does not erase custody history. Historical manifest recovery implemented here is one part of this design, not the complete impact engine.

### 3. A shared obligations and exceptions queue

Represent artist and institutional obligations together: owner, recipient, due basis, required evidence and current blocker. Support awaiting information, awaiting institution, requested extension and review needed. Reminder delivery should have receipts and retry state. Do not use punitive labels or impose a universal deadline. Acceptance test: missing venue dimensions appears as an institutional dependency rather than an overdue artist failure.

### 4. Reviewed technical requests before procurement

Allow early technical information gathering in parallel with artistic review. Structured quantities, units and specifications go to technical review, inventory matching and then authorized procurement. Originals and drawings remain linked. Similar item names must not be summed without compatibility checks. A requested projector is not an approved specification or purchasing commitment.

### 5. Names, translations and proof packages as versioned records

Keep proposed alternatives, approved bilingual display names, translation provenance and source revision. Do not infer review authority from a job title. Use embedded fonts/shaping and an inspected bilingual proof before releasing Arabic PDFs. An output package should identify exactly which name, text, artwork and approval versions it contains.

## Evidence and authority

Revisited the source authority register (9 September), requirements reconciliation (9 September), role matrices reconciliation (12 September, Edition 2), system ownership/integration register (13 September) and contract-responsibility review (13 September). Refreshed the previously identified [operational tracker](https://docs.google.com/spreadsheets/d/1avjg_IV_Kq_mZFzQCdRvhgND0LnQbpPF/edit), status 11 August 2026, records through 21 July. It is derivative contextual evidence, not authenticated execution, current staff delegation or a new institutional policy. It supports distinguishing receipt, obligations, technical evidence and commitments. No raw banking, identity, private contact or medical material was copied into the mockup or audit.

Recent pasted scenarios remain attributed descriptions where original emails/forms were not inspected. They support candidate requirements, not findings against named employees. The audit's code defects above are separately grounded in the current local implementation and tests.

## Verification and release boundaries

TypeScript, rehearsal production build and 178 automated tests pass after all fixes. Tests cover reducer persistence, malformed recovery, Finance separation, historical manifest access, current-vs-historical Director review, superseded alerts and test-mode eligibility, alongside the existing role, version, geometry, PDF and HTTP controls. The final renderer adjustment also passed the full build. Browser checks cover recorded-task persistence, primary hierarchy, disclosures, spatial dirty-state account locking/discard recovery and motion control. Shipment dirty-state protection was code-reviewed; a fresh editable shipment was not exercised in this browser pass. Manifest stress pages are visually inspected.

No production penetration test, screen-reader audit, physical QR-camera test, live email delivery, multi-artist load test, source authentication or external integration test was performed. Session storage is not a backup and local JSON is not a production database. Do not deploy the demo account chooser publicly as authentication.

Release recommendation: suitable for a clearly labelled local leadership demonstration after these fixes. Next substantial implementation should unify artwork identity and change-impact tracking before adding more disconnected dashboards. Real-system resumption remains a separate user decision.

## Selected visual evidence

![Recorded journey retained after refresh](../../artops/reviews/SADU_Audit_2026-09-29/04-journey-after.png)

![Current review placed before related tools](../../artops/reviews/SADU_Audit_2026-09-29/05-review-after.png)

![Manifest source and physical observation](../../artops/reviews/SADU_Audit_2026-09-29/06-shipment-after.png)

![Motion pause control](../../artops/reviews/SADU_Audit_2026-09-29/08-entry-after.png)
