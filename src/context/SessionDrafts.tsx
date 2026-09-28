import React, { createContext, useContext, useState, type Dispatch, type SetStateAction } from 'react';

type Drafts = Record<string, unknown>;
const SessionDrafts = createContext<{ drafts: Drafts; setDrafts: Dispatch<SetStateAction<Drafts>> } | null>(null);

/** Draft inputs only. Approvals remain in the guarded workflow state. Nothing is stored on disk. */
export function SessionDraftProvider({ children }: { children: React.ReactNode }) {
  const [drafts, setDrafts] = useState<Drafts>({});
  return <SessionDrafts.Provider value={{ drafts, setDrafts }}>{children}</SessionDrafts.Provider>;
}

export function useSessionDraft<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>, boolean] {
  const context = useContext(SessionDrafts);
  const [fallback, setFallback] = useState(initial);
  const saved = Boolean(context && Object.hasOwn(context.drafts, key));
  const value = saved ? context!.drafts[key] as T : fallback;
  const setValue: Dispatch<SetStateAction<T>> = action => {
    if (!context) { setFallback(action); return; }
    context.setDrafts(current => {
      const previous = Object.hasOwn(current, key) ? current[key] as T : initial;
      return { ...current, [key]: typeof action === 'function' ? (action as (value: T) => T)(previous) : action };
    });
  };
  return [value, setValue, saved];
}
