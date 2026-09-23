import React from 'react';
import { WalletCards, Send } from 'lucide-react';
import { useGovernance } from '../../context/GovernanceContext';

const STATUS_LABEL: Record<string, string> = {
  PENDING_INITIAL: 'Pending Initial',
  INITIAL_PAID: 'Initial Paid',
  PENDING_FINAL: 'Pending Final',
  COMPLETED: 'Completed',
};

// Phase 7: Coordinator-side visibility into signed contracts awaiting Finance disbursement.
export const FinanceTracker: React.FC = () => {
  const { contracts, nominations, requestMilestoneDisbursement } = useGovernance();
  const signedContracts = contracts.filter(contract => contract.status === 'SIGNED');

  if (!signedContracts.length) return null;

  return (
    <section className="rounded-lg border border-sadu-gold bg-sadu-linen p-4 shadow-xs sm:p-6 space-y-4">
      <div>
        <h2 className="text-lg font-editorial font-bold text-sadu-charcoal flex items-center gap-2"><WalletCards className="h-4 w-4"/> Finance Tracker</h2>
        <p className="text-xs text-sadu-muted">Signed contracts and their live Finance disbursement status.</p>
      </div>

      <div className="rounded border border-sadu-gold/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-sadu-muted bg-sadu-sand border-b border-sadu-gold/40">
              <th className="px-4 py-2 font-medium">Artist</th>
              <th className="px-4 py-2 font-medium">Payment Structure</th>
              <th className="px-4 py-2 font-medium">Disbursement Status</th>
              <th className="px-4 py-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sadu-gold/20">
            {signedContracts.map(contract => {
              const artistName = nominations.find(nom => nom.id === contract.artistId)?.artistName ?? contract.artistId;
              const isComplete = contract.financeDisbursementStatus === 'COMPLETED';
              return (
                <tr key={contract.id}>
                  <td className="px-4 py-2 font-medium text-sadu-charcoal">{artistName}</td>
                  <td className="px-4 py-2 text-sadu-muted">{contract.paymentStructure === 'FULL_UPFRONT' ? 'Full Upfront' : 'Milestone Split'}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {STATUS_LABEL[contract.financeDisbursementStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => requestMilestoneDisbursement(contract.id)}
                      disabled={isComplete}
                      className="inline-flex items-center gap-1.5 rounded bg-sadu-brick px-3 py-1.5 text-xs font-bold text-white hover:bg-sadu-brick-dark disabled:opacity-50"
                    >
                      <Send size={12}/>
                      Request Milestone Disbursement
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
