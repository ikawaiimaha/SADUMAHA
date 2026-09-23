import React, { useState } from 'react';
import { FileSignature, Lock, PenLine } from 'lucide-react';
import { useGovernance } from '../../context/GovernanceContext';
import { PaymentStructure } from '../../types';

const CANCELLATION_CLAUSE = "Department reserves the right to cancel/change any artwork not aligning with the Department's vision.";

interface DraftState {
  paymentStructure: PaymentStructure;
  totalCost: string;
  initialTranche: string;
  finalTranche: string;
}

const emptyDraft: DraftState = { paymentStructure: 'FULL_UPFRONT', totalCost: '', initialTranche: '', finalTranche: '' };

// Coordinator-only: builds and dispatches a contract once an artist has accepted their invitation.
export const ContractBuilder: React.FC = () => {
  const { nominations, contracts, generateContract, markContractSigned } = useGovernance();
  const eligible = nominations.filter(nom => nom.approvalStatus === 'INVITATION_ACCEPTED');
  const [shippingTerms, setShippingTerms] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});

  const draftFor = (id: string) => drafts[id] ?? emptyDraft;
  const updateDraft = (id: string, patch: Partial<DraftState>) => {
    setDrafts(current => ({ ...current, [id]: { ...draftFor(id), ...patch } }));
  };

  const handleGenerate = (artistId: string) => {
    const terms = shippingTerms[artistId]?.trim();
    if (!terms) return;
    const draft = draftFor(artistId);
    generateContract({
      artistId,
      shippingTerms: terms,
      paymentStructure: draft.paymentStructure,
      productionCost: draft.paymentStructure === 'FULL_UPFRONT' && draft.totalCost.trim() ? Number(draft.totalCost) : null,
      initialPaymentAmount: draft.paymentStructure === 'MILESTONE_SPLIT' && draft.initialTranche.trim() ? Number(draft.initialTranche) : null,
      finalPaymentAmount: draft.paymentStructure === 'MILESTONE_SPLIT' && draft.finalTranche.trim() ? Number(draft.finalTranche) : null,
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
        const draft = draftFor(nom.id);
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
                <label className="text-xs font-semibold text-sadu-charcoal block">
                  Shipping Agreements
                  <textarea
                    value={shippingTerms[nom.id] ?? ''}
                    onChange={e => setShippingTerms(current => ({ ...current, [nom.id]: e.target.value }))}
                    rows={3}
                    placeholder="Describe crating, insurance and freight responsibilities..."
                    className="mt-1 w-full rounded border border-sadu-gold/60 px-3 py-2 text-sm resize-none"
                  />
                </label>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-sadu-charcoal block">Payment Structure</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateDraft(nom.id, { paymentStructure: 'FULL_UPFRONT' })}
                      className={`rounded px-3 py-1.5 text-xs font-bold border ${draft.paymentStructure === 'FULL_UPFRONT' ? 'bg-sadu-charcoal text-white border-sadu-charcoal' : 'border-sadu-gold/60 text-sadu-charcoal'}`}
                    >
                      Full Upfront
                    </button>
                    <button
                      type="button"
                      onClick={() => updateDraft(nom.id, { paymentStructure: 'MILESTONE_SPLIT' })}
                      className={`rounded px-3 py-1.5 text-xs font-bold border ${draft.paymentStructure === 'MILESTONE_SPLIT' ? 'bg-sadu-charcoal text-white border-sadu-charcoal' : 'border-sadu-gold/60 text-sadu-charcoal'}`}
                    >
                      Milestone Split
                    </button>
                  </div>

                  {draft.paymentStructure === 'FULL_UPFRONT' ? (
                    <label className="text-xs font-semibold text-sadu-charcoal block">
                      Total Production Cost
                      <input
                        type="number"
                        value={draft.totalCost}
                        onChange={e => updateDraft(nom.id, { totalCost: e.target.value })}
                        placeholder="AED"
                        className="mt-1 w-full rounded border border-sadu-gold/60 px-3 py-2 text-sm"
                      />
                    </label>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-sadu-charcoal">
                        Pre-Production Tranche
                        <input
                          type="number"
                          value={draft.initialTranche}
                          onChange={e => updateDraft(nom.id, { initialTranche: e.target.value })}
                          placeholder="AED"
                          className="mt-1 w-full rounded border border-sadu-gold/60 px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="text-xs font-semibold text-sadu-charcoal">
                        Post-Completion Tranche
                        <input
                          type="number"
                          value={draft.finalTranche}
                          onChange={e => updateDraft(nom.id, { finalTranche: e.target.value })}
                          placeholder="AED"
                          className="mt-1 w-full rounded border border-sadu-gold/60 px-3 py-2 text-sm"
                        />
                      </label>
                    </div>
                  )}
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
              <div className="space-y-2">
                <p className="text-xs text-sadu-muted">Contract routed to {nom.artistName}'s secure portal for final e-signature.</p>
                {contract.status === 'SENT_FOR_SIGNATURE' && (
                  <button
                    type="button"
                    onClick={() => markContractSigned(contract.id)}
                    className="flex items-center gap-2 rounded border border-sadu-gold bg-white px-3 py-1.5 text-xs font-bold text-sadu-charcoal hover:bg-sadu-sand"
                  >
                    <PenLine size={12}/>
                    Simulate Artist E-Signature
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
};
