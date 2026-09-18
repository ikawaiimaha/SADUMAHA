import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileSignature, 
  Scale, 
  ChevronRight, 
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

export type WorkflowType = 'contract' | 'committee' | 'milestone' | 'technical' | 'procurement';

export type IndicatorStatusLevel = 'completed' | 'in_progress' | 'pending' | 'at_risk' | 'review' | 'pending_lpo';

export interface WorkflowStage {
  id: string;
  nameEn: string;
  nameAr: string;
  status: IndicatorStatusLevel;
  date?: string;
  signeeEn?: string;
  signeeAr?: string;
}

export interface StatusProgressIndicatorProps {
  id?: string;
  type: WorkflowType;
  // Either specify predefined preset stage or custom progress
  currentStep?: number;
  totalSteps?: number;
  progressPercent?: number; // 0 - 100
  statusLevel?: IndicatorStatusLevel;
  
  // Labels
  label?: string;
  labelEn?: string;
  labelAr?: string;
  subtitleEn?: string;
  subtitleAr?: string;
  nextActionEn?: string;
  nextActionAr?: string;
  
  // Specific stages for audit trail in popover
  stages?: WorkflowStage[];

  // Display options
  variant?: 'compact' | 'pill' | 'detailed' | 'micro';
  showPulse?: boolean; // Real-time pulse beacon
  isLive?: boolean;
  interactive?: boolean; // Can click to open detail popover
  size?: 'xs' | 'sm' | 'md';
  className?: string;

  // Callback on interaction
  onInspectDetails?: () => void;
  onAdvanceStage?: () => void;
}

// Predefined institutional workflow presets
export const CONTRACT_WORKFLOW_STAGES: WorkflowStage[] = [
  { id: 'c1', nameEn: 'Draft Schedule Form 1(B)', nameAr: 'مسودة ملحق جدول الأعمال', status: 'completed', signeeEn: 'Coordinator' },
  { id: 'c2', nameEn: 'Direct Rights Legal Audit', nameAr: 'التدقيق القانوني وحقوق الاستبعاد', status: 'completed', signeeEn: 'Legal Counsel' },
  { id: 'c3', nameEn: 'Artist Digital Signature', nameAr: 'التوقيع الرقمي للفنان', status: 'completed', signeeEn: 'Participating Artist' },
  { id: 'c4', nameEn: 'Directorate Countersignature', nameAr: 'توقيع إدارة الشؤون الثقافية', status: 'in_progress', signeeEn: 'Director of Cultural Affairs' },
  { id: 'c5', nameEn: 'Permanent Register Executed', nameAr: 'قيد العقد النهائي بسجل العقود', status: 'pending', signeeEn: 'Institutional Archive' },
];

export const COMMITTEE_WORKFLOW_STAGES: WorkflowStage[] = [
  { id: 'm1', nameEn: 'Curatorial Dossier Intake', nameAr: 'استلام وتدقيق ملف الترشح', status: 'completed', signeeEn: 'Biennial Secretariat' },
  { id: 'm2', nameEn: 'Zero Conflict Declaration', nameAr: 'إقرار النزاهة وحظر تعارض المصالح', status: 'completed', signeeEn: 'Jury Panel' },
  { id: 'm3', nameEn: 'Artistic Deliberation & Scoring', nameAr: 'جلسة المداولة ورصد الدرجات', status: 'completed', signeeEn: 'Chief Juror' },
  { id: 'm4', nameEn: 'Conditional Approval Annex', nameAr: 'ملحق شروط الاعتماد الفنية', status: 'in_progress', signeeEn: 'Curatorial Committee' },
  { id: 'm5', nameEn: 'Ratified to Approved Scope v1.2', nameAr: 'المصادقة والتثبيت في النطاق v1.2', status: 'pending', signeeEn: 'Directorate Leadership' },
];

export const StatusProgressIndicator: React.FC<StatusProgressIndicatorProps> = ({
  id,
  type,
  currentStep,
  totalSteps,
  progressPercent,
  statusLevel,
  label,
  labelEn,
  labelAr,
  subtitleEn,
  subtitleAr,
  nextActionEn,
  nextActionAr,
  stages,
  variant = 'compact',
  showPulse = true,
  isLive = true,
  interactive = true,
  size = 'sm',
  className = '',
  onInspectDetails,
  onAdvanceStage,
}) => {
  const { lang, formatPercent, formatNumber, formatRatio, localizeDigits } = useI18n();
  const isAr = lang === 'ar';
  const [showPopover, setShowPopover] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Default stages depending on type
  const activeStages = stages || (type === 'contract' ? CONTRACT_WORKFLOW_STAGES : COMMITTEE_WORKFLOW_STAGES);
  
  // Calculate completed count and total
  const calculatedTotal = totalSteps || activeStages.length || 5;
  const calculatedCurrent = currentStep !== undefined 
    ? currentStep 
    : activeStages.filter(s => s.status === 'completed').length + (activeStages.some(s => s.status === 'in_progress') ? 1 : 0);
  
  const calculatedPercent = progressPercent !== undefined 
    ? progressPercent 
    : Math.min(100, Math.round((calculatedCurrent / calculatedTotal) * 100));

  // Determine status level
  const resolvedStatus: IndicatorStatusLevel = statusLevel || (
    calculatedPercent >= 100 ? 'completed' :
    calculatedPercent <= 25 && activeStages.some(s => s.status === 'at_risk') ? 'at_risk' :
    calculatedPercent > 0 ? 'in_progress' : 'pending'
  );

  // Styling maps based on Sadu & Institutional Palette
  const themeMap: Record<IndicatorStatusLevel, {
    bg: string;
    border: string;
    text: string;
    dot: string;
    pulse: string;
    bar: string;
    badgeBg: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = {
    completed: {
      bg: 'bg-sadu-sage-light/60',
      border: 'border-sadu-sage/60',
      text: 'text-sadu-ink',
      dot: 'bg-sadu-sage',
      pulse: 'bg-sadu-sage',
      bar: 'bg-sadu-sage',
      badgeBg: 'bg-sadu-sage text-white',
      icon: CheckCircle2,
    },
    in_progress: {
      bg: 'bg-amber-50/80',
      border: 'border-amber-300',
      text: 'text-amber-900',
      dot: 'bg-amber-500',
      pulse: 'bg-amber-400',
      bar: 'bg-amber-500',
      badgeBg: 'bg-amber-500 text-white',
      icon: Clock,
    },
    review: {
      bg: 'bg-sky-50',
      border: 'border-sky-300',
      text: 'text-sky-900',
      dot: 'bg-sky-600',
      pulse: 'bg-sky-400',
      bar: 'bg-sky-600',
      badgeBg: 'bg-sky-600 text-white',
      icon: FileSignature,
    },
    at_risk: {
      bg: 'bg-rose-50',
      border: 'border-rose-300',
      text: 'text-rose-900',
      dot: 'bg-sadu-brick',
      pulse: 'bg-rose-400',
      bar: 'bg-sadu-brick',
      badgeBg: 'bg-sadu-brick text-white',
      icon: AlertCircle,
    },
    pending: {
      bg: 'bg-sadu-sand/80',
      border: 'border-sadu-gold',
      text: 'text-sadu-charcoal',
      dot: 'bg-sadu-muted',
      pulse: 'bg-sadu-gold',
      bar: 'bg-sadu-gold',
      badgeBg: 'bg-sadu-charcoal text-white',
      icon: Clock,
    },
    pending_lpo: {
      bg: 'bg-rose-50/90',
      border: 'border-sadu-brick',
      text: 'text-sadu-brick',
      dot: 'bg-sadu-brick',
      pulse: 'bg-sadu-brick',
      bar: 'bg-sadu-brick',
      badgeBg: 'bg-sadu-brick text-white',
      icon: AlertTriangle,
    },
  };

  const theme = themeMap[resolvedStatus];
  const IconComponent = theme.icon;

  // Default labels
  const defaultLabel = resolvedStatus === 'pending_lpo'
    ? (isAr ? 'بانتظار أمر الشراء المحلي (LPO مقفل)' : 'Pending LPO (Locked)')
    : type === 'contract'
    ? (resolvedStatus === 'completed' ? (isAr ? 'عقد نافذ وموثق' : 'Contract Executed') :
       resolvedStatus === 'in_progress' ? (isAr ? 'قيد التوقيع الثنائي' : 'Bilateral Signing') :
       resolvedStatus === 'at_risk' ? (isAr ? 'تباين تعاقدي' : 'Contract Variance') :
       (isAr ? 'مسودة العقد' : 'Contract Draft'))
    : (resolvedStatus === 'completed' ? (isAr ? 'معتمد ومثبت بالنطاق' : 'Ratified in Scope') :
       resolvedStatus === 'in_progress' ? (isAr ? 'مداولة وتحكيم' : 'Jury Deliberation') :
       resolvedStatus === 'at_risk' ? (isAr ? 'شروط غير مستوفاة' : 'Conditions Unmet') :
       (isAr ? 'بانتظار التحكيم' : 'Pending Review'));

  const activeLabel = label ?? (isAr ? (labelAr || defaultLabel) : (labelEn || defaultLabel));
  const activeSubtitle = isAr ? subtitleAr : subtitleEn;

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    };
    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopover]);

  // Render micro step track pips
  const renderStepPips = () => (
    <div className="flex items-center gap-1 shrink-0" aria-hidden="true">
      {Array.from({ length: calculatedTotal }).map((_, idx) => {
        const isCompleted = idx < calculatedCurrent - 1 || (idx < calculatedCurrent && resolvedStatus === 'completed');
        const isCurrent = idx === calculatedCurrent - 1 && resolvedStatus !== 'completed';
        return (
          <span
            key={idx}
            className={`h-1.5 rounded-full transition-all ${
              isCompleted
                ? 'w-2.5 bg-sadu-sage'
                : isCurrent
                ? 'w-3.5 bg-amber-500 animate-pulse'
                : 'w-1.5 bg-sadu-gold/50'
            }`}
          />
        );
      })}
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className={`relative inline-block max-w-full text-start ${className}`}
      id={id || `status-indicator-${type}-${Math.random().toString(36).substr(2, 6)}`}
    >
      {/* 1. COMPACT VARIANT (Primary injection for table/list rows) */}
      {variant === 'compact' && (
        <button
          type="button"
          onClick={() => {
            if (interactive) {
              setShowPopover(!showPopover);
              onInspectDetails?.();
            }
          }}
          className={`inline-flex max-w-full flex-wrap items-center gap-2 px-2.5 py-1 rtl:px-3 rtl:py-1.5 rounded-md border ${theme.bg} ${theme.border} ${theme.text} text-xs transition-all duration-150 ${
            interactive ? 'hover:shadow-xs cursor-pointer active:scale-98' : 'cursor-default'
          }`}
          title={`${activeLabel} (${calculatedPercent}% - Step ${calculatedCurrent}/${calculatedTotal})`}
          aria-label={`${type} status: ${activeLabel}, ${calculatedPercent}% completed`}
        >
          {/* Live Pulse Beacon */}
          {showPulse && isLive && resolvedStatus !== 'completed' && (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.pulse} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${theme.dot}`} />
            </span>
          )}

          {/* Icon or Status Dot */}
          {(!showPulse || !isLive || resolvedStatus === 'completed') && (
            <IconComponent className="w-3.5 h-3.5 shrink-0" />
          )}

          {/* Type Tag / Label */}
          <span className="min-w-0 break-words text-start font-bold tracking-tight rtl:tracking-normal">
            {localizeDigits(activeLabel)}
          </span>

          {/* Step Pips */}
          {renderStepPips()}

          {/* Percentage badge */}
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rtl:py-0.5 rounded bg-white/70 border border-current/20 shrink-0">
            {formatPercent(calculatedPercent)}
          </span>
        </button>
      )}

      {/* 2. PILL VARIANT (Ultra-compact badge for metadata strips) */}
      {variant === 'pill' && (
        <button
          type="button"
          onClick={() => {
            if (interactive) {
              setShowPopover(!showPopover);
              onInspectDetails?.();
            }
          }}
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rtl:px-2.5 rtl:py-1 rounded-full border text-[11px] font-semibold ${theme.bg} ${theme.border} ${theme.text} ${
            interactive ? 'hover:shadow-xs cursor-pointer' : 'cursor-default'
          }`}
        >
          {showPulse && isLive && resolvedStatus !== 'completed' ? (
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.pulse} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${theme.dot}`} />
            </span>
          ) : (
            <span className={`w-1.5 h-1.5 rounded-full ${theme.dot} shrink-0`} />
          )}
          <span className="whitespace-nowrap">{localizeDigits(activeLabel)}</span>
          <span className="font-mono font-bold text-[10px] opacity-90">({formatPercent(calculatedPercent)})</span>
        </button>
      )}

      {/* 3. DETAILED VARIANT (Expanded bar with stage milestone names) */}
      {variant === 'detailed' && (
        <div 
          className={`p-3 rounded-lg border ${theme.bg} ${theme.border} text-xs space-y-2 cursor-pointer transition-shadow hover:shadow-xs`}
          onClick={() => {
            if (interactive) {
              setShowPopover(!showPopover);
              onInspectDetails?.();
            }
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-white/80 border border-current/20">
                {type === 'contract' ? <FileSignature className="w-3.5 h-3.5 text-sadu-brick" /> : <Scale className="w-3.5 h-3.5 text-sadu-ink" />}
              </span>
              <div>
                <span className="font-bold text-sadu-charcoal block">{localizeDigits(activeLabel)}</span>
                {activeSubtitle && <span className="text-[11px] text-sadu-muted block">{localizeDigits(activeSubtitle)}</span>}
              </div>
            </div>

            <div className="text-end">
              <span className="font-mono font-bold text-sadu-ink text-xs block">
                {formatPercent(calculatedPercent)}
              </span>
              <span className="text-[10px] text-sadu-muted">
                {isAr ? `المرحلة ${formatNumber(calculatedCurrent)} من ${formatNumber(calculatedTotal)}` : `Step ${calculatedCurrent} of ${calculatedTotal}`}
              </span>
            </div>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full bg-sadu-sand h-2 rounded-full overflow-hidden border border-sadu-gold/50">
            <div 
              className={`h-full ${theme.bar} transition-all duration-500 rounded-full`}
              style={{ width: `${calculatedPercent}%` }}
              role="progressbar"
              aria-valuenow={calculatedPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {/* 4. MICRO VARIANT (Only dot + progress text) */}
      {variant === 'micro' && (
        <span 
          className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold ${theme.text}`}
          title={`${activeLabel} - ${formatPercent(calculatedPercent)}`}
        >
          <span className={`w-2 h-2 rounded-full ${theme.dot} shrink-0`} />
          <span>{formatPercent(calculatedPercent)}</span>
        </span>
      )}

      {/* POPUP / DRILL-DOWN AUDIT CARD */}
      {showPopover && (
        <div 
          className="absolute z-50 mt-1.5 w-72 sm:w-84 max-w-[90vw] p-4 bg-sadu-paper rounded-lg border-2 border-sadu-gold shadow-xl text-xs space-y-3 end-0 sm:end-auto animate-in fade-in zoom-in-95 duration-100"
          role="dialog"
          aria-label="Workflow progress details"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-sadu-gold/50 pb-2">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sadu-brick">
                {type === 'contract' ? <FileSignature className="w-3 h-3" /> : <Scale className="w-3 h-3" />}
                <span>{type === 'contract' ? (isAr ? 'سلسلة تدقيق العقد' : 'Contract Audit Trail') : (isAr ? 'مسار اعتماد اللجنة' : 'Committee Ratification')}</span>
              </div>
              <h4 className="font-bold text-sadu-charcoal text-sm mt-0.5">
                {localizeDigits(activeLabel)}
              </h4>
            </div>

            <div className="text-end">
              <span className="font-mono font-bold text-sm text-sadu-ink bg-sadu-sand px-2 py-0.5 rounded border border-sadu-gold">
                {formatPercent(calculatedPercent)}
              </span>
              <span className="text-[10px] text-sadu-muted block mt-0.5">
                {formatRatio(calculatedCurrent, calculatedTotal)} {isAr ? 'خطوات' : 'steps'}
              </span>
            </div>
          </div>

          {/* Micro Milestone Stepper in Popover */}
          <div className="space-y-1.5 py-1 max-h-48 overflow-y-auto pr-1">
            {activeStages.map((stage, idx) => {
              const isPast = idx < calculatedCurrent - 1 || (idx < calculatedCurrent && resolvedStatus === 'completed');
              const isCurrent = idx === calculatedCurrent - 1 && resolvedStatus !== 'completed';
              
              return (
                <div 
                  key={stage.id} 
                  className={`flex items-start gap-2.5 p-2 rounded text-[11px] transition-colors ${
                    isCurrent 
                      ? 'bg-amber-50 border border-amber-300 font-semibold' 
                      : isPast 
                      ? 'bg-sadu-linen/80 text-sadu-charcoal' 
                      : 'opacity-60 text-sadu-muted'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-sadu-sage" />
                    ) : isCurrent ? (
                      <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600" />
                      </span>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-sadu-gold flex items-center justify-center text-[9px] font-mono">
                        {formatNumber(idx + 1)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate">
                        {isAr ? stage.nameAr : stage.nameEn}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] text-amber-800 font-mono font-bold shrink-0">
                          {isAr ? 'جارٍ الآن' : 'Active'}
                        </span>
                      )}
                    </div>
                    {stage.signeeEn && (
                      <span className="text-[10px] text-sadu-muted block">
                        {isAr ? (stage.signeeAr || stage.signeeEn) : stage.signeeEn}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Next Action Marker */}
          {(nextActionEn || nextActionAr) && (
            <div className="p-2 bg-sadu-sand rounded border border-sadu-gold/60 text-[11px] space-y-0.5">
              <span className="font-bold text-sadu-charcoal flex items-center gap-1">
                <Info className="w-3 h-3 text-sadu-brick" />
                <span>{isAr ? 'الإجراء التالي المطلوب:' : 'Next Action Required:'}</span>
              </span>
              <p className="text-sadu-charcoal leading-relaxed">
                {isAr ? (nextActionAr || nextActionEn) : (nextActionEn || nextActionAr)}
              </p>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-2 border-t border-sadu-gold/50 flex items-center justify-between text-[11px]">
            <span className="text-sadu-muted flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-sadu-sage" />
              <span>{isAr ? 'مزامنة فورية مشفرة' : 'Live Sync Validated'}</span>
            </span>

            <div className="flex items-center gap-1.5">
              {onAdvanceStage && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdvanceStage();
                  }}
                  className="px-2 py-0.5 rtl:px-2.5 rtl:py-1 rounded bg-sadu-ink text-white hover:bg-sadu-ink-dark transition-colors font-medium cursor-pointer"
                >
                  {isAr ? 'تحديث المرحلة' : 'Advance'}
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPopover(false);
                }}
                className="px-2 py-0.5 rtl:px-2.5 rtl:py-1 rounded bg-sadu-linen border border-sadu-gold hover:bg-sadu-sand transition-colors font-medium text-sadu-charcoal cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
