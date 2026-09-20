import React, { useState } from 'react';
import { Language, RoleKey, DisplayDensity, ExhibitionProgramme, WorkspaceTab } from '../types';
import { ROLE_PROFILES, PROGRAMMES, INSTITUTIONAL_INFO } from '../data/mockData';
import { useI18n } from '../context/I18nContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { NotificationsPopover } from './NotificationsPopover';
import { RosterNavLink } from './RosterNavLink';
import { FINANCE_SCENARIO_LABEL } from '../data/legacyScenario';
import { 
  Globe, 
  ChevronDown, 
  UserCheck, 
  SlidersHorizontal, 
  BookOpen, 
  Bell,
  Sparkles,
  Search,
  Menu,
  Scale
} from 'lucide-react';

export interface HeaderNavProps {
  scopeLocked?: boolean;
  lang?: Language;
  currentRole?: RoleKey;
  selectedProgramme?: ExhibitionProgramme;
  density?: DisplayDensity;
  onRoleChange?: (role: RoleKey) => void;
  onProgrammeChange?: (programme: ExhibitionProgramme) => void;
  onToggleLanguage?: () => void;
  onToggleDensity?: () => void;
  onOpenStory?: () => void;
  onOpenPresenter?: () => void;
  onOpenSearch?: () => void;
  onOpenMobileMenu?: () => void;
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = (props) => {
  const i18n = useI18n();
  const workspace = useWorkspace();

  const lang = props.lang ?? i18n.lang;
  const isAr = lang === 'ar';
  const { formatNumber } = i18n;
  const currentRole = props.currentRole ?? workspace.currentRole;
  const selectedProgramme = props.selectedProgramme ?? workspace.selectedProgramme;

  const onRoleChange = props.onRoleChange ?? workspace.switchRole;
  const onProgrammeChange = props.onProgrammeChange ?? workspace.setSelectedProgramme;
  const onToggleLanguage = props.onToggleLanguage ?? i18n.toggleLang;
  const onToggleDensity = props.onToggleDensity ?? workspace.toggleDensity;
  const onOpenStory = props.onOpenStory ?? (() => workspace.setExperienceMode('story'));
  const onOpenPresenter = props.onOpenPresenter ?? (() => workspace.setIsPresenterOpen(true));
  const onOpenSearch = props.onOpenSearch ?? (() => workspace.setIsCommandPaletteOpen(true));
  const onOpenMobileMenu = props.onOpenMobileMenu ?? (() => workspace.setIsMobileNavOpen(true));
  const onNavigateTab = props.onNavigateTab ?? workspace.navigateTab;

  const profile = ROLE_PROFILES[currentRole];
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [programmeDropdownOpen, setProgrammeDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const rolesList: RoleKey[] = [
    'COORDINATOR', 'SDC_COORDINATOR', 'DIRECTORATE', 'COMMITTEE', 
    'SAF_TECHNICIAN', 'SMA_VENUE_ADMIN', 'PR_PROTOCOL', 'EDITORIAL', 
    'FINANCE', 'LOGISTICS', 'ARTIST'
  ];

  return (
    <header className="bg-sadu-linen border-b border-sadu-gold sticky top-0 z-40 shadow-xs">
      {/* Topmost Institutional Authority Strip */}
      <div className="bg-sadu-ink text-white text-[11px] px-4 sm:px-6 h-8 flex items-center justify-between">
        
        {/* FIXED: Language Toggle moved to the Absolute Start */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded transition-colors border border-white/10 shrink-0 cursor-pointer"
          >
            <Globe className="w-3 h-3 text-amber-200" />
            <span className="font-bold tracking-wider">{isAr ? 'English' : 'عربي'}</span>
          </button>

          <span className="font-semibold tracking-wide whitespace-nowrap hidden sm:inline">
            {isAr ? INSTITUTIONAL_INFO.departmentAr : INSTITUTIONAL_INFO.departmentEn}
          </span>
          <span className="text-white/50 hidden sm:inline">·</span>
          <span className="text-white/80 hidden md:inline whitespace-nowrap">
            {isAr ? INSTITUTIONAL_INFO.directorateAr : INSTITUTIONAL_INFO.directorateEn}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-amber-200/90 font-medium hidden md:inline text-[10px] whitespace-nowrap">
            {isAr ? "عرض افتراضي · مسارات عمل مقترحة" : "Fictional demonstration · proposed workflows"}
          </span>
          <button
            onClick={onOpenPresenter}
            className="text-white hover:text-amber-200 underline text-[11px] cursor-pointer flex items-center gap-1 font-semibold whitespace-nowrap"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{isAr ? 'لوحة الشرح المعماري' : 'Presenter Architecture'}</span>
          </button>
        </div>
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-2" aria-label={isAr ? 'التسجيل في سجل الفنانين' : 'Artist roster registration'}><RosterNavLink/></nav>
      {/* Main Brand & Tool Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <button aria-label={isAr ? 'فتح قائمة التنقل' : 'Open navigation menu'} onClick={onOpenMobileMenu} className="w-9 h-9 flex items-center justify-center rounded-md text-sadu-charcoal hover:bg-sadu-sand lg:hidden border border-sadu-gold cursor-pointer shrink-0">
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-baseline gap-2">
              <span className="font-editorial text-2xl font-bold tracking-tight text-sadu-brick leading-none">
                {isAr ? 'سدو' : 'SADU'}
              </span>
            </div>
            
            <div className="hidden lg:flex items-center gap-2 border-s border-sadu-gold ps-3">
              <span className="px-2 py-0.5 rounded-sm bg-sadu-brick text-white text-[10px] font-bold tracking-wider font-mono whitespace-nowrap">
                {isAr ? 'الدورة 12' : '12th Edition'}
              </span>
              <span className="font-editorial text-lg font-bold text-sadu-charcoal flex items-center gap-1 whitespace-nowrap">
                <Scale className="w-4 h-4 text-sadu-ochre" />
                <span>{isAr ? 'ميزان' : 'Mizan'}</span>
              </span>
            </div>
          </div>

          <div className="relative hidden sm:block ms-2">
            <button disabled={props.scopeLocked} onClick={() => setProgrammeDropdownOpen(!programmeDropdownOpen)} className="flex items-center gap-1.5 px-3 h-9 text-xs font-medium bg-sadu-sand hover:bg-sadu-sand-dark border border-sadu-gold rounded-md transition-colors disabled:cursor-default text-sadu-charcoal shrink-0">
              <span className="text-sadu-brick font-bold whitespace-nowrap">{isAr ? 'المعرض:' : 'Scope:'}</span>
              <span className="max-w-[150px] md:max-w-[210px] truncate font-semibold">{props.scopeLocked ? FINANCE_SCENARIO_LABEL[isAr ? 'ar' : 'en'] : isAr ? selectedProgramme.titleAr : selectedProgramme.titleEn}</span>
              <ChevronDown className="w-3.5 h-3.5 text-sadu-muted shrink-0" />
            </button>
            {programmeDropdownOpen && !props.scopeLocked && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProgrammeDropdownOpen(false)} />
                <div className="absolute top-full mt-1.5 w-72 bg-sadu-linen border-2 border-sadu-gold rounded-lg shadow-lg z-50 p-2 text-xs">
                  {PROGRAMMES.map((prog) => (
                    <button key={prog.id} onClick={() => { onProgrammeChange(prog); setProgrammeDropdownOpen(false); }} className={`w-full text-start px-2.5 py-2 rounded-md hover:bg-sadu-sand transition-colors flex flex-col cursor-pointer ${prog.id === selectedProgramme.id ? 'bg-sadu-sand font-semibold border-s-2 border-sadu-brick' : ''}`}>
                      <span className="text-sadu-charcoal font-medium">{isAr ? prog.titleAr : prog.titleEn}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 max-w-xs md:max-w-sm hidden md:block">
          <button data-workspace-search onClick={onOpenSearch} className="w-full h-9 px-3 bg-sadu-sand/70 hover:bg-sadu-sand border border-sadu-gold rounded-md text-xs text-sadu-muted flex items-center justify-between transition-colors cursor-pointer group">
            <div className="flex items-center gap-2 overflow-hidden">
              <Search className="w-3.5 h-3.5 text-sadu-brick shrink-0" />
              <span className="group-hover:text-sadu-charcoal text-[11px] truncate whitespace-nowrap">{isAr ? 'بحث سريع وأوامر...' : 'Search workspaces & gates...'}</span>
            </div>
            <kbd className="bg-sadu-linen px-1.5 py-0.5 rounded border border-sadu-gold text-sadu-brick font-bold text-[9px]">⌘K</kbd>
          </button>
        </div>

        {/* Right Controls (Language Toggle removed from here) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button data-workspace-search aria-label={isAr ? 'البحث في مساحات العمل' : 'Search workspaces'} onClick={onOpenSearch} className="w-9 h-9 flex items-center justify-center text-sadu-charcoal hover:bg-sadu-sand rounded-md border border-sadu-gold md:hidden cursor-pointer shrink-0">
            <Search className="w-3.5 h-3.5 text-sadu-brick" />
          </button>

          <div className="relative">
            <button aria-label={isAr ? `الإشعارات: ${formatNumber(3)} غير مقروءة` : `Notifications: ${formatNumber(3)} unread`} onClick={() => setNotificationsOpen(!notificationsOpen)} className="w-9 h-9 flex items-center justify-center text-xs text-sadu-charcoal hover:bg-sadu-sand rounded-md border border-sadu-gold transition-colors cursor-pointer relative shrink-0">
              <Bell className="w-4 h-4 text-sadu-brick" />
              <span aria-hidden="true" className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-sadu-brick text-white text-[9px] font-bold flex items-center justify-center">
                {formatNumber(3)}
              </span>
            </button>
            <NotificationsPopover isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} lang={lang} onNavigateTab={onNavigateTab} />
          </div>

          <div className="relative">
            <button data-role-switcher onClick={() => setRoleDropdownOpen(!roleDropdownOpen)} className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 h-9 text-xs font-semibold bg-sadu-ink text-white rounded-md hover:bg-sadu-ink-dark transition-colors shadow-2xs cursor-pointer shrink-0">
              <UserCheck className="w-3.5 h-3.5 text-amber-200 shrink-0" />
              <span className="truncate max-w-[100px] sm:max-w-[140px]">{isAr ? profile?.nameAr : profile?.nameEn}</span>
              <ChevronDown className="w-3 h-3 shrink-0" />
            </button>
            {roleDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setRoleDropdownOpen(false)} />
                <div className="absolute end-0 top-full mt-1.5 w-80 bg-sadu-linen border-2 border-sadu-gold rounded-lg shadow-xl z-50 p-2 text-xs h-96 overflow-y-auto">
                  {rolesList.map((rk) => {
                    const rp = ROLE_PROFILES[rk];
                    return (
                      <button key={rk} onClick={() => { onRoleChange(rk); setRoleDropdownOpen(false); }} className="w-full text-start px-2.5 py-2 rounded-md hover:bg-sadu-sand transition-colors flex flex-col cursor-pointer">
                        <span className="font-semibold">{isAr ? rp?.nameAr : rp?.nameEn}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <button onClick={onOpenStory} className="px-2.5 h-9 text-xs font-semibold text-sadu-brick hover:bg-sadu-sand border border-sadu-brick/40 rounded-md transition-colors hidden md:flex items-center justify-center gap-1 cursor-pointer shrink-0">
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">{isAr ? 'القصة' : 'Story'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
