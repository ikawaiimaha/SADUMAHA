import React, { useState } from 'react';
import { Language, ExhibitionProgramme } from '../types';
import { INSTITUTIONAL_INFO, PROGRAMMES, ARTWORKS } from '../data/mockData';
import { useI18n } from '../context/I18nContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  Building, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Wrench, 
  Truck, 
  FileSignature, 
  Layers, 
  Sparkles, 
  Sliders, 
  ArrowRight, 
  X, 
  FileText, 
  Lock, 
  Scale, 
  HeartHandshake, 
  ScrollText, 
  BookOpen,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

export interface LeadershipPersonaSuiteProps {
  lang?: Language;
  selectedProgramme?: ExhibitionProgramme;
  onNavigateTab?: (tab: any) => void;
}

type PersonaTab = 'visionary' | 'executive' | 'director';

export const LeadershipPersonaSuite: React.FC<LeadershipPersonaSuiteProps> = (props) => {
  const i18n = useI18n();
  const workspace = useWorkspace();

  const lang = props.lang ?? i18n.lang;
  const isAr = lang === 'ar';
  const { formatNumber, formatPercent, formatRatio, formatCurrency, localizeDigits } = i18n;
  const selectedProgramme = props.selectedProgramme ?? workspace.selectedProgramme;
  const onNavigateTab = props.onNavigateTab ?? workspace.navigateTab;

  const [activePersona, setActivePersona] = useState<PersonaTab>('executive');
  
  // State for Director's Ripple Effect Simulator
  const [delayDays, setDelayDays] = useState<number>(4);
  const [mitigationApplied, setMitigationApplied] = useState<boolean>(false);

  // State for Executive's Anti-Bypass Simulator
  const [bypassStatus, setBypassStatus] = useState<'idle' | 'testing' | 'blocked'>('idle');

  // Calculations for Director's Ripple Effect Simulator
  const effectiveDelay = mitigationApplied ? Math.max(0, delayDays - 3) : delayDays;
  const installationStagingDelay = Math.round(effectiveDelay * 0.8);
  const demurrageVarianceAed = effectiveDelay * 1400;
  const isReceptionAtRisk = effectiveDelay >= 5;

  return (
    <div className="space-y-6">
      {/* Persona Selection Header */}
      <div className="bg-sadu-linen border-2 border-sadu-gold rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-sadu-gold/50">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-1">
              <Scale className="w-4 h-4" />
              <span>{isAr ? 'محاكاة التقييم المؤسسي متعدد المستويات' : 'Multi-Tier Institutional Persona Evaluation'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'منظار قيادة الشارقة: ثلاثة مستويات للتحقق والتقييم' : 'Sharjah Leadership Lens: 3 Perspectives of Authority'}
            </h2>
            <p className="text-xs sm:text-sm text-sadu-muted mt-1">
              {isAr
                ? 'اختبار واجهة سدو وتماسك بياناتها من منظور الراعي المؤسسي، الرئيس التنفيذي للحوكمة، ومدير إدارة الشؤون الثقافية.'
                : 'Evaluate SADU UX, data hierarchy, and authority chains through the specific lenses of the Visionary Sponsor, Governance Chairman, and Portfolio Director.'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] bg-sadu-sand px-3 py-1.5 rounded-md border border-sadu-gold self-start md:self-auto">
            <span className="font-bold text-sadu-ink">M01/M02 Audit Standard</span>
            <span className="text-sadu-muted">·</span>
            <span className="text-sadu-brick font-semibold">100% Attributable</span>
          </div>
        </div>

        {/* Persona Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          {/* Persona 1: The Visionary */}
          <button
            onClick={() => setActivePersona('visionary')}
            className={`p-3.5 rounded-lg border text-left rtl:text-right transition-all cursor-pointer flex flex-col justify-between min-h-[160px] ${
              activePersona === 'visionary'
                ? 'bg-sadu-ink text-white border-sadu-ink shadow-md ring-2 ring-sadu-brick/30'
                : 'bg-sadu-sand text-sadu-charcoal border-sadu-gold hover:bg-sadu-sand/80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                  activePersona === 'visionary' ? 'bg-amber-300/20 text-amber-200' : 'bg-sadu-gold/40 text-sadu-ink'
                }`}>
                  {isAr ? 'الراعي المؤسسي (الرؤية الكبرى)' : 'Macro-Level / Visionary'}
                </span>
                <ScrollText className={`w-4 h-4 ${activePersona === 'visionary' ? 'text-amber-300' : 'text-sadu-brick'}`} />
              </div>
              <div className="font-bold text-sm">
                {isAr ? 'صاحب السمو حاكم الشارقة' : 'H.H. The Visionary Sponsor'}
              </div>
            </div>
            <div className={`text-[11px] mt-2 line-clamp-3 leading-relaxed ${
              activePersona === 'visionary' ? 'text-white/80' : 'text-sadu-muted'
            }`}>
              {isAr ? 'أصالة اللغة العربية، صون الإرث، وكرامة الفنان والممارسة الحية' : 'Heritage permanence, Arabic primacy, and artist dignity over generic tech slop'}
            </div>
          </button>

          {/* Persona 2: The Governance Executive */}
          <button
            onClick={() => setActivePersona('executive')}
            className={`p-3.5 rounded-lg border text-left rtl:text-right transition-all cursor-pointer flex flex-col justify-between min-h-[160px] ${
              activePersona === 'executive'
                ? 'bg-sadu-ink text-white border-sadu-ink shadow-md ring-2 ring-sadu-brick/30'
                : 'bg-sadu-sand text-sadu-charcoal border-sadu-gold hover:bg-sadu-sand/80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                  activePersona === 'executive' ? 'bg-amber-300/20 text-amber-200' : 'bg-sadu-gold/40 text-sadu-ink'
                }`}>
                  {isAr ? 'رئيس الدائرة (المستوى الاستراتيجي)' : 'Strategic Level / Chairman'}
                </span>
                <ShieldCheck className={`w-4 h-4 ${activePersona === 'executive' ? 'text-amber-300' : 'text-sadu-ink'}`} />
              </div>
              <div className="font-bold text-sm">
                {isAr ? INSTITUTIONAL_INFO.chairmanAr : INSTITUTIONAL_INFO.chairmanEn}
              </div>
            </div>
            <div className={`text-[11px] mt-2 line-clamp-3 leading-relaxed ${
              activePersona === 'executive' ? 'text-white/80' : 'text-sadu-muted'
            }`}>
              {isAr ? 'سلاسل الصلاحية النظامية (AG-01)، مصفوفة التفويض، والرقابة المالية' : 'Statutory delegation matrix, budget commitments, and bypass prevention'}
            </div>
          </button>

          {/* Persona 3: The Portfolio Director */}
          <button
            onClick={() => setActivePersona('director')}
            className={`p-3.5 rounded-lg border text-left rtl:text-right transition-all cursor-pointer flex flex-col justify-between min-h-[160px] ${
              activePersona === 'director'
                ? 'bg-sadu-ink text-white border-sadu-ink shadow-md ring-2 ring-sadu-brick/30'
                : 'bg-sadu-sand text-sadu-charcoal border-sadu-gold hover:bg-sadu-sand/80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                  activePersona === 'director' ? 'bg-amber-300/20 text-amber-200' : 'bg-sadu-gold/40 text-sadu-ink'
                }`}>
                  {isAr ? 'مدير الإدارة (المستوى العملياتي)' : 'Operational / Portfolio Director'}
                </span>
                <Wrench className={`w-4 h-4 ${activePersona === 'director' ? 'text-amber-300' : 'text-sadu-brick'}`} />
              </div>
              <div className="font-bold text-sm">
                {isAr ? INSTITUTIONAL_INFO.directorAr : INSTITUTIONAL_INFO.directorEn}
              </div>
            </div>
            <div className={`text-[11px] mt-2 line-clamp-3 leading-relaxed ${
              activePersona === 'director' ? 'text-white/80' : 'text-sadu-muted'
            }`}>
              {isAr ? 'تزامن المسارات (شحن، تثبيت، عقود) ومحاكاة أثر المعوقات' : 'Parallel workstreams, 120kg sculpture plinth blocker, and ripple effect simulation'}
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PERSONA 1: THE VISIONARY SPONSOR (H.H. Sheikh Dr. Sultan) */}
      {/* ========================================================================= */}
      {activePersona === 'visionary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Persona Mission Card */}
          <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-md bg-amber-100 text-amber-900 shrink-0">
                <ScrollText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-editorial text-lg font-bold text-sadu-charcoal">
                    {isAr ? 'معيار الرعاية المؤسسية: بناء مؤسسات تدوم وتكرّم الإبداع الإنساني' : 'The Visionary Mandate: Enduring Institutions & Human Creativity'}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-sadu-charcoal leading-relaxed">
                  {isAr
                    ? 'لا يُقاس نجاح سدو بالكفاءة الرقمية وحدها، بل بمدى تمثيله لهيبة الشارقة الثقافية، وتكريمه لكرامة الفنان، وجعل اللغة العربية لغة تأسيسية سيادية تعبر عن فنوننا الإسلامية والمعاصرة دون خضوع للقوالب التقنية المستوردة.'
                    : 'SADU is measured not by Silicon Valley efficiency metrics, but by how faithfully it upholds Sharjah\'s cultural dignity, honors the living artist\'s practice, and treats the Arabic language as an authoritative, civilizational foundation.'}
                </p>
              </div>
            </div>

            {/* Critique & Constructive Feedback Box */}
            <div className="mt-5 p-4 bg-sadu-sand rounded-md border-l-4 rtl:border-l-0 rtl:border-r-4 border-sadu-brick">
              <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>{isAr ? 'التقييم النقدي والتوجيه البناء للراعي المؤسسي' : 'Visionary Sponsor Critique & Constructive Guidance'}</span>
              </div>
              <blockquote className="text-xs text-sadu-charcoal leading-relaxed italic">
                {isAr
                  ? '«إن تجنب التدرجات اللونية المصطنعة واعتماد ألوان الكتان والنيلة ونسيج السدو يُعد خطوة موفقة في ترسيخ الهوية. ومع ذلك، يجب ألا يُختزل الفنان في رمز تسلسلي أو وحدة تخزين تجارية (SKU). احرصوا على إبراز السيرة الفكرية للمبدع وبيان نواياه الجمالية في صدارة كل ملف، واضمنوا أن يكون الأرشيف السيادي سجلاً معرفياً خالداً يوثق مسيرة الخط العربي وفنونه للأجيال القادمة، وليس مجرد مستودع مؤقت ينتهي بانتهاء المعرض.»'
                  : '"The deliberate rejection of generic SaaS gradients in favor of desert earth, indigo soot, and Sadu weave motifs correctly grounds our heritage. However, the system must never reduce living masters to commercial SKUs or asset IDs. The artist\'s intellectual statement and lineage must receive visual primacy before engineering parameters. Ensure the Sovereign Archive is sealed as a century-long cultural record for future scholars, rather than a transient operational depot."'}
              </blockquote>
            </div>
          </div>

          {/* Three Pillars of Institutional Dignity */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Pillar 1: Arabic Primacy */}
            <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-5 shadow-xs flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick mb-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{isAr ? 'أصالة اللغة العربية' : 'Arabic Primacy & Typography'}</span>
                </div>
                <p className="text-xs text-sadu-muted leading-relaxed">
                  {isAr
                    ? 'ليست العربية ترجمة موازية، بل صلب النظام المعجمي: مصطلحات مثل "النطاق المعتمد" و"الأرشيف السيادي" و"محاضر التحكيم" وضعت بصياغة مؤسسية عربية أصيلة.'
                    : 'Arabic is foundational, not machine-translated. Native terminology (e.g. Approved Scope, Sovereign Archive, Jury Ledger) replaces imported tech jargon.'}
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-sadu-gold/40 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-sadu-sage">✓ Native RTL Typography</span>
                <span className="font-mono text-sadu-ink">100% Audited</span>
              </div>
            </div>

            {/* Pillar 2: Artist Dignity */}
            <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-5 shadow-xs flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-sadu-ink mb-2">
                  <HeartHandshake className="w-4 h-4" />
                  <span>{isAr ? 'كرامة الفنان وحقوقه' : 'Artist Moral Rights & Dignity'}</span>
                </div>
                <p className="text-xs text-sadu-muted leading-relaxed">
                  {isAr
                    ? 'حماية الحقوق المعنوية للمبدع: صون نسبة العمل، حظر التعديل غير المعتمد، وتوقيع اتفاقيات ثنائية تحفظ كرامة الممارسة الحية وتمنح الفنان نسخاً رسمية معتمدة.'
                    : 'Moral rights safeguards: Unalterable artist attribution, strict scope freeze, and bilateral agreements that honor creative living practice.'}
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-sadu-gold/40 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-sadu-sage">✓ Bilateral Parity</span>
                <span className="font-mono text-sadu-ink">Protected</span>
              </div>
            </div>

            {/* Pillar 3: Century Archival Record */}
            <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-5 shadow-xs flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-sadu-sage mb-2">
                  <Lock className="w-4 h-4" />
                  <span>{isAr ? 'الأرشيف السيادي الممتد' : 'Centurial Archival Custody'}</span>
                </div>
                <p className="text-xs text-sadu-muted leading-relaxed">
                  {isAr
                    ? 'إغلاق المعرض لا يعني شطب بياناته، بل ختمه بحافظة سيادية غير قابلة للتعديل تضمن حفظ سجلات الخطاطين والمقتنيات للأجيال القادمة.'
                    : 'Exhibition closeout permanently seals the cultural ledger. Preserves high-resolution calligraphic documentation and provenance for century-long scholar custody.'}
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-sadu-gold/40 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-sadu-sage">✓ Immutable Seal</span>
                <button
                  onClick={() => onNavigateTab('archive')}
                  className="text-sadu-brick font-bold hover:underline cursor-pointer"
                >
                  {isAr ? 'الأرشيف ←' : 'Archive →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PERSONA 2: THE GOVERNANCE EXECUTIVE (H.E. Abdullah Al Owais) */}
      {/* ========================================================================= */}
      {activePersona === 'executive' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Persona Mission Card */}
          <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-md bg-blue-100 text-blue-900 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-editorial text-lg font-bold text-sadu-charcoal">
                  {isAr ? 'المعايير الاستراتيجية: مصفوفة الصلاحيات، الانضباط المالي، وحظر الالتفاف' : 'Governance Executive Mandate: Statutory Authority & Financial Accountability'}
                </h3>
                <p className="text-xs sm:text-sm text-sadu-charcoal leading-relaxed mt-1">
                  {isAr
                    ? 'بصفته رئيساً لدائرة الثقافة، يُركز سعادة عبدالله العويس على الامتثال التنظيمي، وحظر أي التزام مالي دون تفويض صريح، والتأكد من أن كل مرحلة تعاقدية مسبوقة بختم النطاق المعتمد (Gate AG-01).'
                    : 'Focuses on statutory delegation, HR/delegation compliance, preventing unbudgeted commitments, and ensuring contracts cannot bypass frozen curatorial scope sign-offs.'}
                </p>
              </div>
            </div>

            {/* Critique & Constructive Guidance */}
            <div className="mt-5 p-4 bg-sadu-sand rounded-md border-l-4 rtl:border-l-0 rtl:border-r-4 border-sadu-ink">
              <div className="flex items-center gap-2 text-xs font-bold text-sadu-ink uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>{isAr ? 'تقييم رئيس الدائرة والتوجيه الإداري' : 'Chairman Governance Critique & Audit Guidance'}</span>
              </div>
              <blockquote className="text-xs text-sadu-charcoal leading-relaxed italic">
                {isAr
                  ? '«النظام يُظهر مؤشرات مالية جيدة، ولكن لضمان أعلى درجات النزاهة والحوكمة الرشيدة، يجب أن يتضمن رادار القيادة إثباتاً تقنياً واضحاً لحظر الالتفاف: لا يجوز لأي موظف أو منسق إصدار عقد أو اعتماد صرف دفعة دون محضر تحكيم ممهور ونطاق معتمد مجمد برقم إصدار (v1.2). أريد أن أرى مصفوفة التفويض المالي محددة بسقوف واضحة، مع تنبيه آلي لأي قرار قيادي يتأخر عن 72 ساعة.»'
                  : '"The financial overview is helpful, but governance requires verifiable proof of bypass prevention. A coordinator must never be able to execute a legal contract or release milestone disbursements without a frozen Approved Scope (v1.2) and attributable jury sign-off. Provide an explicit Statutory Delegation Matrix with clear spending thresholds, and an automated escalation clock for decisions pending over 72 hours."'}
              </blockquote>
            </div>
          </div>

          {/* Interactive Anti-Bypass Gate Simulator */}
          <div className="bg-sadu-linen border-2 border-sadu-ink rounded-lg p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sadu-gold/50">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-sadu-ink uppercase tracking-wider">
                  <Lock className="w-4 h-4" />
                  <span>{isAr ? 'اختبار النزاهة: محاكي حظر الالتفاف على الصلاحيات' : 'Integrity Test: Anti-Bypass Gate Enforcement Engine'}</span>
                </div>
                <h4 className="font-bold text-sm text-sadu-charcoal mt-0.5">
                  {isAr ? 'محاولة تجاوز ختم النطاق وإصدار عقد فوري' : 'Attempting to Bypass Curatorial Freeze to Generate Contract'}
                </h4>
              </div>

              <button
                onClick={() => {
                  setBypassStatus('testing');
                  setTimeout(() => setBypassStatus('blocked'), 600);
                }}
                disabled={bypassStatus === 'testing'}
                className="px-3.5 py-1.5 bg-sadu-brick hover:bg-sadu-brick-dark text-white text-xs font-bold rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {isAr ? '⚡ اختبار محاولة الالتفاف' : '⚡ Simulate Bypass Attempt'}
              </button>
            </div>

            {bypassStatus === 'idle' && (
              <p className="text-xs text-sadu-muted mt-3">
                {isAr
                  ? 'اضغط على زر الاختبار أعلاه للتحقق مما إذا كان بإمكان منسق المعرض تجاوز مرحلة التحكيم وختم النطاق لإبرام عقد أو صرف دفعة.'
                  : 'Click the test button to simulate whether a coordinator can bypass curatorial jury consensus and generate an enforceable legal agreement directly.'}
              </p>
            )}

            {bypassStatus === 'testing' && (
              <div className="py-4 text-center text-xs text-sadu-ink font-semibold animate-pulse">
                {isAr ? 'جاري فحص مسار الاعتماد وسلسلة التفويض النظامي...' : 'Verifying statutory delegation chain and gate prerequisites...'}
              </div>
            )}

            {bypassStatus === 'blocked' && (
              <div className="mt-3 p-3.5 bg-red-50 border border-red-200 rounded-md text-xs space-y-2 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-700" />
                    {isAr ? 'تم الحظر آلياً بموجب المادة AG-01 / C-01' : 'Enforcement Blocked: Statutory Rule AG-01 / C-01 Triggered'}
                  </span>
                  <span className="font-mono text-[10px] bg-red-200 text-red-900 px-2 py-0.5 rounded font-bold">
                    ERR_SCOPE_NOT_FROZEN
                  </span>
                </div>
                <p className="text-red-800 leading-relaxed">
                  {isAr
                    ? 'النظام رفض العملية رفضاً قاطعاً: لا يمكن توليد مسودة العقد القانوني أو إرسالها للفنان قبل اعتماد محضر اللجنة الموحد، وتجميد النطاق بإصدار رسمي مرقم (Approved Scope v1.2)، ومصادقة سعادة مدير إدارة الشؤون الثقافية.'
                    : 'SADU mathematically blocked the operation. Contracts cannot be drafted or issued without a verified Jury Ledger, an immutable Approved Scope revision (v1.2), and digital sign-off from the Director of Cultural Affairs.'}
                </p>
                <div className="pt-2 border-t border-red-200 flex items-center justify-between text-[11px] text-red-900">
                  <span>{isAr ? 'تم تسجيل المحاولة في سجل التدقيق الرقمي للأمانة' : 'Attempt logged to permanent executive audit trail'}</span>
                  <button 
                    onClick={() => setBypassStatus('idle')}
                    className="font-bold underline hover:text-red-950 cursor-pointer"
                  >
                    {isAr ? 'إعادة التعيين' : 'Reset Simulator'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Statutory Delegation Matrix Table */}
          <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-sadu-charcoal">
                {isAr ? 'مصفوفة الصلاحيات والتفويض المالي المعتمدة (دائرة الثقافة)' : 'Statutory Authority & Financial Delegation Matrix'}
              </h4>
              <span className="text-[11px] text-sadu-muted">Decree No. 14/2025</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left rtl:text-right border-collapse">
                <thead>
                  <tr className="bg-sadu-ink text-white">
                    <th className="p-2.5 font-semibold">{isAr ? 'المستوى الوظيفي' : 'Statutory Role'}</th>
                    <th className="p-2.5 font-semibold">{isAr ? 'سقف الالتزام المالي' : 'Spending Authority Limit'}</th>
                    <th className="p-2.5 font-semibold">{isAr ? 'صلاحية العقود' : 'Contract Execution'}</th>
                    <th className="p-2.5 font-semibold">{isAr ? 'بوابة الاعتماد' : 'Primary Gate'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sadu-gold/40 text-sadu-charcoal">
                  <tr className="bg-sadu-linen">
                    <td className="p-2.5 font-bold">
                      {isAr ? 'سعادة رئيس الدائرة' : 'Chairman of Culture'}
                    </td>
                    <td className="p-2.5 font-mono font-semibold text-sadu-brick">
                      &gt; {formatNumber(250000)} {isAr ? 'درهم' : 'AED'}
                    </td>
                    <td className="p-2.5 text-sadu-sage font-semibold">
                      {isAr ? 'العقود الاستراتيجية والبرامج الكبرى' : 'Strategic Portfolio Execution'}
                    </td>
                    <td className="p-2.5 font-mono text-[11px]">Gate AG-01 / AG-04</td>
                  </tr>
                  <tr className="bg-sadu-sand/50">
                    <td className="p-2.5 font-bold">
                      {isAr ? 'مدير إدارة الشؤون الثقافية' : 'Director of Cultural Affairs'}
                    </td>
                    <td className="p-2.5 font-mono font-semibold text-sadu-ink">
                      {isAr ? `حتى ${formatNumber(250000)} درهم` : 'Up to 250,000 AED'}
                    </td>
                    <td className="p-2.5 text-sadu-charcoal">
                      {isAr ? 'عقود الفنانين والإنتاج واللوجستيات' : 'Bilateral Artist & Production Deals'}
                    </td>
                    <td className="p-2.5 font-mono text-[11px]">Gate C-01 / OPS-02</td>
                  </tr>
                  <tr className="bg-sadu-linen">
                    <td className="p-2.5 font-bold">
                      {isAr ? 'لجنة الاختيار والتحكيم' : 'Curatorial Jury'}
                    </td>
                    <td className="p-2.5 text-sadu-muted">
                      {isAr ? 'لا صلاحية مالية مباشرة' : 'No Financial Authority'}
                    </td>
                    <td className="p-2.5 text-sadu-muted">
                      {isAr ? 'اعتماد فني وتقييمي حصراً' : 'Curatorial Ranking Only'}
                    </td>
                    <td className="p-2.5 font-mono text-[11px]">Gate JURY-01 / JURY-02</td>
                  </tr>
                  <tr className="bg-sadu-sand/50">
                    <td className="p-2.5 font-bold">
                      {isAr ? 'منسق المعرض (غرفة التحكم)' : 'Exhibition Coordinator'}
                    </td>
                    <td className="p-2.5 text-sadu-muted">
                      {isAr ? 'متابعة وإشراف فقط' : 'Operational Tracking Only'}
                    </td>
                    <td className="p-2.5 text-red-800 font-semibold">
                      {isAr ? 'حظر توقيع العقود أو التعديل' : 'Strictly Prohibited from Signing'}
                    </td>
                    <td className="p-2.5 font-mono text-[11px]">Control Room Desk</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PERSONA 3: THE PORTFOLIO DIRECTOR (Mohammed Ibrahim Al Qaseer) */}
      {/* ========================================================================= */}
      {activePersona === 'director' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Persona Mission Card */}
          <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-md bg-amber-100 text-amber-900 shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-editorial text-lg font-bold text-sadu-charcoal">
                  {isAr ? 'المعايير العملياتية: تزامن المسارات، المعوقات الميدانية، ومحاكاة سلاسل الأثر' : 'Portfolio Director Mandate: Parallel Workstreams & Ripple Effect Resolution'}
                </h3>
                <p className="text-xs sm:text-sm text-sadu-charcoal leading-relaxed mt-1">
                  {isAr
                    ? 'يشرف الأستاذ محمد القصير على تسليم المهرجانات والبيناليات على أرض الواقع، حيث تتداخل مسارات التعاقد والشحن ومعاينة الأحمال الإنشائية، وتتطلب معرفة أثر أي تأخير في عمل نحتي على افتتاح المعرض.'
                    : 'Oversees on-the-ground festival delivery across parallel workstreams. Daily operational focus is preventing bottlenecks like the 120kg sculpture load check from cascading into freight demurrage or opening night crises.'}
                </p>
              </div>
            </div>

            {/* Critique & Guidance */}
            <div className="mt-5 p-4 bg-sadu-sand rounded-md border-l-4 rtl:border-l-0 rtl:border-r-4 border-sadu-brick">
              <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-1">
                <Wrench className="w-4 h-4" />
                <span>{isAr ? 'تقييم مدير إدارة الشؤون الثقافية والتوجيه العملياتي' : 'Portfolio Director Operational Critique & Guidance'}</span>
              </div>
              <blockquote className="text-xs text-sadu-charcoal leading-relaxed italic">
                {isAr
                  ? '«عندما يُبلغني الفريق الفني بأن العمل النحتي البرونزي (أفق كوفي — حمولة 120 كجم/م²) يتطلب صفائح فولاذية لحماية أرضية متحف الشارقة للفنون، لا تكفيني بطاقة تنبيه ساكنة. أحتاج إلى محاكاة فورية: هل تأخر فحص المهندس 4 أيام سيؤخر فنيي الإضاءة المعلقة؟ وهل سيتسبب في غرامات أرضيات للشحنات بالميناء؟ زوّدوا النظام بمحاكي تفاعلي لسلاسل الأثر يربط البوابات الهندسية بالافتتاح الرسمي والميزانية الطارئة.»'
                  : '"A static badge stating an engineering hold on the 120kg bronze sculpture plinth is insufficient. When managing simultaneous festivals, I must see the ripple effect dynamically: Does a 4-day structural hold delay the overhead lighting truss? Will it breach container demurrage at Sharjah Port? Give me an interactive visual dependency map linking technical sign-offs directly to staging schedules and the opening gala."'}
              </blockquote>
            </div>
          </div>

          {/* Real-Time Interactive Ripple Effect Simulator */}
          <div className="bg-sadu-linen border-2 border-sadu-brick rounded-lg p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sadu-gold/50">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider">
                  <Sliders className="w-4 h-4" />
                  <span>{isAr ? 'محاكي سلاسل الأثر العملياتية (تأخير حمولة العمل النحتي)' : 'Live Operational Ripple Effect Simulator: 120kg Sculpture Load Check'}</span>
                </div>
                <h4 className="font-bold text-sm text-sadu-charcoal mt-0.5">
                  {isAr 
                    ? 'العمل #2: أفق كوفي (يوسف نبهان) — متحف الشارقة للفنون، القاعة 3'
                    : 'Work #2: Kufic Horizon by Youssef Nabhan — Sharjah Art Museum Hall 3'}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMitigationApplied(!mitigationApplied)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-all cursor-pointer ${
                    mitigationApplied
                      ? 'bg-sadu-sage text-white border-sadu-sage'
                      : 'bg-sadu-sand text-sadu-ink border-sadu-gold hover:bg-sadu-sand/80'
                  }`}
                >
                  {mitigationApplied 
                    ? (isAr ? '✓ تم تطبيق التدخل الميداني (صفائح توزيع)' : '✓ Mitigation Applied: Steel Dispersion Plates') 
                    : (isAr ? 'تطبيق خطة التدارك الميدانية' : 'Apply Fast-Track Mitigation')}
                </button>
              </div>
            </div>

            {/* Interactive Slider Control */}
            <div className="mt-4 p-4 bg-sadu-sand rounded-md border border-sadu-gold">
              <div className="flex items-center justify-between text-xs font-bold text-sadu-charcoal mb-2">
                <span>{isAr ? 'محاكاة تأخر تقرير المهندس الإنشائي:' : 'Simulate Chief Engineer Load Certification Delay:'}</span>
                <span className="font-mono text-sm text-sadu-brick bg-sadu-linen px-2 py-0.5 rounded border border-sadu-gold">
                  +{formatNumber(delayDays)} {isAr ? 'أيام' : 'days'}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="10"
                value={delayDays}
                onChange={(e) => setDelayDays(parseInt(e.target.value))}
                className="w-full h-2 bg-sadu-gold rounded-lg appearance-none cursor-pointer accent-sadu-brick"
              />

              <div className="flex justify-between text-[10px] text-sadu-muted mt-1 font-mono">
                <span>{isAr ? `${formatNumber(0)} أيام (منضبط)` : '0d (On Track)'}</span>
                <span>{isAr ? `${formatNumber(3)} أيام (متوسط)` : '3d (Moderate)'}</span>
                <span>{isAr ? `${formatNumber(6)} أيام (مرتفع)` : '6d (High Risk)'}</span>
                <span>{isAr ? `${formatNumber(10)} أيام (حرج)` : '10d (Critical Breach)'}</span>
              </div>
            </div>

            {/* Ripple Effect Telemetry Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {/* Cascade 1: Lighting Rig Staging */}
              <div className="p-3.5 bg-sadu-linen rounded-md border border-sadu-gold text-xs">
                <span className="text-sadu-muted block text-[11px] mb-1">
                  {isAr ? 'تأخر تجهيز عوارض الإضاءة' : 'Overhead Lighting Rig Impact'}
                </span>
                <span className="text-base font-bold font-mono text-sadu-ink block">
                  +{formatNumber(installationStagingDelay)} {isAr ? 'أيام تأخير' : 'days cascade'}
                </span>
                <span className="text-[10px] text-sadu-muted block mt-1">
                  {installationStagingDelay > 0 
                    ? (isAr ? 'لا يمكن صعود الرافعة قبل فحص بلاط القاعة' : 'Scissors lift barred until floor bearing certified')
                    : (isAr ? 'المسار متزامن' : 'Schedule on track')}
                </span>
              </div>

              {/* Cascade 2: Demurrage & Staging Cost */}
              <div className="p-3.5 bg-sadu-linen rounded-md border border-sadu-gold text-xs">
                <span className="text-sadu-muted block text-[11px] mb-1">
                  {isAr ? 'رسوم التخزين والشحن الطارئة' : 'Freight Staging Variance'}
                </span>
                <span className="text-base font-bold font-mono text-sadu-brick block">
                  +{formatNumber(demurrageVarianceAed)} {isAr ? 'درهم' : 'AED'}
                </span>
                <span className="text-[10px] text-sadu-muted block mt-1">
                  {effectiveDelay > 0 
                    ? (isAr ? 'رسوم إبقاء الصندوق المبطن في التبريد' : 'Bonded climate-controlled warehouse delay')
                    : (isAr ? 'ضمن الميزانية' : 'Zero variance')}
                </span>
              </div>

              {/* Cascade 3: Opening Gala Readiness */}
              <div className={`p-3.5 rounded-md border text-xs ${
                isReceptionAtRisk 
                  ? 'bg-red-50 border-red-300 text-red-900' 
                  : 'bg-sadu-sage-light/40 border-sadu-sage text-sadu-ink'
              }`}>
                <span className="block text-[11px] font-semibold mb-1">
                  {isAr ? 'جاهزية ليلة الافتتاح الرسمي' : 'VIP Opening Gala Buffer'}
                </span>
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  {isReceptionAtRisk ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
                      <span>{isAr ? `خطر تعارض (أقل من ${formatNumber(48)} ساعة)` : 'CRITICAL (Buffer Lost)'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-sadu-sage shrink-0" />
                      <span>{isAr ? 'آمن (فارق زمني كافٍ)' : 'Safe (72h Buffer Intact)'}</span>
                    </>
                  )}
                </div>
                <span className="text-[10px] block mt-1 opacity-80">
                  {isReceptionAtRisk 
                    ? (isAr ? 'يتطلب موافقة المدير على ساعات العمل الإضافية' : 'Requires Director authorization for overnight shift')
                    : (isAr ? 'لا يوجد خطر مباشر على موعد الافتتاح' : 'Installation finishes 3 days prior to gala')}
                </span>
              </div>
            </div>

            {/* Mitigation Action Footer */}
            <div className="mt-4 pt-3 border-t border-sadu-gold/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-sadu-muted">
                {mitigationApplied
                  ? (isAr ? `✓ خطة التدارك قلصت أثر التأخير بواقع ${formatNumber(3)} أيام بموافقة مدير إدارة الشؤون الثقافية` : '✓ Fast-track mitigation reclaimed 3 days with Director pre-authorization')
                  : (isAr ? `ملاحظة: تفعيل خطة التدارك ينشر صفائح فولاذية ويقلص وقت الفحص ${formatNumber(72)} ساعة` : 'Notice: Activating fast-track mitigation deploys steel plates to compress lead time')}
              </span>
              <button
                onClick={() => onNavigateTab('operations')}
                className="text-xs font-bold text-sadu-brick hover:underline cursor-pointer self-end sm:self-auto"
              >
                {isAr ? 'الانتقال إلى ورقة العمليات الفنية ←' : 'Open Operations Ledger →'}
              </button>
            </div>
          </div>

          {/* Cross-Exhibition Parallel Delivery Workstreams */}
          <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-5 shadow-xs">
            <h4 className="font-bold text-sm text-sadu-charcoal mb-3">
              {isAr ? 'تزامن المسارات عبر المعارض الثلاثة (مهرجان الفنون وبينالي الخط والأرشيف)' : 'Parallel Workstreams Across 3 Simultaneous Cultural Programmes'}
            </h4>

            <div className="space-y-3 text-xs">
              {PROGRAMMES.map((prog) => (
                <div key={prog.id} className="p-3 bg-sadu-sand rounded-md border border-sadu-gold">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <span className="font-bold text-sadu-charcoal text-sm">
                      {isAr ? prog.titleAr : prog.titleEn}
                    </span>
                    <span className="text-[11px] font-mono text-sadu-muted">{localizeDigits(prog.dates)}</span>
                  </div>

                  {/* 4 Workstream Pillars */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-sadu-gold/40 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <FileSignature className="w-3.5 h-3.5 text-sadu-ink" />
                      <span>{isAr ? 'العقود: ' : 'Contracts: '}</span>
                      <span className="font-bold text-sadu-sage">{formatPercent(100)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-sadu-brick" />
                      <span>{isAr ? 'الشحن: ' : 'Freight: '}</span>
                      <span className="font-bold text-sadu-ink">{prog.status === 'concluded' ? 'Cleared' : 'In Transit'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-amber-700" />
                      <span>{isAr ? 'التثبيت: ' : 'Install: '}</span>
                      <span className={`font-bold ${prog.criticalRisks > 0 ? 'text-sadu-brick' : 'text-sadu-sage'}`}>
                        {prog.criticalRisks > 0 ? (isAr ? 'معلق (حمولة)' : 'Hold (Plinth)') : 'Ready'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-sadu-ink" />
                      <span>{isAr ? 'الجاهزية: ' : 'Gates: '}</span>
                      <span className="font-bold font-mono">{formatRatio(prog.gatesReady, prog.gatesTotal)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
