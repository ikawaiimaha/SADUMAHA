import React from 'react';
import { ShieldCheck, Truck, Lock, CheckCircle2 } from 'lucide-react';

interface FinanceTrackerProps {
  artistName: string;
  artistStatus: string;
  onClearPhysicalAsset: () => void;
  onAuthorizeFinalDisbursal: () => void;
}

export default function FinanceMilestoneTracker({ artistName, artistStatus, onClearPhysicalAsset, onAuthorizeFinalDisbursal }: FinanceTrackerProps) {
  const isPhysicalCleared = artistStatus === 'PHYSICAL_ASSET_RECEIVED' || artistStatus === 'CLEARED_FOR_FINANCE';

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-[#D9D2C5] font-sans text-start" dir="ltr">
      <div className="flex justify-between items-center mb-6 border-b border-[#EAE3D9] pb-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8C7A6B] font-semibold">Stage 7 • Financial Execution</span>
          <h2 className="text-xl font-serif font-bold text-[#1A1817] mt-1">Milestone Verification: {artistName}</h2>
        </div>
        <span className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase ${
          isPhysicalCleared ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
        }`}>
          Status: {artistStatus}
        </span>
      </div>

      <div className="space-y-6">
        
        {/* Milestone 1: Digital Passport & Media Verification (PR & Protocol) */}
        <div className="p-4 rounded-md border border-[#D9D2C5] bg-[#FAF8F5] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <div>
              <h4 className="text-sm font-semibold text-[#1A1817]">Milestone 1: Digital Asset & Passport Clearance</h4>
              <p className="text-xs text-[#6B635B]">Verified by PR & Protocol (التشريفات)</p>
            </div>
          </div>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">Cleared</span>
        </div>

        {/* Milestone 2: Physical Crate Arrival & Condition Reporting */}
        <div className="p-4 rounded-md border border-[#D9D2C5] bg-[#FAF8F5] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-[#8B4513]" />
            <div>
              <h4 className="text-sm font-semibold text-[#1A1817]">Milestone 2: Physical Asset Arrival & Condition Inspection</h4>
              <p className="text-xs text-[#6B635B]">Sharjah Logistics Hub Sign-off required before final tranche release</p>
            </div>
          </div>
          {isPhysicalCleared ? (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">Crate Cleared</span>
          ) : (
            <button
              type="button"
              onClick={onClearPhysicalAsset}
              className="bg-[#2C2A29] hover:bg-[#1A1817] text-white px-4 py-2 rounded text-xs font-medium transition-colors"
            >
              Verify & Sign-off Crate Arrival
            </button>
          )}
        </div>

        {/* Milestone 3: Final Tranche Disbursal (Finance Execution Locked behind Milestone 2) */}
        <div className="p-4 rounded-md border border-[#D9D2C5] bg-[#FAF8F5] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#8B4513]" />
            <div>
              <h4 className="text-sm font-semibold text-[#1A1817]">Milestone 3: Final Financial Disbursal (المالية)</h4>
              <p className="text-xs text-[#6B635B]">Authorizes release of remaining 30% contract value</p>
            </div>
          </div>
          
          {isPhysicalCleared ? (
            <button
              type="button"
              onClick={onAuthorizeFinalDisbursal}
              className="bg-[#8B4513] hover:bg-[#6e350f] text-white px-4 py-2 rounded text-xs font-medium shadow-sm transition-colors"
            >
              Authorize Final Disbursal
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded border border-amber-200">
              <Lock className="w-3.5 h-3.5" />
              <span>Locked: Awaiting Physical Asset Crate Sign-off</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
