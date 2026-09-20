import { findIntakeProgramme, reviewSubmission, type IntakeSubmission } from './artistIntake';
import { createLivingRecord, livingRecordReducer, type DemoAction, type LivingRecord } from './livingRecord';

export interface DeliveryAsset {
  id: string; programmeId: string; artistId: string; proposalId: string; proposalVersion: number;
  titleEn: string; titleAr: string; programmeEn: string; programmeAr: string;
  activatedAt: string; activatedBy: 'DEMO-SELECTION'; record: LivingRecord;
}
export interface IntakeWorkflow { submissions: IntakeSubmission[]; deliveries: DeliveryAsset[] }
export type IntakeWorkflowAction =
  | { type: 'SUBMIT'; submission: IntakeSubmission }
  | { type: 'REVIEW'; id: string; actor: string; outcome: 'checked' | 'revision'; note: string; at: string }
  | { type: 'ACTIVATE'; id: string; actor: string; acknowledged: boolean; at: string }
  | { type: 'DELIVERY'; id: string; action: DemoAction };

// Session simulation guards, not authenticated institutional permissions.
export function intakeWorkflowReducer(state: IntakeWorkflow, action: IntakeWorkflowAction): IntakeWorkflow {
  if (action.type === 'SUBMIT') {
    const previous = state.submissions.filter(s => s.programmeId === action.submission.programmeId).at(-1);
    if (state.submissions.some(s => s.id === action.submission.id) || (previous && previous.status !== 'revision')) return state;
    return { ...state, submissions: [...state.submissions, action.submission] };
  }
  if (action.type === 'REVIEW') return { ...state, submissions: state.submissions.map(s => s.id === action.id ? reviewSubmission(s, action.actor, action.outcome, action.note, action.at) : s) };
  if (action.type === 'ACTIVATE') {
    const submission = state.submissions.find(s => s.id === action.id);
    if (action.actor !== 'SELECTION' || !action.acknowledged || !Number.isFinite(Date.parse(action.at)) || submission?.status !== 'checked') return state;
    if (state.deliveries.some(d => d.proposalId === submission.id)) return state;
    const latest = state.submissions.filter(s => s.programmeId === submission.programmeId).at(-1);
    if (latest?.id !== submission.id) return state;
    const proposal = submission.snapshot.proposals[submission.programmeId];
    const programme = findIntakeProgramme(submission.snapshot, submission.programmeId);
    if (!proposal || !programme) return state;
    const id = `DEMO-ASSET-${submission.programmeId}-V${submission.version}`;
    const asset: DeliveryAsset = {
      id, programmeId: submission.programmeId, artistId: submission.snapshot.profile.id,
      proposalId: submission.id, proposalVersion: submission.version,
      titleEn: proposal.titleEn, titleAr: proposal.titleAr, programmeEn: programme.en, programmeAr: programme.ar,
      activatedAt: action.at, activatedBy: 'DEMO-SELECTION', record: createLivingRecord(id),
    };
    // Activation and delivery linkage are one state change; repeat clicks cannot create another asset.
    return { ...state, deliveries: [...state.deliveries, asset] };
  }
  if (!['RECEIVE', 'CONDITION', 'ACCEPT'].includes(action.action.type)) return state;
  return { ...state, deliveries: state.deliveries.map(d => d.id === action.id ? { ...d, record: livingRecordReducer(d.record, action.action) } : d) };
}
export function selectIntakeWorkflow(state: IntakeWorkflow, programmeId?: string) {
  const assets = state.deliveries.filter(d => !programmeId || d.programmeId === programmeId);
  const received = assets.filter(d => d.record.receipt).length;
  const accepted = assets.filter(d => d.record.acceptance).length;
  return { assets, total: assets.length, received, accepted, pending: assets.length - accepted };
}
