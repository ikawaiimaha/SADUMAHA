import React from 'react';
import { Language, RoleKey, WorkspaceTab, ExhibitionProgramme } from '../types';
import { ROLE_PROFILES, PROGRAMMES } from '../data/mockData';
import { useI18n } from '../context/I18nContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  Search, 
  SlidersHorizontal,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface InstitutionalBreadcrumbProps {
  lang?: Language;
  currentRole?: RoleKey;
  selectedProgramme?: ExhibitionProgramme;
  activeTab?: WorkspaceTab;
  onOpenRoleOnboarding?: () => void;
  onOpenSearch?: () => void;
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

export const InstitutionalBreadcrumb: React.FC<InstitutionalBreadcrumbProps> = (props) => {
  const i18n = useI18n();
  const workspace = useWorkspace();

  const lang = props.lang ?? i18n.lang;
  const isAr = lang === 'ar';
  const currentRole = props.currentRole ?? workspace.currentRole;
  const selectedProgramme = props.selectedProgramme ?? workspace.selectedProgramme;
  const activeTab = props.activeTab ?? workspace.activeTab;
  const onOpenRoleOnboarding = props.onOpenRoleOnboarding ?? (() => {});
  const onOpenSearch = props.onOpenSearch ?? (() => workspace.setIsCommandPaletteOpen(true));
  const onNavigateTab = props.onNavigateTab ?? workspace.navigateTab;

  const roleProfile = ROLE_PROFILES[currentRole];
  const ChevronIcon = isAr ? ChevronLeft : ChevronRight;

  const tabLabels: Record<WorkspaceTab, { en: string; ar: string }> = {
    overview: { en: 'Perspective Desk', ar: 'مكتب الدور النشط' },
    dossiers: { en: 'Curatorial Selection Dossiers', ar: 'ملفات الاختيار والتحكيم' },
    'approved-scope': { en: 'Approved Scope Register (v1.2)', ar: 'سجل النطاق المعتمد (v1.2)' },
    contracts: { en: 'Bilateral Contracts & Legal Sign-off', ar: 'العقود الثنائية والاعتماد' },
    operations: { en: 'Specialist Operations & Engineering Gates', ar: 'العمليات التخصصية والهندسية' },
    communications: { en: 'Attributable Official Messages', ar: 'المراسلات الرسمية الموثقة' },
    archive: { en: 'Sovereign Archive & Closeout Manifest', ar: 'الأرشيف السيادي والإغلاق' },
  };

  return (
    <div className="bg-sadu-sand/70 border-b border-sadu-gold/50 px-4 sm:px-6 py-2.5 text-xs text-sadu-charcoal">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 flex-wrap font-medium">
          <span className="text-sadu-muted">
            {isAr ? 'دائرة الثقافة' : 'Sharjah Culture'}
          </span>
          <ChevronIcon className="w-3.5 h-3.5 text-sadu-gold" />

          {/* Programme Context */}
          <span className="text-sadu-ink font-bold truncate max-w-[200px] sm:max-w-xs">
            {isAr ? selectedProgramme.titleAr : selectedProgramme.titleEn}
          </span>
          <ChevronIcon className="w-3.5 h-3.5 text-sadu-gold" />

          {/* Active Workspace */}
          <span className="text-sadu-brick font-bold">
            {isAr ? tabLabels[activeTab].ar : tabLabels[activeTab].en}
          </span>
        </nav>

        {/* Right: Active Role Context & Quick Jump */}
        <div className="flex items-center gap-3 self-end md:self-auto flex-wrap text-[11px]">
          {/* Programme Health Status */}
          <div className="hidden lg:flex items-center gap-2 bg-sadu-linen px-2.5 py-1 rounded-md border border-sadu-gold/80">
            <span className="text-sadu-muted">
              {isAr ? 'جاهزية البوابات:' : 'Gates Ready:'}
            </span>
            <span className="font-mono font-bold text-sadu-ink">
              {selectedProgramme.gatesReady}/{selectedProgramme.gatesTotal}
            </span>
            <div className="w-12 h-1.5 bg-sadu-gold/40 rounded-full overflow-hidden">
              <div 
                className="h-full bg-sadu-sage" 
                style={{ width: `${selectedProgramme.progressPercent}%` }}
              />
            </div>
            <span className="font-mono text-sadu-sage font-semibold text-[10px]">
              {selectedProgramme.progressPercent}%
            </span>
          </div>

          {/* Role Boundary Pill */}
          <div className="flex items-center gap-1.5 bg-sadu-linen px-2.5 py-1 rounded-md border border-sadu-gold">
            <span className="w-2 h-2 rounded-full bg-sadu-brick" />
            <span className="text-sadu-muted">
              {isAr ? 'المنظور:' : 'Perspective:'}
            </span>
            <span className="font-bold text-sadu-charcoal">
              {isAr ? roleProfile.nameAr : roleProfile.nameEn}
            </span>
            <button
              onClick={onOpenRoleOnboarding}
              className="text-sadu-brick hover:underline font-bold ml-1 rtl:ml-0 rtl:mr-1 cursor-pointer"
              title={isAr ? 'عرض بطاقة الصلاحيات والحدود' : 'View Role Scope & Boundaries'}
            >
              ({isAr ? 'البطاقة' : 'Card'})
            </button>
          </div>

          {/* Quick Search Shortcut Badge */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 bg-sadu-linen hover:bg-sadu-sand/80 px-2.5 py-1 rounded-md border border-sadu-gold text-sadu-muted hover:text-sadu-charcoal transition-colors cursor-pointer"
            title={isAr ? 'بحث سريع وأوامر (⌘K)' : 'Quick Jump / Command Palette (⌘K)'}
          >
            <Search className="w-3 h-3 text-sadu-brick" />
            <span className="hidden sm:inline">{isAr ? 'بحث سريع' : 'Search'}</span>
            <kbd className="font-mono text-[9px] bg-sadu-sand px-1 py-0.2 rounded border border-sadu-gold">⌘K</kbd>
          </button>
        </div>
      </div>
    </div>
  );
};
