import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  Globe,
  FileText,
  Clock,
  Languages,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { ThemeItem } from './ChairmanWorkspace';
import { TranslationStatus } from './HIPWorkspace';

export interface EditorialWorkspaceProps {
  /** The locked original Arabic draft submitted by the HIP */
  guidelinesArabic: string;
  /** The English translation draft */
  guidelinesEnglish: string;
  /** Translation routing status */
  translationStatus: TranslationStatus;
  /** Callback to publish the bilingual brief */
  onPublishBrief: (englishText: string) => void;
  /** Optional callback when English draft changes */
  onUpdateGuidelinesEnglish?: (englishText: string) => void;
  /** Current ratified theme */
  ratifiedTheme?: ThemeItem | null;
  /** Optional callback to return to role selection */
  onBackToRoles?: () => void;
}

export const EditorialWorkspace: React.FC<EditorialWorkspaceProps> = ({
  guidelinesArabic,
  guidelinesEnglish,
  translationStatus,
  onPublishBrief,
  onUpdateGuidelinesEnglish,
  ratifiedTheme,
  onBackToRoles,
}) => {
  const [englishDraft, setEnglishDraft] = useState<string>(guidelinesEnglish);
  const [justPublished, setJustPublished] = useState<boolean>(false);

  useEffect(() => {
    setEnglishDraft(guidelinesEnglish);
  }, [guidelinesEnglish]);

  const isPublished = translationStatus === 'PUBLISHED';
  const hasArabicSource = Boolean(guidelinesArabic && guidelinesArabic.trim());
  const canPublish = hasArabicSource && Boolean(englishDraft.trim()) && !isPublished;

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPublish) return;
    onPublishBrief(englishDraft.trim());
    setJustPublished(true);
    setTimeout(() => setJustPublished(false), 4000);
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
                Stage 2: Translation Routing Gate & Institutional Publishing
              </span>
              <h1 className="font-editorial text-2xl font-bold text-sadu-charcoal sm:text-3xl mt-1">
                Editorial Department (قسم التحرير والترجمة)
              </h1>
              <p className="text-xs font-semibold text-sadu-brick" dir="rtl">
                الترجمة المعتمدة ونشر الدليل التوجيهي للملتقى
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
      </div>

      {/* Pending Translations Queue */}
      <div className="rounded-xl border border-sadu-gold bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-sadu-gold/30 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-sadu-brick" />
            <div>
              <h2 className="font-editorial text-lg font-bold text-sadu-charcoal">
                Pending Translations Queue
              </h2>
              <p className="text-xs text-sadu-muted">
                Briefs and curatorial directives submitted by the Head of International Programs (HIP)
              </p>
            </div>
          </div>
          <span className="rounded-full bg-sadu-sand px-3 py-1 text-xs font-bold text-sadu-charcoal border border-sadu-gold/60">
            {isPublished ? 'Status: Published Bilingually' : hasArabicSource ? 'Status: Pending Translation' : 'Awaiting HIP Submission'}
          </span>
        </div>

        <div className="rounded-lg border border-sadu-gold/50 bg-sadu-sand/30 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-sadu-charcoal">Exhibition Curatorial Guidelines</span>
                <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-sadu-brick border border-sadu-gold/50">
                  Multaqa Directive
                </span>
              </div>
              <p className="text-xs text-sadu-muted">
                Submitted by: <strong>Head of International Programs (HIP)</strong> &middot; Arabic Master: {guidelinesArabic ? guidelinesArabic.length : 0} characters
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isPublished ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Published to Coordinators
                </span>
              ) : hasArabicSource ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-300 animate-pulse">
                  <Clock className="h-3.5 w-3.5 text-amber-700" />
                  Pending Translation
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                  Awaiting HIP Submission
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bilingual Translation Gate Workbench */}
      <form onSubmit={handlePublish} className="rounded-xl border border-sadu-gold bg-white p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-sadu-gold/30 pb-3">
          <div className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-sadu-brick" />
            <div>
              <h3 className="font-editorial text-lg font-bold text-sadu-charcoal">
                Curatorial Brief Translation Workbench
              </h3>
              <p className="text-xs text-sadu-muted">
                Side-by-side verification: Translate locked Arabic master into official English publication
              </p>
            </div>
          </div>
          <span className="rounded bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-muted uppercase">
            Mandatory Human Translation
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Read-Only Source (Arabic) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="arabic-source-readonly" className="block text-xs font-bold text-sadu-charcoal uppercase tracking-wider">
                Read-Only Source (Arabic Master)
              </label>
              <span className="inline-flex items-center gap-1 rounded bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-brick border border-sadu-gold/50">
                <Lock className="h-3 w-3" /> Locked Source
              </span>
            </div>
            <textarea
              id="arabic-source-readonly"
              readOnly
              disabled
              dir="rtl"
              rows={8}
              value={guidelinesArabic || 'لم يتم استلام نص التوجيهات بالعربية من منسق المعرض العام حتى الآن...'}
              className="w-full rounded-md border border-gray-300 bg-gray-50/80 p-3 text-xs leading-relaxed text-gray-800 cursor-not-allowed select-text"
            />
            <span className="text-[11px] text-sadu-muted block">
              Official Arabic text provided by HIP. Cannot be altered by Editorial.
            </span>
          </div>

          {/* Translation Input (English) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="exhibition-guidelines-english" className="block text-xs font-bold text-sadu-charcoal uppercase tracking-wider">
                Exhibition Guidelines (English) <span className="text-red-600">*</span>
              </label>
              <span className="text-[10px] font-bold text-sadu-brick">
                {englishDraft.length} chars
              </span>
            </div>
            <textarea
              id="exhibition-guidelines-english"
              required
              rows={8}
              disabled={isPublished}
              value={englishDraft}
              onChange={e => {
                setEnglishDraft(e.target.value);
                onUpdateGuidelinesEnglish?.(e.target.value);
              }}
              placeholder="Draft official, accredited English translation of the curatorial guidelines..."
              className={`w-full rounded-md border p-3 text-xs leading-relaxed ${
                isPublished
                  ? 'border-emerald-300 bg-emerald-50/30 text-emerald-950 cursor-not-allowed'
                  : 'border-sadu-gold/60 bg-white text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick'
              }`}
            />
            <span className="text-[11px] text-sadu-muted block">
              Draft institutional English translation adhering to biennial terminology.
            </span>
          </div>
        </div>

        {/* Action Button & Publishing Gate */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-sadu-gold/40 pt-4">
          <div className="text-xs text-sadu-muted">
            {isPublished ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Bilingual brief is officially published and live across all department portals.
              </span>
            ) : hasArabicSource ? (
              <span className="text-amber-800 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-700" /> Once published, the bilingual brief unlocks for the Preparatory Committee and Coordinators.
              </span>
            ) : (
              <span className="text-gray-500 font-semibold">
                Awaiting Arabic guidelines from HIP before translation can be authorized.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!canPublish}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-sadu-brick px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-sadu-brick-dark disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Publish Brief to Coordinators</span>
          </button>
        </div>

        {justPublished && (
          <div className="rounded-lg border-2 border-emerald-400 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <strong className="block font-bold">Bilingual Curatorial Brief Published!</strong>
              <span>The guidelines are now officially unlocked across the Coordinators' and Preparatory Committee's dashboards.</span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default EditorialWorkspace;
