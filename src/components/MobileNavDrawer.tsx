import React, { useEffect, useRef } from 'react';
import { Language, RoleKey, WorkspaceTab, ExhibitionProgramme } from '../types';
import { PROGRAMMES, ROLE_PROFILES } from '../data/mockData';
import { FINANCE_SCENARIO_ID, FINANCE_SCENARIO_LABEL } from '../data/legacyScenario';
import { 
  X, 
  LayoutDashboard, 
  FileText, 
  Lock, 
  FileSignature, 
  Wrench, 
  MessageSquare, 
  Archive, 
  Layers, 
  Globe, 
  SlidersHorizontal, 
  BookOpen, 
  Sparkles,
  Search,
  ChevronRight
} from 'lucide-react';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  currentRole: RoleKey;
  selectedProgramme: ExhibitionProgramme;
  scopeLocked?: boolean;
  activeTab: WorkspaceTab;
  onNavigateTab: (tab: WorkspaceTab) => void;
  onSelectProgramme: (programme: ExhibitionProgramme) => void;
  onOpenSearch: () => void;
  onOpenStory: () => void;
  onOpenPresenter: () => void;
  onToggleLanguage: () => void;
  onToggleDensity: () => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  lang,
  currentRole,
  selectedProgramme,
  scopeLocked = false,
  activeTab,
  onNavigateTab,
  onSelectProgramme,
  onOpenSearch,
  onOpenStory,
  onOpenPresenter,
  onToggleLanguage,
  onToggleDensity,
}) => {
  const isAr = lang === 'ar';
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const drawer = drawerRef.current;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !drawer) return;
      const focusable = Array.from(drawer.querySelectorAll<HTMLElement>('button, a, select, input, [tabindex]:not([tabindex="-1"])')).filter(element => !element.hasAttribute('disabled'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = 'hidden';
    drawer?.focus();
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const profile = ROLE_PROFILES[currentRole];
  const allTabs = [
    { id: 'overview' as WorkspaceTab, icon: LayoutDashboard, labelEn: 'Dashboard', labelAr: 'الرئيسية' },
    { id: 'dossiers' as WorkspaceTab, icon: FileText, labelEn: 'Selection', labelAr: 'الاختيار' },
    { id: 'approved-scope' as WorkspaceTab, icon: Lock, labelEn: 'Approved Scope', labelAr: 'النطاق المعتمد' },
    { id: 'contracts' as WorkspaceTab, icon: FileSignature, labelEn: 'Contracts', labelAr: 'العقود' },
    { id: 'operations' as WorkspaceTab, icon: Wrench, labelEn: 'Operations', labelAr: 'العمليات' },
    { id: 'communications' as WorkspaceTab, icon: MessageSquare, labelEn: 'Communications', labelAr: 'المراسلات' },
    { id: 'archive' as WorkspaceTab, icon: Archive, labelEn: 'Archive', labelAr: 'الأرشيف' },
  ];

  const permittedViews = profile?.permittedViews || ['overview'];
  const tabs = allTabs.filter(tab => permittedViews.includes(tab.id));

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-sadu-charcoal/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={isAr ? 'قائمة التنقل' : 'Navigation Menu'} className="relative w-4/5 max-w-xs sm:max-w-sm bg-sadu-linen h-full shadow-2xl z-50 flex flex-col border-e border-sadu-gold overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-4 bg-sadu-ink text-white flex items-center justify-between">
          <div>
            <span className="font-editorial text-xl font-bold tracking-tight text-white block">
              {isAr ? 'سدو (SADU)' : 'SADU Navigation'}
            </span>
            <span className="text-[10px] text-white/70">
              {isAr ? 'دائرة الثقافة في الشارقة' : 'Sharjah Dept of Culture'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search Button */}
        <div className="p-3 border-b border-sadu-gold/50 bg-sadu-sand/60">
          <button
            onClick={() => {
              onClose();
              onOpenSearch();
            }}
            className="w-full py-2 px-3 bg-sadu-linen border border-sadu-gold rounded-md text-xs text-sadu-muted flex items-center justify-between hover:border-sadu-brick transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-sadu-brick" />
              <span>{isAr ? 'بحث سريع وأوامر...' : 'Search & Quick Jump...'}</span>
            </div>
            <span className="text-[10px] font-mono bg-sadu-sand px-1.5 py-0.5 rounded border border-sadu-gold">⌘K</span>
          </button>
        </div>

        {/* Current Context Card */}
        <div className="p-4 border-b border-sadu-gold/60 bg-sadu-sand/40 space-y-3">
          <div>
            <span className="text-[10px] font-bold text-sadu-muted uppercase tracking-wider block mb-1">
              {isAr ? 'المعرض النشط:' : 'Active Programme:'}
            </span>
            <select
              value={scopeLocked ? FINANCE_SCENARIO_ID : selectedProgramme.id}
              disabled={scopeLocked}
              aria-label={isAr ? 'نطاق البرنامج' : 'Programme scope'}
              onChange={(e) => {
                const found = PROGRAMMES.find(p => p.id === e.target.value);
                if (found) onSelectProgramme(found);
              }}
              className="w-full text-xs font-semibold p-2 bg-sadu-linen border border-sadu-gold rounded-md text-sadu-charcoal focus:border-sadu-brick focus:outline-hidden"
            >
              {scopeLocked ? <option value={FINANCE_SCENARIO_ID}>{FINANCE_SCENARIO_LABEL[isAr ? 'ar' : 'en']}</option> : PROGRAMMES.map(p => (
                <option key={p.id} value={p.id}>
                  {isAr ? p.titleAr : p.titleEn}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Main Workspace Navigation */}
        <div className="p-3 flex-1 space-y-1">
          <span className="px-2 py-1 text-[10px] font-bold text-sadu-brick uppercase tracking-wider block">
            {isAr ? 'الأقسام والسجلات' : 'Institutional Sections'}
          </span>

          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onNavigateTab(tab.id);
                  onClose();
                }}
                className={`w-full p-2.5 rounded-md text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  isActive 
                    ? 'bg-sadu-brick text-white font-bold' 
                    : 'text-sadu-charcoal hover:bg-sadu-sand/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{isAr ? tab.labelAr : tab.labelEn}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Utilities & Bottom Actions */}
        <div className="p-3 border-t border-sadu-gold bg-sadu-sand/70 space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onToggleLanguage();
                onClose();
              }}
              className="p-2 bg-sadu-linen border border-sadu-gold rounded-md font-semibold text-center flex items-center justify-center gap-1.5 hover:bg-sadu-sand/80 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-sadu-ink" />
              <span>{isAr ? 'English' : 'عربي'}</span>
            </button>

            <button
              onClick={() => {
                onToggleDensity();
              }}
              className="p-2 bg-sadu-linen border border-sadu-gold rounded-md font-semibold text-center flex items-center justify-center gap-1.5 hover:bg-sadu-sand/80 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-sadu-ink" />
              <span>{isAr ? 'الكثافة' : 'Density'}</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenStory();
            }}
            className="w-full p-2 bg-sadu-linen border border-sadu-brick/40 text-sadu-brick font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-sadu-sand/70 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>{isAr ? 'عرض القصة التأسيسية' : 'Open Institutional Story'}</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenPresenter();
            }}
            className="w-full p-2 bg-sadu-ink text-white font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-sadu-ink-dark cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isAr ? 'ملاحظات العرض' : 'Presentation Notes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
