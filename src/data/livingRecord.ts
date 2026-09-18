// Fictional, session-only demonstration. These guards are not server authorization.
import type { ExhibitionProgramme } from '../types';
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
export type DemoActor = 'CHAIRMAN' | 'DIRECTORATE' | 'LOGISTICS' | 'TECHNICAL' | 'COORDINATOR' | 'FINANCE' | 'OBSERVER';
export type EventKind = 'receipt' | 'receipt-issue' | 'condition' | 'handover' | 'statement-missing' | 'statement-task' | 'statement-restored' | 'finance-pack' | 'finance-escalated';
export interface DemoEvent { id: string; kind: EventKind; actor: DemoActor; at: string; reference: string }
export interface ConditionEvidence { id: string; version: number; outcome: 'clear' | 'issue'; at: string; actor: DemoActor }
export interface LivingRecord {
  receipt: { at: string; actor: DemoActor } | null;
  receiptIssue: boolean;
  condition: ConditionEvidence | null;
  conditionHistory: ConditionEvidence[];
  acceptance: { at: string; actor: DemoActor; reportId: string; reportVersion: number; declarationVersion: string } | null;
  statementPresent: boolean;
  statementTask: boolean;
  finance: 'draft' | 'submitted' | 'escalated';
  events: DemoEvent[];
}
export const createLivingRecord = (): LivingRecord => ({ receipt: null, receiptIssue: false, condition: null, conditionHistory: [], acceptance: null, statementPresent: true, statementTask: false, finance: 'draft', events: [] });
type Envelope = { actor: DemoActor; at: string };
export type DemoAction =
  | ({ type: 'RECEIVE'; crateId: string; sealMatches: boolean } & Envelope)
  | ({ type: 'CONDITION'; outcome: 'clear' | 'issue' } & Envelope)
  | ({ type: 'ACCEPT'; reportVersion: number; acknowledged: boolean } & Envelope)
  | ({ type: 'FLAG_STATEMENT' | 'ASSIGN_STATEMENT' | 'RESTORE_STATEMENT' | 'SUBMIT_FINANCE' | 'ESCALATE_FINANCE' } & Envelope)
  | { type: 'RESET' };

export function livingRecordReducer(state: LivingRecord, action: DemoAction): LivingRecord {
  if (action.type === 'RESET') return createLivingRecord();
  if (!Number.isFinite(Date.parse(action.at))) return state;
  const record = (kind: EventKind, changes: Partial<LivingRecord>, reference = CASE_ID): LivingRecord => ({
    ...state, ...changes,
    events: [...state.events, { id: `DEMO-E${state.events.length + 1}`, kind, actor: action.actor, at: action.at, reference }],
  });
  switch (action.type) {
    case 'RECEIVE':
      if (action.actor !== 'LOGISTICS' || state.receipt || state.acceptance) return state;
      if (action.crateId.trim() !== CASE_ID || !action.sealMatches) {
        return state.receiptIssue ? state : record('receipt-issue', { receiptIssue: true });
      }
      return record('receipt', { receipt: { at: action.at, actor: action.actor }, receiptIssue: false });
    case 'CONDITION': {
      if (action.actor !== 'TECHNICAL' || !state.receipt || state.receiptIssue || state.acceptance) return state;
      const version = (state.condition?.version ?? 0) + 1;
      const condition: ConditionEvidence = { id: 'DEMO-CR-04', version, outcome: action.outcome, at: action.at, actor: action.actor };
      return record('condition', { condition, conditionHistory: [...state.conditionHistory, condition] }, `DEMO-CR-04/v${version}`);
    }
    case 'ACCEPT':
      if (action.actor !== 'DIRECTORATE' || !state.receipt || state.receiptIssue || !state.condition || state.condition.outcome !== 'clear' || state.acceptance || !action.acknowledged || action.reportVersion !== state.condition.version) return state;
      return record('handover', { acceptance: { at: action.at, actor: action.actor, reportId: state.condition.id, reportVersion: state.condition.version, declarationVersion: 'DEMO-ACK-1' } }, `${state.condition.id}/v${state.condition.version}`);
    case 'FLAG_STATEMENT':
      if (action.actor !== 'COORDINATOR' || !state.statementPresent) return state;
      return record('statement-missing', { statementPresent: false }, 'DEMO-STATEMENT-01');
    case 'ASSIGN_STATEMENT':
      if (action.actor !== 'DIRECTORATE' || state.statementPresent || state.statementTask) return state;
      return record('statement-task', { statementTask: true }, 'DEMO-TASK-01');
    case 'RESTORE_STATEMENT':
      if (action.actor !== 'COORDINATOR' || state.statementPresent || !state.statementTask) return state;
      return record('statement-restored', { statementPresent: true, statementTask: false }, 'DEMO-STATEMENT-01');
    case 'SUBMIT_FINANCE':
      if (action.actor !== 'FINANCE' || state.finance !== 'draft') return state;
      return record('finance-pack', { finance: 'submitted' }, 'DEMO-FIN-01/v1');
    case 'ESCALATE_FINANCE':
      if (action.actor !== 'DIRECTORATE' || state.finance !== 'submitted') return state;
      return record('finance-escalated', { finance: 'escalated' }, 'DEMO-FIN-01/v1');
  }
}

export function selectLivingRecord(state: LivingRecord) {
  // The other three programmes are explicitly seeded fictional baseline records.
  const programmes = [
    { id: 'DEMO-P1', ready: true }, { id: 'DEMO-P2', ready: true }, { id: 'DEMO-P3', ready: true },
    { id: DEMO_PROGRAMME_ID, ready: Boolean(state.acceptance) },
  ];
  const evidence = [
    { id: 'DEMO-CONTRACT-01', present: true }, { id: 'DEMO-PLAN-01', present: true },
    { id: 'DEMO-STATEMENT-01', present: state.statementPresent },
    { id: 'DEMO-RECEIPT-04', present: Boolean(state.receipt) },
    { id: 'DEMO-CR-04', present: Boolean(state.condition) },
  ];
  const evidenceCount = evidence.filter(item => item.present).length;
  const nextActor: DemoActor | null = state.acceptance ? null : !state.receipt ? 'LOGISTICS' : !state.condition || state.condition.outcome === 'issue' ? 'TECHNICAL' : 'DIRECTORATE';
  return {
    programmes, evidence, evidenceCount, evidencePercent: Math.round(evidenceCount / evidence.length * 100),
    readyCount: programmes.filter(programme => programme.ready).length,
    nextActor, custodyReady: Boolean(state.acceptance), executiveQueue: state.finance === 'escalated' ? 1 : 0,
  };
}
