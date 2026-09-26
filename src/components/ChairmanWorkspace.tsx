import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Award,
  Clock,
  WalletCards,
  ArrowRight,
  UserCheck,
  Banknote,
} from 'lucide-react';
import { CommitteeThemeDraft } from './CommitteeThemeWorkspace';

export type ThemeItem = CommitteeThemeDraft | {
  id?: string;
  arabicName: string;
  englishName: string;
  aestheticFramework?: string;
  contemporaryRelevance?: string;
  curatorialJustification?: string;
  definition?: string;
};

export interface ChairmanWorkspaceProps {
  /** Identifier of the biennial/event these theme proposals belong to. */
  eventId?: string;
  /** Submitted candidate themes from the Preparatory Committee (the 3 drafts). */
  themes?: ThemeItem[];
  /** Callback fired when the Chairman confers official ratification on a theme. */
  onThemeApproved?: (approvedTheme: ThemeItem) => void;
  /** Callback fired when the Chairman assigns the official biennial budget. */
  onBudgetAssigned?: (amount: number, theme: ThemeItem, status?: 'PENDING_EDITORIAL_POLISH') => void;
  /** Optional initial approved theme index. */
  initialApprovedIndex?: number | null;
  /** Optional current theme workflow status. */
  themeStatus?: 'PENDING_CHAIRMAN_APPROVAL' | 'PENDING_EDITORIAL_POLISH' | 'PUBLISHED' | 'PUBLISHED_OFFICIAL';
  onBackToRoles?: () => void;
}

export const ChairmanWorkspace: React.FC<ChairmanWorkspaceProps> = ({
  eventId,
  themes,
  onThemeApproved,
  onBudgetAssigned,
  initialApprovedIndex = null,
  themeStatus,
  onBackToRoles,
}) => {
  const [approvedIndex, setApprovedIndex] = useState<number | null>(initialApprovedIndex);
  const [allocatedBudget, setAllocatedBudget] = useState<number>(12500000);
  const [isBudgetAssigned, setIsBudgetAssigned] = useState<boolean>(false);

  // Check if 3 submitted theme drafts exist and have content
  const hasSubmittedThemes =
    Boolean(themes) &&
    themes!.length > 0 &&
    themes!.some(t => t.arabicName.trim() !== '' || t.englishName.trim() !== '');

  const handleApprove = (index: number) => {
    setApprovedIndex(index);
    if (onThemeApproved && themes && themes[index]) {
      onThemeApproved(themes[index]);
    }
  };

  const handleAssignBudget = () => {
    setIsBudgetAssigned(true);
    if (winningTheme && onBudgetAssigned) {
      onBudgetAssigned(allocatedBudget, winningTheme, 'PENDING_EDITORIAL_POLISH');
    }
  };

  const handleUnlock = () => {
    setApprovedIndex(null);
    setIsBudgetAssigned(false);
  };

  // EMPTY STATE: If no themes are submitted yet, show an elegant empty state saying 'Awaiting Committee Proposals'
  if (!hasSubmittedThemes) {
    return (
      <section className="mx-auto w-full max-w-5xl space-y-6 rounded-lg border border-sadu-gold bg-sadu-paper p-8 shadow-xs">
        <div className="flex flex-col gap-2 border-b border-sadu-gold/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <Award className="h-6 w-6 text-sadu-brick" />
            <div>
              <h2 className="font-editorial text-lg font-bold text-sadu-charcoal">
                Chairman Workspace &middot; H.E. Abdullah Al Owais
              </h2>
              <p className="text-xs text-sadu-muted">
                Executive review of Preparatory Committee thematic proposals & official budget sign-off.
              </p>
            </div>
          </div>
          {eventId && (
            <span className="w-fit rounded-full border border-sadu-gold/60 bg-sadu-sand px-3 py-1 text-[10px] font-semibold text-sadu-muted">
              Ref: {eventId}
            </span>
          )}
          {onBackToRoles && (
            <button
              type="button"
              onClick={onBackToRoles}
              className="inline-flex items-center gap-1.5 rounded-md border border-sadu-gold/70 bg-sadu-sand px-3 py-1.5 text-xs font-bold text-sadu-charcoal hover:bg-sadu-gold/25 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="h-3.5 w-3.5 text-sadu-brick" />
              <span>Switch Role</span>
            </button>
          )}
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-sadu-gold bg-white/70 py-16 px-6 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-sadu-gold/70 bg-sadu-sand text-sadu-brick shadow-2xs">
            <Clock className="h-7 w-7" />
          </div>

          <span className="rounded-full border border-sadu-gold/60 bg-sadu-sand px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sadu-muted">
            Phase 1 &middot; Executive Review Gate
          </span>

          <h3 className="mt-3 font-editorial text-2xl font-bold text-sadu-charcoal sm:text-3xl">
            Awaiting Committee Proposals
          </h3>
          <p dir="rtl" className="mt-1 font-editorial text-base font-semibold text-sadu-brick">
            في انتظار مقترحات اللجنة التحضيرية
          </p>

          <p className="mt-3 max-w-lg text-xs text-sadu-muted leading-relaxed">
            The Preparatory Committee (convened by Mohammed Al Qaseer) has not yet submitted theme proposals.
            Exactly three candidate proposals defended with meticulous artistic criteria must be formulated
            before Chairman Al Owais can confer official ratification and assign the budget.
          </p>
        </div>
      </section>
    );
  }

  const activeThemes = themes!;
  const winningTheme = approvedIndex !== null ? activeThemes[approvedIndex] : null;

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 rounded-lg border border-sadu-gold bg-sadu-paper p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-sadu-gold/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Award className="h-6 w-6 text-sadu-brick" />
          <div>
            <h2 className="font-editorial text-lg font-bold text-sadu-charcoal">
              Chairman Workspace &middot; Executive Ratification
            </h2>
            <p className="text-xs text-sadu-muted">
              Executive gate: evaluate candidate proposals presented by the Preparatory Committee
              and ratify the single official theme.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {eventId && (
            <span className="w-fit rounded-full border border-sadu-gold/60 bg-sadu-sand px-3 py-1 text-[10px] font-semibold text-sadu-muted">
              Ref: {eventId}
            </span>
          )}
          {winningTheme ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-sadu-brick bg-sadu-brick/10 px-3 py-1 text-[10px] font-bold text-sadu-brick">
              <Lock className="h-3 w-3" />
              Official Theme Ratified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-sadu-gold bg-sadu-sand px-3 py-1 text-[10px] font-bold text-sadu-charcoal">
              3 Candidate Proposals Under Review
            </span>
          )}
          {onBackToRoles && (
            <button
              type="button"
              onClick={onBackToRoles}
              className="inline-flex items-center gap-1.5 rounded-md border border-sadu-gold/70 bg-sadu-sand px-3 py-1.5 text-xs font-bold text-sadu-charcoal hover:bg-sadu-gold/25 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="h-3.5 w-3.5 text-sadu-brick" />
              <span>Switch Role</span>
            </button>
          )}
        </div>
      </div>


      {/* LOCKED STATE */}
      {winningTheme ? (
        <div className="space-y-6">
          {/* Large Official Theme Ratified Success Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border-2 border-sadu-brick/40 bg-gradient-to-r from-sadu-brick-light via-sadu-sand to-sadu-paper p-6 shadow-sm">
            <div className="flex items-start sm:items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sadu-brick text-white shadow-xs">
                <Lock className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-sadu-brick px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Executive Determination
                  </span>
                  <span className="text-[11px] font-semibold text-sadu-muted">
                    Official Institutional Decree
                  </span>
                </div>
                <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-sadu-charcoal">
                  Official Theme Ratified
                </h3>
                <p className="text-xs text-sadu-muted leading-relaxed max-w-2xl">
                  The Chairman has officially conferred executive ratification upon this biennial theme.
                  This determination is now binding across all biennial departments, curatorial commissions,
                  and open calls.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex sm:flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                Theme Locked
              </span>
            </div>
          </div>

          {/* Winning Theme Prominent Highlight Card (Rejected themes hidden) */}
          <div className="relative overflow-hidden rounded-xl border-2 border-sadu-gold bg-white p-6 shadow-md">
            <div className="absolute top-0 end-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-sadu-gold/20 blur-xl pointer-events-none" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-sadu-gold/40 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-sadu-brick px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                    Official Biennial Theme
                  </span>
                  <span className="text-xs font-semibold text-sadu-muted">
                    Candidate #{approvedIndex! + 1} Ratified by H.E. Abdullah Al Owais
                  </span>
                </div>
                <h4 className="font-editorial text-2xl font-bold text-sadu-charcoal pt-1">
                  {winningTheme.englishName}
                </h4>
              </div>
              <div className="text-start sm:text-end" dir="rtl">
                <span className="text-xs font-semibold text-sadu-muted block pb-0.5">
                  الاسم الرسمي المعتمد
                </span>
                <h4 className="font-editorial text-2xl font-bold text-sadu-brick">
                  {winningTheme.arabicName}
                </h4>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-sadu-gold/40 bg-sadu-paper/70 p-3">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-sadu-muted">
                  Aesthetic Framework
                </span>
                <p className="mt-1 text-xs text-sadu-charcoal leading-relaxed">
                  {winningTheme.aestheticFramework || winningTheme.definition || 'Grounded in classical proportions and material inquiry.'}
                </p>
              </div>

              <div className="rounded-lg border border-sadu-gold/40 bg-sadu-paper/70 p-3">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-sadu-muted">
                  Contemporary & Historical Relevance
                </span>
                <p className="mt-1 text-xs text-sadu-charcoal leading-relaxed">
                  {winningTheme.contemporaryRelevance || 'Engages contemporary spatial and experimental calligraphic installation discourses.'}
                </p>
              </div>

              <div className="rounded-lg border border-sadu-gold/40 bg-sadu-paper/70 p-3">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-sadu-muted">
                  Curatorial Justification
                </span>
                <p className="mt-1 text-xs text-sadu-charcoal leading-relaxed">
                  {winningTheme.curatorialJustification || winningTheme.definition}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col items-start justify-between gap-4 border-t border-sadu-gold/30 pt-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-xs text-sadu-muted">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <span>Executive Sign-Off Confirmed by Chairman Al Owais</span>
              </div>
              <button
                type="button"
                onClick={handleUnlock}
                className="inline-flex items-center gap-1.5 rounded-md border border-sadu-gold bg-sadu-sand px-3 py-1.5 text-xs font-bold text-sadu-charcoal transition-colors hover:bg-sadu-gold/30 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Unlock / Change Selection</span>
              </button>
            </div>
          </div>
          {/* OFFICIAL BUDGET ASSIGNMENT SECTION */}
          <div className="rounded-xl border-2 border-sadu-gold bg-gradient-to-b from-white to-sadu-paper p-6 shadow-sm space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-sadu-gold/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sadu-brick text-white shadow-2xs">
                  <WalletCards className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-editorial text-lg font-bold text-sadu-charcoal">
                    Official Budget Assignment
                  </h4>
                  <p className="text-xs text-sadu-muted">
                    Conferred by H.E. Abdullah Al Owais &middot; Chairman / CEO
                  </p>
                </div>
              </div>
              <span className="rounded bg-sadu-sand px-2.5 py-1 text-[10px] font-bold text-sadu-brick uppercase tracking-wider border border-sadu-gold/60">
                Phase 2 Delegation
              </span>
            </div>

            <p className="text-xs text-sadu-muted leading-relaxed">
              Theme ratification unlocks official biennial budget assignment. Authorizing this appropriation locks the budget and formally transfers operational authority to Biennial Director Mohammed Al Qaseer to convene the Artist Selection Committee.
            </p>

            <div className="space-y-3 rounded-lg border border-sadu-gold/50 bg-sadu-sand/40 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <label htmlFor="approved-budget-amount" className="block text-xs font-bold text-sadu-charcoal uppercase tracking-wider">
                    Approved Budget Amount (AED)
                  </label>
                  <span className="text-[11px] text-sadu-muted">
                    Production, artist fees, international freight, and publishing
                  </span>
                </div>

                {!isBudgetAssigned && (
                  <div className="flex items-center gap-2">
                    {[
                      { label: '10M AED', value: 10000000 },
                      { label: '12.5M AED', value: 12500000 },
                      { label: '15M AED', value: 15000000 },
                    ].map(tier => (
                      <button
                        key={tier.value}
                        type="button"
                        onClick={() => setAllocatedBudget(tier.value)}
                        className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                          allocatedBudget === tier.value
                            ? 'bg-sadu-brick text-white shadow-2xs'
                            : 'bg-white border border-sadu-gold/60 text-sadu-charcoal hover:bg-sadu-gold/20'
                        }`}
                      >
                        {tier.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <span className="absolute start-3 top-2.5 text-xs font-bold text-sadu-brick">AED</span>
                <input
                  id="approved-budget-amount"
                  type="number"
                  step="500000"
                  disabled={isBudgetAssigned}
                  value={allocatedBudget}
                  onChange={e => setAllocatedBudget(Number(e.target.value) || 0)}
                  className={`w-full rounded-md border py-2 ps-12 pe-4 font-mono text-base font-bold focus:outline-none focus:ring-1 ${
                    isBudgetAssigned
                      ? 'border-emerald-300 bg-emerald-50/50 text-emerald-950 cursor-not-allowed'
                      : 'border-sadu-gold/70 bg-white text-sadu-charcoal focus:border-sadu-brick focus:ring-sadu-brick'
                  }`}
                />
              </div>

              {/* Tranche Breakdown */}
              <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-4 text-xs">
                <div className="rounded border border-sadu-gold/40 bg-white p-2 text-center">
                  <span className="text-[10px] text-sadu-muted block">Commissions (50%)</span>
                  <span className="font-bold text-sadu-charcoal">AED {(allocatedBudget * 0.5).toLocaleString()}</span>
                </div>
                <div className="rounded border border-sadu-gold/40 bg-white p-2 text-center">
                  <span className="text-[10px] text-sadu-muted block">Logistics (25%)</span>
                  <span className="font-bold text-sadu-charcoal">AED {(allocatedBudget * 0.25).toLocaleString()}</span>
                </div>
                <div className="rounded border border-sadu-gold/40 bg-white p-2 text-center">
                  <span className="text-[10px] text-sadu-muted block">Publishing (15%)</span>
                  <span className="font-bold text-sadu-charcoal">AED {(allocatedBudget * 0.15).toLocaleString()}</span>
                </div>
                <div className="rounded border border-sadu-gold/40 bg-white p-2 text-center">
                  <span className="text-[10px] text-sadu-muted block">Protocol (10%)</span>
                  <span className="font-bold text-sadu-charcoal">AED {(allocatedBudget * 0.1).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Action or Final Success State */}
            {isBudgetAssigned ? (
              <div className="flex flex-col gap-3 rounded-lg border-2 border-emerald-400 bg-emerald-50 p-5 shadow-xs">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white shadow-xs">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="inline-block rounded bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1">
                        Status: Pending Editorial Polish
                      </span>
                      <h5 className="font-editorial text-lg font-bold text-emerald-950">
                        Theme Approved and Budget Locked. Theme routed to Editorial Department for final bilingual phrasing.
                      </h5>
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-600 bg-white px-3 py-1 font-mono text-xs font-bold text-emerald-800 shrink-0 shadow-2xs">
                    AED {allocatedBudget.toLocaleString()} Locked
                  </span>
                </div>

                <div className="rounded-md border border-emerald-200 bg-white/80 p-3 text-xs text-emerald-900 leading-relaxed space-y-1">
                  <p className="font-bold">
                    Theme Approved and Budget Locked. Theme routed to Editorial Department for final bilingual phrasing.
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    The theme is not sent directly to the HIP. The Editorial Department will now review the Preparatory Committee's raw curatorial explanation and compose the official bilingual theme essay before Stage 3 unlocks for the HIP and Coordinators.
                  </p>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAssignBudget}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-sadu-brick px-6 py-3.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-sadu-brick-dark cursor-pointer"
              >
                <Banknote className="h-4 w-4" />
                <span>Authorize Budget & Transfer Authority</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

        </div>
      ) : (
        /* CANDIDATE PROPOSALS (3 SIDE-BY-SIDE CARDS) */
        <div className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-sadu-muted">
              Select one candidate proposal to approve and lock as the official biennial theme:
            </span>
            <span className="text-xs font-bold text-sadu-charcoal">
              3 Candidates Under Review
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {activeThemes.map((theme, index) => (
              <div
                key={index}
                className="flex flex-col justify-between rounded-lg border border-sadu-gold/60 bg-white p-5 shadow-xs transition-shadow hover:shadow-md hover:border-sadu-brick/60"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-sadu-gold/30 pb-2">
                    <span className="rounded bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-charcoal">
                      Proposal {index + 1}
                    </span>
                    <span className="text-[10px] font-semibold text-sadu-muted">
                      Candidate Gate
                    </span>
                  </div>

                  <div>
                    <h3 className="font-editorial text-base font-bold text-sadu-charcoal">
                      {theme.englishName}
                    </h3>
                    <p
                      dir="rtl"
                      className="font-editorial text-base font-semibold text-sadu-brick pt-0.5"
                    >
                      {theme.arabicName}
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-sadu-gold/20 pt-2 text-[11px]">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sadu-muted block">
                        Aesthetic Framework
                      </span>
                      <p className="text-sadu-charcoal/90 leading-relaxed line-clamp-2">
                        {theme.aestheticFramework || 'Classical calligraphic proportion & material inquiry.'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sadu-muted block">
                        Contemporary & Historical Relevance
                      </span>
                      <p className="text-sadu-charcoal/90 leading-relaxed line-clamp-2">
                        {theme.contemporaryRelevance || 'International art standards & contemporary discourse.'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sadu-muted block">
                        Curatorial Justification
                      </span>
                      <p className="text-sadu-charcoal/90 leading-relaxed line-clamp-2">
                        {theme.curatorialJustification || theme.definition}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-sadu-gold/30 pt-4">
                  <button
                    type="button"
                    onClick={() => handleApprove(index)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-sadu-brick px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-sadu-brick-dark cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve Theme
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ChairmanWorkspace;

