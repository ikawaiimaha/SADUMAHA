import React, { useRef } from 'react';
import { PrintWrapper, printDocument } from './PrintWrapper';
import { 
  FileDown, 
  Printer, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  Filter, 
  Check 
} from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { KpiSummaryMetric, ReportFilterMetadata, downloadInstitutionalPdfReport, requiresBrowserPrint } from '../../utils/pdfExport';

export interface ReportItemRecord {
  id: string;
  title: string;
  category?: string;
  priority?: string;
  status: string;
  assigneeOrArtist?: string;
  dueDateOrProgress?: string;
  dimensions?: string;
}

export interface PrintableReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: ReportFilterMetadata;
  metrics: KpiSummaryMetric[];
  records: ReportItemRecord[];
}

export const PrintableReportModal: React.FC<PrintableReportModalProps> = ({
  isOpen,
  onClose,
  metadata,
  metrics,
  records,
}) => {
  const i18n = useI18n();
  const isAr = i18n.lang === 'ar';
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloadSuccess, setDownloadSuccess] = React.useState(false);

  const [refCode] = React.useState(() => `DEMO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const isBaseline = metadata.scopeMode === 'unfiltered-sample';
  const arabicLabels: Record<string, string> = {
    coordinator: 'التنسيق', leadership: 'القيادة', operations: 'العمليات',
    all: 'جميع الحالات', 'at-risk': 'معرض للمخاطر', completed: 'مكتمل', committed: 'التزامات مسجلة',
    planning: 'التخطيط', production: 'الإنتاج', installed: 'اكتمل التركيب', concluded: 'اختُتم',
    pending: 'معلق', resolved: 'عولج', escalated: 'محال إلى مستوى أعلى',
    pristine: 'سليم', discrepancy_reported: 'اختلاف مسجل',
  };
  const displayLabel = (value: string) => isAr ? (arabicLabels[value] ?? value) : value;
  const baselineTitle = isAr ? 'تقرير العمليات الشامل (غير مفلتر)' : 'Global Operations Report (Unfiltered)';
  const needsPrint = isAr || requiresBrowserPrint(metadata, metrics, records);
  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    if (needsPrint) { void printDocument(); return; }
    downloadInstitutionalPdfReport(metadata, metrics, records);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleBrowserPrint = () => {
    void printDocument();
  };

  const currentDateStr = new Date().toLocaleDateString(isAr ? 'ar-AE-u-ca-gregory-nu-arab' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });



  return (
    <PrintWrapper><div data-report-overlay className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-sadu-ink/75 backdrop-blur-xs overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        className="bg-sadu-linen border border-sadu-gold rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-sadu-charcoal animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Action Header (Excluded from Print) */}
        <div className="px-5 py-3.5 bg-sadu-sand border-b border-sadu-gold/60 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-sadu-ink text-white flex items-center justify-center shadow-xs">
              <FileDown className="w-4 h-4 text-sadu-gold" />
            </div>
            <div>
              <h2 id="report-modal-title" className="text-sm font-bold font-editorial text-sadu-charcoal">
                {isBaseline ? baselineTitle : (isAr ? 'تقرير المؤشرات المؤسسي القابل للطباعة والتحميل' : 'Institutional KPI Audit Report & Print Document')}
              </h2>
              <p className="text-[11px] text-sadu-muted">
                {isBaseline ? (isAr ? 'بيانات تجريبية ثابتة النطاق؛ حالات مؤقتة' : 'Fixed sample dataset; temporary session states') : (isAr ? `تقرير تجريبي غير معتمد — عدد السجلات وفق التصفية الحالية: ${i18n.formatNumber(records.length)}` : `Unapproved sample report (${records.length} records matching current filter)`)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {downloadSuccess && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-sadu-sage bg-sadu-sage-light px-2.5 py-1 rounded">
                <Check className="w-3.5 h-3.5" />
                <span>{isAr ? 'تم تنزيل ملف PDF بنجاح' : 'PDF Downloaded!'}</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3.5 py-2 text-xs font-bold rounded-md bg-sadu-brick text-white hover:bg-sadu-brick-dark transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title={isAr ? 'طباعة التقرير أو حفظه بصيغة PDF' : 'Download or print report'}
            >
              <FileDown className="w-4 h-4" />
              <span>{needsPrint ? (isAr ? 'طباعة أو حفظ PDF' : 'Print / Save PDF') : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleBrowserPrint}
              className="px-3 py-2 text-xs font-bold rounded-md bg-sadu-ink text-white hover:bg-sadu-ink-dark transition-colors flex items-center gap-1.5 cursor-pointer"
              title={isAr ? 'طباعة المستند أو حفظه من نافذة المتصفح' : 'Print document or save using browser dialog'}
            >
              <Printer className="w-4 h-4 text-sadu-gold" />
              <span>{isAr ? 'طباعة المستند' : 'Print View'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-sadu-muted hover:text-sadu-charcoal hover:bg-sadu-sand-dark rounded-md transition-colors cursor-pointer"
              aria-label={isAr ? 'إغلاق التقرير' : 'Close modal'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body (Printable Container) */}
        <div className="p-6 sm:p-8 overflow-y-auto print:p-0 print:overflow-visible">
          <div 
            ref={reportRef}
            className="printable-report-content bg-white p-6 sm:p-10 rounded-lg border border-sadu-gold/40 shadow-xs max-w-3xl mx-auto space-y-6 print:border-none print:shadow-none print:p-0 print:max-w-none text-sadu-charcoal"
          >
            {/* Sadu Top Accent Bar */}
            <div className="h-2 w-full bg-sadu-brick rounded-t" />

            {/* Official Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-sadu-gold/60 pb-5">
              <div>
                <div className="flex items-center gap-2 text-sadu-brick font-bold text-xs uppercase tracking-wider mb-1">
                  <Building2 className="w-4 h-4" />
                  <span>{isAr ? 'منصة سدو للفنون واللجان المؤسسية' : 'SADU ART PLATFORM & INSTITUTIONAL COMMISSIONS'}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-editorial font-bold text-sadu-charcoal">
                  {isBaseline ? baselineTitle : (isAr ? 'سجل التدقيق والمؤشرات التنفيذية' : 'Institutional Audit & Executive KPI Ledger')}
                </h1>
                <p className="text-xs text-sadu-muted mt-0.5">
                  {metadata.programmeName}
                </p>
              </div>

              <div className="sm:text-end text-xs space-y-0.5 font-mono text-sadu-muted shrink-0">
                <div className="font-bold text-sadu-brick text-sm">{isBaseline ? 'DEMO-OPS-BASELINE-26' : refCode}</div>
                <div>{currentDateStr}</div>
                <div className="text-[10px] bg-sadu-sand text-sadu-ink px-2 py-0.5 rounded inline-block font-sans font-semibold mt-1">
                  {isAr ? 'تقرير تجريبي — غير معتمد' : 'SAMPLE — NOT VERIFIED'}
                </div>
              </div>
            </div>

            {isBaseline && <p role="note" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
              {isAr ? 'يعرض التقرير جميع سجلات السيناريو التجريبي بصرف النظر عن البرنامج أو التبويب المختار. المؤشرات من حالة الجلسة نفسها وليست نتائج مؤسسية.' : 'This report includes every record in the fixed sample dataset, independent of the selected programme or tab. Indicators reflect this session, not institutional results.'}
            </p>}

            {/* Filter Scope & Audit Context Card */}
            <div className="bg-sadu-sand/40 border border-sadu-gold/60 rounded-md p-4 grid sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-sadu-muted block text-[10px] font-bold uppercase tracking-wider">
                  {isAr ? 'نطاق مساحة العمل' : 'Workspace Domain'}
                </span>
                <span className="font-bold text-sadu-charcoal capitalize">
                  {isBaseline ? (isAr ? 'عمليات تجريبية' : 'Sample operations') : (isAr ? `مساحة ${displayLabel(metadata.workspaceType)}` : `${metadata.workspaceType} Console`)}
                </span>
              </div>

              <div>
                <span className="text-sadu-muted block text-[10px] font-bold uppercase tracking-wider">
                  {isBaseline ? (isAr ? 'نطاق السجلات' : 'Record scope') : (isAr ? 'تصفية الحالة النشطة' : 'Active Status Filter')}
                </span>
                <span className="font-bold text-sadu-brick capitalize flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  {isBaseline ? (isAr ? 'جميع سجلات السيناريو' : 'All scenario records') : displayLabel(metadata.statusFilter)}
                </span>
              </div>

              <div>
                <span className="text-sadu-muted block text-[10px] font-bold uppercase tracking-wider">
                  {isAr ? 'إجمالي السجلات المطابقة' : 'Records In Audit Scope'}
                </span>
                <span className="font-bold text-sadu-charcoal font-mono">
                  {isAr ? `عدد السجلات${isBaseline ? ' التجريبية' : ''}: ${i18n.formatNumber(records.length)}` : `${records.length} ${isBaseline ? 'sample records' : 'sample items'}`}
                </span>
              </div>
            </div>

            {/* KPI Benchmarks Grid */}
            <div>
              <h3 className="text-xs font-bold text-sadu-ink uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sadu-brick" />
                <span>{isBaseline ? (isAr ? 'مؤشرات تجريبية لهذه الجلسة' : 'Session sample indicators') : (isAr ? 'ملخص مؤشرات الأداء الحالية (KPIs)' : 'Current KPI Executive Benchmarks')}</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {metrics.map((m, i) => (
                  <div key={i} className="p-3 bg-sadu-linen border border-sadu-gold/60 rounded-md text-xs">
                    <span className="text-[10px] text-sadu-muted block font-medium truncate">
                      {m.label}
                    </span>
                    <span className="text-base font-bold text-sadu-charcoal font-mono block mt-1">
                      {m.value}
                    </span>
                    {m.subtitle && (
                      <span className="text-[9px] text-sadu-muted block mt-0.5 truncate">
                        {m.subtitle}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Itemized Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-sadu-ink uppercase tracking-wider">
                  {isBaseline ? (isAr ? 'جميع السجلات التجريبية (غير مفلترة)' : 'All sample records (unfiltered)') : (isAr ? 'بيانات السجلات المندرجة ضمن نطاق التصفية' : 'Itemized Scope Records (Current Filtered View)')}
                </h3>
                <span className="text-[11px] text-sadu-muted font-mono">
                  {isAr ? `عدد السجلات: ${i18n.formatNumber(records.length)}` : `${records.length} items`}
                </span>
              </div>

              <div className="border border-sadu-gold/60 rounded-md overflow-x-auto text-xs">
                <table className="w-full text-start border-collapse">
                  <thead>
                    <tr className="bg-sadu-sand text-[11px] font-bold text-sadu-charcoal border-b border-sadu-gold/60">
                      <th className="py-2 px-3">{isAr ? 'المرجع' : 'Ref / ID'}</th>
                      <th className="py-2 px-3">{isAr ? 'الفئة' : 'Category'}</th>
                      <th className="py-2 px-3">{isAr ? 'عنوان البند / المطلب' : 'Item / Requirement'}</th>
                      <th className="py-2 px-3">{isAr ? 'المسؤول / الفنان' : 'Assignee / Artist'}</th>
                      <th className="py-2 px-3">{isBaseline ? (isAr ? 'الأبعاد' : 'Dimensions') : (isAr ? 'الموعد' : 'Due / Milestone')}</th>
                      <th className="py-2 px-3">{isAr ? 'الحالة' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sadu-gold/30">
                    {records.length > 0 ? (
                      records.map((r, index) => (
                        <tr key={r.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-sadu-linen/50'}>
                          <td className="py-2 px-3 font-mono text-[10px] text-sadu-muted">{r.id}</td>
                          <td className="py-2 px-3 capitalize font-medium">{r.category || '-'}</td>
                          <td className="py-2 px-3 font-bold text-sadu-charcoal max-w-xs break-words">{r.title}</td>
                          <td className="py-2 px-3 text-sadu-muted">{r.assigneeOrArtist || '-'}</td>
                          <td className="py-2 px-3 font-mono text-[11px]"><bdi>{(isBaseline ? r.dimensions : r.dueDateOrProgress) || '—'}</bdi></td>
                          <td className="py-2 px-3">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              r.status.toLowerCase().includes('critical') || r.status.toLowerCase().includes('escalated')
                                ? 'bg-rose-100 text-rose-900 border border-rose-200'
                                : r.status.toLowerCase().includes('resolved') || r.status.toLowerCase().includes('completed')
                                ? 'bg-sadu-sage-light text-sadu-ink border border-sadu-sage/50'
                                : 'bg-sadu-sand text-sadu-charcoal border border-sadu-gold/50'
                            }`}>
                              {displayLabel(r.status)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-sadu-muted">
                          {isBaseline ? (isAr ? 'لا توجد سجلات تجريبية.' : 'No sample records.') : (isAr ? 'لا توجد سجلات مطابقة للتصفية الحالية' : 'No records match the current filter criteria.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Institutional Signatures & Legal Footer */}
            <div className="border-t border-sadu-gold/60 pt-6 mt-8 space-y-4">
              {!isBaseline && <div className="grid grid-cols-3 gap-4 text-center">
                <div className="border-t border-dashed border-sadu-muted/60 pt-2">
                  <span className="text-[11px] font-bold block text-sadu-charcoal">
                    {isAr ? 'منسق الشؤون الفنية' : 'Curatorial Coordinator'}
                  </span>
                  <span className="text-[9px] text-sadu-muted block">
                    {isAr ? 'اعتماد النطاق والمطابقة' : 'Scope Verification'}
                  </span>
                </div>

                <div className="border-t border-dashed border-sadu-muted/60 pt-2">
                  <span className="text-[11px] font-bold block text-sadu-charcoal">
                    {isAr ? 'إدارة العمليات والهندسة' : 'Operations & Logistics'}
                  </span>
                  <span className="text-[9px] text-sadu-muted block">
                    {isAr ? 'الفحص الهيكلي والسلامة' : 'Structural & Transport Audit'}
                  </span>
                </div>

                <div className="border-t border-dashed border-sadu-muted/60 pt-2">
                  <span className="text-[11px] font-bold block text-sadu-charcoal">
                    {isAr ? 'مكتب الجودة والرقابة' : 'Institutional Compliance'}
                  </span>
                  <span className="text-[9px] text-sadu-muted block">
                    {isAr ? 'مراجعة أرشيفية مقترحة' : 'Proposed records review'}
                  </span>
                </div>
              </div>}

              <div className="text-[10px] text-sadu-muted text-center pt-2 font-mono">
                {isAr
                  ? 'تقرير تجريبي من نموذج سدو • لا يمثل اعتماداً أو توقيعاً مؤسسياً'
                  : 'SADU PROTOTYPE OUTPUT • SAMPLE DATA • NO INSTITUTIONAL APPROVAL OR SIGNATURE'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div></PrintWrapper>
  );
};
