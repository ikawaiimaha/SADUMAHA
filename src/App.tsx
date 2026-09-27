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

import React, { useState, useEffect, useReducer } from 'react';
import RoleSelection, { AppRole } from './components/RoleSelection';
import CommitteeThemeWorkspace, { CommitteeThemeDraft, isThemeBatchComplete } from './components/CommitteeThemeWorkspace';
import ChairmanWorkspace, { ThemeItem } from './components/ChairmanWorkspace';
import HIPWorkspace, { TranslationStatus } from './components/HIPWorkspace';
import EditorialWorkspace, { ThemePolishStatus } from './components/EditorialWorkspace';
import DirectorWorkspace from './components/DirectorWorkspace';
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

function RoleButton({ 
  role, 
  current, 
  onClick, 
  icon, 
  label 
}: { 
  role: InstitutionalRole; 
  current: InstitutionalRole; 
  onClick: (role: InstitutionalRole) => void;
  icon: React.ReactNode;
  label: string;
}) {
  const isActive = current === role;
  return (
    <button
      type="button"
      onClick={() => onClick(role)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
        isActive 
          ? 'bg-[#8B4513] text-white shadow-inner ring-1 ring-[#8B4513]' 
          : 'bg-[#2C2A29] text-[#A89F91] hover:bg-[#3D3A38] hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

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
  const [activeRole, setActiveRole] = useState<InstitutionalRole>('COORDINATOR');
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
  const [curatorialBrief, setCuratorialBrief] = useState<string>(
    'Sharjah Calligraphy Biennial Curatorial Directive: Emphasize the dialogue between classical proportion and avant-garde architectural manifestation. All nominated artists must balance aesthetic script lineage with rigorous spatial experimentation.'
  );
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

  const handlePresentToChairman = (themes: CommitteeThemeDraft[]) => {
    if (ratifiedTheme || !isThemeBatchComplete(themes)) return;
    setSubmittedThemes(themes);
  };

  const handleBudgetAssigned = (amount: number, theme: ThemeItem) => {
    if (ratifiedTheme || !Number.isFinite(amount) || amount <= 0) return;
    setAssignedBudget(amount);
    setRatifiedTheme(theme);
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
    setNominatedArtists(prev => [dossier, ...prev]);
    setIsNominationFormOpen(false);
  };

  const handleVetoArtist = (id: string, reason: string, notes?: string) => {
    setNominatedArtists(prev =>
      prev.map(artist =>
        artist.id === id
          ? {
              ...artist,
              status: 'VETOED',
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
    setNominatedArtists(prev =>
      prev.map(artist => (artist.id === id ? { ...artist, status: 'APPROVED' } : artist))
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
          ? { ...artist, status: 'APPROVED' }
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

  const renderWorkspace = () => {
    switch (activeRole) {
      case 'CHAIRMAN':
        return (
          <ChairmanWorkspace
            eventId={EVENT_ID}
            themes={submittedThemes}
            onBudgetAssigned={handleBudgetAssigned}
            themeStatus={themePolishStatus}
            initialApprovedIndex={ratifiedTheme && submittedThemes ? submittedThemes.indexOf(ratifiedTheme as CommitteeThemeDraft) : null}
            initialBudget={assignedBudget}
            onBackToRoles={() => setActiveRole('ROLES')}
          />
        );

      case 'BIENNIAL_DIRECTOR':
        return (
          <DirectorWorkspace
            submittedThemes={directorThemes}
            onPresentToChairman={handlePresentToChairman}
            nominatedArtists={nominatedArtists}
            onVetoArtist={handleVetoArtist}
            onApproveArtist={handleApproveArtist}
            assignedBudget={assignedBudget}
            ratifiedTheme={ratifiedTheme}
            curatorialBrief={curatorialBrief}
            onBackToRoles={() => setActiveRole('ROLES')}
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
              > {tr("1. Theme Formulation Table")} </button>
              <button
                type="button"
                onClick={() => setIsNominationFormOpen(true)}
                className={`rounded px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  isNominationFormOpen
                    ? 'bg-[#8B4513] text-white shadow-xs'
                    : 'bg-white border border-[#D9D2C5] text-[#2C2A29] hover:bg-stone-50'
                }`}
              > {tr("2. Nominate Artist (Multaqa Protocol)")} </button>
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
                eventId={EVENT_ID}
                ratifiedTheme={ratifiedTheme}
                onPresentToChairman={handleSubmitCommitteeThemes}
                onBackToRoles={() => setActiveRole('ROLES')}
              />
            )}
          </div>
        );

      case 'EDITORIAL':
        return (
          <EditorialWorkspace
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
            onBackToRoles={() => setActiveRole('ROLES')}
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
            onSubmitToEditorial={handleSubmitToEditorial}
            curatorialBrief={curatorialBrief}
            onUpdateCuratorialBrief={setCuratorialBrief}
            blocklist={blocklist}
            onUpdateBlocklist={setBlocklist}
            ratifiedTheme={ratifiedTheme}
            onBackToRoles={() => setActiveRole('ROLES')}
          />
        );

      case 'COORDINATOR':
        return (
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {/* Stage 6: Bilateral Contracting Workspace */}
            {activeRole === 'COORDINATOR' && (
              <CoordinatorContractWorkspace 
                isAr={isRtl} 
                artists={artists}
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
            onBackToRoles={() => setActiveRole('ROLES')}
          />
        );

      case 'PR_PROTOCOL':
        return <PRWorkspace isAr={isAr} state={commission}
          onCheck={(field, value) => dispatchCommission({ type: 'pr-check', actor: activeRole, field, value })}
          onClearPR={handleClearPR} />;

      case 'TECHNICAL':
        return <TechnicalWorkspace isAr={isAr} state={commission}
          onCheck={(field, value) => dispatchCommission({ type: 'technical-check', actor: activeRole, field, value })}
          onClearTechnical={handleClearTechnical} />;

      case 'FINANCE':
        return <FinanceWorkspace isAr={isAr} state={commission}
          artist={artists.find(artist => artist.id === contracts[0]?.artistId)}
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

  return (
    <div className="min-h-screen bg-[#F7F1E6] text-[#2C2A29] flex flex-col font-sans">
      {/* 
        EXECUTIVE PROTOTYPE CONTROL BAR 
        This is strictly for the pitch demo. It acts as a God-mode switcher 
        so you can prove the chain of command to leadership in real-time.
      */}
      <nav className="sticky top-0 bg-[#1A1817] text-[#D9D2C5] border-b border-[#2C2A29] px-4 py-2 flex flex-wrap items-center justify-between gap-3 z-50 shadow-md">
        <div className="flex items-center gap-2.5">
          <Settings2 className="w-5 h-5 text-[#8B4513] shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-widest uppercase text-white font-mono"> {tr("SADU Prototype Control")} </span>
            <span className="text-[10px] text-[#A89F91]"> {tr("Sharjah Calligraphy Biennial • Leadership Demo")} </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <RoleButton 
            role="CHAIRMAN" 
            current={activeRole} 
            onClick={setActiveRole} 
            icon={<Crown className="w-3.5 h-3.5" />} 
            label={isAr ? 'رئيس الدائرة' : 'Chairman'}
          />
          <RoleButton 
            role="BIENNIAL_DIRECTOR" 
            current={activeRole} 
            onClick={setActiveRole} 
            icon={<Briefcase className="w-3.5 h-3.5" />} 
            label={isAr ? 'مدير البينالي' : 'Director'}
          />
          <RoleButton 
            role="PREP_COMMITTEE" 
            current={activeRole} 
            onClick={setActiveRole} 
            icon={<PenTool className="w-3.5 h-3.5" />} 
            label={isAr ? 'اللجنة التحضيرية' : 'Committee'}
          />
          <RoleButton 
            role="EDITORIAL" 
            current={activeRole} 
            onClick={setActiveRole} 
            icon={<Eye className="w-3.5 h-3.5" />} 
            label={isAr ? 'قسم التحرير' : 'Editorial'}
          />
          <RoleButton 
            role="HIP" 
            current={activeRole} 
            onClick={setActiveRole} 
            icon={<Globe className="w-3.5 h-3.5" />} 
            label={isAr ? 'منسق معرض عام' : 'HIP'}
          />
          <RoleButton 
            role="COORDINATOR" 
            current={activeRole} 
            onClick={setActiveRole} 
            icon={<GitMerge className="w-3.5 h-3.5" />} 
            label={isAr ? 'المنسق العام' : 'Coordinator'}
          />
          <RoleButton 
            role="ARTIST" 
            current={activeRole} 
            onClick={setActiveRole} 
            icon={<User className="w-3.5 h-3.5" />} 
            label={isAr ? 'الفنان' : 'Artist'}
          />
          <RoleButton 
            role="PR_PROTOCOL" 
            current={activeRole} 
            onClick={setActiveRole} 
            icon={<ShieldCheck className="w-3.5 h-3.5" />} 
            label={isAr ? 'التشريفات والعلاقات' : 'PR & Protocol'}
          />
          <RoleButton role="TECHNICAL" current={activeRole} onClick={setActiveRole}
            icon={<ShieldCheck className="w-3.5 h-3.5" />} label={isAr ? 'الفريق الفني' : 'Technical'} />
          <RoleButton 
            role="FINANCE" 
            current={activeRole} 
            onClick={setActiveRole} 
            icon={<Landmark className="w-3.5 h-3.5" />} 
            label={isAr ? 'الشؤون المالية' : 'Finance'}
          />
          <div className="h-5 w-px bg-[#2C2A29] mx-1 shrink-0" />
          <RoleButton 
            role="ROLES" 
            current={activeRole} 
            onClick={setActiveRole} 
            icon={<RotateCcw className="w-3.5 h-3.5" />} 
            label={isAr ? 'جميع الأدوار' : 'All Roles'}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLang}
            title={isRtl ? 'Switch to English' : 'التحويل إلى العربية'}
            className="inline-flex items-center gap-1.5 rounded border border-[#2C2A29] bg-[#2C2A29] px-2.5 py-1.5 text-xs font-bold text-[#D9D2C5] shadow-xs transition-colors hover:bg-[#3D3A38] hover:text-white cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5 text-[#8B4513]" />
            <span>{isRtl ? 'English' : 'عربي'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPresenterDrawerOpen(prev => !prev)}
            title={tr("Toggle Presenter Architecture Mode (Ctrl+Shift+P / ⌘⇧P)")}
            className="inline-flex items-center gap-1.5 rounded border border-[#2C2A29] bg-[#2C2A29] px-2.5 py-1.5 text-xs font-bold text-[#D9D2C5] shadow-xs transition-colors hover:bg-[#3D3A38] hover:text-white cursor-pointer"
          >
            <Compass className="h-3.5 w-3.5 text-[#8B4513]" />
            <span className="hidden sm:inline">{tr("Presenter Specs")}</span>
            <kbd className="hidden lg:inline-block rounded border border-[#3D3A38] bg-[#1A1817] px-1 py-0.2 text-[9px] font-mono text-[#A89F91]">
              ⌘⇧P
            </kbd>
          </button>
        </div>
      </nav>

      {/* 
        WORKSPACE MOUNT POINT
        The actual Archival Heritage Pop UI renders inside this container.
      */}
      <main className="flex-1 overflow-y-auto relative bg-[#F7F1E6]">
        {!['PR_PROTOCOL', 'TECHNICAL', 'FINANCE'].includes(activeRole) && <aside className="border-b border-[#D9CEBA] ps-4 pe-4 py-3 text-start" dir={isAr ? 'rtl' : 'ltr'}>
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


