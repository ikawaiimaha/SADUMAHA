import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  Sparkles,
  FileText,
  Clock,
  Languages,
  Send,
  Eye,
  Award,
} from 'lucide-react';
import { ThemeItem } from './ChairmanWorkspace';

export type ThemePolishStatus = 'PENDING_CHAIRMAN_APPROVAL' | 'PENDING_EDITORIAL_POLISH' | 'PUBLISHED';

export interface EditorialWorkspaceProps {
  /** The single theme approved by Chairman Al Owais */
  approvedTheme?: ThemeItem | null;
  /** Current institutional status of the theme polish workflow */
  themePolishStatus?: ThemePolishStatus;
  /** Callback fired when Editorial publishes the official bilingual theme essays */
  onPublishOfficialTheme: (polished: {
    themeEssayArabic: string;
    themeEssayEnglish: string;
    approvedTheme: ThemeItem;
  }) => void;
  /** Overarching budget locked by Chairman */
  assignedBudget?: number | null;
  /** Initial or existing Arabic essay */
  initialEssayArabic?: string;
  /** Initial or existing English essay */
  initialEssayEnglish?: string;
  /** Optional callback to return to role selection */
  onBackToRoles?: () => void;
}

export const EditorialWorkspace: React.FC<EditorialWorkspaceProps> = ({
  approvedTheme,
  themePolishStatus = 'PENDING_EDITORIAL_POLISH',
  onPublishOfficialTheme,
  assignedBudget,
  initialEssayArabic = '',
  initialEssayEnglish = '',
  onBackToRoles,
}) => {
  const [themeEssayArabic, setThemeEssayArabic] = useState<string>(initialEssayArabic);
  const [themeEssayEnglish, setThemeEssayEnglish] = useState<string>(initialEssayEnglish);
  const [status, setStatus] = useState<ThemePolishStatus>(themePolishStatus);
  const [justPublished, setJustPublished] = useState<boolean>(false);

  useEffect(() => {
    setStatus(themePolishStatus);
  }, [themePolishStatus]);

  useEffect(() => {
    if (initialEssayArabic) setThemeEssayArabic(initialEssayArabic);
    if (initialEssayEnglish) setThemeEssayEnglish(initialEssayEnglish);
  }, [initialEssayArabic, initialEssayEnglish]);

  // Prepopulate draft essay from Committee's raw intent if empty
  useEffect(() => {
    if (approvedTheme && !themeEssayArabic) {
      const generatedArabic = `البيان التحريري المؤسسي لبينالي الشارقة للخط: تنطلق هذه الدورة تحت شعار "${approvedTheme.arabicName}" لترسيخ حوار بصري رصين يجمع بين أصالة الحرف العربي وسحر هندسته التاريخية وبين آفاق الفن المعاصر. ${approvedTheme.curatorialJustification || approvedTheme.aestheticFramework || ''}`.trim();
      setThemeEssayArabic(generatedArabic);
    }
    if (approvedTheme && !themeEssayEnglish) {
      const generatedEnglish = `Sharjah Calligraphy Biennial Institutional Theme Essay: Convening under the ratified title "${approvedTheme.englishName}", this edition explores the profound dialogue between sacred script geometry and contemporary architectural installations. ${approvedTheme.contemporaryRelevance || approvedTheme.curatorialJustification || ''}`.trim();
      setThemeEssayEnglish(generatedEnglish);
    }
  }, [approvedTheme]);

  const isPublished = status === 'PUBLISHED';
  const hasApprovedTheme = Boolean(approvedTheme);
  const canPublish = hasApprovedTheme && Boolean(themeEssayArabic.trim()) && Boolean(themeEssayEnglish.trim()) && !isPublished;

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPublish || !approvedTheme) return;
    setStatus('PUBLISHED');
    onPublishOfficialTheme({
      themeEssayArabic: themeEssayArabic.trim(),
      themeEssayEnglish: themeEssayEnglish.trim(),
      approvedTheme,
    });
    setJustPublished(true);
    setTimeout(() => setJustPublished(false), 5000);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-sadu-gold bg-sadu-paper p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-sadu-gold/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sadu-brick text-white shadow-xs">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <span className="rounded bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-brick uppercase tracking-wider border border-sadu-gold/60">
                Stage 2: Editorial Polish & Final Phrasing
              </span>
              <h1 className="font-editorial text-2xl font-bold text-sadu-charcoal sm:text-3xl mt-1">
                Editorial Department (قسم التحرير)
              </h1>
              <p className="text-xs font-semibold text-sadu-brick" dir="rtl">
                إعادة صياغة الثيم والبيان الفني المؤسسي باللغتين العربية والإنجليزية
              </p>
            </div>
          </div>
          {onBackToRoles && (
            <button
              type="button"
              onClick={onBackToRoles}
              className="rounded-md border border-sadu-gold bg-sadu-sand px-3 py-1.5 text-xs font-bold text-sadu-charcoal hover:bg-sadu-gold/20 cursor-pointer"
            >
              Back to Role Selection
            </button>
          )}
        </div>

        {/* Institutional Routing Notice */}
        <div className="mt-4 rounded-md border border-sadu-gold/50 bg-white p-3.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-sadu-charcoal">
            <Languages className="h-4 w-4 text-sadu-brick shrink-0" />
            <span>
              <strong>Editorial Polish Routing Gate:</strong> The Chairman's approved theme is routed here before distribution. Editorial takes the Committee's raw curatorial explanation and drafts the official bilingual essays. Publishing unlocks Stage 3 for the HIP and Coordinators.
            </span>
          </div>
          <span className={`rounded px-2.5 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
            isPublished
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : hasApprovedTheme
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {isPublished ? 'Theme Published' : hasApprovedTheme ? 'Pending Editorial Polish' : 'Awaiting Chairman Selection'}
          </span>
        </div>
      </div>

      {/* Approved Theme Queue */}
      <div className="rounded-xl border border-sadu-gold bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-sadu-gold/30 pb-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-sadu-brick" />
            <div>
              <h2 className="font-editorial text-lg font-bold text-sadu-charcoal">
                Approved Theme Queue
              </h2>
              <p className="text-xs text-sadu-muted">
                Single theme approved by H.E. Abdullah Al Owais awaiting final bilingual phrasing
              </p>
            </div>
          </div>
          <span className="rounded-full bg-sadu-sand px-3 py-1 text-xs font-bold text-sadu-charcoal border border-sadu-gold/60">
            {hasApprovedTheme ? '1 Theme in Queue' : '0 Themes in Queue'}
          </span>
        </div>

        {hasApprovedTheme && approvedTheme ? (
          <div className="rounded-lg border border-sadu-gold/50 bg-sadu-sand/30 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sadu-muted block">
                  Chairman Ratified Theme
                </span>
                <h3 className="font-editorial text-xl font-bold text-sadu-charcoal">
                  {approvedTheme.englishName}
                </h3>
                <span dir="rtl" className="font-editorial text-base font-semibold text-sadu-brick block">
                  {approvedTheme.arabicName}
                </span>
              </div>

              <div className="flex flex-col sm:items-end gap-1.5">
                <span className="rounded bg-sadu-sand px-2.5 py-1 text-xs font-mono font-bold text-sadu-charcoal border border-sadu-gold/60">
                  {assignedBudget ? `AED ${assignedBudget.toLocaleString()} Locked` : 'Budget Allocated'}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                  isPublished
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {isPublished ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      Status: Published
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 text-amber-600" />
                      Status: Pending Editorial Polish
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-sadu-gold/60 bg-sadu-paper/40 p-6 text-center text-xs text-sadu-muted">
            <Clock className="mx-auto h-6 w-6 text-sadu-muted mb-1" />
            <p className="font-bold text-sadu-charcoal">No Theme Approved Yet</p>
            <p className="mt-0.5">Awaiting Chairman Al Owais's official theme selection and budget locking in Stage 1.</p>
          </div>
        )}
      </div>

      {/* Committee's Raw Intent Card */}
      {approvedTheme && (
        <div className="rounded-xl border border-sadu-gold bg-sadu-paper/60 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-sadu-gold/30 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-sadu-brick" />
              <div>
                <h3 className="font-editorial text-lg font-bold text-sadu-charcoal">
                  Committee's Raw Intent & Curatorial Defense
                </h3>
                <p className="text-xs text-sadu-muted">
                  Original justification formulated by the Preparatory Committee (Read-Only Source)
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded bg-sadu-sand px-2.5 py-0.5 text-[10px] font-bold text-sadu-brick border border-sadu-gold/50">
              <Lock className="h-3 w-3" /> Raw Source Master
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div className="rounded-lg border border-sadu-gold/40 bg-white p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sadu-muted block">
                Aesthetic Framework
              </span>
              <p className="text-sadu-charcoal leading-relaxed">
                {approvedTheme.aestheticFramework || 'Classical script lineage, proportional balance, and material aesthetics.'}
              </p>
            </div>

            <div className="rounded-lg border border-sadu-gold/40 bg-white p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sadu-muted block">
                Contemporary Relevance
              </span>
              <p className="text-sadu-charcoal leading-relaxed">
                {approvedTheme.contemporaryRelevance || 'Engagement with modern artistic movements and avant-garde media.'}
              </p>
            </div>

            <div className="rounded-lg border border-sadu-gold/40 bg-white p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sadu-muted block">
                Curatorial Justification
              </span>
              <p className="text-sadu-charcoal leading-relaxed">
                {approvedTheme.curatorialJustification || approvedTheme.definition || 'Rigorous academic defense why this concept warrants international selection.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Official Phrasing Workbench Form */}
      <form onSubmit={handlePublish} className="rounded-xl border border-sadu-gold bg-white p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-sadu-gold/30 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sadu-brick" />
            <div>
              <h3 className="font-editorial text-lg font-bold text-sadu-charcoal">
                Official Institutional Theme Phrasing
              </h3>
              <p className="text-xs text-sadu-muted">
                Craft the official bilingual essays for the biennial catalog, wall text, and curatorial briefs
              </p>
            </div>
          </div>
          <span className="rounded bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-muted uppercase">
            Mandatory Bilingual Release
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Official Theme Essay (Arabic) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="official-theme-essay-arabic" className="block text-xs font-bold text-sadu-charcoal uppercase tracking-wider">
                Official Theme Essay (Arabic) <span className="text-red-600">*</span>
              </label>
              <span className="text-[10px] font-bold text-sadu-brick">{themeEssayArabic.length} chars</span>
            </div>
            <textarea
              id="official-theme-essay-arabic"
              required
              rows={8}
              dir="rtl"
              disabled={isPublished || !approvedTheme}
              value={themeEssayArabic}
              onChange={e => setThemeEssayArabic(e.target.value)}
              placeholder="صياغة البيان الفني والمقالة التحريرية الرسمية للثيم باللغة العربية..."
              className={`w-full rounded-md border p-3 text-xs leading-relaxed ${
                isPublished
                  ? 'border-emerald-300 bg-emerald-50/30 text-emerald-950 cursor-not-allowed'
                  : 'border-sadu-gold/60 bg-white text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick'
              }`}
            />
          </div>

          {/* Official Theme Essay (English) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="official-theme-essay-english" className="block text-xs font-bold text-sadu-charcoal uppercase tracking-wider">
                Official Theme Essay (English) <span className="text-red-600">*</span>
              </label>
              <span className="text-[10px] font-bold text-sadu-brick">{themeEssayEnglish.length} chars</span>
            </div>
            <textarea
              id="official-theme-essay-english"
              required
              rows={8}
              disabled={isPublished || !approvedTheme}
              value={themeEssayEnglish}
              onChange={e => setThemeEssayEnglish(e.target.value)}
              placeholder="Draft official, accredited English institutional essay and phrasing for the approved theme..."
              className={`w-full rounded-md border p-3 text-xs leading-relaxed ${
                isPublished
                  ? 'border-emerald-300 bg-emerald-50/30 text-emerald-950 cursor-not-allowed'
                  : 'border-sadu-gold/60 bg-white text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick'
              }`}
            />
          </div>
        </div>

        {/* Action Button & Publishing Gate */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-sadu-gold/40 pt-4">
          <div className="text-xs text-sadu-muted">
            {isPublished ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Official theme is published bilingually and unlocked for Stage 3 (HIP Guidelines & Coordinators).
              </span>
            ) : hasApprovedTheme ? (
              <span className="text-amber-800 font-semibold flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-700" /> Once published, the official theme unlocks for the HIP and Coordinators to begin Stage 3.
              </span>
            ) : (
              <span className="text-gray-500 font-semibold">
                Awaiting Chairman Al Owais's theme approval before editorial polish can be published.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!canPublish}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-sadu-brick px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-sadu-brick-dark disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Publish Official Theme</span>
          </button>
        </div>

        {justPublished && (
          <div className="rounded-lg border-2 border-emerald-400 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <strong className="block font-bold">Official Biennial Theme Published!</strong>
              <span>The bilingual essays are officially locked and released to the Head of International Programs (HIP) and Coordinators to initiate Stage 3.</span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default EditorialWorkspace;
