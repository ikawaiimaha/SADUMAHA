import React, { useState } from 'react';
import { Language, ExhibitionProgramme, WorkspaceTab } from '../../types';
import { COMMITTEE_SUBMISSION, ARTWORKS } from '../../data/mockData';
import { useI18n } from '../../context/I18nContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { StatusProgressIndicator } from '../common/StatusProgressIndicator';
import { ArtistNominationBuilder } from '../ArtistNominationBuilder';
import { ArtworkThumbnail } from '../common/ArtworkThumbnail';
import { CuratorialCanvas } from './CuratorialCanvas';
import { AlertCircle, Award, CheckCircle2, Feather, Scale, ShieldCheck, Stamp, UserPlus } from 'lucide-react';

export interface CommitteeViewProps {
  lang?: Language;
  selectedProgramme?: ExhibitionProgramme;
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

export const CommitteeView: React.FC<CommitteeViewProps> = (props) => {
  const i18n = useI18n();
  const workspace = useWorkspace();
  const lang = props.lang ?? i18n.lang;
  const isAr = lang === 'ar';
  const { formatNumber, localizeDigits } = i18n;
  const onNavigateTab = props.onNavigateTab ?? workspace.navigateTab;
  const currentRole = workspace.currentRole;
  const isCuratorOrCoordinator = currentRole === 'COORDINATOR' || currentRole === 'SDC_COORDINATOR' || (currentRole as string) === 'CURATOR';
  const sub = COMMITTEE_SUBMISSION;
  const [viewMode, setViewMode] = useState<'dossier' | 'builder'>('dossier');
  const [sampleScriptReviewed, setSampleScriptReviewed] = useState(false);
  const [samplePoetryReviewed, setSamplePoetryReviewed] = useState(false);
  const isTextualVerificationComplete = sampleScriptReviewed && samplePoetryReviewed;
  const rubric = sub.committeeRubric;
  const curatorialTotal = rubric
    ? rubric.alignmentTheme + rubric.artisticQuality + rubric.innovation + rubric.culturalValue + rubric.artistProfile + rubric.exhibitionHistory + rubric.strategicValue + rubric.calligraphyRelevance
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <div className="sticky top-16 z-20 rounded-lg border border-sadu-gold bg-sadu-linen p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sadu-ink"><Scale className="h-4 w-4" /><span>{isAr ? 'لجنة الاختيار والتحكيم الفني للبينالي' : 'Biennial Curatorial & Selection Jury Panel'}</span></div>
            <h1 className="text-2xl font-editorial font-bold text-sadu-charcoal sm:text-3xl">{isAr ? 'ملف التقييم الشامل والتحقق الثقافي' : 'Curatorial Master Dossier & Verification Ledger'}</h1>
            <p className="mt-1 text-xs text-sadu-muted sm:text-sm">{isAr ? 'ملف متكامل يستعرض الرؤية، المخطط المكاني، معايير التقييم، واعتمادات التحقق.' : 'A unified executive scroll detailing the concept, spatial mapping, read-only juror scores, and cultural verification.'}</p>
          </div>
          <div className="flex items-center gap-3">
            {isCuratorOrCoordinator && <button onClick={() => setViewMode(viewMode === 'builder' ? 'dossier' : 'builder')} className={`flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2.5 text-xs font-bold shadow-2xs transition-all ${viewMode === 'builder' ? 'border-sadu-ink bg-sadu-ink text-white' : 'border-sadu-gold bg-sadu-sand text-sadu-brick hover:bg-sadu-sand-dark'}`}><UserPlus className="h-4 w-4" />{viewMode === 'builder' ? (isAr ? 'العودة للملف الشامل' : 'Back to Master Dossier') : (isAr ? '+ بناء ترشيح جديد' : '+ Build New Nomination')}</button>}
            <StatusProgressIndicator id="committee-dossier-status" type="committee" currentStep={isTextualVerificationComplete ? 4 : 3} totalSteps={5} progressPercent={isTextualVerificationComplete ? 85 : 60} statusLevel={isTextualVerificationComplete ? 'in_progress' : 'at_risk'} labelEn={isTextualVerificationComplete ? 'Sample reviews recorded' : 'Sample review pending'} labelAr={isTextualVerificationComplete ? 'سُجلت مراجعات تجريبية' : 'بانتظار مراجعة تجريبية'} nextActionEn="Local sample reviews only; no signature, contract or payment authority." nextActionAr="مراجعات محلية تجريبية فقط؛ دون صلاحية توقيع أو تعاقد أو دفع." variant="compact" interactive />
          </div>
        </div>
        {viewMode === 'dossier' && <div className="mt-4 flex items-center gap-2 rounded-md border border-sadu-gold bg-sadu-sand p-3 text-xs text-sadu-ink"><ShieldCheck className="h-4 w-4 shrink-0 text-sadu-brick" /><span>{isAr ? 'ضمان الخصوصية: يُعرض هذا الملف للجنة التحكيم مجرداً من أرقام الحسابات البنكية ووثائق السفر.' : 'Privacy Shield: This dossier is presented to the Jury stripped of banking details and travel documents.'}</span><span className="ms-auto shrink-0 font-mono text-[11px] font-bold text-sadu-muted">{sub.id}</span></div>}
      </div>

      {viewMode === 'builder' ? <ArtistNominationBuilder lang={lang} onSuccess={() => setViewMode('dossier')} onCancel={() => setViewMode('dossier')} /> : <div className="w-full space-y-8">
        <section className="space-y-6 rounded-lg border border-sadu-gold bg-sadu-linen p-6 shadow-xs sm:p-8">
          <div className="border-b border-sadu-gold/40 pb-4"><span className="mb-1 block text-xs font-mono uppercase tracking-wider text-sadu-brick">{isAr ? 'المقترح الفردي للبينالي' : 'Solo Biennial Application'}</span><h2 className="text-2xl font-editorial font-bold text-sadu-charcoal sm:text-3xl">{isAr ? sub.proposalTitleAr : sub.proposalTitleEn}</h2><div className="mt-2 flex flex-wrap items-center gap-2.5"><p className="text-sm font-semibold text-sadu-ink">{isAr ? `الفنان المقترح: ${sub.artistNameAr}` : `Proposed Artist: ${sub.artistNameEn}`}</p>{sub.isTakreem && <span className="inline-flex items-center gap-1 rounded-full border border-sadu-ochre bg-[#FFF9EE] px-2.5 py-0.5 text-xs font-bold text-[#8C601E]"><Award className="h-3.5 w-3.5" />تكريم (Honored Artist)</span>}</div></div>
          <div><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-sadu-muted">{isAr ? 'البيان الفني للمقترح:' : 'Concept Statement:'}</h3><p className="rounded-md border border-sadu-gold bg-sadu-paper p-5 text-base font-editorial leading-relaxed text-sadu-charcoal sm:text-lg">"{isAr ? sub.conceptStatementAr : sub.conceptStatementEn}"</p></div>
          <div className="border-t border-sadu-gold/40 pt-4"><h3 className="mb-4 text-sm font-bold text-sadu-charcoal">{isAr ? 'قائمة الأعمال المقترحة' : 'Proposed Artwork Checklist'}</h3><div className="grid gap-4 md:grid-cols-2">{ARTWORKS.slice(0, 2).map(art => <div key={art.id} className="flex gap-4 rounded-md border border-sadu-gold bg-sadu-sand p-4"><ArtworkThumbnail canonicalCode={art.canonicalCode} className="h-16 w-16 shrink-0 shadow-sm" isAr={isAr} mediumAr={art.mediumAr} mediumEn={art.mediumEn} /><div><span className="block text-[10px] font-mono font-bold text-sadu-brick">{art.canonicalCode}</span><h4 className="mt-0.5 text-sm font-bold text-sadu-charcoal">{isAr ? art.titleAr : art.titleEn}</h4><p className="mt-1 text-[11px] text-sadu-muted">{localizeDigits(art.dimensionsCm)}</p></div></div>)}</div></div>
        </section>

        <section className="rounded-lg border border-sadu-gold bg-sadu-linen p-6 shadow-xs sm:p-8"><CuratorialCanvas /></section>

        <section className="space-y-6 rounded-lg border border-sadu-gold bg-sadu-linen p-6 shadow-xs sm:p-8">
          {sub.hasPreviousParticipation && <div className="flex items-start gap-3 rounded-lg border-2 border-amber-400 bg-amber-50 p-4 text-xs text-amber-950"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><strong className="text-sm">{isAr ? 'تاريخ مشاركة تجريبي' : 'Sample participation history'}</strong><p className="mt-1">{isAr ? 'معايير الجدة خيارات تجريبية وليست لائحة مؤسسية موثقة.' : 'Novelty criteria are demonstration choices, not verified institutional rules.'}</p></div></div>}
          <div className="flex flex-col justify-between gap-3 border-b border-sadu-gold/40 pb-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><span className="rounded bg-sadu-brick px-2 py-0.5 text-[10px] font-mono font-bold text-white">{isAr ? 'مقياس التقييم' : 'Coordinator Score'}</span><h2 className="text-xl font-editorial font-bold text-sadu-charcoal">{isAr ? 'توصية الجدارة الفنية' : 'Artistic Merit Recommendation'}</h2></div><p className="mt-1 text-xs text-sadu-muted">{isAr ? 'الدرجات المقفلة التي قدمها منسق المعارض.' : 'Read-only scores submitted by the Exhibition Coordinator.'}</p></div><div className="rounded-md border border-sadu-gold bg-sadu-sand px-4 py-2 text-end"><span className="text-2xl font-editorial font-bold text-sadu-brick">{localizeDigits(curatorialTotal)} <span className="text-sm font-sans font-normal text-sadu-muted">/ 65</span></span></div></div>
          <div className="grid gap-5 sm:grid-cols-2">{([['Alignment with Biennale Theme', 'التوافق مع ثيمة البينالي', rubric?.alignmentTheme ?? 0, 10], ['Artistic Quality', 'الجودة الفنية والتمكن', rubric?.artisticQuality ?? 0, 10], ['Abstract Innovation', 'الابتكار التجريدي', rubric?.innovation ?? 0, 10], ['Contemporary Relevance', 'المعاصرة والارتباط الراهن', rubric?.culturalValue ?? 0, 10], ['Career Standing', 'المكانة والمسار', rubric?.artistProfile ?? 0, 5], ['Exhibition Record', 'سجل المعارض', rubric?.exhibitionHistory ?? 0, 5], ['Strategic Value', 'القيمة الاستراتيجية', rubric?.strategicValue ?? 0, 5], ['Calligraphy Relevance', 'صلة العمل بفن الخط', rubric?.calligraphyRelevance ?? 0, 10]] as const).map(([labelEn, labelAr, value, max]) => <div key={labelEn} className="space-y-1.5"><div className="flex justify-between text-xs font-semibold text-sadu-charcoal"><span>{isAr ? labelAr : labelEn}</span><span className="font-mono text-sadu-brick">{value} / {max}</span></div><div className="h-2 w-full overflow-hidden rounded-full bg-sadu-gold/30"><div className="h-full rounded-full bg-sadu-brick" style={{ width: `${(value / max) * 100}%` }} /></div></div>)}</div>
          <div className="space-y-3 border-t border-sadu-gold/40 pt-4"><h3 className="text-sm font-bold text-sadu-charcoal">{isAr ? 'ملاحظات وتوصيات' : 'Coordinator Notes & Recommendations'}</h3>{sub.reviewerNotes.map((note, index) => <div key={index} className="rounded-md border border-sadu-gold bg-sadu-paper p-4"><span className="text-xs font-bold text-sadu-ink">{note.reviewerName}</span><p className="mt-1.5 text-xs italic leading-relaxed text-sadu-charcoal">"{isAr ? note.commentAr : note.commentEn}"</p></div>)}</div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="space-y-4 rounded-lg border border-sadu-gold bg-sadu-linen p-6 shadow-xs"><h2 className="flex items-center gap-2 text-lg font-editorial font-bold text-sadu-charcoal"><Feather className="h-5 w-5 text-sadu-brick" />{isAr ? 'التحقق الثقافي والنصوصي' : 'Cultural & Textual Verification'}</h2><p className="text-xs text-sadu-muted">{isAr ? 'تدقيق النصوص الشعرية الكلاسيكية المقترحة للمعرض.' : 'Review of classical Arabic poetry transcriptions.'}</p><div className="rounded-lg border border-sadu-gold bg-sadu-paper p-3 text-xs"><span className="block text-[10px] font-mono font-bold text-sadu-brick">SCB-2026-YN-01</span><p className="py-1 font-editorial text-sm font-semibold text-sadu-charcoal">"مُعَلِّلَتي بالوَصلِ وَالمَوتُ دونَهُ"</p><span className="block text-[10px] text-sadu-muted">{isAr ? 'أبو فراس الحمداني · بانتظار مراجعة تخصصية' : 'Abu Firas Al-Hamadani · specialist review pending'}</span></div><div className="flex items-center justify-between border-t border-sadu-gold/50 pt-2"><span className="text-[10px] font-mono text-sadu-muted">{sampleScriptReviewed ? 'DEMO-SCRIPT-REVIEW' : (isAr ? 'بانتظار مراجعة تجريبية' : 'Awaiting sample review')}</span><button type="button" onClick={() => setSampleScriptReviewed(!sampleScriptReviewed)} className="rounded bg-sadu-brick px-3 py-1.5 text-xs font-bold text-white">{sampleScriptReviewed ? (isAr ? 'إعادة ضبط' : 'Reset') : (isAr ? 'تسجيل مراجعة' : 'Record Check')}</button></div></section>
          <section className="space-y-4 rounded-lg border border-sadu-gold bg-sadu-linen p-6 shadow-xs"><h2 className="flex items-center gap-2 text-lg font-editorial font-bold text-sadu-charcoal"><AlertCircle className="h-5 w-5 text-sadu-brick" />{isAr ? 'شروط الاعتماد الملزمة' : 'Binding Approval Conditions'}</h2><div className="space-y-3">{sub.conditionsEn.map((condition, index) => <div key={index} className="rounded-md border border-sadu-gold bg-sadu-sand p-3"><div className="flex items-start gap-2"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sadu-brick text-[10px] font-bold text-white">{index + 1}</span><p className="text-xs text-sadu-charcoal">{isAr ? sub.conditionsAr[index] : condition}</p></div><div className="mt-2 flex justify-end"><StatusProgressIndicator id={`committee-condition-${index}`} type="committee" currentStep={index === 0 ? 5 : 3} totalSteps={5} progressPercent={index === 0 ? 100 : 50} statusLevel={index === 0 ? 'completed' : 'in_progress'} labelEn={index === 0 ? 'Condition Cleared' : 'Reconciliation Active'} labelAr={index === 0 ? 'مستوفى بالكامل' : 'تسوية الملاحظة جارية'} variant="compact" interactive={false} /></div></div>)}</div></section>
        </div>
        <div className="flex justify-end border-t border-sadu-gold/60 pt-6"><button onClick={() => onNavigateTab('contracts')} className="flex cursor-pointer items-center gap-2 rounded-md bg-sadu-brick px-8 py-3 text-sm font-bold text-white shadow-xs hover:bg-sadu-brick-dark"><Stamp className="h-5 w-5" />{isAr ? 'توليد العقد الثنائي للموافقة ←' : 'Proceed to Bilateral Contract Approval →'}</button></div>
      </div>}
    </div>
  );
};
