import React, { useState } from 'react';
import { FileSignature, Lock } from 'lucide-react';
import { useGovernance } from '../../context/GovernanceContext';

const CANCELLATION_CLAUSE = "Department reserves the right to cancel/change any artwork not aligning with the Department's vision.";

// Coordinator-only: builds and dispatches a contract once an artist has accepted their invitation.
export const ContractBuilder: React.FC = () => {
  const { nominations, contracts, generateContract } = useGovernance();
  const eligible = nominations.filter(nom => nom.approvalStatus === 'INVITATION_ACCEPTED');
  const [shippingTerms, setShippingTerms] = useState<Record<string, string>>({});
  const [productionCost, setProductionCost] = useState<Record<string, string>>({});

  const handleGenerate = (artistId: string) => {
    const terms = shippingTerms[artistId]?.trim();
    if (!terms) return;
    const costValue = productionCost[artistId]?.trim();
    generateContract({
      artistId,
      shippingTerms: terms,
      productionCost: costValue ? Number(costValue) : null,
    });
  };

  if (!eligible.length) return null;

  return (
    <section className="rounded-lg border border-sadu-gold bg-sadu-linen p-4 shadow-xs sm:p-6 space-y-4">
      <div>
        <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">Contract Builder</h2>
        <p className="text-xs text-sadu-muted">Available once an artist has accepted their institutional invitation.</p>
      </div>

      {eligible.map(nom => {
        const contract = contracts.find(c => c.artistId === nom.id);
        return (
          <div key={nom.id} className="rounded-md border border-sadu-gold/50 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-sadu-charcoal">{nom.artistName}</span>
              {contract && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">{contract.status.replace(/_/g, ' ')}</span>
              )}
            </div>

            {!contract ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-sadu-charcoal">
                    Shipping Agreements
                    <textarea
                      value={shippingTerms[nom.id] ?? ''}
                      onChange={e => setShippingTerms(current => ({ ...current, [nom.id]: e.target.value }))}
                      rows={3}
                      placeholder="Describe crating, insurance and freight responsibilities..."
                      className="mt-1 w-full rounded border border-sadu-gold/60 px-3 py-2 text-sm resize-none"
                    />
                  </label>
                  <label className="text-xs font-semibold text-sadu-charcoal">
                    Production Value (if any)
                    <input
                      type="number"
                      value={productionCost[nom.id] ?? ''}
                      onChange={e => setProductionCost(current => ({ ...current, [nom.id]: e.target.value }))}
                      placeholder="AED"
                      className="mt-1 w-full rounded border border-sadu-gold/60 px-3 py-2 text-sm"
                    />
                  </label>
                </div>

                <label className="flex items-start gap-2 rounded border border-sadu-gold/40 bg-sadu-sand p-3 text-xs text-sadu-charcoal">
                  <input type="checkbox" checked disabled className="mt-0.5" />
                  <span className="flex items-center gap-1"><Lock size={11} className="shrink-0"/> {CANCELLATION_CLAUSE}</span>
                </label>

                <button
                  type="button"
                  onClick={() => handleGenerate(nom.id)}
                  disabled={!shippingTerms[nom.id]?.trim()}
                  className="flex items-center gap-2 rounded bg-sadu-brick px-4 py-2 text-xs font-bold text-white hover:bg-sadu-brick-dark disabled:opacity-50"
                >
                  <FileSignature size={14}/>
                  Generate & Send Contract
                </button>
              </>
            ) : (
              <p className="text-xs text-sadu-muted">Contract routed to {nom.artistName}'s secure portal for final e-signature.</p>
            )}
          </div>
        );
      })}
    </section>
  );
};
