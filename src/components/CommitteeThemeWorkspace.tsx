import React, { useId, useMemo, useState } from 'react';
import { ClipboardList, Send, CheckCircle2, RotateCcw, Sparkles, BookOpen } from 'lucide-react';

export interface CommitteeThemeDraft {
  arabicName: string;
  englishName: string;
  aestheticFramework: string;
  contemporaryRelevance: string;
  curatorialJustification: string;
  /** Backward-compatible legacy alias */
  definition?: string;
}

export interface CommitteeThemeWorkspaceProps {
  /** Identifier of the biennial/event these three theme proposals belong to. */
  eventId?: string;
  /** Called with the three completed theme drafts once presented to the Chairman. */
  onPresentToChairman?: (themes: CommitteeThemeDraft[], eventId?: string) => void;
  onBackToRoles?: () => void;
}

const EMPTY_THEME: CommitteeThemeDraft = {
  arabicName: '',
  englishName: '',
  aestheticFramework: '',
  contemporaryRelevance: '',
  curatorialJustification: '',
  definition: '',
};

const createEmptyThemes = (): CommitteeThemeDraft[] => [
  { ...EMPTY_THEME },
  { ...EMPTY_THEME },
  { ...EMPTY_THEME },
];

/**
 * Preparatory Committee Workspace:
 * Strict Curatorial Rigor: Themes cannot be justified with bureaucratic fluff.
 * Exactly three theme proposals must be defended simultaneously using meticulous
 * artistic criteria: Aesthetic Framework, Contemporary Relevance, and Curatorial Justification.
 */
const CommitteeThemeWorkspace: React.FC<CommitteeThemeWorkspaceProps> = ({
  eventId,
  onPresentToChairman,
  onBackToRoles,
}) => {
  const [themes, setThemes] = useState<CommitteeThemeDraft[]>(createEmptyThemes());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const baseId = useId();

  const isThemeComplete = (theme: CommitteeThemeDraft): boolean =>
    theme.arabicName.trim() !== '' &&
    theme.englishName.trim() !== '' &&
    theme.aestheticFramework.trim() !== '' &&
    theme.contemporaryRelevance.trim() !== '' &&
    theme.curatorialJustification.trim() !== '';

  const allFieldsFilled = useMemo(
    () => themes.length === 3 && themes.every(isThemeComplete),
    [themes]
  );

  const filledCount = themes.filter(isThemeComplete).length;

  const updateField = (index: number, field: keyof CommitteeThemeDraft, value: string) => {
    setThemes(current =>
      current.map((theme, themeIndex) => {
        if (themeIndex !== index) return theme;
        const updated = { ...theme, [field]: value };
        updated.definition = `${updated.curatorialJustification} | Aesthetic: ${updated.aestheticFramework} | Relevance: ${updated.contemporaryRelevance}`.trim();
        return updated;
      })
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!allFieldsFilled) return;
    const finalized = themes.map(t => ({
      ...t,
      definition: t.curatorialJustification,
    }));
    onPresentToChairman?.(finalized, eventId);
    setIsSubmitted(true);
  };

  const handleStartNewBatch = () => {
    setThemes(createEmptyThemes());
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 rounded-lg border border-sadu-gold bg-sadu-paper p-6 shadow-xs">
        <div className="flex items-center gap-3 rounded-md border border-emerald-300 bg-emerald-50 p-4">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-700" />
          <div>
            <p className="font-editorial text-base font-bold text-sadu-charcoal">
              Presented to Chairman H.E. Abdullah Al Owais
            </p>
            <p className="text-xs text-sadu-muted">
              All three rigorously formulated theme proposals have been submitted for executive review
              and budget allocation.
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {themes.map((theme, index) => (
            <div
              key={index}
              className="space-y-3 rounded-lg border border-sadu-gold/60 bg-white p-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-sadu-gold/30 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-sadu-muted">
                  Candidate Proposal {index + 1}
                </span>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                  Rigorously Defended
                </span>
              </div>

              <div>
                <span className="block font-editorial text-base font-bold text-sadu-charcoal">
                  {theme.englishName}
                </span>
                <span dir="rtl" className="block text-sm font-semibold text-sadu-brick">
                  {theme.arabicName}
                </span>
              </div>

              <div className="space-y-2 pt-1 text-[11px] text-sadu-muted">
                <div>
                  <strong className="block text-sadu-charcoal font-semibold">Aesthetic Framework:</strong>
                  <p className="leading-relaxed bg-sadu-paper/70 p-1.5 rounded border border-sadu-gold/30">{theme.aestheticFramework}</p>
                </div>
                <div>
                  <strong className="block text-sadu-charcoal font-semibold">Contemporary & Historical Relevance:</strong>
                  <p className="leading-relaxed bg-sadu-paper/70 p-1.5 rounded border border-sadu-gold/30">{theme.contemporaryRelevance}</p>
                </div>
                <div>
                  <strong className="block text-sadu-charcoal font-semibold">Curatorial Justification:</strong>
                  <p className="leading-relaxed bg-sadu-paper/70 p-1.5 rounded border border-sadu-gold/30">{theme.curatorialJustification}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleStartNewBatch}
          className="inline-flex items-center gap-2 rounded-md border border-sadu-gold bg-sadu-sand px-4 py-2 text-xs font-bold text-sadu-charcoal transition-colors hover:bg-sadu-gold/20 cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          Start New Proposal Set
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-5xl space-y-6 rounded-lg border border-sadu-gold bg-sadu-paper p-6 shadow-xs"
    >
      <div className="flex flex-col gap-2 border-b border-sadu-gold/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-sadu-brick" />
          <div>
            <h2 className="font-editorial text-lg font-bold text-sadu-charcoal">
              Preparatory Committee &middot; Theme Formulation Table
            </h2>
            <p className="text-xs text-sadu-muted">
              Convened by Mohammed Al Qaseer. Exactly three theme proposals must be defended with rigorous artistic criteria for Chairman Al Owais's review.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {eventId ? (
            <span className="w-fit rounded-full border border-sadu-gold/60 bg-sadu-sand px-3 py-1 text-[10px] font-semibold text-sadu-muted">
              Event Ref: {eventId}
            </span>
          ) : null}
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
      <div className="grid gap-6 md:grid-cols-3">
        {themes.map((theme, index) => {
          const arabicId = `${baseId}-arabic-${index}`;
          const englishId = `${baseId}-english-${index}`;
          const aestheticId = `${baseId}-aesthetic-${index}`;
          const contemporaryId = `${baseId}-contemporary-${index}`;
          const curatorialId = `${baseId}-curatorial-${index}`;
          const complete = isThemeComplete(theme);

          return (
            <div
              key={index}
              className="flex flex-col space-y-3 rounded-lg border border-sadu-gold/60 bg-white p-4 shadow-2xs"
            >
              <div className="flex items-center justify-between border-b border-sadu-gold/30 pb-2">
                <span className="text-xs font-bold text-sadu-charcoal">Theme Candidate {index + 1}</span>
                {complete ? (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3 w-3" /> Fully Defended
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    Criteria Incomplete
                  </span>
                )}
              </div>

              <label htmlFor={arabicId} className="block text-xs font-semibold text-sadu-charcoal">
                Arabic Name (الاسم بالعربية)
                <input
                  id={arabicId}
                  type="text"
                  dir="rtl"
                  required
                  value={theme.arabicName}
                  onChange={e => updateField(index, 'arabicName', e.target.value)}
                  placeholder="مثال: التوازن والانسجام"
                  className="mt-1 w-full rounded-md border border-sadu-gold/60 bg-white px-3 py-2 text-sm text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick"
                />
              </label>

              <label htmlFor={englishId} className="block text-xs font-semibold text-sadu-charcoal">
                English Name
                <input
                  id={englishId}
                  type="text"
                  required
                  value={theme.englishName}
                  onChange={e => updateField(index, 'englishName', e.target.value)}
                  placeholder="e.g. Balance & Harmony"
                  className="mt-1 w-full rounded-md border border-sadu-gold/60 bg-white px-3 py-2 text-sm text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick"
                />
              </label>

              {/* Aesthetic Framework */}
              <label htmlFor={aestheticId} className="block text-xs font-semibold text-sadu-charcoal">
                <span>Aesthetic Framework</span>
                <span className="block font-normal text-[11px] text-sadu-muted">
                  Define the visual and stylistic parameters.
                </span>
                <textarea
                  id={aestheticId}
                  required
                  rows={2}
                  value={theme.aestheticFramework}
                  onChange={e => updateField(index, 'aestheticFramework', e.target.value)}
                  placeholder="Define the visual and stylistic parameters..."
                  className="mt-1 w-full resize-none rounded-md border border-sadu-gold/60 bg-white px-3 py-1.5 text-xs text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick"
                />
              </label>

              {/* Contemporary & Historical Relevance */}
              <label htmlFor={contemporaryId} className="block text-xs font-semibold text-sadu-charcoal">
                <span>Contemporary & Historical Relevance</span>
                <span className="block font-normal text-[11px] text-sadu-muted">
                  Justify the theme's position within international art standards.
                </span>
                <textarea
                  id={contemporaryId}
                  required
                  rows={2}
                  value={theme.contemporaryRelevance}
                  onChange={e => updateField(index, 'contemporaryRelevance', e.target.value)}
                  placeholder="Justify the theme's position within international art standards..."
                  className="mt-1 w-full resize-none rounded-md border border-sadu-gold/60 bg-white px-3 py-1.5 text-xs text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick"
                />
              </label>

              {/* Curatorial Justification */}
              <label htmlFor={curatorialId} className="block text-xs font-semibold text-sadu-charcoal">
                <span>Curatorial Justification</span>
                <span className="block font-normal text-[11px] text-sadu-muted">
                  The rigorous defense of why this theme is necessary.
                </span>
                <textarea
                  id={curatorialId}
                  required
                  rows={3}
                  value={theme.curatorialJustification}
                  onChange={e => updateField(index, 'curatorialJustification', e.target.value)}
                  placeholder="The rigorous defense of why this theme is necessary..."
                  className="mt-1 w-full resize-none rounded-md border border-sadu-gold/60 bg-white px-3 py-1.5 text-xs text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick"
                />
              </label>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center justify-between gap-4 border-t border-sadu-gold/40 pt-4 sm:flex-row">
        <span className="text-xs text-sadu-muted">
          {filledCount} of 3 theme proposals fully defended. Every artistic field is mandatory before
          formal routing to Chairman Al Owais.
        </span>
        <button
          type="submit"
          disabled={!allFieldsFilled}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-sadu-brick px-6 py-3 text-xs font-bold text-white shadow-xs transition-colors hover:bg-sadu-brick-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto cursor-pointer"
        >
          <Send className="h-4 w-4" />
          Present to Chairman
        </button>
      </div>
    </form>
  );
};

export default CommitteeThemeWorkspace;

