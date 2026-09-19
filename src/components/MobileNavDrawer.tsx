import React from 'react';
import { Language, RoleKey, WorkspaceTab, ExhibitionProgramme } from '../types';
import { ROLE_PROFILES, PROGRAMMES } from '../data/mockData';
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
  UserCheck, 
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
  activeTab: WorkspaceTab;
  onNavigateTab: (tab: WorkspaceTab) => void;
  onSelectRole: (role: RoleKey) => void;
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
  activeTab,
  onNavigateTab,
  onSelectRole,
  onSelectProgramme,
  onOpenSearch,
  onOpenStory,
  onOpenPresenter,
  onToggleLanguage,
  onToggleDensity,
}) => {
  const isAr = lang === 'ar';
  if (!isOpen) return null;

  const profile = ROLE_PROFILES[currentRole];

  const allTabs = [
    { id: 'overview' as WorkspaceTab, icon: LayoutDashboard, labelEn: 'Perspective Desk', labelAr: 'مكتب الدور النشط', tag: currentRole },
    { id: 'dossiers' as WorkspaceTab, icon: FileText, labelEn: 'Curatorial Dossiers', labelAr: 'ملفات الاختيار والتحكيم', tag: 'Jury' },
    { id: 'approved-scope' as WorkspaceTab, icon: Lock, labelEn: 'Approved Scope (v1.2)', labelAr: 'النطاق المعتمد والمواصفات', tag: 'Frozen' },
    { id: 'contracts' as WorkspaceTab, icon: FileSignature, labelEn: 'Contracts & Legal', labelAr: 'العقود النظامية والتواقيع', tag: 'Legal' },
    { id: 'operations' as WorkspaceTab, icon: Wrench, labelEn: 'Specialist Operations', labelAr: 'العمليات التخصصية والميدان', tag: 'Gates' },
    { id: 'communications' as WorkspaceTab, icon: MessageSquare, labelEn: 'Official Messages', labelAr: 'المراسلات الرسمية الموثقة', tag: 'Log' },
    { id: 'archive' as WorkspaceTab, icon: Archive, labelEn: 'Archive & Closeout', labelAr: 'الأرشيف والإغلاق الدائم', tag: 'Seal' },
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
      <div className="relative w-4/5 max-w-xs sm:max-w-sm bg-sadu-linen h-full shadow-2xl z-50 flex flex-col border-e border-sadu-gold overflow-y-auto">
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
              value={selectedProgramme.id}
              onChange={(e) => {
                const found = PROGRAMMES.find(p => p.id === e.target.value);
                if (found) onSelectProgramme(found);
              }}
              className="w-full text-xs font-semibold p-2 bg-sadu-linen border border-sadu-gold rounded-md text-sadu-charcoal focus:border-sadu-brick focus:outline-hidden"
            >
              {PROGRAMMES.map(p => (
                <option key={p.id} value={p.id}>
                  {isAr ? p.titleAr : p.titleEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-[10px] font-bold text-sadu-muted uppercase tracking-wider block mb-1">
              {isAr ? 'الدور المؤسسي النشط:' : 'Active Perspective Role:'}
            </span>
            <select
              value={currentRole}
              onChange={(e) => onSelectRole(e.target.value as RoleKey)}
              className="w-full text-xs font-semibold p-2 bg-sadu-linen border border-sadu-gold rounded-md text-sadu-charcoal focus:border-sadu-brick focus:outline-hidden"
            >
              {Object.entries(ROLE_PROFILES).map(([rk, prof]) => (
                <option key={rk} value={rk}>
                  {isAr ? `${prof.nameAr} (${rk})` : `${prof.nameEn} (${rk})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Workspace Navigation */}
        <div className="p-3 flex-1 space-y-1">
          <span className="px-2 py-1 text-[10px] font-bold text-sadu-brick uppercase tracking-wider block">
            {isAr ? 'مسارات العمل والوثائق' : 'Workspace Ledgers'}
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
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-sadu-gold/30 text-sadu-ink'
                }`}>
                  {tab.tag}
                </span>
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
            <span>{isAr ? 'لوحة الشرح المعماري' : 'Presenter Architecture'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
