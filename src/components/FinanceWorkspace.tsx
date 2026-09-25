import React, { useState } from 'react';
import {
  FileText,
  Lock,
  CheckCircle2,
  DollarSign,
  Clock,
  RotateCcw,
  Send,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  Layers,
  ArrowRight,
  Truck,
} from 'lucide-react';
import { BilateralContract, DisbursementRecord } from '../types/contractStage6';
import FinanceMilestoneTracker from './FinanceMilestoneTracker';

export interface FinanceWorkspaceProps {
  assignedBudget: number | null;
  contracts: BilateralContract[];
  disbursementHistory: DisbursementRecord[];
  onDisburseTranche: (
    contractId: string,
    trancheType: 'Advance (30%)' | 'Delivery (40%)' | 'Installation (30%)',
    amount: number
  ) => void;
  onBackToRoles?: () => void;
}

export const FinanceWorkspace: React.FC<FinanceWorkspaceProps> = ({
  assignedBudget,
  contracts,
  disbursementHistory,
  onDisburseTranche,
  onBackToRoles,
}) => {
  const [selectedDisbursementModal, setSelectedDisbursementModal] = useState<{
    contract: BilateralContract;
    trancheType: 'Advance (30%)' | 'Delivery (40%)' | 'Installation (30%)';
    amount: number;
  } | null>(null);

  // Hardening #3: Physical crate arrival state per contract
  const [clearedPhysicalCrates, setClearedPhysicalCrates] = useState<Record<string, boolean>>({
    'contract-dossier-1': true, // Hassan Sharif sample crate cleared
  });
  const [activeMilestoneTrackerContract, setActiveMilestoneTrackerContract] = useState<BilateralContract | null>(null);

  // Invariant 6: Financial Lock Gate Check
  const isBudgetAuthorized = assignedBudget !== null && assignedBudget > 0;

  // Contracts that are legally signed/locked
  const signedContracts = contracts.filter(
    c => c.status === 'ARTIST_APPROVED' || c.status === 'LOCKED'
  );

  // Financial calculations
  const totalBudget = assignedBudget || 0;
  const committedSpend = signedContracts.reduce((sum, c) => sum + (c.productionCost || 0), 0);
  const totalDisbursed = disbursementHistory.reduce((sum, r) => sum + r.amount, 0);
  const remainingLiquidity = isBudgetAuthorized ? Math.max(0, totalBudget - totalDisbursed) : 0;
  const remainingReserve = isBudgetAuthorized ? Math.max(0, totalBudget - committedSpend) : 0;

  const disbursedPct = totalBudget > 0 ? Math.min(100, Math.round((totalDisbursed / totalBudget) * 100)) : 0;
  const committedPct = totalBudget > 0 ? Math.min(100, Math.round((committedSpend / totalBudget) * 100)) : 0;

  const handleConfirmDisbursement = () => {
    if (!selectedDisbursementModal) return;
    onDisburseTranche(
      selectedDisbursementModal.contract.id,
      selectedDisbursementModal.trancheType,
      selectedDisbursementModal.amount
    );
    setSelectedDisbursementModal(null);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* 1. Header */}
      <div className="rounded-xl border border-sadu-gold bg-sadu-paper p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-sadu-gold/40 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sadu-ochre text-white shadow-xs">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-ochre uppercase tracking-wider border border-sadu-gold/60">
                  Stage 6 &middot; Financial Execution
                </span>
                <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-700">
                  الإدارة المالية
                </span>
              </div>
              <h1 className="font-editorial text-2xl font-bold text-sadu-charcoal mt-1">
                Finance Workspace (المالية)
              </h1>
              <p className="text-xs text-sadu-muted">
                Bilateral Contracts Execution, Milestone Tranche Disbursements &amp; Budget Reconciliation
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

        {/* 2. Invariant 6: Financial Lock Gate Alert */}
        <div className="pt-4">
          {isBudgetAuthorized ? (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50/70 p-3.5 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-emerald-950">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-200 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold block">
                    Financial Gate Open &middot; Budget Authorized by Chairman H.E. Abdullah Al Owais
                  </span>
                  <span className="text-[11px] text-emerald-800">
                    Appropriation: AED {totalBudget.toLocaleString()} &middot; Authority transferred to Finance for bilateral contract execution.
                  </span>
                </div>
              </div>
              <span className="rounded bg-emerald-200 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-900 self-start sm:self-auto">
                Authorized
              </span>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 text-xs space-y-1.5 text-amber-950 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Lock className="h-4 w-4 text-amber-800" />
                <span>Financial Lock Gate: Awaiting Chairman Budget Authorization (Stage 1 Invariant)</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Tranche disbursement is strictly locked. Finance cannot execute milestone disbursements until Chairman Al Owais approves the theme and assigns the Biennial budget.
              </p>
            </div>
          )}
        </div>
        {/* 3. Macro Budget Ledger Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-4 text-xs">
          <div className="rounded-lg border border-sadu-gold/60 bg-white p-3.5 shadow-2xs text-center">
            <span className="text-[10px] font-bold uppercase text-sadu-muted tracking-wider block">
              Total Budget
            </span>
            <span className="font-editorial text-xl font-bold text-sadu-charcoal mt-1 block">
              {isBudgetAuthorized ? `AED ${totalBudget.toLocaleString()}` : 'Awaiting Auth'}
            </span>
          </div>

          <div className="rounded-lg border border-sadu-gold/60 bg-white p-3.5 shadow-2xs text-center">
            <span className="text-[10px] font-bold uppercase text-sadu-muted tracking-wider block">
              Committed Contracts
            </span>
            <span className="font-editorial text-xl font-bold text-amber-800 mt-1 block">
              AED {committedSpend.toLocaleString()}
            </span>
          </div>

          <div className="rounded-lg border border-sadu-gold/60 bg-white p-3.5 shadow-2xs text-center">
            <span className="text-[10px] font-bold uppercase text-sadu-muted tracking-wider block">
              Total Disbursed
            </span>
            <span className="font-editorial text-xl font-bold text-emerald-800 mt-1 block">
              AED {totalDisbursed.toLocaleString()}
            </span>
          </div>

          <div className="rounded-lg border border-sadu-gold/60 bg-white p-3.5 shadow-2xs text-center">
            <span className="text-[10px] font-bold uppercase text-sadu-muted tracking-wider block">
              Uncommitted Reserve
            </span>
            <span className="font-editorial text-xl font-bold text-sadu-muted mt-1 block">
              {isBudgetAuthorized ? `AED ${remainingReserve.toLocaleString()}` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Visual Multi-Segment Progress Bar */}
        {isBudgetAuthorized && (
          <div className="pt-4 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[11px] text-sadu-muted">
              <span>Budget Consumption Progress</span>
              <span>
                {disbursedPct}% Disbursed &middot; {committedPct}% Committed of AED {totalBudget.toLocaleString()}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-sadu-sand overflow-hidden flex border border-sadu-gold/40">
              <div
                style={{ width: `${disbursedPct}%` }}
                className="bg-emerald-700 transition-all duration-500"
                title={`Disbursed: ${disbursedPct}%`}
              />
              <div
                style={{ width: `${Math.max(0, committedPct - disbursedPct)}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Committed pending disbursement: ${Math.max(0, committedPct - disbursedPct)}%`}
              />
            </div>
          </div>
        )}

      </div>
      {/* 4. Tranche Execution Table & Matrix */}
      <div className="rounded-xl border border-sadu-gold bg-sadu-paper p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-sadu-gold/40 pb-3">
          <div>
            <h2 className="font-editorial text-base font-bold text-sadu-charcoal">
              Bilateral Contracts Tranche Execution Matrix
            </h2>
            <p className="text-xs text-sadu-muted">
              Milestone disbursements: 30% Pre-Production Advance, 40% Mid-Term Delivery, 30% Installation &amp; Sign-off.
            </p>
          </div>
          <span className="rounded bg-sadu-sand px-2.5 py-1 text-[10px] font-bold text-sadu-ochre border border-sadu-gold/60">
            {signedContracts.length} Locked Contracts Eligible
          </span>
        </div>

        <div className="space-y-3">
          {contracts.map(contract => {
            const isSigned = contract.status === 'ARTIST_APPROVED' || contract.status === 'LOCKED';
            const canDisburse = isBudgetAuthorized && isSigned;

            const isAdvancePaid = contract.tranches.advanceStatus === 'DISBURSED';
            const isDeliveryPaid = contract.tranches.deliveryStatus === 'DISBURSED';
            const isInstallationPaid = contract.tranches.installationStatus === 'DISBURSED';

            return (
              <div
                key={contract.id}
                className={`rounded-lg border p-4 shadow-2xs space-y-3 text-xs transition-colors ${
                  !isSigned
                    ? 'border-stone-200 bg-stone-50/60 opacity-80'
                    : 'border-sadu-gold/60 bg-white'
                }`}
              >
                {/* Contract Row Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-sadu-gold/20 pb-2.5">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-bold text-sadu-charcoal">{contract.artistName}</strong>
                    <span className="rounded bg-sadu-sand px-2 py-0.5 text-[9px] font-bold text-sadu-muted border border-sadu-gold/40">
                      {contract.artistCategory}
                    </span>
                    <span className="text-[11px] text-sadu-muted">&middot; "{contract.proposedWorkTitle}"</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sadu-charcoal">
                      Total: AED {contract.productionCost.toLocaleString()}
                    </span>
                    {isSigned ? (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                        Contract Locked
                      </span>
                    ) : (
                      <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600 border border-stone-200">
                        Pending Artist Acceptance
                      </span>
                    )}
                  </div>
                </div>

                {/* Tranches Action Grid */}
                <div className="grid gap-3 sm:grid-cols-3">
                  {/* Tranche 1: Advance */}
                  <div className="rounded border border-sadu-gold/40 bg-sadu-sand/20 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sadu-charcoal">1. Advance (30%)</span>
                      <strong className="text-sadu-charcoal">
                        AED {Math.round(contract.productionCost * 0.3).toLocaleString()}
                      </strong>
                    </div>

                    {isAdvancePaid ? (
                      <div className="rounded bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-800 border border-emerald-300 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-700" /> Disbursed
                        </span>
                        <span>{contract.tranches.advanceVoucherRef || 'VCH-2026-01'}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDisbursementModal({
                            contract,
                            trancheType: 'Advance (30%)',
                            amount: Math.round(contract.productionCost * 0.3),
                          })
                        }
                        disabled={!canDisburse}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded bg-emerald-800 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                      >
                        {!canDisburse && <Lock className="h-3 w-3" />}
                        <span>Disburse Advance (30%)</span>
                      </button>
                    )}
                  </div>
                  {/* Tranche 2: Delivery */}
                  <div className="rounded border border-sadu-gold/40 bg-sadu-sand/20 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sadu-charcoal">2. Delivery (40%)</span>
                      <strong className="text-sadu-charcoal">
                        AED {Math.round(contract.productionCost * 0.4).toLocaleString()}
                      </strong>
                    </div>

                    {isDeliveryPaid ? (
                      <div className="rounded bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-800 border border-emerald-300 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-700" /> Disbursed
                        </span>
                        <span>{contract.tranches.deliveryVoucherRef || 'VCH-2026-02'}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDisbursementModal({
                            contract,
                            trancheType: 'Delivery (40%)',
                            amount: Math.round(contract.productionCost * 0.4),
                          })
                        }
                        disabled={!canDisburse || !isAdvancePaid}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded bg-sadu-ochre px-2.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                      >
                        {(!canDisburse || !isAdvancePaid) && <Lock className="h-3 w-3" />}
                        <span>Disburse Delivery (40%)</span>
                      </button>
                    )}
                  </div>

                  {/* Tranche 3: Installation */}
                  <div className="rounded border border-sadu-gold/40 bg-sadu-sand/20 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sadu-charcoal">3. Installation (30%)</span>
                      <strong className="text-sadu-charcoal">
                        AED {Math.round(contract.productionCost * 0.3).toLocaleString()}
                      </strong>
                    </div>

                    {isInstallationPaid ? (
                      <div className="rounded bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-800 border border-emerald-300 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-700" /> Disbursed
                        </span>
                        <span>{contract.tranches.installationVoucherRef || 'VCH-2026-03'}</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveMilestoneTrackerContract(contract)}
                          className={`inline-flex w-full items-center justify-center gap-1.5 rounded border px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer ${
                            clearedPhysicalCrates[contract.id]
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                              : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                          }`}
                        >
                          <Truck className="h-3 w-3" />
                          <span>
                            {clearedPhysicalCrates[contract.id]
                              ? 'Crate Cleared (فحص الصندوق منجز)'
                              : 'Verify Crate Gate (فحص وصول الصندوق)'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedDisbursementModal({
                              contract,
                              trancheType: 'Installation (30%)',
                              amount: Math.round(contract.productionCost * 0.3),
                            })
                          }
                          disabled={!canDisburse || !isDeliveryPaid || !clearedPhysicalCrates[contract.id]}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded bg-sadu-charcoal px-2.5 py-1.5 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                        >
                          {(!canDisburse || !isDeliveryPaid || !clearedPhysicalCrates[contract.id]) && <Lock className="h-3 w-3" />}
                          <span>Disburse Closeout (30%)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {!isSigned && (
                  <p className="text-[10px] text-amber-800 italic">
                    * Payment tranches remain locked until the artist executes the bilateral agreement terms in the Artist Portal.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* 5. Executed Disbursements Ledger & Audit Trail */}
      <div className="rounded-xl border border-sadu-gold bg-sadu-paper p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-sadu-gold/40 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-sadu-ochre" />
            <div>
              <h2 className="font-editorial text-base font-bold text-sadu-charcoal">
                Institutional Disbursement Ledger &middot; Official Audit Trail
              </h2>
              <p className="text-xs text-sadu-muted">
                Immutable record of released financial vouchers reconciled against Chairman budget appropriation.
              </p>
            </div>
          </div>
          <span className="rounded bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-muted border border-sadu-gold/50">
            {disbursementHistory.length} Vouchers Recorded
          </span>
        </div>

        {disbursementHistory.length === 0 ? (
          <div className="rounded-lg border border-dashed border-sadu-gold/60 p-6 text-center text-xs text-sadu-muted">
            <Clock className="mx-auto h-7 w-7 text-sadu-muted/60 mb-2" />
            <p className="font-semibold text-sadu-charcoal">No payment vouchers released yet.</p>
            <p className="mt-1">
              Once contracts are locked and Finance executes payment tranches, the institutional ledger will populate here.
            </p>
          </div>
        ) : (
          <div className="rounded border border-sadu-gold/50 overflow-hidden bg-white text-xs">
            <table className="w-full text-start">
              <thead className="bg-sadu-sand/60 border-b border-sadu-gold/40 text-[10px] uppercase font-bold text-sadu-muted">
                <tr>
                  <th className="p-3">Voucher Ref</th>
                  <th className="p-3">Beneficiary (Artist)</th>
                  <th className="p-3">Tranche Phase</th>
                  <th className="p-3">Disbursed Amount</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3 text-end">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sadu-gold/20">
                {disbursementHistory.map(record => (
                  <tr key={record.id} className="hover:bg-sadu-sand/20">
                    <td className="p-3 font-mono font-bold text-sadu-charcoal">{record.voucherRef}</td>
                    <td className="p-3 font-semibold text-sadu-charcoal">{record.artistName}</td>
                    <td className="p-3 text-sadu-muted">{record.trancheType}</td>
                    <td className="p-3 font-bold text-emerald-800">AED {record.amount.toLocaleString()}</td>
                    <td className="p-3 text-sadu-muted text-[11px]">{record.disbursedAt}</td>
                    <td className="p-3 text-end">
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 border border-emerald-300">
                        Paid &middot; Settled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Disbursement Confirmation Modal */}
      {selectedDisbursementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-sadu-gold/40 pb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-sadu-ochre" />
                <h3 className="font-editorial text-base font-bold text-sadu-charcoal">
                  Execute Institutional Tranche
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDisbursementModal(null)}
                className="rounded p-1 text-sadu-muted hover:bg-stone-100 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="rounded-lg border border-sadu-gold/50 bg-sadu-sand/30 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-sadu-muted">Beneficiary:</span>
                <strong className="text-sadu-charcoal">{selectedDisbursementModal.contract.artistName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-sadu-muted">Artwork:</span>
                <span className="text-sadu-charcoal italic truncate max-w-[200px]">
                  "{selectedDisbursementModal.contract.proposedWorkTitle}"
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sadu-muted">Tranche:</span>
                <span className="font-bold text-sadu-charcoal">{selectedDisbursementModal.trancheType}</span>
              </div>
              <div className="flex justify-between border-t border-sadu-gold/30 pt-2 text-sm">
                <span className="font-bold text-sadu-charcoal">Total Payout:</span>
                <strong className="text-emerald-800 font-editorial text-base">
                  AED {selectedDisbursementModal.amount.toLocaleString()}
                </strong>
              </div>
            </div>

            <p className="text-[11px] text-sadu-muted leading-relaxed">
              Authorizing this release will generate an official treasury disbursement voucher (VCH-2026-X) and deduct the balance from Chairman Al Owais's approved biennial appropriation.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedDisbursementModal(null)}
                className="rounded px-4 py-2 text-xs font-bold text-sadu-muted hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisbursement}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-900 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm &amp; Execute Disbursement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hardening #3: Physical Logistics & Financial Milestone Verification Gate */}
      {activeMilestoneTrackerContract && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="max-w-2xl w-full relative">
            <button
              type="button"
              onClick={() => setActiveMilestoneTrackerContract(null)}
              className="absolute -top-10 end-0 text-white font-bold text-xs bg-black/50 hover:bg-black/70 rounded px-3 py-1 cursor-pointer"
            >
              ✕ Close
            </button>
            <FinanceMilestoneTracker
              artistName={activeMilestoneTrackerContract.artistName}
              artistStatus={
                clearedPhysicalCrates[activeMilestoneTrackerContract.id]
                  ? 'PHYSICAL_ASSET_RECEIVED'
                  : 'LOGISTICS_PENDING_PR'
              }
              onClearPhysicalAsset={() => {
                setClearedPhysicalCrates(prev => ({
                  ...prev,
                  [activeMilestoneTrackerContract.id]: true,
                }));
              }}
              onAuthorizeFinalDisbursal={() => {
                const contract = activeMilestoneTrackerContract;
                setActiveMilestoneTrackerContract(null);
                setSelectedDisbursementModal({
                  contract,
                  trancheType: 'Installation (30%)',
                  amount: Math.round(contract.productionCost * 0.3),
                });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceWorkspace;



