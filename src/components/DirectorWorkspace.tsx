import { scrollWorkspaceToTop } from '../utils/scrollWorkspaceToTop';
import { useMockupText } from '../i18n/useMockupText';
import { useI18n } from '../context/I18nContext';
import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  Wand2,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  XCircle,
  PieChart,
  FileText,
  Clock,
  Send,
  Eye,
  Award,
  Layers,
  Sparkles,
  Ban,
  FileCode,
  Download,
  AlertTriangle,
  X,
  ExternalLink,
  Scale,
  Filter,
  UserCheck,
} from 'lucide-react';
import { NominatedArtistDossier } from './ArtistNominationForm';
import { ThemeItem } from './ChairmanWorkspace';
import { CommitteeThemeDraft, isThemeBatchComplete } from './CommitteeThemeWorkspace';

export interface DirectorWorkspaceProps {
  /** The 3 theme proposals submitted by the Preparatory Committee */
  submittedThemes?: CommitteeThemeDraft[];
  /** Callback when Director presents the 3 themes (with director's notes) to the Chairman */
  onReturnToCommittee?: () => void;
  onPresentToChairman?: (themes: CommitteeThemeDraft[], notes?: Record<number, string>) => void;
  /** Nominated artist dossiers from Coordinators/Committee */
  nominatedArtists: NominatedArtistDossier[];
  /** Callback when Director vetoes an artist */
  onVetoArtist: (id: string, reason: string, notes?: string) => void;
  /** Callback when Director approves an artist */
  onApproveArtist?: (id: string) => void;
  /** Assigned budget locked by Chairman */
  assignedBudget?: number | null;
  /** Ratified theme */
  ratifiedTheme?: ThemeItem | null;
  /** Curatorial brief from HIP */
  curatorialBrief?: string;
  /** Optional callback to return to role selection */
  onAutoNavigate?: (role: string) => void;
  onBackToRoles?: () => void;
}

export const VETO_REASONS = [
  'Budget Exceeded',
  'Security/HIP Blocklist',
  'Curatorial Mismatch',
  'Administrative Directive',
];

const DEMO_DIRECTOR_NOTES = [
  "مفهوم قوي يتوافق مع رؤية الدائرة، نوصي بالتركيز على الجانب المعماري في المبررات لتسهيل التخصيص المالي.",
  "فكرة كلاسيكية ممتازة، لكنها تتطلب مساحات عرض تفاعلية لضمان جذب الجمهور الشاب.",
  "طرح فلسفي عميق ومناسب جداً لاستقطاب فنانين دوليين ذوي توجهات تجريدية معاصرة."
];

export const DirectorWorkspace: React.FC<DirectorWorkspaceProps> = ({
  submittedThemes,
  onPresentToChairman,
  onReturnToCommittee,
  nominatedArtists,
  onVetoArtist,
  onApproveArtist,
  assignedBudget,
  ratifiedTheme,
  curatorialBrief,
  onAutoNavigate,
  onBackToRoles,
}) => {
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { clearTimeout(navigationTimer.current); }, []);
  const tr = useMockupText();
  const { isAr } = useI18n();
  // Tabbed layout: Phase 1 (Theme Ratification Queue) or Phase 2 (Artist Veto & Balance Review)
  const [activeTab, setActiveTab] = useState<'phase1' | 'phase2'>('phase1');

  // Phase 1 State: Themes & Director's Notes
  const activeThemes = submittedThemes ?? [];
  const canPresentThemes = !ratifiedTheme && isThemeBatchComplete(activeThemes);
  const [directorNotes, setDirectorNotes] = useState<Record<number, string>>({});
  const [themesPresented, setThemesPresented] = useState<boolean>(false);

  // Phase 2 State: Filters, Veto Dialog & Document Preview
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'Emerging' | 'Established'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'VETOED' | 'APPROVED'>('ALL');

  const [activeVetoArtistId, setActiveVetoArtistId] = useState<string | null>(null);
  const [selectedVetoReason, setSelectedVetoReason] = useState<string>(VETO_REASONS[0]);
  const [vetoNotes, setVetoNotes] = useState<string>('');
  const [previewDoc, setPreviewDoc] = useState<{ title: string; type: 'cv' | 'mockup'; artistName: string } | null>(null);

  // Visual Analytics: Ratio calculation
  const totalArtists = nominatedArtists.length;
  const emergingArtists = nominatedArtists.filter(a => a.artistCategory === 'Emerging');
  const establishedArtists = nominatedArtists.filter(a => a.artistCategory === 'Established');

  const emergingCount = emergingArtists.length;
  const establishedCount = establishedArtists.length;

  const emergingPct = totalArtists > 0 ? Math.round((emergingCount / totalArtists) * 100) : 50;
  const establishedPct = totalArtists > 0 ? Math.round((establishedCount / totalArtists) * 100) : 50;

  const approvedCount = nominatedArtists.filter(a => a.status === 'APPROVED').length;
  const vetoedCount = nominatedArtists.filter(a => a.status === 'VETOED').length;

  const filteredArtists = useMemo(() => {
    return nominatedArtists.filter(artist => {
      const matchCat = filterCategory === 'ALL' || artist.artistCategory === filterCategory;
      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'PENDING' && artist.status === 'PENDING_DIRECTOR_REVIEW') ||
        (filterStatus === 'VETOED' && artist.status === 'VETOED') ||
        (filterStatus === 'APPROVED' && artist.status === 'APPROVED');
      return matchCat && matchStatus;
    });
  }, [nominatedArtists, filterCategory, filterStatus]);

  const handleAutoFillNotes = () => {
    if (!canPresentThemes || themesPresented) return;
    setDirectorNotes(Object.fromEntries(activeThemes.map((_, index) => [index, DEMO_DIRECTOR_NOTES[index]])));
  };

  const handleReturnThemes = () => {
    if (ratifiedTheme || activeThemes.length === 0 || !onReturnToCommittee) return;
    clearTimeout(navigationTimer.current);
    navigationTimer.current = undefined;
    setThemesPresented(false);
    setDirectorNotes({});
    onReturnToCommittee();
  };

  const handlePresentThemes = () => {
    if (!canPresentThemes) return;
    const updatedThemesWithNotes = activeThemes.map((theme, index) => ({
      ...theme,
      directorNotes: directorNotes[index] || '',
    }));
    onPresentToChairman?.(updatedThemesWithNotes, directorNotes);
    setThemesPresented(true);
    clearTimeout(navigationTimer.current);
    scrollWorkspaceToTop();
    navigationTimer.current = setTimeout(() => {
      onAutoNavigate?.('CHAIRMAN');
    }, 3500);
    setTimeout(() => setThemesPresented(false), 5000);
  };

  const handleConfirmVeto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVetoArtistId) return;
    onVetoArtist(activeVetoArtistId, selectedVetoReason, vetoNotes);
    setActiveVetoArtistId(null);
    setVetoNotes('');
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
            {themesPresented && (
              <div className="rounded-lg border-2 border-emerald-400 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="block font-bold">{tr("3 Themes Presented to Chairman Successfully!")}</strong>
                  <span>{tr("The workflow has officially moved to Chairman H.E. Abdullah Al Owais's dashboard for selection and budget locking.")}</span>
                </div>
              </div>
            )}
      {activeTab === 'phase1' && <div className="flex justify-end">
        <button type="button" onClick={handleAutoFillNotes} disabled={!canPresentThemes || themesPresented} className="inline-flex items-center gap-2 rounded-md border border-[#736357]/40 ps-3 pe-3 py-1.5 text-xs font-semibold text-[#736357] hover:border-[#8B261E] hover:text-[#8B261E] disabled:opacity-50 disabled:cursor-not-allowed">
          <Wand2 className="size-3.5" aria-hidden="true" />
          {isAr ? 'تعبئة ملاحظات الإدارة' : 'Auto-fill Notes'}
        </button>
      </div>}
      {/* Executive Header */}
      <div className="rounded-xl border border-sadu-gold bg-sadu-paper p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-sadu-gold/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sadu-brick text-white shadow-xs">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-brick uppercase tracking-wider border border-sadu-gold/60"> {tr("Biennial Directorate · Executive Gate")} </span>
                <span className="text-xs text-sadu-muted">{tr("Stage 1 & Stage 4")}</span>
              </div>
              <h1 className="font-editorial text-2xl font-bold text-sadu-charcoal sm:text-3xl mt-1">
                {isAr ? 'مساحة عمل مدير الملتقى · الأستاذ محمد إبراهيم القصير' : 'Biennial Director Workspace · Mohammed Al Qaseer'}
              </h1>
              <p className="text-xs font-semibold text-sadu-brick" dir="rtl">
                مدير البينالي · اعتماد مقترحات الثيم ومراجعة توازن الفنانين (حق النقض)
              </p>
            </div>
          </div>
          {onBackToRoles && (
            <button
              type="button"
              onClick={onBackToRoles}
              className="rounded-md border border-sadu-gold bg-sadu-sand px-3 py-1.5 text-xs font-bold text-sadu-charcoal hover:bg-sadu-gold/20 cursor-pointer"
            > {tr("Back to Role Selection")} </button>
          )}
        </div>

        {/* Operational Phase Tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('phase1')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'phase1'
                ? 'bg-sadu-brick text-white shadow-xs ring-2 ring-sadu-brick/30'
                : 'bg-white border border-sadu-gold/60 text-sadu-charcoal hover:bg-sadu-gold/20'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>{tr("Phase 1: Theme Ratification Queue (Stage 1)")}</span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
              activeTab === 'phase1' ? 'bg-white/20 text-white' : 'bg-sadu-sand text-sadu-brick'
            }`}> {tr("3 Proposals")} </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('phase2')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'phase2'
                ? 'bg-sadu-brick text-white shadow-xs ring-2 ring-sadu-brick/30'
                : 'bg-white border border-sadu-gold/60 text-sadu-charcoal hover:bg-sadu-gold/20'
            }`}
          >
            <PieChart className="h-4 w-4" />
            <span>{tr("Phase 2: Artist Veto & Balance Review (Stage 4)")}</span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
              activeTab === 'phase2' ? 'bg-white/20 text-white' : 'bg-sadu-sand text-sadu-charcoal'
            }`}>
              {totalArtists} {tr("Dossiers")} </span>
          </button>
        </div>
      </div>

      {/* PHASE 1: THEME RATIFICATION QUEUE (STAGE 1) */}
      {activeTab === 'phase1' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-sadu-gold bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-sadu-gold/30 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-sadu-brick" />
                <div>
                  <h2 className="font-editorial text-lg font-bold text-sadu-charcoal"> {tr("Theme Ratification Queue (Stage 1 Directorate Review)")} </h2>
                  <p className="text-xs text-sadu-muted"> {tr("Evaluate 3 theme proposals formulated by the Preparatory Committee before formal escalation to the Chairman")} </p>
                </div>
              </div>
              <span className="rounded-full bg-sadu-sand px-3 py-1 text-xs font-bold text-sadu-brick border border-sadu-gold/60"> {tr("3 Candidate Themes")} </span>
            </div>

            <p className="text-xs text-sadu-muted leading-relaxed"> {tr("As Biennial Director, Mohammed Al Qaseer reviews the curatorial rigor of the 3 candidate proposals. You may append optional Directorate Notes to each proposal prior to presenting the set to Chairman H.E. Abdullah Al Owais for executive selection and budget locking.")} </p>

            {/* 3 Theme Proposals Cards Grid */}
            <div className="grid gap-6 md:grid-cols-3">
              {activeThemes.map((theme, index) => (
                <div
                  key={index}
                  className="flex flex-col justify-between rounded-xl border border-sadu-gold/60 bg-white p-5 shadow-xs transition-shadow hover:shadow-md hover:border-sadu-brick/60 space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-sadu-gold/30 pb-2">
                      <span className="rounded bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-charcoal"> {tr("Proposal Candidate")} {index + 1}
                      </span>
                      <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9px] font-bold"> {tr("Rigorously Defended")} </span>
                    </div>

                    <div>
                      <h3 className="font-editorial text-base font-bold text-sadu-charcoal">
                        {isAr ? theme.arabicName : (theme.englishName || theme.arabicName)}
                      </h3>
                      <p hidden={isAr} dir="rtl" className="font-editorial text-base font-semibold text-sadu-brick pt-0.5">
                        {theme.arabicName}
                      </p>
                    </div>

                    <div className="space-y-2 border-t border-sadu-gold/20 pt-2 text-[11px]">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sadu-muted block"> {tr("Aesthetic Framework")} </span>
                        <p className="text-sadu-charcoal/90 leading-relaxed bg-sadu-paper/50 p-2 rounded border border-sadu-gold/30">
                          {tr(theme.aestheticFramework)}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sadu-muted block"> {tr("Contemporary Relevance")} </span>
                        <p className="text-sadu-charcoal/90 leading-relaxed bg-sadu-paper/50 p-2 rounded border border-sadu-gold/30">
                          {tr(theme.contemporaryRelevance)}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sadu-muted block"> {tr("Curatorial Justification")} </span>
                        <p className="text-sadu-charcoal/90 leading-relaxed bg-sadu-paper/50 p-2 rounded border border-sadu-gold/30">
                          {tr(theme.curatorialJustification || theme.definition)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Director's Note Text Area */}
                  <div className="border-t border-sadu-gold/30 pt-3 space-y-1">
                    <label
                      htmlFor={`director-note-${index}`}
                      className="block text-[11px] font-bold text-sadu-charcoal"
                    > {tr("Director's Note (Optional Executive Comment)")} </label>
                    <textarea
                      id={`director-note-${index}`}
                      rows={2}
                      value={tr(directorNotes[index] || '')}
                      onChange={e => setDirectorNotes({ ...directorNotes, [index]: e.target.value })}
                      placeholder={tr("Add executive remarks for Chairman Al Owais...")}
                      className="w-full rounded-md border border-sadu-gold/60 bg-sadu-sand/20 p-2 text-xs text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Present to Chairman Action Gate */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-sadu-gold/40 pt-5">
              <span className="text-xs text-sadu-muted"> {tr("Presenting will submit all 3 evaluated proposals and Directorate notes directly to Chairman H.E. Abdullah Al Owais's executive workspace.")} </span>

              <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={handleReturnThemes} disabled={Boolean(ratifiedTheme) || activeThemes.length === 0 || !onReturnToCommittee} className="inline-flex items-center justify-center gap-2 rounded-md border border-[#8B261E] ps-4 pe-4 py-3 text-xs font-bold text-[#8B261E] hover:bg-[#8B261E]/5 disabled:opacity-50 disabled:cursor-not-allowed">
                {isAr ? 'إعادة المقترحات للجنة التحضيرية' : 'Return to Preparatory Committee'}
              </button>
              <button
                type="button"
                onClick={handlePresentThemes}
                disabled={!canPresentThemes}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-sadu-brick px-6 py-3 text-xs font-bold text-white shadow-xs transition-colors hover:bg-sadu-brick-dark cursor-pointer shrink-0"
              >
                <Send className="h-4 w-4" />
                <span>{tr("Present 3 Themes to Chairman")}</span>
              </button>
              </div>
            </div>


          </div>
        </div>
      )}

      {/* PHASE 2: ARTIST BALANCE DASHBOARD (STAGE 4) */}
      {activeTab === 'phase2' && (
        <div className="space-y-6">
          {/* Director's Balance Dashboard: Visual Ratio of Emerging vs Established */}
          <div className="rounded-xl border border-sadu-gold bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-sadu-gold/30 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-sadu-brick" />
            <div>
              <h2 className="font-editorial text-lg font-bold text-sadu-charcoal">{tr("Curatorial Cohort Balance Dashboard")}</h2>
              <p className="text-xs text-sadu-muted">{tr("Visual ratio of Emerging to Established artists in current candidate pool")}</p>
            </div>
          </div>
          <span className="rounded bg-sadu-sand px-3 py-1 text-xs font-bold text-sadu-charcoal border border-sadu-gold/60"> {tr("Total Nominated Pool:")} {totalArtists} {tr("Artists")} </span>
        </div>

        {/* Tailwind Grid Summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-sadu-gold/50 bg-sadu-sand/40 p-3">
            <span className="text-[10px] font-bold text-sadu-muted uppercase block">{tr("Emerging Artists")}</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-editorial text-xl font-bold text-sadu-brick">{emergingCount}</span>
              <span className="text-xs font-semibold text-sadu-muted">({emergingPct}%)</span>
            </div>
          </div>

          <div className="rounded-lg border border-sadu-gold/50 bg-sadu-sand/40 p-3">
            <span className="text-[10px] font-bold text-sadu-muted uppercase block">{tr("Established Artists")}</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-editorial text-xl font-bold text-sadu-charcoal">{establishedCount}</span>
              <span className="text-xs font-semibold text-sadu-muted">({establishedPct}%)</span>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-300 bg-emerald-50/60 p-3">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">{tr("Approved for Scope")}</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-editorial text-xl font-bold text-emerald-900">{approvedCount}</span>
              <span className="text-xs font-semibold text-emerald-700">{tr("active")}</span>
            </div>
          </div>

          <div className="rounded-lg border border-red-300 bg-red-50/60 p-3">
            <span className="text-[10px] font-bold text-red-800 uppercase block">{tr("Vetoed / Rejected")}</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-editorial text-xl font-bold text-red-900">{vetoedCount}</span>
              <span className="text-xs font-semibold text-red-700">{tr("returned")}</span>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1.5 rounded-lg border border-sadu-gold/40 bg-sadu-paper/60 p-3">
          <div className="flex items-center justify-between text-xs font-bold text-sadu-charcoal">
            <span className="text-sadu-brick">{tr("Emerging:")} {emergingPct}% ({emergingCount})</span>
            <span className="text-[10px] text-sadu-muted font-normal">{tr("Target: 40% - 60% Balance")}</span>
            <span className="text-sadu-charcoal">{tr("Established:")} {establishedPct}% ({establishedCount})</span>
          </div>

          <div className="h-3.5 w-full overflow-hidden rounded-full bg-sadu-sand border border-sadu-gold/60 flex">
            <div style={{ width: `${totalArtists > 0 ? emergingPct : 50}%` }} className="bg-sadu-brick transition-all duration-500" />
            <div style={{ width: `${totalArtists > 0 ? establishedPct : 50}%` }} className="bg-sadu-charcoal transition-all duration-500" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-sadu-gold/50 bg-white p-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-sadu-muted" />
          <span className="font-bold text-sadu-charcoal">{tr("Category:")}</span>
          {(['ALL', 'Emerging', 'Established'] as const).map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                filterCategory === cat
                  ? 'bg-sadu-brick text-white shadow-2xs'
                  : 'bg-sadu-sand text-sadu-charcoal hover:bg-sadu-gold/20'
              }`}
            >
              {tr(cat === 'ALL' ? 'All' : cat)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-sadu-charcoal">{tr("Status:")}</span>
          {(['ALL', 'PENDING', 'VETOED', 'APPROVED'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                filterStatus === st
                  ? 'bg-sadu-charcoal text-white shadow-2xs'
                  : 'bg-sadu-sand text-sadu-charcoal hover:bg-sadu-gold/20'
              }`}
            >
              {st === 'ALL' ? tr('All') : st === 'PENDING' ? tr('Pending') : st === 'VETOED' ? tr('Vetoed') : tr('Approved')}
            </button>
          ))}
        </div>
      </div>

      {/* Artist Dossier List */}
      <div className="space-y-4">
        {filteredArtists.length === 0 ? (
          <div className="rounded-xl border border-dashed border-sadu-gold/70 bg-white p-8 text-center text-xs text-sadu-muted">
            <UserCheck className="mx-auto h-8 w-8 text-sadu-muted mb-2" />
            <p className="font-editorial text-base font-bold text-sadu-charcoal">{tr("No Candidate Dossiers Match Filters")}</p>
            <p className="mt-1">{tr("Nominate artists through the Preparatory Committee or Coordinator portal.")}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredArtists.map(artist => (
              <div
                key={artist.id}
                className={`rounded-xl border bg-white p-5 shadow-xs flex flex-col justify-between ${
                  artist.status === 'VETOED'
                    ? 'border-red-300 bg-red-50/20'
                    : artist.status === 'APPROVED'
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : 'border-sadu-gold'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-sadu-gold/20 pb-2">
                    <div>
                      <h3 className="font-editorial text-lg font-bold text-sadu-charcoal">{tr(artist.artistName)}</h3>
                      <span className="text-[11px] text-sadu-muted block">
                        {tr(artist.nationality)} &middot; {tr(artist.medium)}
                      </span>
                    </div>

                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        artist.artistCategory === 'Emerging'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-sadu-charcoal text-white'
                      }`}
                    >
                      {tr(artist.artistCategory)}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <span className="font-bold text-sadu-charcoal block">{tr("Proposed Work:")}</span>
                    <p className="text-sadu-muted italic">"{tr(artist.proposedWorkTitle)}"</p>
                  </div>

                  {/* Links/Icons to view PDF CV and Mockup Files */}
                  <div className="flex flex-wrap gap-2 pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc({
                        title: artist.cvFileName || 'Artist_CV.pdf',
                        type: 'cv',
                        artistName: artist.artistName,
                      })}
                      className="inline-flex items-center gap-1.5 rounded-md border border-sadu-gold/60 bg-sadu-sand/40 px-2.5 py-1 text-[11px] font-semibold text-sadu-charcoal hover:bg-sadu-gold/20 hover:border-sadu-brick cursor-pointer transition-colors"
                      title={tr("View PDF CV")}
                    >
                      <FileText className="h-3.5 w-3.5 text-sadu-brick" />
                      <span>{tr("CV (PDF)")}</span>
                      <ExternalLink className="h-3 w-3 text-sadu-muted" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewDoc({
                        title: `${artist.proposedWorkTitle} - Sketches & Mockups`,
                        type: 'mockup',
                        artistName: artist.artistName,
                      })}
                      className="inline-flex items-center gap-1.5 rounded-md border border-sadu-gold/60 bg-sadu-sand/40 px-2.5 py-1 text-[11px] font-semibold text-sadu-charcoal hover:bg-sadu-gold/20 hover:border-sadu-brick cursor-pointer transition-colors"
                      title={tr("View Mockup Files")}
                    >
                      <FileCode className="h-3.5 w-3.5 text-sadu-ochre" />
                      <span>{tr("Mockup Files (")}{artist.mockupCount})</span>
                      <ExternalLink className="h-3 w-3 text-sadu-muted" />
                    </button>
                  </div>

                  {/* Status Indicator */}
                  {artist.status === 'VETOED' && (
                    <div className="rounded border border-red-300 bg-red-50 p-2.5 text-xs text-red-900 space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Ban className="h-3.5 w-3.5 text-red-600" />
                        <span>{tr("Director Veto Enacted — Alerted Coordinator")}</span>
                      </div>
                      <p className="text-[11px] text-red-800"> {tr("Reason:")} <strong>{tr(artist.vetoReason || 'Administrative Directive')}</strong>
                        {artist.vetoNotes && ` (${artist.vetoNotes})`}
                      </p>
                    </div>
                  )}

                  {artist.status === 'APPROVED' && (
                    <div className="rounded border border-emerald-300 bg-emerald-50 p-2 text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{tr("Approved by Director · Ready for Stage 5 Contracting")}</span>
                    </div>
                  )}
                </div>

                {/* Director Actions: Approve (Green) & Veto / Reject (Red) */}
                <div className="mt-4 border-t border-sadu-gold/30 pt-3 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={artist.status === 'APPROVED'}
                    onClick={() => onApproveArtist?.(artist.id)}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                      artist.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800 cursor-not-allowed border border-emerald-300'
                        : 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs'
                    }`}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>{artist.status === 'APPROVED' ? tr('Approved') : tr('Approve')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveVetoArtistId(artist.id);
                      setSelectedVetoReason(VETO_REASONS[0]);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-red-700 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-800 transition-colors cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>{artist.status === 'VETOED' ? tr('Edit Veto') : tr('Veto / Reject')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
      )}

      {/* Document Preview Modal for PDF CV & Mockups */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border-2 border-sadu-gold bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-sadu-gold/30 pb-3">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-sadu-brick" />
                <div>
                  <h4 className="font-editorial text-base font-bold text-sadu-charcoal">{previewDoc.type === 'cv' ? previewDoc.title : `${tr(previewDoc.artistName)} — ${tr('Sketches & Mockups')}`}</h4>
                  <span className="text-xs text-sadu-muted">{tr("Candidate:")} {tr(previewDoc.artistName)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-sadu-muted hover:text-sadu-charcoal cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg border border-dashed border-sadu-gold/60 bg-sadu-sand/30 p-8 text-center space-y-2">
              <FileText className="mx-auto h-12 w-12 text-sadu-brick/70" />
              <p className="font-bold text-xs text-sadu-charcoal">{previewDoc.type === 'cv' ? previewDoc.title : `${tr(previewDoc.artistName)} — ${tr('Sketches & Mockups')}`}</p>
              <p className="text-[11px] text-sadu-muted">
                {previewDoc.type === 'cv' ? tr('Official PDF Curriculum Vitae with verified exhibition history, international collections, and academic credentials.') : tr('High-resolution sketches, 3D spatial renders, and material specifications for the proposed biennial installation.')}
              </p>
              <span className="inline-block rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold"> {tr("Verified Multaqa Attachment")} </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-md bg-sadu-charcoal px-4 py-2 text-xs font-bold text-white hover:bg-black cursor-pointer"
              > {tr("Close Preview")} </button>
            </div>
          </div>
        </div>
      )}


      {/* Veto Reason Modal Dialog */}
      {activeVetoArtistId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border-2 border-red-500 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-sadu-gold/30 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-700">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-editorial text-lg font-bold text-sadu-charcoal"> {tr("Executive Veto Enforcement")} </h3>
                <p className="text-xs text-sadu-muted"> {tr("Mohammed Al Qaseer · Absolute Directorate Authority")} </p>
              </div>
            </div>

            <p className="text-xs text-sadu-muted leading-relaxed"> {tr("Vetoing an artist candidate immediately flags the dossier as rejected and routes the feedback reason back to the Coordinators.")} </p>

            <form onSubmit={handleConfirmVeto} className="space-y-4">
              <div>
                <label htmlFor="veto-reason-select" className="block text-xs font-bold text-sadu-charcoal uppercase tracking-wider mb-1"> {tr("Select Veto Reason")} <span className="text-red-600">*</span>
                </label>
                <select
                  id="veto-reason-select"
                  required
                  value={selectedVetoReason}
                  onChange={e => setSelectedVetoReason(e.target.value)}
                  className="w-full rounded-md border border-sadu-gold/70 bg-white p-2 text-xs font-semibold text-sadu-charcoal focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  {VETO_REASONS.map(reason => (
                    <option key={reason} value={reason}>
                      {tr(reason)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="veto-notes-textarea" className="block text-xs font-bold text-sadu-charcoal uppercase tracking-wider mb-1"> {tr("Director Directorate Notes (Routed to Coordinator)")} </label>
                <textarea
                  id="veto-notes-textarea"
                  rows={3}
                  value={vetoNotes}
                  onChange={e => setVetoNotes(e.target.value)}
                  placeholder={tr("Provide specific justification (e.g. proposed installation exceeds gallery ceiling thresholds or budget allocation)...")}
                  className="w-full rounded-md border border-sadu-gold/60 p-2 text-xs text-sadu-charcoal focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-sadu-gold/30">
                <button
                  type="button"
                  onClick={() => {
                    setActiveVetoArtistId(null);
                    setVetoNotes('');
                  }}
                  className="rounded-md border border-sadu-gold/60 bg-sadu-sand px-3 py-1.5 text-xs font-bold text-sadu-charcoal hover:bg-sadu-gold/20 cursor-pointer"
                > {tr("Cancel")} </button>
                <button
                  type="submit"
                  className="rounded-md bg-red-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-800 shadow-xs cursor-pointer"
                > {tr("Confirm Executive Veto")} </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectorWorkspace;
