# Loading dock receiving — 29 September 2026

The active LogisticsWorkspace now shows a primary Loading Dock Receiving module. It accepts the current revision's packing-slip QR/ID, then requires positive finite packed dimensions, gross weight, an explicit Match/Tampered seal selection and Intact/Minor Damage/Severe Damage condition. No guessed demo ID grants clearance.

Arrival and condition are recorded atomically in the session reducer. Damage or tampering requires photo evidence and retains the existing damage/insurance hold. Legacy receipts can receive an immutable supplemental measurement inspection; their existing condition report remains required. Closed, archived, impounded, duplicate and stale-revision actions are rejected.

App.tsx wires handleClearPhysicalAsset through LogisticsWorkspace and mirrors validated evidence into VettedArtist.physicalAssetCleared. The flag resets when receipt/revision evidence changes. Finance requires both the flag and reducer-validated inspection for post-arrival payments. Advance prerequisites remain unchanged. Delivery percentages follow the agreement rather than inventing a fixed 30%; completion still additionally requires exhibition close-out and reconciliation.

New fleet requests use verified dock measurements. Pending fleet requests with conflicting measurements are marked superseded, preserving historical values. In-transit records are retained unchanged.

The alternative LogisticsDashboard accepts the same state/callback props; without them it displays a routing explanation rather than fabricating a disconnected financial clearance. Active App routing uses LogisticsWorkspace.

Verification: TypeScript, production build and 106 guard tests passed. Tests cover invalid dimensions/NaN, tampered seals, missing damage evidence, stale tokens/revisions, repeat actions, intact clearance, separate completion gates and superseded fleet measurements. Existing bundle-size warning remains. No new browser E2E run was performed for this change.

Scope: session rehearsal state only, including photo Files; no Supabase migration, hosted payment integration or live camera scanning. Keyboard barcode scanners/manual ID entry are supported.
