import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { CommitteeReviewSubmission, RoleKey, ExhibitionProgramme, WorkspaceTab, DisplayDensity, ExperienceMode } from '../types';
import { COMMITTEE_SUBMISSION, PROGRAMMES, ROLE_PROFILES } from '../data/mockData';
import { DEMO_PROGRAMME } from '../data/livingRecord';
import { writePreference } from '../utils/preferences';

import { recordEditorialCheck, type EditorialCheck } from '../data/editorialSamples';

interface WorkspaceContextType {
  activeDataPayload: CommitteeReviewSubmission;
  editorialChecks: Record<string, EditorialCheck>;
  checkEditorial: (id: string) => void;
  currentRole: RoleKey;
  setCurrentRole: (role: RoleKey) => void;
  switchRole: (role: RoleKey) => void;
  selectedProgramme: ExhibitionProgramme | undefined;
  setSelectedProgramme: (prog: ExhibitionProgramme | undefined) => void;
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
  navigateTab: (tab: WorkspaceTab) => void;
  density: DisplayDensity;
  toggleDensity: () => void;
  experienceMode: ExperienceMode;
  setExperienceMode: (mode: ExperienceMode) => void;
  isPresenterOpen: boolean;
  setIsPresenterOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export interface WorkspaceProviderProps {
  children: ReactNode;
  initialRole?: RoleKey;
  initialExperienceMode?: ExperienceMode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({
  children,
  initialRole = 'SDC_COORDINATOR',
  initialExperienceMode = 'story',
}) => {
  const [experienceMode, setExperienceModeState] = useState<ExperienceMode>(initialExperienceMode);
  const [currentRole, setCurrentRoleState] = useState<RoleKey>(initialRole);
  const [selectedProgramme, setProgrammeState] = useState<ExhibitionProgramme>(DEMO_PROGRAMME);
  const setSelectedProgramme = (programme: ExhibitionProgramme | undefined) => setProgrammeState(programme ?? PROGRAMMES[0]);
  const firstTab = (role: RoleKey) => ROLE_PROFILES[role].permittedViews[0] as WorkspaceTab;
  const [activeTab, setActiveTabState] = useState<WorkspaceTab>(() => firstTab(initialRole));
  const [density, setDensity] = useState<DisplayDensity>('comfortable');
  const [isPresenterOpen, setIsPresenterOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const activeDataPayload = useMemo(() => {
    const rawData: CommitteeReviewSubmission = structuredClone(COMMITTEE_SUBMISSION);
    if (currentRole === 'ARTIST') {
      rawData.committeeRubric = undefined;
      rawData.reviewerNotes = [];
      rawData.proposedBudgetUsd = 0;
      rawData.budgetBreakdown = undefined;
      rawData.conditionsEn = [];
      rawData.conditionsAr = [];
    }
    return rawData;
  }, [currentRole]);

  const [editorialChecks, setEditorialChecks] = useState<Record<string, EditorialCheck>>({});
  const checkEditorial = (id: string) => setEditorialChecks(previous => recordEditorialCheck(previous, selectedProgramme.id, id, currentRole, new Date().toISOString()));

  const switchRole = (role: RoleKey) => {
    setCurrentRoleState(role);
    setActiveTabState(firstTab(role));
  };
  const setCurrentRole = switchRole;
  // Keep every navigation entry point consistent with the demo's visible tabs.
  // This is a UI guard, not authentication or server-side authorization.
  const setActiveTab = (tab: WorkspaceTab) => {
    if (ROLE_PROFILES[currentRole].permittedViews.includes(tab)) setActiveTabState(tab);
  };

  const navigateTab = (tab: WorkspaceTab) => setActiveTab(tab);
  const toggleDensity = () => setDensity(prev => prev === 'comfortable' ? 'compact' : 'comfortable');

  const setExperienceMode = (mode: ExperienceMode) => {
    writePreference('sadu_experience_mode', mode);
    setExperienceModeState(mode);
  };

  return (
    <WorkspaceContext.Provider value={{
      activeDataPayload,
      editorialChecks, checkEditorial, currentRole, setCurrentRole, switchRole, selectedProgramme, setSelectedProgramme,
      activeTab, setActiveTab, navigateTab, density, toggleDensity, experienceMode,
      setExperienceMode, isPresenterOpen, setIsPresenterOpen, isCommandPaletteOpen,
      setIsCommandPaletteOpen, isMobileNavOpen, setIsMobileNavOpen,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within a WorkspaceProvider');
  return context;
};
