# Mounir Fatmi / Gallery 1 — evidence-to-record mapping

Status: partial source inspection. The magazine PDF and Heavier Than Words technical sheet were located in Downloads and inspected; their actual SHA-256 hashes are recorded. The cited September email bodies and definitive Gallery 1 drawing amendments remain unavailable. This is not a cleared operational dossier.

The machine-readable companion is `tests/fixtures/mounir-gallery1.json`. Its IDs identify proposed records, not existing institutional database entries. It is never automatically imported into the live application.

| Evidence reference | Proposed record / existing connection | Reported information | Required verification |
|---|---|---|---|
| E1: SMD-003-DL-SAM A/B/C | Venue → Gallery → wall records; existing backend `walls` use centimetres | A and B: 700 × 270 cm; C: 630 × 270 cm | Drawing revision, scale, orientation, usable bounds, openings and obstructions. A 25 cm offset is not automatically a 25 cm loss of usable height. |
| E2: studio layout markup | Five separately identified artwork proposals → layout revision | Two projections, a sculpture, five-photo series and a central installation | Artist-supplied dimensions; map left/back/right to A/B/C. Track the photo series' components after inventory confirmation. |
| E3: suspension photograph | Object-specific technical evidence and rigging plan | Possible suspended installation | Identify the depicted work, anchors, rated loads, hardware, clearances and responsible technical reviewer. A photograph is not engineering approval. |
| E4: SAF correspondence | Equipment requirements → existing paused allocation requests; separate freight request | Two projectors, two speakers, one reported 3-ton truck request | Supplier commitment, dates, projector/lens compatibility, image dimensions, vehicle/access suitability and backup. No claimed automatic throw calculation. |
| E5: intervention correspondence | Proposed condition report → scoped modification request → attributed consent and technical review | Reported coating and letter-securing discussion | Which artist/object, what precise method, who could authorize it, and whether approval covers that method. Do not mix Murat's condition evidence into this case. |

## Record handling

### Follow-up claims — revision 2

The latest user summary is registered as E6; the unprovided Sculpture Magazine interview is E7. The previous placement intents and intervention attribution remain in `claimHistory`. No original was received during this update.

- Reported layout: central freestanding *Between the Lines*, flanking direct-to-wall projections, and *Heavier Than Words* on a shelf between the Technologia projection and photographs. Exact wall IDs, measured coordinates and the relationship to the earlier suspension image remain unresolved.
- A **draft fixture ticket** targets *Heavier Than Words*, with `PENDING_ARTIST_APPROVAL`. This is not an ArtistStatus transition or a dispatched technical work order. Intentional rust and random letter arrangement are reported claims. Even a one-letter treatment needs scoped consent and an agreed technical/conservation method before execution; the sample photograph must then receive attributed artist approval before a batch proceeds. No sample or batch treatment is authorized.
- Cultural context is recorded separately from clearance. The reported Al-Ikhlas and hadith associations remain unverified; Az-Zumar 39:9 and the Jameel exhibition claim have unresolved object attribution. Do not copy the same combined text onto every artwork. Historical display or a published interview does not establish the institution's approval.
- HIP is not restored. Review belongs to the designated institutional compliance reviewer under Director-approved policy, with Committee input on curatorial context. No clearance decision, policy reference or reviewer signature has been fabricated.

These records persist in the isolated acceptance-test seed only. Production and working pilot ledgers are unchanged until originals are supplied and the claims are reconciled.

1. Register each original in restricted storage when supplied: immutable evidence ID, actual byte hash, source date, recorder, version and linked object. Keep email text and personal details outside general decision logs.
2. Verify each extracted claim against its source. Record discrepancies rather than overwriting the source. The `openQuestions` list supplies an owner and blocked action for every unresolved area.
3. Keep submitted placement intent separate from measured, reviewed layout coordinates. Preserve approval references to the exact reviewed revision.
4. Treat requested equipment, confirmed availability and technical suitability as separate facts. A queued request is not a booking.
5. Artist/studio consent and technical/conservation clearance are independent prerequisites for any physical intervention. The current fixture leaves both unresolved.

## Repeatable acceptance run

From the repository:

```powershell
node --import tsx --test tests/mounirGallery1.acceptance.test.mjs
```

The test creates a new isolated temporary repository on every run and calls the **existing unified backend controllers**, not a replacement workflow. It does not contact external services or alter the working pilot database. Temporary state is retained for inspection.

Only the three reported wall envelopes are reused. Projection dimensions (200 × 120 cm), A/C orientation assignments, bilingual test text and image bytes are explicitly invented **test inputs**, not claims about Fatmi's works. Floor and suspended works stay unplaced because the backend's rectangular wall model cannot validate them.

Acceptance checks: distinct identities for the two Technologia records; traceable claims; out-of-bounds and overlapping placements rejected without partial writes; unauthorized placement rejected; one projector and one speaker per synthetic projection queued without duplicate requests; publication blocked without required reviews; evidence mapping and layout survive repository reopening.

This validates a bounded intake/placement/request scenario. It does **not** certify full installation, insurance, consent, return, equipment procurement or engineering safety. Those need source verification and additional workflow implementation before the complete case can pass end-to-end.

## Source inspection — revision 3

The exact magazine filename was located in Downloads. The production-email ZIP contained artwork and bank-form attachments, not the email thread; the bank form was not opened. E7 now records the inspected magazine PDF and E8 the six-page technical sheet from the steel-letters attachment folder. Source hashes identify the local bytes; they do not certify authenticity or grant institutional approval.

**Material discrepancy:** Technical sheet page 2 specifies a cast-iron balance on a white pedestal (120 × 45 × 80 cm), randomly arranged letters on the upper tray, an empty lower tray and five weights in front. Magazine PDF page 9 (printed page 47) shows the balance-and-tray version. The reported later shelf instruction could be an amendment, but its email must be inspected before resolving the conflict. Pedestal dimensions are not artwork dimensions.

No inspected document establishes the coating permission, fixing authorization, sample approval or Directorate cultural-clearance decision. A studio explanation of religious references supports review; it cannot be recorded as a decision by an institutional official who has not made that decision. All execution/clearance flags remain false. Earlier revision-2 notes above are retained as history; E7's previous missing-file status has been superseded.
