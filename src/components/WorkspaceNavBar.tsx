import React, { useRef } from 'react';
import { Language, RoleKey, WorkspaceTab } from '../types';
import { ROLE_PROFILES } from '../data/mockData';
import { useI18n } from '../context/I18nContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  LayoutDashboard, 
  FileText, 
  Lock, 
  FileSignature, 
  Wrench, 
  MessageSquare, 
  Archive as ArchiveIcon,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';

interface WorkspaceNavBarProps {
  lang?: Language;
  currentRole?: RoleKey;
  activeTab?: WorkspaceTab;
  onNavigateTab?: (tab: WorkspaceTab) => void;
  onOpenMobileMenu?: () => void;
}

export const WorkspaceNavBar: React.FC<WorkspaceNavBarProps> = (props) => {
  const i18n = useI18n();
  const workspace = useWorkspace();

  const lang = props.lang ?? i18n.lang;
  const isAr = lang === 'ar';
  const currentRole = props.currentRole ?? workspace.currentRole;
  const activeTab = props.activeTab ?? workspace.activeTab;
  const onNavigateTab = props.onNavigateTab ?? workspace.navigateTab;
  const onOpenMobileMenu = props.onOpenMobileMenu ?? (() => workspace.setIsMobileNavOpen(true));

  const roleProfile = ROLE_PROFILES[currentRole];
  const scrollRef = useRef<HTMLDivElement>(null);

  // Dynamic label for the overview tab based on role
  const getRoleOverviewLabel = () => {
    switch (currentRole) {
      case 'DIRECTORATE':
      case 'LEADERSHIP':
        return { en: 'Executive Directorate', ar: 'القيادة التنفيذية' };
      case 'COORDINATOR':
        return { en: 'Control Room (41)', ar: `غرفة التحكم (${i18n.formatNumber(41)})` };
      case 'COMMITTEE':
        return { en: 'Curatorial Jury', ar: 'التحكيم الفني' };
      case 'TECHNICAL_MUSEUM':
      case 'TECHNICAL':
      case 'VENUE_ADMIN':
        return { en: 'Technical & SAM Loop', ar: 'الهندسة وتصاريح SAM' };
      case 'PR_PROTOCOL':
      case 'PR_VISA':
        return { en: 'PR & Protocol Gate', ar: 'المراسم والبروتوكول' };
      case 'EDITORIAL':
        return { en: 'Editorial & Catalogue', ar: 'التحرير والكتالوج' };
      case 'FINANCE':
        return { en: 'Finance & Compliance', ar: 'المالية والمشتريات' };
      case 'LOGISTICS':
        return { en: 'Freight & Movement', ar: 'الشحن واللوجستيات' };
      case 'ARTIST':
        return { en: 'Artist Studio', ar: 'استوديو الفنان' };
      case 'ARCHIVE':
        return { en: "Sample archive", ar: 'أرشيف تجريبي' };
      default:
        return { en: 'Perspective Desk', ar: 'مكتب المنظور' };
    }
  };

  const overviewLabel = getRoleOverviewLabel();

  const allTabs = [
    { 
      id: 'overview' as WorkspaceTab, 
      icon: LayoutDashboard, 
      labelEn: overviewLabel.en, 
      labelAr: overviewLabel.ar,
      isPrimaryRole: true,
      badge: isAr ? 'مكتبي' : 'My Desk'
    },
    { 
      id: 'dossiers' as WorkspaceTab, 
      icon: FileText, 
      labelEn: 'Curatorial Selection', 
      labelAr: 'ملفات الاختيار' 
    },
    { 
      id: 'approved-scope' as WorkspaceTab, 
      icon: Lock, 
      labelEn: 'Approved Scope (v1.2)', 
      labelAr: 'النطاق المعتمد',
      badge: 'v1.2'
    },
    { 
      id: 'contracts' as WorkspaceTab, 
      icon: FileSignature, 
      labelEn: 'Contracts & Legal', 
      labelAr: 'العقود النظامية' 
    },
    { 
      id: 'operations' as WorkspaceTab, 
      icon: Wrench, 
      labelEn: 'Specialist Operations', 
      labelAr: 'العمليات التخصصية',
      hasAlert: true
    },
    { 
      id: 'communications' as WorkspaceTab, 
      icon: MessageSquare, 
      labelEn: 'Sample messages',
      labelAr: 'رسائل تجريبية'
    },
    { 
      id: 'archive' as WorkspaceTab, 
      icon: ArchiveIcon, 
      labelEn: "Sample archive",
      labelAr: "أرشيف تجريبي"
    },
  ];

  // Enforce strict Data Minimization: filter tabs based on role's permittedViews
  const permittedViews = roleProfile?.permittedViews || ['overview'];
  const tabs = allTabs.filter(tab => permittedViews.includes(tab.id));

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -200 : 200;
      scrollRef.current.scrollBy({ left: isAr ? -offset : offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-sadu-linen border-b border-sadu-gold shadow-2xs sticky top-[48px] sm:top-[85px] z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2">
        {/* Scroll Left Button (hidden on desktop unless needed) */}
        <button
          onClick={() => scroll('left')}
          className="p-1 rounded text-sadu-muted hover:text-sadu-charcoal hover:bg-sadu-sand/70 sm:hidden cursor-pointer shrink-0"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
        </button>

        {/* Scrollable Tabs */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-x-auto scrollbar-none py-2 flex items-center space-x-1.5 rtl:space-x-reverse"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigateTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer relative ${
                  isActive
                    ? 'bg-sadu-brick text-white shadow-xs'
                    : 'text-sadu-charcoal hover:bg-sadu-sand/70 hover:text-sadu-brick'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-sadu-muted'}`} />
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>

                {/* Sub-Badges */}
                {tab.badge && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono uppercase ${
                    isActive 
                      ? 'bg-white/25 text-white' 
                      : 'bg-sadu-gold/30 text-sadu-ink'
                  }`}>
                    {tab.badge}
                  </span>
                )}

                {/* Subtle Alert Indicator on Specialist Operations */}
                {tab.hasAlert && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Scroll Right Button */}
        <button
          onClick={() => scroll('right')}
          className="p-1 rounded text-sadu-muted hover:text-sadu-charcoal hover:bg-sadu-sand/70 sm:hidden cursor-pointer shrink-0"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4 rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
};
