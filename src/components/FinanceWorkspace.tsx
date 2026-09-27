import React from 'react';
import { Lock } from 'lucide-react';
import type { VettedArtist } from './CoordinatorContractWorkspace';
import type { CommissionState } from '../types';
import { advanceEligible } from '../data/commissionScenario';
import { AgreementMilestones, CommissionSummary, panel, actionButton } from './CommissionSummary';

export interface FinanceWorkspaceProps {
  isAr: boolean;
  state: CommissionState;
  artist?: Pick<VettedArtist, 'id' | 'prCleared' | 'technicalCleared'>;
  onAuthorizeAdvance: () => void;
}

export default function FinanceWorkspace({ isAr, state, artist, onAuthorizeAdvance }: FinanceWorkspaceProps) {
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
    <CommissionSummary isAr={isAr} />
    {c ? <AgreementMilestones contract={c} isAr={isAr} /> : <p className={panel}>{isAr ? 'لم يصغ المنسق الاتفاقية بعد. لا توجد مبالغ افتراضية بديلة.' : 'The Coordinator has not drafted the agreement. No fallback amounts are used.'}</p>}
    <section className={panel}>
      <h2 className="text-xl font-semibold mb-3">{isAr ? 'شروط المقدّم' : 'Advance prerequisites'}</h2>
      <ul className="space-y-2">{gateRows.map(([label, ready]) => <li key={label}>{label}: <strong>{ready ? (isAr ? 'مستوفى' : 'Complete') : (isAr ? 'بانتظار الاستكمال' : 'Pending')}</strong></li>)}</ul>
      <p id="advance-help" className="my-4 text-sm">{isAr ? 'قاعدة هذا السيناريو: يلزم تسجيل أدلة العلاقات العامة والفريق الفني معاً. تسجيل الأدلة لا يعتمد المقدّم تلقائياً.' : 'This scenario requires both PR and Technical evidence. Recording evidence never automatically authorizes the advance.'}</p>
      {waitingOn && <p role="status" className="mb-4 rounded border border-[#8B261E]/30 bg-[#F7F1E6] p-3 text-[#8B261E]">{isAr ? `بانتظار اعتماد ${waitingOn}. صرف المقدّم مقفل.` : `Waiting on ${waitingOn} clearance. Advance payment is locked.`}</p>}
      <button className={`${actionButton} inline-flex items-center gap-2`} aria-describedby="advance-help" disabled={!canRelease} onClick={() => { if (canRelease) onAuthorizeAdvance(); }}>
        {!canRelease && <Lock className="size-4" aria-hidden="true" />}{isAr ? 'صرف الدفعة المقدّمة — محاكاة' : 'Release Advance Payment — simulated'}</button>
      <p role="status" className="mt-3 text-sm">{e.financeApprovalGate ? (isAr ? 'سُجّل اعتماد المقدّم في العرض المحلي فقط. لا تحويل مالي.' : 'Advance authorization recorded in the local demo only. No money transferred.') : (isAr ? 'لم يُعتمد المقدّم.' : 'Advance not authorized.')}</p>
      {e.advanceAuthorizedAt && <p className="text-sm mt-2"><bdi>{e.advanceAuthorizedAt}</bdi> · {isAr ? 'نسخة الاتفاقية' : 'Agreement revision'} {state.agreementRevision}</p>}
    </section>
    <section className={panel}>
      <h2 className="text-xl font-semibold mb-3">{isAr ? 'التسليم وما بعد الافتتاح' : 'Delivery and Post-Opening'}</h2>
      <p>{isAr ? 'دفعتان منفصلتان. تبقيان معلقتين حتى إضافة أدلة التسليم وما بعد الافتتاح؛ لا يجمعهما اعتماد نهائي واحد.' : 'Two separate milestones. Both remain pending until their own delivery and post-opening evidence is implemented; there is no combined final clearing action.'}</p>
    </section>
  </div>;
}
