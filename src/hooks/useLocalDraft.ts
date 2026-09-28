import { useState } from 'react';

// Draft content only. Never restore approval flags or permissions from browser storage.
export function readDraft<T>(key: string, fallback: T, valid: (value: unknown) => value is T): T {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    return saved?.version === 1 && valid(saved.value) ? saved.value : fallback;
  } catch { return fallback; }
}
export function useLocalDraft<T>(key: string, fallback: T, valid: (value: unknown) => value is T) {
  const [entry, setEntry] = useState(() => ({ key, value: readDraft(key, fallback, valid) }));
  const [failed, setFailed] = useState(false);
  const value = entry.key === key ? entry.value : readDraft(key, fallback, valid);
  const setValue = (update: T | ((previous: T) => T)) => {
    const next = typeof update === 'function' ? (update as (previous: T) => T)(value) : update;
    try { localStorage.setItem(key, JSON.stringify({ version: 1, value: next })); setFailed(false); }
    catch { setFailed(true); }
    setEntry({ key, value: next });
  };
  return [value, setValue, failed] as const;
}
export const isText = (value: unknown): value is string => typeof value === 'string';
export const isNotes = (value: unknown): value is Record<number, string> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && Object.values(value).every(isText);
