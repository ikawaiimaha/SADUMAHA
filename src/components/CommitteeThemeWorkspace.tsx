import { useLocalDraft } from '../hooks/useLocalDraft';
import { scrollWorkspaceToTop } from '../utils/scrollWorkspaceToTop';
import { useMockupText } from '../i18n/useMockupText';
import { useI18n } from '../context/I18nContext';
import React, { useEffect, useRef, useId, useMemo, useState } from 'react';
import { ClipboardList, Wand2, Send, CheckCircle2, RotateCcw, Sparkles, BookOpen } from 'lucide-react';

export interface CommitteeThemeDraft {
  arabicName: string;
  englishName: string;
  aestheticFramework: string;
  contemporaryRelevance: string;
  curatorialJustification: string;
  directorNotes?: string;
  chairmanNotes?: string;
  /** Backward-compatible legacy alias */
  definition?: string;
}

export interface CommitteeThemeWorkspaceProps {
  /** Identifier of the biennial/event these three theme proposals belong to. */
  eventId?: string;
  ratifiedTheme?: { arabicName: string } | null;
  /** Called with the three completed theme drafts once presented to the Chairman. */
  onPresentToChairman?: (themes: CommitteeThemeDraft[], eventId?: string) => void;
  onAutoNavigate?: (role: string) => void;
  onBackToRoles?: () => void;
}

export const isThemeComplete = (theme: CommitteeThemeDraft): boolean =>
    Boolean(theme.arabicName?.trim()) &&
    Boolean(theme.aestheticFramework?.trim()) &&
    Boolean(theme.contemporaryRelevance?.trim()) &&
    Boolean(theme.curatorialJustification?.trim());

export const isThemeBatchComplete = (themes: CommitteeThemeDraft[]): boolean =>
  themes.length === 3 && themes.every(isThemeComplete);

const EMPTY_THEME: CommitteeThemeDraft = {
  arabicName: '',
  englishName: '',
  aestheticFramework: '',
  contemporaryRelevance: '',
  curatorialJustification: '',
  definition: '',
};

const createEmptyThemes = (): CommitteeThemeDraft[] => [
  { ...EMPTY_THEME },
  { ...EMPTY_THEME },
  { ...EMPTY_THEME },
];

/**
 * Preparatory Committee Workspace:
 * Strict Curatorial Rigor: Themes cannot be justified with bureaucratic fluff.
 * Exactly three theme proposals must be defended simultaneously using meticulous
 * artistic criteria: Aesthetic Framework, Contemporary Relevance, and Curatorial Justification.
 */
const CommitteeThemeWorkspace: React.FC<CommitteeThemeWorkspaceProps> = ({
  eventId,
  ratifiedTheme,
  onPresentToChairman,
  onAutoNavigate,
  onBackToRoles,
}) => {
  const DEMO_THEMES: CommitteeThemeDraft[] = [
    {
      arabicName: "الميزان",
      englishName: "Al Mizan - Balance",
      aestheticFramework: "استكشاف التوازن البصري والروحي في التكوينات الهندسية للخط العربي.",
      contemporaryRelevance: "ربط مفاهيم التوازن الكلاسيكية بالفنون البصرية المعاصرة والوسائط المتعددة.",
      curatorialJustification: "يسلط الضوء على جوهر الخط كفن هندسي وروحي متكامل يعكس توازن الكون."
    },
    {
      arabicName: "النقطة",
      englishName: "Al Nuqta - The Dot",
      aestheticFramework: "التركيز على النقطة كأساس مرجعي للبناء الهندسي للحرف ووحدة قياس الجمال.",
      contemporaryRelevance: "تفسير النقطة في سياق الفن التجريدي والمفاهيمي الحديث.",
      curatorialJustification: "العودة إلى الجذور وبداية التكوين في الفنون الإسلامية كأساس للانطلاق نحو الحداثة."
    },
    {
      arabicName: "تجليات",
      englishName: "Tajliyat - Manifestations",
      aestheticFramework: "إبراز الجانب الصوفي والروحي والحرية الحركية في تشكيلات الخط العربي.",
      contemporaryRelevance: "تقديم الخط العربي كوسيط للتأمل والتواصل الإنساني العابر للثقافات.",
      curatorialJustification: "يفتح آفاقاً واسعة للفنانين للتعبير عن تجاربهم الباطنية ودمجها مع تقنيات العرض الحديثة."
    }
  ];

  const navigationTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { clearTimeout(navigationTimer.current); }, []);
  const tr = useMockupText();
  const { isAr } = useI18n();
  const [themes, setThemes, saveFailed] = useLocalDraft<CommitteeThemeDraft[]>(
    `sadu:draft:v1:${eventId || 'demo'}:committee`, createEmptyThemes(),
    (value): value is CommitteeThemeDraft[] => Array.isArray(value) && value.length === 3 && value.every(theme =>
      theme && ['arabicName', 'englishName', 'aestheticFramework', 'contemporaryRelevance', 'curatorialJustification'].every(field => typeof theme[field] === 'string')));
  const [activeProposal, setActiveProposal] = useState(0);
  const [comparing, setComparing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const baseId = useId();

  const allFieldsFilled = useMemo(
    () => isThemeBatchComplete(themes),
    [themes]
  );

  const filledCount = themes.filter(isThemeComplete).length;

  const updateField = (index: number, field: keyof CommitteeThemeDraft, value: string) => {
    const isArabicField = field === 'arabicName' || field === 'aestheticFramework'
      || field === 'contemporaryRelevance' || field === 'curatorialJustification';
    const sanitizedValue = isArabicField ? value.replace(/[a-zA-Z]/g, '') : value;
    setThemes(current =>
      current.map((theme, themeIndex) => {
        if (themeIndex !== index) return theme;
        const updated = { ...theme, [field]: sanitizedValue };
        updated.definition = `${updated.curatorialJustification} | Aesthetic: ${updated.aestheticFramework} | Relevance: ${updated.contemporaryRelevance}`.trim();
        return updated;
      })
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (ratifiedTheme || !allFieldsFilled || !comparing) return;
    const finalized = themes.map(t => ({
      ...t,
      definition: t.curatorialJustification,
    }));
    onPresentToChairman?.(finalized, eventId);
    setIsSubmitted(true);
    clearTimeout(navigationTimer.current);
    scrollWorkspaceToTop();
    navigationTimer.current = setTimeout(() => {
      onAutoNavigate?.('DIRECTOR');
    }, 3500);
  };

  const handleAutoFillDemo = () => {
    if (ratifiedTheme || isSubmitted) return;
    setThemes(DEMO_THEMES.map(theme => ({ ...theme })));
  };

  const handleStartNewBatch = () => {
    clearTimeout(navigationTimer.current);
    navigationTimer.current = undefined;
    if (ratifiedTheme) return;
    setThemes(createEmptyThemes());
    setIsSubmitted(false);
    setComparing(false);
    setActiveProposal(0);
  };

  if (ratifiedTheme) {
    return (
      <section className="mx-auto w-full max-w-5xl rounded-lg border border-sadu-gold bg-[#F7F1E6] p-6 text-start" dir={isAr ? 'rtl' : 'ltr'}>
        <p role="status" className="font-bold text-sadu-charcoal">
          {isAr ? 'الحالة: مقفل — اعتمد رئيس الدائرة الثيمة' : 'Status: Locked - Theme Ratified by Chairman'}
        </p>
        <p className="mt-3 text-sadu-muted" dir="rtl">{ratifiedTheme.arabicName}</p>
        {onBackToRoles && <button type="button" onClick={onBackToRoles} className="mt-4 rounded border border-sadu-gold ps-3 pe-3 py-2 text-sm">
          {isAr ? 'تغيير الدور' : 'Switch Role'}
        </button>}
      </section>
    );
  }

  if (isSubmitted) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 rounded-lg border border-sadu-gold bg-sadu-paper p-6 shadow-xs">
        <div className="flex items-center gap-3 rounded-md border border-emerald-300 bg-emerald-50 p-4">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-700" />
          <div>
            <p className="font-editorial text-base font-bold text-sadu-charcoal"> {isAr ? "أُحيلت المقترحات إلى مدير الملتقى" : "Submitted to the Biennial Director"} </p>
            <p className="text-xs text-sadu-muted"> {tr("All three rigorously formulated theme proposals have been submitted for executive review and budget allocation.")} </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {themes.map((theme, index) => (
            <div
              key={index}
              className="space-y-3 rounded-lg border border-sadu-gold/60 bg-white p-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-sadu-gold/30 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-sadu-muted"> {tr("Candidate Proposal")} {index + 1}
                </span>
                <span className="rounded bg-emerald-100 ps-1.5 pe-1.5 py-0.5 text-[9px] font-bold text-emerald-800"> {tr("Rigorously Defended")} </span>
              </div>

              <div>
                <span className="block font-editorial text-base font-bold text-sadu-charcoal">
                  {isAr ? theme.arabicName : (theme.englishName || theme.arabicName)}
                </span>
                <span hidden={isAr} dir="rtl" className="block text-sm font-semibold text-sadu-brick">
                  {theme.arabicName}
                </span>
              </div>

              <div className="space-y-2 pt-1 text-[11px] text-sadu-muted">
                <div>
                  <strong className="block text-sadu-charcoal font-semibold">{tr("Aesthetic Framework:")}</strong>
                  <p className="leading-relaxed bg-sadu-paper/70 p-1.5 rounded border border-sadu-gold/30">{tr(theme.aestheticFramework)}</p>
                </div>
                <div>
                  <strong className="block text-sadu-charcoal font-semibold">{tr("Contemporary & Historical Relevance:")}</strong>
                  <p className="leading-relaxed bg-sadu-paper/70 p-1.5 rounded border border-sadu-gold/30">{tr(theme.contemporaryRelevance)}</p>
                </div>
                <div>
                  <strong className="block text-sadu-charcoal font-semibold">{tr("Curatorial Justification:")}</strong>
                  <p className="leading-relaxed bg-sadu-paper/70 p-1.5 rounded border border-sadu-gold/30">{theme.curatorialJustification}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleStartNewBatch}
          className="inline-flex items-center gap-2 rounded-md border border-sadu-gold bg-sadu-sand ps-4 pe-4 py-2 text-xs font-bold text-sadu-charcoal transition-colors hover:bg-sadu-gold/20 cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" /> {tr("Start New Proposal Set")} </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-5xl space-y-6 rounded-lg border border-sadu-gold bg-sadu-paper p-6 shadow-xs"
    >
      <div className="flex flex-col gap-2 border-b border-sadu-gold/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-sadu-brick" />
          <div>
            <h2 className="font-editorial text-lg font-bold text-sadu-charcoal">
              {isAr ? 'اللجنة التحضيرية · صياغة الثيمة' : 'Preparatory Committee · Theme Formulation Table'}
            </h2>
            <p className="text-xs text-sadu-muted"> {tr("Convened by Mohammed Al Qaseer. Exactly three theme proposals must be defended with rigorous artistic criteria for Chairman Al Owais's review.")} </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAutoFillDemo}
            className="inline-flex items-center gap-2 rounded-md border border-[#736357]/40 ps-3 pe-3 py-1.5 text-xs font-semibold text-[#736357] transition-colors hover:border-[#8B261E] hover:text-[#8B261E] focus-visible:outline-2 focus-visible:outline-[#8B261E] cursor-pointer"
          >
            <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isAr ? 'تعبئة تلقائية للعرض' : 'Auto-fill for Demo'}</span>
          </button>

        </div>
      </div>
      <p role="status" className="text-sm text-[#736357]">{saveFailed
        ? (isAr ? 'تعذر حفظ المسودة محلياً. احتفظ بنسخة قبل المغادرة.' : 'Local save failed. Keep a copy before leaving.')
        : (isAr ? 'تُحفظ المسودات في هذا المتصفح فقط؛ لا يشمل الحفظ قرارات الاعتماد.' : 'Drafts save in this browser only; approval decisions are not saved.')}</p>
      <div className="flex flex-wrap gap-2" aria-label={isAr ? 'المقترحات' : 'Proposals'}>
        {themes.map((theme, index) => <button key={index} type="button" aria-pressed={!comparing && activeProposal === index}
          onClick={() => { setActiveProposal(index); setComparing(false); }}
          className="rounded border border-[#736357]/40 ps-4 pe-4 py-2 text-sm aria-pressed:bg-[#8B261E] aria-pressed:text-white">
          {isAr ? 'المقترح' : 'Proposal'} {index + 1} {isThemeComplete(theme) ? '✓' : ''}
        </button>)}
        <button type="button" aria-pressed={comparing} onClick={() => setComparing(true)} className="rounded border border-[#736357]/40 ps-4 pe-4 py-2 text-sm aria-pressed:bg-[#8B261E] aria-pressed:text-white">
          {isAr ? 'مقارنة المقترحات الثلاثة' : 'Compare all three'}
        </button>
      </div>
      {comparing && <div className="grid gap-4 lg:grid-cols-3">
        {themes.map((theme, index) => <article key={index} className="rounded-lg border border-sadu-gold bg-white ps-5 pe-5 py-5 text-start">
          <h3 className="text-xl font-bold" dir="rtl">{theme.arabicName || (isAr ? 'بدون عنوان' : 'Untitled')}</h3>
          <p dir="ltr" className="text-sm text-[#736357]">{theme.englishName}</p>
          {([['aestheticFramework', 'الإطار الجمالي', 'Aesthetic framework'], ['contemporaryRelevance', 'الصلة المعاصرة والتاريخية', 'Contemporary relevance'], ['curatorialJustification', 'المبررات الفنية', 'Curatorial justification']] as const).map(([field, ar, en]) => <div key={field} className="mt-4"><h4 className="font-semibold">{isAr ? ar : en}</h4><p dir="rtl" className="whitespace-pre-wrap text-lg leading-relaxed">{theme[field] || '—'}</p></div>)}
          <button type="button" onClick={() => { setActiveProposal(index); setComparing(false); }} className="mt-5 text-[#8B261E] underline">{isAr ? 'تعديل المقترح' : 'Edit proposal'} {index + 1}</button>
        </article>)}
      </div>}
      <div className="grid gap-6">
        {themes.map((theme, index) => {
          if (comparing || index !== activeProposal) return null;
          const arabicId = `${baseId}-arabic-${index}`;
          const englishId = `${baseId}-english-${index}`;
          const aestheticId = `${baseId}-aesthetic-${index}`;
          const contemporaryId = `${baseId}-contemporary-${index}`;
          const curatorialId = `${baseId}-curatorial-${index}`;
          const complete = isThemeComplete(theme);

          return (
            <div
              key={index}
              className="flex flex-col space-y-3 rounded-lg border border-sadu-gold/60 bg-white p-4 shadow-2xs"
            >
              <div className="flex items-center justify-between border-b border-sadu-gold/30 pb-2">
                <span className="text-xs font-bold text-sadu-charcoal">{tr("Theme Candidate")} {index + 1}</span>
                {complete ? (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-100 ps-2 pe-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3 w-3" /> {tr("Fully Defended")} </span>
                ) : (
                  <span className="rounded-full bg-amber-100 ps-2 pe-2 py-0.5 text-[10px] font-bold text-amber-800"> {tr("Criteria Incomplete")} </span>
                )}
              </div>

              <label htmlFor={arabicId} className="block text-xs font-semibold text-sadu-charcoal"> {tr("Arabic Name (الاسم بالعربية)")} <input
                  id={arabicId}
                  type="text"
                  dir="rtl"
                  required
                  value={theme.arabicName}
                  onChange={e => updateField(index, 'arabicName', e.target.value)}
                  placeholder="مثال: التوازن والانسجام"
                  className="mt-1 w-full rounded-md border border-sadu-gold/60 bg-white ps-3 pe-3 py-2 text-sm text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick"
                />
              </label>

              <label htmlFor={englishId} className="block text-xs font-semibold text-sadu-charcoal"> {isAr ? "الاسم المقترح بالإنجليزية (اختياري / إن وُجد)" : "Proposed English name (optional)"} <input
                  id={englishId}
                  type="text"
                  dir="ltr"
                  value={theme.englishName}
                  onChange={e => updateField(index, 'englishName', e.target.value)}
                  placeholder={tr("e.g. Balance & Harmony")}
                  className="mt-1 w-full rounded-md border border-sadu-gold/60 bg-white ps-3 pe-3 py-2 text-sm text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick"
                />
              </label>

              {/* Aesthetic Framework */}
              <label htmlFor={aestheticId} className="block text-xs font-semibold text-sadu-charcoal">
                <span>{tr("Aesthetic Framework")}</span>
                <span className="block font-normal text-[11px] text-sadu-muted"> {tr("Define the visual and stylistic parameters.")} </span>
                <textarea
                  id={aestheticId}
                  dir="rtl"
                  required
                  rows={4}
                  value={theme.aestheticFramework}
                  onChange={e => updateField(index, 'aestheticFramework', e.target.value)}
                  placeholder={tr("Define the visual and stylistic parameters...")}
                  className="mt-1 w-full resize-none rounded-md border border-sadu-gold/60 bg-white ps-3 pe-3 py-2 text-lg text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick"
                />
              </label>

              {/* Contemporary & Historical Relevance */}
              <label htmlFor={contemporaryId} className="block text-xs font-semibold text-sadu-charcoal">
                <span>{tr("Contemporary & Historical Relevance")}</span>
                <span className="block font-normal text-[11px] text-sadu-muted"> {tr("Justify the theme's position within international art standards.")} </span>
                <textarea
                  id={contemporaryId}
                  dir="rtl"
                  required
                  rows={4}
                  value={theme.contemporaryRelevance}
                  onChange={e => updateField(index, 'contemporaryRelevance', e.target.value)}
                  placeholder={tr("Justify the theme's position within international art standards...")}
                  className="mt-1 w-full resize-none rounded-md border border-sadu-gold/60 bg-white ps-3 pe-3 py-2 text-lg text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick"
                />
              </label>

              {/* Curatorial Justification */}
              <label htmlFor={curatorialId} className="block text-xs font-semibold text-sadu-charcoal">
                <span>{tr("Curatorial Justification")}</span>
                <span className="block font-normal text-[11px] text-sadu-muted"> {tr("The rigorous defense of why this theme is necessary.")} </span>
                <textarea
                  id={curatorialId}
                  dir="rtl"
                  required
                  rows={3}
                  value={theme.curatorialJustification}
                  onChange={e => updateField(index, 'curatorialJustification', e.target.value)}
                  placeholder={tr("The rigorous defense of why this theme is necessary...")}
                  className="mt-1 w-full resize-none rounded-md border border-sadu-gold/60 bg-white ps-3 pe-3 py-2 text-lg text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick"
                />
              </label>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center justify-between gap-4 border-t border-sadu-gold/40 pt-4 sm:flex-row">
        <span className="text-xs text-sadu-muted">
          {filledCount} {isAr ? "من 3 مقترحات مكتملة. افتح مقارنة المقترحات للمراجعة قبل الإحالة؛ الإنجليزية اختيارية." : "of 3 complete. Open Compare all three to review before submitting. English is optional."} </span>
        <button
          type="submit"
          disabled={!allFieldsFilled || !comparing}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-sadu-brick ps-6 pe-6 py-3 text-xs font-bold text-white shadow-xs transition-colors hover:bg-sadu-brick-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto cursor-pointer"
        >
          <Send className="h-4 w-4" /> {isAr ? "إحالة إلى مدير الملتقى" : "Submit to Biennial Director"} </button>
      </div>
    </form>
  );
};

export default CommitteeThemeWorkspace;

