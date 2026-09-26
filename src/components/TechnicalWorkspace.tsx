import React from 'react';
import type { CommissionState } from '../types';
import { CommissionSummary, panel, actionButton } from './CommissionSummary';

export interface TechnicalWorkspaceProps {
  isAr: boolean;
  state: CommissionState;
  onCheck: (field: 'floorLoadVerified' | 'mountingVerified', value: boolean) => void;
  onRecord: () => void;
}

export default function TechnicalWorkspace({ isAr, state, onCheck, onRecord }: TechnicalWorkspaceProps) {
  const e = state.evidence;
  return <div dir={isAr ? 'rtl' : 'ltr'} className="max-w-4xl mx-auto ps-4 pe-4 py-6 space-y-5 text-start">
    <h1 className="font-serif text-3xl font-bold">{isAr ? 'الفريق الهندسي والفني' : 'Engineering / Technical Workspace'}</h1>
    <CommissionSummary isAr={isAr} />
    <section className={panel}>
      <h2 className="text-xl font-semibold mb-3">{isAr ? 'أدلة فنية — محاكاة' : 'Technical evidence — simulation'}</h2>
      <p className="text-sm mb-4">{isAr
        ? 'الوزن 84 كغ لا يثبت سلامة الأرضية. يلزم في الواقع تقييم الموقع وتوزيع الأحمال ونقاط التلامس والتثبيت بواسطة مختص. الاختيارات التالية أدلة خيالية وليست حساباً هندسياً.'
        : '84 kg alone does not establish floor safety. Real assessment requires site capacity, load distribution, contact points and mounting review by a competent specialist. These checks are fictional evidence, not an engineering calculation.'}</p>
      <div className="space-y-4">
        <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 size-5 shrink-0" checked={e.floorLoadVerified} onChange={event => onCheck('floorLoadVerified', event.target.checked)} /><span>{isAr ? 'اعتماد اختلاف حمل الأرضية لوزن 84 كغ — محاكاة' : 'Approve 84 kg Floor Load Variance — simulated'}</span></label>
        <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 size-5 shrink-0" checked={e.mountingVerified} onChange={event => onCheck('mountingVerified', event.target.checked)} /><span>{isAr ? 'التحقق من مواصفات حوامل التثبيت — محاكاة' : 'Verify Mounting Bracket Specs — simulated'}</span></label>
      </div>
      <button className={`${actionButton} mt-5`} disabled={!state.contracts.length || !e.floorLoadVerified || !e.mountingVerified || e.technicalEvidenceGate} onClick={onRecord}>{isAr ? 'تسجيل الأدلة الفنية' : 'Record Technical Evidence'}</button>
      <p role="status" className="mt-3 text-sm">{e.technicalEvidenceGate ? (isAr ? 'سُجّلت الأدلة الفنية. اعتماد المالية مستقل.' : 'Technical evidence recorded. Finance approval remains separate.') : !state.contracts.length ? (isAr ? 'بانتظار اتفاقية المنسق.' : 'Waiting for the Coordinator agreement.') : (isAr ? 'بانتظار استكمال الفحصين وتسجيل الأدلة.' : 'Complete both checks, then record the evidence.')}</p>
    </section>
  </div>;
}
