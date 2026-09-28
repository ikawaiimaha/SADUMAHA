import { CollectionCloseout } from './components/CollectionCloseout';
import { MissingDeliverables, FabricationLedger } from './components/DeliverableRouting';
import { damageHold } from './data/conditionReporting';
import { RegionalDelegation } from './components/RegionalDelegation';
import { delegateRegion, GENERAL_COORDINATOR_ID } from './data/regionalDelegation';
import { useSessionDraft } from './context/SessionDrafts';
import type { SpatialClaim } from './data/spatialClaims';
import { MasterDirectoryProvider, DirectoryRegistration } from './context/MasterDirectory';
import { MasterDirectory } from './components/MasterDirectory';
import { agreementPipelineReady } from './data/workflowEligibility';
import { clearCultural, culturalCleared } from './data/culturalDeclaration';
import { validCrate } from './data/installationOperations';
import { SharedSpatialLedger } from './components/SharedSpatialLedger';
import { InstallationIntervention } from './components/InstallationIntervention';
import { DossierTracking } from './components/DossierTracking';
import { ExecutiveContractSummary } from './components/ExecutiveContractSummary';
import { SupplierRegister, PackingRegister } from './components/OperationalRegisters';
import { supplierTransition, validPacking, type SupplierDelivery, type PackingEvidence } from './data/operationalRegisters';
import { requestScopeChange, reviewScopeChange, recordDossierDispatch } from './data/dossierLedger';
import { EscalationSubmission } from './components/EscalationSubmission';
import { programmeReferences } from './data/directoratePortfolio';
import { resolveEscalation, submitEscalation, ESCALATION_DEPARTMENTS } from './utils/chairmanOversight';
import type { EscalationRecord, PortfolioProgram } from './types/chairman';
import { assignedTo, COORDINATORS } from './data/participation2026';
import { HonoredGuestRoster } from './components/HonoredGuestRoster';
import { scrollWorkspaceToTop } from './utils/scrollWorkspaceToTop';
import { operationalHandoff } from './data/operationalHandoff';
import { SessionDraftProvider } from './context/SessionDrafts';
import { Gateway } from './components/Gateway';
import { PresentationHandoff } from './components/PresentationHandoff';
import { ASSIGNED_COORDINATOR, submitForVetting } from './data/vetting';
import LogisticsWorkspace from './components/LogisticsWorkspace';
import { WorkspaceNavigation, type WorkspaceHandoff } from './components/WorkspaceNavigation';
import { StoryMode } from './components/StoryMode';
import { useMockupText } from './i18n/useMockupText';
/**
 * ============================================================================
 * AI CONTEXT & ARCHITECTURE BRIEF (READ BEFORE EDITING)
 * ============================================================================
 * TARGET AI: Cursor / Copilot / Claude / Gemini
 * PROJECT: SADU (Sharjah Calligraphy Biennial Institutional Governance Portal)
 * CLIENT: Sharjah Department of Culture (Executive Leadership Demo)
 * 
 * INTENT: This App.tsx is currently a MOCKUP ROUTER designed for an in-person 
 * executive pitch to Biennial Director Mohammed Al Qaseer and Chairman H.E. Abdullah Al Owais.
 * 
 * ARCHITECTURAL RULES FOR AI:
 * 1. DO NOT implement `react-router-dom`. We are using a state-based component 
 *    switcher (`activeRole`) so the presenter can jump between institutional roles 
 *    instantly without reloading or typing URLs.
 * 2. DO NOT wire up the Supabase backend yet. Keep all state local to the components 
 *    to guarantee zero latency during the offline/tablet pitch.
 * 3. The "Executive Prototype Control Bar" at the top is intentional. It allows the 
 *    presenter to simulate the 7-stage chain of command by swapping the simulated JWT role.
 * 4. Design Language: 'Archival Heritage Pop' (Warm Ivory, Deep Ink, Oxide Red, RTL support).
 * ============================================================================
 */

import { validParticipationScope, SOLO_INVITATION_2026 } from './data/soloInvitation2026';
import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import RoleSelection, { AppRole } from './components/RoleSelection';
import CommitteeThemeWorkspace, { CommitteeThemeDraft, isThemeBatchComplete } from './components/CommitteeThemeWorkspace';
import ChairmanWorkspace, { ThemeItem } from './components/ChairmanWorkspace';
import HIPWorkspace, { TranslationStatus } from './components/HIPWorkspace';
import EditorialWorkspace, { ThemePolishStatus } from './components/EditorialWorkspace';
import DirectorWorkspace, { VETO_REASONS } from './components/DirectorWorkspace';
import ArtistNominationForm, { NominatedArtistDossier } from './components/ArtistNominationForm';
import { 
  CoordinatorContractWorkspace, 
  VettedArtist, 
  ContractFormState 
} from './components/CoordinatorContractWorkspace';
import ArtistPortalWorkspace from './components/ArtistPortalWorkspace';
import PRWorkspace from './components/PRWorkspace';
import FinanceWorkspace from './components/FinanceWorkspace';
import TechnicalWorkspace from './components/TechnicalWorkspace';
import { CommissionSummary } from './components/CommissionSummary';
import { COMMISSION, createCommission, commissionReducer } from './data/commissionScenario';
import { PresenterDrawer } from './components/PresenterDrawer';
import { I18nProvider, useI18n } from './context/I18nContext';
import { BilateralContract, DisbursementRecord, NegotiationRound } from './types/contractStage6';
import {
  RotateCcw,
  ShieldCheck,
  GitMerge,
  Globe,
  Clock,
  Users,
  User,
  FileText,
  Megaphone,
  CheckCircle2,
  Lock,
  Plus,
  Ban,
  FileCheck,
  AlertTriangle,
  Compass,
  Crown,
  Briefcase,
  PenTool,
  Eye,
  Landmark,
  Settings2,
} from 'lucide-react';

export type InstitutionalRole = 
  | 'LOGISTICS'
  | 'LANDING'
  | 'CHAIRMAN' 
  | 'BIENNIAL_DIRECTOR' 
  | 'PREP_COMMITTEE' 
  | 'EDITORIAL' 
  | 'HIP' 
  | 'COORDINATOR' 
  | 'ARTIST' 
  | 'PR_PROTOCOL' 
  | 'FINANCE'
  | 'TECHNICAL'
  | 'ROLES';

const ROLE_NAME_MAP: Record<AppRole, InstitutionalRole> = {
  'Chairman': 'CHAIRMAN',
  'Biennial Director': 'BIENNIAL_DIRECTOR',
  'Preparatory Committee': 'PREP_COMMITTEE',
  'Editorial': 'EDITORIAL',
  'HIP': 'HIP',
  'Coordinator': 'COORDINATOR',
  'Artist': 'ARTIST',
  'PR': 'PR_PROTOCOL',
  'Finance': 'FINANCE',
  'Technical': 'TECHNICAL',
};


const EVENT_ID = '123e4567-e89b-12d3-a456-426614174000';

const INITIAL_NOMINATIONS: NominatedArtistDossier[] = [{
  id: COMMISSION.id, artistName: COMMISSION.artistName, artistCategory: 'Emerging', assignedCoordinatorId: ASSIGNED_COORDINATOR, participationTrack: 'GENERAL_COMPETITION', artworkCount: 1, approvalRevision: 1,
  nationality: 'United Arab Emirates', medium: 'Architectural Bronze & Black Oxide',
  proposedWorkTitle: COMMISSION.title, cvFileName: 'fictional-noura-cv.pdf',
  previousWorksCount: 1, mockupCount: 1, submittedBy: 'Preparatory Committee',
  submittedAt: '2026-09-26T09:00:00Z', status: 'APPROVED',
  culturalDeclaration: { containsText: false, explanation: '' }, culturalClearedAt: '2026-09-26T08:00:00Z',
}];
const INITIAL_VETTED_ARTISTS: VettedArtist[] = [{
  id: COMMISSION.id, name_ar: COMMISSION.artistNameAr, name_en: COMMISSION.artistName,
  nationality: 'United Arab Emirates', medium: 'Architectural Bronze & Black Oxide — 84 kg',
  category: 'EMERGING', status: 'DIRECTOR_APPROVED',
}];

function SADUApp() {
  const [regionalClaims] = useSessionDraft<SpatialClaim[]>('spatial-claims:biennial-2026', []);
  const [delegationNotice, setDelegationNotice] = useState('');
  const tr = useMockupText();
  const { lang, toggleLang, isAr } = useI18n();
  const isRtl = isAr || lang === 'ar';
  const [isPresenterDrawerOpen, setIsPresenterDrawerOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Press 'Ctrl + Shift + P' (or Cmd + Shift + P on Mac) to toggle Presenter Mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPresenterDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Executive Prototype State-Based Switcher (offline/tablet zero-latency pitch mode)
  const [isIsolatedRehearsalMode, setIsolatedRehearsalMode] = useState(false);
  const [activeRole, setRole] = useState<InstitutionalRole>('LANDING');
  const [showStory, setShowStory] = useState(false);
  const [autoForward, setAutoForward] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{ role: InstitutionalRole; id: number } | null>(null);
  const setActiveRole = useCallback((role: InstitutionalRole) => {
    setPendingNavigation(null);
    setShowStory(false);
    setRole(role);
  }, []);
  const continueNavigation = useCallback(() => {
    if (pendingNavigation) setActiveRole(pendingNavigation.role);
  }, [pendingNavigation, setActiveRole]);
  const workspaceScrollRef = useRef<HTMLElement>(null);
  useEffect(() => {
    scrollWorkspaceToTop();
    workspaceScrollRef.current?.focus({ preventScroll: true });
  }, [activeRole]);

  const [submittedThemes, setSubmittedThemes] = useState<CommitteeThemeDraft[] | undefined>(undefined);
  const [directorThemes, setDirectorThemes] = useState<CommitteeThemeDraft[]>([]);
  const [chairmanDocketRevision, setChairmanDocketRevision] = useState(0);
  const [executiveEscalations, setExecutiveEscalations] = useState<EscalationRecord[]>([]);
  const [assignedBudget, setAssignedBudget] = useState<number | null>(null);
  const [ratifiedTheme, setRatifiedTheme] = useState<ThemeItem | null>(null);

  // Stage 1 & 2: Theme Ratification & Editorial Polish State
  const [themePolishStatus, setThemePolishStatus] = useState<ThemePolishStatus>('PENDING_CHAIRMAN_APPROVAL');
  const [arabicLocked, setArabicLocked] = useState(false);
  const [themeEssayArabic, setThemeEssayArabic] = useState<string>('');
  const [themeEssayEnglish, setThemeEssayEnglish] = useState<string>('');

  // Stage 2: HIP & Translation Directives State
  const [guidelinesArabic, setGuidelinesArabic] = useState<string>(
    'دليل المعرض التوجيهي لبينالي الشارقة للخط: التأكيد على الحوار الجمالي الرصين بين النسب الفاضلة للخط العربي الأصيل والتجليات المعمارية المعاصرة. يتوجب على كافة الفنانين المرشحين تقديم أعمال تستند إلى أصالة السطر الكوفي والثلث مع استكشاف أبعاد الوسائط الحديثة والفراغية.'
  );
  const [guidelinesEnglish, setGuidelinesEnglish] = useState<string>(
    'Exhibition Curatorial Guidelines: Emphasize the aesthetic dialogue between the sacred proportions of classical calligraphy and contemporary architectural manifestations. All nominated artists must ground their proposals in classical scripts while exploring modern spatial media.'
  );
  const [translationStatus, setTranslationStatus] = useState<TranslationStatus>('DRAFT');
  const [hipSubmissionTime, setHipSubmissionTime] = useState<string | null>(null);
  const [curatorialBrief, setCuratorialBrief] = useState<string>(
    'Sharjah Calligraphy Biennial Curatorial Directive: Emphasize the dialogue between classical proportion and avant-garde architectural manifestation. All nominated artists must balance aesthetic script lineage with rigorous spatial experimentation.'
  );
  const [restrictionProposal, setRestrictionProposal] = useState<{tags: string[]; reason: string} | null>(null);
  const [restrictionAudit, setRestrictionAudit] = useState<string[]>([]);
  const [activeCoordinatorId, setActiveCoordinatorId] = useState<string>(ASSIGNED_COORDINATOR);
  const [blocklist, setBlocklist] = useState<string[]>([
    'Restricted Nationality: Country X',
    'Hazardous Medium: Open Flame',
  ]);

  // Stage 3 & 4: Nominated Artists Pool
  const [dossierNotice,setDossierNotice] = useState('');
  const [supplierDeliveries,setSupplierDeliveries] = useState<SupplierDelivery[]>([]);
  const [packingEvidence,setPackingEvidence] = useState<PackingEvidence>();
  const [nominatedArtists, setNominatedArtists] = useState<NominatedArtistDossier[]>(INITIAL_NOMINATIONS);
  const commissionCoordinatorId = nominatedArtists.find(d=>d.id===COMMISSION.id)?.assignedCoordinatorId;
  const [artists, setArtists] = useState<VettedArtist[]>(INITIAL_VETTED_ARTISTS);
  const [isNominationFormOpen, setIsNominationFormOpen] = useState<boolean>(false);

  const handleSubmitCommitteeThemes = (themes: CommitteeThemeDraft[]) => {
    if (ratifiedTheme || !isThemeBatchComplete(themes)) return;
    setDirectorThemes(themes);
    setSubmittedThemes(undefined);
  };

  const handleReturnToCommittee = () => {
    if (activeRole !== 'BIENNIAL_DIRECTOR' || ratifiedTheme) return;
    setDirectorThemes([]);
    setSubmittedThemes(undefined);
    setIsNominationFormOpen(false);
    setActiveRole('PREP_COMMITTEE');
  };

  const handlePresentToChairman = (themes: CommitteeThemeDraft[]) => {
    if (activeRole !== 'BIENNIAL_DIRECTOR' || ratifiedTheme || submittedThemes || !isThemeBatchComplete(themes)) return;
    setChairmanDocketRevision(revision => revision + 1);
    setSubmittedThemes(themes);
  };

  const handleBudgetAssigned = (amount: number, theme: ThemeItem) => {
    if (activeRole !== 'CHAIRMAN' || ratifiedTheme || !submittedThemes || !isThemeBatchComplete(submittedThemes) || !submittedThemes.some(candidate => candidate.arabicName === theme.arabicName && candidate.curatorialJustification === theme.curatorialJustification) || !Number.isFinite(amount) || amount <= 0) return;
    setAssignedBudget(amount);
    // Preserve the complete executive record, including both sets of notes.
    setRatifiedTheme({ ...theme });
    setArabicLocked(false);
    setThemeEssayArabic('');
    setThemeEssayEnglish('');
    setThemePolishStatus('PENDING_EDITORIAL_POLISH');
  };

  const handlePublishOfficialTheme = ({
    themeEssayArabic: essayAr,
    themeEssayEnglish: essayEn,
    approvedTheme,
  }: {
    themeEssayArabic: string;
    themeEssayEnglish: string;
    approvedTheme: any;
  }) => {
    if (activeRole !== 'EDITORIAL' || !arabicLocked || themePolishStatus !== 'PENDING_EDITORIAL_POLISH' || essayAr !== themeEssayArabic || !essayEn.trim()) return;
    setThemeEssayArabic(essayAr);
    setThemeEssayEnglish(essayEn);
    setRatifiedTheme(approvedTheme);
    setThemePolishStatus('PUBLISHED_OFFICIAL');
  };

  const handleSubmitToEditorial = (arabicText: string) => {
    if (activeRole !== 'HIP' || themePolishStatus !== 'PUBLISHED_OFFICIAL' || !['DRAFT', 'REQUEST_REVISION'].includes(translationStatus) || !arabicText.trim()) return;
    setGuidelinesArabic(arabicText.trim());
    setGuidelinesEnglish('');
    setTranslationStatus('PENDING_TRANSLATION');
    setHipSubmissionTime(new Date().toLocaleTimeString('ar-AE'));
  };

  const handlePublishBrief = (englishText: string, arabicSource: string) => {
    if (activeRole !== 'EDITORIAL' || themePolishStatus !== 'PUBLISHED_OFFICIAL'
      || translationStatus !== 'PENDING_TRANSLATION' || arabicSource !== guidelinesArabic || !englishText.trim()) return;
    setGuidelinesEnglish(englishText.trim());
    setTranslationStatus('PUBLISHED');
    setCuratorialBrief(
      `${englishText}\n\n[Arabic Original]: ${guidelinesArabic}`
    );
  };

  const handleNominateArtist = (dossier: NominatedArtistDossier) => {
    if (!['PREP_COMMITTEE', 'COORDINATOR'].includes(activeRole)) return;
    setNominatedArtists(prev => [{...dossier, culturalClearedAt: undefined, status: 'DRAFT', assignedCoordinatorId: activeRole === 'COORDINATOR' ? activeCoordinatorId : dossier.assignedCoordinatorId}, ...prev]);
    setIsNominationFormOpen(false);
  };

  const handleVetoArtist = (id: string, reason: string, notes?: string) => {
    if (activeRole !== 'BIENNIAL_DIRECTOR' || !VETO_REASONS.includes(reason) || !nominatedArtists.some(a => a.id === id && a.status === 'PENDING_DIRECTOR_REVIEW')) return;
    setNominatedArtists(prev =>
      prev.map(artist =>
        artist.id === id
          ? {
              ...artist,
              status: 'VETOED',
              decisionAt: new Date().toISOString(),
              vetoReason: reason,
              vetoNotes: notes,
            }
          : artist
      )
    );

    setArtists(prev =>
      prev.map(artist =>
        artist.id === id
          ? { ...artist, status: 'DIRECTOR_VETOED' }
          : artist
      )
    );
  };

  const handleApproveArtist = (id: string) => {
    if (!nominatedArtists.some(d => d.id === id && culturalCleared(d))) return;
    if (activeRole !== 'BIENNIAL_DIRECTOR' || !nominatedArtists.some(a => a.id === id && a.status === 'PENDING_DIRECTOR_REVIEW')) return;
    setNominatedArtists(prev =>
      prev.map(artist => (artist.id === id ? { ...artist, status: 'APPROVED', approvalRevision: 1, decisionAt: new Date().toISOString() } : artist))
    );

    const target = nominatedArtists.find(a => a.id === id);
    if (target && target.participationTrack !== 'HONORED_GUEST') {
      setArtists(prev => {
        if (prev.some(a => a.id === id)) {
          return prev.map(a => (a.id === id ? { ...a, status: 'DIRECTOR_APPROVED' } : a));
        }
        return [
          ...prev,
          {
            id: target.id,
            name_ar: target.artistName,
            name_en: target.artistName,
            assignedCoordinatorId: target.assignedCoordinatorId,
            nationality: target.nationality,
            medium: target.medium,
            category: (target.artistCategory.toUpperCase() === 'EMERGING' ? 'EMERGING' : 'ESTABLISHED'),
            status: 'DIRECTOR_APPROVED',
          },
        ];
      });
    }


  };

  // Stage 6: Bilateral Contracts & Disbursements State
  const [commission, dispatchCommission] = useReducer(commissionReducer, undefined, createCommission);
  const contracts = commission.contracts;
  useEffect(() => {
    if (commission.installationStatus) setArtists(rows => rows.map(a => a.id === COMMISSION.id ? {...a, status: commission.installationStatus!} : a));
  }, [commission.installationStatus]);
  const setContracts = (update: (previous: BilateralContract[]) => BilateralContract[]) =>
    dispatchCommission({ type: 'contracts', update });

  // Clearance mirrors the reducer's recorded evidence, including revocation on revised terms.
  useEffect(() => {
    setArtists(current => current.map(artist => artist.id === COMMISSION.id
      ? { ...artist, prCleared: commission.evidence.prEvidenceGate, technicalCleared: commission.evidence.technicalEvidenceGate }
      : artist));
  }, [commission.evidence.prEvidenceGate, commission.evidence.technicalEvidenceGate]);

  const handleClearPR = (artistId: string) => {
    if (artistId !== COMMISSION.id || activeRole !== 'PR_PROTOCOL') return;
    const action = { type: 'record-pr', actor: activeRole, at: new Date().toISOString() } as const;
    if (!commissionReducer(commission, action).evidence.prEvidenceGate) return;
    dispatchCommission(action);
    setArtists(current => current.map(artist => artist.id === artistId ? { ...artist, prCleared: true } : artist));
  };

  const handleClearTechnical = (artistId: string) => {
    if (artistId !== COMMISSION.id || activeRole !== 'TECHNICAL') return;
    const action = { type: 'record-technical', actor: activeRole, at: new Date().toISOString() } as const;
    if (!commissionReducer(commission, action).evidence.technicalEvidenceGate) return;
    dispatchCommission(action);
    setArtists(current => current.map(artist => artist.id === artistId ? { ...artist, technicalCleared: true } : artist));
  };

  const handleDispatchContract = (
    artistId: string,
    contractTerms: any,
    shippingTermsArg?: string,
    resolutionNotes?: string
  ) => {
    if (!agreementPipelineReady(themePolishStatus, translationStatus, isIsolatedRehearsalMode)) return;
    const terms = contractTerms as ContractFormState;
    if (!['ARTIST','DEPARTMENT'].includes(terms.shippingLiability ?? '') || !validCrate(terms.crate) || commission.installationStatus === 'EXECUTIVE_IMPOUND') return;
    const approvedDossier = nominatedArtists.find(d => d.id === artistId);
    if (!approvedDossier || approvedDossier.status !== 'APPROVED' || approvedDossier.assignedCoordinatorId !== activeCoordinatorId || approvedDossier.amendments?.some(a => a.status === 'PENDING') || approvedDossier.artworkCount !== terms.artworkCount) return;
    if (artistId !== COMMISSION.id || activeRole !== 'COORDINATOR' || activeCoordinatorId !== commissionCoordinatorId) return;
    if (!validParticipationScope(terms) || terms.participationCategory !== 'SINGLE_WORK') return;
    if (!['DEPARTMENT', 'HOUSE_OF_WISDOM', 'SHARJAH_ART_MUSEUM'].includes(terms.venue) || (terms.venue !== 'DEPARTMENT' && !terms.venueClearanceReference?.trim()) || commission.ledger?.length) return;
    const percentages = [terms.advancePercentage, terms.interimPercentage, terms.finalPercentage];
    if (!Number.isFinite(terms.productionGrant) || terms.productionGrant <= 0
      || percentages.some(value => !Number.isFinite(value) || value <= 0 || value > 100)
      || Math.abs(percentages.reduce((a, b) => a + b, 0) - 100) > 0.000001) return;
    // 1. Update the global artist list to change the status
    setArtists(prevArtists =>
      prevArtists.map(artist =>
        artist.id === artistId || `contract-${artist.id}` === artistId
          ? { ...artist, status: 'CONTRACT_PENDING_SIGNATURE' }
          : artist
      )
    );

    // 2. Push the new contract terms into the global contracts array
    const cleanArtistId = artistId.startsWith('contract-') ? artistId.replace('contract-', '') : artistId;
    const targetArtist =
      artists.find(a => a.id === cleanArtistId || a.id === artistId) ||
      nominatedArtists.find(a => a.id === cleanArtistId || a.id === artistId);

    const isObjectTerms = typeof contractTerms === 'object' && contractTerms !== null;
    const productionCost = isObjectTerms
      ? (contractTerms.productionGrant ?? contractTerms.productionCost ?? 45000)
      : (typeof contractTerms === 'number' ? contractTerms : 45000);
    const advancePct = isObjectTerms ? (contractTerms.advancePercentage ?? 40) : 30;
    const interimPct = isObjectTerms ? (contractTerms.interimPercentage ?? 30) : 40;
    const finalPct = isObjectTerms ? (contractTerms.finalPercentage ?? 30) : 30;
    const shippingMethod = isObjectTerms
      ? (contractTerms.shippingMethod || 'Fine Art Dedicated Freight (Climate Controlled)')
      : (shippingTermsArg || 'Fine Art Dedicated Freight (Climate Controlled)');

    const advanceAmount = Math.round(productionCost * advancePct) / 100;
    const deliveryAmount = Math.round(productionCost * interimPct) / 100;
    const installationAmount = Math.round((productionCost - advanceAmount - deliveryAmount) * 100) / 100;

    setContracts(prevContracts => {
      const existing = prevContracts.find(
        c => c.artistId === cleanArtistId || c.id === artistId || c.id === `contract-${cleanArtistId}`
      );

      const contractId = existing?.id || (artistId.startsWith('contract-') ? artistId : `contract-${artistId}`);

      const newContractRecord: any = {
        id: contractId,
        artistId: cleanArtistId,
        artistName: (targetArtist as any)?.name_en || (targetArtist as any)?.artistName || 'Artist',
        artistCategory:
          ((targetArtist as any)?.category === 'ESTABLISHED' || (targetArtist as any)?.artistCategory === 'Established')
            ? 'Established'
            : 'Emerging',
        nationality: approvedDossier.nationality,
        medium: approvedDossier.medium,
        proposedWorkTitle: approvedDossier.proposedWorkTitle,
        themeArabic: themePolishStatus === 'PUBLISHED_OFFICIAL' ? ratifiedTheme?.arabicName : undefined,
        productionCost,
        shippingLiability: terms.shippingLiability,
        shippingTerms: shippingMethod,
        specialConditions: terms.specialConditions,
        crate: terms.crate,
        participationCategory: terms.participationCategory,
        artworkCount: terms.artworkCount,
        invitationSourceId: terms.participationCategory === 'SOLO_EXHIBITION' ? SOLO_INVITATION_2026.sourceId : undefined,
        venue: terms.venue,
        venueClearanceReference: terms.venueClearanceReference,
        cancellationClauseMandatory: true,
        status: 'SENT_TO_ARTIST',
        draftedAt: existing?.draftedAt || new Date().toISOString(),
        sentAt: new Date().toISOString(),
        tranches: {
          advancePercentage: advancePct,
          advanceAmount,
          advanceStatus: existing?.tranches?.advanceStatus || 'PENDING',
          advanceDisbursedAt: existing?.tranches?.advanceDisbursedAt,
          advanceVoucherRef: existing?.tranches?.advanceVoucherRef,
          deliveryPercentage: interimPct,
          deliveryAmount,
          deliveryStatus: existing?.tranches?.deliveryStatus || 'PENDING',
          deliveryDisbursedAt: existing?.tranches?.deliveryDisbursedAt,
          deliveryVoucherRef: existing?.tranches?.deliveryVoucherRef,
          installationPercentage: finalPct,
          installationAmount,
          installationStatus: existing?.tranches?.installationStatus || 'PENDING',
          installationDisbursedAt: existing?.tranches?.installationDisbursedAt,
          installationVoucherRef: existing?.tranches?.installationVoucherRef,
        },
        documents: existing?.documents || {
          passportStatus: 'NOT_UPLOADED',
          artworkDpi: 300,
          highResStatus: 'NOT_UPLOADED',
          catalogBioStatus: 'DRAFT',
        },
        auditTrail: existing?.auditTrail || [],
        terms: contractTerms,
        createdAt: new Date().toISOString(),
      };

      if (existing) {
        return prevContracts.map(c => (c.id === existing.id ? newContractRecord : c));
      } else {
        return [...prevContracts, newContractRecord];
      }
    });
  };
  const handleSignContract = (contractId?: string, signerName?: string) => {
    const target = contracts.find(c => c.id === contractId);
    if (activeRole !== 'ARTIST' || !target || target.status !== 'SENT_TO_ARTIST' || signerName !== target.artistName) return;
    setArtists(previous => previous.map(artist => artist.id === target.artistId ? { ...artist, status: 'CONTRACT_EXECUTED' } : artist));
    setContracts(prev =>
      prev.map(c =>
        c.id === contractId
          ? {
              ...c,
              status: 'ARTIST_APPROVED',
              signedAt: new Date().toISOString().split('T')[0],
              signatureReference: `REF-SCB-EXEC-${Math.floor(1000 + Math.random() * 9000)}`,
            }
          : c
      )
    );
  };

  const handleRequestAmendment = (
    contractId: string,
    category: NegotiationRound['disputedCategory'],
    justification: string,
    proposedGrant?: number
  ) => {
    const target = contracts.find(c => c.id === contractId);
    if (activeRole !== 'ARTIST' || !target || target.status !== 'SENT_TO_ARTIST' || !justification.trim() || commission.ledger?.length) return;
    setArtists(rows => rows.map(row => row.id === target.artistId ? {...row, status: 'DIRECTOR_APPROVED'} : row));
    dispatchCommission({ type: 'CONTRACT_DISPUTED', actor: activeRole, contractId,
      round: { id: `neg-${Date.now()}`, contractId, requestedAt: new Date().toISOString(),
        disputedCategory: category, artistJustification: justification, justification,
        proposedValue: proposedGrant, proposedGrant, status: 'PENDING_COORDINATOR_REVIEW' } });
  };

  const handleStartReviewAmendment = (contractId: string) => {
    setContracts(prev =>
      prev.map(c =>
        c.id === contractId && c.status === 'CONTRACT_DISPUTED'
          ? { ...c, status: 'AMENDMENT_UNDER_REVIEW' }
          : c
      )
    );
  };

  const handleUploadPassport = (contractId: string, fileName: string) => {
    setContracts(prev =>
      prev.map(c =>
        c.id === contractId
          ? {
              ...c,
              documents: {
                ...c.documents,
                passportFileName: fileName,
                passportStatus: 'SUBMITTED',
                passportUploadedAt: new Date().toISOString(),
              },
            }
          : c
      )
    );
  };

  const handleUploadHighResArtwork = (contractId: string, fileName: string, dpi: number) => {
    setContracts(prev =>
      prev.map(c =>
        c.id === contractId
          ? {
              ...c,
              documents: {
                ...c.documents,
                highResArtworkFileName: fileName,
                artworkDpi: dpi,
                highResStatus: 'SUBMITTED',
                highResUploadedAt: new Date().toISOString(),
                highResVerifiedAt: undefined,
                highResNotes: undefined,
              },
            }
          : c
      )
    );
  };

  const handleSaveBio = (contractId: string, bioAr: string, bioEn: string) => {
    setContracts(prev =>
      prev.map(c =>
        c.id === contractId
          ? {
              ...c,
              documents: {
                ...c.documents,
                catalogBioArabic: bioAr,
                catalogBioEnglish: bioEn,
                catalogBioStatus: 'SUBMITTED',
              },
            }
          : c
      )
    );
  };

  const handleAutoNavigate = (role: string) => {
    const target: InstitutionalRole | null = role === 'DIRECTOR' ? 'BIENNIAL_DIRECTOR'
      : role === 'CHAIRMAN' || role === 'EDITORIAL' || role === 'HIP' ? role : null;
    if (target) setPendingNavigation({ role: target, id: Date.now() });
    scrollWorkspaceToTop();
  };

  const renderWorkspace = () => {
    if(commission.installationStatus==='ARCHIVED_CLOSED'&&['ARTIST','PR_PROTOCOL','TECHNICAL','LOGISTICS','FINANCE'].includes(activeRole))return <><h1 className="ps-5 pe-5 py-5 text-xl">Archived artist dossier — read-only</h1><CollectionCloseout state={commission} actor={activeRole}/><section className="ps-5 pe-5 py-5"><h2>{commission.contracts[0]?.artistName} · {commission.contracts[0]?.proposedWorkTitle}</h2><p>Agreement revision {commission.agreementRevision}</p>{commission.ledger?.map(row=><p key={row.tranche}>{row.tranche} · AED {row.amount} · {row.at}</p>)}</section></>;

    switch (activeRole) {
      case 'CHAIRMAN':
        return (
          <ChairmanWorkspace
            oversight={{
              commission,
              programs: programmeReferences.map((p): PortfolioProgram => ({
                id: p.id, nameEn: p.activityEn, nameAr: p.activityAr,
                locationEn: p.contextEn, locationAr: p.contextAr,
                startDate: p.startDate, endDate: p.endDate,
                isLiveSessionProgram: p.id === 'REF-CALLIGRAPHY-12',
                sessionThemeArabic: p.id === 'REF-CALLIGRAPHY-12' ? ratifiedTheme?.arabicName : undefined,
                budgetCeilingAED: p.id === 'REF-CALLIGRAPHY-12' ? assignedBudget ?? undefined : undefined,
              })),
              escalations: executiveEscalations,
              onResolveEscalation: (id, disposition) => setExecutiveEscalations(rows => resolveEscalation(rows, id, disposition, activeRole, new Date().toISOString())),
            }}
            onAutoNavigate={handleAutoNavigate}
            eventId={EVENT_ID}
            docketRevision={chairmanDocketRevision}
            themes={submittedThemes}
            onThemeApproved={(theme, index) => {
              if (ratifiedTheme) return;
              setSubmittedThemes(current => current?.map((proposal, proposalIndex) =>
                proposalIndex === index ? { ...proposal, chairmanNotes: theme.chairmanNotes } : proposal));
            }}
            onBudgetAssigned={handleBudgetAssigned}
            themeStatus={themePolishStatus}
            initialApprovedTheme={ratifiedTheme}
            initialBudget={assignedBudget}
          />
        );

      case 'BIENNIAL_DIRECTOR':
        return (
          <DirectorWorkspace
            installationState={commission}
            onInstallationAction={action => { if (activeRole === 'BIENNIAL_DIRECTOR' && (action.type === 'impound' || action.type === 'review-plan-b' || action.type === 'acquire')) dispatchCommission({...action, actor: activeRole}); }}
            onAutoNavigate={handleAutoNavigate}
            restrictionProposal={restrictionProposal}
            onReviewRestrictions={approved => {
              if (activeRole !== 'BIENNIAL_DIRECTOR' || !restrictionProposal) return;
              if (approved) setBlocklist(restrictionProposal.tags);
              setRestrictionAudit(rows => [...rows, `${new Date().toISOString()} · Director · ${approved ? 'APPROVED' : 'REJECTED'} · ${restrictionProposal.reason} · ${restrictionProposal.tags.join(', ')}`]);
              setRestrictionProposal(null);
            }}
            isForwarded={Boolean(submittedThemes)}
            submittedThemes={submittedThemes ?? directorThemes}
            onReturnToCommittee={handleReturnToCommittee}
            onPresentToChairman={handlePresentToChairman}
            nominatedArtists={nominatedArtists.filter(d => !['DRAFT','REJECTED_COMPLIANCE'].includes(d.status))}
            onVetoArtist={handleVetoArtist}
            onApproveArtist={handleApproveArtist}
            assignedBudget={assignedBudget}
            ratifiedTheme={ratifiedTheme}
            curatorialBrief={curatorialBrief}
          />
        );

      case 'PREP_COMMITTEE':
        return (
          <div className="space-y-6 max-w-6xl mx-auto py-6 px-4 sm:px-6">
            <MasterDirectory isAr={isAr} />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNominationFormOpen(false)}
                className={`rounded px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  !isNominationFormOpen
                    ? 'bg-[#8B4513] text-white shadow-xs'
                    : 'bg-white border border-[#D9D2C5] text-[#2C2A29] hover:bg-stone-50'
                }`}
              > {isAr ? 'المرحلة 1 · مقترحات الثيمة' : 'Stage 1 · Theme proposals'} </button>
              <button
                type="button"
                onClick={() => setIsNominationFormOpen(true)}
                className={`rounded px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  isNominationFormOpen
                    ? 'bg-[#8B4513] text-white shadow-xs'
                    : 'bg-white border border-[#D9D2C5] text-[#2C2A29] hover:bg-stone-50'
                }`}
              > {isAr ? 'المرحلة 4 · ترشيح الفنانين' : 'Stage 4 · Artist nominations'} </button>
            </div>

            {isNominationFormOpen ? (
              <ArtistNominationForm
                curatorialBrief={curatorialBrief}
                blocklist={blocklist}
                onSubmitNomination={handleNominateArtist}
                submittedBy="Preparatory Committee"
                onCancel={() => setIsNominationFormOpen(false)}
              />
            ) : (
              <CommitteeThemeWorkspace
            onCancelAutoNavigate={() => setPendingNavigation(null)}
            onAutoNavigate={handleAutoNavigate}
                eventId={EVENT_ID}
                ratifiedTheme={ratifiedTheme}
                onPresentToChairman={handleSubmitCommitteeThemes}
                  />
            )}
          </div>
        );

      case 'EDITORIAL':
        return (
          <EditorialWorkspace
            arabicLocked={arabicLocked}
            onLockArabic={text => {
              if (activeRole !== 'EDITORIAL' || arabicLocked || !ratifiedTheme || themePolishStatus !== 'PENDING_EDITORIAL_POLISH' || text.trim().length <= 10) return;
              setThemeEssayArabic(text.trim());
              setArabicLocked(true);
            }}
            onAutoNavigate={handleAutoNavigate}
            approvedTheme={ratifiedTheme}
            themePolishStatus={themePolishStatus}
            guidelinesArabic={guidelinesArabic}
            guidelinesEnglish={guidelinesEnglish}
            guidelinesTranslationStatus={translationStatus}
            onPublishOfficialGuidelines={handlePublishBrief}
            onPublishOfficialTheme={handlePublishOfficialTheme}
            assignedBudget={assignedBudget}
            initialEssayArabic={themeEssayArabic}
            initialEssayEnglish={themeEssayEnglish}
          />
        );

      case 'HIP':
        return (
          <HIPWorkspace
            catalogState={commission}
            culturalDossiers={nominatedArtists.filter(d=>commission.installationStatus!=='ARCHIVED_CLOSED'||d.id!==COMMISSION.id)}
            onClearCultural={id => {if(id===COMMISSION.id&&commission.installationStatus==='ARCHIVED_CLOSED')return;setNominatedArtists(rows => rows.map(d => d.id === id ? clearCultural(d, activeRole, new Date().toISOString()) : d));}}
            themeEssayArabic={themeEssayArabic}
            themeEssayEnglish={themeEssayEnglish}
            guidelinesEnglish={guidelinesEnglish}
            themeStatus={themePolishStatus}
            guidelinesArabic={guidelinesArabic}
            translationStatus={translationStatus}
            hipSubmissionTime={hipSubmissionTime}
            onRequestRevision={() => {
              if (activeRole === 'HIP' && translationStatus === 'PUBLISHED') setTranslationStatus('REQUEST_REVISION');
            }}
            onSubmitToEditorial={handleSubmitToEditorial}
            curatorialBrief={curatorialBrief}

            blocklist={blocklist}
            restrictionPending={Boolean(restrictionProposal)}
            restrictionAudit={restrictionAudit}
            onUpdateBlocklist={(tags, reason) => {
              if (activeRole !== 'HIP' || !reason.trim() || restrictionProposal) return;
              setRestrictionProposal({ tags, reason: reason.trim() });
            }}
            ratifiedTheme={ratifiedTheme}
          />
        );

      case 'COORDINATOR':
        return (
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <section className="rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-5 space-y-3 text-start">
              <h2 className="text-xl font-semibold">{isAr ? 'المرحلة 4 · مكتب المنسق المكلّف' : 'Stage 4 · Assigned Coordinator desk'}</h2>
              <label className="block">{isAr ? 'اختيار المنسقة للمحاكاة — ليس تسجيل دخول' : 'Demo coordinator selection — not authentication'}
                <select className="mt-2 block rounded border ps-3 pe-3 py-2" value={activeCoordinatorId} onChange={e => {setActiveCoordinatorId(e.target.value);setDelegationNotice('');}}><option value={GENERAL_COORDINATOR_ID}>{isAr ? 'المنسق العام — محاكاة' : 'General Coordinator — rehearsal'}</option>{COORDINATORS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </label>
              {assignedTo(nominatedArtists,activeCoordinatorId).map(d=><section key={`deliverables:${d.id}`}><MissingDeliverables artistId={d.id} artistName={d.artistName} isAr={isAr}/>{d.status==='APPROVED'&&<details><summary className="cursor-pointer">{d.artistName} · {isAr?'أوامر التصنيع':'Fabrication orders'}</summary><FabricationLedger artistId={d.id} artistName={d.artistName} isAr={isAr} actor="COORDINATOR" blocked={d.id===COMMISSION.id&&(damageHold(commission)||commission.installationStatus==='EXECUTIVE_IMPOUND'||commission.installationStatus==='ARCHIVED_CLOSED')}/></details>}</section>)}
              <RegionalDelegation isAr={isAr} dossiers={activeCoordinatorId === GENERAL_COORDINATOR_ID ? nominatedArtists : assignedTo(nominatedArtists, activeCoordinatorId)} canDelegate={activeCoordinatorId === GENERAL_COORDINATOR_ID} notice={delegationNotice} lockedIds={[...contracts.map(c=>c.artistId),...regionalClaims.map(c=>c.artistId)]} onDelegate={(region,target)=>{
                if(activeRole !== 'COORDINATOR' || activeCoordinatorId !== GENERAL_COORDINATOR_ID)return;
                const input={actor:activeRole,coordinatorId:activeCoordinatorId,region,target,at:new Date().toISOString()};
                const locked=[...contracts.map(c=>c.artistId),...regionalClaims.map(c=>c.artistId)];
                const next=delegateRegion(nominatedArtists,input,locked);
                setDelegationNotice(next===nominatedArtists ? (isAr?'لم تتغير التكليفات؛ تحقق من القيود.':'No assignments changed; check the handoff constraints.') : (isAr?'تم تحديث التكليفات في قوائم المنسقات.':'Assignments updated in coordinator queues.'));
                setNominatedArtists(rows=>delegateRegion(rows,input,locked));
              }}/>
              <HonoredGuestRoster coordinatorId={activeCoordinatorId} isAr={isAr} />
              <SharedSpatialLedger key={activeCoordinatorId} coordinatorId={activeCoordinatorId} dossiers={nominatedArtists.filter(d=>commission.installationStatus!=='ARCHIVED_CLOSED'||d.id!==COMMISSION.id)} isAr={isAr} />
              {activeCoordinatorId !== GENERAL_COORDINATOR_ID && <details><summary className="cursor-pointer">{isAr ? 'إعداد ملف ترشيح' : 'Prepare nomination dossier'}</summary><ArtistNominationForm key={activeCoordinatorId} assignedCoordinatorId={activeCoordinatorId} submittedBy="Coordinator" onSubmitNomination={handleNominateArtist} /></details>}
              {assignedTo(nominatedArtists, activeCoordinatorId).filter(d => d.status === 'DRAFT' || d.status === 'REJECTED_COMPLIANCE').map(d => <article key={d.id} className="border-t border-[#D9CEBA] py-3"><h3 className="font-semibold">{d.artistName} · {d.proposedWorkTitle}</h3><p>{d.status} · {d.assignedCoordinatorId}</p><p>{d.complianceReason}</p>{!culturalCleared(d) && <p>{isAr ? 'بانتظار التحقق الثقافي من HIP' : 'Awaiting HIP cultural clearance'}</p>}
                <button disabled={d.status !== 'DRAFT' || d.assignedCoordinatorId !== activeCoordinatorId || !culturalCleared(d)} className="mt-2 rounded bg-[#8B261E] text-white ps-4 pe-4 py-2 disabled:opacity-50" onClick={() => {
                  const submitted = submitForVetting(d, activeRole, activeCoordinatorId, blocklist);
                  if (!submitted) return;
                  setNominatedArtists(rows => rows.map(row => row.id === d.id ? submitted : row));
                }}>{isAr ? 'إرسال للتدقيق' : 'Submit for Vetting'}</button>
              </article>)}
              {assignedTo(nominatedArtists, activeCoordinatorId).filter(d => d.status === 'VETOED').map(d => <p key={d.id} role="status">{d.artistName} · {d.vetoReason} · {d.vetoNotes} · {d.decisionAt}</p>)}
            </section>
            <p className="my-4 text-sm text-[#736357]">{isAr ? 'التعاقد والتنفيذ في هذه المحاكاة مخصصان لعمل أفق كوفي؛ ملفات الترشيح الأخرى مخصصة لعرض التدقيق والقرارات.' : 'Contracting and execution in this rehearsal use Kufic Horizon only; other nominations demonstrate vetting and executive decisions.'}</p>
            {/* Stage 6: Bilateral Contracting Workspace */}
            {activeRole === 'COORDINATOR' && activeCoordinatorId === commissionCoordinatorId && commission.installationStatus !== 'ARCHIVED_CLOSED' && (
              <>
              <InstallationIntervention key={commission.impounds?.slice(-1)[0]?.id ?? 'no-impound'} state={commission} isAr={isAr} actor="COORDINATOR" onRecord={action => { if (activeRole === 'COORDINATOR' && activeCoordinatorId === commissionCoordinatorId && action.type === 'acknowledge-alterations') dispatchCommission({...action,actor:activeRole}); }} />
              <label className="flex items-center gap-2 rounded border border-amber-300 bg-amber-50 ps-4 pe-4 py-3 text-start"><input type="checkbox" checked={isIsolatedRehearsalMode} onChange={e => setIsolatedRehearsalMode(e.target.checked)} />Isolated rehearsal — bypass theme and guidelines publication for component testing only</label>
              <CoordinatorContractWorkspace
                themeStatus={themePolishStatus}
                guidelinesStatus={translationStatus}
                isIsolatedRehearsalMode={isIsolatedRehearsalMode}
                isAr={isRtl}
                officialTheme={themePolishStatus === 'PUBLISHED_OFFICIAL' ? ratifiedTheme?.arabicName : undefined}
                artists={artists.filter(artist => artist.id === COMMISSION.id).map(artist => {
                  const dossier = nominatedArtists.find(d => d.id === artist.id);
                  return dossier ? {...artist, nationality:dossier.nationality, medium:dossier.medium, assignedCoordinatorId:dossier.assignedCoordinatorId} : artist;
                })}
                contracts={contracts}
                onDispatchContract={handleDispatchContract} 
              />
              </>
            )}
          </div>
        );

      case 'ARTIST':
        return (
          <ArtistPortalWorkspace
            onSubmitVisa={intake=>{if(activeRole==='ARTIST')dispatchCommission({type:'submit-visa',actor:activeRole,intake});}}
            onSubmitCatalog={action=>{if(activeRole==='ARTIST'&&(action.type==='submit-catalog'||action.type==='save-administration'||action.type==='collection-terms'||action.type==='upload-layout'||action.type==='request-domestic-pickup'))dispatchCommission({...action,actor:activeRole});}}
            conditionState={commission}
            profileArtistId={COMMISSION.id}
            contracts={contracts}
            artistArabicName={COMMISSION.artistNameAr}
            onSignContract={handleSignContract}
            onRequestAmendment={handleRequestAmendment}
            onUploadPassport={handleUploadPassport}
            onUploadHighResArtwork={handleUploadHighResArtwork}
            onSaveBio={handleSaveBio}
          />
        );

      case 'PR_PROTOCOL':
        return <PRWorkspace isAr={isAr} state={commission}
          onCheck={(field, value) => dispatchCommission({ type: 'pr-check', actor: activeRole, field, value })}
          onClearPR={handleClearPR} />;

      case 'TECHNICAL':
        return <><TechnicalWorkspace isAr={isAr} state={commission}
          onCheck={(field, value) => dispatchCommission({ type: 'technical-check', actor: activeRole, field, value })}
          onRequestSAF={(technicians, hours, rationale) => dispatchCommission({type: 'request-saf', actor: activeRole, technicians, hours, rationale, at: new Date().toISOString()})}
          onClearTechnical={handleClearTechnical} />{nominatedArtists.filter(d=>d.id!==COMMISSION.id&&d.status==='APPROVED').map(d=><FabricationLedger key={d.id} artistId={d.id} artistName={d.artistName} isAr={isAr} actor="TECHNICAL"/>)}</>;

      case 'LOGISTICS':
        return <><HonoredGuestRoster isAr={isAr} /><LogisticsWorkspace isAr={isAr} state={commission} onRecord={action => {
          if (activeRole === 'LOGISTICS') dispatchCommission({...action,actor:activeRole} as typeof action);
        }} /></>;
      case 'FINANCE':
        return <FinanceWorkspace isAr={isAr} state={commission} onEmergencyAction={action=>{if(activeRole==='FINANCE'&&(action.type==='review-plan-b'||action.type==='record-loan-payment'))dispatchCommission({...action,actor:activeRole});}}
          artist={artists.find(artist => artist.id === contracts[0]?.artistId)}
          onRecordTranche={tranche => dispatchCommission({type: 'record-tranche', actor: activeRole, tranche, at: new Date().toISOString()})}
          onAuthorizeAdvance={() => {
            const artist = artists.find(artist => artist.id === contracts[0]?.artistId);
            if (artist?.prCleared !== true || artist?.technicalCleared !== true) return;
            dispatchCommission({ type: 'authorize-advance', actor: activeRole, at: new Date().toISOString() });
          }} />;

      case 'ROLES':
      default:
        return (
          <div className="py-10 px-4 sm:px-6 lg:px-8">
            <RoleSelection
              onSelectRole={role => {
                const mapped = ROLE_NAME_MAP[role];
                if (mapped) setActiveRole(mapped);
              }}
            />
          </div>
        );
    }
  };

  // Presentation-only summary derived from the existing approval state.
  // Department switching never mutates or skips an approval gate.
  const executiveRoles: InstitutionalRole[] = ['PREP_COMMITTEE', 'BIENNIAL_DIRECTOR', 'CHAIRMAN', 'EDITORIAL', 'HIP'];
  let handoff: WorkspaceHandoff | undefined;
  if (executiveRoles.includes(activeRole)) {
    if (themePolishStatus === 'PUBLISHED_OFFICIAL' || themePolishStatus === 'PUBLISHED') {
      handoff = translationStatus === 'PENDING_TRANSLATION'
        ? { title: isAr ? 'ترجمة الدليل قيد الانتظار' : 'Guidelines awaiting translation', description: isAr ? 'المسؤول: قسم التحرير' : 'Owner: Editorial', owner: 'EDITORIAL' }
        : translationStatus === 'PUBLISHED'
          ? { title: isAr ? 'نُشرت الثيمة والدليل باللغتين' : 'Theme and bilingual guidelines published', description: isAr ? 'اكتملت مراحل الاعتماد والتحرير والتوجيهات' : 'Approval, editorial and guidelines complete' }
          : { title: isAr ? 'الثيمة منشورة · إعداد الدليل' : 'Theme published · draft guidelines', description: isAr ? 'المسؤول: منسق معرض عام' : 'Owner: HIP', owner: 'HIP' };
    } else if (ratifiedTheme) {
      handoff = { title: isAr ? 'الثيمة والميزانية معتمدتان' : 'Theme and budget ratified', description: isAr ? 'المسؤول: قسم التحرير · الصياغة والترجمة' : 'Owner: Editorial · refinement and translation', owner: 'EDITORIAL' };
    } else if (submittedThemes?.length === 3) {
      handoff = { title: isAr ? 'المقترحات بانتظار الاعتماد' : 'Proposals awaiting ratification', description: isAr ? 'المسؤول: رئيس الدائرة · الاختيار والميزانية' : 'Owner: Chairman · selection and budget', owner: 'CHAIRMAN' };
    } else if (directorThemes.length === 3) {
      handoff = { title: isAr ? 'المقترحات قيد المراجعة' : 'Proposals under review', description: isAr ? 'المسؤول: مدير الملتقى' : 'Owner: Biennial Director', owner: 'BIENNIAL_DIRECTOR' };
    } else {
      handoff = { title: isAr ? 'إعداد ثلاثة مقترحات للثيمة' : 'Prepare three theme proposals', description: isAr ? 'المسؤول: اللجنة التحضيرية' : 'Owner: Preparatory Committee', owner: 'PREP_COMMITTEE' };
    }
  }

  if (['COORDINATOR', 'ARTIST', 'PR_PROTOCOL', 'TECHNICAL', 'FINANCE', 'LOGISTICS'].includes(activeRole)) handoff = operationalHandoff(commission, isAr);

  if (activeRole === 'LANDING' && !showStory) return <Gateway isAr={isAr} onEnter={() => setActiveRole('PREP_COMMITTEE')} onStory={() => setShowStory(true)} onLanguage={toggleLang} />;
  if (activeRole === 'LANDING') {
    return <StoryMode showRosterLink={false} lang={lang} onToggleLanguage={toggleLang}
      onSkipToPlatform={() => setActiveRole('PREP_COMMITTEE')}
      onSelectManagementView={view => setActiveRole(view === 'DIRECTORATE' ? 'CHAIRMAN' : 'BIENNIAL_DIRECTOR')}
      onSelectRoleAndExplore={role => {
        const storyRoles: Record<string, InstitutionalRole> = {
          DIRECTORATE: 'CHAIRMAN', SDC_COORDINATOR: 'COORDINATOR', COMMITTEE: 'PREP_COMMITTEE',
          EDITORIAL: 'EDITORIAL', SAF_TECHNICIAN: 'TECHNICAL', PR_PROTOCOL: 'PR_PROTOCOL',
          FINANCE: 'FINANCE', ARTIST: 'ARTIST', LOGISTICS: 'LOGISTICS',
        };
        setActiveRole(storyRoles[role] ?? 'ROLES');
      }} />;
  }

  return (
    <div className="min-h-screen bg-[#F7F1E6] text-[#2C2A29] flex flex-col font-sans">
      <DirectoryRegistration artists={nominatedArtists} />
      <WorkspaceNavigation role={activeRole} onNavigate={setActiveRole} isAr={isAr}
        onToggleLanguage={toggleLang} onOpenPresenter={() => setIsPresenterDrawerOpen(prev => !prev)} handoff={pendingNavigation && handoff ? { ...handoff, owner: undefined } : handoff} />
      <PresentationHandoff isAr={isAr} automatic={autoForward} onAutomaticChange={setAutoForward} pending={pendingNavigation ? { id: pendingNavigation.id, label: ({ BIENNIAL_DIRECTOR: isAr ? 'مدير الملتقى' : 'Biennial Director', CHAIRMAN: isAr ? 'رئيس الدائرة' : 'Chairman', EDITORIAL: isAr ? 'قسم التحرير' : 'Editorial', HIP: isAr ? 'منسق معرض عام' : 'HIP' } as Partial<Record<InstitutionalRole, string>>)[pendingNavigation.role] ?? pendingNavigation.role } : null} onContinue={continueNavigation} />

      {/* 
        WORKSPACE MOUNT POINT
        The actual Archival Heritage Pop UI renders inside this container.
      */}
      <main id="workspace-scroll" tabIndex={-1} ref={workspaceScrollRef} className="flex-1 overflow-y-auto relative bg-[#F7F1E6]">
        {!['CHAIRMAN', 'BIENNIAL_DIRECTOR', 'EDITORIAL', 'HIP', 'ROLES', 'PR_PROTOCOL', 'TECHNICAL', 'FINANCE'].includes(activeRole) && (activeRole !== 'PREP_COMMITTEE' || isNominationFormOpen) && (activeRole !== 'COORDINATOR' || activeCoordinatorId === commissionCoordinatorId) && <aside className="border-b border-[#D9CEBA] ps-4 pe-4 py-3 text-start" dir={isAr ? 'rtl' : 'ltr'}>
          <CommissionSummary isAr={isAr} showTechnical={activeRole !== 'PR_PROTOCOL'} />
        </aside>}
        {renderWorkspace()}
        {commission.installationStatus==='ARCHIVED_CLOSED'&&['COORDINATOR','BIENNIAL_DIRECTOR','HIP'].includes(activeRole)&&<CollectionCloseout state={commission} actor={activeRole}/>}
        {activeRole === 'BIENNIAL_DIRECTOR' && <ExecutiveContractSummary dossiers={nominatedArtists.filter(d=>commission.installationStatus!=='ARCHIVED_CLOSED'||d.id!==COMMISSION.id)} contracts={contracts} isAr={isAr} />}
        {activeRole === 'LOGISTICS' && commission.installationStatus !== 'ARCHIVED_CLOSED' && <PackingRegister record={packingEvidence} isAr={isAr} onRecord={record=>{if(activeRole==='LOGISTICS'&&validPacking(record))setPackingEvidence(previous=>previous??record);}} />}
        {['TECHNICAL','COORDINATOR','FINANCE'].includes(activeRole) && <SupplierRegister rows={supplierDeliveries} dossiers={nominatedArtists.filter(d=>commission.installationStatus!=='ARCHIVED_CLOSED'||d.id!==COMMISSION.id)} actor={activeRole} coordinatorId={activeCoordinatorId} isAr={isAr} onAction={action=>setSupplierDeliveries(rows=>supplierTransition(rows,{...action,actor:activeRole},nominatedArtists.filter(d=>commission.installationStatus!=='ARCHIVED_CLOSED'||d.id!==COMMISSION.id)))} />}
        {['COORDINATOR','HIP','BIENNIAL_DIRECTOR'].includes(activeRole) && <>
          {dossierNotice && <p role="status" className="mx-auto max-w-5xl rounded border ps-4 pe-4 py-3">{dossierNotice}</p>}
          <DossierTracking dossiers={activeRole === 'COORDINATOR' ? assignedTo(nominatedArtists,activeCoordinatorId) : nominatedArtists.filter(d => d.status === 'APPROVED')} isAr={isAr} actor={activeRole} publicationReady={themePolishStatus === 'PUBLISHED_OFFICIAL' && translationStatus === 'PUBLISHED'} lockedIds={contracts.filter(c => c.status !== 'NOT_DRAFTED').map(c=>c.artistId)}
            onRequest={(id,scope,reason) => {
              if (activeRole !== 'COORDINATOR'||(id===COMMISSION.id&&commission.installationStatus==='ARCHIVED_CLOSED')) return;
              const d = nominatedArtists.find(row=>row.id===id); if (!d) return;
              const next = requestScopeChange(d,activeCoordinatorId,scope,reason,new Date().toISOString(),crypto.randomUUID());
              setDossierNotice(next===d ? (isAr?'لم يسجّل التعديل: تحقق من الحقول والتغيير والمراجعة المعلقة.':'Amendment not recorded: check required fields, changed values and pending review.') : (isAr?'تمت إحالة التعديل؛ القيم المعتمدة لم تتغير.':'Amendment submitted; approved values are unchanged.'));
              setNominatedArtists(rows=>rows.map(row=>row===d?next:row));
            }}
            onReview={(id,amendmentId,approve) => {
              const d=nominatedArtists.find(row=>row.id===id); if (!d||(id===COMMISSION.id&&commission.installationStatus==='ARCHIVED_CLOSED')) return;
              const next=reviewScopeChange(d,amendmentId,approve,activeRole,blocklist,contracts.some(c=>c.artistId===id&&c.status!=='NOT_DRAFTED'),new Date().toISOString());
              setDossierNotice(next===d ? (isAr?'لم يسجّل القرار: تحقق من القيود والاتفاقية والمراجعة الحالية.':'Decision not recorded: check compliance, agreement lock and current revision.') : (isAr?'تم تسجيل القرار في الملف المشترك.':'Decision recorded in the shared dossier.'));
              setNominatedArtists(rows=>rows.map(row=>row===d?next:row));
            }}
            onDispatch={id=>setNominatedArtists(rows=>rows.map(d=>d.id===id&&!(id===COMMISSION.id&&commission.installationStatus==='ARCHIVED_CLOSED')?recordDossierDispatch(d,activeRole,themePolishStatus==='PUBLISHED_OFFICIAL'&&translationStatus==='PUBLISHED',new Date().toISOString()):d))}/>
        </>}
        {Object.hasOwn(ESCALATION_DEPARTMENTS, activeRole) && <EscalationSubmission key={activeRole} actor={activeRole} isAr={isAr} records={executiveEscalations} onSubmit={input => setExecutiveEscalations(rows => submitEscalation(rows, input, activeRole, new Date().toISOString()))} />}
      </main>

      {/* Presenter Architecture Drawer (Ctrl+Shift+P / ⌘⇧P) */}
      <PresenterDrawer
        isOpen={isPresenterDrawerOpen}
        onClose={() => setIsPresenterDrawerOpen(false)}
        lang={lang}
      />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider initialLang="ar">
      <MasterDirectoryProvider><SessionDraftProvider><SADUApp /></SessionDraftProvider></MasterDirectoryProvider>
    </I18nProvider>
  );
}
