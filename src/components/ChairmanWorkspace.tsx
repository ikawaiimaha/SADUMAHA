import React, { useState } from 'react';
import { Lock, ShieldCheck, CheckCircle2, RotateCcw, Award, Clock } from 'lucide-react';
import { CommitteeThemeDraft } from './CommitteeThemeWorkspace';

export type ThemeItem = CommitteeThemeDraft | {
  id?: string;
  arabicName: string;
  englishName: string;
  definition: string;
};

export interface ChairmanWorkspaceProps {
  /** Identifier of the biennial/event these theme proposals belong to. */
  eventId?: string;
  /** Submitted candidate themes from the Preparatory Committee (the 3 drafts). */
  themes?: ThemeItem[];
  /** Callback fired when the Chairman confers official ratification on a theme. */
  onThemeApproved?: (approvedTheme: ThemeItem) => void;
  /** Optional initial approved theme index. */
  initialApprovedIndex?: number | null;
}

export const ChairmanWorkspace: React.FC<ChairmanWorkspaceProps> = ({
  eventId,
  themes,
  onThemeApproved,
  initialApprovedIndex = null,
}) => {
  const [approvedIndex, setApprovedIndex] = useState<number | null>(initialApprovedIndex);

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

  const handleUnlock = () => {
    setApprovedIndex(null);
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
                Chairman Workspace &middot; Executive Ratification
              </h2>
              <p className="text-xs text-sadu-muted">
                Executive gate for conferring final ratification on the official biennial theme.
              </p>
            </div>
          </div>
          {eventId && (
            <span className="w-fit rounded-full border border-sadu-gold/60 bg-sadu-sand px-3 py-1 text-[10px] font-semibold text-sadu-muted">
              Ref: {eventId}
            </span>
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
            The Preparatory Committee has not yet submitted theme proposals for this edition.
            Exactly three candidate proposals must be formulated and submitted together before the
            Chairman can review and ratify the official theme.
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
            <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-sadu-gold/20 blur-xl pointer-events-none" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-sadu-gold/40 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-sadu-brick px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                    Official Biennial Theme
                  </span>
                  <span className="text-xs font-semibold text-sadu-muted">
                    Candidate #{approvedIndex! + 1} Selected
                  </span>
                </div>
                <h4 className="font-editorial text-2xl font-bold text-sadu-charcoal pt-1">
                  {winningTheme.englishName}
                </h4>
              </div>
              <div className="text-left sm:text-right" dir="rtl">
                <span className="text-xs font-semibold text-sadu-muted block pb-0.5">
                  الاسم الرسمي المعتمد
                </span>
                <h4 className="font-editorial text-2xl font-bold text-sadu-brick">
                  {winningTheme.arabicName}
                </h4>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sadu-muted">
                Curatorial Definition & Intent
              </span>
              <p className="rounded-lg border border-sadu-gold/50 bg-sadu-paper p-4 text-sm text-sadu-charcoal leading-relaxed">
                {winningTheme.definition}
              </p>
            </div>

            <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-sadu-gold/30 pt-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-xs text-sadu-muted">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <span>Executive Signature &middot; Ready for Institutional Transmission</span>
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

                  <div className="border-t border-sadu-gold/20 pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sadu-muted block mb-1">
                      Definition / Meaning
                    </span>
                    <p className="text-xs text-sadu-charcoal/90 leading-relaxed min-h-[72px]">
                      {theme.definition}
                    </p>
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

