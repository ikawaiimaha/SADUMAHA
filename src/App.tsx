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
import { WorkspaceNavBar } from './components/WorkspaceNavBar';

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
  Search
} from 'lucide-react';

function SADUApp() {
  const { lang, toggleLang, isAr } = useI18n();
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

  // If in Story Mode, render the full animated institutional presentation
  if (experienceMode === 'story') {
    return (
      <div className="story-experience">
        <DemoNotice />
        <StoryMode
          lang={lang}
          onSelectRoleAndExplore={handleSelectRoleAndExplore}
          onSkipToPlatform={() => setExperienceMode('platform')}
          onToggleLanguage={toggleLang}
        />
      </div>
    );
  }

  const roleProfile = ROLE_PROFILES[currentRole];

  return (
    <div className={`min-h-screen bg-sadu-cream text-sadu-charcoal flex flex-col font-sans selection:bg-sadu-brick selection:text-white ${density === 'compact' ? 'text-xs' : ''}`}>
      <DemoNotice />
      {/* Top Header Navigation */}
      <HeaderNav
        lang={lang}
        currentRole={currentRole}
        selectedProgramme={selectedProgramme}
        density={density}
        onRoleChange={handleRoleChangeFromNav}
        onProgrammeChange={setSelectedProgramme}
        onToggleLanguage={toggleLang}
        onToggleDensity={toggleDensity}
        onOpenStory={() => setExperienceMode('story')}
        onOpenPresenter={() => setShowPresenterDrawer(true)}
        onOpenSearch={() => setShowCommandPalette(true)}
        onOpenMobileMenu={() => setShowMobileMenu(true)}
        onNavigateTab={setActiveTab}
      />

      {/* Signature Authored Weave Band */}
      <AuthoredBand compact />

      {/* Workspace Navigation Bar with dynamic role desk & status indicators */}
      <WorkspaceNavBar
        onOpenMobileMenu={() => setShowMobileMenu(true)}
      />

      {/* High-Resolution Institutional Breadcrumb & Context Trail */}
      <InstitutionalBreadcrumb
        onOpenRoleOnboarding={() => setShowRoleOnboarding(true)}
        onOpenSearch={() => setShowCommandPalette(true)}
      />

      {/* Demonstration workspace; navigation guards are not production authorization. */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 transition-all duration-200">
        {/* Render Primary Role Workspace when on 'overview' tab */}
        {activeTab === 'overview' && (() => {
          switch (currentRole) {
            case 'COORDINATOR':
            case 'SDC_COORDINATOR':
              return <CoordinatorView />;
            case 'DIRECTORATE':
            case 'LEADERSHIP':
              return <DirectorateDashboard />;
            case 'COMMITTEE':
              return <CommitteeView />;
            case 'TECHNICAL_MUSEUM':
            case 'TECHNICAL':
            case 'VENUE_ADMIN':
            case 'SAF_TECHNICIAN':
            case 'SMA_VENUE_ADMIN':
              return <TechnicalMuseumDashboard />;
            case 'PR_PROTOCOL':
            case 'PR_VISA':
              return <PrProtocolDashboard />;
            case 'EDITORIAL':
              return <EditorialDashboard />;
            case 'FINANCE':
              return <FinanceDashboard />;
            case 'LOGISTICS':
              return <LogisticsDashboard />;
            case 'ARTIST':
              return <ArtistView />;
            case 'ARCHIVE':
              return <ArchiveView />;
            default:
              return <CoordinatorView />;
          }
        })()}

        {/* Tab-Specific Secondary Routes with Role-Aware Context */}
        {activeTab === 'dossiers' && <CommitteeView />}
        {activeTab === 'approved-scope' && <ScopeContractsView />}
        {activeTab === 'contracts' && (
          currentRole === 'FINANCE' ? <FinanceDashboard /> : <ScopeContractsView />
        )}
        {activeTab === 'operations' && (() => {
          switch (currentRole) {
            case 'TECHNICAL_MUSEUM':
            case 'TECHNICAL':
            case 'VENUE_ADMIN':
            case 'SAF_TECHNICIAN':
            case 'SMA_VENUE_ADMIN':
              return <TechnicalMuseumDashboard />;
            case 'PR_PROTOCOL':
            case 'PR_VISA':
              return <PrProtocolDashboard />;
            case 'EDITORIAL':
              return <EditorialDashboard />;
            case 'FINANCE':
              return <FinanceDashboard />;
            case 'LOGISTICS':
              return <LogisticsDashboard />;
            default:
              return <OperationsView />;
          }
        })()}
        {activeTab === 'communications' && (
          currentRole === 'LOGISTICS' ? <LogisticsDashboard /> : <CommunicationView />
        )}
        {activeTab === 'archive' && <ArchiveView />}
      </main>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 rtl:right-auto rtl:left-6 z-30 p-2.5 bg-sadu-brick text-white rounded-full shadow-lg hover:bg-sadu-brick-dark transition-all cursor-pointer animate-in fade-in"
          title={isAr ? 'العودة إلى أعلى الصفحة' : 'Back to top'}
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      {/* Global Command Palette Dialog (⌘K) */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        lang={lang}
        currentRole={currentRole}
        selectedProgramme={selectedProgramme}
        onNavigateTab={setActiveTab}
        onSelectRole={handleRoleChangeFromNav}
        onSelectProgramme={setSelectedProgramme}
        onOpenStory={() => setExperienceMode('story')}
        onOpenPresenter={() => setShowPresenterDrawer(true)}
        onToggleLanguage={toggleLang}
        onToggleDensity={toggleDensity}
        onOpenNewContract={() => setShowNewContractModal(true)}
      />

      {/* New Bilateral Contract Request Modal (⌥N) */}
      <NewContractModal
        isOpen={showNewContractModal}
        onClose={() => setShowNewContractModal(false)}
        lang={lang}
        selectedProgramme={selectedProgramme}
        onNavigateTab={setActiveTab}
      />

      {/* Mobile Responsive Navigation Drawer */}
      <MobileNavDrawer
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        lang={lang}
        currentRole={currentRole}
        selectedProgramme={selectedProgramme}
        activeTab={activeTab}
        onNavigateTab={setActiveTab}
        onSelectRole={handleRoleChangeFromNav}
        onSelectProgramme={setSelectedProgramme}
        onOpenSearch={() => setShowCommandPalette(true)}
        onOpenStory={() => setExperienceMode('story')}
        onOpenPresenter={() => setShowPresenterDrawer(true)}
        onToggleLanguage={toggleLang}
        onToggleDensity={toggleDensity}
      />

      {/* Role Onboarding Modal */}
      {showRoleOnboarding && (
        <RoleOnboarding
          role={currentRole}
          lang={lang}
          onDismiss={() => setShowRoleOnboarding(false)}
          onSelectAnotherRole={setCurrentRole}
        />
      )}

      {/* Presenter Architectural Companion Drawer */}
      <PresenterDrawer
        isOpen={showPresenterDrawer}
        onClose={() => setShowPresenterDrawer(false)}
        lang={lang}
      />

      {/* Sovereign Institutional Footer */}
      <footer className="border-t border-sadu-gold bg-sadu-linen mt-12 py-5 px-4 sm:px-6 text-xs text-sadu-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left rtl:sm:text-right">
          <div>
            <span className="font-editorial font-bold text-sadu-brick">
              {isAr ? 'سدو (SADU)' : 'SADU (System for Arts Data Unification)'}
            </span>
            <span className="mx-2">·</span>
            <span>
              {isAr
                ? 'نظام توحيد بيانات الفنون — ننسج السجلات الثقافية في نسيج مؤسسي واحد.'
                : 'Weaving cultural records into one institutional fabric.'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sadu-charcoal font-semibold">
              {isAr ? 'دائرة الثقافة — الشارقة' : 'Sharjah Department of Culture'}
            </span>
            <span>·</span>
            <span>2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider initialLang="ar">
      <WorkspaceProvider initialRole="COORDINATOR" initialExperienceMode="story">
        <SADUApp />
      </WorkspaceProvider>
    </I18nProvider>
  );
}
