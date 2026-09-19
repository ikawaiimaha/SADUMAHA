import React, { useState } from 'react';
import { Language, ExhibitionProgramme, WorkspaceTab, ProcurementPackage, VendorBid } from '../../types';
import { ARTWORKS, INITIAL_PROCUREMENT_PACKAGES } from '../../data/mockData';
import { canRecordSampleTechnicalReview, recordSampleTechnicalReview, operationsBaselineRecords, type SampleTechnicalReview } from '../../data/legacyOperations';
import { useI18n } from '../../context/I18nContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { KpiCard } from '../common/KpiCard';
import { PrintableReportModal } from '../common/PrintableReportModal';
import { StatusProgressIndicator } from '../common/StatusProgressIndicator';
import { RfqGeneratorModal } from '../common/RfqGeneratorModal';
import { requiresBrowserPrint, downloadInstitutionalPdfReport, KpiSummaryMetric, ReportFilterMetadata } from '../../utils/pdfExport';
import { 
  Wrench, 
  Truck, 
  Plane, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  FileText,
  Clock,
  Layers,
  FileDown,
  Printer,
  BarChart3,
  BookOpen,
  Lock,
  Unlock,
  Building2,
  Scale,
  ShieldAlert,
  PlusCircle,
  ExternalLink,
  Award,
  AlertCircle,
  Sparkles,
  ChevronRight,
  FileSignature
} from 'lucide-react';
import { EditorialPipeline } from './EditorialPipeline';
import { ProcurementBiddingGate } from './ProcurementBiddingGate';

export interface OperationsViewProps {
  lang?: Language;
  selectedProgramme?: ExhibitionProgramme;
  onNavigateTab?: (tab: WorkspaceTab) => void;
  initialSubTab?: 'technical' | 'logistics' | 'visa' | 'finance' | 'editorial' | 'gate2' | 'procurement';
}

export const OperationsView: React.FC<OperationsViewProps> = (props) => {
  const i18n = useI18n();
  const workspace = useWorkspace();

  const lang = props.lang ?? i18n.lang;
  const isAr = lang === 'ar';
  const { formatNumber, formatPercent, formatRatio, formatCurrency, localizeDigits } = i18n;
  const selectedProgramme = props.selectedProgramme ?? workspace.selectedProgramme;
  const onNavigateTab = props.onNavigateTab ?? workspace.navigateTab;

  const defaultRoleSubTab = (): 'technical' | 'logistics' | 'visa' | 'finance' | 'editorial' | 'gate2' | 'procurement' => {
    if (props.initialSubTab) return props.initialSubTab;
    const role = workspace.currentRole;
    if (role === 'EDITORIAL') return 'editorial';
    if (role === 'PR_PROTOCOL' || role === 'PR_VISA') return 'visa';
    if (role === 'FINANCE') return 'procurement';
    if (role === 'LOGISTICS') return 'logistics';
    if (role === 'TECHNICAL_MUSEUM' || role === 'TECHNICAL') return 'technical';
    return 'technical';
  };

  const [subTab, setSubTab] = useState<'technical' | 'logistics' | 'visa' | 'finance' | 'editorial' | 'gate2' | 'procurement'>(defaultRoleSubTab);
  const [technicalReview, setTechnicalReview] = useState<SampleTechnicalReview | null>(null);
  const technicalReviewRecorded = Boolean(technicalReview);
  const canRecordTechnical = canRecordSampleTechnicalReview(workspace.currentRole);
  const technicalReviewLabel = isAr
    ? (technicalReviewRecorded ? 'سُجلت مراجعة فنية تجريبية' : 'بانتظار مراجعة فنية تجريبية')
    : (technicalReviewRecorded ? 'Sample technical review recorded' : 'Sample technical review pending');
  const [patinaReconciled, setPatinaReconciled] = useState(false);
  const [exhibitionOpened, setExhibitionOpened] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // PR & Protocol Digital Gate State (7 boolean flags for artist Youssef Nabhan)
  const [prFlags, setPrFlags] = useState({
    certificateNameVerified: true,
    exhibitionTitleLocked: true,
    bioApproved: true,
    portraitReceived: false, // Default pending
    nationalityConfirmed: true,
    socialMediaLogged: true,
    guestListSubmitted: false, // Default pending
  });

  const allPrFlagsChecked = Object.values(prFlags).every(Boolean);
  const [isPrProtocolCleared, setIsPrProtocolCleared] = useState(false);
  const isPrProtocolReady = isPrProtocolCleared || allPrFlagsChecked;

  // Gate 2 Operational Rubric (35 Points Max) & Red Flag Checklist
  const [operationalScores, setOperationalScores] = useState({
    completeness: 8, // max 10 (or 5 scaled)
    technicalFeasibility: 13, // max 15
    logisticsFeasibility: 9, // max 10
    budgetValue: 8, // max 10
  });

  const [redFlags, setRedFlags] = useState({
    unverifiedBudgetInflation: false,
    hazardousMaterialsWithoutPermit: false,
    inadequateCratingOrUninsurable: false,
  });

  const anyRedFlagActive = Object.values(redFlags).some(Boolean);
  
  // Calculate Operational Raw Score (out of 45, scaled to 35)
  const rawOperationalSum = operationalScores.technicalFeasibility + operationalScores.logisticsFeasibility + operationalScores.budgetValue;
  // If red flag is active, cap total operational score at 15
  const effectiveOperationalScore = anyRedFlagActive ? Math.min(rawOperationalSum, 15) : rawOperationalSum;

  // Government Procurement & Bidding State
  const [procurementPackages, setProcurementPackages] = useState<ProcurementPackage[]>(INITIAL_PROCUREMENT_PACKAGES);
  const [showRfqModal, setShowRfqModal] = useState(false);
  const [rfqDefaultCategory, setRfqDefaultCategory] = useState<'fabrication' | 'printing' | 'shipping'>('fabrication');
  const [vendorViolationSimulated, setVendorViolationSimulated] = useState(false);
  const [bidAddedSuccessToast, setBidAddedSuccessToast] = useState<string | null>(null);
  const [lpoIssuedSuccessToast, setLpoIssuedSuccessToast] = useState<string | null>(null);

  const handleOpenRfq = (category: 'fabrication' | 'printing' | 'shipping') => {
    setRfqDefaultCategory(category);
    setShowRfqModal(true);
  };

  const handleAddThirdBid = (pkgId: string) => {
    setProcurementPackages(prev => prev.map(pkg => {
      if (pkg.id !== pkgId) return pkg;
      const thirdBid: VendorBid = {
        id: 'bid-09',
        vendorName: 'Al Qasimi Laser Metal Industries',
        vendorNameAr: 'صناعات القاسمي للمعادن والليزر',
        isRegisteredSupplier: true,
        submittedPrice: 15200,
        technicalApproval: true,
        technicalNotes: 'Full compliance with 0.12 kg/cm² load distribution and museum conservation felt.',
        category: 'fabrication',
        quotationRef: 'AQL-MET-2026-99',
        submissionDate: '2026-09-17',
      };
      return {
        ...pkg,
        bids: [...pkg.bids, thirdBid],
        status: 'pending_lpo',
      };
    }));
    setBidAddedSuccessToast(
      isAr 
        ? "أُضيف العرض التجريبي الثالث. اكتملت قائمة السيناريو دون تفويض شراء."
        : "Third sample bid added. Scenario checklist complete; no procurement authorization."
    );
    setTimeout(() => setBidAddedSuccessToast(null), 4500);
  };

  const handleIssueLpo = (pkgId: string, vendorId: string) => {
    const generatedLpoNum = `LPO-SHJ-FIN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setProcurementPackages(prev => prev.map(pkg => {
      if (pkg.id !== pkgId) return pkg;
      return {
        ...pkg,
        status: 'lpo_issued',
        lpoNumber: generatedLpoNum,
        lpoIssueDate: '2026-09-17',
        issuedVendorId: vendorId,
      };
    }));
    setLpoIssuedSuccessToast(
      isAr 
        ? `سُجل أمر الشراء التجريبي (${generatedLpoNum}) محلياً. لم يُرسل شيء ولا يمنح إذناً ببدء العمل.`
        : `Sample order ${generatedLpoNum} recorded locally. Nothing sent; no authorization to begin work.`
    );
    setTimeout(() => setLpoIssuedSuccessToast(null), 5000);
  };

  const fabricationPackage = procurementPackages.find(p => p.id === 'proc-02');
  const fabricationLpoIssued = fabricationPackage?.status === 'lpo_issued';

  // Operations Report Data Preparation
  const reportMetadata: ReportFilterMetadata = {
    scopeMode: 'unfiltered-sample',
    programmeName: 'DEMO-OPS-BASELINE-26',
    categoryFilter: 'all',
    statusFilter: 'all',
    generatedBy: isAr ? 'إدارة العمليات والإنتاج الفني' : 'Technical Operations & Logistics Lead',
    totalRecords: ARTWORKS.length,
    workspaceType: 'operations',
  };

  const reportMetrics: KpiSummaryMetric[] = [
    {
      label: isAr ? 'فحص الأحمال الهندسية' : 'Structural Load Checks',
      value: technicalReviewLabel,
      status: technicalReviewRecorded ? 'success' : 'warning',
      subtitle: isAr ? `فحص صفيحة توزيع الوزن (${formatNumber(84)} كجم)` : 'Base load plate audit',
    },
    {
      label: isAr ? 'مطابقة تقارير الحالة' : 'Condition Reconciliation',
      value: patinaReconciled ? (isAr ? 'تمت التسوية' : 'Reconciled') : (isAr ? `${formatNumber(1)} ملاحظة مفتوحة` : '1 Variance Open'),
      status: patinaReconciled ? 'success' : 'danger',
      subtitle: isAr ? 'استلام شحنة المعرض' : 'Intake reconciliation',
    },
    {
      label: isAr ? 'قائمة المراسم التجريبية' : 'Sample PR checklist',
      value: `${formatRatio(Object.values(prFlags).filter(Boolean).length, 7)} ${isAr ? 'مكتمل · تجريبي' : 'complete · sample'}`,
      status: isPrProtocolReady ? 'success' : 'warning',
      subtitle: isAr ? 'قائمة افتراضية؛ ليست سياسة معتمدة' : 'Scenario checklist; not an approved policy',
    },
    {
      label: isAr ? 'ميزانية السيناريو' : 'Scenario budget',
      value: formatCurrency(540000, 'AED'),
      status: 'neutral',
      subtitle: isAr ? 'قيمة افتراضية؛ لا التزام أو صرف فعلي' : 'Illustrative amount; no commitment or payment',
    },
  ];

  const reportRecords = operationsBaselineRecords(ARTWORKS, technicalReview, isAr);

  const handleDirectDownloadReport = () => {
    if (requiresBrowserPrint(reportMetadata, reportMetrics, reportRecords)) {
      setShowReportModal(true);
      return;
    }
    downloadInstitutionalPdfReport(reportMetadata, reportMetrics, reportRecords);
  };

  return (
    <div className="space-y-6">
      <aside role="note" className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <strong>{isAr ? 'سيناريو تجريبي غير معتمد' : 'Unverified scenario state'}</strong>
        <p>{isAr ? 'مسار تفاعلي مقترح غير متصل بدائرة المالية المركزية. لا يمنح تفويضاً قانونياً أو اعتماداً فنياً. السجلات التجريبية ثابتة النطاق ولا تتبع محدد البرنامج؛ تغييرات الحالة مؤقتة في هذه الجلسة.' : 'Proposed interactive workflow, not connected to Sharjah Central Finance. No legal delegation or technical certification is granted. This fixed sample dataset is independent of the programme selector; status changes last only in this session.'}</p>
      </aside>
      {/* Header with Sub-Tabs */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sadu-ink uppercase tracking-wider mb-1">
              <Wrench className="w-4 h-4" />
              <span>{isAr ? 'العمليات التخصصية الميدانية المتزامنة' : 'Parallel Specialist Operations & Technical Gates'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'مسارات التنفيذ والتحقق التخصصي' : 'Specialist Workstreams & Execution Ledger'}
            </h1>
            <p className="text-xs sm:text-sm text-sadu-muted mt-1">
              {isAr
                ? 'فصل الصلاحيات بين الهندسة الفنية، اللوجستيات، فحص الحالة، التأشيرات، والمالية'
                : 'Proposed specialist responsibilities across engineering, logistics, condition, protocol and finance.'}
            </p>
          </div>
        </div>

        {/* Operations KPI Metrics Strip with Download Report Header & Interactive Tab Drill-downs */}
        <div className="mt-6 pt-6 border-t border-sadu-gold/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sadu-charcoal flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-sadu-brick" />
                <span>{isAr ? 'مؤشرات العمليات والجودة الميدانية (KPIs)' : 'Operations Readiness & Specialist Gates'}</span>
              </span>
              <span className="text-[11px] text-sadu-muted font-mono">
                ({subTab.toUpperCase()})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-operations-download-report"
                onClick={handleDirectDownloadReport}
                className="px-3 py-1.5 text-xs font-bold rounded-md bg-sadu-brick text-white hover:bg-sadu-brick-dark transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                title={isAr ? 'تنزيل فوري لتقرير PDF للبيانات المفلترة الحالية' : 'Download clean printable PDF version of current filtered data'}
              >
                <FileDown className="w-3.5 h-3.5 text-sadu-gold" />
                <span>{isAr ? 'تنزيل التقرير (PDF)' : 'Download Report'}</span>
              </button>

              <button
                id="btn-operations-preview-report"
                onClick={() => setShowReportModal(true)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-sadu-linen border border-sadu-gold text-sadu-charcoal hover:bg-sadu-sand transition-colors flex items-center gap-1.5 cursor-pointer"
                title={isAr ? 'معاينة المستند المؤسسي والطباعة' : 'Preview institutional audit document and print view'}
              >
                <Printer className="w-3.5 h-3.5 text-sadu-ink" />
                <span className="hidden sm:inline">{isAr ? 'معاينة وطباعة' : 'Print View'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <KpiCard
              title={isAr ? 'الفحص الهندسي للأحمال' : 'Structural Load Checks'}
              value={technicalReviewLabel}
              statusColor={technicalReviewRecorded ? 'success' : 'warning'}
              subtitle={isAr ? `فحص صفيحة توزيع الوزن (${formatNumber(84)} كجم)` : 'Base load plate audit'}
              onClick={() => setSubTab('technical')}
              isActive={subTab === 'technical'}
              filterLabel={technicalReviewRecorded ? (isAr ? 'عرض: فحص الأحمال' : 'Inspect: Load Checks') : (isAr ? 'تصفية: بانتظار الفحص' : 'Filter: Pending Check')}
              filterActiveText={isAr ? 'قسم الهندسة نشط' : 'Technical Active'}
            />
            <KpiCard
              title={isAr ? 'مطابقة تقارير الحالة' : 'Condition Reconciliation'}
              value={patinaReconciled ? (isAr ? 'تمت التسوية' : 'Reconciled') : (isAr ? `${formatNumber(1)} ملاحظة` : '1 Variance Open')}
              statusColor={patinaReconciled ? 'success' : 'danger'}
              subtitle={isAr ? 'تقرير استلام الشحنة CRATE-04' : 'Freight intake CR-2026-088'}
              onClick={() => setSubTab('logistics')}
              isActive={subTab === 'logistics'}
              filterLabel={patinaReconciled ? (isAr ? 'عرض: المعاينة المكتملة' : 'Show: Reconciled') : (isAr ? 'تصفية: ملاحظة مفتوحة' : 'Filter: At Risk')}
              filterActiveText={isAr ? 'قسم اللوجستيات نشط' : 'Logistics Active'}
            />
            <KpiCard
              title={reportMetrics[2].label}
              value={reportMetrics[2].value}
              statusColor={isPrProtocolReady ? 'success' : 'warning'}
              trend={formatPercent(Math.round((Object.values(prFlags).filter(Boolean).length / 7) * 100))}
              trendDirection={isPrProtocolReady ? 'up' : 'neutral'}
              subtitle={reportMetrics[2].subtitle}
              onClick={() => setSubTab('visa')}
              isActive={subTab === 'visa'}
              filterLabel={isAr ? 'عرض: بوابة المراسم' : 'Show: PR & Protocol'}
              filterActiveText={isAr ? 'قسم المراسم نشط' : 'Protocol Active'}
            />
            <KpiCard
              title={reportMetrics[3].label}
              value={reportMetrics[3].value}
              statusColor="neutral"
              subtitle={reportMetrics[3].subtitle}
              onClick={() => setSubTab('finance')}
              isActive={subTab === 'finance'}
              filterLabel={isAr ? 'عرض: بوابات الصرف' : 'Show: Financial Gates'}
              filterActiveText={isAr ? 'قسم المالية نشط' : 'Finance Active'}
            />
          </div>

          {/* Master Lifecycle Stepper (Horizontal Progress Gate) */}
          <div className="mt-4 p-3.5 bg-sadu-sand/70 rounded-md border border-sadu-gold/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sadu-charcoal uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sadu-brick" />
                <span>{isAr ? 'اعتماديات مسار العمل التجريبي' : 'Sample workflow dependencies'}</span>
              </span>
              <span className="text-[10px] font-mono text-sadu-muted">
                {isPrProtocolReady && fabricationLpoIssued && technicalReviewRecorded ? '3/3 SAMPLE STEPS' : 'SAMPLE DEPENDENCIES'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {/* Gate 1: PR & Protocol Gate */}
              <div 
                onClick={() => setSubTab('visa')}
                className={`p-2.5 rounded border transition-all cursor-pointer flex items-center justify-between ${
                  isPrProtocolReady ? 'bg-sadu-sage-light/70 border-sadu-sage text-sadu-ink' : 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isPrProtocolReady ? 'bg-sadu-sage text-white' : 'bg-amber-400 text-amber-900'
                  }`}>
                    {isPrProtocolReady ? '✓' : '1'}
                  </div>
                  <div>
                    <span className="font-bold block text-[11px]">
                      {isAr ? '1. حارس المراسم (PR Gate)' : '1. PR & Protocol Gate'}
                    </span>
                    <span className="text-[10px] text-sadu-muted block">
                      {isPrProtocolReady ? (isAr ? 'معتمد وموثق' : 'Fully Cleared') : (isAr ? 'مانع تصنيع نشط' : 'Locking Fabrication')}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold">
                  {Object.values(prFlags).filter(Boolean).length}/7
                </span>
              </div>

              {/* Gate 2: RFQ & 3 Bids LPO Gate */}
              <div 
                onClick={() => setSubTab('procurement')}
                className={`p-2.5 rounded border transition-all cursor-pointer flex items-center justify-between ${
                  fabricationLpoIssued ? 'bg-sadu-sage-light/70 border-sadu-sage text-sadu-ink' : 'bg-white/80 border-sadu-gold text-sadu-charcoal'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    fabricationLpoIssued ? 'bg-sadu-sage text-white' : 'bg-sadu-ink text-white'
                  }`}>
                    {fabricationLpoIssued ? '✓' : '2'}
                  </div>
                  <div>
                    <span className="font-bold block text-[11px]">
                      {isAr ? "٢. أمر شراء تجريبي (سيناريو ثلاثة عروض)" : "2. Sample LPO (three-quote scenario)"}
                    </span>
                    <span className="text-[10px] text-sadu-muted block">
                      {fabricationLpoIssued ? (isAr ? 'أمر الشراء صادر' : 'LPO Issued') : (isAr ? 'No LPO, No Work' : 'Locked')}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold">
                  {fabricationLpoIssued ? 'PKG-02' : '3 Bids'}
                </span>
              </div>

              {/* Gate 3: Structural Load & Lux */}
              <div 
                onClick={() => setSubTab('technical')}
                className={`p-2.5 rounded border transition-all cursor-pointer flex items-center justify-between ${
                  technicalReviewRecorded ? 'bg-sadu-sage-light/70 border-sadu-sage text-sadu-ink' : 'bg-white/80 border-sadu-gold text-sadu-charcoal'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    technicalReviewRecorded ? 'bg-sadu-sage text-white' : 'bg-sadu-sand text-sadu-charcoal border border-sadu-gold'
                  }`}>
                    {technicalReviewRecorded ? '✓' : '3'}
                  </div>
                  <div>
                    <span className="font-bold block text-[11px]">
                      {isAr ? '3. الفحص الهندسي واللوكس' : '3. Engineering & Lux'}
                    </span>
                    <span className="text-[10px] text-sadu-muted block">
                      {technicalReviewLabel}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold">
                  {technicalReviewRecorded ? '0.12kg' : '48 Lux'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Tab Selector */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-sadu-gold/50 flex-wrap">
          {[
            { id: 'gate2', icon: Scale, labelEn: 'Gate 2: Operational Rubric (35 pts)', labelAr: 'البوابة 2: التقييم التشغيلي (35 نقطة)' },
            { id: 'technical', icon: Wrench, labelEn: 'Technical & Engineering', labelAr: 'الهندسة والتثبيت' },
            { id: 'logistics', icon: Truck, labelEn: 'Logistics & Condition', labelAr: 'اللوجستيات ومعاينة الحالة' },
            { id: 'visa', icon: Plane, labelEn: 'PR & Protocol Clearance', labelAr: 'المراسم وتأشيرات السفر والتخليص' },
            { id: 'procurement', icon: Building2, labelEn: 'Procurement Gate (3 Bids)', labelAr: 'بوابة المشتريات ومناقصات LPO' },
            { id: 'finance', icon: DollarSign, labelEn: 'Finance & Milestones', labelAr: 'الحسابات والدفعات' },
            { id: 'editorial', icon: BookOpen, labelEn: 'Editorial & Catalogue', labelAr: 'التحرير والكتالوج' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md border transition-colors flex items-center gap-1.5 cursor-pointer ${
                subTab === tab.id
                  ? 'bg-sadu-ink text-white border-sadu-ink shadow-2xs'
                  : 'bg-sadu-linen text-sadu-charcoal border-sadu-gold hover:bg-sadu-sand'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              {tab.id === 'visa' && !isPrProtocolReady && (
                <span className="w-2 h-2 rounded-full bg-sadu-brick animate-pulse ms-0.5" title="Pending PR Clearance" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
        {subTab === 'gate2' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-sadu-gold/40 flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-sadu-brick text-white text-[10px] font-bold uppercase tracking-wider">
                    {isAr ? 'البوابة 2: المتاحف والعمليات' : 'Gate 2: Operations & Museum'}
                  </span>
                  <h3 className="font-editorial text-lg font-bold text-sadu-charcoal">
                    {isAr ? 'مقياس التقييم التشغيلي التخصصي (35 نقطة)' : 'Operational & Feasibility Evaluation Rubric (35 Points)'}
                  </h3>
                </div>
                <span className="text-xs text-sadu-muted">
                  {isAr 
                    ? 'التقييم الفني الميداني للفنان يوسف نبهان · الجدارة التقنية، اللوجستية، وملاءمة الميزانية مع فحص المحاذير الحرجة' 
                    : 'Field assessment for artist Youssef Nabhan · Technical feasibility, logistics safety, budget compliance & red flags'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-end">
                  <span className="text-[10px] text-sadu-muted block uppercase font-bold">
                    {isAr ? 'الدرجة التشغيلية المعتمدة' : 'Effective Operational Score'}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold font-editorial ${anyRedFlagActive ? 'text-rose-600' : 'text-sadu-ink'}`}>
                      {formatNumber(effectiveOperationalScore)}
                    </span>
                    <span className="text-xs text-sadu-muted">/ 35</span>
                  </div>
                </div>
                {anyRedFlagActive && (
                  <span className="px-2.5 py-1 rounded bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{isAr ? 'سقف مقيد (15/35)' : 'Capped at 15'}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Red Flag Checklist (Critical Preventative Controls) */}
            <div className={`p-4 rounded-lg border transition-colors ${anyRedFlagActive ? 'bg-rose-50/80 border-rose-300' : 'bg-sadu-sand/60 border-sadu-gold'}`}>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-sadu-gold/30 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className={`w-4 h-4 ${anyRedFlagActive ? 'text-rose-600' : 'text-sadu-brick'}`} />
                  <span className="font-bold text-xs uppercase tracking-wider text-sadu-charcoal">
                    {isAr ? 'قائمة المحاذير التشغيلية الحمراء (Red Flag Checklist)' : 'Critical Operational Red Flag Checklist'}
                  </span>
                </div>
                <span className="text-[11px] text-sadu-muted">
                  {isAr ? 'تفعيل أي محذور يضع سقفاً إجبارياً للدرجة عند 15/35 نقطة تلقائياً' : 'Any active red flag caps overall operational score at 15/35'}
                </span>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 text-xs">
                {/* Flag 1 */}
                <label className={`p-3 rounded-md border flex items-start gap-2.5 cursor-pointer transition-colors ${
                  redFlags.unverifiedBudgetInflation ? 'bg-rose-100/90 border-rose-400 text-rose-900' : 'bg-white/80 border-sadu-gold/50 text-sadu-charcoal hover:bg-white'
                }`}>
                  <input
                    type="checkbox"
                    checked={redFlags.unverifiedBudgetInflation}
                    onChange={(e) => setRedFlags(prev => ({ ...prev, unverifiedBudgetInflation: e.target.checked }))}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold block">
                      {isAr ? 'تضخم مالي غير مبرر (+25%)' : 'Unverified Budget Inflation'}
                    </span>
                    <span className="text-[11px] text-sadu-muted leading-tight block mt-0.5">
                      {isAr ? 'الميزانية المقدمة تتجاوز الأسعار المعيارية دون عروض أسعار موثقة' : 'Production cost exceeds benchmark by >25% without market quotes'}
                    </span>
                  </div>
                </label>

                {/* Flag 2 */}
                <label className={`p-3 rounded-md border flex items-start gap-2.5 cursor-pointer transition-colors ${
                  redFlags.hazardousMaterialsWithoutPermit ? 'bg-rose-100/90 border-rose-400 text-rose-900' : 'bg-white/80 border-sadu-gold/50 text-sadu-charcoal hover:bg-white'
                }`}>
                  <input
                    type="checkbox"
                    checked={redFlags.hazardousMaterialsWithoutPermit}
                    onChange={(e) => setRedFlags(prev => ({ ...prev, hazardousMaterialsWithoutPermit: e.target.checked }))}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold block">
                      {isAr ? 'مواد خطرة دون تصاريح' : 'Hazardous Materials / No Permit'}
                    </span>
                    <span className="text-[11px] text-sadu-muted leading-tight block mt-0.5">
                      {isAr ? 'وجود مواد كيميائية أو لحام حي بالمتحف يهدد سلامة الزوار' : 'Live welding, toxic patinas, or flammables lacking civil defense permit'}
                    </span>
                  </div>
                </label>

                {/* Flag 3 */}
                <label className={`p-3 rounded-md border flex items-start gap-2.5 cursor-pointer transition-colors ${
                  redFlags.inadequateCratingOrUninsurable ? 'bg-rose-100/90 border-rose-400 text-rose-900' : 'bg-white/80 border-sadu-gold/50 text-sadu-charcoal hover:bg-white'
                }`}>
                  <input
                    type="checkbox"
                    checked={redFlags.inadequateCratingOrUninsurable}
                    onChange={(e) => setRedFlags(prev => ({ ...prev, inadequateCratingOrUninsurable: e.target.checked }))}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold block">
                      {isAr ? 'تغليف رديء أو غير قابل للتأمين' : 'Substandard Crating / Uninsurable'}
                    </span>
                    <span className="text-[11px] text-sadu-muted leading-tight block mt-0.5">
                      {isAr ? 'الصناديق لا تطابق معايير ISPM-15 أو رُفضت من قبل شركة التأمين' : 'Inadequate transit cushioning or rejected for international museum coverage'}
                    </span>
                  </div>
                </label>
              </div>

              {anyRedFlagActive && (
                <div className="mt-3 pt-2.5 border-t border-rose-200 flex items-center gap-2 text-rose-800 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {isAr 
                      ? 'تنبيه تدقيق: تم تفعيل محذور تشغيلي. تم خفض سقف التقييم التشغيلي إجبارياً إلى 15 نقطة كحد أقصى لحماية المعرض.' 
                      : 'Audit Enforcement: Operational red flag detected. Total Gate 2 score is automatically capped at 15 points max.'}
                  </span>
                </div>
              )}
            </div>

            {/* Rubric Sliders (35 Points Max) */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Criteria 1: Technical Feasibility (15 pts) */}
              <div className="p-4 bg-sadu-sand rounded-md border border-sadu-gold space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-sadu-charcoal">
                    <Wrench className="w-3.5 h-3.5 text-sadu-brick" />
                    <span>{isAr ? 'الجدوى التقنية والهندسية' : 'Technical & Engineering Feasibility'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-sadu-linen font-mono font-bold text-xs text-sadu-brick border border-sadu-gold/50">
                    {operationalScores.technicalFeasibility} / 15
                  </span>
                </div>
                <p className="text-[11px] text-sadu-muted leading-relaxed">
                  {isAr 
                    ? 'سلامة الأحمال الإنشائية (0.12 كجم/سم²)، متطلبات الإضاءة (48 لوكس)، التوصيلات الكهربائية، وعدم وجود مخاطر ميدانية.' 
                    : 'Floor load capacity tolerance, lux calibration limits (diffused 48 lux max), electrical rigging & conservation safety.'}
                </p>
                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={operationalScores.technicalFeasibility}
                    onChange={(e) => setOperationalScores(prev => ({ ...prev, technicalFeasibility: parseInt(e.target.value) || 0 }))}
                    className="w-full accent-sadu-brick cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-sadu-muted font-mono">
                    <span>0</span>
                    <span>7</span>
                    <span>15</span>
                  </div>
                </div>
              </div>

              {/* Criteria 2: Logistics & Condition Feasibility (10 pts) */}
              <div className="p-4 bg-sadu-sand rounded-md border border-sadu-gold space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-sadu-charcoal">
                    <Truck className="w-3.5 h-3.5 text-sadu-sage" />
                    <span>{isAr ? 'اللوجستيات ومعايير الشحن الفني' : 'Logistics & Museum Transit'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-sadu-linen font-mono font-bold text-xs text-sadu-sage border border-sadu-gold/50">
                    {operationalScores.logisticsFeasibility} / 10
                  </span>
                </div>
                <p className="text-[11px] text-sadu-muted leading-relaxed">
                  {isAr 
                    ? 'جاهزية صناديق الشحن ISPM-15، أجهزة تسجيل درجات الحرارة والرطوبة، وتاريخ معاينة الحالة واستلام الشحنات.' 
                    : 'Archival crating ISPM-15 compliance, climate datalogger records, transit risk mitigation & condition report protocol.'}
                </p>
                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={operationalScores.logisticsFeasibility}
                    onChange={(e) => setOperationalScores(prev => ({ ...prev, logisticsFeasibility: parseInt(e.target.value) || 0 }))}
                    className="w-full accent-sadu-sage cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-sadu-muted font-mono">
                    <span>0</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
              </div>

              {/* Criteria 3: Budget & Production Value (10 pts) */}
              <div className="p-4 bg-sadu-sand rounded-md border border-sadu-gold space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-sadu-charcoal">
                    <DollarSign className="w-3.5 h-3.5 text-sadu-ink" />
                    <span>{isAr ? 'ملاءمة الميزانية وعائد الإنتاج' : 'Budget Value & Production Equity'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-sadu-linen font-mono font-bold text-xs text-sadu-ink border border-sadu-gold/50">
                    {operationalScores.budgetValue} / 10
                  </span>
                </div>
                <p className="text-[11px] text-sadu-muted leading-relaxed">
                  {isAr 
                    ? "تفصيل تكلفة ومقارنة ثلاثة عروض للتجربة؛ يلزم التحقق من قواعد الشراء المؤسسية."
                    : "Sample cost breakdown and three-quote comparison; institutional procurement rules require validation."}
                </p>
                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={operationalScores.budgetValue}
                    onChange={(e) => setOperationalScores(prev => ({ ...prev, budgetValue: parseInt(e.target.value) || 0 }))}
                    className="w-full accent-sadu-ink cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-sadu-muted font-mono">
                    <span>0</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Summary Banner */}
            <div className="p-4 bg-sadu-sand/80 rounded-md border border-sadu-gold flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sadu-ink text-white flex items-center justify-center font-bold text-sm">
                  {effectiveOperationalScore}
                </div>
                <div>
                  <span className="font-bold text-xs text-sadu-charcoal block">
                    {isAr ? 'المجموع الميداني النهائي للبوابة 2' : 'Final Field Operational Score (Gate 2)'}
                  </span>
                  <span className="text-[11px] text-sadu-muted">
                    {isAr 
                      ? `المجموع الأولي: ${rawOperationalSum} نقطة · ${anyRedFlagActive ? 'تم تطبيق حد السقف الإلزامي (15/35)' : 'استيفاء الشروط دون محاذير'}` 
                      : `Raw: ${rawOperationalSum}/35 · ${anyRedFlagActive ? 'Capped at 15 due to Red Flag' : 'No operational infractions'}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSubTab('visa')}
                  className="px-3.5 py-1.5 text-xs font-bold rounded bg-sadu-brick text-white hover:bg-sadu-brick-dark transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plane className="w-3.5 h-3.5" />
                  <span>{isAr ? 'الانتقال للتدقيق البروتوكولي ومراسم التأشيرات' : 'Proceed to PR & Protocol Clearance'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {subTab === 'procurement' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-sadu-gold/40 flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-sadu-charcoal text-white text-[10px] font-bold uppercase tracking-wider">
                    {isAr ? 'حكومة الشارقة · دائرة المالية المركزية' : 'Sharjah Central Finance Department'}
                  </span>
                  <h3 className="font-editorial text-lg font-bold text-sadu-charcoal">
                    {isAr ? "سيناريو مشتريات ومقارنة عروض" : "Scenario Procurement & Quotation Comparison"}
                  </h3>
                </div>
                <span className="text-xs text-sadu-muted">
                  {isAr 
                    ? "يتطلب هذا السيناريو ثلاثة عروض تجريبية؛ ولا يحدد سياسة المشتريات المؤسسية."
                    : "This scenario requires three sample bids; it does not establish institutional procurement policy."}
                </span>
              </div>
            </div>

            {/* Procurement Bidding Gate Component */}
            <ProcurementBiddingGate lang={lang} />
          </div>
        )}

        {subTab === 'technical' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-sadu-gold/40 flex-wrap gap-2">
              <div>
                <h3 className="font-editorial text-lg font-bold text-sadu-charcoal">
                  {isAr ? 'فحص الأحمال الإنشائية وهندسة الإضاءة والمقاولات الفنية' : 'Structural Load Capacity & External Fabrication Gate'}
                </h3>
                <span className="text-xs text-sadu-muted">
                  {isAr ? 'المسؤول: م. طارق منصور (رئيس الفريق الفني)' : 'Accountable: Eng. Tariq Mansour (Chief Technician)'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  id="btn-generate-rfq-technical"
                  onClick={() => handleOpenRfq('fabrication')}
                  className="px-3 py-1.5 rounded text-xs font-bold bg-sadu-sand text-sadu-charcoal border border-sadu-gold hover:bg-sadu-sand-dark transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-sadu-brick" />
                  <span>{isAr ? 'معاينة طلب عروض أسعار تجريبي (RFQ)' : 'Preview sample RFQ document'}</span>
                </button>

                <span className={`px-2.5 py-1 rounded text-xs font-bold ${technicalReviewRecorded ? 'bg-sadu-sage/20 text-sadu-ink border border-sadu-sage' : 'bg-amber-50 text-sadu-brick border border-amber-300'}`}>
                  {technicalReviewLabel}
                </span>
              </div>
            </div>

            {/* In-House Engineering Tests */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-sadu-sand rounded-md border border-sadu-gold space-y-2 text-xs">
                <span className="font-bold text-sadu-brick block text-sm">
                  {isAr ? `فحص حمولة العمل البرونزي (أفق كوفي — ${formatNumber(84)} كجم)` : 'Work #2: Kufic Horizon (84 kg Bronze)'}
                </span>
                <p className="text-sadu-charcoal leading-relaxed">
                  {isAr
                    ? `يتطلب العمل صفيحة توزيع وزن فولاذية بقطر ${formatNumber(60)} سم وسماكة ${formatNumber(8)} ملم مع طبقة لباد عازل لحماية أرضيات متحف الشارقة للفنون التاريخية.`
                    : 'Requires 60cm steel load dispersion base plate (8mm thickness) with felt underlay to protect historical flooring.'}
                </p>
                <div className="pt-2 border-t border-sadu-gold/50 flex items-center justify-between">
                  <span className="font-mono text-sadu-ink">
                    {isAr ? `الضغط: ${formatNumber(0.12, { minimumFractionDigits: 2 })} كجم/سم² · حساب تجريبي` : 'Sample pressure: 0.12 kg/cm² · not a safety finding'}
                  </span>
                  <button
                    onClick={() => setTechnicalReview(previous => recordSampleTechnicalReview(workspace.currentRole, new Date().toISOString(), previous))}
                    disabled={technicalReviewRecorded || !canRecordTechnical}
                    className={`px-3 py-1 rounded text-xs font-bold cursor-pointer ${
                      technicalReviewRecorded
                        ? 'bg-sadu-gold/40 text-sadu-muted' 
                        : 'bg-sadu-brick text-white hover:bg-sadu-brick-dark'
                    }`}
                  >
                    {technicalReviewRecorded ? technicalReviewLabel : (isAr ? 'تسجيل مراجعة فنية تجريبية' : 'Record sample technical review')}
                  </button>
                  <p className="text-[11px] text-sadu-muted">
                    {!canRecordTechnical && !technicalReviewRecorded && (isAr ? 'الإجراء متاح للدور الفني التجريبي فقط. ' : 'Available only to the sample technical role. ')}
                    {isAr ? 'لا يمثل هذا اعتماداً هندسياً.' : 'This is not an engineering certification.'}
                    {technicalReview && <><br/><bdi>{technicalReview.actorRole} · {technicalReview.evidenceReference} / v{technicalReview.version} · {technicalReview.recordedAt}</bdi></>}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-sadu-sand rounded-md border border-sadu-gold space-y-2 text-xs">
                <span className="font-bold text-sadu-ink block text-sm">
                  {isAr ? `معايرة إضاءة اللوحة المصبوغة بالنيلة (مرقش رقم ${formatNumber(4)})` : 'Work #1: Luminaire Angle & Lux Tolerance'}
                </span>
                <p className="text-sadu-charcoal leading-relaxed">
                  {isAr
                    ? `تمت معايرة الكشافات الجدارية بزاوية ${formatNumber(38)} درجة وبشدة إضاءة ${formatNumber(48)} لوكس (الحد الأقصى المسموح ${formatNumber(50)} لوكس) لحماية الصباغ العضوي الطبيعي.`
                    : 'Luminaire angle calibrated to 38° diffused at 48 lux (threshold 50 lux max) to prevent pigment photodegradation.'}
                </p>
                <div className="pt-2 border-t border-sadu-gold/50 flex items-center justify-between">
                  <span className="font-mono text-sadu-sage">
                    {isAr ? `القياس الميداني: ${formatNumber(48)} لوكس (مثالي)` : 'Telemetry: 48 Lux (Optimal)'}
                  </span>
                  <span className="text-sadu-sage font-semibold">✓ Verified</span>
                </div>
              </div>
            </div>

            {/* OUTSOURCED OPERATION GATE: "NO LPO, NO WORK" ENFORCEMENT */}
            <div className="p-4 bg-sadu-sand/80 rounded-lg border border-sadu-gold space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sadu-brick" />
                  <h4 className="font-editorial text-sm font-bold text-sadu-charcoal">
                    {isAr ? 'بوابة المشتريات والتصنيع الخارجي (قاعدة الأفق الكوفي - PKG-SHJ-2026-FAB-02)' : 'Outsourced Metalcraft Gate: Bronze Base & Plinth (PKG-SHJ-2026-FAB-02)'}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  {!isPrProtocolReady && (
                    <span className="px-2 py-0.5 rounded bg-rose-100 border border-rose-300 text-rose-800 font-bold text-[10px] flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>{isAr ? 'مُقيد بحارس المراسم' : 'Gated by PR Clearance'}</span>
                    </span>
                  )}
                  <StatusProgressIndicator
                    type="procurement"
                    statusLevel={fabricationLpoIssued ? 'in_progress' : 'pending_lpo'}
                    label={
                      fabricationLpoIssued
                        ? (isAr ? `مرخص للتنفيذ (أمر شراء رقم ${fabricationPackage?.lpoNumber})` : `Authorized (LPO #${fabricationPackage?.lpoNumber})`)
                        : (isAr ? 'بانتظار أمر الشراء (LPO مقفل)' : 'Pending LPO (Operation Locked)')
                    }
                  />
                </div>
              </div>

              {/* Digital Bouncer Preventative PR Lock Banner */}
              {!isPrProtocolReady && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-md text-xs space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-2 font-bold text-rose-800">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{isAr ? 'الحارس الوقائي الرقمي: حظر التصنيع بانتظار استيفاء بروتوكول المراسم' : 'Preventative Gate Active: Fabrication Blocked Pending PR Protocol'}</span>
                    </div>
                    <button
                      onClick={() => setSubTab('visa')}
                      className="px-2 py-1 rounded bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-700 cursor-pointer"
                    >
                      {isAr ? 'الانتقال لبوابة المراسم (7 متطلبات)' : 'Go to PR & Protocol Gate'}
                    </button>
                  </div>
                  <p className="text-sadu-charcoal text-[11px] leading-relaxed">
                    {isAr 
                      ? 'يربط هذا السيناريو التصنيع بقائمة مراسم تجريبية. هذه ليست سياسة مؤسسية؛ متطلبات التصنيع الفعلية وصلاحياته تنتظر التحقق.'
                      : 'This scenario demonstrates a dependency on a sample PR checklist. It is not an institutional rule; actual fabrication requirements and authority remain unverified.'}
                  </p>
                </div>
              )}

              {/* Status Box depending on LPO status */}
              {!fabricationLpoIssued ? (
                <div className="p-3.5 bg-amber-50/70 border border-amber-300 rounded-md text-xs space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-sadu-brick shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold text-sadu-brick block text-xs">
                        {isAr ? 'اعتمادية تجريبية: بانتظار أمر شراء تجريبي' : 'Scenario dependency: sample purchase order pending'}
                      </span>
                      <p className="text-sadu-charcoal leading-relaxed text-[11px]">
                        {isAr
                          ? 'يستخدم العرض سيناريو أمر شراء بثلاثة عروض أسعار. لم تُثبت سياسة مالية أو صلاحية إنفاق أو إذن لمورد ببدء العمل.'
                          : 'This demonstration uses a three-quote purchase-order scenario. No finance policy, spending delegation or permission for a supplier to start work has been verified.'}
                      </p>
                    </div>
                  </div>

                  {/* Warning Breach Simulation */}
                  <div className="pt-2 border-t border-amber-200 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setVendorViolationSimulated(!vendorViolationSimulated)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                          vendorViolationSimulated
                            ? 'bg-sadu-brick text-white border-sadu-brick'
                            : 'bg-white text-sadu-charcoal border-amber-400 hover:bg-amber-100'
                        }`}
                      >
                        {vendorViolationSimulated
                          ? (isAr ? 'إلغاء محاكاة الخرق' : 'Clear Breach Simulation')
                          : (isAr ? 'محاكاة: مورد بدأ العمل شفهياً دون LPO' : 'Simulate: Vendor Started on Verbal Agreement')}
                      </button>
                    </div>

                    <button
                      onClick={() => setSubTab('finance')}
                      className="text-xs font-bold text-sadu-brick hover:text-sadu-brick-dark flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isAr ? 'الانتقال لبوابة المناقصات بالمالية لإيداع العروض وإصدار LPO' : 'Go to Finance Bidding Gate to Complete 3 Bids & Issue LPO'}</span>
                      <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                  </div>

                  {/* Red Breach Banner if Simulated */}
                  {vendorViolationSimulated && (
                    <div className="p-3 bg-rose-100 border-2 border-sadu-brick rounded-md text-sadu-brick text-xs space-y-1">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertTriangle className="w-4 h-4 text-sadu-brick" />
                        <span>{isAr ? 'مخالفة مالية جسيمة: رصد التزام شفهي دون أمر شراء رسمي (Shadow Commitment)' : 'CRITICAL FINANCIAL BREACH: SHADOW COMMITMENT DETECTED'}</span>
                      </div>
                      <p className="text-sadu-charcoal text-[11px] leading-relaxed">
                        {isAr
                          ? "استثناء تجريبي: التزام شفهي يفتقر إلى مستند أمر الشراء. يُحال للمراجعة وفق السياسة المنطبقة؛ لا يُقرر هنا أثر قانوني أو نتيجة دفع."
                          : "Sample exception: a verbal commitment lacks supporting order evidence. Route it for review under the applicable policy; no legal or payment outcome is established here."}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 bg-sadu-sage-light/60 border border-sadu-sage rounded-md text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Unlock className="w-4 h-4 text-sadu-sage" />
                      <span className="font-bold text-sadu-ink">
                        {isAr ? 'سُجل أمر شراء تجريبي' : 'Sample purchase order recorded'}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sadu-ink bg-sadu-sand px-2 py-0.5 rounded border border-sadu-sage/40 text-[11px]">
                      {fabricationPackage.lpoNumber}
                    </span>
                  </div>
                  <p className="text-sadu-charcoal text-[11px] leading-relaxed">
                    {isAr
                      ? 'ثلاثة عروض تجريبية واختيار مقترح. لم يُرسل شيء إلى المورد ولا يُمنح تفويض شراء.'
                      : `Three sample quotes are present and a proposed selection is shown. Nothing was sent to a supplier; no procurement authorization is granted.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {subTab === 'logistics' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-sadu-gold/40 flex-wrap gap-2">
              <div>
                <h3 className="font-editorial text-lg font-bold text-sadu-charcoal">
                  {isAr ? 'سجل معاينة الشحن وتوثيق الاختلافات والشحن الدولي' : 'Customs Unpack, Condition Reconciliation & Fine Art Logistics'}
                </h3>
                <span className="text-xs text-sadu-muted">
                  {isAr ? 'محضر استلام الشحنة الدولية CRATE-04 بمتحف الشارقة' : 'Freight Intake Manifest: Crate CRATE-04 at Sharjah Art Museum'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-generate-rfq-logistics"
                  onClick={() => handleOpenRfq('shipping')}
                  className="px-3 py-1.5 rounded text-xs font-bold bg-sadu-sand text-sadu-charcoal border border-sadu-gold hover:bg-sadu-sand-dark transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-sadu-brick" />
                  <span>{isAr ? 'إنشاء مناقصة الشحن (RFQ)' : 'Generate Freight RFQ'}</span>
                </button>

                <span className={`px-2.5 py-1 rounded text-xs font-bold ${patinaReconciled ? 'bg-sadu-sage/20 text-sadu-ink border border-sadu-sage' : 'bg-amber-100 text-amber-900 border border-amber-300'}`}>
                  {patinaReconciled ? (isAr ? '✓ تمت التسوية' : '✓ Reconciled') : (isAr ? 'ملاحظة حالة معلقة' : 'Observation Recorded')}
                </span>
              </div>
            </div>

            {/* Condition Discrepancy Card */}
            <div className="p-4 bg-sadu-linen-warm rounded-md border border-sadu-gold space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sadu-brick text-sm">
                  {isAr ? `الملاحظة المسجلة: تباين لوني في طبقة الأكسيد (${formatNumber(3)} ملم)` : 'Condition Variance: 3mm Lower Patina Variation'}
                </span>
                <span className="text-sadu-muted font-mono">Report ID: CR-2026-088-02</span>
              </div>

              <p className="text-sadu-charcoal leading-relaxed">
                {isAr
                  ? `عند فض صندوق الشحن الخشبي لوحظ وجود اختلاف لوني طفيف بطول ${formatNumber(3)} ملم في زاوية القاعدة البرونزية ناتج عن ضغط وسادة التثبيت أثناء النقل الجوي. تمت مطابقة الصور مع ملف الاستوديو والتأكد من عدم وجود أي شرخ معدني.`
                  : 'Upon crate unpacking, a minor 3mm surface patina friction mark was observed near bracket flange. Photographic comparison with studio baseline confirmed structural integrity.'}
              </p>

              <div className="pt-2 border-t border-sadu-gold/50 flex items-center justify-between">
                <span className="text-[11px] text-sadu-muted">
                  {isAr ? 'المعاين: اختصاصي الترميم والمعاينة' : 'Assessor: Institutional Conservator'}
                </span>
                <button
                  onClick={() => setPatinaReconciled(true)}
                  disabled={patinaReconciled}
                  className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer ${
                    patinaReconciled 
                      ? 'bg-sadu-gold/40 text-sadu-muted' 
                      : 'bg-sadu-ink text-white hover:bg-sadu-ink/90'
                  }`}
                >
                  {patinaReconciled ? (isAr ? 'تم اعتماد التسوية' : 'Reconciliation Closed') : (isAr ? 'اعتماد محضر التسوية' : 'Reconcile Condition Observation')}
                </button>
              </div>
            </div>

            {/* Fine Art Shipping Procurement Verification Card */}
            <div className="p-4 bg-sadu-sand rounded-md border border-sadu-gold space-y-3 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-sadu-sage" />
                  <span className="font-bold text-sadu-charcoal text-sm">
                    {isAr ? 'حزمة الشحن والتخليص الجمركي الفني (PKG-SHJ-2026-LOG-03)' : 'Fine Art Logistics Package: Air/Sea Climate Transport'}
                  </span>
                </div>
                <StatusProgressIndicator
                  type="procurement"
                  statusLevel="completed"
                  label={isAr ? 'أمر الشراء صادر ومصادق عليه (LPO-SHJ-FIN-2026-0881)' : 'LPO Active: LPO-SHJ-FIN-2026-0881'}
                />
              </div>

              <p className="text-sadu-charcoal text-[11px] leading-relaxed">
                {isAr
                  ? 'تم استدراج 3 عروض أسعار تنافسية وترسية العقد على شركة "هازنكامب للخدمات اللوجستية الفنية" المسجلة لدى دائرة المالية المركزية بمبلغ 28,400 درهم إماراتي، مع اشتراط الصناديق المناخية القياسية ISPM-15 وأجهزة التسجيل الحراري.'
                  : 'Three competitive tenders evaluated. Awarded to registered vendor Hasenkamp Fine Art Logistics UAE at AED 28,400 under strict climate datalogging criteria.'}
              </p>
            </div>
          </div>
        )}

        {subTab === 'visa' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-sadu-gold/40 flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isPrProtocolReady ? 'bg-sadu-sage text-white' : 'bg-sadu-brick text-white animate-pulse'}`}>
                    {isPrProtocolReady 
                      ? (isAr ? 'البوابة مفتوحة: استيفاء المراسم' : 'PR Cleared: Preventive Lock Lifted') 
                      : (isAr ? 'بوابة المراسم مقفلة: الحارس الرقمي نشط' : 'Digital Bouncer Active: Gated')}
                  </span>
                  <h3 className="font-editorial text-lg font-bold text-sadu-charcoal">
                    {isAr ? 'لوحة تدقيق المراسم والعلاقات العامة والتأشيرات (PR & Protocol Gate)' : 'PR, Protocol & Travel Clearance Verification Dashboard'}
                  </h3>
                </div>
                <span className="text-xs text-sadu-muted">
                  {isAr 
                    ? "دور علاقات عامة تجريبي · قائمة مقترحة قبل الإنتاج؛ يلزم تأكيد التكليف والصلاحية."
                    : "Sample PR role · proposed pre-production checklist; assignment and authority require confirmation."}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrProtocolCleared(!isPrProtocolCleared)}
                  className={`px-3.5 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    isPrProtocolReady
                      ? 'bg-sadu-sage text-white hover:bg-sadu-sage/90'
                      : 'bg-sadu-brick text-white hover:bg-sadu-brick-dark'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isPrProtocolReady 
                      ? (isAr ? '✓ تم منح الاعتماد البروتوكولي' : '✓ PR Clearance Granted') 
                      : (isAr ? 'منح الاعتماد البروتوكولي المباشر' : 'Grant Immediate Clearance')}
                  </span>
                </button>
              </div>
            </div>

            {/* PR Clearance Status Banner */}
            <div className={`p-4 rounded-lg border text-xs flex items-center justify-between flex-wrap gap-3 ${
              isPrProtocolReady ? 'bg-sadu-sage-light/60 border-sadu-sage text-sadu-ink' : 'bg-amber-50 border-amber-300 text-sadu-charcoal'
            }`}>
              <div className="flex items-start gap-2.5">
                {isPrProtocolReady ? (
                  <CheckCircle2 className="w-5 h-5 text-sadu-sage shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-sadu-brick shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <span className="font-bold block text-sm">
                    {isPrProtocolReady 
                      ? (isAr ? 'تم استيفاء متطلبات العلاقات العامة والمراسم بالكامل' : 'PR & Protocol Verification Fully Satisfied') 
                      : (isAr ? 'الحارس الرقمي: التصنيع وأوامر الشراء والصرف معلقة بانتظار استكمال ملف المراسم' : 'Preventative Lock: Fabrication & LPO Actions Locked until PR Complete')}
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    {isPrProtocolReady
                      ? (isAr 
                          ? 'اكتملت القائمة التجريبية. يتغير العرض فقط؛ لا يُعتمد بذلك إثبات هوية أو تصنيع أو إنفاق.'
                          : 'The sample checklist is complete. This changes the demonstration only; it does not approve identity, fabrication or spending.')
                      : (isAr 
                          ? 'القائمة التجريبية غير مكتملة. اعتماداتها المتبادلة افتراضات للسيناريو وليست سياسة مؤسسية مثبتة.'
                          : 'The sample checklist is incomplete. Its dependencies are scenario assumptions, not verified institutional policy.')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-white/80 border border-sadu-gold">
                  {Object.values(prFlags).filter(Boolean).length} / 7 {isAr ? "تم الفحص · محاكاة" : "Checked · simulated"}
                </span>
              </div>
            </div>

            {/* 7-Point PR & Protocol Verification Checklist */}
            <div className="p-4 bg-sadu-sand rounded-lg border border-sadu-gold space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-sadu-gold/50 flex-wrap gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-sadu-charcoal flex items-center gap-1.5">
                  <FileSignature className="w-4 h-4 text-sadu-brick" />
                  <span>{isAr ? "قائمة علاقات عامة مقترحة · سبعة بنود تجريبية" : "Proposed PR checklist · seven sample items"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const allTrue = {
                      certificateNameVerified: true,
                      exhibitionTitleLocked: true,
                      bioApproved: true,
                      portraitReceived: true,
                      nationalityConfirmed: true,
                      socialMediaLogged: true,
                      guestListSubmitted: true,
                    };
                    setPrFlags(allTrue);
                    setIsPrProtocolCleared(true);
                  }}
                  className="text-[11px] font-bold text-sadu-brick hover:underline cursor-pointer"
                >
                  {isAr ? 'تحديد الكل كمستوفى' : 'Mark All as Verified'}
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                {/* 1 */}
                <label className="p-3 bg-white/90 rounded-md border border-sadu-gold/50 flex items-start gap-2.5 cursor-pointer hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={prFlags.certificateNameVerified}
                    onChange={(e) => setPrFlags(prev => ({ ...prev, certificateNameVerified: e.target.checked }))}
                    className="mt-0.5 rounded text-sadu-brick focus:ring-sadu-brick w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-sadu-charcoal block">
                      {isAr ? '1. مطابقة الاسم الرسمي لشهادة التقدير' : '1. Certificate Name Verified'}
                    </span>
                    <span className="text-[11px] text-sadu-muted block mt-0.5">
                      {isAr ? 'مطابقة الاسم الثلاثي بالعربية والإنجليزية مع الجواز' : 'Exact spelling matched with official passport'}
                    </span>
                  </div>
                </label>

                {/* 2 */}
                <label className="p-3 bg-white/90 rounded-md border border-sadu-gold/50 flex items-start gap-2.5 cursor-pointer hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={prFlags.exhibitionTitleLocked}
                    onChange={(e) => setPrFlags(prev => ({ ...prev, exhibitionTitleLocked: e.target.checked }))}
                    className="mt-0.5 rounded text-sadu-brick focus:ring-sadu-brick w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-sadu-charcoal block">
                      {isAr ? '2. تثبيت مسمى المعرض والعمل' : '2. Exhibition & Work Title Locked'}
                    </span>
                    <span className="text-[11px] text-sadu-muted block mt-0.5">
                      {isAr ? 'اعتماد التسمية ثنائية اللغة لبطاقات الجدار' : 'Bilingual typography locked for wall tags'}
                    </span>
                  </div>
                </label>

                {/* 3 */}
                <label className="p-3 bg-white/90 rounded-md border border-sadu-gold/50 flex items-start gap-2.5 cursor-pointer hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={prFlags.bioApproved}
                    onChange={(e) => setPrFlags(prev => ({ ...prev, bioApproved: e.target.checked }))}
                    className="mt-0.5 rounded text-sadu-brick focus:ring-sadu-brick w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-sadu-charcoal block">
                      {isAr ? '3. اعتماد السيرة الذاتية التحريرية' : '3. Editorial Biography Approved'}
                    </span>
                    <span className="text-[11px] text-sadu-muted block mt-0.5">
                      {isAr ? 'مراجعة قسم النشر لدليل المعرض' : 'Proofread by Editorial team for catalogue'}
                    </span>
                  </div>
                </label>

                {/* 4 */}
                <label className="p-3 bg-white/90 rounded-md border border-sadu-gold/50 flex items-start gap-2.5 cursor-pointer hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={prFlags.portraitReceived}
                    onChange={(e) => setPrFlags(prev => ({ ...prev, portraitReceived: e.target.checked }))}
                    className="mt-0.5 rounded text-sadu-brick focus:ring-sadu-brick w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-sadu-charcoal block">
                      {isAr ? '4. استلام الصورة الشخصية عالية الدقة' : '4. High-Res Artist Portrait'}
                    </span>
                    <span className="text-[11px] text-sadu-muted block mt-0.5">
                      {isAr ? '300 DPI على خلفية حيادية للصحافة والدليل' : '300 DPI studio portrait for media guide'}
                    </span>
                  </div>
                </label>

                {/* 5 */}
                <label className="p-3 bg-white/90 rounded-md border border-sadu-gold/50 flex items-start gap-2.5 cursor-pointer hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={prFlags.nationalityConfirmed}
                    onChange={(e) => setPrFlags(prev => ({ ...prev, nationalityConfirmed: e.target.checked }))}
                    className="mt-0.5 rounded text-sadu-brick focus:ring-sadu-brick w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-sadu-charcoal block">
                      {isAr ? '5. تأكيد الجنسية وبلد الإقامة' : '5. Nationality & Residence Logged'}
                    </span>
                    <span className="text-[11px] text-sadu-muted block mt-0.5">
                      {isAr ? 'لتوثيق بروتوكول التشريفات وبيانات الوفد' : 'For protocol escort & ministerial listings'}
                    </span>
                  </div>
                </label>

                {/* 6 */}
                <label className="p-3 bg-white/90 rounded-md border border-sadu-gold/50 flex items-start gap-2.5 cursor-pointer hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={prFlags.socialMediaLogged}
                    onChange={(e) => setPrFlags(prev => ({ ...prev, socialMediaLogged: e.target.checked }))}
                    className="mt-0.5 rounded text-sadu-brick focus:ring-sadu-brick w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-sadu-charcoal block">
                      {isAr ? '6. توثيق حسابات التواصل والبيان الصحفي' : '6. Social Media & Media Handles'}
                    </span>
                    <span className="text-[11px] text-sadu-muted block mt-0.5">
                      {isAr ? 'لحملة التغطية الإعلامية لدائرة الثقافة' : 'For Dept of Culture official press announcements'}
                    </span>
                  </div>
                </label>

                {/* 7 */}
                <label className="p-3 bg-white/90 rounded-md border border-sadu-gold/50 flex items-start gap-2.5 cursor-pointer hover:bg-white transition-colors sm:col-span-2 lg:col-span-3">
                  <input
                    type="checkbox"
                    checked={prFlags.guestListSubmitted}
                    onChange={(e) => setPrFlags(prev => ({ ...prev, guestListSubmitted: e.target.checked }))}
                    className="mt-0.5 rounded text-sadu-brick focus:ring-sadu-brick w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-sadu-charcoal block">
                      {isAr ? '7. قائمة ضيوف حفل الافتتاح الرسمي (VIP Guest List)' : '7. Opening Night VIP Guest List'}
                    </span>
                    <span className="text-[11px] text-sadu-muted block mt-0.5">
                      {isAr ? 'تسليم أسماء الضيوف والمرافقين المخصص لهم مقاعد في حفل الافتتاح الرسمي برعاية سمو الحاكم' : 'Submitted names for ministerial opening seating chart under patronage of H.H. Ruler of Sharjah'}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Privacy Shield Box */}
            <div className="p-4 bg-sadu-sand rounded-md border border-sadu-gold text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sadu-brick">
                <ShieldCheck className="w-4 h-4" />
                <span>{isAr ? 'حماية بيانات الهوية والامتثال للخصوصية (Audit M01/M02)' : 'Zero Raw Identity Leak Architecture (Audit M01/M02)'}</span>
              </div>
              <p className="text-sadu-charcoal leading-relaxed">
                {isAr
                  ? "يعرض هذا النموذج مراجع سفر تجريبية فقط. لم يُنفذ تشفير أو تحقق هوية أو تكامل حجوزات."
                  : "This demonstration displays sample travel references only. No encryption, identity verification or booking integration is implemented."}
              </p>
            </div>

            {/* Travel Token Ledger */}
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-sadu-linen rounded-md border border-sadu-gold flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-bold text-sadu-charcoal block">
                    {isAr ? 'يوسف نبهان (فنان مشارك)' : 'Youssef Nabhan (Participating Artist)'}
                  </span>
                  <span className="text-sadu-muted text-[11px]">
                    {isAr 
                      ? `الرحلة: EK-${localizeDigits('412')} (الوصول: ${localizeDigits('12')} أكتوبر ${localizeDigits('2026')} بمطار دبي T3) · الفندق: فندق البيت الشارقة`
                      : 'Flight: EK-412 (Arrival: 12 Oct 2026 at DXB T3) · Hotel: Chedi Al Bait Sharjah'}
                  </span>
                </div>
                <div className="text-end">
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-sadu-sand text-sadu-ink font-bold border border-sadu-gold/50">
                    {isAr ? `TOKEN: SHJ-PR-${localizeDigits('9082')}` : 'TOKEN: SHJ-PR-9082'}
                  </span>
                  <span className="text-[10px] text-sadu-sage block font-semibold">
                    {isAr ? 'تم تعيين مرافق تشريفات' : 'VIP Escort Assigned'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {subTab === 'finance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-sadu-gold/40">
              <div>
                <h3 className="font-editorial text-lg font-bold text-sadu-charcoal">
                  {isAr ? 'هيكل دفعات التكليف لبينالي الشارقة للخط' : 'Sharjah Calligraphy Biennial Commission Structure'}
                </h3>
                <span className="text-xs text-sadu-muted">
                  {isAr ? 'المسؤول: مريم الخاجة (رئيس حسابات الشؤون الثقافية) · هيكل تمويلي ثنائي المرحلة' : 'Accountable: Maryam Al-Khaja (Head of Accounts) · Two-Part Commission Governance'}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-sadu-sand border border-sadu-gold text-xs font-bold font-mono text-sadu-charcoal">
                {isAr ? `${formatCurrency(168000, 'AED')} إجمالي التكليف` : 'AED 168,000 Total Commission'}
              </span>
            </div>

            {/* Verified IBAN Card */}
            <div className="p-3.5 bg-sadu-sand rounded-md border border-sadu-gold flex items-center justify-between flex-wrap gap-2 text-xs">
              <div>
                <span className="font-bold text-sadu-charcoal block">
                  {isAr ? 'حقل مستفيد تجريبي' : 'Sample beneficiary placeholder'}
                </span>
                <span className="text-sadu-muted font-mono text-[11px]">
                  {isAr ? 'لا توجد بيانات مصرفية فعلية في هذا المثال.' : 'No real bank details are included in this example.'}
                </span>
              </div>
              <span className="text-sadu-sage font-semibold text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'غير متحقق منه · تجريبي فقط' : 'Not verified · sample only'}</span>
              </span>
            </div>

            {/* TWO-PART COMMISSION MILESTONES */}
            <div className="space-y-4">
              {/* MILESTONE 1: Advance Payment for Materials (30%) */}
              <div className="p-4 bg-sadu-sage-light/50 rounded-lg border border-sadu-sage text-xs space-y-3">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-sadu-sage text-white font-mono font-bold text-[10px]">
                        {isAr ? 'المرحلة 1 (30%)' : 'Milestone 1 (30%)'}
                      </span>
                      <h4 className="font-bold text-sm text-sadu-charcoal">
                        {isAr ? 'الدفعة المقدمة لشراء المواد والتجهيز الفني' : 'Advance Payment for Materials'}
                      </h4>
                    </div>
                    <p className="text-sadu-charcoal text-[11px] leading-relaxed">
                      {isAr
                        ? 'تُصرف تلقائياً بمجرد توقيع العقد الثنائي الرسمي بين الفنان وإدارة الشؤون الثقافية لشراء المواد التأسيسية وأدوات الخط.'
                        : 'Unlocked automatically when the Bilateral Contract is officially executed. Intended for raw material acquisition and archival preparation.'}
                    </p>
                  </div>

                  <div className="text-end shrink-0">
                    <span className="text-sm font-bold font-mono text-sadu-charcoal block">
                      {isAr ? `${formatCurrency(50400, 'AED')}` : 'AED 50,400'}
                    </span>
                    <span className="text-[10px] text-sadu-muted font-mono block">
                      {isAr ? `(يعادل ${formatCurrency(13725, 'USD')})` : '($13,725 USD)'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-sadu-sage/40 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                  <div className="flex items-center gap-2 font-mono text-sadu-ink">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sadu-sage" />
                    <span>{isAr ? 'حوالة مصرفية مسجلة: سند صرف #PV-2026-0312' : 'Voucher #PV-2026-0312 · Contract SCB-CTR-2026-0914'}</span>
                  </div>

                  <span className="px-2.5 py-1 rounded bg-sadu-sage text-white font-bold text-[10px] uppercase tracking-wider">
                    {isAr ? "مدفوع · محاكاة" : "Paid · simulated"}
                  </span>
                </div>
              </div>

              {/* MILESTONE 2: Final Exhibition Settlement (70%) */}
              <div className={`p-4 rounded-lg border text-xs space-y-3 transition-all ${
                exhibitionOpened
                  ? 'bg-sadu-sage-light/50 border-sadu-sage'
                  : 'bg-sadu-sand border-sadu-gold'
              }`}>
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        exhibitionOpened
                          ? 'bg-sadu-sage text-white'
                          : 'bg-sadu-brick text-white'
                      }`}>
                        {isAr ? 'المرحلة 2 (70%)' : 'Milestone 2 (70%)'}
                      </span>
                      <h4 className="font-bold text-sm text-sadu-charcoal">
                        {isAr ? 'التسوية النهائية للمعرض (الاستحقاق الختامي)' : 'Final Exhibition Settlement'}
                      </h4>
                    </div>
                    <p className="text-sadu-charcoal text-[11px] leading-relaxed">
                      {isAr
                        ? 'مقفلة ببوابة أمان: لا تُصرف إلا بعد الافتتاح الرسمي للبينالي أمام الجمهور بمتحف الشارقة للفنون وصدور محضر تدشين المعرض.'
                        : 'Gated and unlocked strictly when the exhibition officially opens to the public at Sharjah Art Museum.'}
                    </p>
                  </div>

                  <div className="text-end shrink-0">
                    <span className="text-sm font-bold font-mono text-sadu-charcoal block">
                      {isAr ? `${formatCurrency(117600, 'AED')}` : 'AED 117,600'}
                    </span>
                    <span className="text-[10px] text-sadu-muted font-mono block">
                      {isAr ? `(يعادل ${formatCurrency(32020, 'USD')})` : '($32,020 USD)'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-sadu-gold/50 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-3.5 h-3.5 ${exhibitionOpened ? 'text-sadu-sage' : 'text-sadu-brick'}`} />
                    <span className={exhibitionOpened ? 'text-sadu-sage font-semibold' : 'text-sadu-charcoal font-medium'}>
                      {exhibitionOpened
                        ? (isAr ? 'تم التحقق من الافتتاح الرسمي · محضر تدشين المعرض معتمد' : 'Vernissage protocol verified · Exhibition officially open to the public')
                        : (isAr ? 'شرط الصرف: الافتتاح الرسمي بمتحف الشارقة للفنون (12 أكتوبر 2026)' : 'Condition Gate: Sharjah Art Museum Public Vernissage (12 October 2026)')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExhibitionOpened(!exhibitionOpened)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
                        exhibitionOpened
                          ? 'bg-sadu-sand text-sadu-charcoal border-sadu-gold hover:bg-sadu-sand-dark'
                          : 'bg-sadu-linen text-sadu-brick border-sadu-brick/40 hover:bg-sadu-sand'
                      }`}
                    >
                      {exhibitionOpened
                        ? (isAr ? 'إعادة الإقفال' : 'Reset Vernissage Gate')
                        : (isAr ? 'محاكاة الافتتاح الرسمي' : 'Simulate Vernissage Opening')}
                    </button>

                    <span className={`px-2.5 py-1 rounded font-bold text-[10px] uppercase tracking-wider border ${
                      exhibitionOpened
                        ? 'bg-sadu-sage text-white border-sadu-sage'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}>
                      {exhibitionOpened
                        ? (isAr ? "مدفوع · محاكاة" : "Paid · simulated")
                        : (isAr ? 'معلق لحين الافتتاح الرسمي للمعرض' : 'Pending Exhibition Opening')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* TOAST ALERTS */}
            {bidAddedSuccessToast && (
              <div className="p-3 bg-sadu-sage-light border border-sadu-sage rounded-md text-xs text-sadu-ink flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-sadu-sage shrink-0" />
                <span>{bidAddedSuccessToast}</span>
              </div>
            )}

            {lpoIssuedSuccessToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-500 rounded-md text-xs text-emerald-900 flex items-center gap-2 animate-fade-in font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{lpoIssuedSuccessToast}</span>
              </div>
            )}

            {/* SECTION 2: GOVERNMENT PROCUREMENT & BIDDING GATE */}
            <div className="pt-6 border-t-2 border-sadu-gold/50 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-sadu-gold/30 flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-sadu-brick" />
                    <h3 className="font-editorial text-lg font-bold text-sadu-charcoal">
                      {isAr ? 'المشتريات والمناقصات الحكومية (Procurement & Bidding)' : 'Government Procurement & Bidding Gateway'}
                    </h3>
                  </div>
                  <span className="text-xs text-sadu-muted">
                    {isAr
                      ? "سيناريو مشتريات · ثلاثة عروض تجريبية ومراجعة مقترحة لأمر الشراء"
                      : "Procurement scenario · three sample quotations and a proposed order review"}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenRfq('printing')}
                  className="px-3 py-1.5 rounded text-xs font-bold bg-sadu-sand text-sadu-charcoal border border-sadu-gold hover:bg-sadu-sand-dark transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-sadu-brick" />
                  <span>{isAr ? 'معاينة طلب عروض أسعار تجريبي (RFQ)' : 'Preview sample RFQ document'}</span>
                </button>
              </div>

              {/* Illustrative scenario checks */}
              <div className="p-4 rounded-lg border-2 border-sadu-brick bg-rose-50/90 text-sadu-brick space-y-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-sadu-brick shrink-0" />
                  <h4 className="font-bold text-sm text-sadu-brick">
                    {isAr ? 'سيناريو مشتريات — يتطلب التحقق المؤسسي' : 'Procurement scenario — institutional validation required'}
                  </h4>
                </div>
                <p className="text-xs leading-relaxed text-sadu-charcoal font-medium">
                  <strong>
                    {isAr
                      ? 'افتراض السيناريو: مقارنة ثلاثة عروض تجريبية ومراجعة الملاءمة الفنية قبل محاكاة الأمر.'
                      : 'Scenario assumption: compare three sample quotations and review technical suitability before simulating an order.'}
                  </strong>
                </p>
                <p className="text-[11px] leading-relaxed text-sadu-muted">
                  {isAr
                    ? 'يلزم التحقق من سياسة المشتريات والاستثناءات والصلاحية المفوضة المنطبقة. لا تصدر المعاينة أوامر ولا تحدد أهلية الفواتير.'
                    : 'Applicable procurement policy, exceptions and delegated authority require validation. This preview cannot issue orders or determine invoice eligibility.'}
                </p>
              </div>

              {/* PROCUREMENT PACKAGES LIST */}
              <div className="space-y-5">
                {procurementPackages.map((pkg) => {
                  const compliantBidsCount = pkg.bids.length;
                  const hasThreeBids = compliantBidsCount >= 3;
                  const lowestBid = [...pkg.bids].sort((a, b) => a.submittedPrice - b.submittedPrice)[0];

                  return (
                    <div
                      key={pkg.id}
                      className="p-5 rounded-lg bg-sadu-sand/90 border border-sadu-gold space-y-4 shadow-2xs"
                    >
                      {/* Package Header */}
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-sadu-ink text-white">
                              {pkg.code}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sadu-linen border border-sadu-gold text-sadu-charcoal capitalize">
                              {pkg.category}
                            </span>
                            {pkg.linkedArtworkTitleAr && (
                              <span className="text-[11px] text-sadu-muted font-medium">
                                · {isAr ? pkg.linkedArtworkTitleAr : pkg.linkedArtworkTitleEn}
                              </span>
                            )}
                          </div>
                          <h4 className="font-editorial text-base font-bold text-sadu-charcoal">
                            {isAr ? pkg.titleAr : pkg.titleEn}
                          </h4>
                          <p className="text-xs text-sadu-charcoal leading-relaxed max-w-3xl">
                            {isAr ? pkg.scopeDescriptionAr : pkg.scopeDescriptionEn}
                          </p>
                        </div>

                        <div className="text-end shrink-0 space-y-1">
                          <span className="text-xs text-sadu-muted block">
                            {isAr ? 'الموازنة التقديرية المعتمدة' : 'Allocated Budget'}
                          </span>
                          <span className="text-base font-bold font-mono text-sadu-charcoal block">
                            {formatCurrency(pkg.budgetAllocatedAed, 'AED')}
                          </span>
                        </div>
                      </div>

                      {/* Compliance Status Badges */}
                      <div className="p-3 bg-sadu-linen rounded-md border border-sadu-gold flex items-center justify-between flex-wrap gap-3 text-xs">
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sadu-charcoal">
                              {isAr ? 'اكتمال العروض:' : 'Tenders Received:'}
                            </span>
                            <span className={`px-2 py-0.5 rounded font-bold font-mono text-[11px] ${
                              hasThreeBids 
                                ? 'bg-sadu-sage/20 text-sadu-ink border border-sadu-sage' 
                                : 'bg-rose-100 text-sadu-brick border border-rose-300'
                            }`}>
                              {hasThreeBids 
                                ? (isAr ? `✓ ${formatNumber(compliantBidsCount)} من أصل ${formatNumber(3)} (مستوفٍ)` : `✓ ${compliantBidsCount}/3 Compliant`)
                                : (isAr ? `✗ ${formatNumber(compliantBidsCount)} فقط من أصل ${formatNumber(3)} (غير مستوفٍ)` : `✗ ${compliantBidsCount}/3 Insufficient`)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-sadu-sage" />
                            <span className="text-sadu-charcoal text-[11px]">
                              {isAr ? 'موردون مسجلون لدى دائرة المالية المركزية' : '100% Registered Suppliers'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sadu-sage" />
                            <span className="text-sadu-charcoal text-[11px]">
                              {isAr ? 'فحص فني ومطابقة مواصفات (Blind Vetting)' : 'Technical Compliance Vetted'}
                            </span>
                          </div>
                        </div>

                        <StatusProgressIndicator
                          type="procurement"
                          statusLevel={pkg.status === 'lpo_issued' ? 'completed' : pkg.status === 'pending_lpo' ? 'pending_lpo' : 'pending'}
                          label={
                            pkg.status === 'lpo_issued'
                              ? (isAr ? `أمر شراء صادر (${pkg.lpoNumber})` : `LPO Issued (${pkg.lpoNumber})`)
                              : pkg.status === 'pending_lpo'
                              ? (isAr ? 'مستوفٍ للشروط · بانتظار LPO' : 'Ready for LPO Issuance')
                              : (isAr ? 'قائمة السيناريو ناقصة' : 'Locked: Need 3 Bids')
                          }
                        />
                      </div>

                      {/* BIDS TABLE / CARDS */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-sadu-charcoal block">
                          {isAr ? `عروض الأسعار المقدمة (${formatNumber(pkg.bids.length)} عروض تنافسية مسجلة)` : `Submitted Competitive Tenders (${pkg.bids.length} Received)`}
                        </span>

                        <div className="grid gap-2">
                          {pkg.bids.map((bid) => {
                            const isLowest = lowestBid?.id === bid.id && hasThreeBids;
                            const isWinning = pkg.issuedVendorId === bid.id;

                            return (
                              <div
                                key={bid.id}
                                className={`p-3 rounded-md border text-xs flex items-center justify-between flex-wrap gap-2 transition-all ${
                                  isWinning
                                    ? 'bg-sadu-sage-light/70 border-sadu-sage ring-1 ring-sadu-sage'
                                    : isLowest
                                    ? 'bg-amber-50/70 border-amber-300'
                                    : 'bg-white/80 border-sadu-gold/60'
                                }`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-sadu-charcoal">
                                      {isAr ? bid.vendorNameAr : bid.vendorName}
                                    </span>

                                    {bid.isRegisteredSupplier && (
                                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold flex items-center gap-1 border border-emerald-300">
                                        <Building2 className="w-3 h-3" />
                                        <span>{isAr ? 'مورد مسجل' : 'Registered Supplier'}</span>
                                      </span>
                                    )}

                                    {bid.technicalApproval && (
                                      <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-semibold flex items-center gap-1 border border-sky-300">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>{isAr ? 'معتمد فنياً' : 'Technically Approved'}</span>
                                      </span>
                                    )}

                                    {isLowest && (
                                      <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold flex items-center gap-1 border border-amber-400">
                                        <Award className="w-3 h-3 text-amber-800" />
                                        <span>{isAr ? 'الأقل سعراً والمطابق للمواصفات' : 'Lowest Compliant Bid'}</span>
                                      </span>
                                    )}

                                    {isWinning && (
                                      <span className="px-2 py-0.5 rounded bg-sadu-sage text-white text-[10px] font-bold flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" />
                                        <span>{isAr ? 'تمت الترسية وأمر الشراء' : 'Awarded Tender'}</span>
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3 text-sadu-muted text-[11px]">
                                    <span className="font-mono">Ref: {bid.quotationRef}</span>
                                    <span>·</span>
                                    <span>{bid.submissionDate}</span>
                                    <span>·</span>
                                    <span className="italic">{bid.technicalNotes}</span>
                                  </div>
                                </div>

                                <div className="text-end shrink-0">
                                  <span className="font-mono font-bold text-sm text-sadu-charcoal block">
                                    {formatCurrency(bid.submittedPrice, 'AED')}
                                  </span>
                                  <span className="text-[10px] text-sadu-muted">
                                    {isAr 
                                      ? `وفر عن الموازنة: ${formatCurrency(pkg.budgetAllocatedAed - bid.submittedPrice, 'AED')}` 
                                      : `Variance: -${formatCurrency(pkg.budgetAllocatedAed - bid.submittedPrice, 'AED')}`}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* ACTION FOOTER */}
                      <div className="pt-3 border-t border-sadu-gold/50 flex items-center justify-between flex-wrap gap-2 text-xs">
                        {pkg.status === 'pending_bids' && (
                          <>
                            <div className="flex items-center gap-2 text-sadu-brick">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span className="font-semibold text-[11px]">
                                {isAr
                                  ? "أمر الشراء التجريبي متوقف: ينقص هذا السيناريو العرض الثالث."
                                  : "Sample order blocked: this scenario is missing its third quotation."}
                              </span>
                            </div>

                            <button
                              onClick={() => handleAddThirdBid(pkg.id)}
                              className="px-3.5 py-1.5 rounded text-xs font-bold bg-sadu-brick text-white hover:bg-sadu-brick-dark transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>{isAr ? 'إيداع العرض التنافسي الثالث (صناعات القاسمي)' : 'Upload 3rd Competitive Bid'}</span>
                            </button>
                          </>
                        )}

                        {pkg.status === 'pending_lpo' && (
                          <>
                            <div className="flex items-center gap-2 text-sadu-ink">
                              <CheckCircle2 className="w-4 h-4 text-sadu-sage shrink-0" />
                              <span className="font-semibold text-[11px]">
                                {isAr
                                  ? `قائمة السيناريو: ثلاثة عروض تجريبية. اقتراح أقل سعر: ${lowestBid?.vendorNameAr || lowestBid?.vendorName}`
                                  : `Scenario checklist: 3 sample quotes. Proposed lowest-price selection: ${lowestBid?.vendorName}`}
                              </span>
                            </div>

                            <button
                              onClick={() => handleIssueLpo(pkg.id, lowestBid?.id || '')}
                              className="px-4 py-2 rounded text-xs font-bold bg-sadu-sage text-white hover:bg-sadu-sage/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              <span>{isAr ? 'تسجيل أمر شراء تجريبي (LPO)' : 'Record sample purchase order (LPO)'}</span>
                            </button>
                          </>
                        )}

                        {pkg.status === 'lpo_issued' && (
                          <div className="w-full flex items-center justify-between flex-wrap gap-2 text-[11px]">
                            <div className="flex items-center gap-2 text-sadu-ink">
                              <ShieldCheck className="w-4 h-4 text-sadu-sage" />
                              <span className="font-bold">
                                {isAr
                                  ? `أمر الشراء نافذ ومسجل رسمياً: ${pkg.lpoNumber} (تاريخ الصرف: ${pkg.lpoIssueDate})`
                                  : `Sample LPO recorded: ${pkg.lpoNumber} (Issued: ${pkg.lpoIssueDate})`}
                              </span>
                            </div>

                            <span className="px-3 py-1 rounded bg-sadu-sage/20 border border-sadu-sage text-sadu-ink font-mono font-bold text-[11px]">
                              {isAr ? '✓ مرخص للتنفيذ وصرف الفواتير' : '✓ Authorized for Invoicing'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {subTab === 'editorial' && (
          <EditorialPipeline />
        )}
      </div>

      {/* Institutional Printable Report & Export Modal */}
      <PrintableReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        metadata={reportMetadata}
        metrics={reportMetrics}
        records={reportRecords}
      />

      {/* Formal Government RFQ Document Generator Modal */}
      <RfqGeneratorModal
        isOpen={showRfqModal}
        onClose={() => setShowRfqModal(false)}
        defaultPackageCategory={rfqDefaultCategory}
      />
    </div>
  );
};
