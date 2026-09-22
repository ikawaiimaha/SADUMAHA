import React, { useState, useEffect } from 'react';
import { 
  Language, 
  ExperienceMode, 
  RoleKey, 
  DisplayDensity, 
  WorkspaceTab, 
  ExhibitionProgramme 
} from './types';
import { PROGRAMMES, ROLE_PROFILES } from './data/mockData';
import { I18nProvider, useI18n } from './context/I18nContext';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { LivingRecordProvider, useLivingRecord } from './context/LivingRecordContext';
import { LivingRecordWorkspace } from './components/LivingRecordWorkspace';
import { ArtistIntakeProvider } from './context/ArtistIntakeContext';
import { IntakeDraftBackupProvider } from './context/IntakeDraftBackupContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { RosterRegistration } from './components/RosterRegistration';
import { DEMO_PROGRAMME_ID } from './data/livingRecord';
import { HeaderNav } from './components/HeaderNav';
import { DemoNotice } from './components/DemoNotice';
import { AuthoredBand } from './components/AuthoredBand';
import { StoryMode } from './components/StoryMode';
import { RoleOnboarding } from './components/RoleOnboarding';
import { PresenterDrawer } from './components/PresenterDrawer';
import { CommandPalette } from './components/CommandPalette';
import { NewContractModal } from './components/NewContractModal';
import { MobileNavDrawer } from './components/MobileNavDrawer';
import { InstitutionalBreadcrumb } from './components/InstitutionalBreadcrumb';
import { LegacyScenarioNotice } from './components/LegacyScenarioNotice';
import { isFinanceScenario } from './data/legacyScenario';
import { WorkspaceNavBar } from './components/WorkspaceNavBar';
import { RehearsalTeleprompter } from './components/RehearsalTeleprompter';
import { AppShell } from './components/layout/AppShell';

// Workspace Views
import { LeadershipView } from './components/workspaces/LeadershipView';
import { CoordinatorView } from './components/workspaces/CoordinatorView';
import { CommitteeView } from './components/workspaces/CommitteeView';
import { ArtistView } from './components/workspaces/ArtistView';
import { ScopeContractsView } from './components/workspaces/ScopeContractsView';
import { OperationsView } from './components/workspaces/OperationsView';
import { CommunicationView } from './components/workspaces/CommunicationView';
import { ArchiveView } from './components/workspaces/ArchiveView';

// Dedicated Role Dashboards for the 9-Role Ecosystem
import { DirectorateDashboard } from './components/workspaces/DirectorateDashboard';
import { TechnicalMuseumDashboard } from './components/workspaces/TechnicalMuseumDashboard';
import { PrProtocolDashboard } from './components/workspaces/PrProtocolDashboard';
import { FinanceDashboard } from './components/workspaces/FinanceDashboard';
import { LogisticsDashboard } from './components/workspaces/LogisticsDashboard';
import { EditorialDashboard } from './components/workspaces/EditorialDashboard';

import { 
  ArrowUp, 
  Sparkles,
  Search,
  KeyRound,
  Lock,
  ShieldCheck,
  User
} from 'lucide-react';

const IDENTITY_OPTIONS: { key: RoleKey; labelEn: string; labelAr: string; categoryEn: string; categoryAr: string }[] = [
  { key: 'DIRECTORATE', labelEn: 'Directorate Leadership', labelAr: 'القيادة التنفيذية', categoryEn: 'Leadership', categoryAr: 'القيادة' },
  { key: 'COORDINATOR', labelEn: 'Exhibition Coordinator', labelAr: 'منسق المعارض', categoryEn: 'Management', categoryAr: 'الإدارة' },
  { key: 'COMMITTEE', labelEn: 'Curatorial Committee', labelAr: 'لجنة التحكيم', categoryEn: 'Assessment', categoryAr: 'التقييم' },
  { key: 'TECHNICAL_MUSEUM', labelEn: 'Technical & Installation', labelAr: 'العمليات الفنية', categoryEn: 'Operations', categoryAr: 'العمليات' },
  { key: 'ARTIST', labelEn: 'External Artist', labelAr: 'الفنان المشارك', categoryEn: 'External', categoryAr: 'خارجي' },
];

const IdentityGate: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => {
  const { switchRole, currentRole } = useWorkspace();
  const { isAr } = useI18n();
  const activeProfile = ROLE_PROFILES[currentRole];
  return (
    <div className="min-h-screen bg-sadu-charcoal flex flex-col items-center justify-center p-4 selection:bg-sadu-brick selection:text-white">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-sadu-linen rounded-xl overflow-hidden shadow-2xl border border-sadu-gold/30">
        <div className="bg-sadu-ink p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10"><h1 className="text-4xl font-editorial font-bold text-white mb-4 tracking-tight">SADU</h1><h2 className="text-lg text-sadu-sand font-medium mb-6">{isAr ? 'نظام الشارقة الموحد لبيانات الفنون' : 'System for Arts Data Unification'}</h2><p className="text-sm text-sadu-sand/70 leading-relaxed max-w-sm">{isAr ? 'بوابة الدخول المؤسسية الموحدة. يرجى اختيار الصلاحية للوصول إلى مساحة العمل الآمنة.' : 'Secure institutional gateway. Select an authorized role before entering the workspace.'}</p></div>
          <div className="relative z-10 flex items-center gap-2 text-sadu-sage text-xs font-mono mt-12"><ShieldCheck className="w-4 h-4" /><span>ROLE-BOUND WORKSPACE ACTIVE</span></div>
        </div>
        <div className="p-10 bg-sadu-linen flex flex-col justify-center"><div className="mb-8"><h3 className="text-xl font-editorial font-bold text-sadu-charcoal mb-1">{isAr ? 'تسجيل الدخول' : 'Authenticate Identity'}</h3><p className="text-xs text-sadu-muted">{isAr ? 'حدد صفة الدخول للمتابعة' : 'Select your authorized operational role'}</p></div><div className="space-y-3 mb-8">{IDENTITY_OPTIONS.map(option => <button key={option.key} onClick={() => switchRole(option.key)} className={`w-full flex items-center justify-between p-3 rounded-lg border text-start transition-all ${currentRole === option.key ? 'bg-sadu-brick text-white border-sadu-brick shadow-md' : 'bg-white border-sadu-gold/50 text-sadu-charcoal hover:border-sadu-brick/50'}`}><div className="flex items-center gap-3"><User className={`w-4 h-4 ${currentRole === option.key ? 'text-white' : 'text-sadu-brick'}`} /><div><div className="text-sm font-bold">{isAr ? option.labelAr : option.labelEn}</div><div className={`text-[10px] uppercase tracking-wider font-mono mt-0.5 ${currentRole === option.key ? 'text-white/80' : 'text-sadu-muted'}`}>{isAr ? option.categoryAr : option.categoryEn}</div></div></div>{currentRole === option.key && <KeyRound className="w-4 h-4" />}</button>)}</div><button onClick={onSignIn} className="w-full py-3.5 bg-sadu-charcoal hover:bg-black text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg"><Lock className="w-4 h-4" /><span>{isAr ? `تسجيل دخول كـ ${activeProfile.nameAr}` : `Sign In as ${activeProfile.nameEn}`}</span></button></div>
      </div>
    </div>
  );
};

const AuthenticatedApp: React.FC<{ onSignOut: () => void }> = ({ onSignOut }) => <><RehearsalTeleprompter /><SADUApp onSignOut={onSignOut} /></>;

function SADUApp({ onSignOut }: { onSignOut: () => void }) {
  const { path } = useNavigation();
  const { lang, toggleLang, isAr } = useI18n();
  const { setLeadershipView } = useLivingRecord();
  const {
    currentRole,
    setCurrentRole,
    switchRole,
    selectedProgramme,
    setSelectedProgramme,
    density,
    toggleDensity,
    activeTab,
    setActiveTab,
    experienceMode,
    setExperienceMode,
  } = useWorkspace();
  
  const [showPresenterDrawer, setShowPresenterDrawer] = useState(false);
  const [showRoleOnboarding, setShowRoleOnboarding] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showNewContractModal, setShowNewContractModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Global Institutional Keyboard Shortcuts for Power Users
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K toggles Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        return;
      }

      // Alt/Option + key shortcuts
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        switch (key) {
          case 'a': // Jump to Archive
            e.preventDefault();
            setActiveTab('archive');
            break;
          case 'n': // New Contract Request
            e.preventDefault();
            setShowNewContractModal(true);
            break;
          case 'c': // Jump to Contracts
            e.preventDefault();
            setActiveTab('contracts');
            break;
          case 's': // Jump to Approved Scope
            e.preventDefault();
            setActiveTab('approved-scope');
            break;
          case 'd': // Jump to Curatorial Dossiers
            e.preventDefault();
            setActiveTab('dossiers');
            break;
          case 'o': // Jump to Specialist Operations
            e.preventDefault();
            setActiveTab('operations');
            break;
          case 'm': // Jump to Communications Gateway
            e.preventDefault();
            setActiveTab('communications');
            break;
          case 'l': // Toggle Institutional Language
            e.preventDefault();
            toggleLang();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [setActiveTab, toggleLang]);

  // Scroll listener for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSelectRoleAndExplore = (role: RoleKey) => {
    switchRole(role);
    // ALWAYS drop the user into the polished UI (12th Calligraphy Biennial)
    setSelectedProgramme(PROGRAMMES[0]);
    setLeadershipView('CHAIRMAN');
    setExperienceMode('platform');
    setShowRoleOnboarding(true);
  };

  const handleRoleChangeFromNav = (role: RoleKey) => {
    switchRole(role);
    setShowRoleOnboarding(true);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (path === '/join' || path === '/artist/register' || path === '/roster') {
    return <><DemoNotice/><RosterRegistration rosterView={path === '/roster'}/></>;
  }

  // If in Story Mode, render the full animated institutional presentation
  if (experienceMode === 'story') {
    return (
      <div className="story-experience">
        <DemoNotice />
        <StoryMode
          lang={lang}
          onSelectRoleAndExplore={handleSelectRoleAndExplore}
          onSelectManagementView={view => { handleSelectRoleAndExplore('DIRECTORATE'); setLeadershipView(view); }}
          onSkipToPlatform={() => handleSelectRoleAndExplore('DIRECTORATE')}
          onToggleLanguage={toggleLang}
        />
      </div>
    );
  }

  const roleProfile = ROLE_PROFILES[currentRole];
  const financeScopeLocked = isFinanceScenario(currentRole, activeTab);
  const selectLegacyProgramme = (programme: ExhibitionProgramme) => {
    if (!financeScopeLocked) setSelectedProgramme(programme);
  };

  if (selectedProgramme?.id === DEMO_PROGRAMME_ID) {
    return <><DemoNotice /><LivingRecordWorkspace /></>;
  }

  return (
    <>
      <DemoNotice />
      <AppShell
        onSignOut={onSignOut}
        currentRole={currentRole}
        selectedProgramme={selectedProgramme}
        lang={lang}
        density={density}
        activeTab={activeTab}
        showBackToTop={showBackToTop}
        onToggleLanguage={toggleLang}
        onToggleDensity={toggleDensity}
        onOpenStory={() => setExperienceMode('story')}
        onOpenSearch={() => setShowCommandPalette(true)}
        onOpenPresenter={() => setShowPresenterDrawer(true)}
        onOpenMobileMenu={() => setShowMobileMenu(true)}
        onRoleChange={handleRoleChangeFromNav}
        onProgrammeChange={selectLegacyProgramme}
        onNavigateTab={setActiveTab}
        onSelectRole={handleRoleChangeFromNav}
        onSetShowRoleOnboarding={setShowRoleOnboarding}
        onSetShowCommandPalette={setShowCommandPalette}
        onSetShowNewContractModal={setShowNewContractModal}
        onSetShowMobileMenu={setShowMobileMenu}
        onSetShowPresenterDrawer={setShowPresenterDrawer}
        onSetCurrentRole={setCurrentRole}
        onScrollToTop={scrollToTop}
        onSelectLegacyProgramme={selectLegacyProgramme}
        financeScopeLocked={financeScopeLocked}
        showRoleOnboarding={showRoleOnboarding}
        showCommandPalette={showCommandPalette}
        showNewContractModal={showNewContractModal}
        showMobileMenu={showMobileMenu}
        showPresenterDrawer={showPresenterDrawer}
      />
      <LegacyScenarioNotice />
    </>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  return (
    <I18nProvider initialLang="ar">
      <WorkspaceProvider initialRole="DIRECTORATE" initialExperienceMode="story">
        <LivingRecordProvider><ArtistIntakeProvider><IntakeDraftBackupProvider><NavigationProvider>{isAuthenticated ? <AuthenticatedApp onSignOut={() => setIsAuthenticated(false)} /> : <IdentityGate onSignIn={() => setIsAuthenticated(true)} />}</NavigationProvider></IntakeDraftBackupProvider></ArtistIntakeProvider></LivingRecordProvider>
      </WorkspaceProvider>
    </I18nProvider>
  );
}
