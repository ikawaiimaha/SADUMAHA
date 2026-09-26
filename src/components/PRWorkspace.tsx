import React from 'react';
import type { CommissionState } from '../types';
import { CommissionSummary, panel, actionButton } from './CommissionSummary';

export interface PRWorkspaceProps {
  isAr: boolean;
  state: CommissionState;
  onCheck: (field: 'passportVerified' | 'visaCleared', value: boolean) => void;
  onRecord: () => void;
}

export function PRWorkspace({ isAr, state, onCheck, onRecord }: PRWorkspaceProps) {
  const e = state.evidence;
  return <div dir={isAr ? 'rtl' : 'ltr'} className="max-w-4xl mx-auto ps-4 pe-4 py-6 space-y-5 text-start">
    <h1 className="font-serif text-3xl font-bold">{isAr ? 'العلاقات العامة — الهوية والسفر' : 'PR — Identity & Travel'}</h1>
    <CommissionSummary isAr={isAr} showTechnical={false} />
    <section className={panel}>
      <h2 className="text-xl font-semibold mb-3">{isAr ? 'مراجعة المستندات البشرية — محاكاة' : 'Human logistics review — simulation'}</h2>
      <p className="text-sm mb-4">{isAr ? 'تسجيل نتيجة فحص خيالية للهوية والسفر فقط. لا تحميل لمستندات شخصية حقيقية ولا اعتماد مالي.' : 'Record a fictional identity and travel review only. No real personal documents are uploaded and no payment is authorized.'}</p>
      <div className="space-y-4">
        <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 size-5 shrink-0" checked={e.passportVerified} onChange={event => onCheck('passportVerified', event.target.checked)} /><span>{isAr ? 'التحقق من جواز السفر — محاكاة' : 'Passport Verification — simulated'}</span></label>
        <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 size-5 shrink-0" checked={e.visaCleared} onChange={event => onCheck('visaCleared', event.target.checked)} /><span>{isAr ? 'حالة التأشيرة مستوفاة — محاكاة' : 'Visa Status Cleared — simulated'}</span></label>
      </div>
      <button className={`${actionButton} mt-5`} disabled={!state.contracts.length || !e.passportVerified || !e.visaCleared || e.prEvidenceGate} onClick={onRecord}>{isAr ? 'التحقق من وثائق الهوية والسفر' : 'Verify Identity & Travel Documents'}</button>
      <p role="status" className="mt-3 text-sm">{e.prEvidenceGate ? (isAr ? 'سُجّلت أدلة العلاقات العامة. لم يُعتمد أي دفع.' : 'PR evidence recorded. No payment has been authorized.') : !state.contracts.length ? (isAr ? 'بانتظار اتفاقية المنسق.' : 'Waiting for the Coordinator agreement.') : (isAr ? 'استكمل الفحصين ثم سجّل الأدلة.' : 'Complete both checks, then record the evidence.')}</p>
    </section>
  </div>;
}

export default PRWorkspace;
