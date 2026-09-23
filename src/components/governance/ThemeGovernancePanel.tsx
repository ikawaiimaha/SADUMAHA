import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useGovernance } from '../../context/GovernanceContext';

// Phase 1 (Preparatory Committee): submit exactly 3 candidate themes for Chairman review.
export const ThemeGovernancePanel: React.FC = () => {
  const { themes, proposeTheme } = useGovernance();
  const [arabicName, setArabicName] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [definition, setDefinition] = useState('');
  const full = themes.length >= 3;

  const handleSubmit = () => {
    if (!arabicName.trim() || !englishName.trim() || !definition.trim() || full) return;
    proposeTheme({ arabicName, englishName, definition });
    setArabicName('');
    setEnglishName('');
    setDefinition('');
  };

  return (
    <section className="rounded-lg border border-sadu-gold bg-white p-6 shadow-xs space-y-4">
      <div>
        <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">Theme Governance · Preparatory Committee</h2>
        <p className="text-xs text-sadu-muted">Submit exactly three candidate themes for the Chairman's final selection.</p>
      </div>

      <div className="space-y-2">
        {themes.map(theme => (
          <div key={theme.id} className="flex items-center justify-between rounded border border-sadu-gold/40 bg-sadu-sand p-3 text-sm">
            <div>
              <span className="font-bold text-sadu-charcoal">{theme.englishName}</span>
              <span className="ms-2 text-sadu-muted">{theme.arabicName}</span>
              <p className="text-xs text-sadu-muted mt-0.5">{theme.definition}</p>
            </div>
            {theme.status === 'APPROVED' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                <Lock size={10}/> Approved
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Proposed</span>
            )}
          </div>
        ))}
      </div>

      {!full ? (
        <div className="grid gap-3 border-t border-sadu-gold/30 pt-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-sadu-charcoal">
            Arabic Name
            <input value={arabicName} onChange={e => setArabicName(e.target.value)} dir="rtl" className="mt-1 w-full rounded border border-sadu-gold/60 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-sadu-charcoal">
            English Name
            <input value={englishName} onChange={e => setEnglishName(e.target.value)} className="mt-1 w-full rounded border border-sadu-gold/60 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-sadu-charcoal sm:col-span-2">
            Meaning
            <textarea value={definition} onChange={e => setDefinition(e.target.value)} rows={3} className="mt-1 w-full rounded border border-sadu-gold/60 px-3 py-2 text-sm resize-none" />
          </label>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!arabicName.trim() || !englishName.trim() || !definition.trim()}
            className="sm:col-span-2 rounded bg-sadu-brick px-4 py-2 text-xs font-bold text-white hover:bg-sadu-brick-dark disabled:opacity-50"
          >
            Submit Theme ({themes.length}/3)
          </button>
        </div>
      ) : (
        <p className="text-xs text-sadu-muted border-t border-sadu-gold/30 pt-4">All three theme submissions are complete. Awaiting Chairman approval.</p>
      )}
    </section>
  );
};
