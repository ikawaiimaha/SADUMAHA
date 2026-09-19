import React, { useState } from 'react';
import { Language, ExhibitionProgramme, WorkspaceTab } from '../../types';
import { ARTWORKS, INITIAL_MESSAGES } from '../../data/mockData';
import { useI18n } from '../../context/I18nContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  FileText, 
  MessageSquare, 
  DollarSign, 
  Package, 
  ShieldCheck,
  Download,
  UploadCloud,
  Wrench,
  AlertCircle,
  Award
} from 'lucide-react';

export interface ArtistViewProps {
  lang?: Language;
  selectedProgramme?: ExhibitionProgramme;
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

export const ArtistView: React.FC<ArtistViewProps> = (props) => {
  const i18n = useI18n();
  const workspace = useWorkspace();

  const lang = props.lang ?? i18n.lang;
  const isAr = lang === 'ar';
  const { formatNumber, formatPercent, formatRatio, formatCurrency, localizeDigits } = i18n;
  const selectedProgramme = props.selectedProgramme ?? workspace.selectedProgramme;
  const onNavigateTab = props.onNavigateTab ?? workspace.navigateTab;

  const [instructionFile, setInstructionFile] = useState<string>('YN_Handling_Installation_Manual_2026.pdf');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setInstructionFile(e.target.files[0].name);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
    }
  };

  const artistWorks = ARTWORKS.slice(0, 2);
  const isTakreem = artistWorks.some(w => w.isTakreem) || true;

  return (
    <div className="space-y-6">
      {/* Artist Profile & Assignment Header */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-1">
              <UserCheck className="w-4 h-4" />
              <span>{isAr ? 'بوابة الفنان والاستوديو المشارك' : 'Participating Artist & Studio Portal'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-sadu-charcoal">
                {isAr ? 'يوسف نبهان — استوديو الخط والتجهيز' : 'Youssef Nabhan — Calligraphy Studio'}
              </h1>
              {isTakreem && (
                <span 
                  id="takreem-badge-artist"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF9EE] text-[#8C601E] border border-sadu-ochre shadow-xs ring-1 ring-sadu-gold/50"
                  title={isAr ? 'تكريم: تقليد سنوي لتكريم كبار الخطاطين ورواد الفن في بينالي الشارقة للخط' : 'Takreem: Annual Sharjah Biennial Honorary Artist Tradition'}
                >
                  <Award className="w-3.5 h-3.5 text-sadu-ochre shrink-0" />
                  <span>تكريم (Honored Artist)</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-sadu-muted mt-1">
              {isAr
                ? 'المعرض الشخصي المعتمد: خرائط الصوت والحرف · بينالي الشارقة للخط'
                : 'Approved Solo Exhibition: Cartographies of Sound & Script · Sharjah Calligraphy Biennial'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('communications')}
              className="px-4 py-2 text-xs font-semibold text-white bg-sadu-brick hover:bg-sadu-brick-dark rounded-md transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isAr ? 'مراسلة المنسق المباشر' : 'Message Assigned Coordinator'}</span>
            </button>
          </div>
        </div>

        {/* Milestone Lifecycle Stepper */}
        <div className="mt-8 pt-6 border-t border-sadu-gold/50">
          <span className="text-xs font-bold text-sadu-muted block uppercase tracking-wider mb-3">
            {isAr ? 'مسار المشاركة الفنية والاعتماد المؤسسي:' : 'Participation & Governance Lifecycle Track:'}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-3 bg-sadu-sage-light border border-sadu-sage rounded-md">
              <span className="text-[10px] text-sadu-ink font-bold block">1. SUBMISSION</span>
              <span className="font-bold text-sadu-ink">{isAr ? 'المقترح معتمد' : 'Proposal Approved'}</span>
              <span className="text-[10px] text-sadu-sage block mt-0.5">✓ {isAr ? 'تمت مراجعة اللجنة' : 'Jury Reviewed'}</span>
            </div>
            <div className="p-3 bg-sadu-sage-light border border-sadu-sage rounded-md">
              <span className="text-[10px] text-sadu-ink font-bold block">2. SCOPE v1.2</span>
              <span className="font-bold text-sadu-ink">{isAr ? 'النطاق مثبت' : 'Scope Frozen'}</span>
              <span className="text-[10px] text-sadu-sage block mt-0.5">✓ {isAr ? `${formatNumber(2)} أعمال فنية معتمدة` : '2 Artworks Bound'}</span>
            </div>
            <div className="p-3 bg-sadu-sage-light border border-sadu-sage rounded-md">
              <span className="text-[10px] text-sadu-ink font-bold block">3. CONTRACT</span>
              <span className="font-bold text-sadu-ink">{isAr ? 'العقد موقع' : 'Contract Executed'}</span>
              <span className="text-[10px] text-sadu-sage block mt-0.5">✓ {isAr ? 'توقيع الطرفين' : 'Bilateral Signed'}</span>
            </div>
            <div className="p-3 bg-sadu-paper border border-sadu-ochre rounded-md">
              <span className="text-[10px] text-sadu-brick font-bold block">4. INSTALLATION</span>
              <span className="font-bold text-sadu-brick">{isAr ? 'الفحص الهندسي' : 'Plinth Verification'}</span>
              <span className="text-[10px] text-sadu-muted block mt-0.5">● {isAr ? `جارٍ فحص القاعدة (${localizeDigits('48h')})` : 'In Progress (48h)'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmed Artwork Participation */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'الأعمال الفنية المعتمدة في عقد المشاركة' : 'Confirmed Artworks in Participation Contract'}
            </h2>
            <p className="text-xs text-sadu-muted">
              {isAr ? 'وفقاً لبنود عقد المعرض الشخصي الموقع مع إدارة الشؤون الثقافية' : 'Bound to Form 1(B) Schedule with Sharjah Directorate of Cultural Affairs'}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {artistWorks.map(art => (
            <div key={art.id} className="p-4 bg-sadu-sand rounded-md border border-sadu-gold flex flex-col justify-between min-h-[160px] space-y-3">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-sadu-ink block font-bold">
                      {art.canonicalCode}
                    </span>
                    <h3 className="font-bold text-sm text-sadu-charcoal">
                      {isAr ? art.titleAr : art.titleEn}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-sadu-linen border border-sadu-gold text-xs font-mono font-bold">
                    {isAr ? `${formatNumber(art.insuranceValueUsd)} دولار` : `$${art.insuranceValueUsd.toLocaleString()} USD`}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-sadu-charcoal">
                  <div><strong>{isAr ? 'المواد:' : 'Medium:'}</strong> {isAr ? art.mediumAr : art.mediumEn}</div>
                  <div><strong>{isAr ? 'الأبعاد والوزن:' : 'Dimensions & Weight:'}</strong> {localizeDigits(art.dimensionsCm)} · {isAr ? `${formatNumber(art.weightKg)} كجم` : `${art.weightKg} kg`}</div>
                  <div><strong>{isAr ? 'موقع العرض:' : 'Assigned Gallery:'}</strong> {isAr ? art.locationAr : art.locationEn}</div>
                  <div><strong>{isAr ? 'ملاحظات المعاينة:' : 'Condition Intake:'}</strong> {isAr ? art.conditionNotesAr : art.conditionNotesEn}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-sadu-gold/50 flex items-center justify-between text-xs">
                <span className="text-sadu-sage font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مستلم ومفحوص بالمتحف' : 'Received & Inspected'}</span>
                </span>
                <span className="text-[11px] text-sadu-muted">
                  {isAr ? `رمز الصندوق: ${localizeDigits('CRATE-04')}` : 'Crate ID: CRATE-04'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Handling & Installation Instructions Upload Card */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sadu-gold/40">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-1">
              <Wrench className="w-4 h-4" />
              <span>{isAr ? 'الاشتراطات الهندسية والتركيب' : 'Engineering Specifications & Mounting'}</span>
            </div>
            <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'إرشادات التعامل والتركيب الفني' : 'Handling & Installation Instructions'}
            </h2>
          </div>

          <span className="px-2.5 py-1 rounded bg-sadu-sand text-sadu-charcoal border border-sadu-gold text-xs font-mono font-bold self-start sm:self-auto">
            {isAr ? 'وثيقة إلزامية للمتحف' : 'Museum Mandatory Document'}
          </span>
        </div>

        {/* Routing Direct Notification Note */}
        <div className="p-3.5 bg-sadu-sand rounded-md border border-sadu-gold flex items-start gap-3 text-xs">
          <AlertCircle className="w-4 h-4 text-sadu-brick shrink-0 mt-0.5" />
          <p className="text-sadu-charcoal leading-relaxed">
            <strong className="text-sadu-brick block mb-0.5">
              {isAr ? 'تنبيه الربط المؤسسي المباشر:' : 'Direct Routing Notice:'}
            </strong>
            {isAr
              ? 'تُحال هذه الإرشادات والمخططات مباشرة وبشكل آلي إلى المكتب الفني وفريق هندسة التركيبات بمتحف الشارقة للفنون لمطابقة حمولة الأرضيات وإعداد منصات العرض المعتمدة.'
              : 'Institutional Note: These instructions will be routed directly to the Technical Desk and installation engineering team at Sharjah Art Museum for floor load certification and mounting prep.'}
          </p>
        </div>

        {/* Current Upload Status & File Zone */}
        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-sadu-paper rounded-md border border-sadu-gold flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] font-mono text-sadu-muted block font-bold uppercase tracking-wider mb-1">
                {isAr ? 'الملف المعتمد الحالي' : 'Active Registered File'}
              </span>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sadu-brick shrink-0" />
                <span className="font-bold font-mono text-sadu-charcoal text-xs truncate" title={instructionFile}>
                  {instructionFile}
                </span>
              </div>
              <p className="text-[11px] text-sadu-muted mt-1.5 leading-relaxed">
                {isAr
                  ? 'يتضمن مخطط توزيع الوزن على القاعدة، واشتراطات مستوى الإضاءة (بحد أقصى 50 لوكس لحماية أحبار السنديان).'
                  : 'Includes plinth base load distribution diagrams, torque specifications, and max 50-lux illumination limits.'}
              </p>
            </div>

            <div className="pt-2 border-t border-sadu-gold/40 flex items-center justify-between">
              <span className="text-sadu-sage font-semibold flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'مستلم لدى المكتب الفني' : 'Routed to Technical Desk'}</span>
              </span>
              <button
                type="button"
                className="text-sadu-brick hover:text-sadu-brick-dark font-semibold text-[11px] underline flex items-center gap-1 cursor-pointer"
                onClick={() => alert(isAr ? 'جارٍ تنزيل دليل إرشادات التركيب المعتمد...' : 'Downloading registered Handling & Installation PDF...')}
              >
                <Download className="w-3 h-3" />
                <span>{isAr ? 'تحميل' : 'Download'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Upload/Replace Zone */}
          <div className="p-4 bg-sadu-sand rounded-md border border-dashed border-sadu-gold flex flex-col justify-center items-center text-center space-y-2 relative">
            <UploadCloud className="w-6 h-6 text-sadu-brick" />
            <div>
              <span className="font-bold text-sadu-charcoal text-xs block">
                {isAr ? 'رفع نسخة محدثة من إرشادات التركيب' : 'Upload Revised Handling & Installation Manual'}
              </span>
              <span className="text-[10px] text-sadu-muted block mt-0.5">
                {isAr ? 'صيغة PDF (بحد أقصى 25 ميجابايت)' : 'PDF format up to 25MB with engineering schematics'}
              </span>
            </div>

            <label className="mt-1 px-3 py-1.5 bg-sadu-linen border border-sadu-gold rounded text-xs font-semibold text-sadu-ink hover:bg-sadu-sand-dark transition-colors cursor-pointer active:scale-98">
              <span>{isAr ? 'اختيار ملف جديد' : 'Browse File...'}</span>
              <input 
                type="file" 
                accept=".pdf" 
                className="hidden" 
                onChange={handleFileUpload} 
              />
            </label>

            {uploadSuccess && (
              <span className="text-[10px] text-sadu-sage font-bold block animate-fade-in">
                ✓ {isAr ? 'تم استلام الملف وتوجيهه للمكتب الفني بنجاح!' : 'Uploaded and routed directly to Technical Desk!'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Honorarium Milestones Breakdown — Two-Part Commission Structure */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'دفعات المكافأة الفنية ومواعيد الاستحقاق' : 'Biennial Commission Structure & Payment Milestones'}
            </h2>
            <p className="text-xs text-sadu-muted">
              {isAr
                ? `المكافأة الإجمالية المعتمدة: ${formatCurrency(16800, 'USD')} (${formatCurrency(61700, 'AED')}) عبر الحساب المصرفي المعتمد`
                : 'Total Approved Commission: $16,800 USD (AED 61,700) disbursed via verified institutional IBAN'}
            </p>
          </div>

          <span className="px-2.5 py-1 rounded bg-sadu-sand text-sadu-charcoal border border-sadu-gold text-xs font-mono font-bold self-start sm:self-auto">
            {isAr ? 'هيكل ثنائي المرحلة' : 'Two-Part Structure'}
          </span>
        </div>

        <div className="space-y-3 text-xs">
          {/* Milestone 1: Advance (30%) */}
          <div className="p-3.5 bg-sadu-sage-light/50 rounded-md border border-sadu-sage flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="font-bold text-sadu-charcoal block">
                {isAr ? `الدفعة الأولى (${formatPercent(30)}): الدفعة المقدمة لشراء المواد والتجهيز` : 'Milestone 1 (30%): Advance Payment for Materials'}
              </span>
              <span className="text-[11px] text-sadu-muted">
                {isAr ? `صُرفت تلقائياً بموجب توقيع العقد الثنائي في ${localizeDigits('18 أغسطس 2026')}` : 'Unlocked automatically upon Bilateral Contract execution. Disbursed 18 Aug 2026.'}
              </span>
            </div>
            <div className="text-end">
              <span className="font-mono font-bold text-sadu-sage text-sm">{isAr ? `${formatCurrency(5040, 'USD')}` : '$5,040 USD'}</span>
              <span className="text-[10px] text-sadu-sage block font-semibold">✓ {isAr ? "مدفوع · محاكاة" : "Paid · simulated"}</span>
            </div>
          </div>

          {/* Milestone 2: Final Exhibition Settlement (70%) */}
          <div className="p-3.5 bg-sadu-sand rounded-md border border-sadu-gold flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="font-bold text-sadu-charcoal block">
                {isAr ? `الدفعة الختامية (${formatPercent(70)}): التسوية النهائية للمعرض` : 'Milestone 2 (70%): Final Exhibition Settlement'}
              </span>
              <span className="text-[11px] text-sadu-brick">
                {isAr 
                  ? 'مقفلة ببوابة أمان: تستحق وتُصرف عند الافتتاح الرسمي للبينالي بمتحف الشارقة للفنون' 
                  : 'Gated and unlocked strictly when the exhibition officially opens to the public at Sharjah Art Museum.'}
              </span>
            </div>
            <div className="text-end">
              <span className="font-mono font-bold text-sadu-charcoal text-sm">{isAr ? `${formatCurrency(11760, 'USD')}` : '$11,760 USD'}</span>
              <span className="text-[10px] text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded block font-semibold mt-0.5">
                ● {isAr ? 'معلق لحين الافتتاح الرسمي' : 'Pending Exhibition Opening'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
