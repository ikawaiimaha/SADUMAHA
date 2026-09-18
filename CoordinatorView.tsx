import React, { useState } from 'react';
import { Language, AttentionItem, ExhibitionProgramme, WorkspaceTab } from '../../types';
import { ATTENTION_ITEMS, ARTWORKS, COMMITTEE_SUBMISSION, MOUNIR_FATMI_SUBMISSION } from '../../data/mockData';
import { useI18n } from '../../context/I18nContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { LOCALES } from '../../i18n/locales';
import { KpiCard } from '../common/KpiCard';
import { PrintableReportModal } from '../common/PrintableReportModal';
import { StatusProgressIndicator } from '../common/StatusProgressIndicator';
import { downloadInstitutionalPdfReport, KpiSummaryMetric, ReportFilterMetadata } from '../../utils/pdfExport';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Filter, 
  ArrowRight, 
  MessageSquare, 
  FileCheck, 
  Send,
  User,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  X,
  AlertTriangle,
  FileDown,
  Printer,
  BarChart3,
  Award,
  Scale,
  Lock,
  FileSignature
} from 'lucide-react';

export interface CoordinatorViewProps {
  lang?: Language;
  selectedProgramme?: ExhibitionProgramme;
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

export type AttentionStatusFilter = 'all' | 'at-risk' | 'in-progress' | 'completed';

export const CoordinatorView: React.FC<CoordinatorViewProps> = (props) => {
  const i18n = useI18n();
  const workspace = useWorkspace();

  const lang = props.lang ?? i18n.lang;
  const isAr = lang === 'ar';
  const { formatNumber, formatPercent, formatRatio, formatCurrency, localizeDigits } = i18n;
  const coord = LOCALES[lang].coordinator;
  const common = LOCALES[lang].common;
  const selectedProgramme = props.selectedProgramme ?? workspace.selectedProgramme;
  const onNavigateTab = props.onNavigateTab ?? workspace.navigateTab;

  const [items, setItems] = useState<AttentionItem[]>(ATTENTION_ITEMS);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'technical' | 'contract' | 'visa' | 'finance' | 'condition'>('all');
  const [statusFilter, setStatusFilter] = useState<AttentionStatusFilter>('all');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedDossierArtist, setSelectedDossierArtist] = useState<'youssef' | 'mounir'>('youssef');

  // 100-Point Split Rubric Evaluations for Coordinator Decision Gate
  const dossiers = [
    {
      id: 'dossier-youssef',
      artistKey: 'youssef' as const,
      artistNameEn: 'Youssef Nabhan',
      artistNameAr: 'يوسف نبهان',
      proposalTitleEn: 'Kufic Horizon & Murqash No. 4',
      proposalTitleAr: 'أفق كوفي ومرقش رقم 4',
      code: 'SHJ-2026-CALL-01',
      isTakreem: false,
      gate1Score: 64, // out of 65
      gate1Max: 65,
      gate2Score: 32, // scaled out of 35
      gate2Max: 35,
      rawTotal: 96,
      decisionTier: 'A' as const, // >= 85 is Tier A
      tierLabelEn: 'Priority Commission (Funded)',
      tierLabelAr: 'تكليف ذو أولوية استراتيجية (معتمد للتمويل)',
      prStatus: false, // Pending portrait and guest list
      hasRedFlag: false,
      submission: COMMITTEE_SUBMISSION,
    },
    {
      id: 'dossier-mounir',
      artistKey: 'mounir' as const,
      artistNameEn: 'Mounir Fatmi',
      artistNameAr: 'منير فاطمي',
      proposalTitleEn: 'Ghosting & Technologia: Moving Image Calligraphy',
      proposalTitleAr: 'الاختفاء المفاجئ والتكنولوجيا: خط الصورة المتحركة',
      code: 'SHJ-2026-CALL-02',
      isTakreem: false,
      gate1Score: 61,
      gate1Max: 65,
      gate2Score: 33,
      gate2Max: 35,
      rawTotal: 94,
      decisionTier: 'A' as const,
      tierLabelEn: 'Priority Commission (Funded)',
      tierLabelAr: 'تكليف ذو أولوية استراتيجية (معتمد للتمويل)',
      prStatus: true, // Cleared
      hasRedFlag: false,
      submission: MOUNIR_FATMI_SUBMISSION,
    }
  ];

  // Status counts
  const atRiskCount = items.filter(i => (i.priority === 'critical' || i.status === 'escalated') && i.status !== 'resolved').length;
  const inProgressCount = items.filter(i => i.status === 'pending' && i.priority !== 'critical').length;
  const completedCount = items.filter(i => i.status === 'resolved').length;

  const filteredItems = items.filter(item => {
    // Category filter
    const matchesCategory = selectedFilter === 'all' || item.category === selectedFilter;

    // Status drill-down filter
    let matchesStatus = true;
    if (statusFilter === 'at-risk') {
      matchesStatus = (item.priority === 'critical' || item.status === 'escalated') && item.status !== 'resolved';
    } else if (statusFilter === 'completed') {
      matchesStatus = item.status === 'resolved';
    } else if (statusFilter === 'in-progress') {
      matchesStatus = item.status === 'pending' && item.priority !== 'critical';
    }

    return matchesCategory && matchesStatus;
  });

  // Report preparation for export
  const reportMetadata: ReportFilterMetadata = {
    programmeName: isAr ? selectedProgramme.titleAr : selectedProgramme.titleEn,
    categoryFilter: selectedFilter,
    statusFilter: statusFilter,
    generatedBy: coord.generatedByTitle,
    totalRecords: filteredItems.length,
    workspaceType: 'coordinator',
  };

  const reportMetrics: KpiSummaryMetric[] = [
    {
      label: coord.totalItemsLabel,
      value: isAr ? `${formatNumber(items.length)} نشط` : `${items.length} Active`,
      subtitle: coord.totalItemsSubtitle,
    },
    {
      label: coord.atRiskLabel,
      value: isAr ? `${formatNumber(atRiskCount)} حرج` : `${atRiskCount} Critical`,
      status: 'danger',
      subtitle: coord.atRiskSubtitle,
    },
    {
      label: coord.inProgressLabel,
      value: isAr ? `${formatNumber(inProgressCount)} قيد الإجراء` : `${inProgressCount} In Flight`,
      status: 'ink',
      subtitle: coord.inProgressSubtitle,
    },
    {
      label: coord.completedLabel,
      value: isAr ? `${formatNumber(completedCount)} مكتمل` : `${completedCount} Resolved`,
      status: 'success',
      subtitle: coord.completedSubtitle,
    },
  ];

  const reportRecords = filteredItems.map(item => ({
    id: item.id,
    title: isAr ? item.titleAr : item.titleEn,
    category: item.category,
    priority: item.priority,
    status: item.status,
    assigneeOrArtist: isAr ? item.artistAr : item.artistEn,
    dueDateOrProgress: isAr ? `${formatNumber(item.dueDays)} أيام` : `${item.dueDays}d`,
  }));

  const handleDirectDownloadReport = () => {
    downloadInstitutionalPdfReport(reportMetadata, reportMetrics, reportRecords);
    setSuccessToast(coord.toastReportDownloaded);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleResolve = (id: string, title: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'resolved' } : item));
    setSuccessToast(`${coord.toastResolvedPrefix} ${title}`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleEscalate = (id: string, title: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'escalated' } : item));
    setSuccessToast(`${coord.toastEscalatedPrefix} ${title}`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3 bg-sadu-sage-light border border-sadu-sage rounded-md text-sadu-ink text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sadu-sage" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-sadu-muted hover:text-sadu-charcoal">✕</button>
        </div>
      )}

      {/* Control Room Hero */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-sadu-brick animate-pulse"></span>
              <span>{coord.controlHeroBadge}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-sadu-charcoal">
              {isAr ? selectedProgramme.titleAr : selectedProgramme.titleEn}
            </h1>
            <p className="text-xs sm:text-sm text-sadu-muted mt-1">
              {coord.controlHeroSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('communications')}
              className="px-4 py-2 text-xs font-semibold text-white bg-sadu-brick hover:bg-sadu-brick-dark rounded-md transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{coord.officialMessagingBtn}</span>
            </button>
            <button
              onClick={() => onNavigateTab('approved-scope')}
              className="px-4 py-2 text-xs font-semibold text-sadu-ink bg-sadu-sand hover:bg-sadu-sand-dark border border-sadu-gold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>{coord.approvedScopeBtn}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Strip using KpiCard with Interactive Status Filtering & Download Report */}
        <div className="mt-6 pt-6 border-t border-sadu-gold/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sadu-charcoal flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-sadu-brick" />
                <span>{coord.kpiBenchmarksTitle}</span>
              </span>
              <span className="text-[11px] text-sadu-muted font-mono">
                ({formatNumber(filteredItems.length)} {coord.inScopeSuffix})
              </span>
            </div>

            {/* Action Buttons for KPI section: Direct Download Report and Print Preview */}
            <div className="flex items-center gap-2">
              <button
                id="btn-coordinator-download-report"
                onClick={handleDirectDownloadReport}
                className="px-3 py-1.5 text-xs font-bold rounded-md bg-sadu-brick text-white hover:bg-sadu-brick-dark transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                title={coord.downloadReportTitle}
              >
                <FileDown className="w-3.5 h-3.5 text-sadu-gold" />
                <span>{coord.downloadReportBtn}</span>
              </button>

              <button
                id="btn-coordinator-preview-report"
                onClick={() => setShowReportModal(true)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-sadu-linen border border-sadu-gold text-sadu-charcoal hover:bg-sadu-sand transition-colors flex items-center gap-1.5 cursor-pointer"
                title={coord.printPreviewTitle}
              >
                <Printer className="w-3.5 h-3.5 text-sadu-ink" />
                <span className="hidden sm:inline">{coord.printPreviewBtn}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <KpiCard
              title={coord.totalItemsLabel}
              value={isAr ? `${formatNumber(items.length)} نشط` : `${items.length} Active`}
              statusColor="neutral"
              subtitle={coord.totalItemsSubtitle}
              onClick={() => setStatusFilter('all')}
              isActive={statusFilter === 'all'}
              filterLabel={common.viewAll}
              filterActiveText={common.all}
            />
            <KpiCard
              title={coord.atRiskLabel}
              value={isAr ? `${formatNumber(atRiskCount)} حرج` : `${atRiskCount} Critical`}
              statusColor="danger"
              subtitle={coord.atRiskSubtitle}
              onClick={() => setStatusFilter(prev => prev === 'at-risk' ? 'all' : 'at-risk')}
              isActive={statusFilter === 'at-risk'}
              filterLabel={coord.statusFilters.atRisk}
              filterActiveText={coord.statusFilters.atRisk}
            />
            <KpiCard
              title={coord.inProgressLabel}
              value={isAr ? `${formatNumber(inProgressCount)} قيد الإجراء` : `${inProgressCount} In Flight`}
              statusColor="ink"
              subtitle={coord.inProgressSubtitle}
              onClick={() => setStatusFilter(prev => prev === 'in-progress' ? 'all' : 'in-progress')}
              isActive={statusFilter === 'in-progress'}
              filterLabel={coord.statusFilters.inProgress}
              filterActiveText={coord.statusFilters.inProgress}
            />
            <KpiCard
              title={coord.completedLabel}
              value={isAr ? `${formatNumber(completedCount)} مكتمل` : `${completedCount} Resolved`}
              statusColor="success"
              subtitle={coord.completedSubtitle}
              onClick={() => setStatusFilter(prev => prev === 'completed' ? 'all' : 'completed')}
              isActive={statusFilter === 'completed'}
              filterLabel={coord.statusFilters.completed}
              filterActiveText={coord.statusFilters.completed}
            />
          </div>
        </div>
      </div>

      {/* 100-POINT SPLIT RUBRIC & BIENNALE COORDINATOR DECISION GATE */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sadu-gold/40">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-sadu-ink text-white text-[10px] font-bold uppercase tracking-wider">
                {isAr ? 'حكومة الشارقة · إدارة الشؤون الثقافية' : 'Sharjah Directorate of Cultural Affairs'}
              </span>
              <span className="px-2 py-0.5 rounded bg-sadu-sand text-sadu-brick text-[10px] font-bold border border-sadu-gold">
                {isAr ? 'بوابة التقييم الشامل (100 نقطة)' : 'Consolidated 100-Point Split Gate'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'لوحة المنسق العام لاعتماد المشاريع وتقييم البوابتين' : 'Biennale Coordinator Consolidated Decision Gate (100 Pts)'}
            </h2>
            <p className="text-xs text-sadu-muted mt-0.5">
              {isAr 
                ? 'دمج نقاط البوابة 1 (اللجنة الفنية والتقييم المتحفي: 65 نقطة) مع البوابة 2 (العمليات والجدوى الميدانية: 35 نقطة) وتحديد فئات الاعتماد (A/B/C/Decline)' 
                : 'Fusing Gate 1 (Curatorial/Calligraphy 65 pts) and Gate 2 (Operations/Logistics 35 pts) with preventive PR governance.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const currentDossier = dossiers.find(d => d.artistKey === selectedDossierArtist)!;
                downloadInstitutionalPdfReport(
                  {
                    programmeName: isAr ? selectedProgramme.titleAr : selectedProgramme.titleEn,
                    categoryFilter: '100-Point Rubric Gate',
                    statusFilter: currentDossier.decisionTier,
                    generatedBy: isAr ? 'مكتب المنسق العام للبينالي' : 'General Biennale Coordinator Office',
                    totalRecords: 1,
                    workspaceType: 'coordinator'
                  },
                  [
                    {
                      label: isAr ? 'البوابة 1 (اللجنة)' : 'Gate 1 (Curatorial)',
                      value: `${currentDossier.gate1Score} / 65`,
                      subtitle: isAr ? 'الأصالة والجدارة الخطية' : 'Artistic & Calligraphy Merit'
                    },
                    {
                      label: isAr ? 'البوابة 2 (العمليات)' : 'Gate 2 (Operations)',
                      value: `${currentDossier.gate2Score} / 35`,
                      subtitle: isAr ? 'الأحمال واللوجستيات والميزانية' : 'Engineering, Transit, Budget'
                    },
                    {
                      label: isAr ? 'المجموع النهائي' : 'Composite Score',
                      value: `${currentDossier.rawTotal} / 100`,
                      status: 'success',
                      subtitle: `Tier ${currentDossier.decisionTier}: ${isAr ? currentDossier.tierLabelAr : currentDossier.tierLabelEn}`
                    },
                    {
                      label: isAr ? 'حارس المراسم (PR Gate)' : 'PR & Protocol Gate',
                      value: currentDossier.prStatus ? (isAr ? 'معتمد' : 'Cleared') : (isAr ? 'مقيد' : 'Locked'),
                      status: currentDossier.prStatus ? 'success' : 'warning',
                      subtitle: isAr ? '7 متطلبات تدقيق' : '7 Audit checkpoints'
                    }
                  ],
                  [
                    {
                      id: currentDossier.code,
                      title: isAr ? currentDossier.proposalTitleAr : currentDossier.proposalTitleEn,
                      category: 'Calligraphy Biennial Commission',
                      priority: 'normal',
                      status: `Tier ${currentDossier.decisionTier} Approved`,
                      assigneeOrArtist: isAr ? currentDossier.artistNameAr : currentDossier.artistNameEn,
                      dueDateOrProgress: `${currentDossier.rawTotal}/100 Pts`
                    }
                  ]
                );
                setSuccessToast(isAr ? 'تم تنزيل قرار الاعتماد المؤسسي (PDF)' : 'Institutional Evaluation Report (PDF) downloaded successfully');
                setTimeout(() => setSuccessToast(null), 4000);
              }}
              className="px-3.5 py-2 text-xs font-bold rounded-md bg-sadu-brick text-white hover:bg-sadu-brick-dark transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-sadu-gold" />
              <span>{isAr ? 'تصدير تقرير الاعتماد (100 نقطة PDF)' : 'Export 100-Point Audit PDF'}</span>
            </button>
          </div>
        </div>

        {/* Dossier Artist Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-sadu-charcoal flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-sadu-brick" />
            <span>{isAr ? 'ملف التكليف المختار:' : 'Select Proposal Dossier:'}</span>
          </span>
          {dossiers.map(d => (
            <button
              key={d.artistKey}
              onClick={() => setSelectedDossierArtist(d.artistKey)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer flex items-center gap-2 ${
                selectedDossierArtist === d.artistKey
                  ? 'bg-sadu-ink text-white border-sadu-ink shadow-2xs'
                  : 'bg-sadu-sand text-sadu-charcoal border-sadu-gold hover:bg-sadu-sand-dark'
              }`}
            >
              <span>{isAr ? d.artistNameAr : d.artistNameEn}</span>
              <span className="font-mono text-[11px] opacity-80">({d.rawTotal}/100)</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/20 font-bold">
                Tier {d.decisionTier}
              </span>
            </button>
          ))}
        </div>

        {/* Selected Dossier Breakdown */}
        {(() => {
          const d = dossiers.find(item => item.artistKey === selectedDossierArtist)!;
          return (
            <div className="space-y-4">
              {/* Summary Tier Banner */}
              <div className="p-4 bg-white/90 rounded-lg border border-sadu-gold shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-lg bg-sadu-ink text-white flex flex-col items-center justify-center font-bold">
                    <span className="text-xs font-mono text-sadu-gold uppercase">Tier</span>
                    <span className="text-2xl font-editorial leading-none">{d.decisionTier}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-editorial text-lg font-bold text-sadu-charcoal">
                        {isAr ? d.artistNameAr : d.artistNameEn} — {isAr ? d.proposalTitleAr : d.proposalTitleEn}
                      </h3>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-sadu-sand text-sadu-ink font-bold border border-sadu-gold">
                        {d.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-sadu-muted mt-1 flex-wrap">
                      <span className="text-sadu-brick font-semibold">
                        {isAr ? d.tierLabelAr : d.tierLabelEn}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-sadu-ink" />
                        <span>{isAr ? 'عتبة الاعتماد: 85+ نقطة' : 'Funding Threshold: 85+ Pts'}</span>
                      </span>
                      <span>·</span>
                      <span className={`flex items-center gap-1 font-semibold ${d.prStatus ? 'text-sadu-sage' : 'text-sadu-brick'}`}>
                        {d.prStatus ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isAr ? 'المراسم: مكتملة' : 'PR Cleared'}</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>{isAr ? 'المراسم: بانتظار استيفاء الوثائق' : 'PR Gated: Action Required'}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 bg-sadu-sand/60 px-4 py-2.5 rounded-lg border border-sadu-gold self-start md:self-auto">
                  <div className="text-end rtl:text-start">
                    <span className="text-[10px] text-sadu-muted uppercase font-bold block">
                      {isAr ? 'الدرجة التراكمية للبينالي' : 'Biennale Score'}
                    </span>
                    <span className="text-3xl font-editorial font-bold text-sadu-ink">
                      {formatNumber(d.rawTotal)}
                    </span>
                  </div>
                  <span className="text-sm text-sadu-muted font-mono">/ 100</span>
                </div>
              </div>

              {/* Split Evaluation Dual Columns */}
              <div className="grid md:grid-cols-2 gap-4 text-xs">
                {/* Gate 1: Curatorial & Calligraphy (65 Points) */}
                <div className="p-4 bg-sadu-sand rounded-lg border border-sadu-gold space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-sadu-gold/50">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-sadu-ink text-white flex items-center justify-center font-bold text-xs">
                        1
                      </span>
                      <div>
                        <span className="font-bold text-sadu-charcoal block">
                          {isAr ? 'البوابة 1: اللجنة الفنية وتاريخ الخط' : 'Gate 1: Curatorial & Calligraphy Rubric'}
                        </span>
                        <span className="text-[10px] text-sadu-muted">
                          {isAr ? 'الوزن الأقصى: 65 نقطة' : 'Max Weight: 65 Points'}
                        </span>
                      </div>
                    </div>

                    <div className="text-end rtl:text-start font-mono">
                      <span className="text-lg font-bold text-sadu-ink">{d.gate1Score}</span>
                      <span className="text-sadu-muted"> / 65</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-white/70 rounded border border-sadu-gold/30">
                      <span>{isAr ? 'الجدارة التقييمية والثيمة (Curatorial 40)' : 'Curatorial & Biennale Theme'}</span>
                      <span className="font-mono font-bold text-sadu-charcoal">39 / 40</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white/70 rounded border border-sadu-gold/30">
                      <span>{isAr ? 'السيرة والتاريخ المعرضي (Artist 15)' : 'Artist Standing & History'}</span>
                      <span className="font-mono font-bold text-sadu-charcoal">15 / 15</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white/70 rounded border border-sadu-gold/30">
                      <span>{isAr ? 'الأصالة والتمكن من قواعد الخط (Calligraphy 10)' : 'Calligraphy Tradition & Mastery'}</span>
                      <span className="font-mono font-bold text-sadu-charcoal">10 / 10</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-sadu-gold/40 flex items-center justify-between text-[11px]">
                    <span className="text-sadu-sage font-semibold">✓ {isAr ? 'توصية اللجنة: اعتماد كامل' : 'Committee Recommendation: Fully Endorsed'}</span>
                    <button
                      onClick={() => onNavigateTab('committee')}
                      className="text-sadu-brick hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isAr ? 'عرض محضر اللجنة' : 'View Committee Dossier'}</span>
                      <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                  </div>
                </div>

                {/* Gate 2: Operational & Museum Feasibility (35 Points) */}
                <div className="p-4 bg-sadu-sand rounded-lg border border-sadu-gold space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-sadu-gold/50">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-sadu-brick text-white flex items-center justify-center font-bold text-xs">
                        2
                      </span>
                      <div>
                        <span className="font-bold text-sadu-charcoal block">
                          {isAr ? 'البوابة 2: العمليات والجدوى المتحفية' : 'Gate 2: Operations & Museum Feasibility'}
                        </span>
                        <span className="text-[10px] text-sadu-muted">
                          {isAr ? 'الوزن الأقصى: 35 نقطة' : 'Max Weight: 35 Points'}
                        </span>
                      </div>
                    </div>

                    <div className="text-end rtl:text-start font-mono">
                      <span className="text-lg font-bold text-sadu-brick">{d.gate2Score}</span>
                      <span className="text-sadu-muted"> / 35</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-white/70 rounded border border-sadu-gold/30">
                      <span>{isAr ? 'الهندسة والأحمال الإنشائية (Technical 15)' : 'Engineering & Load Safety'}</span>
                      <span className="font-mono font-bold text-sadu-charcoal">13 / 15</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white/70 rounded border border-sadu-gold/30">
                      <span>{isAr ? 'اللوجستيات والشحن وصناديق ISPM (Logistics 10)' : 'Fine Art Transit & Crating'}</span>
                      <span className="font-mono font-bold text-sadu-charcoal">10 / 10</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white/70 rounded border border-sadu-gold/30">
                      <span>{isAr ? 'ملاءمة الميزانية وعروض الأسعار (Budget 10)' : 'Budget Equity & 3 Bids RFQ'}</span>
                      <span className="font-mono font-bold text-sadu-charcoal">9 / 10</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-sadu-gold/40 flex items-center justify-between text-[11px]">
                    <span className="text-sadu-sage font-semibold">✓ {isAr ? 'خالٍ من المحاذير الحمراء' : 'Zero Red Flag Infractions'}</span>
                    <button
                      onClick={() => onNavigateTab('operations')}
                      className="text-sadu-brick hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isAr ? 'عرض تدقيق العمليات والمراسم' : 'Open Operations View'}</span>
                      <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Statutory Decision Policy Matrix (A/B/C/Decline) */}
              <div className="p-4 bg-sadu-linen rounded-md border border-sadu-gold text-xs space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-sadu-gold/40 flex-wrap gap-2">
                  <span className="font-bold text-sadu-charcoal uppercase tracking-wider text-[11px]">
                    {isAr ? 'مصفوفة اتخاذ القرار المؤسسي لبينالي الشارقة للخط' : 'Sharjah Calligraphy Biennial Commission Decision Matrix'}
                  </span>
                  <span className="text-[10px] text-sadu-muted font-mono">
                    {isAr ? 'القرار الساري: فئة A (تكليف ذو أولوية)' : 'Current Ruling: Tier A Commission'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className={`p-2.5 rounded border ${d.decisionTier === 'A' ? 'bg-sadu-sage-light border-sadu-sage text-sadu-ink font-bold' : 'bg-white/60 border-sadu-gold/40 text-sadu-muted'}`}>
                    <span className="block font-bold">Tier A (85 – 100)</span>
                    <span className="text-[10px] font-normal block">{isAr ? 'تكليف فوري كامل التمويل' : 'Full Commission Funded'}</span>
                  </div>
                  <div className="p-2.5 rounded border bg-white/60 border-sadu-gold/40 text-sadu-muted">
                    <span className="block font-bold">Tier B (70 – 84)</span>
                    <span className="text-[10px] font-normal block">{isAr ? 'مشروط بتعديل الميزانية/الأحمال' : 'Conditional (Reconcile Scope)'}</span>
                  </div>
                  <div className="p-2.5 rounded border bg-white/60 border-sadu-gold/40 text-sadu-muted">
                    <span className="block font-bold">Tier C (55 – 69)</span>
                    <span className="text-[10px] font-normal block">{isAr ? 'قائمة انتظار / مراجعة كبرى' : 'Reserve List / Scope Revision'}</span>
                  </div>
                  <div className="p-2.5 rounded border bg-white/60 border-sadu-gold/40 text-sadu-muted">
                    <span className="block font-bold">Decline (&lt; 55)</span>
                    <span className="text-[10px] font-normal block">{isAr ? 'رفض التكليف لعدم الجدوى' : 'Decline (Infeasible/Off-theme)'}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Attention Queue with Filter Tabs */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">
              {coord.attentionQueueTitle}
            </h2>
            <p className="text-xs text-sadu-muted">
              {coord.attentionQueueSubtitle}
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', 'technical', 'contract', 'visa', 'finance', 'condition'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer capitalize ${
                  selectedFilter === cat
                    ? 'bg-sadu-ink text-white border-sadu-ink font-bold shadow-2xs'
                    : 'bg-sadu-linen text-sadu-muted border-sadu-gold hover:bg-sadu-sand'
                }`}
              >
                {coord.filters[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Drill-down Status Filter Active Banner */}
        {statusFilter !== 'all' && (
          <div className="flex items-center justify-between p-2.5 mb-4 bg-sadu-sand border border-sadu-gold/70 rounded-md text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sadu-charcoal flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-sadu-brick" />
                <span>{coord.activeStatusFilterLabel}</span>
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                statusFilter === 'at-risk'
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : statusFilter === 'completed'
                  ? 'bg-sadu-sage-light text-sadu-ink border border-sadu-sage'
                  : 'bg-sadu-ink-light text-sadu-ink border border-sadu-ink/30'
              }`}>
                {statusFilter === 'at-risk' && coord.statusFilters.atRisk}
                {statusFilter === 'completed' && coord.statusFilters.completed}
                {statusFilter === 'in-progress' && coord.statusFilters.inProgress}
                <span className="opacity-80">({formatNumber(filteredItems.length)})</span>
              </span>
            </div>

            <button
              onClick={() => setStatusFilter('all')}
              className="text-[11px] font-semibold text-sadu-brick hover:text-sadu-brick-dark flex items-center gap-1 cursor-pointer bg-sadu-linen px-2 py-0.5 rounded border border-sadu-gold hover:bg-sadu-sand transition-colors"
            >
              <X className="w-3 h-3" />
              <span>{coord.clearStatusFilterBtn}</span>
            </button>
          </div>
        )}

        {/* Triage Items List */}
        {filteredItems.length > 0 ? (
          <div className="space-y-3">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className={`p-4 rounded-md border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  item.status === 'resolved'
                    ? 'bg-sadu-sand/40 border-sadu-gold/40 opacity-75'
                    : item.priority === 'critical'
                    ? 'bg-sadu-paper border-s-4 rtl:border-s-0 rtl:border-e-4 border-sadu-brick'
                    : 'bg-sadu-linen border-sadu-gold'
                }`}
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                      item.priority === 'critical' 
                        ? 'bg-rose-100 text-rose-900 border border-rose-200' 
                        : item.priority === 'high' 
                        ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                        : 'bg-blue-100 text-blue-900 border border-blue-200'
                    }`}>
                      {item.priority}
                    </span>
                    <span className="font-semibold text-sadu-ink px-2 py-0.5 rounded bg-sadu-sand-dark">
                      {item.category}
                    </span>
                    <span className="text-sadu-muted flex items-center gap-1.5 flex-wrap">
                      <span>{coord.artistLabel}</span>
                      <strong className="text-sadu-charcoal">{isAr ? item.artistAr : item.artistEn}</strong>
                      {item.isTakreem && (
                        <span 
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF9EE] text-[#8C601E] border border-sadu-ochre shadow-2xs"
                          title={isAr ? 'تكريم: فنان مكرّم في بينالي الشارقة للخط' : 'Takreem: Honored Artist in Sharjah Calligraphy Biennial'}
                        >
                          <Award className="w-3 h-3 text-sadu-ochre shrink-0" />
                          <span>تكريم (Honored Artist)</span>
                        </span>
                      )}
                    </span>
                    <span className="text-sadu-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {isAr ? `${coord.dueInDays} ${formatNumber(item.dueDays)} أيام` : `${coord.dueInDays} ${item.dueDays}d`}
                    </span>
                  </div>

                  <h3 className={`text-sm font-bold ${item.status === 'resolved' ? 'line-through text-sadu-muted' : 'text-sadu-charcoal'}`}>
                    {isAr ? item.titleAr : item.titleEn}
                  </h3>

                  {/* Real-time Status Progress Indicator for Contract / Committee / Milestone Item */}
                  <div className="pt-1">
                    <StatusProgressIndicator
                      id={`coord-status-${item.id}`}
                      type={item.category === 'contract' ? 'contract' : item.category === 'condition' ? 'committee' : item.category === 'finance' ? 'milestone' : 'technical'}
                      currentStep={
                        item.status === 'resolved' 
                          ? 5 
                          : item.category === 'contract' 
                          ? 4 
                          : item.category === 'condition' 
                          ? 3 
                          : item.category === 'finance' 
                          ? 2 
                          : 2
                      }
                      totalSteps={item.category === 'finance' ? 4 : 5}
                      progressPercent={
                        item.status === 'resolved' 
                          ? 100 
                          : item.category === 'contract' 
                          ? 80 
                          : item.category === 'condition' 
                          ? 60 
                          : item.category === 'finance' 
                          ? 50 
                          : 40
                      }
                      statusLevel={
                        item.status === 'resolved' 
                          ? 'completed' 
                          : item.priority === 'critical' 
                          ? 'at_risk' 
                          : 'in_progress'
                      }
                      labelEn={
                        item.status === 'resolved'
                          ? (item.category === 'contract' ? 'Contract Executed' : item.category === 'condition' ? 'Condition Ratified' : 'Requirement Cleared')
                          : (item.category === 'contract' ? 'Directorate Countersign (80%)' : item.category === 'condition' ? 'Patina Deliberation (60%)' : item.category === 'finance' ? 'Milestone 2 Gated (50%)' : 'Structural Audit (40%)')
                      }
                      labelAr={
                        item.status === 'resolved'
                          ? (item.category === 'contract' ? 'عقد نافذ وموثق' : item.category === 'condition' ? 'مستوفى ومعتمد' : 'تم استيفاء المتطلب')
                          : (item.category === 'contract' ? `توقيع الإدارة المطلوب (${formatPercent(80)})` : item.category === 'condition' ? `تسوية الأكسدة (${formatPercent(60)})` : item.category === 'finance' ? `دفعة مرحلية ${formatNumber(2)} مقيدة (${formatPercent(50)})` : `بوابة تدقيق الحمولة (${formatPercent(40)})`)
                      }
                      nextActionEn={
                        item.category === 'contract'
                          ? 'Awaiting Directorate countersignature by Mohammed I. Al Qaseer.'
                          : item.category === 'condition'
                          ? 'Patina surface oxidation note requires conservator laboratory sign-off.'
                          : item.category === 'finance'
                          ? 'Verified commercial IBAN match required before disbursement release.'
                          : 'Plinth load test certificate required from Chief Site Engineer.'
                      }
                      nextActionAr={
                        item.category === 'contract'
                          ? 'بانتظار توقيع مدير إدارة الشؤون الثقافية (محمد القصير).'
                          : item.category === 'condition'
                          ? 'ملاحظة الأكسدة السطحية تتطلب تقرير مختبر الترميم الفني.'
                          : item.category === 'finance'
                          ? 'مطابقة الحساب المصرفي التجاري المعتمد قبل صرف المكافأة.'
                          : 'شهادة فحص حمولة الأرضية مطلوبة من كبير مهندسي الموقع.'
                      }
                      variant="compact"
                      interactive={true}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {item.status !== 'resolved' ? (
                    <>
                      <button
                        onClick={() => handleResolve(item.id, isAr ? item.titleAr : item.titleEn)}
                        className="px-3 py-1.5 text-xs font-semibold rounded bg-sadu-ink text-white hover:bg-sadu-ink-dark transition-colors cursor-pointer"
                      >
                        {coord.markResolved}
                      </button>
                      <button
                        onClick={() => handleEscalate(item.id, isAr ? item.titleAr : item.titleEn)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded border border-sadu-brick text-sadu-brick hover:bg-sadu-paper transition-colors cursor-pointer"
                      >
                        {coord.escalate}
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-sadu-sage flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      {coord.resolvedInLedger}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-sadu-sand/40 border border-dashed border-sadu-gold rounded-md">
            <AlertCircle className="w-8 h-8 mx-auto text-sadu-muted mb-2 opacity-50" />
            <p className="font-semibold text-sm text-sadu-charcoal">
              {coord.emptyItemsTitle}
            </p>
            <p className="text-xs text-sadu-muted mt-1">
              {coord.emptyItemsDesc}
            </p>
            <button
              onClick={() => { setStatusFilter('all'); setSelectedFilter('all'); }}
              className="mt-3 px-3 py-1.5 text-xs font-semibold bg-sadu-ink text-white rounded-md hover:bg-sadu-ink-dark transition-colors cursor-pointer"
            >
              {coord.resetAllFilters}
            </button>
          </div>
        )}
      </div>

      {/* Assigned Artists Dossier Quick-Access */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">
            {coord.assignedDossiersTitle}
          </h2>
          <span className="text-xs text-sadu-muted">
            {coord.assignedDossiersSubtitle}
          </span>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {ARTWORKS.map(art => (
            <div key={art.id} className="p-4 bg-sadu-sand rounded-md border border-sadu-gold flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-sadu-ink block mb-1">
                  {art.canonicalCode}
                </span>
                <h4 className="font-bold text-sm text-sadu-charcoal line-clamp-1">
                  {isAr ? art.titleAr : art.titleEn}
                </h4>
                <div className="flex items-center justify-between gap-1.5 flex-wrap mt-0.5">
                  <p className="text-xs text-sadu-brick font-semibold">
                    {isAr ? art.artistNameAr : art.artistNameEn}
                  </p>
                  {art.isTakreem && (
                    <span 
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF9EE] text-[#8C601E] border border-sadu-ochre shadow-2xs"
                      title={isAr ? 'تكريم: فنان مكرّم في بينالي الشارقة للخط' : 'Takreem: Honored Artist in Sharjah Calligraphy Biennial'}
                    >
                      <Award className="w-3 h-3 text-sadu-ochre shrink-0" />
                      <span>تكريم (Honored Artist)</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-sadu-muted mt-2 line-clamp-2">
                  {isAr ? art.mediumAr : art.mediumEn}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-sadu-gold/50 flex items-center justify-between text-xs">
                <span className="font-semibold text-sadu-charcoal">{localizeDigits(art.dimensionsCm)}</span>
                <button
                  onClick={() => onNavigateTab('approved-scope')}
                  className="text-xs font-bold text-sadu-brick hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{coord.scopeBtn}</span>
                  <ChevronRight className="w-3 h-3 rtl:rotate-180" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

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
