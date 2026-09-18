import React, { useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { EDITORIAL_ITEMS } from '../../data/mockData';
import { EditorialItem, EditorialStatus } from '../../types';
import { GalleryLabelPrintView } from '../common';
import { 
  BookOpen, 
  Languages, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  FileText, 
  UserCheck, 
  Lock, 
  Unlock, 
  Sparkles, 
  PenTool, 
  Download, 
  Filter, 
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Award,
  BadgeAlert,
  Printer,
  ShieldCheck
} from 'lucide-react';

export type PipelineStage = 'source_intake' | 'arabic_finalization' | 'english_translation' | 'catalogue_ready';

export interface TextAsset {
  id: string;
  code: string;
  titleEn: string;
  titleAr: string;
  assetType: 'bio' | 'concept' | 'poetry';
  assetTypeEn: string;
  assetTypeAr: string;
  artistEn: string;
  artistAr: string;
  isTakreem: boolean;
  sourceLang: 'ar' | 'non_ar';
  sourceLangLabelEn: string;
  sourceLangLabelAr: string;
  stage: PipelineStage;
  statusTagEn: string;
  statusTagAr: string;
  statusColor: 'warning' | 'info' | 'success' | 'amber';
  wordCount: number;
  publicationTargetEn: string;
  publicationTargetAr: string;
  arabicMasterLocked: boolean;
  arabicAssignedToEn: string;
  arabicAssignedToAr: string;
  englishAssignedToEn: string;
  englishAssignedToAr: string;
  sourceTextExcerptEn?: string;
  sourceTextExcerptAr?: string;
  arabicText: string;
  englishText: string;
  editorialNotesEn: string;
  editorialNotesAr: string;
  lastUpdated: string;
}

const INITIAL_ASSETS: TextAsset[] = [
  {
    id: 'txt-01',
    code: 'TXT-2026-POE-01',
    titleEn: 'Poetry Transcription & Diacritical Vowelling',
    titleAr: 'توثيق ونقحرة الأبيات الشعرية الكلاسيكية المنقوشة',
    assetType: 'poetry',
    assetTypeEn: 'Classical Poetry Inscription',
    assetTypeAr: 'نقش شعري كلاسيكي محفور',
    artistEn: 'Youssef Nabhan',
    artistAr: 'يوسف نبهان',
    isTakreem: true,
    sourceLang: 'ar',
    sourceLangLabelEn: 'Arabic Original (Artist Hand)',
    sourceLangLabelAr: 'الأصل بخط الفنان (عربي)',
    stage: 'english_translation',
    statusTagEn: 'In English Translation',
    statusTagAr: 'قيد الترجمة الإنجليزية',
    statusColor: 'info',
    wordCount: 340,
    publicationTargetEn: 'Official Biennial Monograph (Plates Cat. p. 78)',
    publicationTargetAr: 'المونوغراف الرسمي للبينالي (صفحة لوحات 78)',
    arabicMasterLocked: true,
    arabicAssignedToEn: 'Dr. Ahmad Al-Qassimi (Classical Script Scholar)',
    arabicAssignedToAr: 'د. أحمد القاسمي (مستشار النصوص الكلاسيكية)',
    englishAssignedToEn: 'Dr. Christopher Vance (Curatorial Literary Translator)',
    englishAssignedToAr: 'د. كريستوفر فانس (مترجم الأدب التراثي)',
    arabicText: '«أَعَزُّ مَكَانٍ في الدُّنَى سَرْجُ سَابِحٍ ... وَخَيْرُ جَلِيسٍ في الزَّمَانِ كِتَابُ»\n«رَمَى الدَّهْرُ سَهْماً فَاخْتَرَقَ السَّمَاءَ ... وَخَطَّ المَدَى بِالبَيَانِ المُهَابِ»',
    englishText: '"The noblest place in this world is the saddle of a swift steed, and the finest companion in all time is a book. Destined time loosed an arrow that cleft the sky, etching the expanse with solemn, majestic eloquence."',
    editorialNotesEn: 'Master Arabic vocalization and diacritical signs authenticated against original Al-Mutanabbi manuscripts in the Sharjah Cultural Directorate Archives. English metric cadence in final curatorial review.',
    editorialNotesAr: 'تم ضبط علامات الإعراب والتشكيل القرآني/الكلاسيكي بدقة ومطابقتها مع مخطوطات ديوان المتنبي في دار المخطوطات بالشارقة. الوزن الشعري المترجم قيد المراجعة الأدبية النهائية.',
    lastUpdated: '12 Sep 2026',
  },
  {
    id: 'txt-02',
    code: 'TXT-2026-BIO-02',
    titleEn: 'Artist Monograph & Official Biography',
    titleAr: 'السيرة الذاتية الرسمية ومونوغراف الفنان',
    assetType: 'bio',
    assetTypeEn: 'Curatorial Biography',
    assetTypeAr: 'سيرة متحفية معتمدة',
    artistEn: 'Youssef Nabhan',
    artistAr: 'يوسف نبهان',
    isTakreem: true,
    sourceLang: 'non_ar',
    sourceLangLabelEn: 'French / English (Paris Studio Intake)',
    sourceLangLabelAr: 'أصل فرنسي/إنجليزي (استوديو باريس)',
    stage: 'arabic_finalization',
    statusTagEn: 'Pending Arabic Proofread',
    statusTagAr: 'قيد التدقيق اللغوي العربي',
    statusColor: 'warning',
    wordCount: 680,
    publicationTargetEn: 'Biennial Masters Directory & Guidebook',
    publicationTargetAr: 'دليل رواد الخط والكتالوج العام للبينالي',
    arabicMasterLocked: false,
    arabicAssignedToEn: 'Ustadh Mona Al-Balooshi (Senior Arabic Editor)',
    arabicAssignedToAr: 'أ. منى البلوشي (كبير المحررين اللغويين)',
    englishAssignedToEn: 'Pending Arabic Master Sign-off (Locked)',
    englishAssignedToAr: 'معلق لحين اعتماد النص العربي (مقفل)',
    sourceTextExcerptEn: 'Youssef Nabhan (b. 1968) is widely celebrated for reinventing the architectural cadence of Ottoman Thuluth and geometric Kufic script...',
    arabicText: '«يوسف نبهان (مواليد 1968)، خطاط ونحات معاصر، يُعد من أبرز المجددين الذين أعادوا صياغة الفراغ المعماري لحرف الثلث العثماني والكوفي الهندسي. تجمع أعماله بين الصرامة الأكاديمية للتراكيب الخطية والجرأة التشكيلية المعاصرة...»',
    englishText: '[English Translation Locked: Under Sharjah Cultural Protocol, the Arabic text must be ratified by the Senior Editor before the catalogue English version is generated.]',
    editorialNotesEn: 'Strict Institutional Gate: Source was non-Arabic, so it was translated to Arabic first. Currently under Senior Arabic proofreading for terminology alignment (e.g., using official Sharjah Calligraphy terminology). English is locked.',
    editorialNotesAr: 'بوابة إلزامية صارمة: النص المصدر كان أجنبياً، فتمت ترجمته إلى العربية أولاً، وهو الآن قيد التدقيق اللغوي لتوحيد المصطلحات (مثل: مصطلحات خط الثلث الجلي ومحاور التراكيب). النسخة الإنجليزية مقفلة آلياً.',
    lastUpdated: '14 Sep 2026',
  },
  {
    id: 'txt-03',
    code: 'TXT-2026-CPT-03',
    titleEn: 'Artwork Concept Statement: "Kufic Horizon"',
    titleAr: 'البيان المفاهيمي للعمل الفني: "أفق كوفي"',
    assetType: 'concept',
    assetTypeEn: 'Exhibition Wall Plaque & Catalogue Entry',
    assetTypeAr: 'لوحة جدارية تعريفية ومدخل الكتالوج',
    artistEn: 'Youssef Nabhan',
    artistAr: 'يوسف نبهان',
    isTakreem: true,
    sourceLang: 'ar',
    sourceLangLabelEn: 'Arabic Original (Artist Statement)',
    sourceLangLabelAr: 'الأصل العربي (بيان الفنان)',
    stage: 'catalogue_ready',
    statusTagEn: 'Catalogue Ready',
    statusTagAr: 'جاهز للكتالوج',
    statusColor: 'success',
    wordCount: 420,
    publicationTargetEn: 'Museum Central Atrium Wall Plaque & Vol. 1 Catalogue',
    publicationTargetAr: 'اللوحة الجدارية بالبهو الرئيسي وكتالوج المجلد الأول',
    arabicMasterLocked: true,
    arabicAssignedToEn: 'Sharjah Directorate Curatorial Committee (Approved)',
    arabicAssignedToAr: 'لجنة التقييم والتحكيم الفني بدائرة الثقافة (معتمد)',
    englishAssignedToEn: 'Publication Desk — Print Proof Certified',
    englishAssignedToAr: 'مكتب النشر — مسودة الطباعة معتمدة',
    arabicText: '«يمثل "أفق كوفي" محاورة فراغية ملحمية بين كثافة خام البرونز المصقول ورشاقة السطر الكوفي الهندسي، محولاً الصمت المعماري لبهو المتحف إلى ترنيمة بصرية تحتفي بجذور الحرف ومداه المستقبلي.»',
    englishText: '"\'Kufic Horizon\' embodies an epic spatial dialogue between the enduring weight of patinated bronze and the austere elegance of geometric Kufic script, transforming the architectural quietude of the museum atrium into a visual hymn."',
    editorialNotesEn: 'Certified Complete: Both Arabic master and curated English translation have passed editorial scrutiny, tone matching, and typographic proofing for offset print.',
    editorialNotesAr: 'مكتمل ومعتمد: اجتاز النصان العربي الأم والمترجم الإنجليزي كافة مراحل التدقيق والتحرير ومطابقة التخطيط الطباعي للنشر الرسمي.',
    lastUpdated: '15 Sep 2026',
  }
];

export const EditorialPipeline: React.FC = () => {
  const { lang, formatNumber, localizeDigits } = useI18n();
  const { selectedProgramme } = useWorkspace();
  const isAr = lang === 'ar';

  const [activeBoardView, setActiveBoardView] = useState<'catalogue' | 'assets'>('catalogue');
  const [catalogueItems, setCatalogueItems] = useState<EditorialItem[]>(EDITORIAL_ITEMS);
  const [showLabelPrintView, setShowLabelPrintView] = useState(false);
  const [assets, setAssets] = useState<TextAsset[]>(INITIAL_ASSETS);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(INITIAL_ASSETS[0].id);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showRuleDetails, setShowRuleDetails] = useState<boolean>(true);

  const selectedAsset = assets.find(a => a.id === selectedAssetId) || assets[0];

  const handleApproveArabicMaster = (id: string) => {
    setCatalogueItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'pending_english_translation' as EditorialStatus } : item
    ));
  };

  const handleSubmitEnglishTranslation = (id: string) => {
    setCatalogueItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'ready_for_print' as EditorialStatus } : item
    ));
  };

  // Pipeline columns definition
  const columns: { id: PipelineStage; titleEn: string; titleAr: string; subtitleEn: string; subtitleAr: string; stepNumber: number }[] = [
    {
      id: 'source_intake',
      stepNumber: 1,
      titleEn: 'Source Intake',
      titleAr: 'استلام الأصل',
      subtitleEn: 'Artist text submission & language intake',
      subtitleAr: 'استلام نصوص الفنان وتحديد لغة المصدر',
    },
    {
      id: 'arabic_finalization',
      stepNumber: 2,
      titleEn: 'Arabic Finalization',
      titleAr: 'اعتماد الأصل العربي',
      subtitleEn: 'Translating (if foreign) or Proofreading (if Arabic)',
      subtitleAr: 'ترجمة للعربية أو تدقيق لغوي للأصل العربي',
    },
    {
      id: 'english_translation',
      stepNumber: 3,
      titleEn: 'English Translation Gate',
      titleAr: 'الترجمة الإنجليزية المقيدة',
      subtitleEn: 'Triggered ONLY after Arabic master sign-off',
      subtitleAr: 'مشروطة حصرياً باعتماد النص العربي الأم',
    },
    {
      id: 'catalogue_ready',
      stepNumber: 4,
      titleEn: 'Catalogue Ready',
      titleAr: 'جاهز للنشر والكتالوج',
      subtitleEn: 'Print layout verified & typography proofed',
      subtitleAr: 'معتمد للمطبعة وللشاشات الجدارية التوثيقية',
    }
  ];

  // Advance stage action handler
  const handleAdvanceStage = (assetId: string) => {
    setAssets(prev => prev.map(item => {
      if (item.id !== assetId) return item;
      
      if (item.stage === 'arabic_finalization') {
        return {
          ...item,
          stage: 'english_translation',
          arabicMasterLocked: true,
          statusTagEn: 'In English Translation',
          statusTagAr: 'قيد الترجمة الإنجليزية',
          statusColor: 'info',
          englishAssignedToEn: 'Dr. Christopher Vance (Curatorial Literary Translator)',
          englishAssignedToAr: 'د. كريستوفر فانس (مترجم الأدب التراثي)',
          englishText: item.englishText.startsWith('[English Translation Locked')
            ? '"Youssef Nabhan (b. 1968) is a master calligrapher and sculptor recognized as one of the seminal innovators redefining the architectural space of Ottoman Thuluth and geometric Kufic scripts..."'
            : item.englishText,
          editorialNotesEn: 'Arabic Master Text certified and signed off by Senior Editor. English translation gate unlocked and in progress.',
          editorialNotesAr: 'تم اعتماد وتثبيت النص العربي الأم من كبير المحررين. تم فتح بوابة الترجمة الإنجليزية وهي قيد التنفيذ حالياً.',
          lastUpdated: 'Just now'
        };
      } else if (item.stage === 'english_translation') {
        return {
          ...item,
          stage: 'catalogue_ready',
          statusTagEn: 'Catalogue Ready',
          statusTagAr: 'جاهز للكتالوج',
          statusColor: 'success',
          editorialNotesEn: 'Bilingual text verified, synchronized, and approved for catalogue publication.',
          editorialNotesAr: 'تمت مطابقة وتدقيق النصين العربي والإنجليزي واعتمادهما للطباعة الرسمية.',
          lastUpdated: 'Just now'
        };
      }
      return item;
    }));
  };

  const filteredAssets = assets.filter(asset => {
    if (filterType !== 'all' && asset.assetType !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = asset.titleEn.toLowerCase().includes(q) ||
        asset.titleAr.toLowerCase().includes(q) ||
        asset.code.toLowerCase().includes(q) ||
        asset.artistEn.toLowerCase().includes(q) ||
        asset.artistAr.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6" id="editorial-translation-pipeline">
      {/* Editorial Institutional Rule Header Banner */}
      <div className="bg-linear-to-r from-sadu-linen via-sadu-sand to-sadu-paper border-2 border-sadu-ochre/70 rounded-lg p-5 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-sadu-ochre" />
              <span>{isAr ? 'دائرة الثقافة بحكومة الشارقة — بروتوكول التحرير والترجمة الرسمي' : 'Sharjah Directorate of Cultural Affairs — Official Editorial & Translation Pipeline'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-editorial font-bold text-sadu-charcoal flex items-center gap-2 flex-wrap">
              <span>{isAr ? 'مسار اعتماد النصوص ونشر الكتالوج المؤسسي' : 'Institutional Editorial & Translation Workflow'}</span>
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-[#FFF9EE] text-[#8C601E] border border-sadu-ochre">
                {isAr ? 'الأصل العربي هو الحاكم' : 'Arabic-First Master Rule'}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-sadu-muted leading-relaxed">
              {isAr
                ? 'القاعدة المؤسسية الملزمة لبينالي الشارقة للخط: اعتماد وتدقيق النص العربي الأم أولاً (عبر الترجمة إذا كان أجنبياً أو التدقيق إذا كان عربياً)، ولا يُفتح مسار الترجمة الإنجليزية إلا بعد الإغلاق النهائي للنص العربي.'
                : 'Mandatory Sharjah Biennial Institutional Rule: Secure and lock the Arabic master text first (via translation if foreign, or proofreading if Arabic). The English translation gate opens ONLY after the Arabic master is finalized.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setShowRuleDetails(!showRuleDetails)}
              className="px-3 py-1.5 text-xs font-bold bg-sadu-linen hover:bg-sadu-sand text-sadu-ink border border-sadu-gold rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 text-sadu-brick" />
              <span>{showRuleDetails ? (isAr ? 'إخفاء تفاصيل المسار' : 'Hide Pipeline Flow') : (isAr ? 'عرض تفاصيل المسار' : 'View Pipeline Flow')}</span>
              {showRuleDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Visual Step-Tracker of Institutional Logic */}
        {showRuleDetails && (
          <div className="mt-5 pt-4 border-t border-sadu-ochre/30 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-sadu-linen rounded border border-sadu-gold/60 text-xs space-y-1">
              <div className="flex items-center justify-between text-sadu-brick font-bold">
                <span>{isAr ? 'المرحلة 1: استلام الأصل' : 'Step 1: Source Intake'}</span>
                <span className="font-mono text-[10px] bg-sadu-sand px-1.5 py-0.5 rounded">01</span>
              </div>
              <p className="text-[11px] text-sadu-muted leading-relaxed">
                {isAr
                  ? 'يقوم الفنان برفع مسودات السيرة أو البيان الفني أو النقوش مع توثيق لغة المصدر الأصلية.'
                  : 'Artist submits monograph bio, concept text, or poetic transcription, tagging original language.'}
              </p>
            </div>

            <div className="p-3 bg-sadu-linen rounded border-2 border-sadu-ochre text-xs space-y-1 relative">
              <div className="flex items-center justify-between text-[#8C601E] font-bold">
                <span>{isAr ? 'المرحلة 2: اعتماد النص العربي' : 'Step 2: Arabic Finalization'}</span>
                <span className="font-mono text-[10px] bg-[#FFF9EE] text-[#8C601E] px-1.5 py-0.5 rounded border border-sadu-ochre">02</span>
              </div>
              <p className="text-[11px] text-sadu-charcoal font-medium leading-relaxed">
                {isAr
                  ? 'إذا كان النص أجنبياً -> يُترجم للعربية أولاً. إذا كان عربياً -> يذهب مباشرة للمحرر اللغوي المعتمد للتدقيق والتثبيت.'
                  : 'If non-Arabic -> routes to Translator for Arabic. If already Arabic -> routes directly to Senior Proofreader.'}
              </p>
            </div>

            <div className="p-3 bg-sadu-linen rounded border border-sadu-gold/60 text-xs space-y-1">
              <div className="flex items-center justify-between text-sadu-ink font-bold">
                <span>{isAr ? 'المرحلة 3: الترجمة الإنجليزية والكتالوج' : 'Step 3: English Translation'}</span>
                <span className="font-mono text-[10px] bg-sadu-sand px-1.5 py-0.5 rounded">03</span>
              </div>
              <p className="text-[11px] text-sadu-muted leading-relaxed">
                {isAr
                  ? 'لا تبدأ الترجمة الإنجليزية إطلاقاً إلا بعد تثبيت النص العربي الأم وإقفاله كمرجع رسمي للكتالوج.'
                  : 'English translation begins ONLY after Arabic master sign-off to prevent catalogue translation discrepancies.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* View Switcher: Catalogue Proofing vs Text Assets */}
      <div className="flex items-center justify-between border-b border-sadu-gold/60 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="tab-editorial-catalogue-proofing"
            onClick={() => setActiveBoardView('catalogue')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md border transition-all flex items-center gap-2 cursor-pointer ${
              activeBoardView === 'catalogue'
                ? 'bg-sadu-brick text-white border-sadu-brick shadow-xs'
                : 'bg-sadu-sand text-sadu-charcoal border-sadu-gold hover:bg-sadu-sand-dark'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isAr ? 'شروحات الدليل والكتالوج (نموذج منير فاطمي)' : 'Exhibition Catalogue Proofing (Mounir Fatmi Blueprint)'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {formatNumber(catalogueItems.length)}
            </span>
          </button>

          <button
            type="button"
            id="tab-editorial-text-assets"
            onClick={() => setActiveBoardView('assets')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md border transition-all flex items-center gap-2 cursor-pointer ${
              activeBoardView === 'assets'
                ? 'bg-sadu-ink text-white border-sadu-ink shadow-xs'
                : 'bg-sadu-sand text-sadu-charcoal border-sadu-gold hover:bg-sadu-sand-dark'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isAr ? 'نصوص المونوغراف والنقوش الشعرية' : 'Curatorial Monograph & Poetry Pipeline'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {formatNumber(assets.length)}
            </span>
          </button>
        </div>

        <span className="text-[11px] text-sadu-muted italic">
          {isAr ? 'استناداً إلى وثيقة «شروحات الدليل (2).docx» المعتمدة من إدارة الشؤون الثقافية' : 'Aligned with official Directorate Catalogue Specification Blueprint'}
        </span>
      </div>

      {/* 3-COLUMN KANBAN BOARD: EXHIBITION CATALOGUE PROOFING */}
      {activeBoardView === 'catalogue' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Arabic Proofing (تدقيق المحرر العربي) */}
            <div className="bg-sadu-sand border border-sadu-gold rounded-lg p-4 flex flex-col justify-between shadow-2xs min-h-[460px]">
              <div>
                <div className="pb-3 border-b border-sadu-gold/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sadu-linen text-sadu-brick border border-sadu-gold/70">
                      01 · ARABIC MASTER
                    </span>
                    <h3 className="font-editorial text-base font-bold text-sadu-charcoal mt-1">
                      {isAr ? 'تدقيق المحرر العربي' : 'Arabic Proofing'}
                    </h3>
                    <p className="text-[11px] text-sadu-muted">
                      {isAr ? 'بانتظار تدقيق وتثبيت النص العربي الأم' : 'Awaiting Arabic master finalization'}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-sadu-charcoal bg-sadu-linen px-2.5 py-1 rounded-full border border-sadu-gold">
                    {formatNumber(catalogueItems.filter(i => i.status === 'pending_arabic_proof').length)}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 mt-4">
                  {catalogueItems.filter(i => i.status === 'pending_arabic_proof').length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-sadu-gold/60 rounded-md bg-sadu-linen/50">
                      <span className="text-xs text-sadu-muted">
                        {isAr ? 'لا توجد أعمال بانتظار التدقيق العربي' : 'No items awaiting Arabic proofing'}
                      </span>
                    </div>
                  ) : (
                    catalogueItems.filter(i => i.status === 'pending_arabic_proof').map(item => (
                      <div
                        key={item.id}
                        className="p-4 rounded-md border border-sadu-gold bg-sadu-paper shadow-2xs space-y-3 text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-sadu-brick text-xs">
                            {item.artistName}
                          </span>
                          <span className="font-mono text-[10px] text-sadu-muted bg-sadu-sand px-1.5 py-0.5 rounded border border-sadu-gold/50">
                            {item.year}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-sadu-charcoal font-editorial">
                            {item.artworkTitleEn}
                          </h4>
                          <h5 className="font-bold text-sm text-sadu-ink font-editorial">
                            {item.artworkTitleAr}
                          </h5>
                        </div>

                        <div className="space-y-1 text-[11px] text-sadu-muted border-t border-sadu-gold/40 pt-2">
                          <div className="flex justify-between">
                            <span className="font-medium text-sadu-charcoal">{isAr ? 'الخامة / الوسيط:' : 'Medium:'}</span>
                            <span>{isAr ? item.mediumAr : item.mediumEn}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-sadu-charcoal">{isAr ? 'الأبعاد / المدة:' : 'Dimensions:'}</span>
                            <span className="font-mono">{item.dimensions}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-sadu-gold/50 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleApproveArabicMaster(item.id)}
                            className="w-full py-1.5 px-3 rounded bg-sadu-brick hover:bg-sadu-brick-dark text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-sadu-gold" />
                            <span>{isAr ? 'اعتماد النص العربي' : 'Approve Arabic Master'}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Column 2: English Translation (الترجمة الإنجليزية) */}
            <div className="bg-sadu-sand border border-sadu-gold rounded-lg p-4 flex flex-col justify-between shadow-2xs min-h-[460px]">
              <div>
                <div className="pb-3 border-b border-sadu-gold/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sadu-linen text-[#8C601E] border border-sadu-ochre/60">
                      02 · GATED TRANSLATION
                    </span>
                    <h3 className="font-editorial text-base font-bold text-sadu-charcoal mt-1">
                      {isAr ? 'الترجمة الإنجليزية' : 'English Translation'}
                    </h3>
                    <p className="text-[11px] text-sadu-muted">
                      {isAr ? 'تُفتح حصرياً بعد اعتماد الأصل العربي' : 'Unlocked only after Arabic master approval'}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-sadu-charcoal bg-sadu-linen px-2.5 py-1 rounded-full border border-sadu-gold">
                    {formatNumber(catalogueItems.filter(i => i.status === 'pending_english_translation').length)}
                  </span>
                </div>

                {/* Institutional Warning Rule Header */}
                <div className="mt-3 p-2.5 rounded bg-[#FFF9EE] border-s-4 rtl:border-s-0 rtl:border-e-4 border-sadu-ochre text-[11px] text-[#8C601E] font-medium leading-relaxed flex items-start gap-2 shadow-2xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-sadu-ochre mt-0.5" />
                  <span>
                    {isAr
                      ? 'القاعدة المؤسسية الملزمة: لا يجوز الشروع في الترجمة الإنجليزية إلا بعد تدقيق واعتماد وتثبيت النص العربي الأم من قِبل المحرر اللغوي.'
                      : 'Institutional Rule: English translation cannot commence until the Arabic master text is proofed and locked by the Editorial Proofreader (المحرر).'}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 mt-3">
                  {catalogueItems.filter(i => i.status === 'pending_english_translation').length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-sadu-gold/60 rounded-md bg-sadu-linen/50">
                      <span className="text-xs text-sadu-muted">
                        {isAr ? 'لا توجد أعمال قيد الترجمة الإنجليزية' : 'No items currently in English translation'}
                      </span>
                    </div>
                  ) : (
                    catalogueItems.filter(i => i.status === 'pending_english_translation').map(item => (
                      <div
                        key={item.id}
                        className="p-4 rounded-md border border-sadu-ochre/60 bg-sadu-paper shadow-2xs space-y-3 text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-sadu-brick text-xs">
                            {item.artistName}
                          </span>
                          <span className="font-mono text-[10px] text-sadu-muted bg-sadu-sand px-1.5 py-0.5 rounded border border-sadu-gold/50">
                            {item.year}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-sadu-charcoal font-editorial">
                            {item.artworkTitleEn}
                          </h4>
                          <h5 className="font-bold text-sm text-sadu-ink font-editorial">
                            {item.artworkTitleAr}
                          </h5>
                        </div>

                        <div className="space-y-1 text-[11px] text-sadu-muted border-t border-sadu-gold/40 pt-2">
                          <div className="flex justify-between">
                            <span className="font-medium text-sadu-charcoal">{isAr ? 'الخامة / الوسيط:' : 'Medium:'}</span>
                            <span>{isAr ? item.mediumAr : item.mediumEn}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-sadu-charcoal">{isAr ? 'الأبعاد / المدة:' : 'Dimensions:'}</span>
                            <span className="font-mono">{item.dimensions}</span>
                          </div>
                        </div>

                        <div className="p-2 bg-sadu-sand/60 rounded border border-sadu-gold/40 text-[10px] text-sadu-sage font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-sadu-sage" />
                          <span>{isAr ? 'النص العربي مدقق ومقفل رسمياً' : 'Arabic master ratified & locked'}</span>
                        </div>

                        <div className="pt-2 border-t border-sadu-gold/50 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleSubmitEnglishTranslation(item.id)}
                            className="w-full py-1.5 px-3 rounded bg-sadu-ink hover:bg-sadu-charcoal text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Languages className="w-3.5 h-3.5 text-sadu-gold" />
                            <span>{isAr ? 'إرسال الترجمة' : 'Submit Translation'}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Column 3: Catalogue Ready (جاهز للطباعة) */}
            <div className="bg-sadu-sand border border-sadu-gold rounded-lg p-4 flex flex-col justify-between shadow-2xs min-h-[460px]">
              <div>
                <div className="pb-3 border-b border-sadu-gold/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sadu-linen text-sadu-sage font-bold border border-sadu-sage">
                      03 · PRINT READY
                    </span>
                    <h3 className="font-editorial text-base font-bold text-sadu-charcoal mt-1">
                      {isAr ? 'جاهز للطباعة' : 'Catalogue Ready'}
                    </h3>
                    <p className="text-[11px] text-sadu-muted">
                      {isAr ? 'بيانات ثنائية اللغة مقفلة لمصمم الكتالوج' : 'Fully bilingual items locked for designer'}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-sadu-charcoal bg-sadu-linen px-2.5 py-1 rounded-full border border-sadu-gold">
                    {formatNumber(catalogueItems.filter(i => i.status === 'ready_for_print').length)}
                  </span>
                </div>

                {/* Primary Action Button: Generate Gallery Labels (PDF) */}
                {catalogueItems.some(i => i.status === 'ready_for_print') && (
                  <button
                    type="button"
                    id="btn-generate-gallery-labels"
                    onClick={() => setShowLabelPrintView(true)}
                    className="w-full mt-3 py-2 px-3 rounded-md bg-sadu-brick hover:bg-sadu-brick-dark text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98"
                    title={isAr ? 'إنشاء بطاقات العرض الجدارية للمتحف (PDF)' : 'Generate Gallery Labels (PDF)'}
                  >
                    <Printer className="w-4 h-4 text-sadu-gold" />
                    <span>{isAr ? 'إنشاء بطاقات العرض الجدارية (PDF)' : 'Generate Gallery Labels (PDF)'}</span>
                  </button>
                )}

                {/* Column Cards */}
                <div className="space-y-3 mt-4">
                  {catalogueItems.filter(i => i.status === 'ready_for_print').length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-sadu-gold/60 rounded-md bg-sadu-linen/50">
                      <span className="text-xs text-sadu-muted">
                        {isAr ? 'لا توجد أعمال معتمدة للطباعة بعد' : 'No items ready for print yet'}
                      </span>
                    </div>
                  ) : (
                    catalogueItems.filter(i => i.status === 'ready_for_print').map(item => (
                      <div
                        key={item.id}
                        className="p-4 rounded-md border border-sadu-sage/60 bg-sadu-paper shadow-2xs space-y-3 text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-sadu-brick text-xs">
                            {item.artistName}
                          </span>
                          <span className="font-mono text-[10px] text-sadu-muted bg-sadu-sand px-1.5 py-0.5 rounded border border-sadu-gold/50">
                            {item.year}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-sadu-charcoal font-editorial">
                            {item.artworkTitleEn}
                          </h4>
                          <h5 className="font-bold text-sm text-sadu-ink font-editorial">
                            {item.artworkTitleAr}
                          </h5>
                        </div>

                        <div className="space-y-1 text-[11px] text-sadu-muted border-t border-sadu-gold/40 pt-2">
                          <div className="flex justify-between">
                            <span className="font-medium text-sadu-charcoal">{isAr ? 'الخامة / الوسيط:' : 'Medium:'}</span>
                            <span>{isAr ? item.mediumAr : item.mediumEn}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-sadu-charcoal">{isAr ? 'الأبعاد / المدة:' : 'Dimensions:'}</span>
                            <span className="font-mono">{item.dimensions}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-sadu-gold/50 flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded bg-sadu-sage/20 border border-sadu-sage text-sadu-ink text-xs font-bold flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-sadu-sage" />
                            <span>{isAr ? 'موثق للطباعة' : 'Verified for Print'}</span>
                          </span>
                          <Lock className="w-3.5 h-3.5 text-sadu-muted" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CURATORIAL TEXT ASSETS & MONOGRAPHS VIEW */}
      {activeBoardView === 'assets' && (
        <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sadu-linen p-3 rounded-lg border border-sadu-gold">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-sadu-muted flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>{isAr ? 'تصفية حسب نوع النص:' : 'Filter Asset Type:'}</span>
          </span>
          {[
            { id: 'all', labelEn: 'All Assets (3)', labelAr: 'كافة النصوص (3)' },
            { id: 'poetry', labelEn: 'Poetry', labelAr: 'النقوش الشعرية' },
            { id: 'bio', labelEn: 'Biographies', labelAr: 'السير الذاتية' },
            { id: 'concept', labelEn: 'Concepts', labelAr: 'البيانات المفاهيمية' },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterType(f.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                filterType === f.id
                  ? 'bg-sadu-ink text-white shadow-2xs'
                  : 'bg-sadu-sand text-sadu-charcoal hover:bg-sadu-sand-dark'
              }`}
            >
              {isAr ? f.labelAr : f.labelEn}
            </button>
          ))}
        </div>

        <div className="relative">
          <input dir="auto"
            type="text"
            placeholder={isAr ? 'بحث بالرمز، العنوان، أو الفنان...' : 'Search by code, title, or artist...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 ps-8 pe-3 py-1.5 text-xs bg-sadu-sand/60 border border-sadu-gold rounded focus:outline-hidden focus:ring-1 focus:ring-sadu-ink text-sadu-charcoal"
          />
          <Search className="w-3.5 h-3.5 text-sadu-muted absolute start-2.5 top-2" />
        </div>
      </div>

      {/* Interactive Kanban Board (4 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map(col => {
          const colAssets = filteredAssets.filter(a => a.stage === col.id);

          return (
            <div 
              key={col.id} 
              className="bg-sadu-linen border border-sadu-gold rounded-lg p-4 flex flex-col justify-between shadow-2xs min-h-[460px]"
            >
              <div>
                {/* Column Header */}
                <div className="pb-3 border-b border-sadu-gold/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sadu-sand text-sadu-ink border border-sadu-gold">
                      {isAr ? `المرحلة ${localizeDigits(col.stepNumber)}` : `STAGE ${col.stepNumber}`}
                    </span>
                    <span className="text-xs font-mono font-bold text-sadu-muted bg-sadu-sand px-2 py-0.5 rounded-full">
                      {formatNumber(colAssets.length)}
                    </span>
                  </div>
                  <h3 className="font-editorial text-base font-bold text-sadu-charcoal mt-1.5">
                    {isAr ? col.titleAr : col.titleEn}
                  </h3>
                  <p className="text-[11px] text-sadu-muted mt-0.5 line-clamp-2">
                    {isAr ? col.subtitleAr : col.subtitleEn}
                  </p>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 mt-3">
                  {colAssets.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-sadu-gold/60 rounded-md bg-sadu-sand/40">
                      <span className="text-xs text-sadu-muted">
                        {isAr ? 'لا توجد نصوص في هذه المرحلة حالياً' : 'No assets currently in this stage'}
                      </span>
                    </div>
                  ) : (
                    colAssets.map(asset => {
                      const isSelected = selectedAssetId === asset.id;

                      return (
                        <div
                          key={asset.id}
                          onClick={() => setSelectedAssetId(asset.id)}
                          className={`p-3.5 rounded-md border text-xs transition-all cursor-pointer space-y-2.5 ${
                            isSelected
                              ? 'bg-sadu-paper border-sadu-ochre shadow-md ring-1 ring-sadu-ochre/60'
                              : 'bg-sadu-sand/60 border-sadu-gold hover:bg-sadu-sand'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-mono text-[10px] font-bold text-sadu-ink">
                              {asset.code}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              asset.statusColor === 'success' ? 'bg-sadu-sage/20 text-sadu-ink border border-sadu-sage' :
                              asset.statusColor === 'info' ? 'bg-sky-50 text-sky-800 border border-sky-300' :
                              'bg-amber-50 text-[#8C601E] border border-amber-300'
                            }`}>
                              {isAr ? asset.statusTagAr : asset.statusTagEn}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-bold text-sadu-charcoal text-xs leading-snug">
                              {isAr ? asset.titleAr : asset.titleEn}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="text-[11px] text-sadu-brick font-semibold">
                                {isAr ? asset.artistAr : asset.artistEn}
                              </span>
                              {asset.isTakreem && (
                                <span 
                                  className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#FFF9EE] text-[#8C601E] border border-sadu-ochre"
                                  title={isAr ? 'تكريم: فنان مكرّم في بينالي الشارقة للخط' : 'Takreem: Honored Artist'}
                                >
                                  <Award className="w-2.5 h-2.5 text-sadu-ochre" />
                                  <span>تكريم</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-2 rounded bg-sadu-linen border border-sadu-gold/50 text-[11px] space-y-1">
                            <div className="flex items-center justify-between text-sadu-muted">
                              <span>{isAr ? 'لغة الأصل:' : 'Source Language:'}</span>
                              <span className="font-bold text-sadu-charcoal">
                                {isAr ? asset.sourceLangLabelAr : asset.sourceLangLabelEn}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-sadu-muted">
                              <span>{isAr ? 'حالة الأصل العربي:' : 'Arabic Master:'}</span>
                              <span className={`font-bold flex items-center gap-1 ${
                                asset.arabicMasterLocked ? 'text-sadu-sage' : 'text-[#8C601E]'
                              }`}>
                                {asset.arabicMasterLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                                {asset.arabicMasterLocked
                                  ? (isAr ? 'معتمد ومقفل' : 'Certified & Locked')
                                  : (isAr ? 'قيد التحرير' : 'In Editorial Review')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-sadu-muted pt-1 border-t border-sadu-gold/40">
                            <span>{formatNumber(asset.wordCount)} {isAr ? 'كلمة' : 'words'}</span>
                            <span className="text-sadu-ink font-semibold">
                              {asset.lastUpdated}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Column Footer Insight */}
              <div className="mt-4 pt-3 border-t border-sadu-gold/40 text-[10px] text-sadu-muted">
                {col.id === 'source_intake' && (isAr ? 'نقطة انطلاق تدفق النصوص من المشاركين' : 'Starting point for participating artist texts')}
                {col.id === 'arabic_finalization' && (isAr ? 'تحرير وتدقيق الأصل العربي هو الأساس' : 'Arabic master must be locked before English begins')}
                {col.id === 'english_translation' && (isAr ? 'الترجمة الأدبية مقيدة بسلامة النص العربي' : 'Literary translation strictly bound to master Arabic')}
                {col.id === 'catalogue_ready' && (isAr ? 'مطابق لمواصفات الطباعة والنشر بدائرة الثقافة' : 'Certified for institutional print & digital catalogue')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Asset Detailed Dossier & Side-by-Side Reviewer */}
      {selectedAsset && (
        <div className="bg-sadu-linen border-2 border-sadu-gold rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-sadu-gold">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-xs font-bold text-sadu-ink bg-sadu-sand px-2 py-0.5 rounded border border-sadu-gold">
                  {selectedAsset.code}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                  selectedAsset.statusColor === 'success' ? 'bg-sadu-sage/20 text-sadu-ink border border-sadu-sage' :
                  selectedAsset.statusColor === 'info' ? 'bg-sky-50 text-sky-800 border border-sky-300' :
                  'bg-amber-50 text-[#8C601E] border border-amber-300'
                }`}>
                  {isAr ? selectedAsset.statusTagAr : selectedAsset.statusTagEn}
                </span>
                {selectedAsset.isTakreem && (
                  <span 
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF9EE] text-[#8C601E] border border-sadu-ochre shadow-2xs"
                    title={isAr ? 'تكريم: فنان مكرّم في بينالي الشارقة للخط' : 'Takreem: Honored Artist in Sharjah Calligraphy Biennial'}
                  >
                    <Award className="w-3 h-3 text-sadu-ochre shrink-0" />
                    <span>تكريم (Honored Artist)</span>
                  </span>
                )}
              </div>
              <h3 className="text-xl font-editorial font-bold text-sadu-charcoal">
                {isAr ? selectedAsset.titleAr : selectedAsset.titleEn}
              </h3>
              <p className="text-xs text-sadu-muted mt-1">
                {isAr ? 'الفنان المشارك:' : 'Artist:'} <strong className="text-sadu-charcoal">{isAr ? selectedAsset.artistAr : selectedAsset.artistEn}</strong> · {isAr ? 'هدف النشر:' : 'Target Publication:'} <span className="font-medium text-sadu-brick">{isAr ? selectedAsset.publicationTargetAr : selectedAsset.publicationTargetEn}</span>
              </p>
            </div>

            {/* Stage Transition Action Gate */}
            <div className="flex items-center gap-2">
              {selectedAsset.stage === 'arabic_finalization' && (
                <button
                  type="button"
                  onClick={() => handleAdvanceStage(selectedAsset.id)}
                  className="px-4 py-2 bg-[#8C601E] hover:bg-[#724D18] text-white text-xs font-bold rounded shadow-xs flex items-center gap-2 cursor-pointer transition-colors active:scale-98"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isAr ? 'اعتماد وإقفال النص العربي -> فتح الترجمة الإنجليزية' : 'Certify Arabic Master -> Unlock English Translation'}</span>
                </button>
              )}

              {selectedAsset.stage === 'english_translation' && (
                <button
                  type="button"
                  onClick={() => handleAdvanceStage(selectedAsset.id)}
                  className="px-4 py-2 bg-sadu-ink hover:bg-sadu-ink-dark text-white text-xs font-bold rounded shadow-xs flex items-center gap-2 cursor-pointer transition-colors active:scale-98"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'اعتماد الترجمة ونقلها للكتالوج (جاهز للطباعة)' : 'Certify English & Send to Catalogue (Print Ready)'}</span>
                </button>
              )}

              {selectedAsset.stage === 'catalogue_ready' && (
                <span className="px-3.5 py-1.5 bg-sadu-sage/20 text-sadu-ink border border-sadu-sage rounded text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sadu-sage" />
                  <span>{isAr ? 'معتمد للنشر النهائي والمطبعة' : 'Certified for Offset Print'}</span>
                </span>
              )}
            </div>
          </div>

          {/* Bilingual Side-by-Side Editor Panels */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Arabic Panel (Master) */}
            <div className="bg-sadu-sand/40 border border-sadu-gold rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-sadu-gold/50">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-sadu-charcoal">
                    {isAr ? 'النص العربي الأم (المرجع الأساسي)' : 'Master Arabic Text (Record of Authority)'}
                  </span>
                  {selectedAsset.arabicMasterLocked ? (
                    <span className="px-1.5 py-0.5 rounded bg-sadu-sage/20 text-sadu-ink text-[10px] font-bold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      {isAr ? 'مقفل ومعتمد' : 'Locked & Certified'}
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-[#8C601E] text-[10px] font-bold flex items-center gap-1">
                      <Unlock className="w-2.5 h-2.5" />
                      {isAr ? 'قيد التدقيق اللغوي' : 'Under Proofreading'}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-sadu-muted">
                  {selectedAsset.arabicAssignedToAr}
                </span>
              </div>

              <div className="p-3 bg-sadu-linen rounded border border-sadu-gold/50 text-xs sm:text-sm font-editorial leading-relaxed text-sadu-charcoal min-h-[120px] whitespace-pre-line">
                {selectedAsset.arabicText}
              </div>

              <div className="text-[11px] text-sadu-muted">
                <strong>{isAr ? 'المسؤول التحريري:' : 'Editorial Desk:'}</strong> {isAr ? selectedAsset.arabicAssignedToAr : selectedAsset.arabicAssignedToEn}
              </div>
            </div>

            {/* English Panel */}
            <div className={`border rounded-md p-4 space-y-3 ${
              selectedAsset.stage === 'arabic_finalization'
                ? 'bg-amber-50/40 border-amber-200'
                : 'bg-sadu-sand/40 border-sadu-gold'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-sadu-gold/50">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-sadu-charcoal">
                    {isAr ? 'الترجمة الإنجليزية للكتالوج' : 'Official Catalogue English Translation'}
                  </span>
                  {selectedAsset.stage === 'arabic_finalization' ? (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-[#8C601E] text-[10px] font-bold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      {isAr ? 'مقفل بانتظار العربية' : 'Gated on Arabic'}
                    </span>
                  ) : selectedAsset.stage === 'catalogue_ready' ? (
                    <span className="px-1.5 py-0.5 rounded bg-sadu-sage/20 text-sadu-ink text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {isAr ? 'معتمد' : 'Certified'}
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold flex items-center gap-1">
                      <PenTool className="w-2.5 h-2.5" />
                      {isAr ? 'قيد الترجمة' : 'In Translation'}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-sadu-muted">
                  {selectedAsset.englishAssignedToEn}
                </span>
              </div>

              <div className={`p-3 rounded border text-xs sm:text-sm font-sans leading-relaxed min-h-[120px] whitespace-pre-line ${
                selectedAsset.stage === 'arabic_finalization'
                  ? 'bg-amber-50 text-amber-900 border-amber-200 italic font-mono text-xs'
                  : 'bg-sadu-linen text-sadu-charcoal border-sadu-gold/50 font-serif'
              }`}>
                {selectedAsset.englishText}
              </div>

              <div className="text-[11px] text-sadu-muted">
                <strong>{isAr ? 'مترجم الكتالوج:' : 'Curatorial Translator:'}</strong> {isAr ? selectedAsset.englishAssignedToAr : selectedAsset.englishAssignedToEn}
              </div>
            </div>
          </div>

          {/* Institutional Audit Notes & Provenance */}
          <div className="p-3.5 bg-sadu-sand rounded-md border border-sadu-gold text-xs space-y-1">
            <span className="font-bold text-sadu-ink block">
              {isAr ? 'سجل التدقيق اللغوي والامتثال المؤسسي:' : 'Institutional Editorial Audit & Compliance Notes:'}
            </span>
            <p className="text-sadu-charcoal leading-relaxed text-[11px]">
              {isAr ? selectedAsset.editorialNotesAr : selectedAsset.editorialNotesEn}
            </p>
          </div>
        </div>
      )}
        </div>
      )}

      {/* Gallery Wall Label Print View Modal (PDF Engine) */}
      {showLabelPrintView && (
        <GalleryLabelPrintView
          items={catalogueItems}
          selectedProgramme={selectedProgramme}
          onClose={() => setShowLabelPrintView(false)}
        />
      )}
    </div>
  );
};
