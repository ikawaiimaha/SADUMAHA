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

import React, { useState, useEffect, useReducer, useRef } from 'react';
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
  id: COMMISSION.id, artistName: COMMISSION.artistName, artistCategory: 'Emerging',
  nationality: 'United Arab Emirates', medium: 'Architectural Bronze & Black Oxide',
  proposedWorkTitle: COMMISSION.title, cvFileName: 'fictional-noura-cv.pdf',
  previousWorksCount: 1, mockupCount: 1, submittedBy: 'Preparatory Committee',
  submittedAt: '2026-09-26T09:00:00Z', status: 'APPROVED',
}];
const INITIAL_VETTED_ARTISTS: VettedArtist[] = [{
  id: COMMISSION.id, name_ar: COMMISSION.artistNameAr, name_en: COMMISSION.artistName,
  nationality: 'United Arab Emirates', medium: 'Architectural Bronze & Black Oxide — 84 kg',
  category: 'EMERGING', status: 'DIRECTOR_APPROVED',
}];

function SADUApp() {
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
  const [activeRole, setActiveRole] = useState<InstitutionalRole>('LANDING');
  const workspaceScrollRef = useRef<HTMLElement>(null);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    workspaceScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeRole]);

  const [submittedThemes, setSubmittedThemes] = useState<CommitteeThemeDraft[] | undefined>(undefined);
  const [directorThemes, setDirectorThemes] = useState<CommitteeThemeDraft[]>([]);
  const [assignedBudget, setAssignedBudget] = useState<number | null>(null);
  const [ratifiedTheme, setRatifiedTheme] = useState<ThemeItem | null>(null);

  // Stage 1 & 2: Theme Ratification & Editorial Polish State
  const [themePolishStatus, setThemePolishStatus] = useState<ThemePolishStatus>('PENDING_CHAIRMAN_APPROVAL');
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
  const [scoutedDossiers, setScoutedDossiers] = useState<NominatedArtistDossier[]>([]);
  const [blocklist, setBlocklist] = useState<string[]>([
    'Restricted Nationality: Country X',
    'Hazardous Medium: Open Flame',
  ]);

  // Stage 3 & 4: Nominated Artists Pool
  const [nominatedArtists, setNominatedArtists] = useState<NominatedArtistDossier[]>(INITIAL_NOMINATIONS);
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
    if (ratifiedTheme || !isThemeBatchComplete(themes)) return;
    setSubmittedThemes(themes);
  };

  const handleBudgetAssigned = (amount: number, theme: ThemeItem) => {
    if (ratifiedTheme || !Number.isFinite(amount) || amount <= 0) return;
    setAssignedBudget(amount);
    // Preserve the complete executive record, including both sets of notes.
    setRatifiedTheme({ ...theme });
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
    setThemeEssayArabic(essayAr);
    setThemeEssayEnglish(essayEn);
    setRatifiedTheme(approvedTheme);
    setThemePolishStatus('PUBLISHED_OFFICIAL');
  };

  const handleSubmitToEditorial = (arabicText: string) => {
    if (themePolishStatus !== 'PUBLISHED_OFFICIAL' || !arabicText.trim()) return;
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
    setScoutedDossiers(prev => [{...dossier, status: 'DRAFT', assignedCoordinatorId: ASSIGNED_COORDINATOR}, ...prev]);
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
    if (activeRole !== 'BIENNIAL_DIRECTOR' || !nominatedArtists.some(a => a.id === id && a.status === 'PENDING_DIRECTOR_REVIEW')) return;
    setNominatedArtists(prev =>
      prev.map(artist => (artist.id === id ? { ...artist, status: 'APPROVED', decisionAt: new Date().toISOString() } : artist))
    );

    const target = nominatedArtists.find(a => a.id === id);
    if (target) {
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
            nationality: target.nationality,
            medium: target.medium,
            category: (target.artistCategory.toUpperCase() === 'EMERGING' ? 'EMERGING' : 'ESTABLISHED'),
            status: 'DIRECTOR_APPROVED',
          },
        ];
      });
    }

    setContracts(prev => {
      const existing = prev.find(c => c.artistId === id);
      if (existing) return prev;
      const target = nominatedArtists.find(a => a.id === id);
      if (!target) return prev;

      const productionCost = target.artistCategory === 'Established' ? 120000 : 65000;
      const advance = Math.round(productionCost * 0.3);
      const delivery = Math.round(productionCost * 0.4);
      const installation = productionCost - advance - delivery;

      return [
        ...prev,
        {
          id: `contract-${id}`,
          artistId: id,
          artistName: target.artistName,
          artistCategory: target.artistCategory,
          nationality: target.nationality,
          medium: target.medium,
          proposedWorkTitle: target.proposedWorkTitle,
          productionCost,
          shippingTerms:
            'The Department of Culture coordinates and covers museum-standard custom wooden crating, international climate-controlled air freight, and comprehensive door-to-door fine art transit insurance to Calligraphy Square & Sharjah Art Museum.',
          cancellationClauseMandatory: true,
          status: 'NOT_DRAFTED',
          tranches: {
            advancePercentage: 30,
            advanceAmount: advance,
            advanceStatus: 'PENDING',
            deliveryPercentage: 40,
            deliveryAmount: delivery,
            deliveryStatus: 'PENDING',
            installationPercentage: 30,
            installationAmount: installation,
            installationStatus: 'PENDING',
          },
          documents: {
            passportStatus: 'NOT_UPLOADED',
            artworkDpi: 300,
            highResStatus: 'NOT_UPLOADED',
            catalogBioStatus: 'DRAFT',
          },
          auditTrail: [],
        },
      ];
    });
  };

  // Stage 6: Bilateral Contracts & Disbursements State
  const [commission, dispatchCommission] = useReducer(commissionReducer, undefined, createCommission);
  const contracts = commission.contracts;
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
    if (artistId !== COMMISSION.id || activeRole !== 'COORDINATOR') return;
    const terms = contractTerms as ContractFormState;
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

    // Also synchronize nominatedArtists if matching
    setNominatedArtists(prev =>
      prev.map(artist =>
        artist.id === artistId || `contract-${artist.id}` === artistId
          ? { ...artist, status: 'APPROVED', decisionAt: new Date().toISOString() }
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
        nationality: targetArtist?.nationality || 'United Arab Emirates',
        medium: targetArtist?.medium || 'Calligraphic Art',
        proposedWorkTitle: COMMISSION.title,
        productionCost,
        shippingTerms: shippingMethod,
        specialConditions: terms.specialConditions,
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
    setContracts(prev =>
      prev.map(c => {
        if (c.id !== contractId) return c;
        const newRound: NegotiationRound = {
          id: `neg-${Date.now()}`,
          requestedAt: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          contractId,
          disputedCategory: category,
          artistJustification: justification,
          justification,
          proposedValue: proposedGrant,
          proposedGrant,
          status: 'PENDING_COORDINATOR_REVIEW',
        };
        return {
          ...c,
          status: 'CONTRACT_DISPUTED',
          auditTrail: [...(c.auditTrail || []), newRound],
        };
      })
    );
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
                highResUploadedAt: new Date().toISOString().split('T')[0],
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
    if (role === 'DIRECTOR') setActiveRole('BIENNIAL_DIRECTOR');
    else if (role === 'CHAIRMAN' || role === 'EDITORIAL' || role === 'HIP') setActiveRole(role);
  };

  const renderWorkspace = () => {
    switch (activeRole) {
      case 'CHAIRMAN':
        return (
          <ChairmanWorkspace
            onAutoNavigate={handleAutoNavigate}
            eventId={EVENT_ID}
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
            onAutoNavigate={handleAutoNavigate}
            restrictionProposal={restrictionProposal}
            onReviewRestrictions={approved => {
              if (activeRole !== 'BIENNIAL_DIRECTOR' || !restrictionProposal) return;
              if (approved) setBlocklist(restrictionProposal.tags);
              setRestrictionAudit(rows => [...rows, `${new Date().toISOString()} · Director · ${approved ? 'APPROVED' : 'REJECTED'} · ${restrictionProposal.reason} · ${restrictionProposal.tags.join(', ')}`]);
              setRestrictionProposal(null);
            }}
            submittedThemes={directorThemes}
            onReturnToCommittee={handleReturnToCommittee}
            onPresentToChairman={handlePresentToChairman}
            nominatedArtists={nominatedArtists}
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
            themeEssayArabic={themeEssayArabic}
            themeEssayEnglish={themeEssayEnglish}
            guidelinesEnglish={guidelinesEnglish}
            themeStatus={themePolishStatus}
            guidelinesArabic={guidelinesArabic}
            translationStatus={translationStatus}
            hipSubmissionTime={hipSubmissionTime}
            onSubmitToEditorial={handleSubmitToEditorial}
            curatorialBrief={curatorialBrief}
            onUpdateCuratorialBrief={setCuratorialBrief}
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
              <p>{ASSIGNED_COORDINATOR}</p>
              <details><summary className="cursor-pointer">{isAr ? 'إعداد ملف ترشيح' : 'Prepare nomination dossier'}</summary><ArtistNominationForm submittedBy="Coordinator" onSubmitNomination={handleNominateArtist} /></details>
              {scoutedDossiers.map(d => <article key={d.id} className="border-t border-[#D9CEBA] py-3"><h3 className="font-semibold">{d.artistName} · {d.proposedWorkTitle}</h3><p>{d.status} · {d.assignedCoordinatorId}</p><p>{d.complianceReason}</p>
                <button disabled={d.status !== 'DRAFT' || d.assignedCoordinatorId !== ASSIGNED_COORDINATOR} className="mt-2 rounded bg-[#8B261E] text-white ps-4 pe-4 py-2 disabled:opacity-50" onClick={() => {
                  const submitted = submitForVetting(d, activeRole, ASSIGNED_COORDINATOR, blocklist);
                  if (!submitted) return;
                  setScoutedDossiers(rows => rows.map(row => row.id === d.id ? submitted : row));
                  if (submitted.status === 'PENDING_DIRECTOR_REVIEW') setNominatedArtists(rows => [...rows, submitted]);
                }}>{isAr ? 'إرسال للتدقيق' : 'Submit for Vetting'}</button>
              </article>)}
              {nominatedArtists.filter(d => d.status === 'VETOED').map(d => <p key={d.id} role="status">{d.artistName} · {d.vetoReason} · {d.vetoNotes} · {d.decisionAt}</p>)}
            </section>
            <p className="my-4 text-sm text-[#736357]">{isAr ? 'التعاقد والتنفيذ في هذه المحاكاة مخصصان لعمل أفق كوفي؛ ملفات الترشيح الأخرى مخصصة لعرض التدقيق والقرارات.' : 'Contracting and execution in this rehearsal use Kufic Horizon only; other nominations demonstrate vetting and executive decisions.'}</p>
            {/* Stage 6: Bilateral Contracting Workspace */}
            {activeRole === 'COORDINATOR' && (
              <CoordinatorContractWorkspace 
                isAr={isRtl} 
                artists={artists.filter(artist => artist.id === COMMISSION.id)}
                contracts={contracts}
                onDispatchContract={handleDispatchContract} 
              />
            )}
          </div>
        );

      case 'ARTIST':
        return (
          <ArtistPortalWorkspace
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
        return <TechnicalWorkspace isAr={isAr} state={commission}
          onCheck={(field, value) => dispatchCommission({ type: 'technical-check', actor: activeRole, field, value })}
          onRequestSAF={(technicians, hours, rationale) => dispatchCommission({type: 'request-saf', actor: activeRole, technicians, hours, rationale, at: new Date().toISOString()})}
          onClearTechnical={handleClearTechnical} />;

      case 'LOGISTICS':
        return <LogisticsWorkspace isAr={isAr} state={commission} onRecord={action => {
          if (activeRole === 'LOGISTICS') dispatchCommission(action);
        }} />;
      case 'FINANCE':
        return <FinanceWorkspace isAr={isAr} state={commission}
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
      <WorkspaceNavigation role={activeRole} onNavigate={setActiveRole} isAr={isAr}
        onToggleLanguage={toggleLang} onOpenPresenter={() => setIsPresenterDrawerOpen(prev => !prev)} handoff={handoff} />

      {/* 
        WORKSPACE MOUNT POINT
        The actual Archival Heritage Pop UI renders inside this container.
      */}
      <main id="workspace-scroll" ref={workspaceScrollRef} className="flex-1 overflow-y-auto relative bg-[#F7F1E6]">
        {!['CHAIRMAN', 'BIENNIAL_DIRECTOR', 'EDITORIAL', 'HIP', 'ROLES', 'PR_PROTOCOL', 'TECHNICAL', 'FINANCE'].includes(activeRole) && (activeRole !== 'PREP_COMMITTEE' || isNominationFormOpen) && <aside className="border-b border-[#D9CEBA] ps-4 pe-4 py-3 text-start" dir={isAr ? 'rtl' : 'ltr'}>
          <CommissionSummary isAr={isAr} showTechnical={activeRole !== 'PR_PROTOCOL'} />
        </aside>}
        {renderWorkspace()}
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
      <SADUApp />
    </I18nProvider>
  );
}


