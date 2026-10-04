// Fictional, session-only demonstration. These guards are not server authorization.
import type { ExhibitionProgramme } from '../types';
import { createPublishingRecord, reducePublishingRecord, selectPublishingRecord, validPublishingRecord, type PublishingRecord, type PublishingAction } from './publishingRecord';
export const CASE_ID = 'DEMO-MF-04';
export const DEMO_PROGRAMME_ID = 'living-record-demo';
// Selector metadata only; live readiness is derived by selectLivingRecord below.
export const DEMO_PROGRAMME: ExhibitionProgramme = {
  id: DEMO_PROGRAMME_ID, titleEn: 'The Living Record — fictional case', titleAr: 'السجل الحي — حالة افتراضية',
  themeEn: 'Fictional custody handover scenario', themeAr: 'سيناريو تسليم افتراضي', dates: 'Demonstration / تجربة',
  venueEn: 'Sample loading bay', venueAr: 'منطقة استلام تجريبية', status: 'production',
  budgetPlanned: 0, budgetCommitted: 0, budgetSpent: 0, currency: 'AED',
  progressPercent: 0, gatesReady: 0, gatesTotal: 3, criticalRisks: 0, unresolvedHandoffs: 1,
};
export type DemoActor = 'CHAIRMAN' | 'DIRECTORATE' | 'MANAGER' | 'LOGISTICS' | 'TECHNICAL' | 'COORDINATOR' | 'FINANCE' | 'PUBLISHING_MANAGER' | 'ARTIST' | 'SELECTION' | 'OBSERVER';
export type EventKind = 'receipt' | 'receipt-issue' | 'condition' | 'handover' | 'statement-missing' | 'statement-task' | 'statement-restored' | 'finance-pack' | 'finance-escalated' | 'delivery-escalated' | 'print-proof' | 'print-routed' | 'print-decision' | 'print-dispatch' | 'print-progress';
export interface DemoEvent { id: string; kind: EventKind; actor: DemoActor; at: string; reference: string }
export interface ConditionEvidence { id: string; version: number; outcome: 'clear' | 'issue'; at: string; actor: DemoActor }
export interface LivingRecord {
  caseId: string;
  receipt: { at: string; actor: DemoActor } | null;
  receiptIssue: boolean;
  condition: ConditionEvidence | null;
  conditionHistory: ConditionEvidence[];
  acceptance: { at: string; actor: DemoActor; reportId: string; reportVersion: number; declarationVersion: string } | null;
  statementPresent: boolean;
  statementTask: boolean;
  deliveryEscalated: boolean;
  finance: 'draft' | 'submitted' | 'escalated';
  publishing: PublishingRecord;
  events: DemoEvent[];
}
export const createLivingRecord = (caseId = CASE_ID): LivingRecord => ({ caseId, receipt: null, receiptIssue: false, condition: null, conditionHistory: [], acceptance: null, statementPresent: true, statementTask: false, deliveryEscalated: false, finance: 'draft', publishing: createPublishingRecord(), events: [] });

export function validLivingRecord(value: unknown): value is LivingRecord {
  const s = value as LivingRecord | null;
  const text = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
  const entry = (v: unknown, actor: DemoActor) => {
    const e = v as { actor: DemoActor; at: string } | null;
    return !!e && e.actor === actor && typeof e.at === 'string' && Number.isFinite(Date.parse(e.at));
  };
  if (!s || !text(s.caseId) || !validPublishingRecord(s.publishing) || !Array.isArray(s.events) || !Array.isArray(s.conditionHistory)
    || !['draft', 'submitted', 'escalated'].includes(s.finance)
    || ![s.receiptIssue, s.statementPresent, s.statementTask, s.deliveryEscalated].every(v => typeof v === 'boolean')) return false;
  const actors: DemoActor[] = ['CHAIRMAN', 'DIRECTORATE', 'MANAGER', 'LOGISTICS', 'TECHNICAL', 'COORDINATOR', 'FINANCE', 'PUBLISHING_MANAGER', 'ARTIST', 'SELECTION', 'OBSERVER'];
  const kinds: EventKind[] = ['receipt', 'receipt-issue', 'condition', 'handover', 'statement-missing', 'statement-task', 'statement-restored', 'finance-pack', 'finance-escalated', 'delivery-escalated', 'print-proof', 'print-routed', 'print-decision', 'print-dispatch', 'print-progress'];
  if (!s.events.every((e, i) => e && e.id === `DEMO-E${i + 1}` && kinds.includes(e.kind) && actors.includes(e.actor) && entry(e, e.actor) && text(e.reference))) return false;
  if (s.receipt !== null && (!entry(s.receipt, 'LOGISTICS') || s.receiptIssue)) return false;
  if (!s.conditionHistory.every((c, i) => c && entry(c, 'TECHNICAL') && text(c.id) && c.version === i + 1 && ['clear', 'issue'].includes(c.outcome))) return false;
  if (s.condition !== null) {
    const latest = s.conditionHistory.at(-1);
    if (!s.receipt || !latest || !entry(s.condition, 'TECHNICAL')
      || !(['id', 'version', 'outcome', 'at', 'actor'] as const).every(key => s.condition![key] === latest[key])) return false;
  } else if (s.conditionHistory.length) return false;
  if (s.acceptance !== null && (!entry(s.acceptance, 'MANAGER') || !s.receipt || s.receiptIssue || s.condition?.outcome !== 'clear'
    || s.acceptance.reportId !== s.condition.id || s.acceptance.reportVersion !== s.condition.version || s.acceptance.declarationVersion !== 'DEMO-ACK-1')) return false;
  return true;
}
type Envelope = { actor: DemoActor; at: string };
export type DemoAction =
  | PublishingAction
  | ({ type: 'RECEIVE'; crateId: string; sealMatches: boolean } & Envelope)
  | ({ type: 'CONDITION'; outcome: 'clear' | 'issue' } & Envelope)
  | ({ type: 'ACCEPT'; reportVersion: number; acknowledged: boolean } & Envelope)
  | ({ type: 'FLAG_STATEMENT' | 'ASSIGN_STATEMENT' | 'RESTORE_STATEMENT' | 'SUBMIT_FINANCE' | 'ESCALATE_FINANCE' | 'ESCALATE_DELIVERY' } & Envelope)
  | { type: 'RESET' };

export function livingRecordReducer(state: LivingRecord, action: DemoAction): LivingRecord {
  if (action.type === 'RESET') return createLivingRecord(state.caseId);
  if (!Number.isFinite(Date.parse(action.at))) return state;
  const record = (kind: EventKind, changes: Partial<LivingRecord>, reference = state.caseId): LivingRecord => ({
    ...state, ...changes,
    events: [...state.events, { id: `DEMO-E${state.events.length + 1}`, kind, actor: action.actor, at: action.at, reference }],
  });
  switch (action.type) {
    case 'ATTACH_PRINT_PROOF':
    case 'ROUTE_PRINT_PROOF':
    case 'DECIDE_PRINT_PROOF':
    case 'ACKNOWLEDGE_PRINT_PROOF':
    case 'START_PRINT':
    case 'COMPLETE_PRINT':
    case 'REQUEST_PRINT_CORRECTION':
    case 'CONFIRM_PRINT_STOP':
    case 'RECORD_PRINT_DISPATCH': {
      const publishing = reducePublishingRecord(state.publishing, action);
      if (publishing === state.publishing) return state;
      const kind: EventKind = action.type === 'ATTACH_PRINT_PROOF' ? 'print-proof' : action.type === 'ROUTE_PRINT_PROOF' ? 'print-routed' : action.type === 'DECIDE_PRINT_PROOF' ? 'print-decision' : action.type === 'RECORD_PRINT_DISPATCH' ? 'print-dispatch' : 'print-progress';
      return record(kind, { publishing }, `${selectPublishingRecord(publishing).reference}${action.type === 'DECIDE_PRINT_PROOF' ? `/${action.outcome}` : kind === 'print-progress' ? `/${action.type}` : ''}`);
    }
    case 'RECEIVE':
      if (action.actor !== 'LOGISTICS' || state.receipt || state.acceptance) return state;
      if (action.crateId.trim() !== state.caseId || !action.sealMatches) {
        return state.receiptIssue ? state : record('receipt-issue', { receiptIssue: true });
      }
      return record('receipt', { receipt: { at: action.at, actor: action.actor }, receiptIssue: false });
    case 'CONDITION': {
      if (action.actor !== 'TECHNICAL' || !state.receipt || state.receiptIssue || state.acceptance) return state;
      const version = (state.condition?.version ?? 0) + 1;
      const condition: ConditionEvidence = { id: state.caseId === CASE_ID ? 'DEMO-CR-04' : `${state.caseId}-CR`, version, outcome: action.outcome, at: action.at, actor: action.actor };
      return record('condition', { condition, conditionHistory: [...state.conditionHistory, condition] }, `${condition.id}/v${version}`);
    }
    case 'ACCEPT':
      if (action.actor !== 'MANAGER' || !state.receipt || state.receiptIssue || !state.condition || state.condition.outcome !== 'clear' || state.acceptance || !action.acknowledged || action.reportVersion !== state.condition.version) return state;
      return record('handover', { acceptance: { at: action.at, actor: action.actor, reportId: state.condition.id, reportVersion: state.condition.version, declarationVersion: 'DEMO-ACK-1' } }, `${state.condition.id}/v${state.condition.version}`);
    case 'FLAG_STATEMENT':
      if (action.actor !== 'COORDINATOR' || !state.statementPresent) return state;
      return record('statement-missing', { statementPresent: false }, 'DEMO-STATEMENT-01');
    case 'ASSIGN_STATEMENT':
      if (action.actor !== 'MANAGER' || state.statementPresent || state.statementTask) return state;
      return record('statement-task', { statementTask: true }, 'DEMO-TASK-01');
    case 'RESTORE_STATEMENT':
      if (action.actor !== 'COORDINATOR' || state.statementPresent || !state.statementTask) return state;
      return record('statement-restored', { statementPresent: true, statementTask: false }, 'DEMO-STATEMENT-01');
    case 'SUBMIT_FINANCE':
      if (action.actor !== 'FINANCE' || state.finance !== 'draft') return state;
      return record('finance-pack', { finance: 'submitted' }, 'DEMO-FIN-01/v1');
    case 'ESCALATE_FINANCE':
      if (action.actor !== 'MANAGER' || state.finance !== 'submitted') return state;
      return record('finance-escalated', { finance: 'escalated' }, 'DEMO-FIN-01/v1');
    case 'ESCALATE_DELIVERY':
      if (action.actor !== 'MANAGER' || state.acceptance || state.deliveryEscalated) return state;
      return record('delivery-escalated', { deliveryEscalated: true }, 'DEMO-SCHEDULE-01');
  }
}

export function selectLivingRecord(state: LivingRecord) {
  // Only the connected fictional exhibition is counted; no department-wide readiness is inferred.
  const programmes = [{ id: DEMO_PROGRAMME_ID, ready: Boolean(state.acceptance) }];
  const evidence = [
    { id: 'DEMO-CONTRACT-01', present: true }, { id: 'DEMO-PLAN-01', present: true },
    { id: 'DEMO-STATEMENT-01', present: state.statementPresent },
    { id: 'DEMO-RECEIPT-04', present: Boolean(state.receipt) },
    { id: 'DEMO-CR-04', present: Boolean(state.condition) },
  ];
  const evidenceCount = evidence.filter(item => item.present).length;
  const nextActor: DemoActor | null = state.acceptance ? null : !state.receipt ? 'LOGISTICS' : !state.condition || state.condition.outcome === 'issue' ? 'TECHNICAL' : 'MANAGER';
  return {
    programmes, evidence, evidenceCount, evidencePercent: Math.round(evidenceCount / evidence.length * 100),
    readyCount: programmes.filter(programme => programme.ready).length,
    nextActor, custodyReady: Boolean(state.acceptance), executiveQueue: (state.finance === 'escalated' ? 1 : 0) + (selectPublishingRecord(state.publishing).queued ? 1 : 0),
  };
}
