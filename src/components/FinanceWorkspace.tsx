import { ConditionReporting } from './ConditionReporting';
import type { CommissionAction } from '../data/commissionScenario';
import React from 'react';
import { Lock } from 'lucide-react';
import type { VettedArtist } from './CoordinatorContractWorkspace';
import type { CommissionState } from '../types';
import { advanceEligible, milestoneEligible } from '../data/commissionScenario';
import { AgreementMilestones, CommissionSummary, panel, actionButton } from './CommissionSummary';

export interface FinanceWorkspaceProps {
  onEmergencyAction?: (action:CommissionAction)=>void;
  isAr: boolean;
  state: CommissionState;
  artist?: Pick<VettedArtist, 'id' | 'prCleared' | 'technicalCleared'>;
  onAuthorizeAdvance: () => void;
  onRecordTranche: (tranche: 'delivery' | 'completion') => void;
}

export default function FinanceWorkspace({ onEmergencyAction, isAr, state, artist, onAuthorizeAdvance, onRecordTranche }: FinanceWorkspaceProps) {
  const c = state.contracts[0];
  const e = state.evidence;
  const prCleared = artist?.id === c?.artistId && artist?.prCleared === true && e.prEvidenceGate;
  const technicalCleared = artist?.id === c?.artistId && artist?.technicalCleared === true && e.technicalEvidenceGate;
  const canRelease = prCleared && technicalCleared && advanceEligible(state);
  const waitingOn = [!prCleared && (isAr ? 'العلاقات العامة' : 'PR'), !technicalCleared && (isAr ? 'الفريق الفني' : 'Technical')].filter(Boolean).join(isAr ? ' و' : ' and ');
  const signed = c?.status === 'ARTIST_APPROVED' || c?.status === 'LOCKED';
  const gateRows = [
    [isAr ? 'قبول الاتفاقية التجريبية' : 'Demo agreement accepted', signed],
    [isAr ? 'أدلة العلاقات العامة مسجلة' : 'PR evidence recorded', prCleared],
    [isAr ? 'الأدلة الفنية مسجلة' : 'Technical evidence recorded', technicalCleared],
  ] as const;
  return <div dir={isAr ? 'rtl' : 'ltr'} className="max-w-4xl mx-auto ps-4 pe-4 py-6 space-y-5 text-start bg-[#F7F1E6]">
    <h1 className="font-serif text-3xl font-bold">{isAr ? 'المالية — اعتماد مستقل' : 'Finance — Independent Approval'}</h1>
    <ConditionReporting state={state} isAr={isAr} actor="FINANCE" onRecord={onEmergencyAction} />
    <CommissionSummary isAr={isAr} />
    {c ? <AgreementMilestones contract={c} isAr={isAr} /> : <p className={panel}>{isAr ? 'لم يصغ المنسق الاتفاقية بعد. لا توجد مبالغ افتراضية بديلة.' : 'The Coordinator has not drafted the agreement. No fallback amounts are used.'}</p>}
    <section className={panel}>
      <h2 className="text-xl font-semibold mb-3">{isAr ? 'شروط المقدّم' : 'Advance prerequisites'}</h2>
      <ul className="space-y-2">{gateRows.map(([label, ready]) => <li key={label}>{label}: <strong>{ready ? (isAr ? 'مستوفى' : 'Complete') : (isAr ? 'بانتظار الاستكمال' : 'Pending')}</strong></li>)}</ul>
      <p id="advance-help" className="my-4 text-sm">{isAr ? 'قاعدة هذا السيناريو: يلزم تسجيل أدلة العلاقات العامة والفريق الفني معاً. تسجيل الأدلة لا يعتمد المقدّم تلقائياً.' : 'This scenario requires both PR and Technical evidence. Recording evidence never automatically authorizes the advance.'}</p>
      {waitingOn && <p role="status" className="mb-4 rounded border border-[#8B261E]/30 bg-[#F7F1E6] p-3 text-[#8B261E]">{isAr ? `بانتظار اعتماد ${waitingOn}. صرف المقدّم مقفل.` : `Waiting on ${waitingOn} clearance. Advance payment is locked.`}</p>}
      <button className={`${actionButton} inline-flex items-center gap-2`} aria-describedby="advance-help" disabled={!canRelease} onClick={() => { if (canRelease) onAuthorizeAdvance(); }}>
        {!canRelease && <Lock className="size-4" aria-hidden="true" />}{isAr ? 'تسجيل المقدّم في السجل' : 'Record Advance Disbursement in Ledger'}</button>
      <p role="status" className="mt-3 text-sm">{e.financeApprovalGate ? (isAr ? 'سُجّل اعتماد المقدّم في العرض المحلي فقط. لا تحويل مالي.' : 'Advance authorization recorded in the local demo only. No money transferred.') : (isAr ? 'لم يُعتمد المقدّم.' : 'Advance not authorized.')}</p>
      {e.advanceAuthorizedAt && <p className="text-sm mt-2"><bdi>{e.advanceAuthorizedAt}</bdi> · {isAr ? 'نسخة الاتفاقية' : 'Agreement revision'} {state.agreementRevision}</p>}
    </section>
    {(['delivery', 'completion'] as const).map(tranche => <section key={tranche} className={panel}>
      <h2 className="text-xl font-semibold">{tranche === 'delivery' ? (isAr ? 'دفعة التسليم' : 'Delivery tranche') : (isAr ? 'المرحلة 8 · دفعة الإكمال' : 'Stage 8 · Completion tranche')}</h2>
      <p className="my-3">{tranche === 'delivery' ? (isAr ? 'تتطلب تسجيل الاستلام الفعلي بواسطة اللوجستيات.' : 'Requires PHYSICAL_ASSET_RECEIVED recorded by Logistics.') : (isAr ? 'تتطلب إغلاق المعرض والإعادة الآمنة وتسوية تقرير الحالة.' : 'Requires exhibition closure, safe return and condition reconciliation.')}</p>
      <button className={actionButton} disabled={!milestoneEligible(state, tranche)} onClick={() => onRecordTranche(tranche)}>{isAr ? 'تسجيل الدفعة في السجل' : 'Record Disbursement in Ledger'}</button>
    </section>)}
    <section className={panel}><h2 className="text-xl font-semibold">{isAr ? 'السجل التجريبي لهذه الجلسة' : 'Session rehearsal ledger'}</h2>
      {(state.ledger || []).map(row => <p key={row.tranche} className="mt-2"><bdi>{row.tranche} · AED {row.amount.toLocaleString()} · {row.at}</bdi></p>)}
    </section>
  </div>;
}
