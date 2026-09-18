import React, { useState, useEffect, useRef } from 'react';
import './StoryMode.css';
import { storyChapters } from '../data/storyChapters';
import { StoryCaseGraphic } from './StoryCaseGraphic';
import { AuthoredBand } from './AuthoredBand';
import { Language, RoleKey } from '../types';
import { INSTITUTIONAL_INFO } from '../data/mockData';
import { useI18n } from '../context/I18nContext';
import { 
  BookOpen, 
  Layers, 
  GitBranch, 
  Compass, 
  Palette, 
  Award, 
  Play, 
  Pause, 
  SkipForward, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Building2, 
  Users 
} from 'lucide-react';

interface StoryModeProps {
  lang: Language;
  onSelectRoleAndExplore: (role: RoleKey) => void;
  onSelectManagementView: (view: 'DIRECTORATE' | 'MANAGER') => void;
  onSkipToPlatform: () => void;
  onToggleLanguage: () => void;
}

export const StoryMode: React.FC<StoryModeProps> = ({
  lang,
  onSelectRoleAndExplore,
  onSelectManagementView,
  onSkipToPlatform,
  onToggleLanguage
}) => {
  const i18n = useI18n();
  const activeLang = lang ?? i18n.lang;
  const isAr = activeLang === 'ar';
  const { formatNumber, localizeDigits } = i18n;
  const [currentChapter, setCurrentChapter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  const chapters = storyChapters;

  const current = chapters[currentChapter];
  const isLeadChapter = current.id === 'leadership-visionary';
  const isSecondChapter = current.id === 'leadership-governance';
  const isPortraitChapter = Boolean(current.imagePath);

  useEffect(() => {
    cardRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentChapter]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setTimeout(() => {
        if (currentChapter < chapters.length - 1) {
          setCurrentChapter((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 9000);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentChapter, chapters.length]);

  return (
    <div className="story-shell bg-sadu-sand text-sadu-charcoal">
      <header className="story-toolbar border-b border-sadu-gold bg-sadu-linen px-4 sm:px-6 py-2 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-editorial text-2xl font-bold tracking-tight text-sadu-brick">
              {isAr ? 'سدو' : 'SADU'}
            </span>
            <span className="hidden sm:inline text-xs text-sadu-muted border-l border-sadu-gold pl-3 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-3">
              {isAr ? INSTITUTIONAL_INFO.systemNameAr : INSTITUTIONAL_INFO.systemNameEn}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleLanguage}
              className="px-3 py-1.5 text-xs font-medium border border-sadu-gold rounded-md bg-sadu-sand hover:bg-sadu-sand/80 transition-colors cursor-pointer"
            >
              {isAr ? 'English' : 'العربية'}
            </button>
            <button
              onClick={onSkipToPlatform}
              className="px-3 py-1.5 text-xs font-semibold text-sadu-brick hover:text-sadu-charcoal hover:bg-sadu-sand/70 rounded-md border border-transparent hover:border-sadu-gold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{isAr ? 'تخطي إلى المنصة' : 'Skip to Platform'}</span>
              <SkipForward className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </header>

      <AuthoredBand compact className="my-2" />

      <main className="story-main max-w-6xl w-full mx-auto">
        <div className="story-progress">
          <div className="flex items-center justify-between mb-2.5 text-xs text-sadu-muted">
            <span className="font-semibold uppercase tracking-wider text-sadu-brick">
              {isAr ? `الفصل ${formatNumber(currentChapter + 1)} من ${formatNumber(chapters.length)}` : `Chapter ${currentChapter + 1} of ${chapters.length}`}
            </span>
            <span>{isAr ? 'عرض تعريفي تفاعلي' : 'Guided Institutional Story'}</span>
          </div>
          <div className="grid gap-1.5 h-1.5 w-full bg-sadu-sand/80 rounded-full overflow-hidden" style={{ gridTemplateColumns: `repeat(${chapters.length}, minmax(0, 1fr))` }}>
            {chapters.map((chapter, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentChapter(idx);
                  setIsPlaying(false);
                }}
                className={`h-full transition-all cursor-pointer ${
                  idx === currentChapter ? 'bg-sadu-brick' : idx < currentChapter ? 'bg-sadu-ink' : 'bg-transparent hover:bg-sadu-gold'
                }`}
                title={isAr ? `الفصل ${formatNumber(idx + 1)}: ${chapter.titleAr}` : `Chapter ${idx + 1}: ${chapter.titleEn}`}
                aria-label={isAr ? `الفصل ${formatNumber(idx + 1)}: ${chapter.titleAr}` : `Chapter ${idx + 1}: ${chapter.titleEn}`}
                aria-current={idx === currentChapter ? 'step' : undefined}
              />
            ))}
          </div>
        </div>

        <section ref={cardRef} aria-labelledby="story-title" tabIndex={0} className={`story-card bg-sadu-linen border border-sadu-gold rounded-lg ${isPortraitChapter ? 'story-card--portrait' : ''} ${isLeadChapter ? 'story-card--lead' : ''}`}>
          
          <div className="story-heading flex items-start gap-4 border-b border-sadu-gold/30">
            {!isPortraitChapter && <div className="p-3 rounded-md bg-sadu-sand text-sadu-brick border border-sadu-gold/50 shrink-0">
              <current.icon className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>}
            <div className="flex-1 min-w-0 pt-0.5">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-sadu-ink font-semibold block truncate">
                {isAr ? INSTITUTIONAL_INFO.departmentAr : INSTITUTIONAL_INFO.departmentEn}
              </span>
              <h1 id="story-title" className={`story-title font-editorial font-bold text-sadu-charcoal mt-1.5 ${isLeadChapter ? 'story-title--lead' : isSecondChapter ? 'story-title--second' : ''}`}>
                {isAr ? current.titleAr : current.titleEn}
                {current.designationEn && <span className="story-designation">{isAr ? current.designationAr : current.designationEn}</span>}
              </h1>
              <p className={`text-sadu-brick font-medium mt-1.5 ${isLeadChapter ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'}`}>
                {isAr ? current.subtitleAr : current.subtitleEn}
              </p>
            </div>
          </div>

          <div key={currentChapter} className="story-body">
            {currentChapter < chapters.length - 1 ? (
              <div className="story-content-grid">
                <div className="story-copy">
                  <p className="story-description text-sadu-charcoal">
                    {isAr ? current.contentAr : current.contentEn}
                  </p>
                  
                  <div className="story-highlight rounded-md bg-sadu-sand border-l-4 rtl:border-l-0 rtl:border-r-4 border-sadu-brick text-sadu-charcoal shadow-2xs">
                    <span className="font-semibold block text-sadu-brick mb-1">
                      {isAr ? 'الفكرة الأساسية:' : 'Key principle:'}
                    </span>
                    {isAr ? current.highlightBoxAr : current.highlightBoxEn}
                  </div>
                </div>

                {current.imagePath && current.portrait ? (
                  <figure className={`story-figure ${isLeadChapter ? 'story-figure--lead' : isSecondChapter ? 'story-figure--second' : ''}`}>
                    <div className="story-portrait-stage">
                      {/* Source-specific 4:5 viewport: original illustration pixels are unchanged. */}
                      <svg
                        viewBox={current.portrait.viewBox}
                        role="img"
                        aria-label={isAr ? current.titleAr : current.titleEn}
                        className="story-portrait"
                      >
                        <image href={current.imagePath} width={current.portrait.width} height={current.portrait.height} />
                      </svg>
                    </div>
                    <figcaption className="story-caption text-sadu-muted">
                      {isAr
                        ? 'محتوى عرض مقترح لسدو، وليس تصريحاً أو تأييداً من الشخصية الظاهرة.'
                        : 'Proposed SADU presentation content; not a statement or endorsement by the person shown.'}
                    </figcaption>
                  </figure>
                ) : (
                <StoryCaseGraphic chapter={currentChapter} />
                )}
              </div>
            ) : (
              <div className="story-role-layout">
                <div className="story-copy">
                  <div>
                    <h3 className="text-sm font-bold text-sadu-charcoal mb-2">
                      {isAr ? 'اختر الدور الذي ترغب في استكشافه:' : 'Choose a role to step into:'}
                    </h3>
                    <p className="text-xs leading-relaxed text-sadu-muted">
                      {isAr ? current.contentAr : current.contentEn}
                    </p>
                  </div>
                  
                  <div className="p-3.5 rounded-md bg-sadu-sand border-l-4 rtl:border-l-0 rtl:border-r-4 border-sadu-brick text-xs text-sadu-charcoal shadow-2xs">
                    <span className="font-semibold block text-sadu-brick mb-0.5">
                      {isAr ? 'حالة تجريبية مشتركة:' : 'Shared demonstration case:'}
                    </span>
                    {isAr ? current.highlightBoxAr : current.highlightBoxEn}
                  </div>
                </div>

                <div className="story-role-grid">
                  {[
                    { role: 'DIRECTORATE' as RoleKey, labelEn: 'Start with the Chairman’s brief', labelAr: 'ابدأ بموجز رئيس الدائرة' },
                    { role: 'DIRECTORATE' as RoleKey, view: 'DIRECTORATE' as const, labelEn: 'Directorate · Department oversight', labelAr: 'الإدارة · متابعة الأقسام' },
                    { role: 'DIRECTORATE' as RoleKey, view: 'MANAGER' as const, labelEn: 'Exhibition manager · Delivery', labelAr: 'مدير المعارض · التنفيذ' },
                    { role: 'SDC_COORDINATOR' as RoleKey, labelEn: 'SDC Coordinator', labelAr: 'منسق عام المهرجانات (SDC)' },
                    { role: 'COMMITTEE' as RoleKey, labelEn: 'Curatorial Jury', labelAr: 'لجنة الاختيار والتحكيم' },
                    { role: 'EDITORIAL' as RoleKey, labelEn: 'Publishing manager · Proof review', labelAr: 'مدير النشر · مراجعة البروفة' },
                    { role: 'SAF_TECHNICIAN' as RoleKey, labelEn: 'Technical Production', labelAr: 'فريق الإنتاج الفني' },
                    { role: 'SMA_VENUE_ADMIN' as RoleKey, labelEn: 'Venue Administration', labelAr: 'إدارة مواقع العرض' },
                    { role: 'PR_PROTOCOL' as RoleKey, labelEn: 'PR & Diplomacy', labelAr: 'المراسم والبروتوكول' },
                    { role: 'FINANCE' as RoleKey, labelEn: 'Finance & LPOs', labelAr: 'المالية والمشتريات' },
                    { role: 'LOGISTICS' as RoleKey, labelEn: 'Fine Art Logistics', labelAr: 'الشحن واللوجستيات' },
                    { role: 'ARTIST' as RoleKey, labelEn: 'Artist intake', labelAr: 'تقديم الفنان' },
                  ].map((item) => (
                    <button
                      key={item.view ?? item.labelEn}
                      onClick={() => item.view ? onSelectManagementView(item.view) : onSelectRoleAndExplore(item.role)}
                      className="rounded-md border border-sadu-gold bg-sadu-linen hover:bg-sadu-brick hover:text-white text-left rtl:text-right transition-colors group cursor-pointer shadow-2xs flex items-center justify-between gap-2"
                    >
                      <span className="story-role-label font-bold group-hover:text-white text-sadu-charcoal">
                        {isAr ? item.labelAr : item.labelEn}
                      </span>
                      <ArrowRight aria-hidden="true" className="w-3.5 h-3.5 shrink-0 rtl:rotate-180" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="story-controls flex items-center justify-between border-t border-sadu-gold">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentChapter((prev) => Math.max(0, prev - 1))}
              disabled={currentChapter === 0}
              className="px-4 py-2 text-xs font-medium border border-sadu-gold rounded-md bg-sadu-linen disabled:opacity-40 hover:bg-sadu-sand/70 flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{isAr ? 'السابق' : 'Previous'}</span>
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 text-xs font-medium border border-sadu-gold rounded-md bg-sadu-linen hover:bg-sadu-sand/70 flex items-center gap-1.5 cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-sadu-brick" />
                  <span>{isAr ? 'إيقاف مؤقت' : 'Pause'}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-sadu-ink" />
                  <span>{isAr ? 'تشغيل تلقائي' : 'Autoplay'}</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {currentChapter < chapters.length - 1 ? (
              <button
                onClick={() => setCurrentChapter((prev) => prev + 1)}
                className="px-5 py-2 text-xs font-semibold text-white bg-sadu-brick hover:bg-sadu-brick-dark rounded-md flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>{isAr ? 'الفصل التالي' : 'Next Chapter'}</span>
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            ) : (
              <button
                onClick={onSkipToPlatform}
                className="px-5 py-2 text-xs font-semibold text-white bg-sadu-ink hover:bg-sadu-ink-dark rounded-md flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>{isAr ? 'دخول المنصة التفاعلية' : 'Enter Interactive Platform'}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            )}
          </div>
        </div>
      </main>

      <footer className="story-footer border-t border-sadu-gold bg-sadu-linen text-center text-sadu-muted">
        <span>
          {isAr ? INSTITUTIONAL_INFO.taglineAr : INSTITUTIONAL_INFO.taglineEn}
        </span>
        <span className="mx-2">·</span>
        <span className="text-sadu-brick font-semibold">
          {isAr ? 'دائرة الثقافة — الشارقة' : 'Sharjah Department of Culture'}
        </span>
      </footer>
    </div>
  );
};
