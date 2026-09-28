import { ArtworkRosterQueue } from './ArtworkRoster';
import { EditorialAssetLog } from './EditorialAssetLog';
import { useLocalDraft, isText } from '../hooks/useLocalDraft';
import { scrollWorkspaceToTop } from '../utils/scrollWorkspaceToTop';
import { useMockupText } from '../i18n/useMockupText';
import { useI18n } from '../context/I18nContext';
import React, { useState } from 'react';
import { 
  Languages, 
  BookOpen, 
  CheckCircle2, 
  FileText, 
  Send, 
  Lock,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { ThemeItem } from './ChairmanWorkspace';

export type ThemePolishStatus = 'PENDING_CHAIRMAN_APPROVAL' | 'PENDING_EDITORIAL_POLISH' | 'PUBLISHED' | 'PUBLISHED_OFFICIAL';

interface EditorialDraft {
  arabicText: string;
  englishText: string;
}

export interface EditorialWorkspaceProps {
  arabicLocked?: boolean;
  onLockArabic?: (text: string) => void;
  guidelinesTranslationStatus?: 'REQUEST_REVISION' | 'DRAFT' | 'PENDING_TRANSLATION' | 'PUBLISHED';
  guidelinesArabic?: string;
  guidelinesEnglish?: string;
  onPublishOfficialGuidelines?: (englishTranslation: string, arabicSource: string) => void;
  onPublishOfficialTheme?: (data: {
    themeEssayArabic: string;
    themeEssayEnglish: string;
    approvedTheme: any;
  }) => void;
  onPublishBrief?: (englishText: string) => void;
  approvedTheme?: ThemeItem | any;
  themePolishStatus?: ThemePolishStatus;
  assignedBudget?: number | null;
  initialEssayArabic?: string;
  initialEssayEnglish?: string;
  isInitiallyPublished?: boolean;
  onAutoNavigate?: (role: string) => void;
  onBackToRoles?: () => void;
}

export default function EditorialWorkspace({
  arabicLocked = false,
  onLockArabic,
  guidelinesTranslationStatus,
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
  onAutoNavigate,
  onBackToRoles,
}: EditorialWorkspaceProps = {}) {
  const tr = useMockupText();
  const { isAr } = useI18n();
  // Determine raw theme approved by Chairman in Stage 1
  const rawChairmanTheme = 
    approvedTheme?.conceptStatementAr || 
    approvedTheme?.curatorialJustification ||
    approvedTheme?.definition || 
    approvedTheme?.arabicName ||
    approvedTheme?.titleAr || 
    initialEssayArabic || 
    '';

  const [publishedLocally, setPublishedLocally] = useState(false);
  const isPublished = publishedLocally || isInitiallyPublished || themePolishStatus === 'PUBLISHED' || themePolishStatus === 'PUBLISHED_OFFICIAL';

  const [draft, setDraft, draftSaveFailed] = useLocalDraft<EditorialDraft>(`sadu:draft:v1:editorial:${rawChairmanTheme}`, {
    arabicText: initialEssayArabic || rawChairmanTheme,
    englishText: initialEssayEnglish || ''
  }, (value): value is EditorialDraft => Boolean(value) && typeof value === 'object' && isText((value as EditorialDraft).arabicText) && isText((value as EditorialDraft).englishText));


  const [guidelinesDraftEnglish, setGuidelinesDraftEnglish, guidelineSaveFailed] = useLocalDraft(`sadu:draft:v1:guidelines-english:${guidelinesArabic || ''}`, '', isText);
  const guidelinesPending = isPublished && guidelinesTranslationStatus === 'PENDING_TRANSLATION' && Boolean(guidelinesArabic?.trim());

  const [translationVerified, setTranslationVerified] = useState(false);
  const isArabicLocked = arabicLocked || isPublished;
  const canLockArabic = themePolishStatus !== 'PENDING_CHAIRMAN_APPROVAL' && Boolean(approvedTheme) && draft.arabicText.trim().length > 10;
  const certifiedArabic = isArabicLocked ? (initialEssayArabic ?? '') : draft.arabicText;
  const canPublish = arabicLocked && !isPublished && certifiedArabic.trim().length > 10 && draft.englishText.trim().length > 10 && translationVerified;

  const handleLockArabic = (e: React.FormEvent) => {
    e.preventDefault();
    if (isArabicLocked || !canLockArabic || !onLockArabic) return;
    const arabicText = draft.arabicText.trim();
    setDraft({ arabicText, englishText: '' });
    setTranslationVerified(false);
    onLockArabic(arabicText);
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPublish) return;
    
    // Locks Stage 2 and unlocks Stage 3 (HIP Curatorial Directives)
    setPublishedLocally(true);
    scrollWorkspaceToTop();
    onAutoNavigate?.('HIP');

    if (onPublishOfficialTheme) {
      onPublishOfficialTheme({
        themeEssayArabic: certifiedArabic.trim(),
        themeEssayEnglish: draft.englishText.trim(),
        approvedTheme,
      });
    }


  };

  return (
    <div className="min-h-screen bg-[#F7F1E6] p-6 text-[#2C2A29] font-sans text-start" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <ArtworkRosterQueue isAr={isAr}/>
      <header className="mb-8 border-b border-[#D9D2C5] pb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span role="status" className="block text-sm text-[#736357]">{draftSaveFailed || guidelineSaveFailed ? (isAr ? 'تعذر حفظ المسودة محلياً' : 'Local draft save failed') : (isAr ? 'المسودات محفوظة في هذا المتصفح فقط' : 'Drafts saved in this browser only')}</span><span className="text-xs uppercase tracking-widest text-[#8C7A6B] font-semibold">{isAr ? 'المرحلة 2 · التحرير والنشر' : 'Stage 2 · Editorial and publication'}</span>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-[#1A1817] mt-1">{isAr ? 'مساحة عمل قسم التحرير' : 'Editorial Workspace'}</h1>
          <p className="text-[#6B635B] text-sm mt-1"> {isAr ? "تنقيح النص العربي وإقراره، ثم إحالته إلى الترجمة المعتمدة." : "Ratify the institutional Arabic text, then hand it over for certified English translation."} </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white ps-4 pe-4 py-2 rounded-md border border-[#D9D2C5] text-xs font-mono shadow-xs flex items-center gap-2">
            <Languages className="w-4 h-4 text-[#8B4513]" />
            <span>{isAr ? "النشر الثنائي اللغة:" : "Bilingual release:"} <strong className="text-[#1A1817]">{tr("Active")}</strong></span>
          </div>
          {onBackToRoles && (
            <button
              type="button"
              onClick={onBackToRoles}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#D9D2C5] bg-white ps-3 pe-3 py-2 text-xs font-bold text-[#6B635B] hover:bg-stone-50 cursor-pointer shadow-xs transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{isAr ? 'تغيير الدور' : 'Switch Role'}</span>
            </button>
          )}
        </div>
      </header>

      {approvedTheme && <section aria-labelledby="executive-directives-heading" className="mb-6 rounded-xl border border-[#D9D2C5] bg-[#F7F1E6] ps-6 pe-6 py-5 text-start">
        <h2 id="executive-directives-heading" className="text-xl font-bold">{isAr ? 'التوجيهات التنفيذية' : 'Executive Directives'}</h2>
        <dl className="mt-4 space-y-4">
          <div>
            <dt className="font-semibold text-[#736357]">{isAr ? 'ملاحظات مدير الملتقى' : 'Director’s Advice'}</dt>
            <dd dir="auto" className="mt-2 whitespace-pre-wrap text-start text-lg leading-relaxed">{approvedTheme.directorNotes?.trim() || (isAr ? 'لا توجد ملاحظات إضافية.' : 'No additional advice recorded.')}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[#8B261E]">{isAr ? 'توجيهات رئيس الدائرة' : 'Chairman’s Mandate'}</dt>
            <dd dir="auto" className="mt-2 whitespace-pre-wrap text-start text-lg leading-relaxed">{approvedTheme.chairmanNotes?.trim() || (isAr ? 'لا توجد توجيهات إضافية.' : 'No additional directives recorded.')}</dd>
          </div>
        </dl>
      </section>}

      {guidelinesPending && <section aria-labelledby="guidelines-queue-heading" className="mb-6 rounded-lg border border-[#D9D2C5] bg-[#F7F1E6] ps-6 pe-6 py-5 text-start">
        <h2 id="guidelines-queue-heading" className="font-serif text-xl font-bold">{isAr ? 'قائمة الترجمة — دليل منسق المعرض' : 'Translation Queue — HIP Guidelines'}</h2>
        <p dir="rtl" className="my-4 whitespace-pre-wrap rounded bg-[#EDE4D3] p-4 text-start">{guidelinesArabic}</p>
        <form className="space-y-3" onSubmit={event => {
          event.preventDefault();
          if (!guidelinesPending || !guidelinesDraftEnglish.trim() || !guidelinesArabic) return;
          onPublishOfficialGuidelines?.(guidelinesDraftEnglish.trim(), guidelinesArabic);
        }}>
          <label htmlFor="guidelines-english" className="block text-sm font-bold">{isAr ? 'الترجمة الإنجليزية للدليل' : 'English Guidelines Translation'}</label>
          <textarea id="guidelines-english" dir="ltr" required rows={5} value={guidelinesDraftEnglish} onChange={event => setGuidelinesDraftEnglish(event.target.value)} className="w-full rounded border border-[#D9D2C5] bg-white ps-3 pe-3 py-3 text-start" />
          <button type="submit" disabled={!guidelinesDraftEnglish.trim() || !onPublishOfficialGuidelines} className="rounded bg-[#8B261E] ps-4 pe-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed">{isAr ? 'نشر الدليل الثنائي اللغة' : 'Publish Bilingual Guidelines'}</button>
        </form>
      </section>}
      {isPublished && guidelinesTranslationStatus === 'PUBLISHED' && <p role="status" className="mb-6 rounded bg-[#EDE4D3] ps-4 pe-4 py-3 text-start">{isAr ? 'نُشر الدليل الثنائي اللغة وأُعيد إلى منسق المعرض.' : 'Bilingual guidelines published and returned to HIP.'}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Column 1: Source Material (Read-Only) */}
        <section className="bg-white p-5 rounded-lg shadow-sm border border-[#D9D2C5] flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-[#EAE3D9] pb-3">
            <BookOpen className="w-5 h-5 text-[#8B4513]" />
            <h2 className="text-base font-semibold font-serif">{isArabicLocked ? (isAr ? "النص العربي المعتمد — للقراءة فقط" : "Certified Arabic — read only") : approvedTheme ? tr("Chairman Ratified Concept") : (isAr ? "بانتظار قرار رئيس الدائرة" : "Awaiting Chairman decision")}</h2>
          </div>

          {(approvedTheme?.arabicName || approvedTheme?.titleAr) && (
            <div className="mb-3 ps-3 pe-3 py-2 rounded bg-amber-50/60 border border-amber-200/80 text-xs">
              <span className="text-[10px] uppercase font-bold text-amber-900 block">{tr("Ratified Title")}</span>
              <strong className="text-amber-950 font-serif text-sm">{approvedTheme.arabicName || approvedTheme.titleAr}</strong>
              {!isAr && approvedTheme.titleEn && (
                <span className="text-stone-600 block text-[11px] mt-0.5">{approvedTheme.titleEn}</span>
              )}
            </div>
          )}

          <div className="bg-[#FAF8F5] border border-[#EAE3D9] p-4 rounded-md mb-4">
            <span className="text-[10px] uppercase font-bold text-[#8C7A6B] mb-2 block">{isArabicLocked ? (isAr ? "البيان الفني المؤسسي المجمّد" : "Locked institutional statement") : tr("Source Text (Raw Arabic)")}</span>
            <p className="text-sm text-[#1A1817] leading-relaxed font-serif text-start" dir="rtl">
              {isArabicLocked ? certifiedArabic : approvedTheme ? rawChairmanTheme : (isAr ? "لا توجد ثيمة معتمدة بعد." : "No ratified theme yet.")}
            </p>
          </div>

          <div className="mt-auto bg-stone-50 border border-stone-200 p-3 rounded-md flex items-start gap-3 text-xs text-stone-600">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#8B4513] mt-0.5" />
            <p> {isAr ? "يُنقّح قسم التحرير الصياغة العربية أولاً. بعد إقرارها تُجمّد وتُحال إلى المترجم، ولا يتم النشر إلا بعد التحقق من الترجمة." : "Editorial refines and locks the Arabic statement first. The translator then verifies the English formulation before publication."} </p>
          </div>
        </section>

        {/* Column 2 & 3: Bilingual Editorial Engine */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#D9D2C5]">
            
            <div className="flex justify-between items-center mb-6 border-b border-[#EAE3D9] pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#8B4513]" />
                <h2 className="text-xl font-serif font-bold text-[#1A1817]">{tr("Official Theme Publication")}</h2>
              </div>
              
              {isPublished ? (
                <span className="ps-3 pe-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {tr("Published Official")} </span>
              ) : (
                <span className="ps-3 pe-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded text-xs font-bold uppercase tracking-wider"> {isArabicLocked ? (isAr ? "بانتظار الترجمة المعتمدة" : "Awaiting verified translation") : tr("Pending Polish")} </span>
              )}
            </div>

            {isPublished && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 p-4 rounded-md flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm">{tr("Theme Locked & Dispatched")}</h4>
                  <p className="text-xs text-emerald-800 mt-1"> {tr("The official bilingual theme is now published. The Head of International Programs (HIP) and General Coordinators have been unblocked to begin curatorial guidelines and artist scouting.")} </p>
                </div>
              </div>
            )}

            <ol className="mb-6 flex flex-wrap gap-4 text-sm" aria-label={isAr ? 'مراحل التحرير' : 'Editorial stages'}>
              <li aria-current={!isArabicLocked ? 'step' : undefined}>{isAr ? '1. التدقيق والتحرير اللغوي (عربي)' : '1. Arabic editorial refinement'} {isArabicLocked && '✓'}</li>
              <li aria-disabled={!isArabicLocked} aria-current={arabicLocked && !isPublished ? 'step' : undefined} className={!isArabicLocked ? 'text-stone-400' : ''}>{isAr ? '2. التعريب والترجمة المعتمدة (English Translation)' : '2. Certified English translation'}</li>
            </ol>
            {!approvedTheme && <p role="status" className="mb-4 text-sm">{isAr ? 'بانتظار اعتماد رئيس الدائرة للثيمة العربية.' : 'Awaiting Chairman ratification of the Arabic theme.'}</p>}
            <form onSubmit={isArabicLocked ? handlePublish : handleLockArabic} className="space-y-6">
              
              {/* Arabic Polish */}
              {!isArabicLocked && <div>
                <label htmlFor="editorial-arabic" className="block text-sm font-bold text-[#1A1817] mb-2 flex items-center justify-between">
                  <span>{tr("Institutional Arabic (الصياغة المؤسسية)")}</span>
                  <span className="text-[10px] uppercase text-[#8C7A6B]">{tr("Required")}</span>
                </label>
                <textarea
                  id="editorial-arabic"
                  dir="rtl"
                  disabled={!approvedTheme}
                  rows={4}
                  value={approvedTheme ? draft.arabicText : ""}
                  onChange={(e) => setDraft({...draft, arabicText: e.target.value})}
                  className="w-full p-4 border border-[#D9D2C5] rounded-md bg-[#FAF8F5] text-sm focus:ring-1 focus:ring-[#8B4513] focus:border-[#8B4513] disabled:opacity-60 disabled:bg-stone-100 outline-hidden resize-none text-start leading-relaxed"
                />
              </div>}

              {/* English Translation */}
              {isArabicLocked && <div>
                <label htmlFor="editorial-english" className="block text-sm font-bold text-[#1A1817] mb-2 flex items-center justify-between">
                  <span>{isAr ? "الصياغة الإنجليزية الرسمية" : "Official English formulation"}</span>
                  <span className="text-[10px] uppercase text-[#8C7A6B]">{tr("Required")}</span>
                </label>
                <textarea
                  id="editorial-english"
                  dir="ltr"
                  disabled={isPublished}
                  rows={4}
                  placeholder={tr("Enter the polished English translation...")}
                  value={draft.englishText}
                  onChange={(e) => { setDraft({...draft, englishText: e.target.value}); setTranslationVerified(false); }}
                  className="w-full p-4 border border-[#D9D2C5] rounded-md bg-[#FAF8F5] text-sm focus:ring-1 focus:ring-[#8B4513] focus:border-[#8B4513] disabled:opacity-60 disabled:bg-stone-100 outline-hidden resize-none text-start leading-relaxed"
                />
                {!isPublished && <label className="mt-4 flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={translationVerified} onChange={e => setTranslationVerified(e.target.checked)} />
                  <span>{isAr ? 'راجعت الترجمة الإنجليزية وتحققت من مطابقتها للنص العربي المعتمد.' : 'I reviewed the English translation and verified it against the certified Arabic statement.'}</span>
                </label>}
              </div>}

              <EditorialAssetLog key={rawChairmanTheme} scope={rawChairmanTheme} isAr={isAr} unlocked={isArabicLocked} />

              {/* Action Footer */}
              <div className="pt-4 border-t border-[#EAE3D9] flex justify-end">
                {!isPublished && (
                  <button
                    type="submit"
                    disabled={isArabicLocked ? !canPublish : !canLockArabic}
                    className="flex items-center gap-2 bg-[#8B4513] hover:bg-[#6e350f] disabled:bg-[#D9D2C5] disabled:cursor-not-allowed text-white ps-6 pe-6 py-2.5 rounded-md text-sm font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isArabicLocked ? (isAr ? "نشر وتعميم الثيمة المعتمدة" : "Publish Official Theme") : (isAr ? "إقرار الصياغة العربية وإحالتها للترجمة" : "Ratify Arabic Text & Route to Translation")}</span>
                  </button>
                )}
              </div>

            </form>
          </div>
        </section>

      </div>
    </div>
  );
}

export { EditorialWorkspace };
