import React, { useState } from 'react';
import { Language, ExhibitionProgramme, WorkspaceTab } from '../../types';
import { COMMITTEE_SUBMISSION } from '../../data/mockData';
import { useI18n } from '../../context/I18nContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { StatusProgressIndicator } from '../common/StatusProgressIndicator';
import { ArtistNominationBuilder } from '../ArtistNominationBuilder';
import { AlertTriangle, Ban, CheckCircle2, ChevronRight, FileCheck, FileText, History, Lock, Scale } from 'lucide-react';

export interface CommitteeViewProps {
  lang?: Language;
  selectedProgramme?: ExhibitionProgramme;
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

type AssessmentTab = 'evidence' | 'rubric' | 'decision';

export const CommitteeView: React.FC<CommitteeViewProps> = (props) => {
  const i18n = useI18n();
  const workspace = useWorkspace();
  const lang = props.lang ?? i18n.lang;
  const isAr = lang === 'ar';
  const { formatNumber } = i18n;
  const onNavigateTab = props.onNavigateTab ?? workspace.navigateTab;
  const currentRole = workspace.currentRole;
  const isCuratorOrCoordinator = currentRole === 'COORDINATOR' || currentRole === 'SDC_COORDINATOR';
  const sub = COMMITTEE_SUBMISSION;
  const [viewMode, setViewMode] = useState<'dossier' | 'builder'>('dossier');
  const [activeTab, setActiveTab] = useState<AssessmentTab>('evidence');
  const [isRecused, setIsRecused] = useState<boolean | null>(null);
  const [scores, setScores] = useState({ conceptual: 0, technical: 0, thematic: 0 });
  const [decision, setDecision] = useState<'approve' | 'conditional' | 'reject' | null>(null);
  const dossierVersion = 'v1.2-FINAL';
  const timestamp = '2026-09-22 10:14 GST';
  const totalScore = scores.conceptual + scores.technical + scores.thematic;
  const decisionOptions: Array<[string, string, string, React.ElementType]> = [
    ['approve', 'Approve', 'موافقة نهائية', CheckCircle2],
    ['conditional', 'Conditional', 'موافقة مشروطة', AlertTriangle],
    ['reject', 'Not Selected', 'استبعاد', Ban],
  ];

  const setScore = (key: keyof typeof scores, value: number) => setScores(previous => ({ ...previous, [key]: value }));
  const handleTabKeyDown = (event: React.KeyboardEvent, tab: AssessmentTab) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setActiveTab(tab);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in duration-300 pb-12">
      <section className="rounded-lg border border-sadu-gold bg-sadu-linen p-6 shadow-xs sm:p-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sadu-brick"><Scale className="h-4 w-4" />{isAr ? 'لجنة التحكيم والتقييم الفني' : 'Curatorial Assessment Committee'}</div>
        <h1 className="mt-2 text-2xl font-editorial font-bold text-sadu-charcoal sm:text-3xl">{isAr ? 'ملف القراءة والتقييم الآمن' : 'Secure Reading Dossier'}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-mono text-sadu-muted"><span className="rounded border border-sadu-gold/50 bg-white px-2 py-1"><bdi dir="ltr">ID: SCB-YN-02</bdi></span><span className="flex items-center gap-1"><History className="h-3.5 w-3.5" />Payload: {dossierVersion} ({timestamp})</span></div>
        {isCuratorOrCoordinator && <button type="button" onClick={() => setViewMode(viewMode === 'builder' ? 'dossier' : 'builder')} className="mt-5 flex cursor-pointer items-center gap-2 rounded-md border border-sadu-gold bg-sadu-sand px-4 py-2 text-xs font-bold text-sadu-brick hover:bg-sadu-sand-dark">{viewMode === 'builder' ? 'Back to Dossier' : 'Build New Nomination'}</button>}
      </section>

      {viewMode === 'builder' ? <ArtistNominationBuilder lang={lang} onSuccess={() => setViewMode('dossier')} onCancel={() => setViewMode('dossier')} /> : (<>
        {isRecused === null && <section className="rounded-lg border-2 border-sadu-gold bg-white p-6 shadow-md"><h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-sadu-charcoal"><AlertTriangle className="h-5 w-5 text-sadu-brick" />{isAr ? 'إقرار تضارب المصالح (إلزامي)' : 'Mandatory Conflict of Interest Declaration'}</h2><p className="mb-6 text-sm leading-relaxed text-sadu-muted">{isAr ? 'قبل الوصول إلى مساحة التقييم، يجب الإقرار بعدم وجود أي تضارب مصالح مالي أو شخصي أو مهني مع الفنان، أو التنحي عن تحكيم هذا الملف.' : 'Before accessing the assessment workspace, declare that you have no financial, personal, or professional conflict of interest with this applicant, or recuse yourself from this decision.'}</p><div className="flex flex-col gap-4 sm:flex-row"><button type="button" onClick={() => setIsRecused(false)} className="flex cursor-pointer items-center justify-center gap-2 rounded bg-sadu-charcoal px-6 py-3 text-sm font-bold text-white hover:bg-black"><CheckCircle2 className="h-4 w-4" />{isAr ? 'أقر بعدم وجود تضارب مصالح' : 'I Declare No Conflict of Interest'}</button><button type="button" onClick={() => setIsRecused(true)} className="flex cursor-pointer items-center justify-center gap-2 rounded border border-sadu-gold bg-white px-6 py-3 text-sm font-bold text-sadu-brick hover:bg-red-50"><Ban className="h-4 w-4" />{isAr ? 'التنحي عن تحكيم هذا الملف' : 'Recuse Myself from this Dossier'}</button></div></section>}

        {isRecused === true && <section className="space-y-4 rounded-lg border border-sadu-gold bg-sadu-sand p-8 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-sadu-gold/30 bg-white"><Lock className="h-8 w-8 text-sadu-muted" /></div><h2 className="text-xl font-editorial font-bold text-sadu-charcoal">{isAr ? 'تم تقييد الوصول بسبب التنحي' : 'Access Restricted due to Recusal'}</h2><p className="mx-auto max-w-lg text-sm text-sadu-muted">{isAr ? 'تم إغلاق صلاحية التقييم والتصويت على هذا الملف، وسيتم تسجيل التنحي في السجل المؤسسي.' : 'Assessment and voting rights for this dossier have been revoked. This recusal is logged in the institutional ledger.'}</p></section>}

        {isRecused === false && <div className="space-y-6">
          <div role="tablist" aria-label={isAr ? 'أقسام ملف التقييم' : 'Assessment Dossier Sections'} className="flex flex-wrap gap-2 border-b border-sadu-gold/40 pb-2">{[
            { id: 'evidence' as const, en: '1. Immutable Evidence', ar: '١. الأدلة المرفقة' },
            { id: 'rubric' as const, en: '2. Scoring Rubric', ar: '٢. معايير التقييم' },
            { id: 'decision' as const, en: '3. Final Decision', ar: '٣. القرار النهائي' },
          ].map(tab => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} aria-controls={`section-${tab.id}`} id={`tab-${tab.id}`} tabIndex={activeTab === tab.id ? 0 : -1} onClick={() => setActiveTab(tab.id)} onKeyDown={event => handleTabKeyDown(event, tab.id)} className={`flex cursor-pointer items-center gap-2 rounded-t-md border-b-2 px-4 py-2 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sadu-brick ${activeTab === tab.id ? 'border-sadu-brick bg-white text-sadu-brick' : 'border-transparent text-sadu-muted hover:bg-white/50 hover:text-sadu-charcoal'}`}><FileText className="h-4 w-4" />{isAr ? tab.ar : tab.en}</button>)}</div>

          <section role="tabpanel" id="section-evidence" aria-labelledby="tab-evidence" hidden={activeTab !== 'evidence'} className="rounded-b-lg rounded-tr-lg border border-sadu-gold/50 bg-white p-6 shadow-xs"><h2 className="mb-4 text-lg font-editorial font-bold text-sadu-charcoal">{isAr ? 'الأدلة والملفات الأصلية' : 'Source Evidence & Portfolio'}</h2><div className="grid gap-6 md:grid-cols-2"><div className="space-y-4"><div className="rounded border border-sadu-gold/30 bg-sadu-paper p-4"><span className="mb-1 block text-[10px] font-mono uppercase text-sadu-muted">Title & Medium</span><p className="text-sm font-bold text-sadu-charcoal">Kufic Horizon (أفق كوفي)</p><p className="mt-1 text-xs text-sadu-muted">Bronze Sculpture, 84kg. Dimensions: 120 x 80 x 40 cm.</p></div><div className="rounded border border-sadu-gold/30 bg-sadu-paper p-4"><span className="mb-1 block text-[10px] font-mono uppercase text-sadu-muted">Artist Concept Statement</span><p className="font-editorial text-sm leading-relaxed text-sadu-charcoal">"This work explores the spatial tension between traditional Kufic architectural inscriptions and modern brutalist forms..."</p></div></div><div className="flex min-h-52 flex-col items-center justify-center rounded border-2 border-dashed border-sadu-gold/40 bg-sadu-linen p-8 text-center"><FileText className="mb-3 h-8 w-8 text-sadu-muted" /><span className="text-xs font-bold text-sadu-charcoal">{isAr ? 'تم التحقق من المرفقات' : 'High-Res Portfolio Verified'}</span><span className="mt-1 text-[10px] font-mono text-sadu-muted">SHA-256: 9f86d081...</span><button type="button" className="mt-4 rounded border border-sadu-gold bg-white px-4 py-2 text-xs font-bold text-sadu-charcoal hover:bg-sadu-sand">{isAr ? 'استعراض المعرض المرفق' : 'Open Evidence Viewer'}</button></div></div><div className="mt-6 flex justify-end"><button type="button" onClick={() => setActiveTab('rubric')} className="flex items-center gap-2 rounded bg-sadu-charcoal px-4 py-2 text-xs font-bold text-white">{isAr ? 'الانتقال إلى التقييم' : 'Proceed to Rubric'}<ChevronRight className="h-4 w-4 rtl:rotate-180" /></button></div></section>

          <section role="tabpanel" id="section-rubric" aria-labelledby="tab-rubric" hidden={activeTab !== 'rubric'} className="rounded-b-lg rounded-tr-lg border border-sadu-gold/50 bg-white p-6 shadow-xs"><div className="mb-6 flex items-start justify-between"><div><h2 className="mb-1 text-lg font-editorial font-bold text-sadu-charcoal">{isAr ? 'مصفوفة التقييم المؤسسي' : 'Institutional Scoring Matrix'}</h2><p className="max-w-md text-xs text-sadu-muted">{isAr ? 'يرجى تقييم العمل بناءً على المعايير المعتمدة. يجب تقديم درجة لكل معيار لتفعيل القرار.' : 'Evaluate the submission against the approved criteria. All dimensions must be scored.'}</p></div><div className="rounded-lg border border-sadu-gold bg-sadu-linen p-3 text-center"><span className="block text-[10px] font-mono uppercase text-sadu-muted">{isAr ? 'المجموع' : 'Total Score'}</span><span className={`text-2xl font-editorial font-bold ${totalScore >= 70 ? 'text-sadu-sage' : 'text-sadu-charcoal'}`}>{totalScore} <span className="text-sm font-sans font-normal text-sadu-muted">/ 100</span></span></div></div><div className="space-y-6">{([['conceptual', 'Conceptual Depth (Max 40)', 'العمق المفاهيمي (٤٠ نقطة)', 40], ['technical', 'Technical Mastery (Max 40)', 'المهارة الفنية (٤٠ نقطة)', 40], ['thematic', 'Thematic Alignment (Max 20)', 'التوافق مع السمة (٢٠ نقطة)', 20]] as const).map(([key, labelEn, labelAr, max]) => <div key={key} className="space-y-2"><div className="flex justify-between text-sm"><span className="font-bold text-sadu-charcoal">{isAr ? labelAr : labelEn}</span><span className="font-mono text-sadu-brick">{scores[key]}</span></div><input type="range" min="0" max={max} value={scores[key]} onChange={event => setScores(previous => ({ ...previous, [key]: Number(event.target.value) }))} className="w-full accent-sadu-brick" aria-label={isAr ? labelAr : labelEn} /></div>)}</div><div className="mt-8 flex justify-end"><button type="button" onClick={() => setActiveTab('decision')} disabled={totalScore === 0} className="flex items-center gap-2 rounded bg-sadu-charcoal px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{isAr ? 'تأكيد التقييم والمتابعة' : 'Confirm Score & Proceed'}<ChevronRight className="h-4 w-4 rtl:rotate-180" /></button></div></section>

          <section role="tabpanel" id="section-decision" aria-labelledby="tab-decision" hidden={activeTab !== 'decision'} className="rounded-b-lg rounded-tr-lg border border-sadu-gold/50 bg-white p-6 shadow-xs"><h2 className="mb-4 text-lg font-editorial font-bold text-sadu-charcoal">{isAr ? 'تسجيل القرار الإداري' : 'Administrative Decision Record'}</h2><div className="mb-6 grid gap-4 sm:grid-cols-3">{decisionOptions.map(([value, labelEn, labelAr, DecisionIcon]) => <button type="button" key={value} onClick={() => setDecision(value as typeof decision)} className={`rounded-lg border p-4 text-start transition-all ${decision === value ? 'border-sadu-brick bg-sadu-sand text-sadu-brick' : 'border-sadu-gold/50 bg-white text-sadu-charcoal hover:border-sadu-brick'}`}><DecisionIcon className="mb-2 h-5 w-5" /><span className="block text-sm font-bold">{isAr ? labelAr : labelEn}</span><span className="mt-1 block text-[10px] text-sadu-muted">{value === 'approve' ? 'Commit to Approved Scope' : 'Requires documented review'}</span></button>)}</div><div className="mt-6 flex items-center justify-between border-t border-sadu-gold/30 pt-6"><div className="text-xs text-sadu-muted">{isAr ? 'سيتم ربط هذا القرار بالنسخة:' : 'Decision will be bound to version:'} <strong className="font-mono text-sadu-charcoal">{dossierVersion}</strong></div><button type="button" disabled={!decision} className="rounded bg-sadu-brick px-6 py-2.5 text-sm font-bold text-white shadow-xs transition-colors hover:bg-sadu-brick-dark disabled:opacity-50">{isAr ? 'توقيع القرار رقمياً' : 'Sign & Submit Decision'}</button></div></section>
        </div>}
        </>)}
    </div>
  );
};
