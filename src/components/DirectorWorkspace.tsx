import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Ban,
  UserCheck,
  Sparkles,
  Filter,
  FileText,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { NominatedArtistDossier } from './ArtistNominationForm';
import { ThemeItem } from './ChairmanWorkspace';

export interface DirectorWorkspaceProps {
  nominatedArtists: NominatedArtistDossier[];
  onVetoArtist: (id: string, reason: string, notes?: string) => void;
  onApproveArtist?: (id: string) => void;
  assignedBudget?: number | null;
  ratifiedTheme?: ThemeItem | null;
  curatorialBrief?: string;
  onBackToRoles?: () => void;
}

export const VETO_REASONS = [
  'Budget / Cost Feasibility',
  'Security / Regulatory Directives',
  'Curatorial Mismatch with Theme',
  'Administrative / Logistics Constraints',
];

export const DirectorWorkspace: React.FC<DirectorWorkspaceProps> = ({
  nominatedArtists,
  onVetoArtist,
  onApproveArtist,
  assignedBudget,
  ratifiedTheme,
  curatorialBrief,
  onBackToRoles,
}) => {
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'Emerging' | 'Established'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'VETOED' | 'APPROVED'>('ALL');

  // Veto Dialog State
  const [activeVetoArtistId, setActiveVetoArtistId] = useState<string | null>(null);
  const [selectedVetoReason, setSelectedVetoReason] = useState<string>(VETO_REASONS[0]);
  const [vetoNotes, setVetoNotes] = useState<string>('');

  // Ratio and balance calculation
  const total = nominatedArtists.length;
  const emergingCount = nominatedArtists.filter(a => a.artistCategory === 'Emerging').length;
  const establishedCount = nominatedArtists.filter(a => a.artistCategory === 'Established').length;

  const emergingPct = total > 0 ? Math.round((emergingCount / total) * 100) : 0;
  const establishedPct = total > 0 ? Math.round((establishedCount / total) * 100) : 0;

  const pendingCount = nominatedArtists.filter(a => a.status === 'PENDING_DIRECTOR_REVIEW').length;
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

  const handleConfirmVeto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVetoArtistId) return;
    onVetoArtist(activeVetoArtistId, selectedVetoReason, vetoNotes);
    setActiveVetoArtistId(null);
    setVetoNotes('');
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-sadu-gold bg-sadu-paper p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-sadu-gold/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sadu-brick text-white shadow-xs">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="rounded bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-brick uppercase tracking-wider border border-sadu-gold/60">
                Stage 4: Director's Veto & Balance Review
              </span>
              <h1 className="font-editorial text-2xl font-bold text-sadu-charcoal sm:text-3xl mt-1">
                Biennial Director Workspace &middot; Mohammed Al Qaseer
              </h1>
              <p className="text-xs font-semibold text-sadu-brick" dir="rtl">
                مدير البينالي · المراجعة المؤسسية وحق النقض (الفيتو)
              </p>
            </div>
          </div>
          {onBackToRoles && (
            <button
              type="button"
              onClick={onBackToRoles}
              className="rounded-md border border-sadu-gold bg-sadu-sand px-3 py-1.5 text-xs font-bold text-sadu-charcoal hover:bg-sadu-gold/20 cursor-pointer"
            >
              Back to Role Selection
            </button>
          )}
        </div>

        {/* Operational Context */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
          <div className="rounded-md border border-sadu-gold/50 bg-white p-3">
            <span className="text-[10px] font-bold uppercase text-sadu-muted block">Theme & Budget Authority</span>
            <span className="font-editorial text-sm font-bold text-sadu-charcoal">
              {ratifiedTheme?.englishName || 'Ratified Biennial Theme'}
            </span>
            <span className="block text-emerald-800 font-semibold mt-0.5">
              Budget: {assignedBudget ? `AED ${assignedBudget.toLocaleString()} (Locked)` : 'AED 12,500,000 (Allocated)'}
            </span>
          </div>

          <div className="rounded-md border border-sadu-gold/50 bg-white p-3">
            <span className="text-[10px] font-bold uppercase text-sadu-muted block">Executive Authority Scope</span>
            <p className="text-sadu-muted leading-relaxed mt-0.5">
              Mohammed Al Qaseer heads the Artist Selection Committee, exercises absolute veto over candidate dossiers, and monitors Emerging vs. Established institutional balance.
            </p>
          </div>
        </div>
      </div>

      {/* Director's Balance Dashboard: Visual Ratio of Emerging vs Established */}
      <div className="rounded-xl border border-sadu-gold bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-sadu-gold/30 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-sadu-brick" />
            <div>
              <h2 className="font-editorial text-lg font-bold text-sadu-charcoal">Curatorial Cohort Balance Dashboard</h2>
              <p className="text-xs text-sadu-muted">Visual ratio of Emerging to Established artists in current candidate pool</p>
            </div>
          </div>
          <span className="rounded bg-sadu-sand px-3 py-1 text-xs font-bold text-sadu-charcoal border border-sadu-gold/60">
            Total Nominated Pool: {total} Artists
          </span>
        </div>

        {/* Tailwind Grid Summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-sadu-gold/50 bg-sadu-sand/40 p-3">
            <span className="text-[10px] font-bold text-sadu-muted uppercase block">Emerging Artists</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-editorial text-xl font-bold text-sadu-brick">{emergingCount}</span>
              <span className="text-xs font-semibold text-sadu-muted">({emergingPct}%)</span>
            </div>
          </div>

          <div className="rounded-lg border border-sadu-gold/50 bg-sadu-sand/40 p-3">
            <span className="text-[10px] font-bold text-sadu-muted uppercase block">Established Artists</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-editorial text-xl font-bold text-sadu-charcoal">{establishedCount}</span>
              <span className="text-xs font-semibold text-sadu-muted">({establishedPct}%)</span>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-300 bg-emerald-50/60 p-3">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Approved for Scope</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-editorial text-xl font-bold text-emerald-900">{approvedCount}</span>
              <span className="text-xs font-semibold text-emerald-700">active</span>
            </div>
          </div>

          <div className="rounded-lg border border-red-300 bg-red-50/60 p-3">
            <span className="text-[10px] font-bold text-red-800 uppercase block">Vetoed / Rejected</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-editorial text-xl font-bold text-red-900">{vetoedCount}</span>
              <span className="text-xs font-semibold text-red-700">returned</span>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1.5 rounded-lg border border-sadu-gold/40 bg-sadu-paper/60 p-3">
          <div className="flex items-center justify-between text-xs font-bold text-sadu-charcoal">
            <span className="text-sadu-brick">Emerging: {emergingPct}% ({emergingCount})</span>
            <span className="text-[10px] text-sadu-muted font-normal">Target: 40% - 60% Balance</span>
            <span className="text-sadu-charcoal">Established: {establishedPct}% ({establishedCount})</span>
          </div>

          <div className="h-3.5 w-full overflow-hidden rounded-full bg-sadu-sand border border-sadu-gold/60 flex">
            <div style={{ width: `${total > 0 ? emergingPct : 50}%` }} className="bg-sadu-brick transition-all duration-500" />
            <div style={{ width: `${total > 0 ? establishedPct : 50}%` }} className="bg-sadu-charcoal transition-all duration-500" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-sadu-gold/50 bg-white p-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-sadu-muted" />
          <span className="font-bold text-sadu-charcoal">Category:</span>
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
              {cat === 'ALL' ? 'All' : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-sadu-charcoal">Status:</span>
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
              {st === 'ALL' ? 'All' : st === 'PENDING' ? 'Pending' : st === 'VETOED' ? 'Vetoed' : 'Approved'}
            </button>
          ))}
        </div>
      </div>

      {/* Artist Dossier List */}
      <div className="space-y-4">
        {filteredArtists.length === 0 ? (
          <div className="rounded-xl border border-dashed border-sadu-gold/70 bg-white p-8 text-center text-xs text-sadu-muted">
            <UserCheck className="mx-auto h-8 w-8 text-sadu-muted mb-2" />
            <p className="font-editorial text-base font-bold text-sadu-charcoal">No Candidate Dossiers Match Filters</p>
            <p className="mt-1">Nominate artists through the Preparatory Committee or Coordinator portal.</p>
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
                      <h3 className="font-editorial text-lg font-bold text-sadu-charcoal">{artist.artistName}</h3>
                      <span className="text-[11px] text-sadu-muted block">
                        {artist.nationality} &middot; {artist.medium}
                      </span>
                    </div>

                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        artist.artistCategory === 'Emerging'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-sadu-charcoal text-white'
                      }`}
                    >
                      {artist.artistCategory}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <span className="font-bold text-sadu-charcoal block">Proposed Work:</span>
                    <p className="text-sadu-muted italic">"{artist.proposedWorkTitle}"</p>
                  </div>

                  {/* Schema Attachments Indicators */}
                  <div className="flex flex-wrap gap-1.5 text-[10px] pt-1">
                    <span className="rounded bg-sadu-sand px-2 py-0.5 text-sadu-charcoal font-semibold border border-sadu-gold/40">
                      CV: {artist.cvFileName}
                    </span>
                    <span className="rounded bg-sadu-sand px-2 py-0.5 text-sadu-charcoal font-semibold border border-sadu-gold/40">
                      {artist.previousWorksCount} Past Works
                    </span>
                    <span className="rounded bg-sadu-sand px-2 py-0.5 text-sadu-charcoal font-semibold border border-sadu-gold/40">
                      {artist.mockupCount} Mockups
                    </span>
                  </div>

                  {/* Status Indicator */}
                  {artist.status === 'VETOED' && (
                    <div className="rounded border border-red-300 bg-red-50 p-2 text-xs text-red-900 space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Ban className="h-3.5 w-3.5 text-red-600" />
                        <span>Director Veto Enacted &mdash; Routed to Coordinator</span>
                      </div>
                      <p className="text-[11px] text-red-800">
                        Reason: <strong>{artist.vetoReason || 'Administrative Directive'}</strong>
                        {artist.vetoNotes && ` (${artist.vetoNotes})`}
                      </p>
                    </div>
                  )}

                  {artist.status === 'APPROVED' && (
                    <div className="rounded border border-emerald-300 bg-emerald-50 p-2 text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Approved by Director &middot; Ready for Stage 5 Contracting</span>
                    </div>
                  )}
                </div>

                {/* Director Actions */}
                <div className="mt-4 border-t border-sadu-gold/30 pt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveVetoArtistId(artist.id);
                      setSelectedVetoReason(VETO_REASONS[0]);
                    }}
                    className={`flex-1 rounded-md px-3 py-2 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      artist.status === 'VETOED'
                        ? 'bg-red-100 text-red-800 border border-red-300 hover:bg-red-200'
                        : 'border border-red-300 text-red-700 hover:bg-red-50'
                    }`}
                  >
                    <Ban className="h-3.5 w-3.5" />
                    <span>{artist.status === 'VETOED' ? 'Edit Veto' : 'Veto / Reject'}</span>
                  </button>

                  {onApproveArtist && (
                    <button
                      type="button"
                      disabled={artist.status === 'APPROVED'}
                      onClick={() => onApproveArtist(artist.id)}
                      className={`flex-1 rounded-md px-3 py-2 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        artist.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 cursor-not-allowed'
                          : 'bg-sadu-brick text-white hover:bg-sadu-brick-dark shadow-2xs'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{artist.status === 'APPROVED' ? 'Approved' : 'Approve for Scope'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Veto Reason Modal Dialog */}
      {activeVetoArtistId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border-2 border-red-500 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-sadu-gold/30 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-700">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-editorial text-lg font-bold text-sadu-charcoal">
                  Executive Veto Enforcement
                </h3>
                <p className="text-xs text-sadu-muted">
                  Mohammed Al Qaseer &middot; Absolute Directorate Authority
                </p>
              </div>
            </div>

            <p className="text-xs text-sadu-muted leading-relaxed">
              Vetoing an artist candidate immediately flags the dossier as rejected and routes the feedback reason back to the Coordinators.
            </p>

            <form onSubmit={handleConfirmVeto} className="space-y-4">
              <div>
                <label htmlFor="veto-reason-select" className="block text-xs font-bold text-sadu-charcoal uppercase tracking-wider mb-1">
                  Select Veto Reason <span className="text-red-600">*</span>
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
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="veto-notes-textarea" className="block text-xs font-bold text-sadu-charcoal uppercase tracking-wider mb-1">
                  Director Directorate Notes (Routed to Coordinator)
                </label>
                <textarea
                  id="veto-notes-textarea"
                  rows={3}
                  value={vetoNotes}
                  onChange={e => setVetoNotes(e.target.value)}
                  placeholder="Provide specific justification (e.g. proposed installation exceeds gallery ceiling thresholds or budget allocation)..."
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
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-red-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-800 shadow-xs cursor-pointer"
                >
                  Confirm Executive Veto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectorWorkspace;
