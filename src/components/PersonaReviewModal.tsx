import React, { useState } from 'react';
import { Language } from '../types';
import { INSTITUTIONAL_INFO } from '../data/mockData';
import { useI18n } from '../context/I18nContext';
import { 
  X, 
  ScrollText, 
  ShieldCheck, 
  Wrench, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink,
  Scale,
  Award,
  Lock,
  Compass
} from 'lucide-react';

interface PersonaReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  onOpenLeadershipTab?: () => void;
}

export const PersonaReviewModal: React.FC<PersonaReviewModalProps> = ({
  isOpen,
  onClose,
  lang,
  onOpenLeadershipTab,
}) => {
  const i18n = useI18n();
  const activeLang = lang ?? i18n.lang;
  const isAr = activeLang === 'ar';
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'visionary' | 'executive' | 'director'>('all');

  if (!isOpen) return null;

  const masterReviewText = `SADU (System for Arts Data Unification) — 3-Tier Leadership Persona Review:

1. THE VISIONARY (H.H. Sheikh Dr. Sultan bin Muhammad Al Qasimi):
"The deliberate avoidance of generic Silicon Valley SaaS clichés in favor of desert earth, indigo soot, and authentic Sadu weave motifs correctly grounds our heritage. However, the system must never reduce the sacred creative act of the artist to a commercial SKU or numeric asset code. In curatorial and archival views, the artist's intellectual statement and scholarly lineage must be granted visual primacy before technical dimensions. The Sovereign Archive must serve as an enduring, century-long cultural record for future scholars, not merely a transient post-exhibition database."

2. THE GOVERNANCE EXECUTIVE (H.E. Abdullah Al Owais - Chairman):
"The high-level budget commitments and 94.2% M01 evidence score provide sound strategic oversight. However, statutory compliance requires an explicit Statutory Delegation Matrix with clearly codified spending ceilings. Furthermore, implement an immutable Anti-Bypass Gate that mathematically proves a contract cannot be generated or milestone disbursed without a frozen Approved Scope (v1.2) and attributable jury sign-off. Provide automated 72-hour escalation clocks for pending statutory decisions."

3. THE PORTFOLIO DIRECTOR (Mohammed Ibrahim Al Qaseer - Director of Cultural Affairs):
"Managing simultaneous international festivals requires moving beyond static alerts. For the 120kg bronze sculpture plinth load-bearing hold at Sharjah Art Museum, I require an interactive Ripple Effect Simulator that dynamically calculates downstream impacts on overhead lighting rig staging, customs demurrage at Sharjah Port, and VIP opening gala readiness, linking engineering sign-offs directly to staging schedules."`;

  const handleCopy = () => {
    navigator.clipboard.writeText(masterReviewText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sadu-charcoal/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-sadu-linen border-2 border-sadu-gold rounded-xl max-w-3xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-sadu-charcoal">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-sadu-ink text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-400 text-sadu-charcoal rounded-md">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-editorial text-lg font-bold text-white">
                {isAr ? 'مراجعة وتقييم القيادة المؤسسية لسدو' : 'SADU Multi-Tier Leadership Persona Audit'}
              </h3>
              <p className="text-[11px] text-white/70">
                {isAr ? `تقييم شامل من ${i18n.formatNumber(3)} مستويات قيادية وفقاً لمعايير الشارقة` : 'Comprehensive review & feedback from 3 distinct Sharjah leadership perspectives'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs & Copy Button */}
        <div className="px-5 py-3 bg-sadu-sand border-b border-sadu-gold flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                activeTab === 'all' ? 'bg-sadu-brick text-white' : 'bg-sadu-linen border border-sadu-gold text-sadu-charcoal hover:bg-sadu-sand'
              }`}
            >
              {isAr ? `الكل (${i18n.formatNumber(3)} جهات)` : 'All 3 Personas'}
            </button>
            <button
              onClick={() => setActiveTab('visionary')}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                activeTab === 'visionary' ? 'bg-sadu-brick text-white' : 'bg-sadu-linen border border-sadu-gold text-sadu-charcoal hover:bg-sadu-sand'
              }`}
            >
              {isAr ? 'الراعي المؤسسي' : 'The Visionary'}
            </button>
            <button
              onClick={() => setActiveTab('executive')}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                activeTab === 'executive' ? 'bg-sadu-brick text-white' : 'bg-sadu-linen border border-sadu-gold text-sadu-charcoal hover:bg-sadu-sand'
              }`}
            >
              {isAr ? 'رئيس الدائرة' : 'The Executive'}
            </button>
            <button
              onClick={() => setActiveTab('director')}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                activeTab === 'director' ? 'bg-sadu-brick text-white' : 'bg-sadu-linen border border-sadu-gold text-sadu-charcoal hover:bg-sadu-sand'
              }`}
            >
              {isAr ? 'مدير الشؤون الثقافية' : 'The Director'}
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 bg-sadu-linen border border-sadu-gold hover:bg-sadu-sand text-xs font-semibold rounded-md transition-colors cursor-pointer text-sadu-ink"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-sadu-sage" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ المراجعة' : 'Copy Review')}</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs leading-relaxed">
          {/* Persona 1: The Visionary */}
          {(activeTab === 'all' || activeTab === 'visionary') && (
            <div className="p-4 sm:p-5 bg-sadu-linen border border-sadu-gold rounded-lg shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-sadu-gold/40 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-amber-100 text-amber-900">
                    <ScrollText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-sadu-charcoal block">
                      {isAr ? `${i18n.formatNumber(1)}. الراعي المؤسسي (المستوى الكلي والسيادي)` : '1. The Visionary Sponsor (Macro-Level)'}
                    </span>
                    <span className="text-[10px] text-sadu-muted">
                      {isAr ? 'صاحب السمو الشيخ الدكتور سلطان بن محمد القاسمي' : 'H.H. Sheikh Dr. Sultan bin Muhammad Al Qasimi'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sadu-sand text-sadu-brick font-bold border border-sadu-gold">
                  Legacy & Heritage
                </span>
              </div>

              <div>
                <span className="font-bold text-sadu-ink block mb-1">
                  {isAr ? 'محور الرؤية والاهتمام الأساسي:' : 'Core Mandate & Evaluation Criteria:'}
                </span>
                <p className="text-sadu-muted">
                  {isAr
                    ? 'بناء مؤسسات ثقافية تدوم وتتجاوز الأشخاص، ضمان الاستثمار المستمر في الإبداع البشري، صون التراث، والتمثيل الرفيع للثقافة في الشارقة. التعامل مع اللغة العربية كلغة تأسيسية سيادية لا كترجمة لاحقة.'
                    : 'Building enduring cultural institutions that outlast individuals, investing in human creativity, cultural legacy, and dignified representation. Insisting that Arabic is foundational, not a translated afterthought.'}
                </p>
              </div>

              <div className="p-3 bg-sadu-sand rounded-md border-l-3 rtl:border-l-0 rtl:border-r-3 border-sadu-brick">
                <span className="font-bold text-sadu-brick block mb-1">
                  {isAr ? 'التوجيه والتقييم البناء (Feedback):' : 'Constructive Persona Feedback:'}
                </span>
                <p className="text-sadu-charcoal italic">
                  {isAr
                    ? '«إن تجنب واجهات التكنولوجيا الاستهلاكية المصطنعة واعتماد ألوان الكتان والنيلة ونسيج السدو يُعد انطلاقة موفقة. ومع ذلك، يجب ألا يُختزل الفنان في رمز تسلسلي تجاري. أعطوا الأولوية للسيرة الفكرية للمبدع وبيان نواياه الجمالية في صدارة كل ملف، واضمنوا أن يكون الأرشيف السيادي سجلاً معرفياً خالداً يوثق مسيرة الخط العربي وفنونه للأجيال القادمة، وليس مجرد قاعدة بيانات مؤقتة تنتهي بانتهاء المعرض.»'
                    : '"The deliberate avoidance of generic Silicon Valley SaaS clichés in favor of desert earth, indigo soot, and authentic Sadu weave motifs correctly grounds our heritage. However, the system must never reduce the sacred creative act of the artist to a commercial SKU or numeric asset code. In curatorial and archival views, the artist\'s intellectual statement and scholarly lineage must be granted visual primacy before technical dimensions. The Sovereign Archive must serve as an enduring, century-long cultural record for future scholars, not merely a transient post-exhibition database."'}
                </p>
              </div>
            </div>
          )}

          {/* Persona 2: The Governance Executive */}
          {(activeTab === 'all' || activeTab === 'executive') && (
            <div className="p-4 sm:p-5 bg-sadu-linen border border-sadu-gold rounded-lg shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-sadu-gold/40 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-blue-100 text-blue-900">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-sadu-charcoal block">
                      {isAr ? `${i18n.formatNumber(2)}. الرئيس التنفيذي للحوكمة (المستوى الاستراتيجي)` : '2. The Governance Executive (Strategic Level)'}
                    </span>
                    <span className="text-[10px] text-sadu-muted">
                      {isAr ? 'سعادة عبدالله بن محمد العويس — رئيس دائرة الثقافة' : 'H.E. Abdullah Al Owais — Chairman of the Department of Culture'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sadu-sand text-sadu-ink font-bold border border-sadu-gold">
                  Statutory Oversight
                </span>
              </div>

              <div>
                <span className="font-bold text-sadu-ink block mb-1">
                  {isAr ? 'محور الرؤية والاهتمام الأساسي:' : 'Core Mandate & Evaluation Criteria:'}
                </span>
                <p className="text-sadu-muted">
                  {isAr
                    ? 'الحوكمة الصارمة، تقليص المخاطر المؤسسية، المساءلة المالية، الرقابة على الميزانية مقابل الالتزامات الفعلية، والالتزام بمصفوفة تفويض الصلاحيات الصادرة بقرارات نظامية (Decree Matrices).'
                    : 'Rigorous governance, statutory risk mitigation, financial accountability, budget vs committed funds, digital paper trails, strict approval gates, and HR delegation matrices.'}
                </p>
              </div>

              <div className="p-3 bg-sadu-sand rounded-md border-l-3 rtl:border-l-0 rtl:border-r-3 border-sadu-ink">
                <span className="font-bold text-sadu-ink block mb-1">
                  {isAr ? 'التوجيه والتقييم البناء (Feedback):' : 'Constructive Persona Feedback:'}
                </span>
                <p className="text-sadu-charcoal italic">
                  {isAr
                    ? `«مؤشرات الرادار القيادي ونسبة موثوقية الأدلة M01 (${i18n.formatPercent(94.2)}) تقدم رؤية إشرافية ممتازة. ولكن لضمان أعلى درجات الانضباط، يجب تضمين مصفوفة التفويض المالي بسقوف واضحة، مع بوابة برمجية تثبت بالدليل القاطع استحالة تجاوز ختم النطاق (Approved Scope v1.2) لإصدار عقد أو صرف دفعة. وفروا أيضاً عداداً تصاعدياً ينبه آلياً لأي قرار إداري يتأخر عن ${i18n.formatNumber(72)} ساعة.»`
                    : '"The high-level budget commitments and 94.2% M01 evidence score provide sound strategic oversight. However, statutory compliance requires an explicit Statutory Delegation Matrix with clearly codified spending ceilings. Furthermore, implement an immutable Anti-Bypass Gate that mathematically proves a contract cannot be generated or milestone disbursed without a frozen Approved Scope (v1.2) and attributable jury sign-off. Provide automated 72-hour escalation clocks for pending statutory decisions."'}
                </p>
              </div>
            </div>
          )}

          {/* Persona 3: The Portfolio Director */}
          {(activeTab === 'all' || activeTab === 'director') && (
            <div className="p-4 sm:p-5 bg-sadu-linen border border-sadu-gold rounded-lg shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-sadu-gold/40 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-amber-100 text-amber-900">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-sadu-charcoal block">
                      {isAr ? `${i18n.formatNumber(3)}. مدير المحافظ والمهرجانات (المستوى العملياتي)` : '3. The Portfolio Director (Operational Level)'}
                    </span>
                    <span className="text-[10px] text-sadu-muted">
                      {isAr ? 'الأستاذ محمد إبراهيم القصير — مدير إدارة الشؤون الثقافية' : 'Mohammed Ibrahim Al Qaseer — Director of Cultural Affairs'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sadu-sand text-amber-800 font-bold border border-sadu-gold">
                  Cross-Delivery & Ripple
                </span>
              </div>

              <div>
                <span className="font-bold text-sadu-ink block mb-1">
                  {isAr ? 'محور الرؤية والاهتمام الأساسي:' : 'Core Mandate & Evaluation Criteria:'}
                </span>
                <p className="text-sadu-muted">
                  {isAr
                    ? 'الجمع بين أصالة الفنون الإسلامية والتجريب المعاصر، إدارة تسليم المهرجانات والبيناليات المتزامنة، ورصد المعوقات الميدانية (فحص أحمال الأرضيات للأعمال النحتية الثقيلة، تأخر الشحن، وسلاسل الأثر).'
                    : 'Bridges governance and on-the-ground curators. Manages parallel festivals simultaneously. Focuses on operational bottlenecks, shipping delays, installation readiness, and cross-team coordination.'}
                </p>
              </div>

              <div className="p-3 bg-sadu-sand rounded-md border-l-3 rtl:border-l-0 rtl:border-r-3 border-amber-800">
                <span className="font-bold text-amber-800 block mb-1">
                  {isAr ? 'التوجيه والتقييم البناء (Feedback):' : 'Constructive Persona Feedback:'}
                </span>
                <p className="text-sadu-charcoal italic">
                  {isAr
                    ? `«عند التعامل مع أعمال ضخمة مثل المنحوتة البرونزية المعمارية (أفق كوفي — حمولة ${i18n.formatNumber(120)} كجم/م²) بمتحف الشارقة للفنون، لا تكفيني بطاقة تنبيه معزولة. أحتاج إلى محاكي فوري لسلاسل الأثر (Ripple Effect Simulator) يوضح كيف يترتب على تأخر المهندس الإنشائي ${i18n.formatNumber(4)} أيام تعطيل عوارض الإضاءة المعلقة، وتكبد رسوم تخزين بالميناء، وتأثير ذلك على موعد الافتتاح الرسمي.»`
                    : '"Managing simultaneous international festivals requires moving beyond static alerts. For the 120kg bronze sculpture plinth load-bearing hold at Sharjah Art Museum, I require an interactive Ripple Effect Simulator that dynamically calculates downstream impacts on overhead lighting rig staging, customs demurrage at Sharjah Port, and VIP opening gala readiness, linking engineering sign-offs directly to staging schedules."'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-sadu-sand border-t border-sadu-gold flex items-center justify-between text-xs">
          <span className="text-sadu-muted">
            {isAr ? 'تم دمج هذه الملاحظات في محاكي القيادة النشط بسدو' : 'All three recommendations are fully implemented in SADU'}
          </span>
          <div className="flex items-center gap-2">
            {onOpenLeadershipTab && (
              <button
                onClick={() => {
                  onClose();
                  onOpenLeadershipTab();
                }}
                className="px-3 py-1.5 bg-sadu-brick text-white font-bold rounded-md hover:bg-sadu-brick-dark transition-colors cursor-pointer"
              >
                {isAr ? 'فتح رادار القيادة والمحاكي ←' : 'Open Live Leadership Simulator →'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-sadu-linen border border-sadu-gold hover:bg-sadu-sand rounded-md font-semibold cursor-pointer"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
