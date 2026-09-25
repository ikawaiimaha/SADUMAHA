import React, { useState, useEffect } from 'react';
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

type InternalThemeStatus = 'PENDING_EDITORIAL_POLISH' | 'PUBLISHED_OFFICIAL';

interface EditorialDraft {
  arabicText: string;
  englishText: string;
}

export interface EditorialWorkspaceProps {
  guidelinesArabic?: string;
  guidelinesEnglish?: string;
  onPublishOfficialGuidelines?: (englishTranslation: string, arabicSource: string) => void;
  onPublishOfficialTheme?: (data: {
    themeEssayArabic: string;
    themeEssayEnglish: string;
    approvedTheme?: any;
  }) => void;
  onPublishBrief?: (englishText: string) => void;
  approvedTheme?: ThemeItem | any;
  themePolishStatus?: ThemePolishStatus;
  assignedBudget?: number | null;
  initialEssayArabic?: string;
  initialEssayEnglish?: string;
  isInitiallyPublished?: boolean;
  onBackToRoles?: () => void;
}

const DEFAULT_RAW_CHAIRMAN_THEME =
  'استكشاف الجذور العميقة للخط العربي وتفاعله مع الفنون المعاصرة في بيئة حضرية متغيرة، مع التركيز على التوازن بين الأصالة والابتكار.';

const DEFAULT_POLISHED_ENGLISH_THEME =
  'Exploring the profound roots of Arabic calligraphy and its vibrant dialogue with contemporary art within an evolving urban landscape, with an uncompromised balance between classical authenticity and avant-garde innovation.';

export default function EditorialWorkspace({
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
}: EditorialWorkspaceProps = {}) {
  // Determine raw theme approved by Chairman in Stage 1
  const rawChairmanTheme = 
    approvedTheme?.conceptStatementAr || 
    approvedTheme?.definition || 
    approvedTheme?.titleAr || 
    initialEssayArabic || 
    guidelinesArabic || 
    DEFAULT_RAW_CHAIRMAN_THEME;

  const [themeStatus, setThemeStatus] = useState<InternalThemeStatus>(
    (isInitiallyPublished || themePolishStatus === 'PUBLISHED' || themePolishStatus === 'PUBLISHED_OFFICIAL')
      ? 'PUBLISHED_OFFICIAL'
      : 'PENDING_EDITORIAL_POLISH'
  );

  const [draft, setDraft] = useState<EditorialDraft>({
    arabicText: initialEssayArabic || guidelinesArabic || rawChairmanTheme,
    englishText: initialEssayEnglish || guidelinesEnglish || (themePolishStatus === 'PUBLISHED' ? DEFAULT_POLISHED_ENGLISH_THEME : '')
  });

  useEffect(() => {
    if (isInitiallyPublished || themePolishStatus === 'PUBLISHED' || themePolishStatus === 'PUBLISHED_OFFICIAL') {
      setThemeStatus('PUBLISHED_OFFICIAL');
    }
  }, [isInitiallyPublished, themePolishStatus]);

  const isPublished = themeStatus === 'PUBLISHED_OFFICIAL';
  const canPublish = draft.arabicText.trim().length > 10 && draft.englishText.trim().length > 10;

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPublish) return;
    
    // Locks Stage 2 and unlocks Stage 3 (HIP Curatorial Directives)
    setThemeStatus('PUBLISHED_OFFICIAL');

    if (onPublishOfficialTheme) {
      onPublishOfficialTheme({
        themeEssayArabic: draft.arabicText.trim(),
        themeEssayEnglish: draft.englishText.trim(),
        approvedTheme,
      });
    }

    onPublishOfficialGuidelines?.(draft.englishText.trim(), draft.arabicText.trim());
    onPublishBrief?.(draft.englishText.trim());
  };

  return (
    <div className="min-h-screen bg-[#F7F1E6] p-6 text-[#2C2A29] font-sans text-start" dir="ltr">
      
      {/* Header */}
      <header className="mb-8 border-b border-[#D9D2C5] pb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8C7A6B] font-semibold">Stage 2 • Editorial &amp; Translation Gate</span>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-[#1A1817] mt-1">Editorial Workspace</h1>
          <p className="text-[#6B635B] text-sm mt-1">
            قسم التحرير — Polish raw curatorial concepts and author the official bilingual publication.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-md border border-[#D9D2C5] text-xs font-mono shadow-xs flex items-center gap-2">
            <Languages className="w-4 h-4 text-[#8B4513]" />
            <span>Bilingual Mandate: <strong className="text-[#1A1817]">Active</strong></span>
          </div>
          {onBackToRoles && (
            <button
              type="button"
              onClick={onBackToRoles}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#D9D2C5] bg-white px-3 py-2 text-xs font-bold text-[#6B635B] hover:bg-stone-50 cursor-pointer shadow-xs transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Switch Role</span>
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1: Source Material (Read-Only) */}
        <section className="bg-white p-5 rounded-lg shadow-sm border border-[#D9D2C5] flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-[#EAE3D9] pb-3">
            <BookOpen className="w-5 h-5 text-[#8B4513]" />
            <h2 className="text-base font-semibold font-serif">Chairman Ratified Concept</h2>
          </div>

          {approvedTheme?.titleAr && (
            <div className="mb-3 px-3 py-2 rounded bg-amber-50/60 border border-amber-200/80 text-xs">
              <span className="text-[10px] uppercase font-bold text-amber-900 block">Ratified Title</span>
              <strong className="text-amber-950 font-serif text-sm">{approvedTheme.titleAr}</strong>
              {approvedTheme.titleEn && (
                <span className="text-stone-600 block text-[11px] mt-0.5">{approvedTheme.titleEn}</span>
              )}
            </div>
          )}

          <div className="bg-[#FAF8F5] border border-[#EAE3D9] p-4 rounded-md mb-4">
            <span className="text-[10px] uppercase font-bold text-[#8C7A6B] mb-2 block">Source Text (Raw Arabic)</span>
            <p className="text-sm text-[#1A1817] leading-relaxed font-serif text-end" dir="rtl">
              {rawChairmanTheme}
            </p>
          </div>

          <div className="mt-auto bg-stone-50 border border-stone-200 p-3 rounded-md flex items-start gap-3 text-xs text-stone-600">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#8B4513] mt-0.5" />
            <p>
              This text has been officially ratified by the Chairman. Your mandate is to elevate the prose into formal institutional Arabic and provide an exact, publication-ready English translation.
            </p>
          </div>
        </section>

        {/* Column 2 & 3: Bilingual Editorial Engine */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#D9D2C5]">
            
            <div className="flex justify-between items-center mb-6 border-b border-[#EAE3D9] pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#8B4513]" />
                <h2 className="text-xl font-serif font-bold text-[#1A1817]">Official Theme Publication</h2>
              </div>
              
              {isPublished ? (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Published Official
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded text-xs font-bold uppercase tracking-wider">
                  Pending Polish
                </span>
              )}
            </div>

            {isPublished && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 p-4 rounded-md flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm">Theme Locked &amp; Dispatched</h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    The official bilingual theme is now published. The Head of International Programs (HIP) and General Coordinators have been unblocked to begin curatorial guidelines and artist scouting.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handlePublish} className="space-y-6">
              
              {/* Arabic Polish */}
              <div>
                <label className="block text-sm font-bold text-[#1A1817] mb-2 flex items-center justify-between">
                  <span>Institutional Arabic (الصياغة المؤسسية)</span>
                  <span className="text-[10px] uppercase text-[#8C7A6B]">Required</span>
                </label>
                <textarea
                  dir="rtl"
                  disabled={isPublished}
                  rows={4}
                  value={draft.arabicText}
                  onChange={(e) => setDraft({...draft, arabicText: e.target.value})}
                  className="w-full p-4 border border-[#D9D2C5] rounded-md bg-[#FAF8F5] text-sm focus:ring-1 focus:ring-[#8B4513] focus:border-[#8B4513] disabled:opacity-60 disabled:bg-stone-100 outline-hidden resize-none text-end leading-relaxed"
                />
              </div>

              {/* English Translation */}
              <div>
                <label className="block text-sm font-bold text-[#1A1817] mb-2 flex items-center justify-between">
                  <span>English Translation</span>
                  <span className="text-[10px] uppercase text-[#8C7A6B]">Required</span>
                </label>
                <textarea
                  dir="ltr"
                  disabled={isPublished}
                  rows={4}
                  placeholder="Enter the polished English translation..."
                  value={draft.englishText}
                  onChange={(e) => setDraft({...draft, englishText: e.target.value})}
                  className="w-full p-4 border border-[#D9D2C5] rounded-md bg-[#FAF8F5] text-sm focus:ring-1 focus:ring-[#8B4513] focus:border-[#8B4513] disabled:opacity-60 disabled:bg-stone-100 outline-hidden resize-none text-start leading-relaxed"
                />
              </div>

              {/* Action Footer */}
              <div className="pt-4 border-t border-[#EAE3D9] flex justify-end">
                {!isPublished && (
                  <button
                    type="submit"
                    disabled={!canPublish}
                    className="flex items-center gap-2 bg-[#8B4513] hover:bg-[#6e350f] disabled:bg-[#D9D2C5] disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-md text-sm font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Publish Official Theme</span>
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
