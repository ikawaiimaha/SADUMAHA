import React, { useState } from 'react';
import RoleSelection, { AppRole } from './components/RoleSelection';
import CommitteeThemeWorkspace, { CommitteeThemeDraft } from './components/CommitteeThemeWorkspace';
import ChairmanWorkspace, { ThemeItem } from './components/ChairmanWorkspace';
import HIPWorkspace, { TranslationStatus } from './components/HIPWorkspace';
import EditorialWorkspace from './components/EditorialWorkspace';
import DirectorWorkspace from './components/DirectorWorkspace';
import ArtistNominationForm, { NominatedArtistDossier } from './components/ArtistNominationForm';
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

function App() {
  const [currentRole, setCurrentRole] = useState<AppRole | null>(null);
  const [submittedThemes, setSubmittedThemes] = useState<CommitteeThemeDraft[] | undefined>(undefined);
  const [assignedBudget, setAssignedBudget] = useState<number | null>(null);
  const [ratifiedTheme, setRatifiedTheme] = useState<ThemeItem | null>(null);

  // Stage 2: HIP & Editorial Translation Routing State
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

        {currentRole === 'Chairman' && (
          <ChairmanWorkspace
            eventId={EVENT_ID}
            themes={submittedThemes}
            onBudgetAssigned={handleBudgetAssigned}
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

        {currentRole === 'Editorial' && (
          <EditorialWorkspace
            guidelinesArabic={guidelinesArabic}
            guidelinesEnglish={guidelinesEnglish}
            translationStatus={translationStatus}
            onPublishBrief={handlePublishBrief}
            onUpdateGuidelinesEnglish={setGuidelinesEnglish}
            ratifiedTheme={ratifiedTheme}
            onBackToRoles={() => setCurrentRole(null)}
          />
        )}

        {currentRole === 'Coordinator' && (
          <div className="mx-auto w-full max-w-5xl space-y-6">
            {/* Coordinator Header */}
            <div className="rounded-xl border border-sadu-gold bg-sadu-paper p-6 shadow-xs">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-sadu-gold/40 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sadu-ochre text-white shadow-xs">
                    <GitMerge className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="rounded bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-ochre uppercase tracking-wider border border-sadu-gold/60">
                      Stage 3 & 5 · Program Operations
                    </span>
                    <h2 className="font-editorial text-2xl font-bold text-sadu-charcoal sm:text-3xl mt-1">
                      Coordinator Workspace
                    </h2>
                    <p className="text-xs font-semibold text-sadu-ochre" dir="rtl">
                      المنسق العام · إعداد الملفات والعقود
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNominationFormOpen(!isNominationFormOpen)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-sadu-brick px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-sadu-brick-dark cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isNominationFormOpen ? 'View Dossiers' : 'Nominate Artist (Dossier)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentRole(null)}
                    className="rounded-md border border-sadu-gold bg-sadu-sand px-3 py-2 text-xs font-bold text-sadu-charcoal hover:bg-sadu-gold/20 cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </div>

              {/* Curatorial Guidelines Status / Published Brief */}
              <div className="mt-4 rounded-md border border-sadu-gold/50 bg-white p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sadu-charcoal flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-sadu-brick" />
                    Curatorial Guidelines (Editorial Routing)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                      translationStatus === 'PUBLISHED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {translationStatus === 'PUBLISHED' ? 'Bilingual Brief Published' : 'Status: Pending Editorial Translation'}
                    </span>
                    <span className="text-[10px] text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      {blocklist.length} Blocklist Tags Enforced
                    </span>
                  </div>
                </div>

                {translationStatus === 'PUBLISHED' ? (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-sadu-charcoal font-medium leading-relaxed">{guidelinesEnglish}</p>
                    <p dir="rtl" className="text-sadu-brick text-xs font-semibold leading-relaxed border-t border-sadu-gold/30 pt-1">
                      {guidelinesArabic}
                    </p>
                  </div>
                ) : (
                  <div className="rounded bg-amber-50 p-2 text-amber-900 border border-amber-200 text-[11px] flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                    <span>
                      The HIP has submitted Arabic guidelines to the Editorial Department. Coordinators will receive the official accredited English translation once published.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Dossier Upload Form or Pool View */}
            {isNominationFormOpen ? (
              <ArtistNominationForm
                curatorialBrief={curatorialBrief}
                blocklist={blocklist}
                onSubmitNomination={handleNominateArtist}
                submittedBy="Coordinator"
                onCancel={() => setIsNominationFormOpen(false)}
              />
            ) : (
              <div className="rounded-xl border border-sadu-gold bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-sadu-gold/30 pb-3">
                  <div>
                    <h3 className="font-editorial text-lg font-bold text-sadu-charcoal">
                      Candidate Dossiers ({nominatedArtists.length})
                    </h3>
                    <p className="text-xs text-sadu-muted">
                      Status and Director Mohammed Al Qaseer's reviews
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-300">
                    {nominatedArtists.filter(a => a.status === 'APPROVED').length} Ready for Stage 5 Contracts
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {nominatedArtists.map(artist => (
                    <div
                      key={artist.id}
                      className={`rounded-lg border p-4 text-xs space-y-2 ${
                        artist.status === 'VETOED'
                          ? 'border-red-300 bg-red-50/40'
                          : artist.status === 'APPROVED'
                          ? 'border-emerald-300 bg-emerald-50/30'
                          : 'border-sadu-gold/60 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <strong className="text-sm font-bold text-sadu-charcoal block">{artist.artistName}</strong>
                          <span className="text-[11px] text-sadu-muted">{artist.nationality} &middot; {artist.medium}</span>
                        </div>
                        <span className={`rounded px-2 py-0.5 text-[9px] font-bold ${
                          artist.artistCategory === 'Emerging' ? 'bg-amber-100 text-amber-900' : 'bg-sadu-charcoal text-white'
                        }`}>
                          {artist.artistCategory}
                        </span>
                      </div>

                      <p className="text-[11px] text-sadu-muted italic">"{artist.proposedWorkTitle}"</p>

                      {artist.status === 'VETOED' && (
                        <div className="rounded bg-red-100/90 p-2 text-red-900 border border-red-300 text-[11px]">
                          <strong className="block text-red-950 font-bold flex items-center gap-1">
                            <Ban className="h-3.5 w-3.5 text-red-700" /> Vetoed by Biennial Director
                          </strong>
                          <span className="mt-0.5 block">Reason: <strong>{artist.vetoReason}</strong></span>
                          {artist.vetoNotes && <p className="mt-0.5 text-[10px] text-red-800">Notes: {artist.vetoNotes}</p>}
                        </div>
                      )}

                      {artist.status === 'APPROVED' && (
                        <div className="rounded bg-emerald-100/80 p-2 text-emerald-900 border border-emerald-300 text-[11px] flex items-center justify-between">
                          <span className="font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-700" /> Stage 5 Contract Ready
                          </span>
                          <span className="text-[10px] text-emerald-800 font-bold">Approved</span>
                        </div>
                      )}

                      {artist.status === 'PENDING_DIRECTOR_REVIEW' && (
                        <div className="rounded bg-amber-50 p-2 text-amber-900 border border-amber-200 text-[11px] flex items-center gap-1">
                          <Clock className="h-3 w-3 text-amber-700" />
                          <span>Awaiting Director Al Qaseer's Balance Review</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}


        {currentRole === 'Artist' && (
          <div className="mx-auto w-full max-w-5xl rounded-lg border border-sadu-gold bg-sadu-paper p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-sadu-gold/40 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sadu-ink/15 text-sadu-ink">
                <User className="h-5 w-5" />
              </div>
              <div>
                <span className="rounded bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-ink uppercase tracking-wider border border-sadu-gold/60">
                  Stage 5 · External Contributor
                </span>
                <h2 className="font-editorial text-xl font-bold text-sadu-charcoal mt-0.5">
                  Artist &middot; Participant Portal (الفنان)
                </h2>
                <p className="text-xs text-sadu-muted">
                  Contract Terms Approval, Passport Verification & High-Res Artwork Files
                </p>
              </div>
            </div>

            <div className="rounded-md border border-sadu-gold/60 bg-white p-5 text-sm space-y-3">
              <div className="flex items-center gap-2 text-sadu-ink font-semibold">
                <User className="h-4 w-4" />
                <span>Multaqa Artist Intake & Participation Confirmation</span>
              </div>
              <p className="text-xs text-sadu-muted leading-relaxed">
                Invited and approved artists review bespoke bilateral contracts (production allowances, shipping terms),
                confirm participation terms, and securely upload official passports and 300 DPI print-ready artwork files for catalog publishing.
              </p>

              <div className="rounded-md border border-sadu-gold/40 bg-sadu-sand/30 p-3 text-xs">
                <span className="font-bold text-sadu-charcoal block mb-1">Approved Nominated Artists in Pool:</span>
                <div className="flex flex-wrap gap-2">
                  {nominatedArtists.filter(a => a.status === 'APPROVED').map(a => (
                    <span key={a.id} className="rounded bg-white px-2 py-1 border border-sadu-gold/60 text-sadu-charcoal font-semibold">
                      {a.artistName} ({a.artistCategory})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCurrentRole(null)}
                className="rounded-md border border-sadu-gold bg-sadu-sand px-4 py-2 text-xs font-bold text-sadu-charcoal hover:bg-sadu-gold/20 cursor-pointer"
              >
                Back to Role Selection
              </button>
            </div>
          </div>
        )}

        {currentRole === 'PR' && (
          <div className="mx-auto w-full max-w-5xl rounded-lg border border-sadu-gold bg-sadu-paper p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-sadu-gold/40 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sadu-brick/15 text-sadu-brick">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <span className="rounded bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-brick uppercase tracking-wider border border-sadu-gold/60">
                  Stage 5 · Protocol & Logistics
                </span>
                <h2 className="font-editorial text-xl font-bold text-sadu-charcoal mt-0.5">
                  PR & Protocol Workspace (التشريفات)
                </h2>
                <p className="text-xs text-sadu-muted">
                  Passport Verification, Catalog Print Quality & VIP Hospitality
                </p>
              </div>
            </div>

            <div className="rounded-md border border-sadu-gold/60 bg-white p-5 text-sm space-y-3">
              <div className="flex items-center gap-2 text-sadu-brick font-semibold">
                <FileCheck className="h-4 w-4" />
                <span>Verification Authority for Approved Artists</span>
              </div>
              <p className="text-xs text-sadu-muted leading-relaxed">
                PR (التشريفات) extracts dossier records, verifies passport details for visa facilitation, checks print-ready 300 DPI high-resolution files for exhibition catalog publishing, and coordinates delegation hospitality.
              </p>

              <div className="grid gap-2 sm:grid-cols-2 pt-1 text-xs">
                {nominatedArtists.filter(a => a.status === 'APPROVED').map(a => (
                  <div key={a.id} className="rounded border border-emerald-300 bg-emerald-50/60 p-2.5 flex items-center justify-between">
                    <div>
                      <strong className="block text-emerald-950 font-bold">{a.artistName}</strong>
                      <span className="text-[10px] text-emerald-800">{a.nationality} &middot; {a.medium}</span>
                    </div>
                    <span className="rounded bg-emerald-700 px-2 py-0.5 text-[9px] font-bold text-white uppercase">
                      Passport & Print Verified
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCurrentRole(null)}
                className="rounded-md border border-sadu-gold bg-sadu-sand px-4 py-2 text-xs font-bold text-sadu-charcoal hover:bg-sadu-gold/20 cursor-pointer"
              >
                Back to Role Selection
              </button>
            </div>
          </div>
        )}

        {currentRole === 'Finance' && (
          <div className="mx-auto w-full max-w-5xl rounded-lg border border-sadu-gold bg-sadu-paper p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-sadu-gold/40 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sadu-ochre/15 text-sadu-ochre">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <span className="rounded bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-ochre uppercase tracking-wider border border-sadu-gold/60">
                  Stage 5 · Legal & Budget Execution
                </span>
                <h2 className="font-editorial text-xl font-bold text-sadu-charcoal mt-0.5">
                  Finance Workspace (المالية)
                </h2>
                <p className="text-xs text-sadu-muted">
                  Bilateral Contracts Execution & Milestone Tranche Disbursements
                </p>
              </div>
            </div>

            <div className="rounded-md border border-sadu-gold/60 bg-white p-5 text-sm space-y-3">
              {assignedBudget ? (
                <>
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Budget Appropriated: AED {assignedBudget.toLocaleString()} (Authority Transferred)</span>
                  </div>
                  <p className="text-xs text-sadu-muted leading-relaxed">
                    Chairman Al Owais has officially authorized the budget. Finance (المالية) is empowered
                    to generate bespoke bilateral contracts and disburse payment tranches (Advance 30%, Delivery 40%, Installation 30%) for approved artists.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-amber-800 font-semibold">
                    <Lock className="h-4 w-4" />
                    <span>Financial Dispatches Locked &middot; Awaiting Chairman Budget Authorization</span>
                  </div>
                  <p className="text-xs text-sadu-muted leading-relaxed">
                    Tranche disbursement remains locked until Chairman Al Owais approves the theme and assigns the overarching budget.
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCurrentRole(null)}
                className="rounded-md border border-sadu-gold bg-sadu-sand px-4 py-2 text-xs font-bold text-sadu-charcoal hover:bg-sadu-gold/20 cursor-pointer"
              >
                Back to Role Selection
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;


