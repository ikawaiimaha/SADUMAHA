import React, { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { HeaderNav } from '../HeaderNav';
import { AuthoredBand } from '../AuthoredBand';
import { InstitutionalBreadcrumb } from '../InstitutionalBreadcrumb';
import { WorkspaceNavBar } from '../WorkspaceNavBar';
import { CommandPalette } from '../CommandPalette';
import { NewContractModal } from '../NewContractModal';
import { MobileNavDrawer } from '../MobileNavDrawer';
import { RoleOnboarding } from '../RoleOnboarding';
import { PresenterDrawer } from '../PresenterDrawer';
import { WorkspaceRouter } from './WorkspaceRouter';

export interface AppShellProps {
  children?: ReactNode;
  currentRole: any;
  selectedProgramme: any;
  lang: any;
  density: any;
  activeTab: any;
  showBackToTop: boolean;
  onToggleLanguage: () => void;
  onToggleDensity: () => void;
  onOpenStory: () => void;
  onOpenSearch: () => void;
  onOpenPresenter: () => void;
  onOpenMobileMenu: () => void;
  onRoleChange: (role: any) => void;
  onProgrammeChange: (programme: any) => void;
  onNavigateTab: (tab: any) => void;
  onSelectRole: (role: any) => void;
  onSetShowRoleOnboarding: (value: boolean) => void;
  onSetShowCommandPalette: (value: boolean) => void;
  onSetShowNewContractModal: (value: boolean) => void;
  onSetShowMobileMenu: (value: boolean) => void;
  onSetShowPresenterDrawer: (value: boolean) => void;
  onSetCurrentRole: (role: any) => void;
  onScrollToTop: () => void;
  onSelectLegacyProgramme: (programme: any) => void;
  financeScopeLocked: boolean;
  showRoleOnboarding: boolean;
  showCommandPalette: boolean;
  showNewContractModal: boolean;
  showMobileMenu: boolean;
  showPresenterDrawer: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentRole,
  selectedProgramme,
  lang,
  density,
  activeTab,
  showBackToTop,
  onToggleLanguage,
  onToggleDensity,
  onOpenStory,
  onOpenSearch,
  onOpenPresenter,
  onOpenMobileMenu,
  onRoleChange,
  onProgrammeChange,
  onNavigateTab,
  onSelectRole,
  onSetShowRoleOnboarding,
  onSetShowCommandPalette,
  onSetShowNewContractModal,
  onSetShowMobileMenu,
  onSetShowPresenterDrawer,
  onSetCurrentRole,
  onScrollToTop,
  onSelectLegacyProgramme,
  financeScopeLocked,
  showRoleOnboarding,
  showCommandPalette,
  showNewContractModal,
  showMobileMenu,
  showPresenterDrawer,
}) => {
  const { isAr } = useI18n();

  return (
    <div className={`min-h-screen bg-sadu-cream text-sadu-charcoal flex flex-col font-sans selection:bg-sadu-brick selection:text-white ${density === 'compact' ? 'text-xs' : ''}`}>
      <HeaderNav
        lang={lang}
        currentRole={currentRole}
        selectedProgramme={selectedProgramme}
        density={density}
        onRoleChange={onRoleChange}
        onProgrammeChange={onProgrammeChange}
        onToggleLanguage={onToggleLanguage}
        onToggleDensity={onToggleDensity}
        onOpenStory={onOpenStory}
        onOpenPresenter={onOpenPresenter}
        onOpenSearch={onOpenSearch}
        onOpenMobileMenu={onOpenMobileMenu}
        onNavigateTab={onNavigateTab}
        scopeLocked={financeScopeLocked}
      />

      <AuthoredBand compact />
      <WorkspaceNavBar onOpenMobileMenu={onOpenMobileMenu} />
      <InstitutionalBreadcrumb
        scopeLocked={financeScopeLocked}
        onOpenRoleOnboarding={() => onSetShowRoleOnboarding(true)}
        onOpenSearch={onOpenSearch}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 transition-all duration-200">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${currentRole}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <WorkspaceRouter currentRole={currentRole} activeTab={activeTab} />
          </motion.div>
        </AnimatePresence>
      </main>

      {showBackToTop && (
        <button
          onClick={onScrollToTop}
          className="fixed bottom-6 end-6 z-30 p-2.5 bg-sadu-brick text-white rounded-full shadow-lg hover:bg-sadu-brick-dark transition-all cursor-pointer animate-in fade-in"
          title={isAr ? 'العودة إلى أعلى الصفحة' : 'Back to top'}
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => onSetShowCommandPalette(false)}
        lang={lang}
        currentRole={currentRole}
        selectedProgramme={selectedProgramme}
        onNavigateTab={onNavigateTab}
        onSelectRole={onSelectRole}
        onSelectProgramme={onSelectLegacyProgramme}
        scopeLocked={financeScopeLocked}
        onOpenStory={onOpenStory}
        onOpenPresenter={() => onSetShowPresenterDrawer(true)}
        onToggleLanguage={onToggleLanguage}
        onToggleDensity={onToggleDensity}
        onOpenNewContract={() => onSetShowNewContractModal(true)}
      />

      <NewContractModal
        isOpen={showNewContractModal}
        onClose={() => onSetShowNewContractModal(false)}
        lang={lang}
        selectedProgramme={selectedProgramme}
        onNavigateTab={onNavigateTab}
      />

      <MobileNavDrawer
        isOpen={showMobileMenu}
        onClose={() => onSetShowMobileMenu(false)}
        lang={lang}
        currentRole={currentRole}
        selectedProgramme={selectedProgramme}
        activeTab={activeTab}
        onNavigateTab={onNavigateTab}
        onSelectRole={onSelectRole}
        onSelectProgramme={onSelectLegacyProgramme}
        scopeLocked={financeScopeLocked}
        onOpenSearch={onOpenSearch}
        onOpenStory={onOpenStory}
        onOpenPresenter={() => onSetShowPresenterDrawer(true)}
        onToggleLanguage={onToggleLanguage}
        onToggleDensity={onToggleDensity}
      />

      {showRoleOnboarding && (
        <RoleOnboarding
          role={currentRole}
          lang={lang}
          onDismiss={() => onSetShowRoleOnboarding(false)}
          onSelectAnotherRole={onSetCurrentRole}
        />
      )}

      <PresenterDrawer
        isOpen={showPresenterDrawer}
        onClose={() => onSetShowPresenterDrawer(false)}
        lang={lang}
      />

      <footer className="border-t border-sadu-gold bg-sadu-linen mt-12 py-5 px-4 sm:px-6 text-xs text-sadu-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start">
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
};
