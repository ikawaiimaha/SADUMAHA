import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Truck, 
  ShieldCheck, 
  Send,
  UserCheck,
  Award,
  Lock,
  MessageSquareWarning,
  RefreshCw
} from 'lucide-react';
import { NegotiationRound } from '../types';

// --- Types ---
interface ApprovedArtist {
  id: string;
  name: string;
  arabicName: string;
  category: 'Emerging' | 'Established';
  nationality: string;
  medium: string;
  status: 'DIRECTOR_APPROVED' | 'CONTRACT_PENDING_SIGNATURE' | 'CONTRACT_DISPUTED';
}

type TrancheStructure = 'STANDARD_SPLIT' | 'SINGLE_DISBURSAL';
type ShippingMethod = 'FINE_ART_COURIER' | 'AIR_FREIGHT' | 'LOCAL_UAE';

const MOCK_APPROVED_ARTISTS: ApprovedArtist[] = [
  {
    id: 'ART-001',
    name: 'Yousef Nabhan',
    arabicName: 'يوسف نبهان',
    category: 'Established',
    nationality: 'Jordanian / UAE',
    medium: 'Large-scale Kufic bronze sculpture',
    status: 'CONTRACT_DISPUTED' // Seeded with an active dispute for demonstration
  },
  {
    id: 'ART-002',
    name: 'Noura Al-Mazrouei',
    arabicName: 'نورة المزروعي',
    category: 'Emerging',
    nationality: 'UAE',
    medium: 'Digital Lightbox Installation',
    status: 'DIRECTOR_APPROVED'
  }
];

const TOTAL_CHAIRMAN_BUDGET = 250000; // AED Total Allocated Ceiling

export default function CoordinatorContractWorkspace() {
  const [artists, setArtists] = useState<ApprovedArtist[]>(MOCK_APPROVED_ARTISTS);
  const [selectedArtist, setSelectedArtist] = useState<ApprovedArtist | null>(MOCK_APPROVED_ARTISTS[0]);
  
  // Contract Terms State per artist ID
  const [grantsMap, setGrantsMap] = useState<Record<string, number>>({
    'ART-001': 35000,
    'ART-002': 25000
  });

  // Locked dispatched grants and generated contracts tracking
  const [dispatchedGrants, setDispatchedGrants] = useState<Record<string, number>>({});
  const [generatedContracts, setGeneratedContracts] = useState<Record<string, boolean>>({});

  // Active negotiation/dispute log mapping per artist
  const [disputeLogs, setDisputeLogs] = useState<Record<string, NegotiationRound[]>>({
    'ART-001': [
      {
        id: 'NEG-01',
        contractId: 'CON-001',
        disputedCategory: 'PRODUCTION_GRANT',
        justification: 'Requested an upward adjustment to AED 45,000 due to specialized fine-art bronze foundry expenses in Amman.',
        proposedValue: 45000,
        status: 'PENDING_COORDINATOR_REVIEW',
        createdAt: '2026-09-25T10:00:00Z'
      }
    ]
  });

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('FINE_ART_COURIER');
  const [trancheStructure, setTrancheStructure] = useState<TrancheStructure>('STANDARD_SPLIT');

  // Preserve stored zero grant explicitly using !== undefined
  const currentProductionGrant = selectedArtist 
    ? (grantsMap[selectedArtist.id] !== undefined ? grantsMap[selectedArtist.id] : 30000) 
    : 0;

  // Total committed budget strictly from successfully dispatched/updated contracts
  const totalDispatchedCommitted = Object.values(dispatchedGrants).reduce((acc, val) => acc + val, 0);

  const isAlreadyDispatched = selectedArtist ? !!generatedContracts[selectedArtist.id] && selectedArtist.status !== 'CONTRACT_DISPUTED' : false;
  const isDisputed = selectedArtist ? selectedArtist.status === 'CONTRACT_DISPUTED' : false;

  const proposedTotalCommitted = totalDispatchedCommitted + currentProductionGrant;
  const isOverBudget = proposedTotalCommitted > TOTAL_CHAIRMAN_BUDGET;

  const trancheBreakdown = trancheStructure === 'STANDARD_SPLIT' 
    ? { adv: currentProductionGrant * 0.3, freight: currentProductionGrant * 0.4, final: currentProductionGrant * 0.3 }
    : { adv: 0, freight: 0, final: currentProductionGrant };

  const handleGrantChange = (val: number) => {
    if (!selectedArtist || isAlreadyDispatched) return;
    const sanitizedVal = Math.max(0, val);
    setGrantsMap(prev => ({
      ...prev,
      [selectedArtist.id]: sanitizedVal
    }));
  };

  const handleResolveAndRedispatch = () => {
    if (!selectedArtist) return;
    if (currentProductionGrant < 0) {
      alert("Error: Production grant cannot be a negative value.");
      return;
    }

    // Resolve active dispute logs for this artist
    setDisputeLogs(prev => ({
      ...prev,
      [selectedArtist.id]: (prev[selectedArtist.id] || []).map(r => ({ ...r, status: 'RESOLVED_BY_COORDINATOR' }))
    }));

    // Lock updated grant and mark contract re-dispatched
    setDispatchedGrants(prev => ({ ...prev, [selectedArtist.id]: currentProductionGrant }));
    setGeneratedContracts(prev => ({ ...prev, [selectedArtist.id]: true }));

    // Update artist status back to pending signature
    setArtists(prev => prev.map(a => a.id === selectedArtist.id ? { ...a, status: 'CONTRACT_PENDING_SIGNATURE' } : a));
  };

  return (
    <div className="min-h-screen bg-[#F7F1E6] p-6 text-[#2C2A29] font-sans text-start" dir="ltr">
      {/* Header */}
      <header className="mb-8 border-b border-[#D9D2C5] pb-4 flex justify-between items-end">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8C7A6B] font-semibold">Stage 6 • Bilateral Contracting & Negotiation</span>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-[#1A1817] mt-1">Coordinator Contract Workspace</h1>
          <p className="text-[#6B635B] text-sm mt-1">
            المنسق العام — Manage active agreements, review artist dispute requests, and calibrate financial commitments.
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-md border border-[#D9D2C5] text-xs font-mono shadow-sm">
          Allocated Budget: <span className="font-bold text-[#8B4513]">{TOTAL_CHAIRMAN_BUDGET.toLocaleString()} AED</span> | Committed: <span className="font-bold text-[#1A1817]">{totalDispatchedCommitted.toLocaleString()} AED</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1: Approved Artist Ingestion Queue with Dispute Flags */}
        <section className="bg-white p-5 rounded-lg shadow-sm border border-[#D9D2C5] flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-[#EAE3D9] pb-3">
            <UserCheck className="w-5 h-5 text-[#8B4513]" />
            <h2 className="text-base font-semibold font-serif">Active Contract Roster ({artists.length})</h2>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[550px] pe-1">
            {artists.map((artist) => {
              const isSelected = selectedArtist?.id === artist.id;
              const hasDispute = artist.status === 'CONTRACT_DISPUTED';
              const isDispatched = artist.status === 'CONTRACT_PENDING_SIGNATURE' && !hasDispute;

              return (
                <button 
                  key={artist.id}
                  type="button"
                  onClick={() => setSelectedArtist(artist)}
                  className={`w-full text-start p-4 rounded-md border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[#8B4513] ${
                    isSelected 
                      ? 'border-[#8B4513] bg-[#FDFBF7] shadow-sm ring-1 ring-[#8B4513]' 
                      : 'border-[#D9D2C5] bg-white hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-sm text-[#1A1817] flex items-center gap-1.5">
                        {artist.name}
                        {hasDispute && <MessageSquareWarning className="w-4 h-4 text-amber-700 animate-pulse" />}
                        {isDispatched && <Lock className="w-3 h-3 text-[#8B4513]" />}
                      </h3>
                      <p className="text-xs text-[#8C7A6B] font-serif">{artist.arabicName}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      artist.category === 'Established' ? 'bg-[#8B4513]/10 text-[#8B4513]' : 'bg-[#5C6F58]/10 text-[#5C6F58]'
                    }`}>
                      {artist.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B635B] mb-2">{artist.medium}</p>
                  <div className="flex justify-between items-center text-[11px] text-[#8C7A6B] border-t border-[#F2ECE1] pt-2">
                    <span>{artist.nationality}</span>
                    <span className={`font-medium px-2 py-0.5 rounded text-[10px] ${
                      hasDispute ? 'bg-amber-100 text-amber-800' : isDispatched ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-700'
                    }`}>
                      {hasDispute ? 'Dispute Pending' : isDispatched ? 'Pending Signature' : 'Ready'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Column 2 & 3: Agreement Editor & Active Dispute Queue Panel */}
        <section className="lg:col-span-2 space-y-6">
          {selectedArtist ? (
            <div className="space-y-6">
              
              {/* Active Dispute Notification Banner */}
              {isDisputed && disputeLogs[selectedArtist.id]?.some(r => r.status === 'PENDING_COORDINATOR_REVIEW') && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-serif font-bold text-base">
                    <MessageSquareWarning className="w-5 h-5 text-amber-700" />
                    <span>Formal Amendment Requested by Artist (طلب تعديل معلق)</span>
                  </div>
                  {disputeLogs[selectedArtist.id].filter(r => r.status === 'PENDING_COORDINATOR_REVIEW').map(round => (
                    <div key={round.id} className="bg-white p-4 rounded border border-amber-200 text-xs space-y-2 font-sans">
                      <div className="flex justify-between text-amber-900 font-semibold">
                        <span>Disputed Category: <span className="font-mono text-[#8B4513]">{round.disputedCategory}</span></span>
                        {round.proposedValue && (
                          <span className="bg-amber-100 px-2 py-0.5 rounded font-mono text-amber-950">
                            Proposed Counter: AED {round.proposedValue.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-[#5C554E] italic font-serif bg-[#FAF8F5] p-2.5 rounded border border-[#E3DAC9]">
                        "{round.justification}"
                      </p>
                      <p className="text-[10px] text-stone-400">Logged on: {new Date(round.createdAt || '').toLocaleString()}</p>
                    </div>
                  ))}
                  <p className="text-xs text-amber-900">
                    * Adjust the production grant or terms below to reflect negotiations, then click <strong className="font-semibold">Re-dispatch Agreement</strong> to clear the dispute.
                  </p>
                </div>
              )}

              {/* Main Contract Configuration Card */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-[#D9D2C5]">
                
                <div className="flex justify-between items-center mb-6 border-b border-[#EAE3D9] pb-4">
                  <div>
                    <span className="text-xs text-[#8C7A6B] uppercase font-mono">Configuring Agreement For:</span>
                    <h2 className="text-xl font-serif font-bold text-[#1A1817]">{selectedArtist.name} ({selectedArtist.arabicName})</h2>
                  </div>
                  <div className="flex items-center gap-2 bg-[#FAF8F5] px-3 py-1.5 rounded border border-[#D9D2C5]">
                    <Award className="w-4 h-4 text-[#8B4513]" />
                    <span className="text-xs font-medium">{selectedArtist.category} Tier</span>
                  </div>
                </div>

                {/* Form Controls */}
                <div className="space-y-6">
                  
                  {/* Production Grant Input */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A1817] mb-1 flex items-center justify-between">
                      <span>Production Grant Allocation (AED)</span>
                      <span className="text-xs text-[#8C7A6B]">Adjustable for counter-allocations</span>
                    </label>
                    <div className="relative">
                      <span className="absolute start-3 top-2.5 text-[#8C7A6B] font-mono text-sm">AED</span>
                    <input 
                      type="number"
                      min="0"
                      disabled={isAlreadyDispatched}
                      value={currentProductionGrant}
                      onChange={(e) => handleGrantChange(Number(e.target.value))}
                      className={`w-full ps-14 pe-4 py-2 border border-[#D9D2C5] rounded-md bg-[#FAF8F5] text-sm font-mono focus:ring-1 focus:ring-[#8B4513] focus:border-[#8B4513] ${
                        isAlreadyDispatched ? 'opacity-60 cursor-not-allowed bg-stone-100' : ''
                      }`}
                    />
                  </div>
                  {isOverBudget && !isAlreadyDispatched && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Warning: Proposed commitment exceeds the Chairman’s approved budget ceiling (250,000 AED)! Dispatch is blocked.</span>
                    </div>
                  )}
                </div>

                {/* Shipping & Freight Method */}
                <div>
                  <label className="block text-sm font-medium text-[#1A1817] mb-1 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#8C7A6B]" />
                    Shipping & Freight Method
                  </label>
                  <select 
                    value={shippingMethod}
                    disabled={isAlreadyDispatched}
                    onChange={(e) => setShippingMethod(e.target.value as ShippingMethod)}
                    className={`w-full p-2.5 border border-[#D9D2C5] rounded-md bg-[#FAF8F5] text-sm ${
                      isAlreadyDispatched ? 'opacity-60 cursor-not-allowed bg-stone-100' : ''
                    }`}
                  >
                    <option value="FINE_ART_COURIER">Fine Art Courier (Door-to-Door Secured Transit)</option>
                    <option value="AIR_FREIGHT">Air Freight (Airport-to-Airport Logistics)</option>
                    <option value="LOCAL_UAE">Local UAE Transportation (Sharjah Direct Delivery)</option>
                  </select>
                </div>

                {/* Disbursement Tranche Structure */}
                <div>
                  <label className="block text-sm font-medium text-[#1A1817] mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#8C7A6B]" />
                    Disbursement Tranche Structure
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`p-3 border rounded-md transition-all flex flex-col justify-between ${
                      isAlreadyDispatched ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                    } ${trancheStructure === 'STANDARD_SPLIT' ? 'border-[#8B4513] bg-[#FDFBF7]' : 'border-[#D9D2C5]'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <input 
                          type="radio" 
                          name="tranche" 
                          disabled={isAlreadyDispatched}
                          checked={trancheStructure === 'STANDARD_SPLIT'}
                          onChange={() => setTrancheStructure('STANDARD_SPLIT')}
                          className="text-[#8B4513]"
                        />
                        <span className="text-xs font-bold uppercase">Standard Institutional Split</span>
                      </div>
                      <p className="text-[11px] text-[#6B635B]">30% Advance | 40% Freight | 30% Post-Installation</p>
                    </label>

                    <label className={`p-3 border rounded-md transition-all flex flex-col justify-between ${
                      isAlreadyDispatched ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                    } ${trancheStructure === 'SINGLE_DISBURSAL' ? 'border-[#8B4513] bg-[#FDFBF7]' : 'border-[#D9D2C5]'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <input 
                          type="radio" 
                          name="tranche" 
                          disabled={isAlreadyDispatched}
                          checked={trancheStructure === 'SINGLE_DISBURSAL'}
                          onChange={() => setTrancheStructure('SINGLE_DISBURSAL')}
                          className="text-[#8B4513]"
                        />
                        <span className="text-xs font-bold uppercase">Single Installation Disbursal</span>
                      </div>
                      <p className="text-[11px] text-[#6B635B]">100% Post-Exhibition Clearing</p>
                    </label>
                  </div>

                  {/* Calculated Tranche Preview Box */}
                <div className="mt-3 bg-[#FAF8F5] p-3 rounded border border-[#D9D2C5] grid grid-cols-3 gap-2 text-center font-mono text-xs">
                  <div>
                    <span className="block text-[10px] text-[#8C7A6B]">Tranche 1 (Advance)</span>
                    <strong className="text-[#1A1817]">{trancheBreakdown.adv.toLocaleString()} AED</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#8C7A6B]">Tranche 2 (Dispatch)</span>
                    <strong className="text-[#1A1817]">{trancheBreakdown.freight.toLocaleString()} AED</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#8C7A6B]">Tranche 3 (Final)</span>
                    <strong className="text-[#1A1817]">{trancheBreakdown.final.toLocaleString()} AED</strong>
                  </div>
                </div>
              </div>

              {/* Institutional Protective Clause (Read-Only) */}
              <div className="bg-[#FAF6EE] p-4 rounded-md border border-[#E3DAC9]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8B4513] mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Institutional Protective Clause (Sharjah Department of Culture)
                </h4>
                <p className="text-[11px] text-[#5C554E] leading-relaxed font-serif">
                  "The Department reserves full administrative authority to modify, reschedule, or cancel exhibition terms in alignment with overarching cultural directives. All copyright permissions remain vested with the artist while granting Sharjah Department of Culture reproduction rights for catalog and archival documentation."
                </p>
              </div>

                  {/* Action Footer */}
                  <div className="pt-2 border-t border-[#EAE3D9] flex items-center justify-between">
                    <div className="text-xs text-[#8C7A6B]">
                      {isDisputed ? 'Resolving active dispute & updating agreement' : 'Ready for automated PDF compilation'}
                    </div>

                    <button
                      type="button"
                      onClick={handleResolveAndRedispatch}
                      disabled={isOverBudget || currentProductionGrant < 0}
                      className="flex items-center gap-2 bg-[#8B4513] hover:bg-[#6e350f] disabled:bg-[#D9D2C5] text-white py-2.5 px-6 rounded-md text-xs font-bold transition-colors shadow-sm cursor-pointer"
                    >
                      {isDisputed ? <RefreshCw className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                      <span>{isDisputed ? 'Resolve Dispute & Re-dispatch Agreement' : 'Generate & Dispatch Agreement'}</span>
                    </button>
                  </div>

                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white p-12 rounded-lg shadow-sm border border-[#D9D2C5] text-center text-[#8C7A6B]">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Select an artist from the roster to view or configure their agreement terms.</p>
            </div>
          )}
        </section>

    </div>
  </div>
);
}
