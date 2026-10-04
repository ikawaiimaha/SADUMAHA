import { createCollectionDemo, collectionTransition, collectionTask, pickupError, type CollectionDemo, type CollectionCommand } from './collectionReadiness';
import { packingStage } from '../logistics/collectionRules.mjs';
import { createPublishingRecord, reducePublishingRecord, PRINT_ROUTE_ID, type PublishingRecord } from './publishingRecord';

const preparedAt = '2026-10-03T09:00:00Z';
export type GuidedCommand = 'ASSIGN' | 'ACCEPT' | 'DATE' | 'PREPARE_PACKING' | 'COMPLETE_PACKING';
export interface GuidedSession {
  scene: number;
  language: 'ar' | 'en';
  paused: boolean;
  collection: CollectionDemo;
  print: PublishingRecord;
}
export function preparedPrint(): PublishingRecord {
  let s = createPublishingRecord();
  // Preserve a previously approved version, then create and approve its successor.
  for (let version = 1; version <= 2; version++) {
    s = reducePublishingRecord(s, { type: 'ATTACH_PRINT_PROOF', actor: 'COORDINATOR', at: preparedAt });
    s = reducePublishingRecord(s, { type: 'ROUTE_PRINT_PROOF', actor: 'PUBLISHING_MANAGER', at: preparedAt, version, editorialChecked: true, rightsChecked: true, route: PRINT_ROUTE_ID });
    s = reducePublishingRecord(s, { type: 'DECIDE_PRINT_PROOF', actor: 'CHAIRMAN', at: preparedAt, version, outcome: 'release', acknowledged: true });
  }
  return reducePublishingRecord(s, { type: 'RECORD_PRINT_DISPATCH', actor: 'PUBLISHING_MANAGER', at: preparedAt, version: 2 });
}
export const createGuidedSession = (): GuidedSession => ({
  scene: 0, language: 'ar', paused: false,
  collection: collectionTransition(createCollectionDemo(), { type: 'ABSENT', actor: 'Coordinator', version: 1, at: preparedAt }),
  print: preparedPrint(),
});
export function guidedCollection(s: CollectionDemo, command: GuidedCommand, at: string, date?: string): CollectionDemo {
  const run = (record: CollectionDemo, type: CollectionCommand['type'], fields: Partial<CollectionCommand> = {}) =>
    collectionTransition(record, { type, actor: collectionTask(record).owner, version: record.version, at, ...fields });
  switch (command) {
    case 'ASSIGN': return run(s, 'ASSIGN', { value: 'Logistics B', reason: 'Prepared synthetic reason: primary officer on leave.' });
    case 'ACCEPT': return run(s, 'ACCEPT');
    case 'DATE': return run(s, 'DATE', { value: date });
    case 'PREPARE_PACKING': {
      // Explicit fixture action, not a bypass: each required authority is recorded by the shared rules.
      if (s.stage !== 'packing') throw new Error('Packing fixture is not available at this stage.');
      let next = run(s, 'PACK', { value: 'Prepared custom crate and protective supports', packingOwner: 'Demo packing contractor', amount: 1200, requiresTechnical: true });
      next = run(next, 'TECHNICAL', { value: 'GUIDED-SYNTHETIC-TECH-01' });
      return run(next, 'COST', { value: 'GUIDED-SYNTHETIC-FINANCE-01' });
    }
    case 'COMPLETE_PACKING': return run(s, 'EVIDENCE', { value: 'GUIDED-SYNTHETIC-PACKING-CHECK-01' });
  }
}
export function acknowledgeGuidedProof(s: PublishingRecord, version: number, at: string): PublishingRecord {
  return reducePublishingRecord(s, { type: 'ACKNOWLEDGE_PRINT_PROOF', actor: 'PUBLISHING_MANAGER', at, version, reference: 'GUIDED-SYNTHETIC-SUPPLIER-02', evidence: { source: 'Portal', sender: 'Synthetic print supplier', receivedAt: at } });
}
export function canAdvanceGuided(s: GuidedSession): boolean {
  if (s.paused || s.scene >= 5) return false;
  if (s.scene === 1) return !['confirmed', 'unavailable', 'acceptance'].includes(s.collection.stage);
  if (s.scene === 2) return s.collection.stage === 'ready';
  if (s.scene === 3) return s.print.supplierAck?.version === s.print.version;
  return true;
}
// Keep stored scene IDs stable; print is an optional detour after the collection story.
export const guidedMainScenes = [0, 1, 2, 4, 5] as const;
export function guidedNavigation(s: GuidedSession): { previous: number | null; next: number | null } {
  if (s.paused) return { previous: null, next: null };
  if (s.scene === 3) return { previous: 4, next: 4 };
  const index = guidedMainScenes.findIndex(scene => scene === s.scene);
  return {
    previous: guidedMainScenes[index - 1] ?? null,
    next: canAdvanceGuided(s) ? guidedMainScenes[index + 1] ?? null : null,
  };
}
export function navigateGuidedSession(s: GuidedSession, scene: number): GuidedSession {
  const { previous, next } = guidedNavigation(s);
  const optionalPrint = !s.paused && s.scene === 4 && scene === 3;
  return scene === previous || scene === next || optionalPrint ? { ...s, scene } : s;
}
export function validGuidedSession(value: unknown): value is GuidedSession {
  const v = value as GuidedSession | undefined;
  if (!v || !Number.isInteger(v.scene) || v.scene < 0 || v.scene > 5 || !['ar', 'en'].includes(v.language) || typeof v.paused !== 'boolean') return false;
  const c = v.collection, p = v.print;
  if (!validCollectionCheckpoint(c)) return false;
  if (v.scene === 2 && ['unavailable', 'acceptance'].includes(c.stage)) return false;
  if (v.scene >= 3 && c.stage !== 'ready') return false;
  return !!p && p.version === 2 && Array.isArray(p.previous) && Array.isArray(p.proofs) && p.decision?.version === 2 && p.dispatch?.version === 2 && (!p.supplierAck || p.supplierAck.version === 2);
}

// Validate restored presentation data before any date formatting or task rendering.
// This is recovery validation, never authentication or institutional authorization.
function validCollectionCheckpoint(c: CollectionDemo | undefined): c is CollectionDemo {
  if (!c || !['unavailable', 'acceptance', 'pickup', 'packing', 'pack-evidence', 'ready'].includes(c.stage)
    || !Number.isInteger(c.version) || !Array.isArray(c.history) || !['Logistics A', 'Logistics B'].includes(c.owner)
    || typeof c.date !== 'string' || c.version !== c.history.length + 1 || !c.history.length) return false;
  const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
  if (!c.history.every((entry, index) => entry && ['Coordinator', 'Logistics A', 'Logistics B', 'Technical', 'Finance'].includes(entry.actor)
    && text(entry.action) && typeof entry.at === 'string' && Number.isFinite(Date.parse(entry.at)) && entry.version === index + 1)) return false;
  const recorded = (actor: string, action: string) => c.history.some(entry => entry.actor === actor && entry.action === action);
  if (!recorded('Coordinator', 'ABSENT')) return false;
  if (c.stage === 'unavailable' ? c.owner !== 'Logistics A' : c.owner !== 'Logistics B') return false;
  if (!['unavailable', 'acceptance'].includes(c.stage) && !recorded(c.owner, 'ACCEPT')) return false;
  const needsDate = ['packing', 'pack-evidence', 'ready'].includes(c.stage);
  if (needsDate ? !!pickupError(c.date) || !recorded(c.owner, `DATE: ${c.date}`) : c.date !== '') return false;
  if (!['pack-evidence', 'ready'].includes(c.stage)) return c.packing === null;
  const packing = c.packing;
  if (!packing || !text(packing.specification) || !text(packing.owner) || !Number.isFinite(packing.amount) || packing.amount < 0
    || typeof packing.requiresTechnical !== 'boolean' || typeof packing.technicalReason !== 'string'
    || typeof packing.technicalReference !== 'string' || !text(packing.costReference) || typeof packing.evidence !== 'string') return false;
  if (packing.requiresTechnical ? !text(packing.technicalReference) || !recorded('Technical', `TECHNICAL: ${packing.technicalReference}`) : !text(packing.technicalReason)) return false;
  if (!recorded('Finance', `COST: ${packing.costReference}`) || packingStage(packing) !== c.stage) return false;
  return c.stage !== 'ready' || (text(packing.evidence) && recorded(c.owner, `EVIDENCE: ${packing.evidence}`));
}
