import type { DemoActor } from './livingRecord';

export const PRINT_CASE_ID = 'DEMO-PUB-01';
export const PRINT_ROUTE_ID = 'DEMO-ROUTE-PRINT-01'; // Proposed route, never an institutional delegation.
export interface PublishingRecord {
  version: number;
  proofs: { version: number; actor: DemoActor; at: string }[];
  review: { version: number; actor: DemoActor; at: string; route: string } | null;
  decision: { version: number; actor: DemoActor; at: string; outcome: 'release' | 'return' } | null;
  dispatch: { version: number; actor: DemoActor; at: string } | null;
}
type Envelope = { actor: DemoActor; at: string };
export type PublishingAction =
  | ({ type: 'ATTACH_PRINT_PROOF' } & Envelope)
  | ({ type: 'ROUTE_PRINT_PROOF'; version: number; editorialChecked: boolean; rightsChecked: boolean; route: string } & Envelope)
  | ({ type: 'DECIDE_PRINT_PROOF'; version: number; acknowledged: boolean; outcome: 'release' | 'return' } & Envelope)
  | ({ type: 'RECORD_PRINT_DISPATCH'; version: number } & Envelope);

export const createPublishingRecord = (): PublishingRecord => ({ version: 0, proofs: [], review: null, decision: null, dispatch: null });

export function reducePublishingRecord(state: PublishingRecord, action: PublishingAction): PublishingRecord {
  if (!Number.isFinite(Date.parse(action.at))) return state;
  if (action.type === 'ATTACH_PRINT_PROOF') {
    if (action.actor !== 'COORDINATOR' || state.dispatch) return state;
    const version = state.version + 1;
    return { ...state, version, proofs: [...state.proofs, { version, actor: action.actor, at: action.at }], review: null, decision: null };
  }
  if (!state.version || action.version !== state.version || state.dispatch) return state;
  switch (action.type) {
    case 'ROUTE_PRINT_PROOF':
      if (action.actor !== 'PUBLISHING_MANAGER' || state.review || state.decision || !action.editorialChecked || !action.rightsChecked || action.route !== PRINT_ROUTE_ID) return state;
      return { ...state, review: { version: action.version, actor: action.actor, at: action.at, route: action.route } };
    case 'DECIDE_PRINT_PROOF':
      if (action.actor !== 'CHAIRMAN' || !action.acknowledged || state.decision || state.review?.version !== action.version || state.review.route !== PRINT_ROUTE_ID) return state;
      return { ...state, decision: { version: action.version, actor: action.actor, at: action.at, outcome: action.outcome } };
    case 'RECORD_PRINT_DISPATCH':
      if (action.actor !== 'PUBLISHING_MANAGER' || state.decision?.outcome !== 'release' || state.decision.version !== action.version) return state;
      return { ...state, dispatch: { version: action.version, actor: action.actor, at: action.at } };
  }
}

export function selectPublishingRecord(state: PublishingRecord) {
  const queued = Boolean(state.review && state.review.version === state.version && !state.decision);
  const stage = state.dispatch ? 'sent' : state.decision?.outcome === 'release' ? 'released' : state.decision?.outcome === 'return' ? 'returned' : queued ? 'executive-review' : state.version ? 'manager-review' : 'drafting';
  return { queued, stage, reference: `${PRINT_CASE_ID}/v${state.version}`, route: PRINT_ROUTE_ID };
}
