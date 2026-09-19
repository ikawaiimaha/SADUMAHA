import React, { useState } from 'react';
import { Language, ExhibitionProgramme, WorkspaceTab } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { 
  Archive, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  FileText, 
  Download, 
  Award,
  Clock,
  Sparkles,
  Truck,
  AlertCircle
} from 'lucide-react';

export interface ArchiveViewProps {
  lang?: Language;
  selectedProgramme?: ExhibitionProgramme;
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = (props) => {
  const i18n = useI18n();
  const workspace = useWorkspace();

  const lang = props.lang ?? i18n.lang;
  const isAr = lang === 'ar';
  const { formatNumber, formatPercent, formatRatio, localizeDigits } = i18n;
  const selectedProgramme = props.selectedProgramme ?? workspace.selectedProgramme;
  const onNavigateTab = props.onNavigateTab ?? workspace.navigateTab;

  const [returnManifestSigned, setReturnManifestSigned] = useState(false);
  const [archiveSealed, setArchiveSealed] = useState(false);

  const manifestItems = [
    { 
      code: 'DOC-01', 
      titleEn: 'Artist Nomination & Dossier Snapshot v1.0', 
      titleAr: 'سجل ترشيح الفنان وملف المشاركة المعتمد v1.0', 
      status: 'verified', 
      authority: isAr ? 'استوديو الفنان والمنسق' : 'Curator & Artist Studio',
      checksum: 'SAMPLE REF: 7b2a...e901'
    },
    { 
      code: 'DOC-02', 
      titleEn: 'Calligraphy Panel & Cultural Affairs Sign-Off', 
      titleAr: 'محضر اعتماد لجنة تحكيم الخط ومدير الشؤون الثقافية', 
      status: 'verified', 
      authority: isAr ? 'لجنة التحكيم والشؤون الثقافية' : 'Jury & Cultural Affairs',
      checksum: 'SAMPLE REF: 8f1c...3a44'
    },
    { 
      code: 'DOC-03', 
      titleEn: 'Approved Scope Frozen Revision v1.2', 
      titleAr: 'النطاق الفني المعتمد والمجمد v1.2', 
      status: 'verified', 
      authority: isAr ? 'دائرة الثقافة بالشارقة' : 'Directorate of Cultural Affairs',
      checksum: 'SAMPLE REF: 4c3d...9e12'
    },
    { 
      code: 'DOC-04', 
      titleEn: 'Executed Bilateral Solo Exhibition Contract', 
      titleAr: 'عقد المعرض الشخصي الثنائي المعتمد رسمياً', 
      status: 'verified', 
      authority: isAr ? 'الشؤون القانونية والإدارة التنفيذية' : 'Legal & Executive Desk',
      checksum: 'SAMPLE REF: 1a9b...7f88'
    },
    { 
      code: 'DOC-05', 
      titleEn: 'Handling & Installation Manual with Load Specs', 
      titleAr: 'دليل إرشادات التركيب ومطابقة حمولة الأرضيات', 
      status: 'verified', 
      authority: isAr ? 'المكتب الفني وهندسة المتحف' : 'Technical Desk & Engineering',
      checksum: 'SAMPLE REF: 5e6a...0b21'
    },
    { 
      code: 'DOC-06', 
      titleEn: 'Inbound Customs & Condition Intake Report', 
      titleAr: 'محضر المعاينة الجمركية وفحص استلام الحالة', 
      status: 'verified', 
      authority: isAr ? 'مكتب الترميم وصيانة المقتنيات' : 'Chief Conservator',
      checksum: 'SAMPLE REF: 3d7c...6e54'
    },
    { 
      code: 'DOC-07', 
      titleEn: 'Two-Part Commission Settlement Financial Audit', 
      titleAr: 'سجل تسوية دفعات التكليف (30% مقدمة / 70% ختامية)', 
      status: 'verified', 
      authority: isAr ? 'قسم الحسابات المالية' : 'Accounts & Treasury Lead',
      checksum: 'SAMPLE REF: 9b2d...4a11'
    },
    { 
      code: 'DOC-08', 
      titleEn: 'Outbound Repacking & Exit Condition Protocol', 
      titleAr: 'محضر إعادة التغليف بالصناديق الأصلية وفحص المغادرة', 
      status: 'verified', 
      authority: isAr ? 'إدارة المعارض واللوجستيات' : 'Exhibition & Logistics Desk',
      checksum: 'SAMPLE REF: 6a8f...1c90'
    },
    { 
      code: 'DOC-09', 
      titleEn: "Sample return receipt · scenario prerequisite",
      titleAr: "إيصال إرجاع تجريبي · متطلب للسيناريو",
      status: returnManifestSigned ? 'verified' : 'pending', 
      authority: isAr ? 'شركة الشحن وتوقيع استلام الفنان' : 'Carrier & Artist Receipt Signature',
      checksum: returnManifestSigned ? 'SAMPLE REF: e4f7...9a23' : (isAr ? "الفحص التجريبي معلق" : "Sample check pending")
    },
  ];

  const verifiedCount = manifestItems.filter(i => i.status === 'verified').length;
  const totalCount = manifestItems.length;
  const progressPercent = Math.round((verifiedCount / totalCount) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-1">
              <Archive className="w-4 h-4" />
              <span>{isAr ? "الذاكرة المؤسسية · أرشيف تجريبي" : "Institutional memory · sample archive"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-sadu-charcoal">
              {isAr ? "إغلاق ملف وقائمة مستندات للتجربة" : "Sample dossier closeout and document list"}
            </h1>
            <p className="text-xs sm:text-sm text-sadu-muted mt-1">
              {isAr
                ? "محاكاة إغلاق داخل المتصفح فقط. لا تخزين دائم أو تحقق تشفيري أو تصديق مؤسسي."
                : "Browser-only closeout simulation. No durable storage, cryptographic verification or institutional certification is performed."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 ${
              archiveSealed
                ? 'bg-sadu-sage/20 text-sadu-ink border border-sadu-sage'
                : 'bg-amber-50 text-sadu-brick border border-amber-300'
            }`}>
              <Lock className="w-4 h-4" />
              <span>{archiveSealed ? (isAr ? "مثال للقراءة فقط في هذه المعاينة" : "Read-only sample in this view") : (isAr ? "الإغلاق التجريبي معلق" : "Sample closeout pending")}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Manifest Verification Table — Responsive Card-Based Ledger */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-4 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">
              {isAr ? "قائمة مستندات تجريبية" : "Sample document checklist"}
            </h2>
            <p className="text-xs text-sadu-muted">
              {isAr 
                ? `${formatRatio(verifiedCount, totalCount)} مستندات مفحوصة في المحاكاة؛ دون تحقق تشفيري`
                : `${verifiedCount} of ${totalCount} documents checked in this sample; no checksum verification`}
            </p>
          </div>

          <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
            progressPercent === 100
              ? 'text-sadu-sage bg-sadu-sage-light border-sadu-sage'
              : 'text-amber-800 bg-amber-50 border-amber-300'
          }`}>
            {formatPercent(progressPercent)} {isAr ? 'مكتمل' : 'Complete'}
          </span>
        </div>

        {/* Desktop Semantic Table */}
        <div className="hidden md:block w-full overflow-hidden rounded-lg border border-sadu-gold/50">
          <table className="w-full text-xs text-start border-collapse">
            <thead>
              <tr className="bg-sadu-ink text-white">
                <th className="p-3 font-semibold">{isAr ? 'الرمز والمسمى' : 'Document Code & Title'}</th>
                <th className="p-3 font-semibold">{isAr ? "مسؤولية مقترحة · تجريبي" : "Proposed responsibility · sample"}</th>
                <th className="p-3 font-semibold">{isAr ? 'حالة التدقيق' : 'Verification'}</th>
                <th className="p-3 font-semibold text-center">{isAr ? "مرجع تجريبي" : "Sample reference"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sadu-gold/40">
              {manifestItems.map((item) => (
                <tr 
                  key={item.code} 
                  className={`transition-colors ${
                    item.status === 'pending'
                      ? 'bg-amber-50/70 hover:bg-amber-100/60'
                      : 'bg-sadu-linen hover:bg-sadu-sand/60'
                  }`}
                >
                  {/* Code & Title */}
                  <td className="p-3 font-medium">
                    <span className="font-mono text-sadu-brick font-bold block text-[10px]">
                      {item.code}
                    </span>
                    <span className="font-bold text-sadu-charcoal text-sm">
                      {isAr ? item.titleAr : item.titleEn}
                    </span>
                  </td>

                  {/* Issuing Authority */}
                  <td className="p-3 text-sadu-ink font-semibold">
                    <span>{item.authority}</span>
                  </td>

                  {/* Verification Status */}
                  <td className="p-3">
                    {item.status === 'verified' ? (
                      <span className="text-sadu-sage font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isAr ? "تم الفحص · محاكاة" : "Checked · simulated"}</span>
                      </span>
                    ) : (
                      <span className="text-amber-800 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{isAr ? "فحص الإرجاع التجريبي معلق" : "Sample return check pending"}</span>
                      </span>
                    )}
                  </td>

                  {/* Checksum / Integrity */}
                  <td className="p-3 text-center font-mono text-[11px]">
                    <span className={item.status === 'verified' ? 'text-sadu-muted' : 'text-sadu-brick font-bold'}>
                      {item.checksum}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Touch-Friendly Card Stack */}
        <div className="block md:hidden space-y-3">
          {manifestItems.map((item) => (
            <div
              key={item.code}
              className={`border rounded-lg p-4 shadow-xs flex flex-col justify-between min-h-[140px] ${
                item.status === 'pending'
                  ? 'bg-amber-50/70 border-amber-300'
                  : 'bg-sadu-linen border-sadu-gold'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-sadu-brick font-bold text-xs bg-sadu-sand px-2 py-0.5 rounded border border-sadu-gold/40">
                    {item.code}
                  </span>
                  {item.status === 'verified' ? (
                    <span className="text-sadu-sage text-xs font-semibold flex items-center gap-1 bg-sadu-sand/60 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      {isAr ? "تم الفحص · محاكاة" : "Checked · simulated"}
                    </span>
                  ) : (
                    <span className="text-amber-800 text-xs font-semibold flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3" />
                      {isAr ? "الفحص التجريبي معلق" : "Sample check pending"}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm text-sadu-charcoal mb-1">
                  {isAr ? item.titleAr : item.titleEn}
                </h3>
                <div className="text-xs text-sadu-muted mb-2">
                  <span className="font-medium text-sadu-ink">{item.authority}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-sadu-gold/30 flex items-center justify-between text-[11px] font-mono text-sadu-muted">
                <span>{isAr ? 'البصمة الرقمية:' : 'Checksum:'}</span>
                <span className={item.status === 'verified' ? 'font-bold text-sadu-charcoal' : 'font-bold text-sadu-brick'}>
                  {item.checksum}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Mandatory Return Freight Manifest Gate Box */}
        <div className={`mt-6 p-4 rounded-lg border text-xs transition-all space-y-3 ${
          returnManifestSigned
            ? 'bg-sadu-sage-light/60 border-sadu-sage'
            : 'bg-amber-50/80 border-amber-300'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Truck className={`w-5 h-5 shrink-0 mt-0.5 ${returnManifestSigned ? 'text-sadu-sage' : 'text-sadu-brick'}`} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-sadu-charcoal">
                    {isAr ? 'بوابة شحن وإرجاع الأعمال الفنية (Return Freight Manifest)' : 'Artwork Return Freight Manifest Gate'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                    returnManifestSigned
                      ? 'bg-sadu-sage text-white'
                      : 'bg-sadu-brick text-white'
                  }`}>
                    {isAr ? "متطلب للسيناريو" : "Scenario prerequisite"}
                  </span>
                </div>
                <p className="text-sadu-charcoal text-[11px] leading-relaxed mt-1">
                  {isAr
                    ? "يفترض هذا المثال إرجاع إعارة. يتبع الإغلاق الفعلي متطلبات الإرجاع أو النقل أو الاحتفاظ أو التصرف المعتمدة لكل عنصر؛ ولا تُعاد شحنة كل عمل بالضرورة."
                    : "This sample assumes a returned loan. Real closeout must follow each item’s approved return, transfer, retention or disposition requirements; not all artworks are shipped back."}
                </p>
                <div className="mt-1 text-[11px] font-mono text-sadu-muted flex flex-wrap gap-x-4 gap-y-1">
                  <span>AWB: <strong>SHJ-EXP-2026-9082</strong></span>
                  <span>{isAr ? 'الوجهة: باريس، فرنسا' : 'Destination: Paris, France'}</span>
                  <span>{isAr ? 'الصناديق: CRATE-04 و CRATE-05' : 'Crates: CRATE-04 & CRATE-05'}</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-center">
              <button
                type="button"
                disabled={archiveSealed} onClick={() => setReturnManifestSigned(!returnManifestSigned)}
                className={`px-3.5 py-2 rounded-md font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                  returnManifestSigned
                    ? 'bg-sadu-linen text-sadu-charcoal border border-sadu-gold hover:bg-sadu-sand'
                    : 'bg-sadu-brick text-white hover:bg-sadu-brick-dark active:scale-98'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {returnManifestSigned 
                    ? (isAr ? "إعادة فحص الإيصال التجريبي" : "Reset sample receipt check")
                    : (isAr ? "تسجيل فحص الإيصال التجريبي" : "Mark sample receipt checked")}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Seal Action */}
        <div className="mt-6 pt-6 border-t border-sadu-gold flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-sadu-muted max-w-lg">
            {!returnManifestSigned ? (
              <span className="text-sadu-brick font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {isAr
                    ? "الإغلاق التجريبي متوقف: سجل فحص إيصال السيناريو أولاً. لا يُطبق توقيع فعلي."
                    : "Sample closeout blocked: mark the scenario receipt checked first. No real signature is applied."}
                </span>
              </span>
            ) : (
              <span>
                {isAr
                  ? "يجعل هذا الإجراء المثال للقراءة فقط في المعاينة الحالية. قد تعيد المغادرة أو إعادة التحميل ضبطه؛ لا يُنشأ أرشيف دائم أو شهادة."
                  : "This action makes the sample read-only in this mounted view. Reloading or leaving the view can reset it; no durable archive or certificate is created."}
              </span>
            )}
          </div>

          <button
            onClick={() => setArchiveSealed(true)}
            disabled={!returnManifestSigned || archiveSealed}
            className={`px-6 py-2.5 text-xs font-bold rounded-md transition-all shadow-xs flex items-center gap-2 ${
              archiveSealed
                ? 'bg-sadu-sand text-sadu-ink border border-sadu-gold cursor-default'
                : !returnManifestSigned
                  ? 'bg-sadu-gold/40 text-sadu-muted border border-sadu-gold/60 cursor-not-allowed opacity-70'
                  : 'bg-sadu-ink text-white hover:bg-sadu-ink-dark cursor-pointer active:scale-98'
            }`}
            title={!returnManifestSigned ? (isAr ? "يلزم فحص الإيصال التجريبي" : "Sample receipt check required") : ''}
          >
            <Lock className="w-4 h-4" />
            <span>
              {archiveSealed 
                ? (isAr ? "✓ أصبح المثال للقراءة فقط" : "✓ Sample marked read-only")
                : (isAr ? "جعل المثال للقراءة فقط" : "Make sample read-only")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
