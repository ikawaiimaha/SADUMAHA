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

export function reducePublishingRecord(state: PublishingRecord, action: PublishingAction): PublishingRecord {
  if (!Number.isFinite(Date.parse(action.at))) return state;
  if (action.type === 'ATTACH_PRINT_PROOF') {
    if (action.actor !== 'COORDINATOR' || (state.dispatch && !state.correction?.stopReference)) return state;
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
