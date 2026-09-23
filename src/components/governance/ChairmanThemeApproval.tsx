import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useGovernance } from '../../context/GovernanceContext';

// Phase 1 (Chairman): approve one of the three proposed themes; this locks it globally.
export const ChairmanThemeApproval: React.FC = () => {
  const { themes, approveTheme, approvedTheme } = useGovernance();

  return (
    <section className="rounded-lg border border-sadu-gold bg-white p-6 shadow-xs space-y-4">
      <div>
        <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">Theme Governance · Chairman Approval</h2>
        <p className="text-xs text-sadu-muted">Select the single official theme from the Preparatory Committee's proposals.</p>
      </div>

      {approvedTheme ? (
        <div className="flex items-center gap-2 rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
          <ShieldCheck size={16}/>
          <span><strong>{approvedTheme.englishName}</strong> ({approvedTheme.arabicName}) is locked as the official theme.</span>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {themes.map(theme => (
            <div key={theme.id} className="flex flex-col justify-between rounded border border-sadu-gold/50 bg-sadu-sand p-4 text-sm">
              <div>
                <span className="font-bold text-sadu-charcoal block">{theme.englishName}</span>
                <span className="text-sadu-muted block">{theme.arabicName}</span>
                <p className="text-xs text-sadu-muted mt-1">{theme.definition}</p>
              </div>
              <button
                type="button"
                onClick={() => approveTheme(theme.id)}
                disabled={themes.length < 3}
                className="mt-3 rounded bg-sadu-charcoal px-3 py-2 text-xs font-bold text-white hover:bg-black disabled:opacity-50"
              >
                Approve as Official Theme
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
