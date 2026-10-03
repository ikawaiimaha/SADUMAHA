// Synthetic presentation only. No transport booking or financial execution.
import { packingTransition, packingStage, collectionReadiness } from '../logistics/collectionRules.mjs';
export const backupOfficers = ['Logistics B', 'Logistics C'];
export function pickupError(date: string): string {
  if (!/^2026-10-(0[1-9]|[12]\d|3[01])$/.test(date)) return 'Choose a date from 1–31 October 2026.';
  if (date >= '2026-10-10' && date <= '2026-10-15') return 'The gallery is closed 10–15 October, inclusive. Choose another date.';
  return '';
}
export type CollectionStage = 'confirmed' | 'unavailable' | 'acceptance' | 'pickup' | 'packing' | 'technical-review' | 'cost-review' | 'pack-evidence' | 'ready';
export interface CollectionDemo {
  version: number; stage: CollectionStage; owner: string; date: string;
  packing: { specification: string; owner: string; amount: number; requiresTechnical: boolean; technicalReason: string; technicalReference: string; costReference: string; evidence: string } | null;
  history: { actor: string; action: string; at: string; version: number }[];
}
export const createCollectionDemo = (): CollectionDemo => ({ version: 1, stage: 'confirmed', owner: 'Logistics A', date: '', packing: null, history: [] });
export type CollectionCommand = { type: 'ABSENT' | 'ASSIGN' | 'ACCEPT' | 'DATE' | 'PACK' | 'TECHNICAL' | 'COST' | 'EVIDENCE' | 'REOPEN'; actor: string; version: number; at: string; value?: string; reason?: string; amount?: number; packingOwner?: string; requiresTechnical?: boolean; technicalReason?: string };
export function collectionTransition(s: CollectionDemo, c: CollectionCommand): CollectionDemo {
  if (c.version !== s.version) throw new Error('This record changed. Review the current task before continuing.');
  if (!Number.isFinite(Date.parse(c.at))) throw new Error('A valid recording time is required.');
  const fail = () => { throw new Error('This action is not available to this owner at the current step.'); };
  const value = c.value?.trim() ?? '';
  let patch: Partial<CollectionDemo>;
  switch (c.type) {
    case 'ABSENT':
      if (s.stage !== 'confirmed' || c.actor !== 'Coordinator') return fail();
      patch = { stage: 'unavailable' }; break;
    case 'ASSIGN':
      if (!['unavailable', 'acceptance'].includes(s.stage) || c.actor !== 'Coordinator' || !backupOfficers.includes(value) || !c.reason?.trim()) return fail();
      patch = { stage: 'acceptance', owner: value }; break;
    case 'ACCEPT':
      if (s.stage !== 'acceptance' || c.actor !== s.owner) return fail();
      patch = { stage: 'pickup' }; break;
    case 'DATE':
      if (s.stage !== 'pickup' || c.actor !== s.owner) return fail();
      if (pickupError(value)) throw new Error(pickupError(value));
      patch = { date: value, stage: 'packing' }; break;
    case 'PACK':
    case 'TECHNICAL':
    case 'COST':
    case 'EVIDENCE':
    case 'REOPEN': {
      if (!['packing', 'technical-review', 'cost-review', 'pack-evidence', 'ready'].includes(s.stage)) return fail();
      const role = c.actor === s.owner ? 'Logistics' : c.actor;
      const packing = packingTransition(s.packing, { ...c, requiresTechnical: c.requiresTechnical ?? true }, role);
      patch = { packing, stage: packingStage(packing) as CollectionStage }; break;
    }
  }
  return { ...s, ...patch, version: s.version + 1, history: [...s.history, { actor: c.actor, action: `${c.type}${value ? ': ' + value : ''}${c.reason ? ' — ' + c.reason : ''}${c.type === 'PACK' ? ` · ${c.packingOwner} · AED ${c.amount}` : ''}`, at: c.at, version: s.version }] };
}
export function collectionTask(s: CollectionDemo) {
  const owner = ['confirmed', 'unavailable'].includes(s.stage) ? 'Coordinator' : s.stage === 'technical-review' ? 'Technical' : s.stage === 'cost-review' ? 'Finance' : s.owner;
  const titles: Record<CollectionStage, string> = { confirmed: 'Confirm who will handle collection', unavailable: 'Assign a named backup', acceptance: 'Accept the handoff', pickup: 'Confirm a valid pickup date', packing: 'Resolve the missing packaging', 'technical-review': 'Review the packing specification', 'cost-review': 'Review the packing cost', 'pack-evidence': 'Check completed packing', ready: 'Collection ready for booking review' };
  const blockers: Record<CollectionStage, string> = { confirmed: 'Scenario: the primary officer is unavailable. Record the absence to begin the handoff.', unavailable: 'The original owner is unavailable.', acceptance: 'Assignment is pending acceptance; a CC is not an accepted handoff.', pickup: 'A date inside the collection window is required.', packing: 'The artwork has no packaging. A valid date alone does not make it ready.', 'technical-review': 'Specialist clearance is required; a cost approval cannot establish packing safety.', 'cost-review': 'Packing cost requires a separate Finance decision, including zero-cost arrangements.', 'pack-evidence': 'Approved cost is not proof that packing is complete.', ready: 'No transport booking or physical collection has been recorded.' };
  const readiness = collectionReadiness({ details: true, conflict: false, confirmed: true, planned: !!s.date, accepted: !['confirmed','unavailable','acceptance'].includes(s.stage), packing: s.packing });
  return { owner, title: titles[s.stage], blocker: ['packing','technical-review','cost-review','pack-evidence'].includes(s.stage) ? readiness.blocker : blockers[s.stage] };
}
