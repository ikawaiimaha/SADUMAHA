import React, { useState } from 'react';
import { Send, AlertTriangle } from 'lucide-react';
import { useGovernance } from '../../context/GovernanceContext';

// Phase 2 (Coordinator): aggregate DRAFT nominations, then bulk-submit finalists for Directorate review.
export const DraftingPool: React.FC = () => {
  const { nominations, addDraftNomination, submitFinalistsToDirectorate } = useGovernance();
  const [artistName, setArtistName] = useState('');
  const [artistEmail, setArtistEmail] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const draftPool = nominations.filter(nom => nom.approvalStatus === 'DRAFT');
  const revisionsRequested = nominations.filter(nom => nom.approvalStatus === 'REVISION_REQUESTED');

  const toggleSelected = (id: string) => {
    setSelectedIds(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  };

  const handleAdd = () => {
    if (!artistName.trim() || !artistEmail.trim()) return;
    addDraftNomination({ artistName, artistEmail, nominationSource: 'COORDINATOR' });
    setArtistName('');
    setArtistEmail('');
  };

  const handleBulkSubmit = () => {
    if (!selectedIds.length) return;
    submitFinalistsToDirectorate(selectedIds);
    setSelectedIds([]);
  };

  return (
    <section className="rounded-lg border border-sadu-gold bg-white p-6 shadow-xs space-y-6">
      <div>
        <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">Drafting Pool</h2>
        <p className="text-xs text-sadu-muted">Aggregate artist finalists here before submitting them for Directorate review.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 items-end">
        <label className="text-xs font-semibold text-sadu-charcoal">
          Artist Name
          <input value={artistName} onChange={e => setArtistName(e.target.value)} className="mt-1 w-full rounded border border-sadu-gold/60 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-semibold text-sadu-charcoal">
          Artist Email
          <input type="email" value={artistEmail} onChange={e => setArtistEmail(e.target.value)} className="mt-1 w-full rounded border border-sadu-gold/60 px-3 py-2 text-sm" />
        </label>
        <button type="button" onClick={handleAdd} disabled={!artistName.trim() || !artistEmail.trim()} className="rounded bg-sadu-charcoal px-4 py-2 text-xs font-bold text-white hover:bg-black disabled:opacity-50">
          Add to Drafting Pool
        </button>
      </div>

      <div className="rounded border border-sadu-gold/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-sadu-muted bg-sadu-sand border-b border-sadu-gold/40">
              <th className="px-4 py-2 font-medium"><span className="sr-only">Select</span></th>
              <th className="px-4 py-2 font-medium">Artist</th>
              <th className="px-4 py-2 font-medium">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sadu-gold/20">
            {draftPool.map(nom => (
              <tr key={nom.id}>
                <td className="px-4 py-2"><input type="checkbox" checked={selectedIds.includes(nom.id)} onChange={() => toggleSelected(nom.id)} /></td>
                <td className="px-4 py-2 font-medium text-sadu-charcoal">{nom.artistName}</td>
                <td className="px-4 py-2 text-sadu-muted">{nom.nominationSource}</td>
              </tr>
            ))}
            {!draftPool.length && <tr><td colSpan={3} className="px-4 py-4 text-center text-xs text-sadu-muted">No artists in the drafting pool.</td></tr>}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={handleBulkSubmit}
        disabled={!selectedIds.length}
        className="flex items-center gap-2 rounded bg-sadu-brick px-4 py-2 text-xs font-bold text-white hover:bg-sadu-brick-dark disabled:opacity-50"
      >
        <Send size={14}/>
        Submit Finalists to Directorate Review
      </button>

      {revisionsRequested.length > 0 && (
        <div className="border-t border-sadu-gold/30 pt-4 space-y-2">
          <h3 className="text-sm font-bold text-sadu-charcoal flex items-center gap-2"><AlertTriangle size={14} className="text-amber-600"/> Revisions Requested</h3>
          {revisionsRequested.map(nom => (
            <div key={nom.id} className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              <span className="font-bold block">{nom.artistName}</span>
              <span>{nom.directorateNotes}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
