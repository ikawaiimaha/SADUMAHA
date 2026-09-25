import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  DollarSign, 
  FileText, 
  Truck, 
  UserCheck, 
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { BilateralContract, DisbursementRecord } from '../types/contractStage6';

export interface FinancialRecord {
  id: string;
  artistName: string;
  arabicName: string;
  totalGrant: number;
  contractSigned: boolean;
  prCleared: boolean;
  physicalAssetReceived: boolean;
  advancePaid: boolean;
  finalPaid: boolean;
}

const MOCK_FINANCIAL_RECORDS: FinancialRecord[] = [
  {
    id: 'FIN-001',
    artistName: 'Yousef Nabhan',
    arabicName: 'يوسف نبهان',
    totalGrant: 35000,
    contractSigned: true,
    prCleared: true,
    physicalAssetReceived: true,
    advancePaid: true,
    finalPaid: false
  },
  {
    id: 'FIN-002',
    artistName: 'Noura Al-Mazrouei',
    arabicName: 'نورة المزروعي',
    totalGrant: 25000,
    contractSigned: true,
    prCleared: false,
    physicalAssetReceived: false,
    advancePaid: false,
    finalPaid: false
  }
];

const DEFAULT_TOTAL_CHAIRMAN_BUDGET = 250000;

export interface FinanceWorkspaceProps {
  assignedBudget?: number | null;
  contracts?: BilateralContract[];
  disbursementHistory?: DisbursementRecord[];
  onDisburseTranche?: (
    contractId: string,
    trancheType: 'Advance (30%)' | 'Delivery (40%)' | 'Installation (30%)',
    amount: number
  ) => void;
  onBackToRoles?: () => void;
}

export default function FinanceWorkspace({
  assignedBudget,
  contracts,
  disbursementHistory = [],
  onDisburseTranche,
  onBackToRoles
}: FinanceWorkspaceProps = {}) {
  const totalBudget = (assignedBudget !== null && assignedBudget !== undefined && assignedBudget > 0)
    ? assignedBudget
    : DEFAULT_TOTAL_CHAIRMAN_BUDGET;

  // Track physical asset status locally if not stored on contract
  const [physicalReceivedMap, setPhysicalReceivedMap] = useState<Record<string, boolean>>({
    'contract-dossier-1': true,
    'FIN-001': true,
  });

  const initialRecords: FinancialRecord[] = contracts && contracts.length > 0
    ? contracts.map(c => ({
        id: c.id,
        artistName: c.artistName,
        arabicName: (c as any).artistArabicName || (
          c.artistName === 'Yousef Nabhan' ? 'يوسف نبهان' :
          c.artistName === 'Hassan Sharif' ? 'حسن شريف' :
          c.artistName === 'Mohamed Zakariya' ? 'محمد زكريا' :
          'فنان مشارك'
        ),
        totalGrant: c.productionCost,
        contractSigned: c.status === 'ARTIST_APPROVED' || c.status === 'LOCKED',
        prCleared: c.documents.passportStatus === 'VERIFIED' && c.documents.highResStatus === 'VERIFIED',
        physicalAssetReceived: !!physicalReceivedMap[c.id],
        advancePaid: c.tranches.advanceStatus === 'DISBURSED',
        finalPaid: c.tranches.installationStatus === 'DISBURSED',
      }))
    : MOCK_FINANCIAL_RECORDS;

  const [records, setRecords] = useState<FinancialRecord[]>(initialRecords);
  const [selectedRecord, setSelectedRecord] = useState<FinancialRecord | null>(initialRecords[0] || null);

  // Sync if contracts or physical status change
  useEffect(() => {
    if (contracts && contracts.length > 0) {
      const mapped = contracts.map(c => ({
        id: c.id,
        artistName: c.artistName,
        arabicName: (c as any).artistArabicName || (
          c.artistName === 'Yousef Nabhan' ? 'يوسف نبهان' :
          c.artistName === 'Hassan Sharif' ? 'حسن شريف' :
          c.artistName === 'Mohamed Zakariya' ? 'محمد زكريا' :
          'فنان مشارك'
        ),
        totalGrant: c.productionCost,
        contractSigned: c.status === 'ARTIST_APPROVED' || c.status === 'LOCKED',
        prCleared: c.documents.passportStatus === 'VERIFIED' && c.documents.highResStatus === 'VERIFIED',
        physicalAssetReceived: !!physicalReceivedMap[c.id],
        advancePaid: c.tranches.advanceStatus === 'DISBURSED',
        finalPaid: c.tranches.installationStatus === 'DISBURSED',
      }));
      setRecords(mapped);
      setSelectedRecord(prev => mapped.find(m => m.id === prev?.id) || mapped[0] || null);
    }
  }, [contracts, physicalReceivedMap]);

  const totalDisbursed = records.reduce((acc, curr) => {
    let paid = 0;
    if (curr.advancePaid) paid += curr.totalGrant * 0.3;
    if (curr.finalPaid) paid += curr.totalGrant * 0.7;
    return acc + paid;
  }, 0);

  const handleAuthorizeDisbursal = (recordId: string, tranche: 'ADVANCE' | 'FINAL') => {
    const target = records.find(r => r.id === recordId);
    setRecords(prev => prev.map(item => {
      if (item.id === recordId) {
        if (tranche === 'ADVANCE') return { ...item, advancePaid: true };
        if (tranche === 'FINAL') return { ...item, finalPaid: true };
      }
      return item;
    }));

    if (target && onDisburseTranche) {
      if (tranche === 'ADVANCE') {
        onDisburseTranche(recordId, 'Advance (30%)', Math.round(target.totalGrant * 0.3));
      } else {
        onDisburseTranche(recordId, 'Installation (30%)', Math.round(target.totalGrant * 0.7));
      }
    }
  };

  const handleTogglePhysicalCargo = (recordId: string) => {
    setPhysicalReceivedMap(prev => ({
      ...prev,
      [recordId]: !prev[recordId]
    }));
  };

  return (
    <div className="min-h-screen bg-[#F7F1E6] p-6 text-[#2C2A29] font-sans text-start" dir="ltr">
      
      {/* Header */}
      <header className="mb-8 border-b border-[#D9D2C5] pb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8C7A6B] font-semibold">Stage 7 • Financial Execution &amp; Disbursal</span>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-[#1A1817] mt-1">Finance Workspace (المالية)</h1>
          <p className="text-[#6B635B] text-sm mt-1">
            Authorize payment tranches based strictly on system-verified milestones and locked contracts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-md border border-[#D9D2C5] text-xs font-mono shadow-xs flex items-center gap-3">
            <span>Allocated Budget: <strong className="text-[#8B4513]">{totalBudget.toLocaleString()} AED</strong></span>
            <span className="text-stone-300">|</span>
            <span>Total Disbursed: <strong className="text-[#1A1817]">{totalDisbursed.toLocaleString()} AED</strong></span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1: Financial Ledger Queue */}
        <section className="bg-white p-5 rounded-lg shadow-sm border border-[#D9D2C5] flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-[#EAE3D9] pb-3">
            <DollarSign className="w-5 h-5 text-[#8B4513]" />
            <h2 className="text-base font-semibold font-serif">Contract Ledger ({records.length})</h2>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[550px] pe-1">
            {records.map((rec) => {
              const isSelected = selectedRecord?.id === rec.id;
              const isFullyPaid = rec.advancePaid && rec.finalPaid;

              return (
                <button 
                  key={rec.id}
                  type="button"
                  onClick={() => setSelectedRecord(rec)}
                  className={`w-full text-start p-4 rounded-md border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[#8B4513] ${
                    isSelected 
                      ? 'border-[#8B4513] bg-[#FDFBF7] shadow-sm ring-1 ring-[#8B4513]' 
                      : 'border-[#D9D2C5] bg-white hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-sm text-[#1A1817]">{rec.artistName}</h3>
                      <p className="text-xs text-[#8C7A6B] font-serif">{rec.arabicName}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isFullyPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isFullyPaid ? 'Settled' : 'Active Ledger'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#8B4513] font-bold mb-2">Grant: AED {rec.totalGrant.toLocaleString()}</p>
                  <div className="flex justify-between items-center text-[11px] text-[#8C7A6B] border-t border-[#F2ECE1] pt-2">
                    <span>ID: {rec.id}</span>
                    <span className="font-medium text-stone-700">
                      {rec.finalPaid ? 'Final Tranche Released' : rec.advancePaid ? 'Advance Disbursed' : 'Pending Advance'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Column 2 & 3: Milestone Gate & Payment Disbursal Controls */}
        <section className="lg:col-span-2 space-y-6">
          {selectedRecord ? (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-[#D9D2C5]">
              
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6 border-b border-[#EAE3D9] pb-4">
                <div>
                  <span className="text-xs text-[#8C7A6B] uppercase font-mono">Milestone Execution For:</span>
                  <h2 className="text-xl font-serif font-bold text-[#1A1817]">{selectedRecord.artistName} ({selectedRecord.arabicName})</h2>
                </div>
                <div className="bg-[#FAF8F5] px-3 py-1.5 rounded border border-[#D9D2C5] text-xs font-mono font-bold text-[#8B4513]">
                  Total Grant: AED {selectedRecord.totalGrant.toLocaleString()}
                </div>
              </div>

              {/* Milestone Verifications Checklist */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B]">System-Verified Institutional Gates</h3>
                  <button
                    type="button"
                    onClick={() => handleTogglePhysicalCargo(selectedRecord.id)}
                    className="text-[11px] font-semibold text-[#8B4513] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{selectedRecord.physicalAssetReceived ? 'Crate Verified (Sharjah Hub)' : 'Toggle Crate Check-in'}</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className={`p-3 rounded-md border text-xs flex items-center gap-2.5 ${
                    selectedRecord.contractSigned ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-stone-50 border-stone-200 text-stone-500'
                  }`}>
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${selectedRecord.contractSigned ? 'text-emerald-700' : 'text-stone-400'}`} />
                    <span>Contract Countersigned</span>
                  </div>

                  <div className={`p-3 rounded-md border text-xs flex items-center gap-2.5 ${
                    selectedRecord.prCleared ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-stone-50 border-stone-200 text-stone-500'
                  }`}>
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${selectedRecord.prCleared ? 'text-emerald-700' : 'text-stone-400'}`} />
                    <span>PR Asset Verification</span>
                  </div>

                  <div className={`p-3 rounded-md border text-xs flex items-center gap-2.5 ${
                    selectedRecord.physicalAssetReceived ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-stone-50 border-stone-200 text-stone-500'
                  }`}>
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${selectedRecord.physicalAssetReceived ? 'text-emerald-700' : 'text-stone-400'}`} />
                    <span>Physical Cargo Arrived</span>
                  </div>
                </div>
              </div>

              {/* Payment Tranches */}
              <div className="space-y-4 pt-4 border-t border-[#EAE3D9]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B]">Tranche Disbursal Execution</h3>

                {/* Tranche 1: Advance */}
                <div className="p-4 rounded-md border border-[#D9D2C5] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#1A1817]">Tranche 1: Advance Disbursal (30%)</h4>
                    <p className="text-[11px] text-[#6B635B]">Released upon contract countersignature</p>
                    <strong className="text-xs font-mono text-[#8B4513] mt-1 block">{(selectedRecord.totalGrant * 0.3).toLocaleString()} AED</strong>
                  </div>

                  {selectedRecord.advancePaid ? (
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200 flex items-center gap-1 self-start sm:self-auto">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Disbursed
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={!selectedRecord.contractSigned}
                      onClick={() => handleAuthorizeDisbursal(selectedRecord.id, 'ADVANCE')}
                      className="bg-[#8B4513] hover:bg-[#6e350f] disabled:bg-[#D9D2C5] disabled:cursor-not-allowed text-white px-4 py-2 rounded text-xs font-bold transition-colors cursor-pointer shadow-sm self-start sm:self-auto"
                    >
                      Authorize Advance Payment
                    </button>
                  )}
                </div>

                {/* Tranche 2 & 3: Final Clearing */}
                <div className="p-4 rounded-md border border-[#D9D2C5] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#1A1817]">Tranches 2 &amp; 3: Final Installation Clearing (70%)</h4>
                    <p className="text-[11px] text-[#6B635B]">Locked until PR clearance and physical crate arrival</p>
                    <strong className="text-xs font-mono text-[#8B4513] mt-1 block">{(selectedRecord.totalGrant * 0.7).toLocaleString()} AED</strong>
                  </div>

                  {selectedRecord.finalPaid ? (
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200 flex items-center gap-1 self-start sm:self-auto">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Fully Settled
                    </span>
                  ) : (selectedRecord.prCleared && selectedRecord.physicalAssetReceived) ? (
                    <button
                      type="button"
                      onClick={() => handleAuthorizeDisbursal(selectedRecord.id, 'FINAL')}
                      className="bg-[#8B4513] hover:bg-[#6e350f] text-white px-4 py-2 rounded text-xs font-bold transition-colors cursor-pointer shadow-sm self-start sm:self-auto"
                    >
                      Authorize Final Clearing
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded border border-amber-200 font-medium self-start sm:self-auto">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Locked: Awaiting PR &amp; Logistics Sign-off</span>
                    </div>
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white p-12 rounded-lg shadow-sm border border-[#D9D2C5] text-center text-[#8C7A6B]">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Select a contract record from the ledger to manage milestone disbursals.</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
