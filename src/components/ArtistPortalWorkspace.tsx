import React, { useState } from 'react';
import {
  User,
  CheckCircle2,
  Clock,
  Lock,
  FileSignature,
  FileText,
  Upload,
  Globe,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Eye,
  Check,
  AlertCircle,
} from 'lucide-react';
import { BilateralContract, NegotiationRound } from '../types/contractStage6';
import ContractDisputeModal from './ContractDisputeModal';

export interface ArtistPortalWorkspaceProps {
  contracts: BilateralContract[];
  onSignContract: (contractId: string, signerName: string) => void;
  onUploadPassport: (contractId: string, fileName: string) => void;
  onUploadHighResArtwork: (contractId: string, fileName: string, dpi: number) => void;
  onSaveBio: (contractId: string, bioAr: string, bioEn: string) => void;
  onRequestAmendment?: (
    contractId: string,
    category: NegotiationRound['disputedCategory'],
    justification: string
  ) => void;
  onBackToRoles?: () => void;
}

export const ArtistPortalWorkspace: React.FC<ArtistPortalWorkspaceProps> = ({
  contracts,
  onSignContract,
  onUploadPassport,
  onUploadHighResArtwork,
  onSaveBio,
  onRequestAmendment,
  onBackToRoles,
}) => {
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  // If there are no contracts, provide fallback
  const [selectedContractId, setSelectedContractId] = useState<string>(
    contracts[0]?.id || ''
  );

  const activeContract = contracts.find(c => c.id === selectedContractId) || contracts[0];

  // Signature state
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [signerName, setSignerName] = useState(activeContract?.artistName || '');

  // Upload simulation state
  const [passportFileInput, setPassportFileInput] = useState('');
  const [artworkFileInput, setArtworkFileInput] = useState('');
  const [bioArInput, setBioArInput] = useState(activeContract?.documents.catalogBioArabic || '');
  const [bioEnInput, setBioEnInput] = useState(activeContract?.documents.catalogBioEnglish || '');

  if (!activeContract) {
    return (
      <div className="mx-auto w-full max-w-4xl rounded-xl border border-sadu-gold bg-sadu-paper p-8 text-center space-y-4">
        <User className="mx-auto h-12 w-12 text-sadu-muted" />
        <h2 className="font-editorial text-xl font-bold text-sadu-charcoal">No Active Artist Nominations</h2>
        <p className="text-xs text-sadu-muted">
          No approved artists are currently scheduled for Stage 6 contracting.
        </p>
        {onBackToRoles && (
          <button
            type="button"
            onClick={onBackToRoles}
            className="rounded bg-sadu-brick px-4 py-2 text-xs font-bold text-white hover:bg-sadu-brick-dark"
          >
            Back to Role Selection
          </button>
        )}
      </div>
    );
  }

  const isContractSigned = activeContract.status === 'ARTIST_APPROVED' || activeContract.status === 'LOCKED';
  const isContractDispatched = activeContract.status === 'SENT_TO_ARTIST';

  const handleSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms || !signerName.trim()) return;
    onSignContract(activeContract.id, signerName.trim());
  };

  const handlePassportUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const file = passportFileInput.trim() || `${activeContract.artistName.replace(/\s+/g, '_')}_Passport_Official.pdf`;
    onUploadPassport(activeContract.id, file);
    setPassportFileInput('');
  };

  const handleArtworkUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const file = artworkFileInput.trim() || `${activeContract.artistName.replace(/\s+/g, '_')}_Master_Artwork_300DPI.tiff`;
    onUploadHighResArtwork(activeContract.id, file, 300);
    setArtworkFileInput('');
  };

  const handleBioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBio(activeContract.id, bioArInput, bioEnInput);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* 1. Header & Active Profile Switcher */}
      <div className="rounded-xl border border-sadu-gold bg-sadu-paper p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-sadu-gold/40 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sadu-ink text-white shadow-xs">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-ink uppercase tracking-wider border border-sadu-gold/60">
                  Stage 6 &middot; External Participant Portal
                </span>
                {isContractSigned && (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    Agreement Legally Executed
                  </span>
                )}
              </div>
              <h1 className="font-editorial text-2xl font-bold text-sadu-charcoal mt-1">
                Artist Intake &amp; Participation Portal (الفنان)
              </h1>
              <p className="text-xs text-sadu-muted">
                Contract Terms Approval, Official Passport Intake &amp; 300 DPI Artwork Files
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

        {/* Profile Switcher for Demonstration */}
        <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-sadu-charcoal">Active Artist Portal:</span>
            {contracts.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedContractId(c.id);
                  setSignerName(c.artistName);
                  setBioArInput(c.documents.catalogBioArabic || '');
                  setBioEnInput(c.documents.catalogBioEnglish || '');
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeContract.id === c.id
                    ? 'bg-sadu-ink text-white shadow-xs'
                    : 'bg-white text-sadu-charcoal border border-sadu-gold/60 hover:bg-sadu-sand'
                }`}
              >
                {c.artistName} ({c.artistCategory})
              </button>
            ))}
          </div>

          <div className="text-[11px] text-sadu-muted">
            Status: <strong className="text-sadu-charcoal">{activeContract.status.replace(/_/g, ' ')}</strong>
          </div>
        </div>
      </div>

      {/* 2. Progress Stepper */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
        <div className={`rounded-lg border p-3.5 shadow-2xs space-y-1 ${
          isContractSigned ? 'border-emerald-300 bg-emerald-50/50' : 'border-sadu-gold/60 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-sadu-muted uppercase">Step 1</span>
            {isContractSigned ? <CheckCircle2 className="h-4 w-4 text-emerald-700" /> : <Clock className="h-4 w-4 text-amber-700" />}
          </div>
          <strong className="block text-sadu-charcoal">Bilateral Contract</strong>
          <span className="text-[11px] text-sadu-muted">
            {isContractSigned
              ? 'Terms Accepted & Locked'
              : activeContract.status === 'AMENDMENT_UNDER_REVIEW'
              ? 'Coordinator Revising Terms (Locked)'
              : activeContract.status === 'CONTRACT_DISPUTED'
              ? 'Amendment Queued for Review'
              : isContractDispatched
              ? 'Ready for E-Signature'
              : 'Awaiting Coordinator'}
          </span>
        </div>

        <div className={`rounded-lg border p-3.5 shadow-2xs space-y-1 ${
          activeContract.documents.passportStatus === 'VERIFIED'
            ? 'border-emerald-300 bg-emerald-50/50'
            : activeContract.documents.passportStatus === 'SUBMITTED'
            ? 'border-amber-300 bg-amber-50/50'
            : 'border-sadu-gold/60 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-sadu-muted uppercase">Step 2</span>
            {activeContract.documents.passportStatus === 'VERIFIED' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            ) : activeContract.documents.passportStatus === 'SUBMITTED' ? (
              <Clock className="h-4 w-4 text-amber-700" />
            ) : (
              <Upload className="h-4 w-4 text-stone-400" />
            )}
          </div>
          <strong className="block text-sadu-charcoal">Passport Upload</strong>
          <span className="text-[11px] text-sadu-muted">
            {activeContract.documents.passportStatus === 'VERIFIED'
              ? 'Verified by PR Desk'
              : activeContract.documents.passportStatus === 'SUBMITTED'
              ? 'Awaiting PR Clearance'
              : 'Pending Upload'}
          </span>
        </div>

        <div className={`rounded-lg border p-3.5 shadow-2xs space-y-1 ${
          activeContract.documents.highResStatus === 'VERIFIED'
            ? 'border-emerald-300 bg-emerald-50/50'
            : activeContract.documents.highResStatus === 'SUBMITTED'
            ? 'border-amber-300 bg-amber-50/50'
            : 'border-sadu-gold/60 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-sadu-muted uppercase">Step 3</span>
            {activeContract.documents.highResStatus === 'VERIFIED' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            ) : activeContract.documents.highResStatus === 'SUBMITTED' ? (
              <Clock className="h-4 w-4 text-amber-700" />
            ) : (
              <Upload className="h-4 w-4 text-stone-400" />
            )}
          </div>
          <strong className="block text-sadu-charcoal">Print Master (300 DPI)</strong>
          <span className="text-[11px] text-sadu-muted">
            {activeContract.documents.highResStatus === 'VERIFIED'
              ? 'Approved for Catalog'
              : activeContract.documents.highResStatus === 'SUBMITTED'
              ? 'In Print Evaluation'
              : 'Pending Upload'}
          </span>
        </div>

        <div className="rounded-lg border border-sadu-gold/60 bg-white p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-sadu-muted uppercase">Step 4</span>
            <Globe className="h-4 w-4 text-sadu-ochre" />
          </div>
          <strong className="block text-sadu-charcoal">Delegation Status</strong>
          <span className="text-[11px] text-sadu-muted">
            {isContractSigned && activeContract.documents.passportStatus === 'VERIFIED'
              ? 'Clear for UAE Travel'
              : 'Pending Steps 1 & 2'}
          </span>
        </div>
      </div>
      {/* 3. Section: Bilateral Contract Agreement Review & Signature */}
      <div className="rounded-xl border border-sadu-gold bg-sadu-paper p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-sadu-gold/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sadu-brick/10 text-sadu-brick">
              <FileSignature className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-editorial text-lg font-bold text-sadu-charcoal">
                Official Bilateral Participation Agreement
              </h2>
              <span className="text-[11px] text-sadu-muted">
                Sharjah Department of Culture &middot; 12th Sharjah Calligraphy Biennial
              </span>
            </div>
          </div>

          <div>
            {isContractSigned ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Signed &middot; {activeContract.signatureReference || 'REF-SCB-EXEC'}
              </span>
            ) : isContractDispatched ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">
                <Clock className="h-3.5 w-3.5" />
                Action Required &middot; Pending Your Signature
              </span>
            ) : (
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 border border-stone-200">
                Awaiting Contract Formulation by Coordinator
              </span>
            )}
          </div>
        </div>

        {/* Contract Details */}
        {activeContract.status === 'NOT_DRAFTED' ? (
          <div className="rounded-lg border border-dashed border-sadu-gold/60 p-6 text-center text-xs text-sadu-muted">
            <Clock className="mx-auto h-8 w-8 text-sadu-muted/60 mb-2" />
            <p className="font-semibold text-sadu-charcoal">
              The Biennial Coordinator has not yet finalized your bilateral agreement terms.
            </p>
            <p className="mt-1">
              Once formulated in Stage 6, you will be able to review the production budget, shipping coverage, and execute your agreement here.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-sadu-gold/50 bg-white p-3">
                <span className="text-[10px] font-bold uppercase text-sadu-muted block">Production Budget (AED)</span>
                <strong className="text-base text-sadu-charcoal mt-0.5 block">
                  AED {activeContract.productionCost.toLocaleString()}
                </strong>
                <span className="text-[10px] text-emerald-800 font-semibold block">Full institutional coverage</span>
              </div>

              <div className="rounded-md border border-sadu-gold/50 bg-white p-3">
                <span className="text-[10px] font-bold uppercase text-sadu-muted block">Proposed Artwork</span>
                <strong className="text-sm text-sadu-charcoal mt-0.5 block truncate">
                  "{activeContract.proposedWorkTitle}"
                </strong>
                <span className="text-[10px] text-sadu-muted block">{activeContract.medium}</span>
              </div>

              <div className="rounded-md border border-sadu-gold/50 bg-white p-3">
                <span className="text-[10px] font-bold uppercase text-sadu-muted block">Shipping &amp; Insurance</span>
                <strong className="text-xs text-sadu-charcoal mt-0.5 block">
                  Department Direct Logistics
                </strong>
                <span className="text-[10px] text-sadu-muted block">Climate-controlled air freight</span>
              </div>
            </div>

            <div className="rounded-md border border-sadu-gold/50 bg-white p-3.5 space-y-1.5">
              <span className="font-bold text-sadu-charcoal block">Shipping &amp; Delivery Provisions:</span>
              <p className="text-sadu-muted leading-relaxed">
                {activeContract.shippingTerms}
              </p>
            </div>
            {/* Tranches Schedule */}
            <div className="rounded-md border border-sadu-gold/50 bg-white p-3.5 space-y-2">
              <span className="font-bold text-sadu-charcoal block">Disbursement Milestones:</span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded bg-sadu-sand/40 p-2">
                  <span className="text-[10px] text-sadu-muted uppercase block font-semibold">Advance (30%)</span>
                  <strong className="text-sadu-charcoal">AED {Math.round(activeContract.productionCost * 0.3).toLocaleString()}</strong>
                  <span className={`text-[9px] font-bold block mt-0.5 ${
                    activeContract.tranches.advanceStatus === 'DISBURSED' ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {activeContract.tranches.advanceStatus === 'DISBURSED' ? 'Paid' : 'Pending'}
                  </span>
                </div>
                <div className="rounded bg-sadu-sand/40 p-2">
                  <span className="text-[10px] text-sadu-muted uppercase block font-semibold">Delivery (40%)</span>
                  <strong className="text-sadu-charcoal">AED {Math.round(activeContract.productionCost * 0.4).toLocaleString()}</strong>
                  <span className={`text-[9px] font-bold block mt-0.5 ${
                    activeContract.tranches.deliveryStatus === 'DISBURSED' ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {activeContract.tranches.deliveryStatus === 'DISBURSED' ? 'Paid' : 'Pending'}
                  </span>
                </div>
                <div className="rounded bg-sadu-sand/40 p-2">
                  <span className="text-[10px] text-sadu-muted uppercase block font-semibold">Installation (30%)</span>
                  <strong className="text-sadu-charcoal">AED {Math.round(activeContract.productionCost * 0.3).toLocaleString()}</strong>
                  <span className={`text-[9px] font-bold block mt-0.5 ${
                    activeContract.tranches.installationStatus === 'DISBURSED' ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {activeContract.tranches.installationStatus === 'DISBURSED' ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Mandatory Cancellation Clause */}
            <div className="rounded-md border border-sadu-gold/50 bg-amber-50/60 p-3 text-[11px] text-amber-950 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <Lock className="h-3 w-3 text-amber-800" /> Mandatory Department Clause
              </span>
              <p className="italic text-amber-900">
                "The Department of Culture reserves the right to cancel or alter any artwork or project that does not align with the Department's institutional vision, curatorial brief, or public exhibition standards."
              </p>
            </div>

            {/* Signature Area */}
            {!isContractSigned && isContractDispatched && (
              <form onSubmit={handleSign} className="rounded-lg border-2 border-sadu-brick bg-white p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="agreeContract"
                    checked={agreeTerms}
                    onChange={e => setAgreeTerms(e.target.checked)}
                    className="h-4 w-4 rounded border-sadu-gold text-sadu-brick focus:ring-sadu-brick cursor-pointer"
                  />
                  <label htmlFor="agreeContract" className="text-xs font-semibold text-sadu-charcoal cursor-pointer">
                    I confirm acceptance of the production values, shipping provisions, and milestone schedule.
                  </label>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
                  <div className="w-full sm:w-1/2">
                    <label className="block text-[11px] font-bold text-sadu-charcoal mb-1">
                      Signatory Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={signerName}
                      onChange={e => setSignerName(e.target.value)}
                      placeholder="Enter legal name"
                      className="w-full rounded border border-sadu-gold/70 px-3 py-1.5 text-xs font-semibold text-sadu-charcoal"
                    />
                  </div>

                  <div className="flex items-center gap-2 self-end">
                    <button
                      type="button"
                      onClick={() => setIsDisputeModalOpen(true)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-amber-600/60 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 cursor-pointer shadow-xs"
                    >
                      <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
                      <span>Request Amendment (طلب تعديل)</span>
                    </button>

                    <button
                      type="submit"
                      disabled={!agreeTerms || !signerName.trim()}
                      className="inline-flex items-center justify-center gap-1.5 rounded-md bg-sadu-brick px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-sadu-brick-dark disabled:opacity-40 cursor-pointer"
                    >
                      <FileSignature className="h-3.5 w-3.5" />
                      <span>Approve &amp; Sign Bilateral Agreement (توقيع رسمي)</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {activeContract.status === 'CONTRACT_DISPUTED' && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs space-y-2 text-amber-950">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                    <AlertCircle className="h-4 w-4 text-amber-700" />
                    <span>Amendment Request Submitted (طلب تعديل قيد المراجعة)</span>
                  </div>
                  <span className="rounded bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                    Queued for Coordinator
                  </span>
                </div>
                {activeContract.auditTrail && activeContract.auditTrail.length > 0 && (
                  <div className="bg-white/90 rounded border border-amber-200 p-2.5 text-xs text-sadu-charcoal space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-amber-800">
                        Disputed Category: {activeContract.auditTrail[activeContract.auditTrail.length - 1].disputedCategory.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-sadu-muted">
                        {activeContract.auditTrail[activeContract.auditTrail.length - 1].requestedAt}
                      </span>
                    </div>
                    <p className="italic text-[11px] text-stone-800">
                      "{activeContract.auditTrail[activeContract.auditTrail.length - 1].artistJustification}"
                    </p>
                  </div>
                )}
                <p className="text-[11px] text-amber-800">
                  The General Coordinator will review your requested parameters. Signatures are locked until revised terms are dispatched.
                </p>
              </div>
            )}

            {activeContract.status === 'AMENDMENT_UNDER_REVIEW' && (
              <div className="rounded-lg border border-sky-300 bg-sky-50/80 p-4 text-xs space-y-2 text-sky-950">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-sky-900">
                    <Clock className="h-4 w-4 text-sky-700" />
                    <span>Amendment Under Active Revision (تعديل قيد المراجعة والتسوية)</span>
                  </div>
                  <span className="rounded bg-sky-200 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-900">
                    Portal Locked
                  </span>
                </div>
                <p className="text-[11px] text-sky-900 leading-relaxed">
                  The General Coordinator is currently adjusting contract parameters and tranche disbursements in the Institutional Contract Workspace. The agreement is temporarily locked to prevent concurrent edits. You will receive an updated agreement upon dispatch.
                </p>
              </div>
            )}

            {activeContract.auditTrail && activeContract.auditTrail.length > 0 && (
              <div className="rounded-lg border border-sadu-gold/50 bg-white p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-sadu-gold/30 pb-1.5">
                  <span className="font-bold text-sadu-charcoal text-xs">
                    Institutional Audit Trail &middot; Negotiation Rounds (سجل المفاوضات الرسمي)
                  </span>
                  <span className="text-[10px] font-mono text-sadu-muted">
                    {activeContract.auditTrail.length} Round{activeContract.auditTrail.length > 1 ? 's' : ''} Logged
                  </span>
                </div>
                <div className="space-y-2 divide-y divide-sadu-gold/20">
                  {activeContract.auditTrail.map((round, idx) => (
                    <div key={round.id || idx} className="pt-2 first:pt-0 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-sadu-charcoal">
                          Round #{idx + 1}: {round.disputedCategory.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sadu-muted">{round.requestedAt}</span>
                      </div>
                      <p className="text-[11px] text-stone-700 bg-stone-50 p-2 rounded border border-stone-200">
                        <strong className="text-sadu-muted block text-[10px]">Artist Justification:</strong>
                        {round.artistJustification}
                      </p>
                      {round.coordinatorResolutionNotes && (
                        <p className="text-[11px] text-emerald-900 bg-emerald-50 p-2 rounded border border-emerald-200">
                          <strong className="text-emerald-800 block text-[10px]">
                            Coordinator Resolution ({round.resolvedAt || 'Resolved'}):
                          </strong>
                          {round.coordinatorResolutionNotes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isContractSigned && (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50/70 p-3 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-emerald-950">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  <div>
                    <span className="font-bold block">
                      Bilateral Agreement Signed by {activeContract.artistName}
                    </span>
                    <span className="text-[10px] text-emerald-800">
                      Executed: {activeContract.signedAt || '2026-09-24'} &middot; Reference: {activeContract.signatureReference || 'REF-SCB-EXEC'}
                    </span>
                  </div>
                </div>
                <span className="rounded bg-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-900 self-start sm:self-auto">
                  Legally Locked
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      {/* 4. Section: Document Intake (Passport & 300 DPI Artwork Master) */}
      <div className="rounded-xl border border-sadu-gold bg-sadu-paper p-6 shadow-xs space-y-5">
        <div className="border-b border-sadu-gold/40 pb-3">
          <h2 className="font-editorial text-lg font-bold text-sadu-charcoal">
            Institutional Intake &amp; Catalog Publishing Clearance
          </h2>
          <p className="text-xs text-sadu-muted">
            Uploaded materials are routed directly to the PR &amp; Protocol Desk (التشريفات) for visa processing and catalog master plate engraving.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 text-xs">
          {/* Passport Upload Card */}
          <div className="rounded-lg border border-sadu-gold/60 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sadu-charcoal flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-sadu-brick" />
                1. Official Passport Scan (Visa Processing)
              </span>
              <span className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                activeContract.documents.passportStatus === 'VERIFIED'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : activeContract.documents.passportStatus === 'SUBMITTED'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-stone-100 text-stone-600'
              }`}>
                {activeContract.documents.passportStatus.replace(/_/g, ' ')}
              </span>
            </div>

            <p className="text-[11px] text-sadu-muted leading-relaxed">
              Required by UAE Protocol &amp; SDC Public Relations for entry visa issuance, VIP flight accommodation, and official hotel check-in.
            </p>

            {activeContract.documents.passportFileName ? (
              <div className="rounded bg-sadu-sand/40 p-2.5 border border-sadu-gold/40 text-[11px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sadu-charcoal">{activeContract.documents.passportFileName}</span>
                  {activeContract.documents.passportStatus === 'VERIFIED' && (
                    <span className="text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> PR Cleared
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-sadu-muted block">
                  Uploaded: {activeContract.documents.passportUploadedAt || '2026-09-24'}
                </span>
              </div>
            ) : (
              <form onSubmit={handlePassportUploadSubmit} className="space-y-2">
                <input
                  type="text"
                  value={passportFileInput}
                  onChange={e => setPassportFileInput(e.target.value)}
                  placeholder="e.g. Passport_Scan_Valid_2027.pdf"
                  className="w-full rounded border border-sadu-gold/70 px-3 py-1.5 text-xs text-sadu-charcoal"
                />
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded bg-sadu-charcoal px-3 py-1.5 text-xs font-bold text-white hover:bg-stone-800 cursor-pointer shadow-2xs"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Official Passport Scan</span>
                </button>
              </form>
            )}
          </div>

          {/* 300 DPI Artwork File Upload Card */}
          <div className="rounded-lg border border-sadu-gold/60 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sadu-charcoal flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-sadu-ochre" />
                2. Master Artwork File (300 DPI Catalog Spec)
              </span>
              <span className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                activeContract.documents.highResStatus === 'VERIFIED'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : activeContract.documents.highResStatus === 'SUBMITTED'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-stone-100 text-stone-600'
              }`}>
                {activeContract.documents.highResStatus.replace(/_/g, ' ')}
              </span>
            </div>

            <p className="text-[11px] text-sadu-muted leading-relaxed">
              Mandatory high-resolution print file for the official Sharjah Calligraphy Biennial hardcover catalog and gallery entrance wall texts.
            </p>

            {activeContract.documents.highResArtworkFileName ? (
              <div className="rounded bg-sadu-sand/40 p-2.5 border border-sadu-gold/40 text-[11px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sadu-charcoal">{activeContract.documents.highResArtworkFileName}</span>
                  <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-900 border border-amber-300">
                    300 DPI Validated
                  </span>
                </div>
                <span className="text-[10px] text-sadu-muted block">
                  Status: {activeContract.documents.highResStatus === 'VERIFIED' ? 'Approved for catalog print' : 'Pending PR catalog review'}
                </span>
              </div>
            ) : (
              <form onSubmit={handleArtworkUploadSubmit} className="space-y-2">
                <input
                  type="text"
                  value={artworkFileInput}
                  onChange={e => setArtworkFileInput(e.target.value)}
                  placeholder="e.g. Master_Plate_Calligraphy_300DPI.tiff"
                  className="w-full rounded border border-sadu-gold/70 px-3 py-1.5 text-xs text-sadu-charcoal"
                />
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded bg-sadu-ochre px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 cursor-pointer shadow-2xs"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload 300 DPI Master Print File</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Catalog Biography / Wall Text Section */}
        <div className="border-t border-sadu-gold/30 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-editorial text-sm font-bold text-sadu-charcoal">
                Exhibition Wall Text &amp; Bilingual Catalog Biography
              </h3>
              <p className="text-[11px] text-sadu-muted">
                Official text used alongside the artwork plaque and printed biennial publications.
              </p>
            </div>
            <span className="rounded bg-sadu-sand px-2 py-0.5 text-[9px] font-bold text-sadu-muted border border-sadu-gold/50">
              PR &amp; Editorial Verification
            </span>
          </div>

          <form onSubmit={handleBioSubmit} className="grid gap-3 sm:grid-cols-2 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-sadu-charcoal mb-1">
                Arabic Biography (السيرة الذاتية بالعربية)
              </label>
              <textarea
                dir="rtl"
                rows={3}
                value={bioArInput}
                onChange={e => setBioArInput(e.target.value)}
                placeholder="نبذة عن المسيرة الفنية والمشاركات الدولية..."
                className="w-full rounded border border-sadu-gold/70 p-2 text-xs text-sadu-charcoal font-serif"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-sadu-charcoal mb-1">
                English Biography
              </label>
              <textarea
                rows={3}
                value={bioEnInput}
                onChange={e => setBioEnInput(e.target.value)}
                placeholder="Artist biographical statement and major international exhibitions..."
                className="w-full rounded border border-sadu-gold/70 p-2 text-xs text-sadu-charcoal"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded bg-sadu-charcoal px-3 py-1.5 text-xs font-bold text-white hover:bg-stone-800 cursor-pointer shadow-2xs"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Save Wall Text &amp; Biography</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {isDisputeModalOpen && (
        <ContractDisputeModal
          artistName={activeContract.artistName}
          currentGrant={activeContract.productionCost}
          onSubmitAmendment={(category, justification) => {
            onRequestAmendment?.(activeContract.id, category, justification);
            setIsDisputeModalOpen(false);
          }}
          onClose={() => setIsDisputeModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ArtistPortalWorkspace;



