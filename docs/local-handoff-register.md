# Local source-linked handoff register

The collection and print demonstrations can display case evidence without treating a
message as a decision. In a development or local rehearsal build, expand **Case sources — local review**
(**مصادر الحالة — للمراجعة المحلية**) and choose a prepared register JSON. The guided
Arabic presentation uses the same component. It initially shows entries related to
the current step; **Show the full register** exposes other workstreams.

Each entry contains a source locator and excerpt, affected works, requested action,
proposed owner and assignment status, conditions, acknowledgment, missing evidence,
and an explicit boundary between the reported case and the synthetic example.

## Boundaries

- This is a reference overlay, not an operational inbox or evidence-verification service.
- It reads a selected JSON file in component memory. It performs no network request,
  checkpoint write, assignment, acknowledgment, or state transition.
- Resetting the demonstration does not edit the register. Remove unloads it; refreshing
  the page also unloads it. The original file is unchanged.
- The panel has `data-private` so the existing local replay recorder excludes its DOM.
- The standard production build excludes the panel; the local rehearsal config enables
  it explicitly, and the component also requires a loopback hostname.
  Private files belong under ignored `.local/`,
  never `public/`, tracked fixtures, or application imports.
- Source digests identify file versions. They do not authenticate email authorship,
  approvals, legal authority or completeness. Summary extracts remain secondary evidence.
- A recorded contact is not an accepted task; a received file is not an approved proof;
  a reported reply is not a verified, scoped decision.

## Model and integration

`src/data/handoffRegister.ts` validates version 1 JSON and projects only reference
fields. It rejects dangling references, duplicate IDs, oversized files and unsupported
acknowledgment values. `LocalHandoffRegister` handles invalid files and racing reads.
`PitchCollectionDemo`, `GuidedPresentation`, and `PitchPrintDemo` mount it only in DEV
or with the local rehearsal config's `VITE_LOCAL_SOURCE_REGISTER` flag.
Collection stages select handoff, pickup or packing references; the print scene selects
print references. No new ThemeStatus, ArtistStatus, approval or permission is added.

## Repeatable checks

From the repository root:

```powershell
node --import tsx --test tests/handoffRegister.test.ts tests/collectionReadiness.test.ts tests/guidedPresentation.test.ts tests/printRelease.test.ts
npx tsc --noEmit
```

Private case preparation additionally checks each quoted line range/JSON pointer and
source digest. Originals must be reviewed separately before any operational approval.
