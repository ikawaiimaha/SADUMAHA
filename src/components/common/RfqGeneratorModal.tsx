import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/I18nContext';
import { ARTWORKS, INSTITUTIONAL_INFO } from '../../data/mockData';
import { ArtworkRecord } from '../../types';
import { 
  FileText, 
  X, 
  Printer, 
  ShieldAlert, 
  CheckCircle2, 
  Building2, 
  Scale, 
  Clock, 
  Calendar,
  AlertTriangle,
  Download,
  Layers,
  Copy,
  Check
} from 'lucide-react';

export interface RfqGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPackageCategory?: 'fabrication' | 'printing' | 'shipping';
}

export const RfqGeneratorModal: React.FC<RfqGeneratorModalProps> = ({
  isOpen,
  onClose,
  defaultPackageCategory = 'fabrication'
}) => {
  const { lang, formatCurrency, formatNumber, localizeDigits } = useI18n();
  const isAr = lang === 'ar';

  const [selectedScope, setSelectedScope] = useState<'bronze_plinth' | 'catalogue_print' | 'fine_art_freight'>('bronze_plinth');
  const [rfqNumber] = useState('DEMO-RFQ-0419');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (isOpen) setSelectedScope(defaultPackageCategory === 'shipping' ? 'fine_art_freight' : defaultPackageCategory === 'printing' ? 'catalogue_print' : 'bronze_plinth');
  }, [isOpen, defaultPackageCategory]);

  if (!isOpen) return null;

  const bronzeArtwork = ARTWORKS.find(a => a.canonicalCode === 'SCB-2026-YN-02') || ARTWORKS[1];

  const handlePrint = () => {
    window.print();
  };

  const handleCopyNotice = () => {
    const text = isAr 
      ? 'طلب عروض أسعار تجريبي — لم يُصدر أو يُرسل. لا تنشئ المعاينة أمراً أو توقيعاً أو التزاماً مالياً. يلزم التحقق من سياسة المشتريات والتفويض المنطبقين قبل الاستخدام الفعلي.'
      : 'Sample RFQ — not issued or transmitted. This preview creates no order, signature or financial commitment. Applicable procurement policy and delegation require verification before real use.';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-sadu-charcoal/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static"
      id="rfq-generator-modal"
    >
      <div className="relative w-full max-w-4xl bg-white border border-sadu-gold rounded-lg shadow-xl overflow-hidden my-8 print:border-none print:shadow-none print:m-0 print:max-w-none">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-sadu-linen px-6 py-4 border-b border-sadu-gold/50 flex items-center justify-between flex-wrap gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sadu-brick" />
            <div>
              <h2 className="font-editorial text-base font-bold text-sadu-charcoal">
                {isAr ? 'معاينة طلب عروض أسعار تجريبي' : 'Sample RFQ preview'}
              </h2>
              <span className="text-[11px] text-sadu-muted font-mono">
                {isAr ? 'سيناريو مشتريات افتراضي · لم يُصدر' : 'Fictional procurement scenario · not issued'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Scope Switcher */}
            <div className="flex items-center bg-sadu-sand rounded-md p-0.5 border border-sadu-gold text-xs">
              <button
                type="button"
                onClick={() => setSelectedScope('bronze_plinth')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  selectedScope === 'bronze_plinth' 
                    ? 'bg-sadu-ink text-white font-bold' 
                    : 'text-sadu-charcoal hover:text-sadu-brick'
                }`}
              >
                {isAr ? 'تصنيع القاعدة البرونزية' : 'Bronze Plinth Fabrication'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedScope('catalogue_print')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  selectedScope === 'catalogue_print' 
                    ? 'bg-sadu-ink text-white font-bold' 
                    : 'text-sadu-charcoal hover:text-sadu-brick'
                }`}
              >
                {isAr ? 'طباعة الكتالوج (1000 نسخة)' : 'Catalogue Print (1k)'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedScope('fine_art_freight')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  selectedScope === 'fine_art_freight' 
                    ? 'bg-sadu-ink text-white font-bold' 
                    : 'text-sadu-charcoal hover:text-sadu-brick'
                }`}
              >
                {isAr ? 'الشحن والتفريغ الجمركي' : 'Fine Art Freight'}
              </button>
            </div>

            <button
              type="button"
              id="btn-print-rfq"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded bg-sadu-brick hover:bg-sadu-brick-dark text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              title={isAr ? 'طباعة أو تصدير المستند كملف PDF' : 'Print or Export as PDF'}
            >
              <Printer className="w-4 h-4 text-sadu-gold" />
              <span>{isAr ? 'طباعة المستند (PDF)' : 'Print / Export PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label={isAr ? 'إغلاق' : 'Close'}
              className="p-1.5 text-sadu-muted hover:text-sadu-brick rounded-md hover:bg-sadu-sand transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Formal Document Content */}
        <div className="p-8 sm:p-10 space-y-6 text-sadu-charcoal bg-white font-serif leading-relaxed print:p-6 print:text-black">
          <p className="font-sans font-bold text-sm border p-3">{isAr ? 'عينة توضيحية غير معتمدة — ليست دعوة رسمية لتقديم عروض أو تفويضاً بالعمل.' : 'UNAPPROVED DEMONSTRATION — not an official solicitation or authorization to work.'}</p>
          {/* Government Document Header */}
          <div className="border-b-2 border-sadu-charcoal pb-6 flex items-start justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-widest text-sadu-muted font-sans block font-bold">
                GOVERNMENT OF SHARJAH · DEPARTMENT OF CULTURE
              </span>
              <h1 className="text-xl sm:text-2xl font-editorial font-bold text-sadu-charcoal">
                {isAr ? 'حكومة الشارقة — دائرة الثقافة' : 'Government of Sharjah — Department of Culture'}
              </h1>
              <p className="text-xs text-sadu-charcoal font-sans">
                {isAr ? 'إدارة الشؤون الثقافية · مكتب المشتريات والعقود' : 'Directorate of Cultural Affairs · Procurement & Contracts Bureau'}
              </p>
            </div>

            <div className="text-end space-y-1 font-sans text-xs">
              <div className="inline-block px-3 py-1 bg-sadu-linen border border-sadu-gold rounded font-mono font-bold text-sadu-ink">
                {rfqNumber}
              </div>
              <div className="text-[11px] text-sadu-muted">
                {isAr ? 'تاريخ تجريبي: 17 سبتمبر 2026' : 'Sample date: 17 September 2026'}
              </div>
              <div className="text-[11px] text-sadu-muted font-mono">
                {isAr ? 'مرجعية النطاق: v1.2 (المصادق عليه)' : 'Scope Reference: Approved Scope v1.2'}
              </div>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center py-2 bg-sadu-sand/40 border border-sadu-gold/60 rounded">
            <h2 className="text-base sm:text-lg font-editorial font-bold text-sadu-charcoal uppercase tracking-wider">
              {isAr ? 'طلب عروض أسعار تجريبي (RFQ)' : 'Sample Request for Quotation (RFQ)'}
            </h2>
            <span className="text-xs font-sans text-sadu-muted block mt-0.5">
              {isAr ? "موجز مشتريات تجريبي · يلزم التحقق من السياسة والصلاحية المنطبقتين" : "Sample procurement brief · applicable policy and authority require validation"}
            </span>
          </div>

          {/* Sample notice retained in print */}
          <div className="p-4 rounded-md border-2 border-sadu-brick bg-rose-50/70 text-sadu-brick font-sans text-xs space-y-2">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-sadu-brick shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold uppercase tracking-wide block text-[11px]">
                  {isAr ? "ملاحظة سيناريو · لا يُنشأ أمر أو التزام" : "SCENARIO NOTE — NO ORDER OR COMMITMENT IS CREATED"}
                </span>
                <p className="leading-relaxed font-medium">
                  {isAr
                    ? 'طلب عروض أسعار تجريبي — لم يُصدر أو يُرسل. لا تنشئ المعاينة أمراً أو توقيعاً أو التزاماً مالياً. يلزم التحقق من سياسة المشتريات والتفويض المنطبقين قبل الاستخدام الفعلي.'
                    : 'Sample RFQ — not issued or transmitted. This preview creates no order, signature or financial commitment. Applicable procurement policy and delegation require verification before real use.'}
                </p>
                <div className="pt-1 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                  <span className="text-sadu-charcoal font-semibold">
                    {isAr ? 'افتراض سيناريو: مراجعة الأمر والصلاحية المفوضة المنطبقين قبل الإذن بالعمل.' : 'Scenario assumption: review the applicable order and delegated authority before authorizing work.'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyNotice}
                    className="inline-flex items-center gap-1 text-[10px] text-sadu-brick underline hover:text-sadu-brick-dark font-mono cursor-pointer print:hidden"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ نص الإشعار' : 'Copy Notice Text')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Scope Specifications (Extracted directly from Approved Scope v1.2) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-sadu-gold pb-1 font-sans">
              <Layers className="w-4 h-4 text-sadu-brick" />
              <h3 className="font-bold text-sm text-sadu-charcoal uppercase tracking-wider">
                {isAr ? 'المواصفات الفنية المعتمدة من النطاق المثبت (v1.2)' : 'Technical Specifications Bound to Approved Scope (v1.2)'}
              </h3>
            </div>

            {selectedScope === 'bronze_plinth' && (
              <div className="space-y-3 font-sans text-xs">
                <div className="grid sm:grid-cols-2 gap-4 p-4 bg-sadu-sand/50 rounded border border-sadu-gold">
                  <div>
                    <span className="text-sadu-muted block text-[11px]">{isAr ? 'العمل الفني المرتبط:' : 'Linked Artwork:'}</span>
                    <span className="font-bold text-sadu-charcoal">{bronzeArtwork.canonicalCode} · {isAr ? bronzeArtwork.titleAr : bronzeArtwork.titleEn}</span>
                  </div>
                  <div>
                    <span className="text-sadu-muted block text-[11px]">{isAr ? 'الفنان المشارك المعتمد:' : 'Confirmed Artist:'}</span>
                    <span className="font-bold text-sadu-charcoal">{isAr ? bronzeArtwork.artistNameAr : bronzeArtwork.artistNameEn}</span>
                  </div>
                  <div>
                    <span className="text-sadu-muted block text-[11px]">{isAr ? 'الأبعاد والوزن الصافي:' : 'Artwork Dimensions & Net Mass:'}</span>
                    <span className="font-mono font-bold text-sadu-ink">{bronzeArtwork.dimensionsCm} · {formatNumber(bronzeArtwork.weightKg)} kg</span>
                  </div>
                  <div>
                    <span className="text-sadu-muted block text-[11px]">{isAr ? 'موقع العرض بالمتحف:' : 'Exhibition Location:'}</span>
                    <span className="font-bold text-sadu-charcoal">{isAr ? bronzeArtwork.locationAr : bronzeArtwork.locationEn}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-sadu-charcoal">{isAr ? 'نطاق العمل ومحددات التصنيع الهندسية المطلوبة:' : 'Mandatory Engineering Fabrication SOW:'}</h4>
                  <ul className="list-disc list-inside space-y-1.5 text-sadu-charcoal ps-2 text-xs leading-relaxed">
                    <li>
                      <strong>{isAr ? 'صفيحة توزيع الحمل الإنشائي:' : 'Load Dispersion Base Plate:'}</strong> {isAr ? 'صفيحة فولاذية مدرفلة على البارد بقطر 60 سم وسماكة 8 ملم بدقة قص بالليزر (CNC).' : 'Cold-rolled structural carbon steel plate, 60cm diameter, 8mm calibrated thickness, precision CNC laser-cut.'}
                    </li>
                    <li>
                      <strong>{isAr ? 'طبقة اللباد العازل للترميم:' : 'Historical Floor Protection:'}</strong> {isAr ? 'لباد صوفي عازل عالي الكثافة سماكة 5 ملم لحماية بلاط متحف الشارقة للفنون التاريخي ومنع الاحتكاك.' : '5mm high-density archival needle-punch wool felt underlay to prevent micro-abrasions to museum floor tiles.'}
                    </li>
                    <li>
                      <strong>{isAr ? 'طوق الحماية والأمان:' : 'Modular Security Barrier:'}</strong> {isAr ? 'حاجز حماية دائري من الفولاذ المقاوم للصدأ المطفي بقطر 150 سم (نصف قطر 75 سم) مع مثبتات غير نافذة للأرضية.' : 'Circular architectural stainless steel barrier ring at 75cm radius, matte satin finish, non-invasive floor fasteners.'}
                    </li>
                    <li>
                      <strong>{isAr ? 'الحد الأقصى للضغط الإنشائي المسموح:' : 'Allowable Structural Floor Pressure:'}</strong> {isAr ? 'يجب ألا يتجاوز الضغط الموضعي 0.12 كجم/سم²، ومصادق عليه من مهندس استشاري معتمد.' : 'Floor load pressure must not exceed 0.12 kg/cm² certified by licensed structural engineer.'}
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {selectedScope === 'catalogue_print' && (
              <div className="space-y-3 font-sans text-xs">
                <div className="grid sm:grid-cols-2 gap-4 p-4 bg-sadu-sand/50 rounded border border-sadu-gold">
                  <div>
                    <span className="text-sadu-muted block text-[11px]">{isAr ? 'المنشور المؤسسي:' : 'Publication Item:'}</span>
                    <span className="font-bold text-sadu-charcoal">{isAr ? 'كتالوج بينالي الشارقة للخط — الطبعة الرسمية الأولى' : 'Sharjah Calligraphy Biennial — Official Exhibition Catalogue'}</span>
                  </div>
                  <div>
                    <span className="text-sadu-muted block text-[11px]">{isAr ? 'الكمية الإلزامية:' : 'Exact Print Run:'}</span>
                    <span className="font-mono font-bold text-sadu-ink">{formatNumber(1000)} {isAr ? 'نسخة مجلدة فاخرة' : 'Hardcover Copies'}</span>
                  </div>
                  <div>
                    <span className="text-sadu-muted block text-[11px]">{isAr ? 'عدد الصفحات واللغات:' : 'Pagination & Languages:'}</span>
                    <span className="font-bold text-sadu-charcoal">{isAr ? '280 صفحة ملونة بالكامل · ثنائي اللغة (عربي / إنجليزي)' : '280 Pages Full Color · Bilingual (AR/EN)'}</span>
                  </div>
                  <div>
                    <span className="text-sadu-muted block text-[11px]">{isAr ? 'موعد التسليم النهائي للمستودع:' : 'Warehouse Delivery Deadline:'}</span>
                    <span className="font-bold text-sadu-brick">{isAr ? '30 سبتمبر 2026 (قبل الافتتاح بأسبوعين)' : '30 September 2026 (2 Weeks Pre-Vernissage)'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-sadu-charcoal">{isAr ? 'المواصفات المطبعية والتجليد المعتمدة:' : 'Printing & Finishing Specifications:'}</h4>
                  <ul className="list-disc list-inside space-y-1.5 text-sadu-charcoal ps-2 text-xs leading-relaxed">
                    <li>{isAr ? 'الغلاف الخارجي: قماش كتان هولندي طبيعي بلون السدو الرملي مع بصمة ذهبية حرارية (Hot Foil Stamping).' : 'Cover: Dutch natural linen cloth (Sadu Sand hue) with custom gold hot-foil debossing.'}</li>
                    <li>{isAr ? 'الورق الداخلي: ورق آرت غير لامع مطفأ خالي من الأحماض 170 جم/م² (FSC Certified Acid-free).' : 'Inside Pages: 170 gsm FSC-certified acid-free matte art paper with spot UV varnish on color plates.'}</li>
                    <li>{isAr ? 'التجليد: خياطة حريرية كاملة مع كعب مقوس وشريط قماشي فاخر.' : 'Binding: Thread-sewn casebound with round spine and dual silk bookmark ribbons.'}</li>
                    <li>{isAr ? 'بروفة لونية معتمدة: إلزامية قبل بدء السحب الشامل، بمصادقة المنسق الفني وفريق التحرير.' : 'Mandatory Wet Proof Sign-off: Must be officially inspected and signed off by Editorial Lead prior to press run.'}</li>
                  </ul>
                </div>
              </div>
            )}

            {selectedScope === 'fine_art_freight' && (
              <div className="space-y-3 font-sans text-xs">
                <div className="grid sm:grid-cols-2 gap-4 p-4 bg-sadu-sand/50 rounded border border-sadu-gold">
                  <div>
                    <span className="text-sadu-muted block text-[11px]">{isAr ? 'مسار الشحن الدولي:' : 'International Freight Route:'}</span>
                    <span className="font-bold text-sadu-charcoal">{isAr ? 'باريس / جنيف إلى مطار الشارقة الدولي ثم متحف الشارقة للفنون' : 'Paris / Geneva to Sharjah International (SHJ) & Art Museum'}</span>
                  </div>
                  <div>
                    <span className="text-sadu-muted block text-[11px]">{isAr ? 'القيمة التأمينية التراكمية:' : 'Total Declared Insurance Value:'}</span>
                    <span className="font-mono font-bold text-sadu-ink">{formatCurrency(85000, 'USD')}</span>
                  </div>
                  <div>
                    <span className="text-sadu-muted block text-[11px]">{isAr ? 'شروط الرطوبة والحرارة:' : 'Climate Control Requirements:'}</span>
                    <span className="font-bold text-sadu-charcoal">20°C ± 2°C · 50% RH ± 5% Continuous Datalogger</span>
                  </div>
                  <div>
                    <span className="text-sadu-muted block text-[11px]">{isAr ? 'بروتوكول التفريغ:' : 'Unpacking Protocol:'}</span>
                    <span className="font-bold text-sadu-charcoal">{isAr ? 'غرفة حجر مكيفة لمدة 24 ساعة قبل فتح الصناديق' : '24h Acclimatization Chamber prior to uncrating'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Illustrative procurement checks */}
          <div className="p-4 bg-sadu-sand/30 rounded border border-sadu-gold/50 font-sans text-xs space-y-2.5">
            <h4 className="font-bold text-sadu-charcoal text-xs flex items-center gap-2">
              <Scale className="w-4 h-4 text-sadu-ink" />
              <span>{isAr ? "فحوص سيناريو مقترحة · ليست سياسة شراء موثقة:" : "Proposed scenario checks · not verified procurement policy:"}</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-sadu-charcoal text-[11px]">
              <li>
                <strong>{isAr ? 'التسجيل الحكومي المسبق:' : 'Active Supplier Registration:'}</strong> {isAr ? "فحص تجريبي: تتطلب أدلة تسجيل المورد مراجعة وفق السياسة المنطبقة." : "Sample check: supplier registration evidence requires review under the applicable policy."}
              </li>
              <li>
                <strong>{isAr ? 'مثال مقارنة ثلاثة عروض:' : 'Three-quotation sample:'}</strong> {isAr ? "يقارن هذا المثال ثلاثة عروض تجريبية. يلزم تأكيد الحدود والمراجعين الفعليين." : "This example compares three sample quotations. Actual thresholds and reviewers require confirmation."}
              </li>
              <li>
                <strong>{isAr ? 'فصل التقييم الفني عن المالي:' : 'Bifurcated Technical & Financial Vetting:'}</strong> {isAr ? "تسلسل مقترح: مراجعة الملاءمة الفنية بصورة مستقلة عن التكلفة." : "Proposed sequence: review technical suitability separately from cost."}
              </li>
              <li>
                <strong>{isAr ? 'مراجعة أمر الشراء:' : 'Order review:'}</strong> {isAr ? "لا تنشئ هذه المعاينة أمر شراء فعلياً أو التزاماً بالميزانية أو دفعاً." : "No actual order, budget commitment or payment is created by this preview."}
              </li>
            </ol>
          </div>

          {/* Sample reviewer placeholders */}
          <div className="pt-6 border-t border-sadu-charcoal/40 grid grid-cols-2 sm:grid-cols-3 gap-6 font-sans text-xs">
            <div>
              <span className="text-[10px] text-sadu-muted block uppercase">{isAr ? "مسؤولية مقترحة · تجريبي" : "Proposed responsibility · sample"}</span>
              <span className="font-bold text-sadu-charcoal block mt-1">{INSTITUTIONAL_INFO.directorateEn}</span>
              <span className="text-[11px] text-sadu-muted">{INSTITUTIONAL_INFO.departmentEn}</span>
            </div>
            <div>
              <span className="text-[10px] text-sadu-muted block uppercase">{isAr ? 'التدقيق الفني الهندسي' : 'Technical Lead Sign-off'}</span>
              <span className="font-bold text-sadu-charcoal block mt-1">{isAr ? 'مراجع فني تجريبي' : 'Sample technical reviewer'}</span>
              <span className="text-[11px] text-emerald-700 font-semibold">{isAr ? 'فحص نطاق تجريبي (v1.2)' : 'Sample scope check (v1.2)'}</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] text-sadu-muted block uppercase">{isAr ? 'مكتب التدقيق المالي' : 'Finance Review'}</span>
              <span className="font-bold text-sadu-charcoal block mt-1">{isAr ? 'مراجع مالي تجريبي' : 'Sample finance reviewer'}</span>
              <span className="text-[11px] text-sadu-brick font-semibold">{isAr ? 'مثال مقارنة ثلاثة عروض' : 'Three-quotation sample'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-sadu-linen px-6 py-3 border-t border-sadu-gold/40 flex items-center justify-between text-xs font-sans text-sadu-muted print:hidden">
          <span className="font-mono text-[11px]">
            {isAr ? 'النظام المؤسسي: سدو · وثيقة شراء موثقة رقمياً' : 'SADU System · Authenticated Government Procurement Record'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-sadu-ink text-white hover:bg-sadu-charcoal text-xs font-semibold cursor-pointer"
          >
            {isAr ? 'إغلاق المعاينة' : 'Close Document'}
          </button>
        </div>
      </div>
    </div>
  );
};
