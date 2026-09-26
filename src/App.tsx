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

import React, { useState, useEffect } from 'react';
import RoleSelection, { AppRole } from './components/RoleSelection';
import CommitteeThemeWorkspace, { CommitteeThemeDraft } from './components/CommitteeThemeWorkspace';
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

const INITIAL_NOMINATIONS: NominatedArtistDossier[] = [
  {
    id: 'dossier-1',
    artistName: 'Hassan Sharif',
    artistCategory: 'Established',
    nationality: 'United Arab Emirates',
    medium: 'Conceptual Script & Mixed Media',
    proposedWorkTitle: 'Calligraphic Repetitions III',
    cvFileName: 'Hassan_Sharif_CV.pdf',
    previousWorksCount: 5,
    mockupCount: 3,
    submittedBy: 'Preparatory Committee',
    submittedAt: '2026-09-24T10:00:00Z',
    status: 'APPROVED',
  },
  {
    id: 'dossier-2',
    artistName: 'Nour El Hoda',
    artistCategory: 'Emerging',
    nationality: 'Egypt',
    medium: 'Kinetic Light Calligraphy',
    proposedWorkTitle: 'Luminal Muhaqqaq',
    cvFileName: 'Nour_ElHoda_Bio.pdf',
    previousWorksCount: 4,
    mockupCount: 2,
    submittedBy: 'Coordinator',
    submittedAt: '2026-09-24T11:15:00Z',
    status: 'PENDING_DIRECTOR_REVIEW',
  },
  {
    id: 'dossier-3',
    artistName: 'Mohamed Zakariya',
    artistCategory: 'Established',
    nationality: 'United States',
    medium: 'Classical Thuluth & Jali Diwani',
    proposedWorkTitle: 'Sacred Proportions of the Alif',
    cvFileName: 'Mohamed_Zakariya_Bio.pdf',
    previousWorksCount: 6,
    mockupCount: 2,
    submittedBy: 'Preparatory Committee',
    submittedAt: '2026-09-24T11:45:00Z',
    status: 'APPROVED',
  },
  {
    id: 'dossier-4',
    artistName: 'Zayd Al-Kindi',
    artistCategory: 'Emerging',
    nationality: 'Oman',
    medium: 'Algorithmic Kufic Projection',
    proposedWorkTitle: 'Fractal Diwani Streams',
    cvFileName: 'Zayd_AlKindi_CV.pdf',
    previousWorksCount: 3,
    mockupCount: 4,
    submittedBy: 'Coordinator',
    submittedAt: '2026-09-24T12:30:00Z',
    status: 'PENDING_DIRECTOR_REVIEW',
  },
];

const INITIAL_VETTED_ARTISTS: VettedArtist[] = [
  {
    id: 'art-001',
    name_ar: 'يوسف نبيل',
    name_en: 'Youssef Nabil',
    nationality: 'Egypt / France',
    medium: 'Hand-coloured Gelatin Silver Print',
    category: 'ESTABLISHED',
    status: 'DIRECTOR_APPROVED',
  },
  {
    id: 'art-002',
    name_ar: 'نورة المزروعي',
    name_en: 'Noura Al Mazrouei',
    nationality: 'United Arab Emirates',
    medium: 'Bronze Casting & Calligraphic Sculpture',
    category: 'EMERGING',
    status: 'DIRECTOR_APPROVED',
  },
  {
    id: 'dossier-1',
    name_ar: 'حسن شريف',
    name_en: 'Hassan Sharif',
    nationality: 'United Arab Emirates',
    medium: 'Conceptual Script & Mixed Media',
    category: 'ESTABLISHED',
    status: 'DIRECTOR_APPROVED',
  },
  {
    id: 'dossier-3',
    name_ar: 'محمد زكريا',
    name_en: 'Mohamed Zakariya',
    nationality: 'United States',
    medium: 'Classical Thuluth & Jali Diwani',
    category: 'ESTABLISHED',
    status: 'DIRECTOR_APPROVED',
  },
];

const INITIAL_CONTRACTS: BilateralContract[] = [
  {
    id: 'contract-dossier-1',
    artistId: 'dossier-1',
    artistName: 'Hassan Sharif',
    artistCategory: 'Established',
    nationality: 'United Arab Emirates',
    medium: 'Conceptual Script & Mixed Media',
    proposedWorkTitle: 'Calligraphic Repetitions III',
    productionCost: 120000,
    shippingTerms:
      'The Department of Culture coordinates and covers museum-standard custom wooden crating, international climate-controlled air freight, and comprehensive door-to-door fine art transit insurance to Calligraphy Square & Sharjah Art Museum.',
    cancellationClauseMandatory: true,
    status: 'ARTIST_APPROVED',
    tranches: {
      advancePercentage: 30,
      advanceAmount: 36000,
      advanceStatus: 'DISBURSED',
      advanceDisbursedAt: '2026-09-24 14:30:00',
      advanceVoucherRef: 'VCH-2026-001',
      deliveryPercentage: 40,
      deliveryAmount: 48000,
      deliveryStatus: 'PENDING',
      installationPercentage: 30,
      installationAmount: 36000,
      installationStatus: 'PENDING',
    },
    documents: {
      passportFileName: 'Hassan_Sharif_Passport_Official.pdf',
      passportStatus: 'VERIFIED',
      passportUploadedAt: '2026-09-24',
      passportVerifiedAt: '2026-09-24',
      passportNotes: 'Verified by SDC PR Protocol Desk for UAE delegation badge',
      highResArtworkFileName: 'Hassan_Sharif_CalligraphicRepetitions_300DPI.tiff',
      artworkDpi: 300,
      highResStatus: 'VERIFIED',
      highResUploadedAt: '2026-09-24',
      highResVerifiedAt: '2026-09-24',
      catalogBioArabic:
        'فنان تشكيلي رائد ومؤسس الفن المفاهيمي المعاصر في الإمارات، يُعد من أبرز المؤثرين في حركة التشكيل والخط في العالم العربي.',
      catalogBioEnglish:
        'Pioneering Emirati conceptual artist and theorist whose seminal works bridge structural calligraphy, repetition, and contemporary spatial assemblages.',
      catalogBioStatus: 'VERIFIED',
    },
    draftedAt: '2026-09-24T10:30:00Z',
    sentAt: '2026-09-24T11:00:00Z',
    signedAt: '2026-09-24',
    signatureReference: 'REF-SCB-EXEC-0881',
    auditTrail: [],
  },
  {
    id: 'contract-dossier-3',
    artistId: 'dossier-3',
    artistName: 'Mohamed Zakariya',
    artistCategory: 'Established',
    nationality: 'United States',
    medium: 'Classical Thuluth & Jali Diwani',
    proposedWorkTitle: 'Sacred Proportions of the Alif',
    productionCost: 110000,
    shippingTerms:
      'Fine art climate-controlled transit with dedicated air-courier accompanied handling from Washington D.C. to Sharjah International Airport, full customs waiver under Department aegis.',
    cancellationClauseMandatory: true,
    status: 'SENT_TO_ARTIST',
    tranches: {
      advancePercentage: 30,
      advanceAmount: 33000,
      advanceStatus: 'PENDING',
      deliveryPercentage: 40,
      deliveryAmount: 44000,
      deliveryStatus: 'PENDING',
      installationPercentage: 30,
      installationAmount: 33000,
      installationStatus: 'PENDING',
    },
    documents: {
      passportFileName: 'Mohamed_Zakariya_Passport_Scan.pdf',
      passportStatus: 'SUBMITTED',
      passportUploadedAt: '2026-09-24',
      highResArtworkFileName: 'Zakariya_SacredProportions_Master_300DPI.tiff',
      artworkDpi: 300,
      highResStatus: 'SUBMITTED',
      highResUploadedAt: '2026-09-24',
      catalogBioArabic:
        'أستاذ الخط العربي والثلث الجلي المرموق بالولايات المتحدة الأمريكية، يحمل إجازات رفيعة في الخط العربي وله مساهمات دولية بارزة.',
      catalogBioEnglish:
        'Renowned American master calligrapher holding classical Turkish diplomas (ijaza) in Thuluth and Naskh scripts, celebrated worldwide for exacting geometric fidelity.',
      catalogBioStatus: 'SUBMITTED',
    },
    draftedAt: '2026-09-24T12:00:00Z',
    sentAt: '2026-09-24T12:30:00Z',
    auditTrail: [],
  },
];

const INITIAL_DISBURSEMENTS: DisbursementRecord[] = [
  {
    id: 'disb-1',
    contractId: 'contract-dossier-1',
    voucherRef: 'VCH-2026-001',
    artistName: 'Hassan Sharif',
    trancheType: 'Advance (30%)',
    amount: 36000,
    disbursedAt: '2026-09-24 14:30:00',
    paymentMethod: 'Treasury Wire (Sharjah Finance Dept)',
  },
];

function SADUApp() {
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
  const [activeRole, setActiveRole] = useState<InstitutionalRole>('BIENNIAL_DIRECTOR');
  const [submittedThemes, setSubmittedThemes] = useState<CommitteeThemeDraft[] | undefined>(undefined);
  const [assignedBudget, setAssignedBudget] = useState<number | null>(null);
  const [ratifiedTheme, setRatifiedTheme] = useState<ThemeItem | null>(null);

  // Stage 1 & 2: Theme Ratification & Editorial Polish State
  const [themePolishStatus, setThemePolishStatus] = useState<ThemePolishStatus>('PENDING_EDITORIAL_POLISH');
  const [themeEssayArabic, setThemeEssayArabic] = useState<string>('');
  const [themeEssayEnglish, setThemeEssayEnglish] = useState<string>('');

  // Stage 2: HIP & Translation Directives State
  const [guidelinesArabic, setGuidelinesArabic] = useState<string>(
    'دليل المعرض التوجيهي لبينالي الشارقة للخط: التأكيد على الحوار الجمالي الرصين بين النسب الفاضلة للخط العربي الأصيل والتجليات المعمارية المعاصرة. يتوجب على كافة الفنانين المرشحين تقديم أعمال تستند إلى أصالة السطر الكوفي والثلث مع استكشاف أبعاد الوسائط الحديثة والفراغية.'
  );
  const [guidelinesEnglish, setGuidelinesEnglish] = useState<string>(
    'Exhibition Curatorial Guidelines: Emphasize the aesthetic dialogue between the sacred proportions of classical calligraphy and contemporary architectural manifestations. All nominated artists must ground their proposals in classical scripts while exploring modern spatial media.'
  );
  const [translationStatus, setTranslationStatus] = useState<TranslationStatus>('PENDING_TRANSLATION');
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

  const handlePresentToChairman = (themes: CommitteeThemeDraft[]) => {
    setSubmittedThemes(themes);
  };

  const handleBudgetAssigned = (amount: number, theme: ThemeItem) => {
    setAssignedBudget(amount);
    setRatifiedTheme(theme);
    setThemePolishStatus('PENDING_EDITORIAL_POLISH');
  };

  const handlePublishOfficialTheme = ({
    themeEssayArabic: essayAr,
    themeEssayEnglish: essayEn,
    approvedTheme,
  }: {
    themeEssayArabic: string;
    themeEssayEnglish: string;
    approvedTheme: ThemeItem;
  }) => {
    setThemeEssayArabic(essayAr);
    setThemeEssayEnglish(essayEn);
    setRatifiedTheme(approvedTheme);
    setThemePolishStatus('PUBLISHED');
  };

  const handleSubmitToEditorial = (arabicText: string) => {
    setGuidelinesArabic(arabicText);
    setTranslationStatus('PENDING_TRANSLATION');
  };

  const handlePublishBrief = (englishText: string) => {
    setGuidelinesEnglish(englishText);
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
  const [contracts, setContracts] = useState<BilateralContract[]>(INITIAL_CONTRACTS);
  const [disbursementHistory, setDisbursementHistory] = useState<DisbursementRecord[]>(INITIAL_DISBURSEMENTS);

  const handleDispatchContract = (
    artistId: string,
    contractTerms: any,
    shippingTermsArg?: string,
    resolutionNotes?: string
  ) => {
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

    const advanceAmount = Math.round((productionCost * advancePct) / 100);
    const deliveryAmount = Math.round((productionCost * interimPct) / 100);
    const installationAmount = productionCost - advanceAmount - deliveryAmount;

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
        proposedWorkTitle: existing?.proposedWorkTitle || (targetArtist as any)?.proposedWorkTitle || 'Bilateral Exhibition Commission',
        productionCost,
        shippingTerms: shippingMethod,
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
  const handleSignContract = (contractId: string, signerName: string) => {
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
                passportUploadedAt: new Date().toISOString().split('T')[0],
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

  const handleVerifyPassport = (contractId: string, notes?: string) => {
    setContracts(prev =>
      prev.map(c =>
        c.id === contractId
          ? {
              ...c,
              documents: {
                ...c.documents,
                passportStatus: 'VERIFIED',
                passportVerifiedAt: new Date().toISOString().split('T')[0],
                passportNotes: notes || 'Verified by PR Protocol Desk',
              },
            }
          : c
      )
    );
  };

  const handleVerifyHighResArtwork = (contractId: string, notes?: string) => {
    setContracts(prev =>
      prev.map(c =>
        c.id === contractId
          ? {
              ...c,
              documents: {
                ...c.documents,
                highResStatus: 'VERIFIED',
                highResVerifiedAt: new Date().toISOString().split('T')[0],
                highResNotes: notes || 'Validated for hardcover catalog printing plate',
              },
            }
          : c
      )
    );
  };

  const handleDisburseTranche = (
    contractId: string,
    trancheType: 'Advance (30%)' | 'Delivery (40%)' | 'Installation (30%)',
    amount: number
  ) => {
    const voucherRef = `VCH-2026-00${disbursementHistory.length + 1}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    setContracts(prev =>
      prev.map(c => {
        if (c.id !== contractId) return c;
        if (trancheType === 'Advance (30%)') {
          return {
            ...c,
            tranches: {
              ...c.tranches,
              advanceStatus: 'DISBURSED',
              advanceDisbursedAt: now,
              advanceVoucherRef: voucherRef,
            },
          };
        }
        if (trancheType === 'Delivery (40%)') {
          return {
            ...c,
            tranches: {
              ...c.tranches,
              deliveryStatus: 'DISBURSED',
              deliveryDisbursedAt: now,
              deliveryVoucherRef: voucherRef,
            },
          };
        }
        if (trancheType === 'Installation (30%)') {
          return {
            ...c,
            tranches: {
              ...c.tranches,
              installationStatus: 'DISBURSED',
              installationDisbursedAt: now,
              installationVoucherRef: voucherRef,
            },
          };
        }
        return c;
      })
    );

    const target = contracts.find(c => c.id === contractId);
    setDisbursementHistory(prev => [
      {
        id: `disb-${Date.now()}`,
        contractId,
        voucherRef,
        artistName: target?.artistName || 'Artist',
        trancheType,
        amount,
        disbursedAt: now,
        paymentMethod: 'Treasury Wire (Sharjah Finance Dept)',
      },
      ...prev,
    ]);
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
            onBackToRoles={() => setActiveRole('ROLES')}
          />
        );

      case 'BIENNIAL_DIRECTOR':
        return (
          <DirectorWorkspace
            submittedThemes={submittedThemes}
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
              >
                1. Theme Formulation Table
              </button>
              <button
                type="button"
                onClick={() => setIsNominationFormOpen(true)}
                className={`rounded px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  isNominationFormOpen
                    ? 'bg-[#8B4513] text-white shadow-xs'
                    : 'bg-white border border-[#D9D2C5] text-[#2C2A29] hover:bg-stone-50'
                }`}
              >
                2. Nominate Artist (Multaqa Protocol)
              </button>
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
                onPresentToChairman={handlePresentToChairman}
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
                onDispatchContract={handleDispatchContract} 
              />
            )}
          </div>
        );

      case 'ARTIST':
        return (
          <ArtistPortalWorkspace
            contracts={contracts}
            onSignContract={handleSignContract}
            onRequestAmendment={handleRequestAmendment}
            onUploadPassport={handleUploadPassport}
            onUploadHighResArtwork={handleUploadHighResArtwork}
            onSaveBio={handleSaveBio}
            onBackToRoles={() => setActiveRole('ROLES')}
          />
        );

      case 'PR_PROTOCOL':
        return (
          <PRWorkspace
            contracts={contracts}
            onVerifyPassport={handleVerifyPassport}
            onVerifyHighResArtwork={handleVerifyHighResArtwork}
            onBackToRoles={() => setActiveRole('ROLES')}
          />
        );

      case 'FINANCE':
        return (
          <FinanceWorkspace
            assignedBudget={assignedBudget}
            contracts={contracts}
            disbursementHistory={disbursementHistory}
            onDisburseTranche={handleDisburseTranche}
            onBackToRoles={() => setActiveRole('ROLES')}
          />
        );

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
            <span className="text-xs font-bold tracking-widest uppercase text-white font-mono">
              SADU Prototype Control
            </span>
            <span className="text-[10px] text-[#A89F91]">
              Sharjah Calligraphy Biennial • Leadership Demo
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <RoleButton 
            role="CHAIRMAN" 
            current={activeRole} 
            onClick={setActiveRole} 
            icon={<Crown className="w-3.5 h-3.5" />} 
            label="Chairman" 
          />
          <RoleButton 
            role="BIENNIAL_DIRECTOR" 
            current={activeRole} 
            onClick={setActiveRole} 
            icon={<Briefcase className="w-3.5 h-3.5" />} 
            label="Director" 
          />
          <RoleButton 
            role="PREP_COMMITTEE" 
            current={activeRole} 
            onClick={setActiveRole} 
            icon={<PenTool className="w-3.5 h-3.5" />} 
            label="Committee" 
          />
          <RoleButton 
            role="EDITORIAL" 
            current={activeRole} 
            onClick={setActiveRole} 
            icon={<Eye className="w-3.5 h-3.5" />} 
            label="Editorial" 
          />
          <RoleButton 
            role="HIP" 
            current={activeRole} 
            onClick={setActiveRole} 
            icon={<Globe className="w-3.5 h-3.5" />} 
            label="HIP" 
          />
          <RoleButton 
            role="COORDINATOR" 
            current={activeRole} 
            onClick={setActiveRole} 
            icon={<GitMerge className="w-3.5 h-3.5" />} 
            label="Coordinator" 
          />
          <RoleButton 
            role="ARTIST" 
            current={activeRole} 
            onClick={setActiveRole} 
            icon={<User className="w-3.5 h-3.5" />} 
            label="Artist" 
          />
          <RoleButton 
            role="PR_PROTOCOL" 
            current={activeRole} 
            onClick={setActiveRole} 
            icon={<ShieldCheck className="w-3.5 h-3.5" />} 
            label="PR & Protocol" 
          />
          <RoleButton 
            role="FINANCE" 
            current={activeRole} 
            onClick={setActiveRole} 
            icon={<Landmark className="w-3.5 h-3.5" />} 
            label="Finance" 
          />
          <div className="h-5 w-px bg-[#2C2A29] mx-1 shrink-0" />
          <RoleButton 
            role="ROLES" 
            current={activeRole} 
            onClick={setActiveRole} 
            icon={<RotateCcw className="w-3.5 h-3.5" />} 
            label="All Roles" 
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
            title="Toggle Presenter Architecture Mode (Ctrl+Shift+P / ⌘⇧P)"
            className="inline-flex items-center gap-1.5 rounded border border-[#2C2A29] bg-[#2C2A29] px-2.5 py-1.5 text-xs font-bold text-[#D9D2C5] shadow-xs transition-colors hover:bg-[#3D3A38] hover:text-white cursor-pointer"
          >
            <Compass className="h-3.5 w-3.5 text-[#8B4513]" />
            <span className="hidden sm:inline">Presenter Specs</span>
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


