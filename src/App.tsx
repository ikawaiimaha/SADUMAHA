import React, { useState, useEffect } from 'react';
import RoleSelection, { AppRole } from './components/RoleSelection';
import CommitteeThemeWorkspace, { CommitteeThemeDraft } from './components/CommitteeThemeWorkspace';
import ChairmanWorkspace, { ThemeItem } from './components/ChairmanWorkspace';
import HIPWorkspace, { TranslationStatus } from './components/HIPWorkspace';
import EditorialWorkspace, { ThemePolishStatus } from './components/EditorialWorkspace';
import DirectorWorkspace from './components/DirectorWorkspace';
import ArtistNominationForm, { NominatedArtistDossier } from './components/ArtistNominationForm';
import CoordinatorWorkspace from './components/CoordinatorWorkspace';
import ArtistPortalWorkspace from './components/ArtistPortalWorkspace';
import PRWorkspace from './components/PRWorkspace';
import FinanceWorkspace from './components/FinanceWorkspace';
import { PresenterDrawer } from './components/PresenterDrawer';
import { I18nProvider, useI18n } from './context/I18nContext';
import { BilateralContract, DisbursementRecord } from './types/contractStage6';
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
} from 'lucide-react';

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
  const { lang } = useI18n();
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

  const [currentRole, setCurrentRole] = useState<AppRole | null>(null);
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
  };

  const handleApproveArtist = (id: string) => {
    setNominatedArtists(prev =>
      prev.map(artist => (artist.id === id ? { ...artist, status: 'APPROVED' } : artist))
    );

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
        },
      ];
    });
  };

  // Stage 6: Bilateral Contracts & Disbursements State
  const [contracts, setContracts] = useState<BilateralContract[]>(INITIAL_CONTRACTS);
  const [disbursementHistory, setDisbursementHistory] = useState<DisbursementRecord[]>(INITIAL_DISBURSEMENTS);

  const handleDispatchContract = (
    contractId: string,
    productionCost: number,
    shippingTerms: string
  ) => {
    setContracts(prev => {
      const existing = prev.find(c => c.id === contractId);
      const targetArtist = nominatedArtists.find(
        a => a.id === (existing?.artistId || contractId.replace('contract-', ''))
      );

      const advance = Math.round(productionCost * 0.3);
      const delivery = Math.round(productionCost * 0.4);
      const installation = productionCost - advance - delivery;

      if (existing) {
        return prev.map(c =>
          c.id === contractId
            ? {
                ...c,
                productionCost,
                shippingTerms,
                status: 'SENT_TO_ARTIST',
                sentAt: new Date().toISOString(),
                tranches: {
                  ...c.tranches,
                  advanceAmount: advance,
                  deliveryAmount: delivery,
                  installationAmount: installation,
                },
              }
            : c
        );
      }

      if (!targetArtist) return prev;

      const newContract: BilateralContract = {
        id: contractId,
        artistId: targetArtist.id,
        artistName: targetArtist.artistName,
        artistCategory: targetArtist.artistCategory,
        nationality: targetArtist.nationality,
        medium: targetArtist.medium,
        proposedWorkTitle: targetArtist.proposedWorkTitle,
        productionCost,
        shippingTerms,
        cancellationClauseMandatory: true,
        status: 'SENT_TO_ARTIST',
        sentAt: new Date().toISOString(),
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
      };

      return [newContract, ...prev];
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

  const handleRequestAmendment = (contractId: string, notes: string) => {
    setContracts(prev =>
      prev.map(c =>
        c.id === contractId
          ? {
              ...c,
              status: 'CONTRACT_DISPUTED',
              amendmentNotes: notes,
            }
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


  return (
    <div className="min-h-screen bg-sadu-sand text-sadu-charcoal flex flex-col">
      {/* Persistent 'Switch Role' Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-sadu-gold/70 bg-sadu-paper/95 backdrop-blur-sm shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-sadu-brick text-xs font-bold text-white shadow-2xs">
              S
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-editorial text-base font-bold text-sadu-charcoal">
                  SADU
                </span>
                <span className="rounded bg-sadu-sand px-1.5 py-0.2 text-[10px] font-semibold text-sadu-muted">
                  Sharjah Calligraphy Biennial
                </span>
              </div>
              <p className="text-[11px] text-sadu-muted hidden sm:block">
                Institutional Governance Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Subtle presenter mode shortcut button */}
            <button
              type="button"
              onClick={() => setIsPresenterDrawerOpen(prev => !prev)}
              title="Toggle Presenter Architecture Mode (Ctrl+Shift+P / ⌘⇧P)"
              className="inline-flex items-center gap-1.5 rounded-md border border-sadu-gold/70 bg-sadu-sand px-2.5 py-1.5 text-xs font-bold text-sadu-charcoal shadow-2xs transition-colors hover:bg-sadu-gold/25 hover:border-sadu-brick cursor-pointer"
            >
              <Compass className="h-3.5 w-3.5 text-sadu-brick" />
              <span className="hidden sm:inline">Presenter</span>
              <kbd className="hidden lg:inline-block rounded border border-sadu-gold/60 bg-white/80 px-1 py-0.2 text-[9px] font-mono text-sadu-muted">
                ⌘⇧P
              </kbd>
            </button>

            {currentRole ? (
              <>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-sadu-gold/70 bg-sadu-sand px-3 py-1 text-xs font-semibold text-sadu-charcoal">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  Role: <strong className="font-bold">{currentRole}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentRole(null)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-sadu-gold bg-sadu-sand px-3 py-1.5 text-xs font-bold text-sadu-charcoal shadow-2xs transition-colors hover:bg-sadu-gold/25 hover:border-sadu-brick cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-sadu-brick" />
                  <span>Switch Role</span>
                </button>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sadu-gold/60 bg-sadu-sand px-3 py-1 text-[11px] font-semibold text-sadu-muted">
                <Users className="h-3.5 w-3.5" />
                Select Role to Proceed
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        {!currentRole && (
          <RoleSelection onSelectRole={role => setCurrentRole(role)} />
        )}

        {currentRole === 'Preparatory Committee' && (
          <div className="space-y-6">
            <div className="mx-auto flex max-w-5xl justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNominationFormOpen(false)}
                className={`rounded px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  !isNominationFormOpen
                    ? 'bg-sadu-brick text-white shadow-xs'
                    : 'bg-white border border-sadu-gold/60 text-sadu-charcoal hover:bg-sadu-gold/20'
                }`}
              >
                1. Theme Formulation Table
              </button>
              <button
                type="button"
                onClick={() => setIsNominationFormOpen(true)}
                className={`rounded px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  isNominationFormOpen
                    ? 'bg-sadu-brick text-white shadow-xs'
                    : 'bg-white border border-sadu-gold/60 text-sadu-charcoal hover:bg-sadu-gold/20'
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
              />
            )}
          </div>
        )}
        {currentRole === 'Biennial Director' && (
          <DirectorWorkspace
            submittedThemes={submittedThemes}
            onPresentToChairman={handlePresentToChairman}
            nominatedArtists={nominatedArtists}
            onVetoArtist={handleVetoArtist}
            onApproveArtist={handleApproveArtist}
            assignedBudget={assignedBudget}
            ratifiedTheme={ratifiedTheme}
            curatorialBrief={curatorialBrief}
            onBackToRoles={() => setCurrentRole(null)}
          />
        )}


        {currentRole === 'Chairman' && (
          <ChairmanWorkspace
            eventId={EVENT_ID}
            themes={submittedThemes}
            onBudgetAssigned={handleBudgetAssigned}
            themeStatus={themePolishStatus}
          />
        )}

        {currentRole === 'Editorial' && (
          <EditorialWorkspace
            approvedTheme={ratifiedTheme}
            themePolishStatus={themePolishStatus}
            onPublishOfficialTheme={handlePublishOfficialTheme}
            assignedBudget={assignedBudget}
            initialEssayArabic={themeEssayArabic}
            initialEssayEnglish={themeEssayEnglish}
            onBackToRoles={() => setCurrentRole(null)}
          />
        )}

        {currentRole === 'HIP' && (
          <HIPWorkspace
            guidelinesArabic={guidelinesArabic}
            translationStatus={translationStatus}
            onSubmitToEditorial={handleSubmitToEditorial}
            curatorialBrief={curatorialBrief}
            onUpdateCuratorialBrief={setCuratorialBrief}
            blocklist={blocklist}
            onUpdateBlocklist={setBlocklist}
            ratifiedTheme={ratifiedTheme}
            onBackToRoles={() => setCurrentRole(null)}
          />
        )}

        {currentRole === 'Coordinator' && (
          <CoordinatorWorkspace
            nominatedArtists={nominatedArtists}
            contracts={contracts}
            onNominateArtist={handleNominateArtist}
            onDispatchContract={handleDispatchContract}
            curatorialBrief={curatorialBrief}
            blocklist={blocklist}
            onBackToRoles={() => setCurrentRole(null)}
          />
        )}




        {currentRole === 'Artist' && (
          <ArtistPortalWorkspace
            contracts={contracts}
            onSignContract={handleSignContract}
            onRequestAmendment={handleRequestAmendment}
            onUploadPassport={handleUploadPassport}
            onUploadHighResArtwork={handleUploadHighResArtwork}
            onSaveBio={handleSaveBio}
            onBackToRoles={() => setCurrentRole(null)}
          />
        )}

        {currentRole === 'PR' && (
          <PRWorkspace
            contracts={contracts}
            onVerifyPassport={handleVerifyPassport}
            onVerifyHighResArtwork={handleVerifyHighResArtwork}
            onBackToRoles={() => setCurrentRole(null)}
          />
        )}

        {currentRole === 'Finance' && (
          <FinanceWorkspace
            assignedBudget={assignedBudget}
            contracts={contracts}
            disbursementHistory={disbursementHistory}
            onDisburseTranche={handleDisburseTranche}
            onBackToRoles={() => setCurrentRole(null)}
          />
        )}

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


