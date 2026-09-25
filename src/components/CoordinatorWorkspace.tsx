import React, { useState } from 'react';
import {
  GitMerge,
  FileSignature,
  Users,
  CheckCircle2,
  Clock,
  Ban,
  Plus,
  Send,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { NominatedArtistDossier } from './ArtistNominationForm';
import ArtistNominationForm from './ArtistNominationForm';
import { BilateralContract } from '../types/contractStage6';

export interface CoordinatorWorkspaceProps {
  nominatedArtists: NominatedArtistDossier[];
  contracts: BilateralContract[];
  onNominateArtist: (dossier: NominatedArtistDossier) => void;
  onDispatchContract: (contractId: string, productionCost: number, shippingTerms: string) => void;
  curatorialBrief?: string;
  blocklist?: string[];
  onBackToRoles?: () => void;
}

const DEFAULT_SHIPPING_TERMS =
  'The Department of Culture coordinates and covers museum-standard custom wooden crating, international climate-controlled air freight, and comprehensive door-to-door fine art transit insurance to Calligraphy Square & Sharjah Art Museum.';

const CANCELLATION_CLAUSE_EN =
  "Department reserves the right to cancel or alter any artwork not aligning with the Department's institutional vision or exhibition standards.";
const CANCELLATION_CLAUSE_AR =
  'تحتفظ دائرة الثقافة بالحق في إلغاء أو تعديل أي عمل فني لا يتوافق مع الرؤية المؤسسية للدائرة أو الموجهات التنسيقية العامة للمعرض.';

export const CoordinatorWorkspace: React.FC<CoordinatorWorkspaceProps> = ({
  nominatedArtists,
  contracts,
  onNominateArtist,
  onDispatchContract,
  curatorialBrief,
  blocklist,
  onBackToRoles,
}) => {
  const [activeTab, setActiveTab] = useState<'dossiers' | 'contracts'>('dossiers');
  const [isNominationModalOpen, setIsNominationModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'VETOED'>('ALL');

  // Contract Formulation State
  const [selectedArtistForContract, setSelectedArtistForContract] = useState<NominatedArtistDossier | null>(null);
  const [productionCostInput, setProductionCostInput] = useState<number>(85000);
  const [shippingTermsInput, setShippingTermsInput] = useState<string>(DEFAULT_SHIPPING_TERMS);

  // Filtered artists for Dossiers tab
  const filteredArtists = nominatedArtists.filter(artist => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') return artist.status === 'PENDING_DIRECTOR_REVIEW';
    if (statusFilter === 'APPROVED') return artist.status === 'APPROVED';
    if (statusFilter === 'VETOED') return artist.status === 'VETOED';
    return true;
  });

  // Approved artists eligible for Stage 6 contracting
  const approvedArtists = nominatedArtists.filter(artist => artist.status === 'APPROVED');

  const openContractDraft = (artist: NominatedArtistDossier) => {
    setSelectedArtistForContract(artist);
    const existing = contracts.find(c => c.artistId === artist.id);
    if (existing && existing.productionCost > 0) {
      setProductionCostInput(existing.productionCost);
      setShippingTermsInput(existing.shippingTerms || DEFAULT_SHIPPING_TERMS);
    } else {
      setProductionCostInput(artist.artistCategory === 'Established' ? 120000 : 65000);
      setShippingTermsInput(DEFAULT_SHIPPING_TERMS);
    }
  };

  const handleDispatch = () => {
    if (!selectedArtistForContract || productionCostInput <= 0) return;
    const existing = contracts.find(c => c.artistId === selectedArtistForContract.id);
    const contractId = existing ? existing.id : `contract-${selectedArtistForContract.id}`;
    onDispatchContract(contractId, productionCostInput, shippingTermsInput.trim());
    setSelectedArtistForContract(null);
  };

  const totalApproved = approvedArtists.length;
  const totalDispatched = contracts.filter(c => c.status === 'SENT_TO_ARTIST').length;
  const totalLocked = contracts.filter(c => c.status === 'ARTIST_APPROVED' || c.status === 'LOCKED').length;
  const totalCommittedSpend = contracts
    .filter(c => c.status === 'ARTIST_APPROVED' || c.status === 'LOCKED')
    .reduce((sum, c) => sum + (c.productionCost || 0), 0);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* 1. Header Bar */}
      <div className="rounded-xl border border-sadu-gold bg-sadu-paper p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-sadu-gold/40 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sadu-ochre text-white shadow-xs">
              <GitMerge className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-ochre uppercase tracking-wider border border-sadu-gold/60">
                  Stage 4 &amp; Stage 6 · Program Operations
                </span>
                <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-700">
                  Multi-track Coordinator
                </span>
              </div>
              <h1 className="font-editorial text-2xl font-bold text-sadu-charcoal mt-1">
                Coordinator Workspace (المنسق العام)
              </h1>
              <p className="text-xs text-sadu-muted">
                Dossier Intake &amp; Bilateral Contracts Generator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onBackToRoles && (
              <button
                type="button"
                onClick={onBackToRoles}
                className="inline-flex items-center gap-1.5 rounded-md border border-sadu-gold bg-sadu-sand px-3 py-1.5 text-xs font-bold text-sadu-charcoal hover:bg-sadu-gold/25 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Switch Role</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 border-b border-sadu-gold/30 pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('dossiers')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                activeTab === 'dossiers'
                  ? 'bg-sadu-brick text-white shadow-xs'
                  : 'text-sadu-charcoal hover:bg-sadu-sand'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>1. Artist Nomination &amp; Dossier Pool</span>
              <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                {nominatedArtists.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('contracts')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                activeTab === 'contracts'
                  ? 'bg-sadu-brick text-white shadow-xs'
                  : 'text-sadu-charcoal hover:bg-sadu-sand'
              }`}
            >
              <FileSignature className="h-3.5 w-3.5" />
              <span>2. Stage 6 Bilateral Contracts Generator</span>
              <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                {approvedArtists.length}
              </span>
            </button>
          </div>

          {activeTab === 'dossiers' && (
            <button
              type="button"
              onClick={() => setIsNominationModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-sadu-brick px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-sadu-brick-dark cursor-pointer self-start sm:self-auto"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nominate Artist (Strict Schema)</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Tab Content */}
      {activeTab === 'dossiers' ? (
        <div className="space-y-4">
          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-sadu-gold/50 bg-sadu-sand/40 p-3 text-xs">
            <span className="font-bold text-sadu-charcoal mr-2">Filter Pool:</span>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`rounded px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-sadu-charcoal text-white'
                  : 'bg-white text-sadu-muted hover:bg-stone-100 border border-sadu-gold/40'
              }`}
            >
              All ({nominatedArtists.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('APPROVED')}
              className={`rounded px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                statusFilter === 'APPROVED'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-300'
              }`}
            >
              Director Approved ({nominatedArtists.filter(a => a.status === 'APPROVED').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`rounded px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-800 text-white'
                  : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-300'
              }`}
            >
              Pending Review ({nominatedArtists.filter(a => a.status === 'PENDING_DIRECTOR_REVIEW').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('VETOED')}
              className={`rounded px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                statusFilter === 'VETOED'
                  ? 'bg-red-800 text-white'
                  : 'bg-white text-red-800 hover:bg-red-50 border border-red-300'
              }`}
            >
              Vetoed ({nominatedArtists.filter(a => a.status === 'VETOED').length})
            </button>
          </div>

          {/* Dossiers Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredArtists.map(artist => {
              const contract = contracts.find(c => c.artistId === artist.id);
              return (
                <div
                  key={artist.id}
                  className={`rounded-lg border p-4 text-xs space-y-2.5 shadow-2xs ${
                    artist.status === 'VETOED'
                      ? 'border-red-300 bg-red-50/40'
                      : artist.status === 'APPROVED'
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : 'border-sadu-gold/60 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-sadu-charcoal">{artist.artistName}</h2>
                      <span className="text-[11px] text-sadu-muted">
                        {artist.nationality} &middot; {artist.medium}
                      </span>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 text-[9px] font-bold ${
                        artist.artistCategory === 'Emerging'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-sadu-charcoal text-white'
                      }`}
                    >
                      {artist.artistCategory} Artist
                    </span>
                  </div>

                  <p className="text-[11px] text-sadu-muted italic">"{artist.proposedWorkTitle}"</p>

                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-sadu-muted border-t border-sadu-gold/30 pt-2">
                    <span className="rounded bg-sadu-sand px-1.5 py-0.5">
                      CV: {artist.cvFileName || 'Submitted PDF'}
                    </span>
                    <span className="rounded bg-sadu-sand px-1.5 py-0.5">
                      Works: {artist.previousWorksCount} imgs
                    </span>
                    <span className="rounded bg-sadu-sand px-1.5 py-0.5">
                      Mockups: {artist.mockupCount} sketches
                    </span>
                    <span className="text-sadu-muted/80">By: {artist.submittedBy}</span>
                  </div>
                  {/* Decision Banners */}
                  {artist.status === 'VETOED' && (
                    <div className="rounded bg-red-100 p-2 text-red-900 border border-red-300 text-[11px] space-y-0.5">
                      <div className="flex items-center gap-1 font-bold text-red-950">
                        <Ban className="h-3.5 w-3.5 text-red-700" />
                        <span>Vetoed by Biennial Director</span>
                      </div>
                      <p>
                        Reason: <strong>{artist.vetoReason || 'Administrative Directive'}</strong>
                      </p>
                      {artist.vetoNotes && (
                        <p className="text-[10px] text-red-800">Notes: {artist.vetoNotes}</p>
                      )}
                    </div>
                  )}

                  {artist.status === 'APPROVED' && (
                    <div className="rounded bg-emerald-100/90 p-2.5 text-emerald-950 border border-emerald-300 text-[11px] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1 text-emerald-900">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                          Director Approved &middot; Stage 6 Contracting Ready
                        </span>
                        <span className="text-[9px] font-bold uppercase rounded bg-emerald-200 px-1.5 py-0.5 text-emerald-900">
                          {contract?.status || 'Contract Pending'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('contracts');
                          openContractDraft(artist);
                        }}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded bg-emerald-800 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-900 cursor-pointer shadow-2xs"
                      >
                        <FileSignature className="h-3 w-3" />
                        <span>
                          {contract ? 'Review / Update Bilateral Contract' : 'Draft Bilateral Contract'}
                        </span>
                      </button>
                    </div>
                  )}

                  {artist.status === 'PENDING_DIRECTOR_REVIEW' && (
                    <div className="rounded bg-amber-50 p-2 text-amber-900 border border-amber-200 text-[11px] flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-700" />
                      <span>Awaiting Director Mohammed Al Qaseer's Balance Review</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Stage 6 Bilateral Contracts Generator Tab */
        <div className="space-y-6">
          {/* Contracts KPI Row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-sadu-gold/60 bg-white p-3.5 shadow-2xs text-center">
              <span className="text-[10px] font-bold uppercase text-sadu-muted tracking-wider block">
                Approved Candidates
              </span>
              <span className="font-editorial text-2xl font-bold text-sadu-charcoal mt-1 block">
                {totalApproved}
              </span>
            </div>
            <div className="rounded-lg border border-sadu-gold/60 bg-white p-3.5 shadow-2xs text-center">
              <span className="text-[10px] font-bold uppercase text-sadu-muted tracking-wider block">
                Contracts Dispatched
              </span>
              <span className="font-editorial text-2xl font-bold text-amber-800 mt-1 block">
                {totalDispatched}
              </span>
            </div>
            <div className="rounded-lg border border-sadu-gold/60 bg-white p-3.5 shadow-2xs text-center">
              <span className="text-[10px] font-bold uppercase text-sadu-muted tracking-wider block">
                Contracts Signed &amp; Locked
              </span>
              <span className="font-editorial text-2xl font-bold text-emerald-800 mt-1 block">
                {totalLocked}
              </span>
            </div>
            <div className="rounded-lg border border-sadu-gold/60 bg-white p-3.5 shadow-2xs text-center">
              <span className="text-[10px] font-bold uppercase text-sadu-muted tracking-wider block">
                Committed Value
              </span>
              <span className="font-editorial text-xl font-bold text-sadu-charcoal mt-1 block">
                AED {totalCommittedSpend.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Bilateral Contract Drafting Card */}
          {selectedArtistForContract && (
            <div className="rounded-xl border-2 border-sadu-brick bg-white p-6 shadow-md space-y-4">
              <div className="flex items-start justify-between border-b border-sadu-gold/40 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sadu-brick/10 text-sadu-brick">
                    <FileSignature className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-sadu-brick uppercase tracking-wider">
                      Stage 6 &middot; Institutional Contract Drafting
                    </span>
                    <h3 className="font-editorial text-lg font-bold text-sadu-charcoal">
                      Bilateral Contract Agreement &middot; {selectedArtistForContract.artistName}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedArtistForContract(null)}
                  className="rounded p-1 text-sadu-muted hover:bg-stone-100 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Form Controls */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-sadu-charcoal mb-1">
                    Production Budget Allowance (AED)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-sadu-muted">AED</span>
                    <input
                      type="number"
                      value={productionCostInput}
                      onChange={e => setProductionCostInput(Number(e.target.value))}
                      className="w-full rounded-md border border-sadu-gold/80 pl-12 pr-3 py-2 text-sm font-semibold text-sadu-charcoal focus:border-sadu-brick focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-sadu-muted mt-1 block">
                    Recommended: Emerging AED 50k–75k &middot; Established AED 100k–150k
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-sadu-charcoal mb-1">
                    Proposed Artwork Title &amp; Category
                  </label>
                  <div className="rounded-md border border-sadu-gold/50 bg-sadu-sand/30 px-3 py-2 text-xs">
                    <strong className="block text-sadu-charcoal">
                      "{selectedArtistForContract.proposedWorkTitle}"
                    </strong>
                    <span className="text-[11px] text-sadu-muted">
                      {selectedArtistForContract.artistCategory} Artist &middot; {selectedArtistForContract.medium}
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-sadu-charcoal mb-1">
                    Shipping, Crating &amp; Transit Insurance Provisions
                  </label>
                  <textarea
                    rows={3}
                    value={shippingTermsInput}
                    onChange={e => setShippingTermsInput(e.target.value)}
                    className="w-full rounded-md border border-sadu-gold/80 p-2.5 text-xs text-sadu-charcoal focus:border-sadu-brick focus:outline-none"
                  />
                </div>
              </div>

              {/* Automatic Tranche Milestones Preview */}
              <div className="rounded-lg border border-sadu-gold/40 bg-sadu-sand/30 p-3.5 text-xs space-y-2">
                <span className="font-bold text-sadu-charcoal block">
                  Mandatory 3-Tranche Milestone Disbursement Schedule:
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded border border-sadu-gold/50 bg-white p-2">
                    <span className="text-[10px] font-bold text-sadu-muted uppercase block">
                      1. Pre-Production Advance (30%)
                    </span>
                    <strong className="text-sadu-charcoal text-xs">
                      AED {Math.round(productionCostInput * 0.3).toLocaleString()}
                    </strong>
                    <span className="text-[9px] text-sadu-muted block">Upon Contract Execution</span>
                  </div>
                  <div className="rounded border border-sadu-gold/50 bg-white p-2">
                    <span className="text-[10px] font-bold text-sadu-muted uppercase block">
                      2. Delivery &amp; Customs (40%)
                    </span>
                    <strong className="text-sadu-charcoal text-xs">
                      AED {Math.round(productionCostInput * 0.4).toLocaleString()}
                    </strong>
                    <span className="text-[9px] text-sadu-muted block">Upon Crating Arrival</span>
                  </div>
                  <div className="rounded border border-sadu-gold/50 bg-white p-2">
                    <span className="text-[10px] font-bold text-sadu-muted uppercase block">
                      3. Installation &amp; Closeout (30%)
                    </span>
                    <strong className="text-sadu-charcoal text-xs">
                      AED {Math.round(productionCostInput * 0.3).toLocaleString()}
                    </strong>
                    <span className="text-[9px] text-sadu-muted block">Curatorial Sign-off</span>
                  </div>
                </div>
              </div>

              {/* Mandatory Cancellation Clause Notice */}
              <div className="rounded-lg border border-sadu-gold/60 bg-amber-50/70 p-3 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <Lock className="h-3.5 w-3.5 text-amber-800" />
                  <span>Mandatory Institutional Cancellation Clause (Locked Invariant)</span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed italic">
                  "{CANCELLATION_CLAUSE_EN}"
                </p>
                <p className="text-[11px] text-amber-900 leading-relaxed font-serif" dir="rtl">
                  "{CANCELLATION_CLAUSE_AR}"
                </p>
              </div>

              {/* Dispatch Action */}
              <div className="flex justify-end gap-2 pt-2 border-t border-sadu-gold/30">
                <button
                  type="button"
                  onClick={() => setSelectedArtistForContract(null)}
                  className="rounded px-4 py-2 text-xs font-bold text-sadu-muted hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDispatch}
                  className="inline-flex items-center gap-1.5 rounded-md bg-sadu-brick px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-sadu-brick-dark cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Dispatch Contract to Artist Portal</span>
                </button>
              </div>
            </div>
          )}

          {/* Approved Artists Contracts List */}
          <div className="rounded-xl border border-sadu-gold bg-sadu-paper p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-sadu-gold/40 pb-3">
              <div>
                <h3 className="font-editorial text-base font-bold text-sadu-charcoal">
                  Approved Multaqa Artists Contracting Queue
                </h3>
                <p className="text-xs text-sadu-muted">
                  Bilateral agreements specify production funding, shipping terms, and payment tranches.
                </p>
              </div>
            </div>

            <div className="divide-y divide-sadu-gold/20">
              {approvedArtists.map(artist => {
                const contract = contracts.find(c => c.artistId === artist.id);
                const isDispatched = contract?.status === 'SENT_TO_ARTIST';
                const isSigned = contract?.status === 'ARTIST_APPROVED' || contract?.status === 'LOCKED';

                return (
                  <div key={artist.id} className="py-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-sadu-charcoal">{artist.artistName}</strong>
                        <span className="rounded bg-sadu-sand px-2 py-0.5 text-[9px] font-bold text-sadu-muted border border-sadu-gold/50">
                          {artist.artistCategory}
                        </span>
                        <span className="text-[11px] text-sadu-muted">&middot; {artist.nationality}</span>
                      </div>
                      <p className="text-[11px] text-sadu-muted italic">
                        Proposed Work: "{artist.proposedWorkTitle}" ({artist.medium})
                      </p>

                      {contract && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                          <span className="font-bold text-sadu-charcoal">
                            Production: AED {contract.productionCost.toLocaleString()}
                          </span>
                          <span className="text-sadu-muted">&middot;</span>
                          <span className="text-sadu-muted">
                            Tranches: 30% Advance / 40% Delivery / 30% Install
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        {isSigned ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Signed &amp; Locked
                          </span>
                        ) : isDispatched ? (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800 border border-amber-300">
                            <Clock className="h-3 w-3" />
                            Dispatched to Artist
                          </span>
                        ) : (
                          <span className="rounded bg-stone-100 px-2.5 py-1 text-[10px] font-semibold text-stone-600 border border-stone-200">
                            Not Drafted
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => openContractDraft(artist)}
                        className={`inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer shadow-2xs ${
                          isSigned
                            ? 'bg-white border border-sadu-gold/60 text-sadu-charcoal hover:bg-sadu-sand'
                            : 'bg-sadu-brick text-white hover:bg-sadu-brick-dark'
                        }`}
                      >
                        <FileSignature className="h-3.5 w-3.5" />
                        <span>{isSigned ? 'View Terms' : isDispatched ? 'Update Draft' : 'Draft Contract'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Strict Dossier Nomination Modal */}
      {isNominationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <ArtistNominationForm
              curatorialBrief={curatorialBrief}
              blocklist={blocklist}
              onSubmitNomination={dossier => {
                onNominateArtist(dossier);
                setIsNominationModalOpen(false);
              }}
              submittedBy="Coordinator"
              onCancel={() => setIsNominationModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorWorkspace;


