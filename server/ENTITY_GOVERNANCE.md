# Fictional entity revisions and change impacts

Implemented 29 September 2026. Local rehearsal only; no production migration or external provider activation.

## Persistence and identity

The existing review JSON file now contains relational collections: `entities`, `revisions`, `decisions`, `approvals`, and `impacts`. See `schemas/entity-governance.schema.json` and `src/governance/ports.ts`. Entity rows contain a UUID, kind, and current revision pointer, not editable content. Each revision has its own UUID, entity foreign key, parent hash, SHA-256 version hash and content snapshot. The hash covers canonical entity ID, parent hash and content. Identical saves create no duplicate content revision. Reverting content creates a new linked version.

The existing numbered review rounds remain compatibility projections. Every subsequent content save adds an immutable graph snapshot even within the same draft round. Approval transitions refer to the current entity hash. Revision creation, decision logging, impact changes and existing review writes share one serialized atomic file commit; failed PDF generation still rolls everything back. Use one server process per file.

Legacy files receive one current baseline with a new persistent artwork UUID on opening. The actor is `system-local-migration` and purpose is `BASELINE_CAPTURE`. Earlier overwritten draft states cannot be recovered, and earlier approvals are not fabricated. Existing history and PDFs remain unchanged. The new graph is application-append-only for revision content; it is not a cryptographically signed or administrator-proof audit archive.

Shipment responses expose the artwork UUID and unresolved Logistics impacts. New shipment snapshots also store artwork UUID and version hash. Existing physical crate IDs and printed QR codes remain valid. Wall-study samples and the browser checklist are still separate fixtures; this change does not falsely merge them with the commissioned sculpture.

## Decision minimization

New decisions contain only ID, server actor ID, action type, entity UUID, version hash, controlled purpose code and server timestamp. No raw command, free-text rationale, before/after payload, document, name or contact profile is copied into this collection. Unknown governance command fields are rejected. Purpose is an enum, not a redacted free-text field. Existing narrative workflow notes remain separate fictional records; this does not retrospectively sanitize them or claim to identify PII inside arbitrary artwork text.

## Dependency matrix

| Entity fields changed | Affected review domains |
|---|---|
| Artwork dimensions | Technical, Logistics, Publication |
| Artwork title, concept, display name | Editorial, Publication |
| Artwork year or profile URL | Publication |
| Contract scope or linked artwork | Finance, Logistics |
| Contract amount, currency, terms version | Finance |

An affected approved clearance becomes `STALE`. An impact without prior approval is `REQUIRES_RE_APPROVAL`. Unrelated approvals remain valid for their scoped dependencies. Reapproval records a new decision against the current hash, preserves the prior clearance and resolves the domain's pending impacts. A reversion does not automatically reinstate approval. Revision requests separately invalidate editorial/publication approval in the existing review loop. Historical physical observations and original manifests are not erased. No impact is a payment instruction or technical certification.

## API

All routes inherit the existing loopback, same-origin, session and exhibition restrictions.

- `GET /api/review/governance`: current version, stable identities, revision metadata, decisions, approvals and impact array. No revision payloads in this overview.
- `GET /api/review/entities/:id`: scoped entity and immutable content revisions.
- `POST /api/review/governance`: `create_contract`, `revise_contract`, or `record_clearance`. Every command requires the current global `version`; existing entities also require `entityId` and `expectedHash`.
- `GET /api/review/record` includes the same governance projection. `GET /api/review/logistics` includes unresolved Logistics impacts. These are backend dashboard contracts; no new visual impact panel is claimed.

Only the fictional Coordinator records contract terms and sample specialist evidence through this API. The endpoint does not appoint a real specialist, signer or Finance approver. Artist artwork edits continue through the existing guarded save/revision workflow; Director publication continues through executive review. Director cannot use the new draft/history endpoints. All accounts remain simulations.

Example contract payload (substitute IDs and version from the GET response):

```json
{
  "action": "create_contract",
  "version": 12,
  "purpose": "CONTRACT_UPDATE",
  "content": {
    "artworkId": "<existing artwork UUID>",
    "scope": "Fictional loan",
    "amount": 45000,
    "currency": "AED",
    "termsVersion": "demo-v1"
  }
}
```

For a sample clearance use `action: record_clearance`, the entity ID/current hash, `domain: Technical` (or Logistics/Finance where supported), and `purpose: FICTIONAL_SPECIALIST_REVIEW`. Contracts are operational demo terms, not signed or generated legal documents. No real signature prerequisite has been invented.

## Ports and local adapters

`IAuthProvider`, `IStorageProvider` and `ISignatureProvider` define provider-neutral TypeScript contracts. The server uses `LocalAuthProvider` for its existing fictional session flow (expiry, revocation and bounded sessions). `npm run start:rehearsal` uses the installed tsx loader. External auth mode is rejected while integrations are paused.

The storage adapter keeps copied synthetic bytes in memory with owner/exhibition scope and a digest. It is deliberately not an encrypted vault or an upload endpoint. The signing adapter produces `SIMULATED_NOT_SIGNED` receipts bound to entity/hash; verification always returns `valid: false`. Neither is used to manufacture a contract signature or real clearance. No vendor URLs or credentials are configured.

## Verification

`npm run build:rehearsal` includes TypeScript and the regression suites. Added tests cover immutable snapshots and reopen, no-op saves, selective invalidation, explicit reapproval, safe decision fields, role isolation, contract relations, stale/concurrent writes, legacy baseline migration, HTTP access controls, session revocation, storage isolation and simulated signatures.

## Automatic sources and future communications (30 September 2026)

New decision rows carry server-assigned `sourceType: SADU_Portal`; baseline capture uses `SYSTEM_MIGRATION`. Legacy rows retain their original absence of a source rather than inventing provenance. Accepted submission, no-change draft-save, theme extraction and profile-review actions now also generate operational decision entries. Failed/stale commands do not commit a log. Frontend calls the authorized action endpoint; it cannot independently forge an approval by posting a log. Raw payloads and IP addresses are not copied into the decision collection.

The browser-only 14-task journey offers native portal completion after responsible-desk, evidence and prerequisite checks. It creates the simulated statement/confirmation automatically and persists through the existing session journal. It cannot bypass a pending/disputed external statement. WhatsApp / Instant Messaging is available in the manual fallback; SADU_Portal is shown as an automatic-only option and rejected by the manual reducer. Browser desk/time remain simulation data, distinct from server actor/time.

`ICommunicationAdapter` and `server/communication-ingestion.mjs` prepare an ingestion boundary: trusted verification, explicit provider-account/channel-to-dossier binding, duplicate-event handling, conflicting-delivery rejection and opaque evidence references. Imported messages are `RECEIVED_UNREVIEWED`, never approvals. The local test service takes a caller-owned receipt collection; production verification, durable evidence storage, transactional receipt persistence and sender/dossier enrollment remain unimplemented. `POST /api/review/ingestion/:channel` is deliberately disabled (503 for a local authenticated caller; existing access checks still apply). No WhatsApp, email address, Graph subscription or public webhook is provisioned.
