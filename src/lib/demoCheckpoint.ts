// Synthetic presentation data only. Never use this store for identity or authorization.
export interface CheckpointStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
export function loadCheckpoint<T>(storage: CheckpointStorage | undefined, key: string, initial: () => T, valid: (value: unknown) => boolean): { value: T; warning: string; rejected?: string } {
  if (!storage) return { value: initial(), warning: 'Tab storage unavailable. Progress cannot survive refresh.' };
  let raw: string | null = null;
  try {
    raw = storage.getItem(key);
    if (!raw) return { value: initial(), warning: '' };
    const parsed = JSON.parse(raw);
    if (parsed.schema !== 1 || !valid(parsed.value)) throw new Error('Incompatible checkpoint');
    return { value: parsed.value, warning: '' };
  } catch { return { value: initial(), warning: 'Saved demonstration could not be restored. A fresh example is shown; the old checkpoint has not been deleted.', rejected: raw ?? undefined }; }
}
export function saveCheckpoint<T>(storage: CheckpointStorage | undefined, key: string, value: T, rejected?: string): string {
  try {
    if (!storage) throw new Error('Storage unavailable');
    if (rejected) {
      // Preserve rejected data before the fresh demonstration replaces its active slot.
      // Never overwrite an earlier recovery copy; a failed copy also prevents replacement.
      let backup = `${key}:rejected`;
      let index = 0;
      while (storage.getItem(backup) !== null && storage.getItem(backup) !== rejected) {
        if (++index > 100) throw new Error('Recovery storage is full');
        backup = `${key}:rejected:${index}`;
      }
      if (storage.getItem(backup) === null) storage.setItem(backup, rejected);
    }
    storage.setItem(key, JSON.stringify({ schema: 1, value }));
    return '';
  } catch { return 'Progress is visible but could not be saved in this tab. Keep this page open.'; }
}
