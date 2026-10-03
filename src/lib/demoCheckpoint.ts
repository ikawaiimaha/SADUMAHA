// Synthetic presentation data only. Never use this store for identity or authorization.
export interface CheckpointStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
export function loadCheckpoint<T>(storage: CheckpointStorage | undefined, key: string, initial: () => T, valid: (value: unknown) => boolean): { value: T; warning: string } {
  if (!storage) return { value: initial(), warning: 'Tab storage unavailable. Progress cannot survive refresh.' };
  try {
    const raw = storage.getItem(key);
    if (!raw) return { value: initial(), warning: '' };
    const parsed = JSON.parse(raw);
    if (parsed.schema !== 1 || !valid(parsed.value)) throw new Error('Incompatible checkpoint');
    return { value: parsed.value, warning: '' };
  } catch { return { value: initial(), warning: 'Saved demonstration could not be restored. A fresh example is shown; the old checkpoint has not been deleted.' }; }
}
export function saveCheckpoint<T>(storage: CheckpointStorage | undefined, key: string, value: T): string {
  try {
    if (!storage) throw new Error('Storage unavailable');
    storage.setItem(key, JSON.stringify({ schema: 1, value }));
    return '';
  } catch { return 'Progress is visible but could not be saved in this tab. Keep this page open.'; }
}
