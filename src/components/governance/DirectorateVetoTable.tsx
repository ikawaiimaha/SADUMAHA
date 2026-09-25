import React, { useState } from 'react';
import { CheckCircle2, MessageSquareWarning } from 'lucide-react';
import { useGovernance } from '../../context/GovernanceContext';

// Phase 3 (Directorate / Al Qaseer): approve for dispatch, or request revisions with a mandatory note.
export const DirectorateVetoTable: React.FC = () => {
  const { nominations, approveNomination, requestRevision } = useGovernance();
  const pending = nominations.filter(nom => nom.approvalStatus === 'PENDING_DIRECTORATE_REVIEW');
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const openRevisionModal = (id: string) => {
    setReviewId(id);
    setNote('');
  };

  const submitRevision = () => {
    if (!reviewId || !note.trim()) return;
    requestRevision(reviewId, note.trim());
    setReviewId(null);
    setNote('');
  };

  return (
    <section className="rounded-lg border border-sadu-gold bg-white p-6 shadow-xs space-y-4">
      <div>
        <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">Directorate Veto Workspace</h2>
        <p className="text-xs text-sadu-muted">Artist finalists awaiting Directorate approval before official dispatch.</p>
      </div>

      <div className="rounded border border-sadu-gold/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-start text-xs uppercase tracking-wider text-sadu-muted bg-sadu-sand border-b border-sadu-gold/40">
              <th className="px-4 py-2 font-medium">Artist</th>
              <th className="px-4 py-2 font-medium">Source</th>
              <th className="px-4 py-2 font-medium text-end">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sadu-gold/20">
            {pending.map(nom => (
              <tr key={nom.id}>
                <td className="px-4 py-2 font-medium text-sadu-charcoal">{nom.artistName}</td>
                <td className="px-4 py-2 text-sadu-muted">{nom.nominationSource}</td>
                <td className="px-4 py-2 text-end space-x-2 rtl:space-x-reverse">
                  <button type="button" onClick={() => approveNomination(nom.id)} className="inline-flex items-center gap-1 rounded bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800">
                    <CheckCircle2 size={12}/> Approve
                  </button>
                  <button type="button" onClick={() => openRevisionModal(nom.id)} className="inline-flex items-center gap-1 rounded border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100">
                    <MessageSquareWarning size={12}/> Request Revisions
                  </button>
                </td>
              </tr>
            ))}
            {!pending.length && <tr><td colSpan={3} className="px-4 py-4 text-center text-xs text-sadu-muted">No artists pending Directorate review.</td></tr>}
          </tbody>
        </table>
      </div>

      {reviewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-sadu-charcoal">Request Revisions</h3>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={4}
              placeholder="Explain what must be revised before resubmission..."
              className="w-full rounded border border-sadu-gold/60 px-3 py-2 text-sm resize-none"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setReviewId(null)} className="rounded border border-sadu-gold px-3 py-1.5 text-xs font-bold text-sadu-charcoal">Cancel</button>
              <button type="button" onClick={submitRevision} disabled={!note.trim()} className="rounded bg-sadu-brick px-3 py-1.5 text-xs font-bold text-white hover:bg-sadu-brick-dark disabled:opacity-50">Submit Note</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
