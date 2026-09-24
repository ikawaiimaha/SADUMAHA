import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  FileText,
  Clock,
  Languages,
  Send,
} from 'lucide-react';
import { ThemeItem } from './ChairmanWorkspace';

export type ThemePolishStatus = 'PENDING_CHAIRMAN_APPROVAL' | 'PENDING_EDITORIAL_POLISH' | 'PUBLISHED';

export interface EditorialWorkspaceProps {
  guidelinesArabic?: string;
  guidelinesEnglish?: string;
  onPublishOfficialGuidelines?: (englishTranslation: string, arabicSource: string) => void;
  onPublishOfficialTheme?: (data: any) => void;
  onPublishBrief?: (englishText: string) => void;
  approvedTheme?: ThemeItem | null;
  themePolishStatus?: ThemePolishStatus;
  assignedBudget?: number | null;
  initialEssayArabic?: string;
  initialEssayEnglish?: string;
  isInitiallyPublished?: boolean;
  onBackToRoles?: () => void;
}

const DEFAULT_HIP_ARABIC_DRAFT =
  'دليل المعرض التوجيهي لبينالي الشارقة للخط: التأكيد على الحوار الجمالي الرصين بين النسب الفاضلة للخط العربي الأصيل والتجليات المعمارية المعاصرة. يتوجب على كافة الفنانين المرشحين تقديم أعمال تستند إلى أصالة السطر الكوفي والثلث مع استكشاف أبعاد الوسائط الحديثة والفراغية، مع الالتزام التام بالمحددات التنسيقية المعتمدة من منسق المعرض العام.';

const DEFAULT_ENGLISH_TRANSLATION =
  'Official Exhibition Guidelines: Emphasize the rigorous aesthetic dialogue between the sacred proportions of authentic Arabic calligraphy and contemporary architectural manifestations. All nominated artists must ground their proposals in the classical lineage of Kufic and Thuluth scripts while exploring avant-garde spatial media.';

export const EditorialWorkspace: React.FC<EditorialWorkspaceProps> = ({
  guidelinesArabic,
  guidelinesEnglish,
  onPublishOfficialGuidelines,
  onPublishOfficialTheme,
  onPublishBrief,
  approvedTheme,
  themePolishStatus,
  assignedBudget,
  initialEssayArabic,
  initialEssayEnglish,
  isInitiallyPublished = false,
  onBackToRoles,
}) => {
  const [arabicSource] = useState<string>(
    guidelinesArabic && guidelinesArabic.trim() ? guidelinesArabic : DEFAULT_HIP_ARABIC_DRAFT
  );
  const [englishTranslation, setEnglishTranslation] = useState<string>(
    guidelinesEnglish || initialEssayEnglish || DEFAULT_ENGLISH_TRANSLATION
  );
  const [isLocked, setIsLocked] = useState<boolean>(
    isInitiallyPublished || themePolishStatus === 'PUBLISHED'
  );

  useEffect(() => {
    if (isInitiallyPublished || themePolishStatus === 'PUBLISHED') setIsLocked(true);
  }, [isInitiallyPublished, themePolishStatus]);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!englishTranslation.trim() || isLocked) return;

    setIsLocked(true);

    onPublishOfficialGuidelines?.(englishTranslation.trim(), arabicSource);
    onPublishBrief?.(englishTranslation.trim());
    if (onPublishOfficialTheme) {
      onPublishOfficialTheme({
        themeEssayArabic: arabicSource,
        themeEssayEnglish: englishTranslation.trim(),
        approvedTheme,
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 text-stone-800">
      {/* 1. Header */}
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sadu-brick text-white shadow-xs">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-stone-200 px-2.5 py-0.5 text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                  Translation &amp; Publishing Dashboard
                </span>
                {isLocked && (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    Status: Published Official Theme
                  </span>
                )}
              </div>
              <h1 className="font-editorial text-2xl font-bold text-stone-900 sm:text-3xl mt-1">
                Editorial Dashboard
              </h1>
              <p className="text-xs font-semibold text-sadu-brick mt-0.5" dir="rtl">
                Editorial Department (قسم التحرير)
              </p>
            </div>
          </div>

          {onBackToRoles && (
            <button
              type="button"
              onClick={onBackToRoles}
              className="rounded-md border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 cursor-pointer transition-colors shadow-2xs self-start sm:self-auto"
            >
              Back to Role Selection
            </button>
          )}
        </div>

        {/* Bureaucratic Context Notice */}
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-3.5 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 text-stone-700">
            <Languages className="h-4 w-4 text-sadu-brick shrink-0" />
            <span>
              <strong>Linear Bureaucracy Protocol:</strong> Editorial receives the locked Arabic curatorial draft from the HIP. Publishing officially releases the bilingual guidelines and unlocks the downstream workflow for Coordinators.
            </span>
          </div>
          <span className={`w-fit rounded px-2.5 py-1 text-[10px] font-bold uppercase shrink-0 ${
            isLocked
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-amber-100 text-amber-900 border border-amber-300'
          }`}>
            {isLocked ? 'Status: Published Official Theme' : 'Status: Pending Translation'}
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <form onSubmit={handlePublish} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* 2. Pending Translations Queue (Left Column) */}
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-sadu-brick" />
                <div>
                  <h2 className="font-editorial text-lg font-bold text-stone-900">
                    Pending Translations Queue
                  </h2>
                  <p className="text-xs text-stone-500">
                    Inbox for the HIP's locked directives
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded bg-stone-200 px-2 py-0.5 text-[10px] font-bold text-stone-700">
                <Lock className="h-3 w-3" /> Locked Source
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="hip-curatorial-draft"
                  className="block text-xs font-bold text-stone-700 uppercase tracking-wider"
                >
                  HIP Curatorial Draft (Source: Arabic)
                </label>
                <span className="text-[10px] font-mono text-stone-500">
                  {arabicSource.length} chars
                </span>
              </div>

              <textarea
                id="hip-curatorial-draft"
                readOnly
                disabled
                dir="rtl"
                rows={9}
                value={arabicSource}
                className="w-full rounded-md border border-stone-300 bg-stone-100 p-3 text-xs leading-relaxed text-stone-700 cursor-not-allowed select-text focus:outline-none shadow-inner"
              />
              <p className="text-[11px] text-stone-500" dir="rtl">
                النص التوجيهي المعتمد من منسق المعرض العام (HIP). غير قابل للتعديل.
              </p>
            </div>
          </div>

          {/* 3. Official Translation Input (Right Column) */}
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-sadu-brick" />
                <div>
                  <h2 className="font-editorial text-lg font-bold text-stone-900">
                    Official Translation Input
                  </h2>
                  <p className="text-xs text-stone-500">
                    Accredited English institutional translation
                  </p>
                </div>
              </div>
              <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600 uppercase border border-stone-200">
                Required Field
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="official-exhibition-guidelines"
                  className="block text-xs font-bold text-stone-700 uppercase tracking-wider"
                >
                  Official Exhibition Guidelines (English) <span className="text-red-600">*</span>
                </label>
                <span className="text-[10px] font-mono text-stone-500">
                  {englishTranslation.length} chars
                </span>
              </div>

              <textarea
                id="official-exhibition-guidelines"
                required
                disabled={isLocked}
                rows={9}
                value={englishTranslation}
                onChange={e => setEnglishTranslation(e.target.value)}
                placeholder="Enter official, accredited English translation of the curatorial guidelines..."
                className={`w-full rounded-md border p-3 text-xs leading-relaxed transition-colors ${
                  isLocked
                    ? 'border-emerald-300 bg-emerald-50/40 text-stone-700 cursor-not-allowed shadow-inner'
                    : 'border-stone-300 bg-white text-stone-800 focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick'
                }`}
              />
              <p className="text-[11px] text-stone-500">
                Institutional English translation adhering to biennial terminology and academic standards.
              </p>
            </div>
          </div>
        </div>

        {/* 4. The Publishing Gate */}
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-stone-700">
                Institutional Publishing Action
              </span>
              {isLocked ? (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  Status: Published Official Theme
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                  <Clock className="h-3 w-3" />
                  Ready to Publish
                </span>
              )}
            </div>
            <p className="text-xs text-stone-600">
              {isLocked
                ? 'Workflow officially unlocked for the Coordinators and Preparatory Committee.'
                : 'Publishing locks the bilingual text and unlocks the operational workflow for Coordinators.'}
            </p>
          </div>

          <button
            type="submit"
            disabled={!englishTranslation.trim() || isLocked}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-xs font-bold transition-all shadow-xs shrink-0 ${
              isLocked
                ? 'bg-emerald-700 text-white cursor-not-allowed opacity-90'
                : 'bg-sadu-brick text-white hover:bg-sadu-brick-dark cursor-pointer'
            }`}
          >
            {isLocked ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Status: Published Official Theme</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Publish Official Bilingual Guidelines</span>
              </>
            )}
          </button>
        </div>

        {isLocked && (
          <div className="rounded-lg border-2 border-emerald-400 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <strong className="block font-bold">Guidelines Officially Released!</strong>
              <span>
                Status: Published Official Theme. The bilingual guidelines are locked and now accessible to the Coordinators to initiate Stage 3 and Stage 5 contracting.
              </span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default EditorialWorkspace;
