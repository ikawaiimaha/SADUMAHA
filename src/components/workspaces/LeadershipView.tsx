import React, { useState } from 'react';
import { Language, ExhibitionProgramme, WorkspaceTab } from '../../types';
import { PROGRAMMES, INSTITUTIONAL_INFO } from '../../data/mockData';
import { useI18n } from '../../context/I18nContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { LeadershipPersonaSuite } from '../LeadershipPersonaSuite';
import { PersonaReviewModal } from '../PersonaReviewModal';
import { KpiCard } from '../common/KpiCard';
import { PrintableReportModal } from '../common/PrintableReportModal';
import { StatusProgressIndicator } from '../common/StatusProgressIndicator';
import { requiresBrowserPrint, downloadInstitutionalPdfReport, KpiSummaryMetric, ReportFilterMetadata } from '../../utils/pdfExport';
import { 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  DollarSign, 
  Building, 
  ArrowUpRight,
  Sparkles,
  Award,
  Layers,
  Scale,
  Filter,
  X,
  FileDown,
  Printer,
  BarChart3
} from 'lucide-react';

export interface LeadershipViewProps {
  lang?: Language;
  selectedProgramme?: ExhibitionProgramme;
  onSelectProgramme?: (prog: ExhibitionProgramme) => void;
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

export const LeadershipView: React.FC<LeadershipViewProps> = (props) => {
  const i18n = useI18n();
  const workspace = useWorkspace();

  const lang = props.lang ?? i18n.lang;
  const isAr = lang === 'ar';
  const { formatNumber, formatPercent, formatRatio, formatCurrency, localizeDigits } = i18n;
  const selectedProgramme = props.selectedProgramme ?? workspace.selectedProgramme;
  const onSelectProgramme = props.onSelectProgramme ?? workspace.setSelectedProgramme;
  const onNavigateTab = props.onNavigateTab ?? workspace.navigateTab;

  const [viewMode, setViewMode] = useState<'portfolio' | 'personas'>('personas');
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [portfolioFilter, setPortfolioFilter] = useState<'all' | 'at-risk' | 'completed' | 'committed'>('all');
  const [showReportModal, setShowReportModal] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  const totalPlanned = PROGRAMMES.reduce((acc, p) => acc + p.budgetPlanned, 0);
  const totalCommitted = PROGRAMMES.reduce((acc, p) => acc + p.budgetCommitted, 0);
  const totalSpent = PROGRAMMES.reduce((acc, p) => acc + p.budgetSpent, 0);

  const filteredProgrammes = PROGRAMMES.filter((prog) => {
    if (portfolioFilter === 'at-risk') return prog.criticalRisks > 0;
    if (portfolioFilter === 'completed') return prog.status === 'concluded' || prog.progressPercent >= 70;
    if (portfolioFilter === 'committed') return prog.budgetCommitted > 0;
    return true;
  });

  const handleKpiFilter = (filterType: 'all' | 'at-risk' | 'completed' | 'committed') => {
    setPortfolioFilter(prev => prev === filterType ? 'all' : filterType);
    setViewMode('portfolio');
  };

  // Report preparation for export
  const reportMetadata: ReportFilterMetadata = {
    programmeName: isAr ? 'محفظة المبادرات والمعارض المؤسسية' : 'Sharjah Cultural Initiatives & Biennale Matrix',
    categoryFilter: 'Executive Oversight',
    statusFilter: portfolioFilter,
    generatedBy: isAr ? 'المكتب التنفيذي للشؤون الثقافية' : 'Executive Leadership Office',
    totalRecords: filteredProgrammes.length,
    workspaceType: 'leadership',
  };

  const reportMetrics: KpiSummaryMetric[] = [
    {
      label: isAr ? 'الميزانية المعتمدة' : 'Total Planned Budget',
      value: isAr ? `${formatNumber(Math.round(totalPlanned / 1000))} ألف درهم` : `${formatNumber(Math.round(totalPlanned / 1000))}k AED`,
      subtitle: isAr ? 'المحافظ الكبرى' : 'Portfolio scope',
    },
    {
      label: isAr ? 'الالتزامات التعاقدية' : 'Committed Contracts',
      value: isAr ? `${formatNumber(Math.round(totalCommitted / 1000))} ألف درهم` : `${formatNumber(Math.round(totalCommitted / 1000))}k AED`,
      status: 'ink',
      subtitle: isAr ? `${formatPercent(Math.round((totalCommitted / totalPlanned) * 100))} التزام` : `${Math.round((totalCommitted / totalPlanned) * 100)}% committed`,
    },
    {
      label: isAr ? 'بوابات الجاهزية' : 'Readiness Cleared',
      value: isAr ? `${formatRatio(49, 64)} (٧٦٪)` : '49 / 64 (76%)',
      status: 'success',
      subtitle: isAr ? 'مكتملة ومحققة' : 'Verified gates',
    },
    {
      label: isAr ? 'حالات الخطر الحرجة' : 'Strategic Bottlenecks',
      value: isAr ? `${formatNumber(1)} حرجة` : '1 Critical',
      status: 'danger',
      subtitle: isAr ? 'تتطلب تدخلاً' : 'Action required',
    },
  ];

  const reportRecords = filteredProgrammes.map(prog => ({
    id: prog.id,
    title: isAr ? prog.titleAr : prog.titleEn,
    category: isAr ? prog.themeAr : prog.themeEn,
    priority: prog.criticalRisks > 0 ? 'critical' : 'normal',
    status: prog.status,
    assigneeOrArtist: isAr ? prog.venueAr : prog.venueEn,
    dueDateOrProgress: `${formatPercent(prog.progressPercent)} (${isAr ? `${formatNumber(Math.round(prog.budgetCommitted / 1000))} ألف درهم` : `${formatNumber(Math.round(prog.budgetCommitted / 1000))}k AED`})`,
  }));

  const handleDirectDownloadReport = () => {
    if (requiresBrowserPrint(reportMetadata, reportMetrics, reportRecords)) {
      setShowReportModal(true);
      return;
    }
    downloadInstitutionalPdfReport(reportMetadata, reportMetrics, reportRecords);
    setDownloadSuccessToast(isAr ? 'تم إنشاء وتحميل تقرير المؤشرات المؤسسي كملف PDF بنجاح' : 'Institutional KPI PDF report generated and downloaded.');
    setTimeout(() => setDownloadSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Executive Banner */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-1">
              <Building className="w-4 h-4" />
              <span>{isAr ? 'رادار الإشراف الاستراتيجي والمحافظ الثقافية' : 'Executive Portfolio Oversight & Strategic Radar'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'منظور القيادة والحوكمة المؤسسية' : 'Executive Leadership & Governance Desk'}
            </h1>
            <p className="text-xs sm:text-sm text-sadu-muted mt-1">
              {isAr 
                ? `متابعة شمولية لبرامج دائرة الثقافة في الشارقة · منظور ${INSTITUTIONAL_INFO.chairmanAr}`
                : `Institutional portfolio health across Sharjah Department of Culture · Perspective of ${INSTITUTIONAL_INFO.chairmanEn}`}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto flex-wrap">
            <button
              onClick={() => setShowPersonaModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-sadu-brick hover:bg-sadu-brick-dark text-white text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>{isAr ? 'مراجعة وتقييم القيادة (3 مستويات)' : 'Persona UX Audit (3 Levels)'}</span>
            </button>

            <div className="px-3.5 py-2 bg-sadu-sand rounded-md border border-sadu-gold text-center">
              <span className="text-[10px] text-sadu-muted uppercase block font-semibold">
                {isAr ? 'مؤشر اكتمال الأدلة M01' : 'M01 Evidence Score'}
              </span>
              <span className="font-editorial text-2xl font-bold text-sadu-ink">{formatPercent(94.2, 1)}</span>
            </div>

            <div className="px-3.5 py-2 bg-sadu-sand rounded-md border border-sadu-gold text-center">
              <span className="text-[10px] text-sadu-muted uppercase block font-semibold">
                {isAr ? 'الاستثناءات النشطة' : 'Active Exceptions'}
              </span>
              <span className="font-editorial text-2xl font-bold text-sadu-brick">{formatNumber(3)}</span>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-sadu-gold/50 flex-wrap">
          <button
            onClick={() => setViewMode('personas')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-colors flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'personas'
                ? 'bg-sadu-ink text-white border-sadu-ink shadow-2xs'
                : 'bg-sadu-linen text-sadu-charcoal border-sadu-gold hover:bg-sadu-sand'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-amber-300" />
            <span>{isAr ? 'محاكاة تقييم القيادة (3 مستويات تفاعلية)' : 'Multi-Level Leadership Evaluation Suite (3 Personas)'}</span>
          </button>

          <button
            onClick={() => setViewMode('portfolio')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-colors flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'portfolio'
                ? 'bg-sadu-ink text-white border-sadu-ink shadow-2xs'
                : 'bg-sadu-linen text-sadu-charcoal border-sadu-gold hover:bg-sadu-sand'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isAr ? 'رادار الميزانية والمحافظ التقليدي' : 'Portfolio Radar & Milestone Matrix'}</span>
          </button>
        </div>

        {/* Executive KPI Section Header with Download Report */}
        <div className="mt-6 pt-6 border-t border-sadu-gold/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sadu-charcoal flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-sadu-brick" />
              <span>{isAr ? 'مؤشرات الأداء المؤسسية (KPIs)' : 'Executive KPI Benchmarks & Risk Matrix'}</span>
            </span>
            <span className="text-[11px] text-sadu-muted font-mono">
              ({formatNumber(filteredProgrammes.length)} {isAr ? 'مبادرة في النطاق' : 'initiatives in scope'})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {downloadSuccessToast && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-sadu-sage bg-sadu-sage-light px-2.5 py-1 rounded">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{downloadSuccessToast}</span>
              </span>
            )}

            <button
              id="btn-leadership-download-report"
              onClick={handleDirectDownloadReport}
              className="px-3 py-1.5 text-xs font-bold rounded-md bg-sadu-brick text-white hover:bg-sadu-brick-dark transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
              title={isAr ? 'تنزيل فوري لتقرير PDF للبيانات المفلترة الحالية' : 'Download clean printable PDF version of current filtered data'}
            >
              <FileDown className="w-3.5 h-3.5 text-sadu-gold" />
              <span>{isAr ? 'تنزيل التقرير (PDF)' : 'Download Report'}</span>
            </button>

            <button
              id="btn-leadership-preview-report"
              onClick={() => setShowReportModal(true)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-sadu-linen border border-sadu-gold text-sadu-charcoal hover:bg-sadu-sand transition-colors flex items-center gap-1.5 cursor-pointer"
              title={isAr ? 'معاينة المستند المؤسسي والطباعة' : 'Preview institutional audit document and print view'}
            >
              <Printer className="w-3.5 h-3.5 text-sadu-ink" />
              <span className="hidden sm:inline">{isAr ? 'معاينة وطباعة' : 'Print View'}</span>
            </button>
          </div>
        </div>

        {/* 4-Metric Bento Box Grid using KpiCard Component with Interactive Drill-down */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
          <KpiCard
            title={isAr ? 'الميزانية الإجمالية المعتمدة' : 'Total Portfolio Planned'}
            value={isAr ? `${formatNumber(Math.round(totalPlanned / 1000))} ألف درهم` : `${formatNumber(Math.round(totalPlanned / 1000))}k AED`}
            subtitle={isAr ? 'انقر لعرض كافة المبادرات' : 'Click to display all initiatives'}
            statusColor="neutral"
            onClick={() => handleKpiFilter('all')}
            isActive={portfolioFilter === 'all'}
            filterLabel={isAr ? 'عرض كافة المحافظ' : 'All Programmes'}
            filterActiveText={isAr ? 'كافة المحافظ معروضة' : 'All Programmes Active'}
          />

          <KpiCard
            title={isAr ? 'الالتزامات التعاقدية المثبتة' : 'Contractual Commitments'}
            value={isAr ? `${formatNumber(Math.round(totalCommitted / 1000))} ألف درهم` : `${formatNumber(Math.round(totalCommitted / 1000))}k AED`}
            subtitle={isAr ? 'انقر لتصفية البرامج ذات الالتزامات' : 'Click to filter committed scopes'}
            trend={formatPercent(Math.round((totalCommitted / totalPlanned) * 100))}
            trendDirection="neutral"
            statusColor="ink"
            onClick={() => handleKpiFilter('committed')}
            isActive={portfolioFilter === 'committed'}
            filterLabel={isAr ? 'تصفية: الالتزامات' : 'Filter: Committed'}
            filterActiveText={isAr ? 'تصفية: الالتزامات نشطة' : 'Filtered: Committed'}
          />

          <KpiCard
            title={isAr ? 'بوابات الجاهزية المكتملة' : 'Readiness Gates Cleared'}
            value={formatRatio(49, 64)}
            subtitle={isAr ? 'انقر لفرز البرامج المكتملة والمرتفعة' : 'Click to filter completed / high readiness'}
            trend={formatPercent(76)}
            trendDirection="up"
            statusColor="success"
            onClick={() => handleKpiFilter('completed')}
            isActive={portfolioFilter === 'completed'}
            filterLabel={isAr ? 'تصفية: المكتمل' : 'Filter: Completed'}
            filterActiveText={isAr ? 'تصفية: المكتمل نشطة' : 'Filtered: Completed'}
          />

          <KpiCard
            title={isAr ? 'حالات تعارض أو مخاطر' : 'Strategic Bottlenecks'}
            value={isAr ? `${formatNumber(1)} حرجة` : '1 Critical'}
            subtitle={isAr ? 'انقر لفرز البرامج ذات الاستثناءات الحرجة' : 'Click to drill down into At Risk scopes'}
            statusColor="danger"
            onClick={() => handleKpiFilter('at-risk')}
            isActive={portfolioFilter === 'at-risk'}
            filterLabel={isAr ? 'تصفية: تحت الخطر' : 'Filter: At Risk'}
            filterActiveText={isAr ? 'تصفية: تحت الخطر نشطة' : 'Filtered: At Risk'}
          />
        </div>
      </div>

      {/* Render Persona Suite or Traditional Portfolio View */}
      {viewMode === 'personas' ? (
        <LeadershipPersonaSuite
          lang={lang}
          selectedProgramme={selectedProgramme}
          onNavigateTab={onNavigateTab}
        />
      ) : (
        <>
          {/* Cross-Programme Health Comparison Table — Responsive Card-Based Ledger */}
          <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-4 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">
                  {isAr ? 'مصفوفة البرامج والمعارض المعتمدة' : 'Institutional Programme Portfolio Matrix'}
                </h2>
                <p className="text-xs text-sadu-muted">
                  {isAr ? 'مقارنة دقيقة بين نسب الإنجاز، الصرف الفعلي، وجاهزية البوابات' : 'Comparison of progress, fiscal commitments, and operational milestones'}
                </p>
              </div>

              {/* Status Filter Badges for Portfolio */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setPortfolioFilter('all')}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                    portfolioFilter === 'all'
                      ? 'bg-sadu-ink text-white border-sadu-ink font-bold shadow-2xs'
                      : 'bg-sadu-linen text-sadu-muted border-sadu-gold hover:bg-sadu-sand'
                  }`}
                >
                  {isAr ? 'الكل' : 'All'}
                </button>
                <button
                  onClick={() => setPortfolioFilter('at-risk')}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer flex items-center gap-1 ${
                    portfolioFilter === 'at-risk'
                      ? 'bg-red-800 text-white border-red-800 font-bold shadow-2xs'
                      : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>{isAr ? 'تحت الخطر' : 'At Risk'}</span>
                </button>
                <button
                  onClick={() => setPortfolioFilter('completed')}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer flex items-center gap-1 ${
                    portfolioFilter === 'completed'
                      ? 'bg-sadu-sage text-white border-sadu-sage font-bold shadow-2xs'
                      : 'bg-sadu-sage-light/40 text-sadu-sage border-sadu-sage/30 hover:bg-sadu-sage-light'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isAr ? 'المكتمل' : 'Completed'}</span>
                </button>
                <button
                  onClick={() => setPortfolioFilter('committed')}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                    portfolioFilter === 'committed'
                      ? 'bg-sadu-brick text-white border-sadu-brick font-bold shadow-2xs'
                      : 'bg-sadu-linen text-sadu-muted border-sadu-gold hover:bg-sadu-sand'
                  }`}
                >
                  {isAr ? 'ملتزم به' : 'Committed'}
                </button>
              </div>
            </div>

            {/* Drill-down Status Notification Banner */}
            {portfolioFilter !== 'all' && (
              <div className="flex items-center justify-between p-2.5 mb-4 bg-sadu-sand border border-sadu-gold/70 rounded-md text-xs">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-sadu-brick" />
                  <span className="font-semibold text-sadu-charcoal">
                    {isAr ? 'تصفية البرامج النشطة:' : 'Active Programme Filter:'}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                    portfolioFilter === 'at-risk'
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : portfolioFilter === 'completed'
                      ? 'bg-sadu-sage-light text-sadu-ink border border-sadu-sage'
                      : 'bg-sadu-ink-light text-sadu-ink border border-sadu-ink/30'
                  }`}>
                    {portfolioFilter === 'at-risk' && (isAr ? 'تحت الخطر / استثناءات حرجة' : 'At Risk / Critical Bottlenecks')}
                    {portfolioFilter === 'completed' && (isAr ? 'بوابات مكتملة / جاهزية عالية' : 'Completed / High Readiness')}
                    {portfolioFilter === 'committed' && (isAr ? 'التزامات تعاقدية جارية' : 'Active Commitments')}
                    <span>({formatNumber(filteredProgrammes.length)})</span>
                  </span>
                </div>

                <button
                  onClick={() => setPortfolioFilter('all')}
                  className="text-[11px] font-semibold text-sadu-brick hover:text-sadu-brick-dark flex items-center gap-1 cursor-pointer bg-sadu-linen px-2 py-0.5 rounded border border-sadu-gold hover:bg-sadu-sand transition-colors"
                >
                  <X className="w-3 h-3" />
                  <span>{isAr ? 'إلغاء التصفية' : 'Clear filter'}</span>
                </button>
              </div>
            )}

            {/* Desktop Semantic Table */}
            <div className="hidden md:block w-full overflow-hidden rounded-lg border border-sadu-gold/50">
              <table className="w-full text-xs text-start border-collapse">
                <thead>
                  <tr className="bg-sadu-ink text-white">
                    <th className="p-3 font-semibold">{isAr ? 'البرنامج / المعرض' : 'Programme / Exhibition'}</th>
                    <th className="p-3 font-semibold">{isAr ? 'الحالة والمكان' : 'Status & Venue'}</th>
                    <th className="p-3 font-semibold">{isAr ? 'الميزانية (المنصرف / المعتمد)' : 'Budget (Spent / Planned)'}</th>
                    <th className="p-3 font-semibold">{isAr ? 'الجاهزية والتقدم' : 'Gates & Progress'}</th>
                    <th className="p-3 font-semibold text-center">{isAr ? 'إجراء القيادة' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sadu-gold/40">
                  {filteredProgrammes.length > 0 ? (
                    filteredProgrammes.map((prog) => {
                    const isSelected = prog.id === selectedProgramme.id;
                    return (
                      <tr 
                        key={prog.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-sadu-sand' : 'bg-sadu-linen hover:bg-sadu-sand/60'
                        }`}
                      >
                        {/* Title & Dates */}
                        <td className="p-3 font-medium">
                          <div className="font-bold text-sadu-charcoal text-sm">
                            {isAr ? prog.titleAr : prog.titleEn}
                          </div>
                          <span className="text-[11px] text-sadu-muted">{localizeDigits(prog.dates)}</span>
                        </td>

                        {/* Status & Venue */}
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${
                            prog.status === 'production' 
                              ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                              : prog.status === 'planning' 
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}>
                            {prog.status}
                          </span>
                          <div className="text-[11px] text-sadu-muted truncate max-w-[180px]">
                            {isAr ? prog.venueAr : prog.venueEn}
                          </div>
                        </td>

                        {/* Budget */}
                        <td className="p-3 font-mono">
                          <div>{formatNumber(prog.budgetSpent)} / {formatNumber(prog.budgetPlanned)} {isAr ? 'درهم' : prog.currency}</div>
                          <div className="w-28 bg-sadu-sand-dark h-1.5 rounded-full overflow-hidden mt-1">
                            <div 
                              className="bg-sadu-ink h-full"
                              style={{ width: `${(prog.budgetSpent / prog.budgetPlanned) * 100}%` }}
                            />
                          </div>
                        </td>

                        {/* Gates & Progress */}
                        <td className="p-3">
                          <div className="space-y-1">
                            <StatusProgressIndicator
                              id={`prog-status-${prog.id}`}
                              type="contract"
                              currentStep={prog.gatesReady}
                              totalSteps={prog.gatesTotal}
                              progressPercent={prog.progressPercent}
                              statusLevel={
                                prog.criticalRisks > 0 ? 'at_risk' :
                                prog.progressPercent >= 100 ? 'completed' : 'in_progress'
                              }
                              labelEn={prog.progressPercent >= 100 ? 'All Gates Cleared' : `${prog.progressPercent}% Active`}
                              labelAr={prog.progressPercent >= 100 ? 'البوابات مكتملة' : `${formatPercent(prog.progressPercent)} قيد الإنجاز`}
                              nextActionEn={
                                prog.criticalRisks > 0
                                  ? `${prog.criticalRisks} critical exception requires Directorate sign-off.`
                                  : 'Statutory milestone commitments proceeding on schedule.'
                              }
                              nextActionAr={
                                prog.criticalRisks > 0
                                  ? `${formatNumber(prog.criticalRisks)} استثناء حرج يتطلب اعتماد الإدارة.`
                                  : 'الالتزامات التعاقدية تسير وفق الجدول الزمني.'
                              }
                              variant="compact"
                              interactive={true}
                              size="xs"
                            />
                            {prog.criticalRisks > 0 && (
                              <span className="text-[10px] text-sadu-brick font-bold flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                {formatNumber(prog.criticalRisks)} {isAr ? 'استثناء يتطلب البت' : 'exception requires decision'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => onSelectProgramme(prog)}
                            className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors cursor-pointer ${
                              isSelected 
                                ? 'bg-sadu-brick text-white border-sadu-brick' 
                                : 'bg-sadu-linen text-sadu-ink border-sadu-gold hover:bg-sadu-sand'
                            }`}
                          >
                            {isSelected ? (isAr ? 'المحدد حالياً' : 'Current Scope') : (isAr ? 'تحديد' : 'Inspect')}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-sadu-muted">
                        <p className="font-medium text-xs">
                          {isAr ? 'لا توجد برامج مطابقة لمرشح التصفية الحالي' : 'No programmes match the current filter'}
                        </p>
                        <button
                          onClick={() => setPortfolioFilter('all')}
                          className="mt-2 text-xs text-sadu-brick font-bold underline cursor-pointer"
                        >
                          {isAr ? 'عرض كافة البرامج' : 'Show All Programmes'}
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch-Friendly Card Stack */}
            <div className="block md:hidden space-y-3">
              {filteredProgrammes.length > 0 ? (
                filteredProgrammes.map((prog) => {
                const isSelected = prog.id === selectedProgramme.id;
                return (
                  <div
                    key={prog.id}
                    className={`border rounded-lg p-4 transition-all min-h-[160px] flex flex-col justify-between ${
                      isSelected
                        ? 'bg-sadu-sand border-sadu-brick ring-1 ring-sadu-brick'
                        : 'bg-sadu-linen border-sadu-gold hover:border-sadu-ink'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="font-mono text-[10px] text-sadu-muted uppercase block">{prog.id}</span>
                          <h3 className="font-bold text-sm text-sadu-charcoal">{isAr ? prog.titleAr : prog.titleEn}</h3>
                          <span className="text-[11px] text-sadu-muted block">{localizeDigits(prog.dates)}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                          prog.status === 'production' 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                            : prog.status === 'planning' 
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}>
                          {prog.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs py-2 my-2 border-y border-sadu-gold/30">
                        <div>
                          <span className="text-[10px] text-sadu-muted block">{isAr ? 'المكان' : 'Venue'}</span>
                          <span className="text-sadu-charcoal font-medium truncate block">{isAr ? prog.venueAr : prog.venueEn}</span>
                        </div>
                        <div className="col-span-2 py-1">
                          <span className="text-[10px] text-sadu-muted block mb-1">{isAr ? 'الجاهزية والتقدم التعاقدي' : 'Readiness & Statutory Progress'}</span>
                          <StatusProgressIndicator
                            id={`prog-status-mobile-${prog.id}`}
                            type="contract"
                            currentStep={prog.gatesReady}
                            totalSteps={prog.gatesTotal}
                            progressPercent={prog.progressPercent}
                            statusLevel={
                              prog.criticalRisks > 0 ? 'at_risk' :
                              prog.progressPercent >= 100 ? 'completed' : 'in_progress'
                            }
                            labelEn={prog.progressPercent >= 100 ? 'All Gates Cleared' : `${prog.progressPercent}% Active`}
                            labelAr={prog.progressPercent >= 100 ? 'البوابات مكتملة' : `${formatPercent(prog.progressPercent)} قيد الإنجاز`}
                            variant="compact"
                            interactive={true}
                            size="xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-sadu-muted">{isAr ? 'الميزانية المنصرفة' : 'Spent Budget'}</span>
                            <span className="font-mono font-bold text-sadu-charcoal">{formatNumber(prog.budgetSpent)} / {formatNumber(prog.budgetPlanned)} {isAr ? 'درهم' : prog.currency}</span>
                          </div>
                          <div className="w-full bg-sadu-sand-dark h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-sadu-ink h-full"
                              style={{ width: `${(prog.budgetSpent / prog.budgetPlanned) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {prog.criticalRisks > 0 ? (
                        <span className="text-[10px] text-sadu-brick font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {formatNumber(prog.criticalRisks)} {isAr ? 'استثناء يتطلب البت' : 'exception'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-sadu-sage font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {isAr ? 'مستقر' : 'On track'}
                        </span>
                      )}
                      <button
                        onClick={() => onSelectProgramme(prog)}
                        className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-sadu-brick text-white border-sadu-brick' 
                            : 'bg-sadu-linen text-sadu-ink border-sadu-gold hover:bg-sadu-sand'
                        }`}
                      >
                        {isSelected ? (isAr ? 'المحدد حالياً' : 'Current Scope') : (isAr ? 'تحديد وتدقيق' : 'Inspect')}
                      </button>
                    </div>
                  </div>
                );
              })
              ) : (
                <div className="p-6 text-center text-sadu-muted bg-sadu-sand/40 rounded-lg border border-dashed border-sadu-gold">
                  <p className="font-medium text-xs">
                    {isAr ? 'لا توجد برامج مطابقة لمرشح التصفية الحالي' : 'No programmes match the current filter'}
                  </p>
                  <button
                    onClick={() => setPortfolioFilter('all')}
                    className="mt-2 text-xs text-sadu-brick font-bold underline cursor-pointer"
                  >
                    {isAr ? 'عرض كافة البرامج' : 'Show All Programmes'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Strategic Exception Drill-Down */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Active Exception Box */}
            <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{isAr ? 'استثناء هندسي يستوجب البت المؤسسي' : 'Critical Engineering Escalation'}</span>
              </div>
              <h3 className="text-base font-bold text-sadu-charcoal">
                {isAr 
                  ? `حمولة الأرضية للعمل النحتي "أفق كوفي" (${formatNumber(120)} كجم) بمتحف الشارقة للفنون`
                  : 'Floor Load Bearing at Sharjah Art Museum for "Kufic Horizon" (120kg)'}
              </h3>
              <p className="text-xs text-sadu-charcoal leading-relaxed mt-2">
                {isAr
                  ? 'أفاد الفريق الفني بأن الجناح ب يتطلب صفائح توزيع وزن معدنية لتفادي الضغط على بلاط القاعة التاريخي. الفنان أرسل المخطط المعدل عبر البوابة الرسمية، وننتظر توقيع رئيس القسم الفني.'
                  : 'Technical reports Hall 3 requires pressure dispersion plates to preserve historical flooring. The artist submitted updated CAD drawings through the portal. Awaiting Chief Technician certification.'}
              </p>
              <div className="mt-4 pt-3 border-t border-sadu-gold/50 flex items-center justify-between">
                <span className="text-[11px] text-sadu-muted">
                  {isAr ? 'الأصل: ملف مقترح الفنان يوسف نبهان' : 'Source: Youssef Nabhan Submission v2.0'}
                </span>
                <button
                  onClick={() => onNavigateTab('operations')}
                  className="text-xs font-bold text-sadu-brick hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{isAr ? 'معاينة في مساحة العمل الفنية ←' : 'Review in Technical Tab →'}</span>
                </button>
              </div>
            </div>

            {/* M01 KPI Methodology */}
            <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-sadu-ink uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>{isAr ? 'عقد القياس المؤسسي: مؤشر اكتمال الأدلة M01' : 'Governance Contract: M01 Evidence Completeness'}</span>
              </div>
              <h3 className="text-base font-bold text-sadu-charcoal">
                {isAr 
                  ? `${formatNumber(48)} من ${formatNumber(51)} قراراً مؤسسياً موثقاً بأدلته المعتمدة` 
                  : '48 of 51 Decisions Supported by Verified Evidence'}
              </h3>
              <p className="text-xs text-sadu-charcoal leading-relaxed mt-2">
                {isAr
                  ? 'لا يكتفي النظام باحتساب القرارات كأرقام مجردة، بل يشترط ربط كل اعتماد بنسخة النطاق المعتمد، ومحضر التحكيم الموقع، وعقد المشاركة المعتمد من سعادة مدير إدارة الشؤون الثقافية.'
                  : 'SADU guarantees that every institutional approval connects to an attributable decision record, frozen Approved Scope revision, and signed contractual authority. Zero reliance on unrecorded verbal consents.'}
              </p>
              <div className="mt-4 pt-3 border-t border-sadu-gold/50 flex items-center justify-between">
                <span className="text-[11px] text-sadu-sage font-semibold">
                  {isAr ? `نسبة الموثوقية: ${formatPercent(94.2, 1)}` : 'Trust Quotient: 94.2% Passed'}
                </span>
                <button
                  onClick={() => onNavigateTab('archive')}
                  className="text-xs font-bold text-sadu-ink hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{isAr ? 'معاينة سجل الذاكرة والأرشيف ←' : 'Inspect Archive Manifest →'}</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Persona UX Review Modal */}
      <PersonaReviewModal
        isOpen={showPersonaModal}
        onClose={() => setShowPersonaModal(false)}
        lang={lang}
        onOpenLeadershipTab={() => setViewMode('personas')}
      />

      {/* Institutional Printable Report & Export Modal */}
      <PrintableReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        metadata={reportMetadata}
        metrics={reportMetrics}
        records={reportRecords}
      />
    </div>
  );
};
