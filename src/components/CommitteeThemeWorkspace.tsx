import React, { useId, useMemo, useState } from 'react';
import { ClipboardList, Send, CheckCircle2, RotateCcw } from 'lucide-react';

export interface CommitteeThemeDraft {
  arabicName: string;
  englishName: string;
  definition: string;
}

export interface CommitteeThemeWorkspaceProps {
  /** Identifier of the biennial/event these three theme proposals belong to. */
  eventId?: string;
  /** Called with the three completed theme drafts once presented to the Chairman. */
  onPresentToChairman?: (themes: CommitteeThemeDraft[], eventId?: string) => void;
}

const EMPTY_THEME: CommitteeThemeDraft = { arabicName: '', englishName: '', definition: '' };

const createEmptyThemes = (): CommitteeThemeDraft[] => [
  { ...EMPTY_THEME },
  { ...EMPTY_THEME },
  { ...EMPTY_THEME },
];

/**
 * Preparatory Committee workspace: exactly three theme proposals must be drafted
 * together (Arabic Name, English Name, Definition/Meaning each) before the batch
 * can be presented to the Chairman for final selection.
 */
const CommitteeThemeWorkspace: React.FC<CommitteeThemeWorkspaceProps> = ({
  eventId,
  onPresentToChairman,
}) => {
  const [themes, setThemes] = useState<CommitteeThemeDraft[]>(createEmptyThemes());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const baseId = useId();

  const allFieldsFilled = useMemo(
    () =>
      themes.every(
        theme =>
          theme.arabicName.trim() !== '' &&
          theme.englishName.trim() !== '' &&
          theme.definition.trim() !== ''
      ),
    [themes]
  );

  const filledCount = themes.filter(
    theme =>
      theme.arabicName.trim() !== '' &&
      theme.englishName.trim() !== '' &&
      theme.definition.trim() !== ''
  ).length;

  const updateField = (index: number, field: keyof CommitteeThemeDraft, value: string) => {
    setThemes(current =>
      current.map((theme, themeIndex) =>
        themeIndex === index ? { ...theme, [field]: value } : theme
      )
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!allFieldsFilled) return;
    onPresentToChairman?.(themes, eventId);
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
              Presented to Chairman
            </p>
            <p className="text-xs text-sadu-muted">
              All three theme proposals have been submitted for the Chairman's final selection.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {themes.map((theme, index) => (
            <div
              key={index}
              className="rounded-lg border border-sadu-gold/50 bg-white p-4 text-sm"
            >
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-sadu-muted">
                Theme {index + 1}
              </span>
              <span className="block font-bold text-sadu-charcoal">{theme.englishName}</span>
              <span dir="rtl" className="block text-sadu-charcoal">
                {theme.arabicName}
              </span>
              <p className="mt-2 text-xs text-sadu-muted">{theme.definition}</p>
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
              Preparatory Committee &middot; Theme Proposals
            </h2>
            <p className="text-xs text-sadu-muted">
              Submit exactly three candidate themes together for the Chairman's review.
            </p>
          </div>
        </div>
        {eventId ? (
          <span className="w-fit rounded-full border border-sadu-gold/60 bg-sadu-sand px-3 py-1 text-[10px] font-semibold text-sadu-muted">
            Event Ref: {eventId}
          </span>
        ) : null}
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {themes.map((theme, index) => {
          const arabicId = `${baseId}-arabic-${index}`;
          const englishId = `${baseId}-english-${index}`;
          const definitionId = `${baseId}-definition-${index}`;
          const isThemeComplete =
            theme.arabicName.trim() !== '' &&
            theme.englishName.trim() !== '' &&
            theme.definition.trim() !== '';

          return (
            <div
              key={index}
              className="flex flex-col space-y-3 rounded-lg border border-sadu-gold/50 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-sadu-charcoal">Theme {index + 1}</h3>
                {isThemeComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    Incomplete
                  </span>
                )}
              </div>

              <label htmlFor={arabicId} className="block text-xs font-semibold text-sadu-charcoal">
                Arabic Name
                <input
                  id={arabicId}
                  type="text"
                  dir="rtl"
                  required
                  value={theme.arabicName}
                  onChange={e => updateField(index, 'arabicName', e.target.value)}
                  placeholder="الاسم بالعربية"
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
                  placeholder="Theme name in English"
                  className="mt-1 w-full rounded-md border border-sadu-gold/60 bg-white px-3 py-2 text-sm text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick"
                />
              </label>

              <label htmlFor={definitionId} className="block text-xs font-semibold text-sadu-charcoal">
                Definition / Meaning
                <textarea
                  id={definitionId}
                  required
                  rows={4}
                  value={theme.definition}
                  onChange={e => updateField(index, 'definition', e.target.value)}
                  placeholder="Describe the meaning and curatorial intent of this theme"
                  className="mt-1 w-full resize-none rounded-md border border-sadu-gold/60 bg-white px-3 py-2 text-sm text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick"
                />
              </label>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center justify-between gap-4 border-t border-sadu-gold/40 pt-4 sm:flex-row">
        <span className="text-xs text-sadu-muted">
          {filledCount} of 3 theme proposals complete. All fields for all three themes are required
          before this batch can be presented.
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

