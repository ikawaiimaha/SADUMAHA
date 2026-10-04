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
    default: return fail();
  }
  return { ...s, ...patch, version: s.version + 1, history: [...s.history, { actor: c.actor, action: `${c.type}${value ? ': ' + value : ''}${c.reason ? ' — ' + c.reason : ''}${c.type === 'PACK' ? ` · ${patch.packing!.owner} · AED ${c.amount}` : ''}`, at: c.at, version: s.version }] };
}

/** Recovery check for every collection demonstration, not authentication.
 * Replay the recorded handoffs through the same transition rules as new actions.
 * Closed legacy plans retain display history, but only the current plan can establish readiness.
 */
export function validCollectionDemo(value: unknown): value is CollectionDemo {
  const c = value as CollectionDemo | null;
  if (!c || !Number.isSafeInteger(c.version) || !Array.isArray(c.history)
    || c.version !== c.history.length + 1 || typeof c.date !== 'string') return false;
  const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
  const p = c.packing;
  if (p !== null && (!p || !text(p.specification) || !text(p.owner) || !Number.isFinite(p.amount) || p.amount < 0
    || typeof p.requiresTechnical !== 'boolean' || typeof p.technicalReason !== 'string'
    || typeof p.technicalReference !== 'string' || typeof p.costReference !== 'string' || typeof p.evidence !== 'string')) return false;
  if (!c.history.every(e => e && text(e.actor) && text(e.action) && typeof e.at === 'string' && Number.isFinite(Date.parse(e.at)))) return false;
  let lastPlan = -1, lastReopen = -1;
  c.history.forEach((e, i) => {
    if (e.action.startsWith('PACK: ')) lastPlan = i;
    if (e.action.startsWith('REOPEN: ')) lastReopen = i;
  });
  try {
    let restored = createCollectionDemo();
    for (const [index, e] of c.history.entries()) {
      const match = /^([A-Z]+)(?:: ([\s\S]+))?$/.exec(e.action);
      if (!match) return false;
      const type = match[1] as CollectionCommand['type'];
      let expectedAction = e.action;
      const command: CollectionCommand = { type, actor: e.actor, at: e.at, version: e.version, value: match[2] };
      if (type === 'ASSIGN') {
        const assignment = /^(Logistics [BC]) — ([\s\S]+)$/.exec(command.value ?? '');
        if (!assignment) return false;
        command.value = assignment[1]; command.reason = assignment[2];
      } else if (type === 'DATE') {
        const date = /^(\d{4}-\d{2}-\d{2})(?: — ([\s\S]+))?$/.exec(command.value ?? '');
        if (!date) return false;
        command.value = date[1]; command.reason = date[2];
      } else if (type === 'PACK') {
        const plan = /^([\s\S]+) · ([\s\S]+) · AED (\d+(?:\.\d+)?(?:e[+-]?\d+)?)$/.exec(command.value ?? '');
        if (!plan) return false;
        const active = index === lastPlan && lastPlan > lastReopen;
        if (active && !p) return false;
        // Older checkpoints kept surrounding owner whitespace in the display history.
        // Accept only that normalization difference, preserving the original entry.
        // Use the known prefix/suffix so separators inside names remain unambiguous.
        if (active) {
          const prefix = `PACK: ${p!.specification} · `, suffix = ` · AED ${p!.amount}`;
          if (!e.action.startsWith(prefix) || !e.action.endsWith(suffix)
            || e.action.slice(prefix.length, -suffix.length).trim() !== p!.owner) return false;
          expectedAction = `${prefix}${p!.owner}${suffix}`;
        } else {
          expectedAction = `PACK: ${plan[1]} · ${plan[2].trim()} · AED ${plan[3]}`;
        }
        // Current plan fields are authoritative within this synthetic checkpoint;
        // do not split a company name or specification that itself contains " · ".
        command.value = active ? p!.specification : plan[1];
        command.packingOwner = active ? p!.owner : plan[2]; command.amount = active ? p!.amount : Number(plan[3]);
        command.requiresTechnical = active ? p!.requiresTechnical : c.history[index + 1]?.action.startsWith('TECHNICAL: ') === true;
        // This placeholder is used only while checking a discarded historical plan.
        // It is never saved, displayed or used to clear a current hold.
        command.technicalReason = active ? p!.technicalReason : 'Closed legacy plan; original review policy not retained.';
      }
      restored = collectionTransition(restored, command);
      if (restored.history.at(-1)?.action !== expectedAction) return false;
    }
    if (restored.stage !== c.stage || restored.owner !== c.owner || restored.date !== c.date || restored.version !== c.version) return false;
    if (!restored.packing || !p) return restored.packing === p;
    return (Object.keys(restored.packing) as (keyof NonNullable<CollectionDemo['packing']>)[])
      .every(key => restored.packing![key] === p[key]);
  } catch { return false; }
}
export function collectionTask(s: CollectionDemo) {
  const owner = ['confirmed', 'unavailable'].includes(s.stage) ? 'Coordinator' : s.stage === 'technical-review' ? 'Technical' : s.stage === 'cost-review' ? 'Finance' : s.owner;
  const titles: Record<CollectionStage, string> = { confirmed: 'Confirm who will handle collection', unavailable: 'Assign a named backup', acceptance: 'Accept the handoff', pickup: 'Confirm a valid pickup date', packing: 'Resolve the missing packaging', 'technical-review': 'Review the packing specification', 'cost-review': 'Review the packing cost', 'pack-evidence': 'Check completed packing', ready: 'Collection ready for booking review' };
  const blockers: Record<CollectionStage, string> = { confirmed: 'Scenario: the primary officer is unavailable. Record the absence to begin the handoff.', unavailable: 'The original owner is unavailable.', acceptance: 'Assignment is pending acceptance; a CC is not an accepted handoff.', pickup: 'A date inside the collection window is required.', packing: 'The artwork has no packaging. A valid date alone does not make it ready.', 'technical-review': 'Specialist clearance is required; a cost approval cannot establish packing safety.', 'cost-review': 'Packing cost requires a separate Finance decision, including zero-cost arrangements.', 'pack-evidence': 'Approved cost is not proof that packing is complete.', ready: 'No transport booking or physical collection has been recorded.' };
  const readiness = collectionReadiness({ details: true, conflict: false, confirmed: true, planned: !!s.date, accepted: !['confirmed','unavailable','acceptance'].includes(s.stage), packing: s.packing });
  return { owner, title: titles[s.stage], blocker: ['packing','technical-review','cost-review','pack-evidence'].includes(s.stage) ? readiness.blocker : blockers[s.stage] };
}
