# SADU governance schema proposal

29 September 2026. Companion: `sadu_governance_schema.sql`.

This is the requested first schema draft, not an applied migration or a replacement for the reviewed fictional release. No real account, assignment, database, integration, app branding or deployment changes. The SQL intentionally ends in ROLLBACK. It has been statically reviewed; it has not been executed against PostgreSQL. It must not be represented as working RBAC or completed validation.

## Source treatment

The owner's emails, firsthand experience and verbal explanations remain valid requirement evidence. No hidden contracts are presumed. An optional document reference never blocks recording a verbal decision. A proposed assignment is distinct from confirmed authority and from a provisioned account; no real names or email addresses are seeded.

The existing 9 September Source Authority Register and Requirements Reconciliation, 12 September Role Matrices Reconciliation and 13 September System Ownership and Integration Register were revisited. The latter two separate coordination, specialist facts and publishing delegation. They do not establish the proposed named assignments.

The [personal-exhibition requirements source](https://docs.google.com/document/d/1S6Kz7m9Q3dmKaDb876Py1OI1PiXsxQTP/edit) was refreshed through Drive on 29 September. Identity: DOCX, source ID `1S6Kz7m9Q3dmKaDb876Py1OI1PiXsxQTP`, modification time 10 August 2026 00:15:38 UTC, 2026 calligraphy forum, twelfth edition. It requests a 250-word concept, 300-word biography, print-quality artwork images, separate visa/publication portraits and passport validity six months from the visit, with April 2026 boilerplate. It also explicitly requests Word files. Replacing Word with structured fields is a SADU design choice. This source does not establish a shared 250–300 minimum/maximum range, pixel threshold, named role delegation, website-publishing authority or encryption implementation. Existing April versus October–November date conflict remains unresolved.

## Proposed responsibilities

| Role | Candidate capability | Boundary |
|---|---|---|
| General Exhibition Coordinator | Receive safe submission/task alerts; critique; request revision; nominate current revision for executive review | Coordination does not confer specialist, payment, raw-vault or system-administration authority |
| Director | Review coordinator-ready revisions; authorize their public snapshot | Proposed fictional publication capability; cannot bypass rights, Editorial or specialist restrictions; no signing/spending delegation inferred |
| Artist | Edit own permitted revision; submit complete records; read critique and outstanding tasks | No edit of a submitted/approved snapshot |
| Editorial | Verify current text, media and publication rights evidence | Cannot trigger external delivery |
| PR Officer | Review identity/travel and assigned passport material | No default financial-contract access |
| Technical | Assess layout, structural/site and mounting evidence | Area comparison is not structural acceptance |
| Finance | Review assigned financial-contract material and independent payment gates | No default passport access; publication approval creates no payment |
| Logistics | Record required travel/freight task evidence | Purpose-limited views |

HIP is omitted from the candidate role vocabulary, not deleted from existing databases or historical decisions. Existing HIP assignments need explicit future mapping and audit preservation before any operational migration. General coordinator routing uses exhibition-scoped assignments, never an email string or the first account with a matching title.

## Required transition contract — still to implement

1. Artist edits Draft / Revision Requested. Server checks trusted actor, exhibition/artist assignment, current policy and deadline at save and submit. A visible timer is informational, not enforcement.
2. Submit validates linked artwork/media, required contextual logistics, configured text bounds and deadline, then freezes a revision in Coordinator Review.
3. Coordinator Request Revision requires critique notes and creates an artist task plus an in-app notification in the same transaction. Preserve the submitted snapshot; the artist edits a new revision. No email is implied. A deadline that already passed remains locked unless a separately recorded bounded extension exists; requesting revision alone grants no extension.
4. Ready for Executive requires current Coordinator review and required Editorial/rights evidence. Director's projection exposes only eligible public-review data, not raw artist drafts, passports or contracts.
5. Approve & Publish checks the trusted Director assignment and the exact revision under a row lock, records Publication Approved and inserts one allowlisted publication-outbox row atomically. It does not set Synced. An old approval cannot authorize changed content.
6. An eventual server-only worker would send only that approved snapshot, use idempotency, reject redirects, apply timeouts/retries and match an acknowledgment to the event before setting Synced. The worker must recheck cancellation/withdrawal before dispatch. There is no configured endpoint, secret or active worker in this proposal. `SDC_CMS_WEBHOOK_URL` belongs in future server configuration, never frontend code or this schema.
7. Amendments require new revision reviews; pending obsolete events are cancelled, delivered content needs a separate withdrawal/update protocol. Prior evidence and sync attempts remain history.

## Validation decisions

- Event/visit date stays configurable and initially unset. Six calendar months is a proposed configurable rule supported by the cited request; compare to the relevant confirmed visit date with month-end handling. Do not equate 180 days to six months or silently choose an April day.
- Text limits are separate: concept 250 and biography 300 are proposal defaults. Treat them as maximums for the mockup, not invented minimums. Confirm word-tokenization and whether the original counts were exact targets before operational enforcement. Count centrally from text, not a client-supplied number. Short drafts must remain editable.
- Wall area can flag obvious over-capacity, but width/height, placement, gaps and obstructions determine fit. Floor sculptures, including the 84 kg scenario, require their own site/load assessment. No area pass establishes installation safety.
- An image must reference its artwork and revision. Storage upload issuance, trusted image decoding, size/type scanning and deletion/orphan handling are separate services. High-resolution thresholds remain unconfirmed, rather than invented from a filename or MIME label.
- Departure airport is conditional on travel participation. Passport expiry/evidence belongs in a separately protected PR service; it is not added to public submission rows or publishing payloads.
- Invitation records store immutable-version intent, private object identity and content hash. PDF generation and object retention/version controls still need implementation; PDF format alone is neither encrypted nor uneditable.
- Passport and contract access is split by document purpose, not a broad PR-plus-Finance union. Storage policies must match table policies and assignment scope. Encryption and key management cannot be delivered by a database column called encrypted.

## Implementation gates and review limits

The DDL covers structure and several referential/check constraints. It deliberately grants no client access. State transitions, trusted authorization, word-count validation, deadline enforcement, safe read projections, revision immutability, immutable policy history, source-supersession scoping, extension records, notification records, encrypted storage, content allowlisting and delivery attempts still require implementation and adversarial tests. RLS without policies denies client access; it does not make the proposal usable or prove security. Database owners/superusers remain privileged.

Before any implementation claim, test wrong-role and cross-artist/exhibition denial; stale revision/assignment refusal; amendment cancellation; simultaneous review and duplicate approval; deadline boundaries and extensions; month-end expiry; text boundaries in Arabic and English; image-parent ownership; purpose-specific vault denial; private-field payload exclusion; acknowledgment mismatch, retries and idempotency. No real database or integration was resumed to run these tests.

The previously reviewed 14-task fictional release remains unchanged. This proposal can guide a later mockup-only iteration without treating the pasted recommendation as permission for an institutional appointment or live integration.
