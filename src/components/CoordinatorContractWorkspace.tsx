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
  Award
} from 'lucide-react';

// --- Types ---
interface ApprovedArtist {
  id: string;
  name: string;
  arabicName: string;
  category: 'Emerging' | 'Established';
  nationality: string;
  medium: string;
  status: 'DIRECTOR_APPROVED' | 'CONTRACT_PENDING_SIGNATURE';
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
    status: 'DIRECTOR_APPROVED'
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
  
  // Contract Terms State
  const [productionGrant, setProductionGrant] = useState<number>(35000);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('FINE_ART_COURIER');
  const [trancheStructure, setTrancheStructure] = useState<TrancheStructure>('STANDARD_SPLIT');
  const [contractGenerated, setContractGenerated] = useState<boolean>(false);

  // Computed total commitments across simulated roster
  const totalCommitted = productionGrant + 45000; // Simulated existing commitments
  const isOverBudget = totalCommitted > TOTAL_CHAIRMAN_BUDGET;

  // Tranche breakdown calculations
  const trancheBreakdown = trancheStructure === 'STANDARD_SPLIT' 
    ? { adv: productionGrant * 0.3, freight: productionGrant * 0.4, final: productionGrant * 0.3 }
    : { adv: 0, freight: 0, final: productionGrant };

  const handleGenerateContract = () => {
    if (!selectedArtist) return;
    setContractGenerated(true);
    // Updates status in state / triggers backend PDF generation sync
    setArtists(prev => prev.map(a => a.id === selectedArtist.id ? { ...a, status: 'CONTRACT_PENDING_SIGNATURE' } : a));
  };

  return (
    <div className="min-h-screen bg-[#F7F1E6] p-6 text-[#2C2A29] font-sans text-start" dir="ltr">
      {/* Header */}
      <header className="mb-8 border-b border-[#D9D2C5] pb-4 flex justify-between items-end">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8C7A6B] font-semibold">Stage 6 • Bilateral Contracting</span>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-[#1A1817] mt-1">Coordinator Contract Workspace</h1>
          <p className="text-[#6B635B] text-sm mt-1">
            المنسق العام — Configure production grants, shipping logistics, and auto-generate binding institutional agreements.
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-md border border-[#D9D2C5] text-xs font-mono shadow-sm">
          Allocated Budget Ceiling: <span className="font-bold text-[#8B4513]">{TOTAL_CHAIRMAN_BUDGET.toLocaleString()} AED</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1: Approved Artist Ingestion Queue */}
        <section className="bg-white p-5 rounded-lg shadow-sm border border-[#D9D2C5] flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-[#EAE3D9] pb-3">
            <UserCheck className="w-5 h-5 text-[#8B4513]" />
            <h2 className="text-base font-semibold font-serif">Approved Artists Queue ({artists.length})</h2>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[550px] pe-1">
            {artists.map((artist) => {
              const isSelected = selectedArtist?.id === artist.id;
              return (
                <div 
                  key={artist.id}
                  onClick={() => { setSelectedArtist(artist); setContractGenerated(false); }}
                  className={`p-4 rounded-md border cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-[#8B4513] bg-[#FDFBF7] shadow-sm ring-1 ring-[#8B4513]' 
                      : 'border-[#D9D2C5] bg-white hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-sm text-[#1A1817]">{artist.name}</h3>
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
                    <span className={`font-medium ${artist.status === 'DIRECTOR_APPROVED' ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {artist.status === 'DIRECTOR_APPROVED' ? 'Ready for Contract' : 'Contract Dispatched'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Column 2 & 3: Bilateral Contract Terms Form & Preview */}
        <section className="lg:col-span-2 space-y-6">
          {selectedArtist ? (
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
                    <span className="text-xs text-[#8C7A6B]">Max allowable per institutional scale</span>
                  </label>
                  <div className="relative">
                    <span className="absolute start-3 top-2.5 text-[#8C7A6B] font-mono text-sm">AED</span>
                    <input 
                      type="number"
                      value={productionGrant}
                      onChange={(e) => setProductionGrant(Number(e.target.value))}
                      className="w-full ps-14 pe-4 py-2 border border-[#D9D2C5] rounded-md bg-[#FAF8F5] text-sm font-mono focus:ring-1 focus:ring-[#8B4513] focus:border-[#8B4513]"
                    />
                  </div>
                  {isOverBudget && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Warning: Total commitments exceed the Chairman’s approved budget ceiling!</span>
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
                    onChange={(e) => setShippingMethod(e.target.value as ShippingMethod)}
                    className="w-full p-2.5 border border-[#D9D2C5] rounded-md bg-[#FAF8F5] text-sm"
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
                    <label className={`p-3 border rounded-md cursor-pointer transition-all flex flex-col justify-between ${
                      trancheStructure === 'STANDARD_SPLIT' ? 'border-[#8B4513] bg-[#FDFBF7]' : 'border-[#D9D2C5]'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <input 
                          type="radio" 
                          name="tranche" 
                          checked={trancheStructure === 'STANDARD_SPLIT'}
                          onChange={() => setTrancheStructure('STANDARD_SPLIT')}
                          className="text-[#8B4513]"
                        />
                        <span className="text-xs font-bold uppercase">Standard Institutional Split</span>
                      </div>
                      <p className="text-[11px] text-[#6B635B]">30% Advance | 40% Freight | 30% Post-Installation</p>
                    </label>

                    <label className={`p-3 border rounded-md cursor-pointer transition-all flex flex-col justify-between ${
                      trancheStructure === 'SINGLE_DISBURSAL' ? 'border-[#8B4513] bg-[#FDFBF7]' : 'border-[#D9D2C5]'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <input 
                          type="radio" 
                          name="tranche" 
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
                {contractGenerated ? (
                  <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 px-4 py-2 rounded border border-emerald-300 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Contract Generated & Dispatched to Artist Portal</span>
                  </div>
                ) : (
                  <div className="text-xs text-[#8C7A6B]">Ready for automated PDF compilation</div>
                )}

                <button
                  onClick={handleGenerateContract}
                  disabled={isOverBudget}
                  className="flex items-center gap-2 bg-[#2C2A29] hover:bg-[#1A1817] disabled:bg-[#D9D2C5] text-white py-2.5 px-6 rounded-md text-sm font-medium transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  Generate & Dispatch Agreement
                </button>
              </div>

            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-[#D9D2C5] text-center text-[#8C7A6B]">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Select an approved artist from the queue to configure bilateral contract terms.</p>
          </div>
        )}
      </section>

    </div>
  </div>
);
}
