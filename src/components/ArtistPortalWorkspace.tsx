import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Upload, 
  ShieldCheck, 
  MessageSquareWarning, 
  Lock, 
  User, 
  Download,
  AlertCircle,
  FileCheck,
  RotateCcw,
  Clock
} from 'lucide-react';
import ContractDisputeModal from './ContractDisputeModal';
import { NegotiationRound } from '../types';
import { BilateralContract } from '../types/contractStage6';

export interface ArtistPortalProps {
  // App-level container props (Stage 6 Multi-contract integration)
  contracts?: BilateralContract[];
  onSignContract?: (contractId?: string, signerName?: string) => void;
  onRequestAmendment?: (
    contractId: string,
    category: NegotiationRound['disputedCategory'],
    justification: string,
    proposedGrant?: number
  ) => void;
  onUploadPassport?: (contractId: string, fileName: string) => void;
  onUploadHighResArtwork?: (contractId: string, fileName: string, dpi: number) => void;
  onSaveBio?: (contractId: string, bioAr: string, bioEn: string) => void;
  onBackToRoles?: () => void;

  // Single-artist external portal props
  artistName?: string;
  artistArabicName?: string;
  nationality?: string;
  medium?: string;
  productionGrant?: number;
  onSubmitDispute?: (category: NegotiationRound['disputedCategory'], justification: string, proposedGrant?: number) => void;
  onUploadLogistics?: (fileType: 'passport' | 'artwork') => void;
}

export type ArtistPortalWorkspaceProps = ArtistPortalProps;

export default function ArtistPortalWorkspace({
  contracts,
  onSignContract,
  onRequestAmendment,
  onUploadPassport,
  onUploadHighResArtwork,
  onSaveBio,
  onBackToRoles,
  artistName = 'Yousef Nabhan',
  artistArabicName = 'يوسف نبهان',
  nationality = 'Jordanian / UAE',
  medium = 'Large-scale Kufic bronze sculpture',
  productionGrant = 35000,
  onSubmitDispute,
  onUploadLogistics,
}: ArtistPortalProps) {
  // Pick active contract from contracts array if available
  const [selectedContractId, setSelectedContractId] = useState<string>(
    contracts?.[0]?.id || ''
  );

  const activeContract = contracts?.find(c => c.id === selectedContractId) || contracts?.[0];

  const currentArtistName = activeContract?.artistName || artistName;
  const currentArtistArabicName = (activeContract as any)?.artistArabicName || (
    currentArtistName === 'Yousef Nabhan' ? 'يوسف نبهان' :
    currentArtistName === 'Hassan Sharif' ? 'حسن شريف' :
    currentArtistName === 'Mohamed Zakariya' ? 'محمد زكريا' :
    artistArabicName
  );
  const currentNationality = activeContract?.nationality || nationality;
  const currentMedium = activeContract?.medium || medium;
  const currentGrant = activeContract?.productionCost || productionGrant;

  const [isSignedInternal, setIsSignedInternal] = useState<boolean>(false);
  const [showDisputeModal, setShowDisputeModal] = useState<boolean>(false);
  const [passportDoneInternal, setPassportDoneInternal] = useState<boolean>(false);
  const [artworkDoneInternal, setArtworkDoneInternal] = useState<boolean>(false);
  const [disputeSubmittedInternal, setDisputeSubmittedInternal] = useState<boolean>(false);

  const isSigned = activeContract 
    ? (activeContract.status === 'ARTIST_APPROVED' || activeContract.status === 'LOCKED')
    : isSignedInternal;

  const isDisputed = activeContract
    ? (activeContract.status === 'CONTRACT_DISPUTED' || disputeSubmittedInternal)
    : disputeSubmittedInternal;

  const isUnderReview = activeContract
    ? activeContract.status === 'AMENDMENT_UNDER_REVIEW'
    : false;

  const passportDone = activeContract
    ? (activeContract.documents.passportStatus === 'SUBMITTED' || activeContract.documents.passportStatus === 'VERIFIED')
    : passportDoneInternal;

  const artworkDone = activeContract
    ? (activeContract.documents.highResStatus === 'SUBMITTED' || activeContract.documents.highResStatus === 'VERIFIED')
    : artworkDoneInternal;

  const handleSign = () => {
    setIsSignedInternal(true);
    if (onSignContract) {
      if (activeContract) {
        onSignContract(activeContract.id, currentArtistName);
      } else {
        (onSignContract as any)();
      }
    }
  };

  const handleUpload = (type: 'passport' | 'artwork') => {
    if (type === 'passport') {
      setPassportDoneInternal(true);
      if (onUploadPassport && activeContract) {
        onUploadPassport(activeContract.id, `${currentArtistName.replace(/\s+/g, '_')}_Passport_Official.pdf`);
      }
    }
    if (type === 'artwork') {
      setArtworkDoneInternal(true);
      if (onUploadHighResArtwork && activeContract) {
        onUploadHighResArtwork(activeContract.id, `${currentArtistName.replace(/\s+/g, '_')}_Master_Artwork_300DPI.tiff`, 300);
      }
    }
    onUploadLogistics?.(type);
  };

  return (
    <div className="min-h-screen bg-[#F7F1E6] p-6 text-[#2C2A29] font-sans text-start" dir="ltr">
      
      {/* Header */}
      <header className="mb-8 border-b border-[#D9D2C5] pb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8C7A6B] font-semibold">Stage 6 &amp; 7 • External Artist Portal</span>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-[#1A1817] mt-1">Artist Portal Workspace</h1>
          <p className="text-[#6B635B] text-sm mt-1">
            بوابة الفنان الخارجية — Review agreement terms, execute digital signature, and submit secure logistics files.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-md border border-[#D9D2C5] text-xs font-mono shadow-xs flex items-center gap-2">
            <User className="w-4 h-4 text-[#8B4513]" />
            <span>{currentArtistName} ({currentArtistArabicName})</span>
          </div>
          {onBackToRoles && (
            <button
              type="button"
              onClick={onBackToRoles}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#D9D2C5] bg-white px-3 py-2 text-xs font-bold text-[#6B635B] hover:bg-stone-50 cursor-pointer shadow-xs transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Switch Role</span>
            </button>
          )}
        </div>
      </header>

      {/* Contract Switcher if multiple contracts passed */}
      {contracts && contracts.length > 1 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 bg-white p-3 rounded-md border border-[#D9D2C5]">
          <span className="text-xs font-bold text-[#8C7A6B] me-2">Your Agreements:</span>
          {contracts.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedContractId(c.id)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                (activeContract?.id === c.id)
                  ? 'bg-[#8B4513] text-white shadow-2xs'
                  : 'bg-stone-100 text-[#5C554E] hover:bg-stone-200'
              }`}
            >
              {c.proposedWorkTitle} &middot; {c.artistName}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1: Agreement Review & Action Panel */}
        <section className="lg:col-span-2 space-y-6">
          
          {/* Contract Overview Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#D9D2C5]">
            <div className="flex justify-between items-center mb-6 border-b border-[#EAE3D9] pb-4">
              <div>
                <span className="text-xs text-[#8C7A6B] uppercase font-mono">Dispatched Institutional Agreement</span>
                <h2 className="text-xl font-serif font-bold text-[#1A1817]">Sharjah Calligraphy Biennial Participation Contract</h2>
              </div>
              <span className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase ${
                isSigned
                  ? 'bg-emerald-100 text-emerald-800'
                  : isUnderReview
                  ? 'bg-sky-100 text-sky-800'
                  : isDisputed
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {isSigned
                  ? 'Status: Signed & Active'
                  : isUnderReview
                  ? 'Status: Under Coordinator Review'
                  : isDisputed
                  ? 'Status: Amendment Requested'
                  : 'Status: Pending Signature'}
              </span>
            </div>

            {/* Contract Summary Specs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-[#FAF8F5] p-4 rounded-md border border-[#D9D2C5]">
              <div>
                <span className="text-[10px] text-[#8C7A6B] uppercase block">Assigned Medium</span>
                <strong className="text-sm text-[#1A1817]">{currentMedium}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#8C7A6B] uppercase block">Production Grant Allocation</span>
                <strong className="text-sm font-mono text-[#8B4513]">AED {currentGrant.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#8C7A6B] uppercase block">Nationality / Origin</span>
                <strong className="text-sm text-[#1A1817]">{currentNationality}</strong>
              </div>
            </div>

            {/* Legal Document Preview Box */}
            <div className="border border-[#D9D2C5] rounded-md p-5 bg-stone-50/50 mb-6 font-serif text-xs leading-relaxed space-y-3 text-[#5C554E]">
              <p className="font-bold text-[#1A1817] font-sans uppercase tracking-wider text-[11px]">Key Terms &amp; Conditions Summary:</p>
              <p>
                1. The artist agrees to produce and deliver the commissioned work in strict accordance with the approved curatorial scope and technical guidelines established by the Head of International Programs (HIP).
              </p>
              <p>
                2. Disbursements shall be executed across standard institutional tranches (30% Advance upon countersignature, 40% upon freight dispatch, and 30% upon successful physical installation and condition clearance in Sharjah).
              </p>
              <p className="italic text-[#8B4513]">
                "The Department reserves full administrative authority to modify exhibition terms in alignment with overarching cultural directives. All copyright permissions remain vested with the artist while granting Sharjah Department of Culture reproduction rights for catalog and archival documentation."
              </p>
            </div>

            {/* Active Dispute / Negotiation Status Banner if Disputed or Under Review */}
            {(isDisputed || isUnderReview) && (
              <div className={`mb-6 rounded-md p-4 border text-xs space-y-2 ${
                isUnderReview ? 'border-sky-300 bg-sky-50 text-sky-950' : 'border-amber-300 bg-amber-50 text-amber-950'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {isUnderReview ? <Clock className="w-4 h-4 text-sky-700" /> : <MessageSquareWarning className="w-4 h-4 text-amber-700" />}
                  <span>
                    {isUnderReview
                      ? 'Amendment Under Active Revision (تعديل قيد المراجعة الفنية)'
                      : 'Formal Amendment Requested (طلب تعديل رسمي معلق)'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {isUnderReview
                    ? 'The General Coordinator is currently adjusting contract parameters and tranche allocations in the Coordinator Workspace. Signing is temporarily locked during revision.'
                    : 'Your amendment request has been logged and queued for the General Coordinator. Terms are pending administrative adjustment.'}
                </p>
                {activeContract?.auditTrail && activeContract.auditTrail.length > 0 && (
                  <div className="bg-white/80 p-2.5 rounded border border-amber-200 mt-1">
                    <span className="font-bold text-[10px] text-amber-900 block mb-0.5">Latest Dispute:</span>
                    <p className="italic text-stone-700 text-[11px]">
                      "{activeContract.auditTrail[activeContract.auditTrail.length - 1].artistJustification || activeContract.auditTrail[activeContract.auditTrail.length - 1].justification}"
                    </p>
                    {activeContract.auditTrail[activeContract.auditTrail.length - 1].proposedValue && (
                      <span className="text-[10px] font-mono text-amber-800 font-bold block mt-1">
                        Proposed Counter: AED {activeContract.auditTrail[activeContract.auditTrail.length - 1].proposedValue?.toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#EAE3D9]">
              <button
                type="button"
                onClick={() => alert("Downloading official bilingual contract PDF compiled for Sharjah Department of Culture...")}
                className="flex items-center gap-2 px-4 py-2 border border-[#D9D2C5] rounded-md text-xs font-bold text-[#6B635B] hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Contract PDF</span>
              </button>

              <div className="flex items-center gap-3">
                {!isSigned && !isDisputed && !isUnderReview && (
                  <button
                    type="button"
                    onClick={() => setShowDisputeModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-amber-300 bg-amber-50 rounded-md text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    <MessageSquareWarning className="w-3.5 h-3.5 text-amber-700" />
                    <span>Request Amendment</span>
                  </button>
                )}

                {isSigned ? (
                  <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 px-4 py-2 rounded border border-emerald-300 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Agreement Countersigned Successfully</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSign}
                    disabled={isDisputed || isUnderReview}
                    className="flex items-center gap-2 bg-[#8B4513] hover:bg-[#6e350f] disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Digitally Sign &amp; Countersign Agreement</span>
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Negotiation History Audit Trail */}
          {activeContract?.auditTrail && activeContract.auditTrail.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-[#D9D2C5] space-y-3">
              <div className="flex items-center justify-between border-b border-[#EAE3D9] pb-3">
                <h3 className="font-serif font-bold text-sm text-[#1A1817]">
                  Negotiation Audit Trail ({activeContract.auditTrail.length} Rounds)
                </h3>
                <span className="text-[10px] font-mono text-[#8C7A6B]">Sharjah Central Finance Compliant</span>
              </div>
              <div className="space-y-2.5">
                {activeContract.auditTrail.map((round, idx) => (
                  <div key={round.id || idx} className="rounded-md border border-[#D9D2C5] bg-[#FAF8F5] p-3 text-xs space-y-1">
                    <div className="flex justify-between items-center text-xs font-semibold text-[#1A1817]">
                      <span>Round #{idx + 1}: {round.disputedCategory?.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-[#8C7A6B]">{round.requestedAt || round.createdAt || '2026-09-25'}</span>
                    </div>
                    <p className="text-[11px] text-[#5C554E] italic bg-white p-2 rounded border border-[#EAE3D9]">
                      "{round.artistJustification || round.justification}"
                    </p>
                    {round.proposedValue && (
                      <span className="text-[10px] font-mono text-[#8B4513] font-bold block">
                        Proposed Counter: AED {round.proposedValue.toLocaleString()}
                      </span>
                    )}
                    {round.coordinatorResolutionNotes && (
                      <p className="text-[10px] text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">
                        <strong>Coordinator Resolution:</strong> {round.coordinatorResolutionNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>

        {/* Column 2: Secure Logistics File Uploads (logistics-secure Bucket) */}
        <section className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#D9D2C5]">
            <div className="flex items-center gap-2 mb-4 border-b border-[#EAE3D9] pb-3">
              <ShieldCheck className="w-5 h-5 text-[#8B4513]" />
              <h3 className="text-base font-semibold font-serif">Secure Logistics Files (مستندات الشحن)</h3>
            </div>
            
            <p className="text-xs text-[#6B635B] mb-5 leading-relaxed">
              Required for PR &amp; Protocol verification and customs clearance prior to financial release. Files route directly to the encrypted <code className="text-stone-700 bg-stone-100 px-1 py-0.5 rounded text-[11px]">logistics-secure</code> storage bucket.
            </p>

            <div className="space-y-4">
              
              {/* Passport Upload */}
              <div className="p-4 border border-[#D9D2C5] rounded-md bg-[#FAF8F5] flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-[#1A1817]">Official Passport Copy</h4>
                  <p className="text-[11px] text-[#8C7A6B]">PDF or high-res JPG (Min 300 DPI)</p>
                </div>
                {passportDone ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUpload('passport')}
                    className="flex items-center gap-1.5 bg-[#2C2A29] hover:bg-[#1A1817] text-white px-3.5 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Passport
                  </button>
                )}
              </div>

              {/* Artwork Images Upload */}
              <div className="p-4 border border-[#D9D2C5] rounded-md bg-[#FAF8F5] flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-[#1A1817]">High-Resolution Catalog Imagery</h4>
                  <p className="text-[11px] text-[#8C7A6B]">TIFF or PNG for publication &amp; press</p>
                </div>
                {artworkDone ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUpload('artwork')}
                    className="flex items-center gap-1.5 bg-[#2C2A29] hover:bg-[#1A1817] text-white px-3.5 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Imagery
                  </button>
                )}
              </div>

            </div>

            <div className="mt-6 p-3 bg-stone-50 rounded border border-stone-200 text-[11px] text-stone-600 flex items-start gap-2">
              <Lock className="w-4 h-4 text-[#8B4513] shrink-0 mt-0.5" />
              <span>
                Confidentiality Notice: Uploaded logistics data is restricted exclusively to PR &amp; Protocol, Finance, and authorized curatorial administrators.
              </span>
            </div>

          </div>
        </section>

      </div>

      {/* Dispute Modal Triggered by Artist */}
      {showDisputeModal && (
        <ContractDisputeModal
          artistName={currentArtistName}
          currentGrant={currentGrant}
          onClose={() => setShowDisputeModal(false)}
          onSubmitAmendment={(category, justification, propGrant) => {
            setDisputeSubmittedInternal(true);
            onSubmitDispute?.(category, justification, propGrant);
            if (activeContract && onRequestAmendment) {
              onRequestAmendment(activeContract.id, category, justification, propGrant);
            }
            setShowDisputeModal(false);
          }}
        />
      )}

    </div>
  );
}
