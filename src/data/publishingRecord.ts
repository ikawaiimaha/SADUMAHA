import type { DemoActor } from './livingRecord';

export const PRINT_CASE_ID = 'DEMO-PUB-01';
export const PRINT_ROUTE_ID = 'DEMO-ROUTE-PRINT-01'; // Proposed route, never an institutional delegation.
export interface SupplierEvidence { source: 'Email' | 'WhatsApp' | 'Portal' | 'Verbal'; sender: string; receivedAt: string }
export interface PublishingRecord {
  version: number;
  proofs: { version: number; actor: DemoActor; at: string }[];
  review: { version: number; actor: DemoActor; at: string; route: string } | null;
  decision: { version: number; actor: DemoActor; at: string; outcome: 'release' | 'return' } | null;
  dispatch: { version: number; actor: DemoActor; at: string } | null;
  supplierAck: { version: number; actor: DemoActor; at: string; reference: string; evidence?: SupplierEvidence } | null;
  production: { version: number; actor: DemoActor; at: string; completedAt?: string; completionReference?: string } | null;
  correction: { version: number; actor: DemoActor; at: string; reason: string; stopReference: string; stopActor?: DemoActor; stopAt?: string } | null;
  previous: Omit<PublishingRecord, 'previous'>[];
}
type Envelope = { actor: DemoActor; at: string };
export type PublishingAction =
  | ({ type: 'ATTACH_PRINT_PROOF' } & Envelope)
  | ({ type: 'ROUTE_PRINT_PROOF'; version: number; editorialChecked: boolean; rightsChecked: boolean; route: string } & Envelope)
  | ({ type: 'DECIDE_PRINT_PROOF'; version: number; acknowledged: boolean; outcome: 'release' | 'return' } & Envelope)
  | ({ type: 'RECORD_PRINT_DISPATCH'; version: number } & Envelope)
  | ({ type: 'ACKNOWLEDGE_PRINT_PROOF' | 'COMPLETE_PRINT'; version: number; reference: string; evidence?: SupplierEvidence } & Envelope)
  | ({ type: 'START_PRINT'; version: number } & Envelope)
  | ({ type: 'CONFIRM_PRINT_STOP'; version: number; reference: string } & Envelope)
  | ({ type: 'REQUEST_PRINT_CORRECTION'; version: number; reason: string; stopReference: string } & Envelope);

export const createPublishingRecord = (): PublishingRecord => ({ version: 0, proofs: [], review: null, decision: null, dispatch: null, supplierAck: null, production: null, correction: null, previous: [] });

export const canReplacePrintProof = (state: Pick<PublishingRecord, 'dispatch' | 'correction'>) =>
  !state.dispatch || Boolean(state.correction?.stopReference);

/** Shared recovery boundary for the guided example and the print workspace.
 * A stored status cannot substitute for its revision-specific prerequisite records.
 */
export function validPublishingRecord(value: unknown): value is PublishingRecord {
  const p = value as PublishingRecord | null;
  const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
  const time = (v: unknown): v is string => typeof v === 'string' && Number.isFinite(Date.parse(v));
  if (!p || !Number.isSafeInteger(p.version) || p.version < 0 || !Array.isArray(p.proofs)
    || !Array.isArray(p.previous) || p.proofs.length !== p.version || p.previous.length !== Math.max(0, p.version - 1)) return false;
  const entry = (v: unknown, version: number, actor: DemoActor) => {
    const e = v as Envelope & { version: number } | null;
    return !!e && e.version === version && e.actor === actor && time(e.at);
  };
  if (!p.proofs.every((proof, i) => entry(proof, i + 1, 'COORDINATOR'))) return false;
  function snapshot(s: Omit<PublishingRecord, 'previous'>, version: number): boolean {
    if (!s || s.version !== version || !Array.isArray(s.proofs) || s.proofs.length !== version
      || !s.proofs.every((proof, i) => entry(proof, i + 1, 'COORDINATOR') && proof.at === p!.proofs[i].at)) return false;
    if (!version) return [s.review, s.decision, s.dispatch, s.supplierAck, s.production, s.correction].every(v => v === null);
    if (s.review !== null && (!entry(s.review, version, 'PUBLISHING_MANAGER') || s.review.route !== PRINT_ROUTE_ID)) return false;
    if (s.decision !== null && (!s.review || !entry(s.decision, version, 'CHAIRMAN') || !['release', 'return'].includes(s.decision.outcome))) return false;
    if (s.dispatch !== null && (s.decision?.outcome !== 'release' || !entry(s.dispatch, version, 'PUBLISHING_MANAGER'))) return false;
    if (s.supplierAck !== null) {
      if (!s.dispatch || !entry(s.supplierAck, version, 'PUBLISHING_MANAGER') || !text(s.supplierAck.reference)) return false;
      const evidence = s.supplierAck.evidence;
      if (evidence !== undefined && (!evidence || !['Email', 'WhatsApp', 'Portal', 'Verbal'].includes(evidence.source)
        || !text(evidence.sender) || !time(evidence.receivedAt) || Date.parse(evidence.receivedAt) > Date.parse(s.supplierAck.at))) return false;
    }
    if (s.production !== null) {
      if (!s.supplierAck || !entry(s.production, version, 'PUBLISHING_MANAGER')) return false;
      if (s.production.completedAt !== undefined || s.production.completionReference !== undefined) {
        if (!time(s.production.completedAt) || !text(s.production.completionReference)) return false;
      }
    }
    if (s.correction !== null) {
      const c = s.correction;
      if ((!entry(c, version, 'COORDINATOR') && !entry(c, version, 'PUBLISHING_MANAGER')) || !text(c.reason) || typeof c.stopReference !== 'string') return false;
      if (c.stopReference ? !text(c.stopReference) || !s.dispatch || c.stopActor !== 'PUBLISHING_MANAGER' || !time(c.stopAt)
        : c.stopActor !== undefined || c.stopAt !== undefined) return false;
    }
    return true;
  }
  return snapshot(p, p.version) && p.previous.every((old, i) => snapshot(old, i + 1) && canReplacePrintProof(old));
}

export function reducePublishingRecord(state: PublishingRecord, action: PublishingAction): PublishingRecord {
  if (!Number.isFinite(Date.parse(action.at))) return state;
  if (action.type === 'ATTACH_PRINT_PROOF') {
    if (action.actor !== 'COORDINATOR' || !canReplacePrintProof(state)) return state;
    const version = state.version + 1;
    const { previous, ...snapshot } = state;
    return { ...createPublishingRecord(), version, proofs: [...state.proofs, { version, actor: action.actor, at: action.at }], previous: state.version ? [...previous, snapshot] : previous };
  }
  if (!state.version || action.version !== state.version) return state;
  if (action.type === 'CONFIRM_PRINT_STOP') {
    if (action.actor !== 'PUBLISHING_MANAGER' || !state.dispatch || !state.correction || state.correction.stopReference || !action.reference.trim()) return state;
    return { ...state, correction: { ...state.correction, stopReference: action.reference.trim(), stopActor: action.actor, stopAt: action.at } };
  }
  if (state.correction) return state;
  switch (action.type) {
    case 'ROUTE_PRINT_PROOF':
      if (action.actor !== 'PUBLISHING_MANAGER' || state.review || state.decision || !action.editorialChecked || !action.rightsChecked || action.route !== PRINT_ROUTE_ID) return state;
      return { ...state, review: { version: action.version, actor: action.actor, at: action.at, route: action.route } };
    case 'DECIDE_PRINT_PROOF':
      if (action.actor !== 'CHAIRMAN' || !action.acknowledged || state.decision || state.review?.version !== action.version || state.review.route !== PRINT_ROUTE_ID) return state;
      return { ...state, decision: { version: action.version, actor: action.actor, at: action.at, outcome: action.outcome } };
    case 'RECORD_PRINT_DISPATCH':
      if (action.actor !== 'PUBLISHING_MANAGER' || state.dispatch || state.decision?.outcome !== 'release' || state.decision.version !== action.version) return state;
      return { ...state, dispatch: { version: action.version, actor: action.actor, at: action.at } };
    case 'ACKNOWLEDGE_PRINT_PROOF':
      if (action.actor !== 'PUBLISHING_MANAGER' || !state.dispatch || state.supplierAck || !action.reference.trim()) return state;
      if (action.evidence && (!['Email', 'WhatsApp', 'Portal', 'Verbal'].includes(action.evidence.source) || !action.evidence.sender.trim() || !Number.isFinite(Date.parse(action.evidence.receivedAt)) || Date.parse(action.evidence.receivedAt) > Date.parse(action.at))) return state;
      return { ...state, supplierAck: { version: action.version, actor: action.actor, at: action.at, reference: action.reference.trim(), evidence: action.evidence ? { ...action.evidence } : undefined } };
    case 'START_PRINT':
      if (action.actor !== 'PUBLISHING_MANAGER' || state.supplierAck?.version !== action.version || state.production) return state;
      return { ...state, production: { version: action.version, actor: action.actor, at: action.at } };
    case 'COMPLETE_PRINT':
      if (action.actor !== 'PUBLISHING_MANAGER' || !state.production || state.production.completedAt || !action.reference.trim()) return state;
      return { ...state, production: { ...state.production, completedAt: action.at, completionReference: action.reference.trim() } };
    case 'REQUEST_PRINT_CORRECTION':
      // A defect immediately holds internal progression; stopping the supplier is a separate fact.
      if (!['COORDINATOR', 'PUBLISHING_MANAGER'].includes(action.actor) || !action.reason.trim()) return state;
      return { ...state, correction: { version: action.version, actor: action.actor, at: action.at, reason: action.reason.trim(), stopReference: '' } };
  }
}

export function selectPublishingRecord(state: PublishingRecord) {
  const queued = Boolean(!state.correction && state.review && state.review.version === state.version && !state.decision);
  const stage = state.correction ? 'correction' : state.production?.completedAt ? 'completed' : state.production ? 'printing' : state.supplierAck ? 'acknowledged' : state.dispatch ? 'sent' : state.decision?.outcome === 'release' ? 'released' : state.decision?.outcome === 'return' ? 'returned' : queued ? 'executive-review' : state.version ? 'manager-review' : 'drafting';
  return { queued, stage, reference: `${PRINT_CASE_ID}/v${state.version}`, route: PRINT_ROUTE_ID };
}
