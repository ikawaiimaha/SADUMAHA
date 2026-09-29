import { createJourney, journeyReducer, type JourneyAction, type JourneyState } from './rehearsalJourney';
export const JOURNEY_STORAGE_KEY = 'sadu-fictional-journey-journal-v1';
export type JourneyJournal = { state: JourneyState; actions: JourneyAction[]; recoveryError?: string };
export const emptyJournal = (): JourneyJournal => ({ state: createJourney(), actions: [] });
export function restoreJournal(raw: string | null): JourneyJournal {
  if (!raw) return emptyJournal();
  try {
    if (raw.length > 2000000) throw new Error();
    const data = JSON.parse(raw);
    if (data.format !== 1 || !Array.isArray(data.actions) || data.actions.length > 2000) throw new Error();
    let state = createJourney();
    for (const action of data.actions) { const next = journeyReducer(state, action); if (next === state) throw new Error(); state = next; }
    return { state, actions: data.actions };
  } catch { return { ...emptyJournal(), recoveryError: 'Saved journey could not be validated. It has been preserved without overwrite. This page is an unsaved rehearsal; export any new work before leaving.' }; }
}
export function journalReducer(journal: JourneyJournal, action: JourneyAction): JourneyJournal {
  const state = journeyReducer(journal.state, action);
  return state === journal.state ? journal : { ...journal, state, actions: [...journal.actions, action] };
}
export const serializeJournal = (journal: JourneyJournal) => JSON.stringify({ format: 1, actions: journal.actions });
