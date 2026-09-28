import { damageHold } from '../data/conditionReporting';
import React, { useState } from 'react';
import { SpatialVarianceTicket } from './SpatialVarianceTicket';
import { InstallationIntervention } from './InstallationIntervention';
import { ProductionBridge } from './ProductionBridge';
import { TechnicalRequestLedger } from './TechnicalRequestLedger';
import { COMMISSION } from '../data/commissionScenario';
import type { CommissionState } from '../types';
import { CommissionSummary, panel, actionButton } from './CommissionSummary';

export interface TechnicalWorkspaceProps {
  isAr: boolean;
  state: CommissionState;
  onCheck: (field: 'floorLoadVerified' | 'mountingVerified', value: boolean) => void;
  onRequestSAF: (technicians: number, hours: number, rationale: string) => void;
  onClearTechnical: (artistId: string) => void;
}

export default function TechnicalWorkspace({ isAr, state, onCheck, onClearTechnical, onRequestSAF }: TechnicalWorkspaceProps) {
  const e = state.evidence;
  const [technicians, setTechnicians] = useState(2);
  const [hours, setHours] = useState(8);
  const [rationale, setRationale] = useState('');
  return <div dir={isAr ? 'rtl' : 'ltr'} className="max-w-4xl mx-auto ps-4 pe-4 py-6 space-y-5 text-start bg-[#F7F1E6]">
    <h1 className="font-serif text-3xl font-bold">{isAr ? 'الفريق الهندسي والفني' : 'Engineering / Technical Workspace'}</h1>
    <CommissionSummary isAr={isAr} />
    <InstallationIntervention state={state} isAr={isAr} actor="TECHNICAL" />
    {damageHold(state) && <p role="status" className="rounded border border-red-300 bg-red-50 ps-4 pe-4 py-3">Artwork damage hold — installation is locked pending a separately authorized resolution.</p>}
    <fieldset disabled={state.installationStatus === 'EXECUTIVE_IMPOUND' || damageHold(state)} className={`min-w-0 space-y-5 ${state.installationStatus === 'EXECUTIVE_IMPOUND' ? 'rounded border-2 border-red-700 bg-red-50 ps-4 pe-4 py-4' : ''}`}>
    <section className={panel}>
      <h2 className="text-xl font-semibold mb-3">{isAr ? 'أدلة فنية — محاكاة' : 'Technical evidence — simulation'}</h2>
      <p className="text-sm mb-4">{isAr
        ? 'الوزن 84 كغ لا يثبت سلامة الأرضية. يلزم في الواقع تقييم الموقع وتوزيع الأحمال ونقاط التلامس والتثبيت بواسطة مختص. الاختيارات التالية أدلة خيالية وليست حساباً هندسياً.'
        : '84 kg alone does not establish floor safety. Real assessment requires site capacity, load distribution, contact points and mounting review by a competent specialist. These checks are fictional evidence, not an engineering calculation.'}</p>
      <div className="space-y-4">
        <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 size-5 shrink-0" checked={e.floorLoadVerified} onChange={event => onCheck('floorLoadVerified', event.target.checked)} /><span>{isAr ? 'اعتماد اختلاف حمل الأرضية لوزن 84 كغ — محاكاة' : 'Approve 84 kg Floor Load Variance — simulated'}</span></label>
        <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 size-5 shrink-0" checked={e.mountingVerified} onChange={event => onCheck('mountingVerified', event.target.checked)} /><span>{isAr ? 'التحقق من مواصفات حوامل التثبيت — محاكاة' : 'Verify Mounting Bracket Specs — simulated'}</span></label>
      </div>
      <button className={`${actionButton} mt-5`} disabled={!state.contracts.length || !e.floorLoadVerified || !e.mountingVerified || e.technicalEvidenceGate} onClick={() => {
        const artistId = state.contracts[0]?.artistId;
        if (!artistId || !e.floorLoadVerified || !e.mountingVerified || e.technicalEvidenceGate) return;
        onClearTechnical(artistId);
      }}>{isAr ? 'اعتماد التباين الإنشائي' : 'Approve Structural Variance'}</button>
      <p role="status" className="mt-3 text-sm">{e.technicalEvidenceGate ? (isAr ? 'سُجّلت الأدلة الفنية. اعتماد المالية مستقل.' : 'Technical evidence recorded. Finance approval remains separate.') : !state.contracts.length ? (isAr ? 'بانتظار اتفاقية المنسق.' : 'Waiting for the Coordinator agreement.') : (isAr ? 'بانتظار استكمال الفحصين وتسجيل الأدلة.' : 'Complete both checks, then record the evidence.')}</p>
    </section>
    <section className={panel}><h2 className="text-xl font-semibold">{isAr ? 'طلب فنيي مؤسسة الشارقة للفنون — محاكاة مستقلة' : 'SAF technician request — separate simulation'}</h2>
      <p className="my-3">{isAr ? 'طلب موارد فقط؛ لا يمثل تأكيد تخصيص من المؤسسة أو اعتماداً إنشائياً.' : 'Resource request only; this is neither SAF allocation confirmation nor structural approval.'}</p>
      <label className="block">{isAr ? 'عدد الفنيين' : 'Technicians'}<input type="number" min="1" step="1" value={technicians} onChange={e => setTechnicians(Number(e.target.value))} className="ms-3 border ps-2 pe-2 py-2" /></label>
      <label className="block mt-3">{isAr ? 'ساعات لكل فني' : 'Hours per technician'}<input type="number" min="1" value={hours} onChange={e => setHours(Number(e.target.value))} className="ms-3 border ps-2 pe-2 py-2" /></label>
      <p className="my-3">{isAr ? 'إجمالي ساعات العمل المطلوبة' : 'Requested person-hours'}: {Number.isFinite(technicians * hours) ? technicians * hours : '—'}</p>
      <label>{isAr ? 'مبررات الطلب' : 'Request rationale'}<textarea value={rationale} onChange={e => setRationale(e.target.value)} className="block w-full border ps-3 pe-3 py-2" /></label>
      <button className={`${actionButton} mt-3`} disabled={!state.contracts.length || Boolean(state.safRequest) || !Number.isInteger(technicians) || technicians <= 0 || !Number.isFinite(hours) || hours <= 0 || !rationale.trim()} onClick={() => onRequestSAF(technicians, hours, rationale)}>{isAr ? 'تسجيل طلب الموارد' : 'Record resource request'}</button>
      {state.safRequest && <p role="status">{isAr ? 'طلب مسجل؛ تخصيص الجهة الخارجية غير مؤكد' : 'Request recorded; external allocation unconfirmed'} · {state.safRequest.technicians} × {state.safRequest.hours}</p>}
    </section>
    <SpatialVarianceTicket isAr={isAr} />
    <ProductionBridge key={`production:${state.contracts[0]?.artistId ?? COMMISSION.id}`} artistId={state.contracts[0]?.artistId ?? COMMISSION.id} isAr={isAr} actor="TECHNICAL" />
    <TechnicalRequestLedger blocked={damageHold(state)||state.installationStatus==='EXECUTIVE_IMPOUND'} key={`technical:${state.contracts[0]?.artistId ?? COMMISSION.id}`} artistId={state.contracts[0]?.artistId ?? COMMISSION.id} artistName={state.contracts[0]?.artistName ?? (isAr ? COMMISSION.artistNameAr : COMMISSION.artistName)} isAr={isAr} />
    </fieldset>
  </div>;
}
