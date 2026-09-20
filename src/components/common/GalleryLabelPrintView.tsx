import React from 'react';
import { PrintWrapper, printDocument } from './PrintWrapper';
import { EditorialItem, ExhibitionProgramme } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { Printer, X, Tag, FileText, CheckCircle2 } from 'lucide-react';

export interface GalleryLabelPrintViewProps {
  items: EditorialItem[];
  selectedProgramme?: ExhibitionProgramme;
  onClose: () => void;
}

export const GalleryLabelPrintView: React.FC<GalleryLabelPrintViewProps> = ({
  items,
  selectedProgramme,
  onClose,
}) => {
  const { lang, formatNumber } = useI18n();
  const isAr = lang === 'ar';

  const readyItems = items.filter(item => item.status === 'ready_for_print');

  const handlePrint = () => {
    void printDocument();
  };

  const exhibitionTitleEn = selectedProgramme?.titleEn || '11th Sharjah Calligraphy Biennial';
  const exhibitionTitleAr = selectedProgramme?.titleAr || 'بينالي الشارقة للخط — الدورة الحادية عشرة';
  const venueEn = selectedProgramme?.venueEn || 'Sharjah Art Museum (Bait Al Serkal)';
  const venueAr = selectedProgramme?.venueAr || 'متحف الشارقة للفنون (بيت السركال)';

  return (
    <PrintWrapper><div
      id="gallery-label-print-view"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col items-center overflow-y-auto p-4 sm:p-6 print:static print:bg-transparent print:p-0 print:overflow-visible print:z-auto print:block"
    >
      {/* Non-printed Toolbar */}
      <div className="w-full max-w-5xl bg-white border border-sadu-gold rounded-lg p-4 mb-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sadu-sand rounded-lg border border-sadu-gold/60 text-sadu-brick">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-editorial text-base sm:text-lg font-bold text-sadu-charcoal">
                {isAr ? 'محرك بطاقات العرض الجدارية (Gallery Label Engine)' : 'Museum Gallery Label Engine'}
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-sadu-sage/20 text-sadu-ink border border-sadu-sage flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-sadu-sage" />
                <span>{formatNumber(readyItems.length)} {isAr ? 'بطاقة جاهزة' : 'Labels Ready'}</span>
              </span>
            </div>
            <p className="text-xs text-sadu-muted mt-0.5">
              {isAr
                ? 'تخطيط تجريبي: 15 سم × 10 سم · الأبعاد والخطوط خيارات تصميم؛ اعتماد النموذج المؤسسي غير موثق'
                : 'Sample layout: 15cm × 10cm · dimensions and typography are design choices; institutional template approval unverified'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-sadu-brick hover:bg-sadu-brick-dark text-white rounded-md font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer active:scale-98"
            title={isAr ? 'طباعة مباشرة أو حفظ كملف PDF' : 'Print directly or Save as PDF'}
          >
            <Printer className="w-4 h-4 text-sadu-gold" />
            <span>{isAr ? 'طباعة البطاقات (PDF)' : 'Print Labels (PDF)'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-sadu-charcoal hover:bg-sadu-sand rounded-md border border-sadu-gold/60 transition-colors cursor-pointer"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Print Instructions Banner (Screen only) */}
      <div className="w-full max-w-5xl bg-sadu-linen border border-sadu-gold/70 rounded-md p-3 mb-6 text-xs text-sadu-charcoal flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-sadu-brick shrink-0" />
          <span>
            {isAr
              ? 'للطباعة: اختر ورق A4 عمودياً ومقياس 100%، وأوقف رؤوس الصفحات وتذييلاتها. الأبعاد المستهدفة 15 سم × 10 سم؛ تحقق من نسخة مطبوعة قبل الإنتاج.'
              : 'Print on A4 portrait at 100% scale with browser headers and footers off. Target size: 15cm × 10cm; check a physical proof before production.'}
          </span>
        </div>
        <span className="font-mono text-[11px] text-sadu-muted hidden sm:inline">
          SADU sample layout
        </span>
      </div>

      {/* Grid of Physical Museum Wall Labels (Print & Screen Canvas) */}
      <div className="w-full max-w-5xl bg-neutral-100 p-6 sm:p-8 rounded-xl print:bg-transparent print:p-0 print:max-w-none">
        {readyItems.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-lg border border-gray-200">
            <Tag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">
              {isAr ? 'لا توجد أعمال في حالة "جاهز للطباعة" حالياً' : 'No artworks currently in "Catalogue Ready" status'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {isAr ? 'قم باعتماد الترجمة الإنجليزية في مسار التحرير أولاً' : 'Complete the English translation in the Editorial Kanban board first'}
            </p>
          </div>
        ) : (
          <div className="gallery-label-grid grid grid-cols-1 md:grid-cols-2 gap-8 print:p-0 place-items-center">
            {readyItems.map(item => (
              <div
                key={item.id}
                className="gallery-label w-[15cm] min-h-[10cm] max-w-full p-6 bg-white border border-gray-300 rounded-sm shadow-md print:shadow-none print:border-gray-400 page-break-inside-avoid relative flex flex-col justify-between box-border select-text text-gray-900"
                style={{ breakInside: 'avoid' }}
              >
                <p className="text-[9px] font-sans text-gray-600">{isAr ? 'عينة غير معتمدة · الأبعاد والخطوط خيارات تصميم تجريبية' : 'UNAPPROVED SAMPLE · dimensions and typography are design choices'}</p>
                {/* Crop & Registration Marks for Plotter/Printer (Corner Guides) */}
                <span className="absolute top-1 start-1 w-2 h-2 border-t border-s border-gray-400 opacity-60 print:opacity-100 pointer-events-none" />
                <span className="absolute top-1 end-1 w-2 h-2 border-t border-e border-gray-400 opacity-60 print:opacity-100 pointer-events-none" />
                <span className="absolute bottom-1 start-1 w-2 h-2 border-b border-s border-gray-400 opacity-60 print:opacity-100 pointer-events-none" />
                <span className="absolute bottom-1 end-1 w-2 h-2 border-b border-e border-gray-400 opacity-60 print:opacity-100 pointer-events-none" />

                {/* TOP HALF: ARABIC SECTION (RTL) */}
                <div dir="rtl" className="text-start space-y-1">
                  <h3 className="text-lg font-bold font-serif text-gray-950 tracking-normal leading-snug">
                    {item.artworkTitleAr}
                  </h3>
                  <p className="text-sm text-gray-700 font-sans">
                    {item.mediumAr}
                  </p>
                  <p className="text-sm text-gray-600 font-sans font-normal">
                    <bdi dir={item.dimensionsAr ? 'rtl' : 'ltr'}>{item.dimensionsAr ?? item.dimensions}</bdi>{' · '}<bdi dir="ltr">{item.year}</bdi>
                  </p>
                </div>

                {/* Subtle Divider Line */}
                <div className="border-t border-gray-200 my-2 print:border-gray-300" />

                {/* BOTTOM HALF: ENGLISH SECTION (LTR) */}
                <div dir="ltr" className="text-start space-y-1">
                  <h3 className="text-lg font-bold font-serif text-gray-950 tracking-normal leading-snug">
                    {item.artworkTitleEn}
                  </h3>
                  <p className="text-sm text-gray-700 font-sans">
                    {item.mediumEn}
                  </p>
                  <p className="text-sm text-gray-600 font-sans font-normal">
                    {item.dimensions} · {item.year}
                  </p>
                </div>

                {/* CARD FOOTER: Artist Name & Exhibition Reference for Print Verification */}
                <div className="border-t border-gray-100 print:border-gray-200 pt-2 mt-auto flex items-center justify-between text-[9px] text-gray-400 print:text-gray-500 uppercase tracking-widest font-mono">
                  <span className="font-semibold text-gray-600 print:text-gray-700">
                    {item.artistName}
                  </span>
                  <span className="max-w-[240px] text-end">
                    {exhibitionTitleEn} · {venueEn.split('(')[0].trim()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div></PrintWrapper>
  );
};
