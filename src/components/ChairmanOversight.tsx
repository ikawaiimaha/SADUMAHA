import { type ReactNode } from 'react';
import { useSessionDraft } from '../context/SessionDrafts';
import type { CommissionState } from '../types';
import type { ChairmanViewMode, EscalationRecord, PortfolioProgram } from '../types/chairman';
import { analyzePortfolioConflicts, commissionEvidence } from '../utils/chairmanOversight';
import { useI18n } from '../context/I18nContext';

export interface ChairmanOversightProps {
  programs: PortfolioProgram[];
  commission: CommissionState;
  escalations: EscalationRecord[];
  onResolveEscalation: (id: string, disposition: NonNullable<EscalationRecord['executiveDisposition']>) => void;
  children: ReactNode;
}

export function ChairmanOversight({ programs, commission, escalations, onResolveEscalation, children }: ChairmanOversightProps) {
  const { isAr } = useI18n();
  const [view, setView] = useSessionDraft<ChairmanViewMode>('chairman-view', 'PORTFOLIO');
  const evidence = commissionEvidence(commission, isAr);
  const conflicts = analyzePortfolioConflicts(programs);
  const programName = (id: string) => { const p = programs.find(p => p.id === id); return p ? (isAr ? p.nameAr : p.nameEn) : id; };
  return <section className="mx-auto max-w-7xl space-y-5 bg-[#F7F1E6] ps-4 pe-4 py-6 text-start" dir={isAr ? 'rtl' : 'ltr'}>
    <header><h1 className="text-2xl font-bold">{isAr ? 'مكتب رئيس الدائرة · سعادة عبدالله بن محمد العويس' : 'Office of the Chairman · H.E. Abdullah bin Mohammed Al Owais'}</h1>
      <p>{isAr ? 'الإشراف على البرامج والقرارات الاستراتيجية' : 'Program oversight and strategic decisions'}</p></header>
    <nav aria-label={isAr ? 'مستويات الإشراف' : 'Oversight views'} className="flex flex-wrap gap-2">
      {(['PORTFOLIO', 'PROGRAM_DECISIONS'] as const).map(mode => <button key={mode} type="button" aria-pressed={view === mode} onClick={() => setView(mode)} className={`rounded border ps-4 pe-4 py-3 ${view === mode ? 'bg-[#8B261E] text-white' : 'bg-white text-[#736357]'}`}>{mode === 'PORTFOLIO' ? (isAr ? 'خريطة الانتشار الجغرافي للبرامج' : 'Geographic Program Portfolio') : (isAr ? 'قرارات برنامج الملتقى' : 'Biennial Program Decisions')}</button>)}
    </nav>
    {view === 'PORTFOLIO' && <div className="space-y-5">
      <p className="rounded border ps-4 pe-4 py-3">{isAr ? 'مراجع البرامج القائمة؛ تقارير التشغيل والتكليفات غير متاحة. أدلة الملتقى أدناه محاكاة للجلسة فقط.' : 'Existing program references; operational reports and assignments unavailable. Biennial evidence below is session simulation only.'}</p>
      {programs.filter(p => p.isLiveSessionProgram).map(p => <section key={p.id} aria-label={isAr ? 'ملخص قرار الجلسة' : 'Session decision summary'} className="rounded border border-[#D9CEBA] bg-white ps-4 pe-4 py-4">
        <h2 className="text-xl font-semibold">{isAr ? 'قرار الملتقى في هذه الجلسة' : 'Biennial decision in this session'}</h2>
        <p>{isAr ? 'الثيمة المعتمدة: ' : 'Ratified theme: '}<bdi>{p.sessionThemeArabic ?? (isAr ? 'لم تعتمد بعد' : 'Not ratified yet')}</bdi></p>
        <p>{isAr ? 'الميزانية المعتمدة: ' : 'Ratified budget: '}{p.budgetCeilingAED !== undefined ? <bdi>{new Intl.NumberFormat(isAr ? 'ar-AE' : 'en-AE', {style:'currency',currency:'AED'}).format(p.budgetCeilingAED)}</bdi> : (isAr ? 'لم تعتمد بعد' : 'Not ratified yet')}</p>
        <p className="text-sm text-[#736357]">{isAr ? 'عنوان المصدر أدناه مرجع مستقل؛ لا يستبدل قرار الجلسة.' : 'The source title below is a separate reference, not the session decision.'}</p>
      </section>)}
      <div className="grid gap-3 sm:grid-cols-3">
        <p className="rounded border bg-white ps-4 pe-4 py-4">{isAr ? 'مراجع البرامج' : 'Program references'}: {programs.length}</p>
        <p className="rounded border bg-white ps-4 pe-4 py-4">{isAr ? 'سجلات أدلة المحاكاة' : 'Recorded simulation evidence'}: {evidence.filter(e => e.isComplete).length} {isAr ? 'من' : 'of'} {evidence.length}</p>
        <p className="rounded border bg-white ps-4 pe-4 py-4">{isAr ? 'تصعيدات مسجلة معلقة' : 'Recorded pending escalations'}: {escalations.filter(e => e.status === 'PENDING_EXECUTIVE_ACTION').length}</p>
      </div>
      <div className="overflow-x-auto rounded border bg-white"><table className="w-full text-start"><thead><tr>{[isAr ? 'البرنامج' : 'Program', isAr ? 'السياق المرجعي' : 'Reference context', isAr ? 'التقرير التشغيلي' : 'Operational report'].map(label => <th key={label} className="ps-4 pe-4 py-3 text-start">{label}</th>)}</tr></thead><tbody>
        {programs.map(p => <tr key={p.id} className="border-t"><td className="ps-4 pe-4 py-3">{isAr ? p.nameAr : p.nameEn}{p.isLiveSessionProgram && <button type="button" onClick={() => setView('PROGRAM_DECISIONS')} className="mt-2 block rounded border border-[#8B261E] ps-3 pe-3 py-2 text-[#8B261E]">{isAr ? 'فتح قرارات الملتقى' : 'Open biennial decisions'}</button>}</td><td className="ps-4 pe-4 py-3">{(isAr ? p.locationAr : p.locationEn) || (isAr ? 'غير مسجّل' : 'Not recorded')}</td><td className="ps-4 pe-4 py-3">{p.isLiveSessionProgram ? (isAr ? 'متصل بأدلة الجلسة التجريبية' : 'Connected to session evidence') : (isAr ? 'لم يرد تقرير — الجهة المسؤولة' : 'Not reported — responsible department')}</td></tr>)}
      </tbody></table></div>
      <section className="rounded border bg-white ps-4 pe-4 py-4"><h2 className="text-xl font-semibold">{isAr ? 'التداخل الزمني وتخصيص الموارد' : 'Calendar overlaps and resource allocation'}</h2>
        <p>{isAr ? 'لا تتوافر جداول تكليف حصرية كافية لإثبات تعارض موارد. اشتراك المنسق أو الموقع وحده ليس إثباتاً.' : 'Exclusive booking schedules are insufficient to establish resource conflicts. A shared coordinator or venue alone is not proof.'}</p>
        {conflicts.map((r,i) => <p key={i}>{programName(r.programA)} · {programName(r.programB)} · {r.datesDescription} · {r.type === 'RESOURCE_CONFLICT' ? (isAr ? 'تعارض حجز حصري' : 'Exclusive booking conflict') : (isAr ? 'تداخل زمني محتمل' : 'Potential calendar overlap')}</p>)}
      </section>
    </div>}
    <div hidden={view !== 'PROGRAM_DECISIONS'} className="space-y-5">
      <section className="rounded border bg-white ps-4 pe-4 py-4"><h2 className="text-xl font-semibold">{isAr ? 'سجل التصعيد التنفيذي' : 'Executive escalations docket'}</h2>
        {!escalations.length && <p>{isAr ? 'لا توجد إحالات تنفيذية مسجّلة؛ وزن العمل وحده لا ينشئ طلب إعفاء هندسي.' : 'No executive escalations recorded. Artwork weight alone does not establish an engineering waiver request.'}</p>}
        {escalations.map(e => <article key={e.id} className="mt-3 space-y-2 rounded border ps-4 pe-4 py-4"><h3>{e.programName} · {e.originatingDepartment}</h3><p>{e.reason}</p><p>{e.supportingEvidenceRef}</p><p>{e.requestedDecision}</p><p>{e.submittedAt}</p>
          {e.executiveDisposition === 'DEFERRED' && e.status === 'PENDING_EXECUTIVE_ACTION' && <p role="status">{isAr ? 'مؤجلة — تبقى مفتوحة لاتخاذ القرار النهائي' : 'Deferred — remains open for a final decision'}</p>}
          {Boolean(e.decisionHistory?.length) && <details><summary>{isAr ? 'سجل القرارات' : 'Decision history'}</summary><ul>{e.decisionHistory?.map((entry,index) => <li key={index}>{entry.disposition === 'DEFERRED' ? (isAr ? 'تأجيل' : 'Deferred') : entry.disposition === 'APPROVED' ? (isAr ? 'موافقة' : 'Approved') : (isAr ? 'رفض' : 'Rejected')} · {entry.at}</li>)}</ul></details>}
          {e.status === 'PENDING_EXECUTIVE_ACTION' ? <div className="flex flex-wrap gap-2">{(['APPROVED','REJECTED','DEFERRED'] as const).map((d,i) => <button type="button" key={d} disabled={!e.supportingEvidenceRef.trim() || (d === 'DEFERRED' && e.executiveDisposition === 'DEFERRED')} className="rounded border ps-3 pe-3 py-2 disabled:opacity-50" onClick={() => onResolveEscalation(e.id,d)}>{isAr ? ['تسجيل الموافقة','تسجيل الرفض','تسجيل التأجيل'][i] : ['Record approval','Record rejection','Record deferral'][i]}</button>)}</div> : <p role="status">{e.executiveDisposition === 'APPROVED' ? (isAr ? 'موافقة' : 'Approved') : (isAr ? 'رفض' : 'Rejected')} · {e.decidedAt}</p>}
        </article>)}
        <p className="mt-3 text-sm">{isAr ? 'التوجيه التنفيذي لا يمنح تصريحاً فنياً أو مالياً؛ تظل بوابات الجهات المختصة مستقلة.' : 'Executive disposition does not grant technical or financial clearance; specialist gates remain independent.'}</p>
      </section>
      {children}
    </div>
    <section className="rounded border bg-white ps-4 pe-4 py-4"><h2 className="text-xl font-semibold">{isAr ? 'أدلة الجلسة — أفق كوفي (84 كغ)' : 'Session evidence — Kufic Horizon (84 kg)'}</h2>
      <p>{isAr ? 'سجلات محاكاة؛ ليست نسبة صحة للبرنامج أو معاملات خارجية.' : 'Simulation records; not a program health score or external transactions.'}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{evidence.map((e,i) => <article key={i} className={`rounded border ps-4 pe-4 py-3 ${e.isComplete ? 'bg-emerald-50' : 'bg-stone-50'}`}><h3 className="font-semibold">{(isAr ? ['التشريفات','الفريق الفني','اللوجستيات','المالية'] : ['PR & Protocol','Technical','Logistics','Finance'])[i]}</h3><p>{e.label}</p><p className="text-sm text-[#736357]">{e.evidenceRef}</p></article>)}</div>
    </section>
  </section>;
}
