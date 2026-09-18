import React, { useState, useEffect, useRef } from 'react';
import './StoryMode.css';
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
  onSkipToPlatform: () => void;
  onToggleLanguage: () => void;
}

export const StoryMode: React.FC<StoryModeProps> = ({
  lang,
  onSelectRoleAndExplore,
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

  const chapters = [
    {
      id: 'leadership-visionary',
      icon: BookOpen,
      titleEn: 'H.H. Sheikh Dr. Sultan bin Muhammad Al Qasimi',
      titleAr: 'صاحب السمو الشيخ الدكتور سلطان بن محمد القاسمي',
      subtitleEn: 'Culture and Institutional Memory',
      subtitleAr: 'الثقافة والذاكرة المؤسسية',
      imagePath: '/sultan_portrait.jpg',
      portrait: { width: 2816, height: 1536, viewBox: '1000 0 1228.8 1536' },
      contentEn: 'The proposed SADU experience connects cultural programmes with the people, decisions, and evidence behind them. Artist statements, sources, and programme outcomes remain understandable to the next employee and useful to future research.',
      contentAr: 'يربط تصور سدو المقترح البرامج الثقافية بالأشخاص والقرارات والأدلة المرتبطة بها. وتبقى بيانات الفنانين ومصادر المعلومات ونتائج البرامج مفهومة للموظف التالي وقابلة للاستفادة منها في البحث مستقبلاً.',
      highlightBoxEn: 'Design objective: preserve the context of cultural work as it happens.',
      highlightBoxAr: 'الهدف التصميمي: حفظ سياق العمل الثقافي أثناء إنجازه.'
    },
    {
      id: 'leadership-governance',
      icon: Building2,
      titleEn: 'H.E. Abdullah bin Mohammed Al Owais',
      titleAr: 'سعادة عبد الله بن محمد العويس',
      subtitleEn: 'Accountability and Clear Decisions',
      subtitleAr: 'المساءلة ووضوح القرارات',
      imagePath: '/owais_portrait.jpg',
      portrait: { width: 2730, height: 1536, viewBox: '1065 0 1228.8 1536' },
      contentEn: 'The proposed leadership view brings readiness, commitments, missing evidence, and pending decisions into one brief. A recorded action should show its responsible role and supporting evidence; formal approval still depends on documented institutional delegation.',
      contentAr: 'يجمع عرض القيادة المقترح الجاهزية والالتزامات والأدلة الناقصة والقرارات المعلقة في ملخص واحد. وينبغي أن يوضح كل إجراء مسجل الدور المسؤول والأدلة الداعمة له؛ ويظل الاعتماد الرسمي مرهوناً بتفويض مؤسسي موثق.',
      highlightBoxEn: 'Design objective: make the decision, its evidence, and the next action clear.',
      highlightBoxAr: 'الهدف التصميمي: توضيح القرار وأدلته والإجراء التالي.'
    },
    {
      id: 'leadership-operational',
      icon: GitBranch,
      titleEn: 'Mohammed Ibrahim Al Qaseer',
      titleAr: 'محمد إبراهيم القصير',
      subtitleEn: 'Programme Delivery and Handover',
      subtitleAr: 'تنفيذ البرامج وتسليم المسؤوليات',
      imagePath: '/qaseer_portrait.jpg',
      portrait: { width: 1728, height: 2418, viewBox: '525 550 1024 1280' },
      contentEn: 'The proposed delivery view connects exhibition plans with coordinator, technical, and logistics tasks. It makes blockers, dependencies, and the next responsible role visible so a newly assigned employee can continue from a clear handover.',
      contentAr: 'يربط عرض التنفيذ المقترح خطط المعارض بمهام التنسيق والعمل الفني واللوجستيات. ويوضح المعوقات والاعتماد المتبادل بين المهام والدور المسؤول التالي، ليتمكن الموظف المكلف حديثاً من متابعة العمل انطلاقاً من تسليم واضح.',
      highlightBoxEn: 'Design objective: show what is ready, what is blocked, and who acts next.',
      highlightBoxAr: 'الهدف التصميمي: إظهار الجاهز والمتعطل ومن يتولى الإجراء التالي.'
    },
    {
      id: 'continuity',
      icon: BookOpen,
      titleEn: 'The Scale of Sharjah\'s Cultural Mission',
      titleAr: 'حجم المهمة الثقافية لإمارة الشارقة',
      subtitleEn: 'Supporting global initiatives with robust administrative architecture.',
      subtitleAr: 'دعم المبادرات العالمية بمنظومة إدارية راسخة.',
      contentEn: 'Managing initiatives like the Houses of Poetry across the Arab world and "Sharjah Cultural Days" requires unified administration. The Department generates profound intellectual output through every festival, publication, and exhibition. To prevent this vast documentation from fragmenting across disconnected channels, a central system is required.',
      contentAr: 'تتطلب إدارة مبادرات كبرى كـ "بيوت الشعر" في الوطن العربي و"أيام الشارقة الثقافية" نظاماً إدارياً موحداً. تُنتج الدائرة رصيداً فكرياً ضخماً من خلال المهرجانات والإصدارات والمعارض. ولضمان عدم تشتت هذه الوثائق في قنوات اتصال غير مترابطة، برزت الحاجة لنظام مركزي.',
      highlightBoxEn: 'The Goal: To safeguard the Department\'s institutional memory with the same dedication applied to its cultural diplomacy.',
      highlightBoxAr: 'الهدف الأساسي: حفظ الذاكرة المؤسسية للدائرة بذات الدقة والاهتمام الذي تُدار به مبادراتها الدبلوماسية الثقافية.'
    },
    {
      id: 'coordination',
      icon: GitBranch,
      titleEn: 'The Administrative Challenge',
      titleAr: 'التحدي الإداري والتشغيلي',
      subtitleEn: 'Consolidating workflows and clarifying decision-making authority.',
      subtitleAr: 'توحيد مسارات العمل وضبط صلاحيات اتخاذ القرار.',
      contentEn: 'Currently, critical operations—from confirming an artwork for a biennial to approving a magazine for print—are often scattered across emails, spreadsheets, and messaging apps. SADU addresses this by consolidating these workflows. It clearly separates everyday communication from official, auditable institutional approvals.',
      contentAr: 'غالباً ما تُتخذ القرارات عبر قنوات غير رسمية، كاعتماد عمل فني عبر رسالة نصية، في حين تتطلب الإدارة المالية مستنداً رسمياً للصرف. يعالج "سدو" هذا الخلل بفصل المراسلات اليومية عن الاعتمادات الملزمة. في "سدو"، المراسلات للمناقشة فقط، ولا تُعتمد الميزانيات إلا بسجل إلكتروني موثق.',
      highlightBoxEn: 'Core Principle: A centralized platform ensures no operational detail or financial commitment is undocumented.',
      highlightBoxAr: 'المبدأ الجوهري: منصة مركزية تضمن عدم ضياع أي تفصيل تشغيلي أو التزام مالي دون توثيق رسمي.'
    },
    {
      id: 'sadu-name',
      icon: Layers,
      titleEn: 'SADU: A Unified Digital Archive',
      titleAr: 'سدو: أرشيف رقمي موحد وموثق',
      subtitleEn: 'Preserving heritage with UNESCO-caliber documentation standards.',
      subtitleAr: 'توثيق الإرث الثقافي بمعايير تضاهي متطلبات اليونسكو.',
      contentEn: 'Inspired by the interconnected threads of traditional Al Sadu weaving, the platform gathers dispersed records—artist contracts, curatorial notes, and editorial drafts—into one secure digital archive. Reflecting the meticulous documentation standards established for the "Heart of Sharjah" UNESCO dossier, SADU ensures reliable historical continuity.',
      contentAr: 'استلهاماً من خيوط حرفة "السدو" المترابطة، يجمع النظام السجلات المتفرقة، كعقود الفنانين وملاحظات التحكيم ومسودات التحرير، في أرشيف رقمي آمن. وبما يواكب المعايير التوثيقية الدقيقة التي أُسس عليها ملف "قلب الشارقة" لليونسكو، يضمن "سدو" استمرارية تاريخية موثوقة.',
      highlightBoxEn: 'Result: Every piece of data is secured and traceable, building an accurate historical record for the Department.',
      highlightBoxAr: 'النتيجة: كل بيان محفوظ وقابل للتتبع، مما يبني سجلاً تاريخياً دقيقاً وشاملاً لعمل الدائرة.'
    },
    {
      id: 'canon',
      icon: Palette,
      titleEn: 'Professional Editorial Environment',
      titleAr: 'بيئة تحريرية وعملية احترافية',
      subtitleEn: 'Clear typography and structured interfaces for long working sessions.',
      subtitleAr: 'واجهات منظمة وخطوط واضحة لجلسات العمل والمراجعة الطويلة.',
      contentEn: 'As the publisher of seven cultural magazines, including Al Rafid and Al Qawafi, visual clarity is a priority for the Department. SADU avoids cluttered software layouts. It utilizes professional Arabic typography, pairing the elegant Amiri font for titles with the highly readable Noto Naskh for operational data, reducing visual fatigue for staff.',
      contentAr: 'بصفتها جهة ناشرة لسبع مجلات ثقافية رائدة، منها "الرافد" و"القوافي"، تضع الدائرة وضوح القراءة كأولوية. يتجنب "سدو" الواجهات المزدحمة، ويعتمد خطوطاً احترافية، حيث يدمج خط "الأميري" للعناوين مع خط "نوتو نسخ" الواضح للبيانات التشغيلية، لتخفيف الإجهاد البصري للموظفين.',
      highlightBoxEn: 'Design Approach: An interface that respects the Arabic language and serves the practical needs of the administration.',
      highlightBoxAr: 'المنهج التصميمي: واجهة تحترم لغة الضاد وتلبي الاحتياجات العملية للإدارة وموظفيها.'
    },
    {
      id: 'leadership',
      icon: Award,
      titleEn: 'Executive Oversight & Control',
      titleAr: 'الإشراف التنفيذي والمتابعة',
      subtitleEn: 'Clear, high-level visibility for the Chairman and Directorate.',
      subtitleAr: 'رؤية واضحة وشاملة لسعادة رئيس الدائرة والإدارة التنفيذية.',
      contentEn: 'SADU equips the Chairman and the Directorate with a streamlined executive dashboard. Without navigating through raw operational data, leadership can monitor the global footprint of festivals, track monthly publishing deadlines, and instantly identify any administrative bottlenecks requiring high-level intervention.',
      contentAr: 'يُزود "سدو" قيادة الدائرة بلوحة متابعة تنفيذية مبسطة. ودون الحاجة للبحث في تفاصيل البيانات الأولية، يمكن للقيادة مراقبة الانتشار العالمي للمهرجانات، وتتبع مواعيد النشر الشهرية، ورصد أي تأخير إداري يتطلب تدخلاً أو توجيهاً مباشراً.',
      highlightBoxEn: 'Strategic Value: Real-time visibility into all Department programs enables informed and swift decision-making.',
      highlightBoxAr: 'القيمة الاستراتيجية: المتابعة اللحظية لجميع برامج الدائرة تدعم اتخاذ القرارات بشكل سريع ومدروس.'
    },
    {
      id: 'explore-next',
      icon: Users,
      titleEn: 'Step into the SADU Platform',
      titleAr: 'استكشف منصة سدو التشغيلية',
      subtitleEn: 'Experience the interconnected workspaces designed for specific roles.',
      subtitleAr: 'تجربة مساحات العمل المترابطة والمصممة لكل تخصص إداري.',
      contentEn: 'The system provides customized tools for each department\'s workflow. Event coordinators manage their specific tasks, the Curatorial Jury evaluates submissions securely, Editorial teams track publications, and Logistics teams manage movement. Choose a specific role below to see how these departments collaborate seamlessly on one platform.',
      contentAr: 'يوفر النظام أدوات مخصصة لتسهيل عمل كل إدارة. يتابع المنسقون مهامهم، وتُقيّم لجان التحكيم المشاركات بسرية، وتدير هيئة التحرير الإصدارات، ويشرف الفريق اللوجستي على الشحن. اختر دوراً أدناه لاستكشاف كيفية تعاون هذه الإدارات بانسجام عبر منصة واحدة.',
      highlightBoxEn: 'Interactive Mockup: Select a profile to view live, structured dashboards and approval workflows.',
      highlightBoxAr: 'النموذج التفاعلي: اختر ملفاً تعريفياً للاطلاع على لوحات المتابعة ومسارات الاعتماد المباشرة.'
    }
  ];

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
              <SkipForward className="w-3.5 h-3.5" />
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
                      {current.imagePath
                        ? (isAr ? 'تصور مقترح لسدو:' : 'Proposed SADU experience:')
                        : (isAr ? 'الأصل المؤسسي المعتمد:' : 'Institutional Canon:')}
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
                <div className="story-placeholder relative w-full rounded-lg overflow-hidden border border-sadu-gold shadow-xs group bg-[#F2EDE4]">
                  <div className="absolute -top-20 -right-20 w-80 h-80 border-[40px] border-sadu-brick/10 rounded-full transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] border-[60px] border-sadu-ink/5 rounded-full transition-transform duration-1000 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(140,96,30,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(140,96,30,0.08)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 transition-transform duration-1000 group-hover:scale-110 group-hover:opacity-15">
                    <current.icon className="w-64 h-64 text-sadu-ink" strokeWidth={1} />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-sadu-ink/95 backdrop-blur-md p-4 sm:p-5 border-t-4 border-sadu-brick text-left rtl:text-right">
                    <span className="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5 block">
                      {isAr ? 'واجهة رسومية مؤقتة' : 'Structural Graphic Placeholder'}
                    </span>
                    <p className="text-[10px] text-white/80 leading-relaxed">
                      {isAr
                        ? 'بانتظار التصميم النهائي للوسائط المتعددة من إدارة الجرافيك بدائرة الثقافة وفق المعايير المؤسسية للضبط البصري.'
                        : 'Pending final multimedia production by SDC Graphic Design Dept. in compliance with institutional visual guidelines.'}
                    </p>
                  </div>
                </div>
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
                      {isAr ? 'بيئة تشغيلية متكاملة:' : 'Live Interactive Mockup:'}
                    </span>
                    {isAr ? `${formatNumber(10)} مساحات عمل تخصصية مصممة وفق لوائح الحوكمة المعتمدة.` : '10 specialist workspaces with attributable records & audit trails.'}
                  </div>
                </div>

                <div className="story-role-grid">
                  {[
                    { role: 'DIRECTORATE' as RoleKey, labelEn: 'H.E. Chairman & Directorate', labelAr: 'رئيس الدائرة والإدارة التنفيذية' },
                    { role: 'SDC_COORDINATOR' as RoleKey, labelEn: 'SDC Coordinator', labelAr: 'منسق عام المهرجانات (SDC)' },
                    { role: 'COMMITTEE' as RoleKey, labelEn: 'Curatorial Jury', labelAr: 'لجنة الاختيار والتحكيم' },
                    { role: 'EDITORIAL' as RoleKey, labelEn: 'Editorial Bureau (Magazines)', labelAr: 'هيئة تحرير المجلات الثقافية' },
                    { role: 'SAF_TECHNICIAN' as RoleKey, labelEn: 'Technical Production', labelAr: 'فريق الإنتاج الفني' },
                    { role: 'SMA_VENUE_ADMIN' as RoleKey, labelEn: 'Venue Administration', labelAr: 'إدارة مواقع العرض' },
                    { role: 'PR_PROTOCOL' as RoleKey, labelEn: 'PR & Diplomacy', labelAr: 'المراسم والبروتوكول' },
                    { role: 'FINANCE' as RoleKey, labelEn: 'Finance & LPOs', labelAr: 'المالية والمشتريات' },
                    { role: 'LOGISTICS' as RoleKey, labelEn: 'Fine Art Logistics', labelAr: 'الشحن واللوجستيات' },
                    { role: 'ARTIST' as RoleKey, labelEn: 'Artist Studio', labelAr: 'استوديو الفنان' },
                  ].map((item) => (
                    <button
                      key={item.role}
                      onClick={() => onSelectRoleAndExplore(item.role)}
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
