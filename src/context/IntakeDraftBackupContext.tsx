import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useWatch } from 'react-hook-form';
import { useArtistIntake } from './ArtistIntakeContext';
import { useDebounce } from '../hooks/useDebounce';
import { DraftEnvelope, INTAKE_DRAFT_KEY, readIntakeDraft, writeIntakeDraft } from '../utils/intakeDraftStorage';

function useIntakeDraftBackup() {
  const { form } = useArtistIntake();
  // Keystrokes reach only the save indicator; the registration form remains uncontrolled.
  const values = useWatch({ control: form.control });
  const settled = useDebounce(values, 350);
  const [enabled, setEnabled] = useState(false);
  const [stored, setStored] = useState<DraftEnvelope | null>(null);
  const [status, setStatus] = useState<'session' | 'saving' | 'saved' | 'error' | 'conflict'>('session');
  const [savedAt, setSavedAt] = useState(''); const revision = useRef<string | null>(null);
  useEffect(() => {
    try { setStored(readIntakeDraft(localStorage)); } catch { setStatus('error'); }
    const changed = (event: StorageEvent) => {
      if (event.key !== INTAKE_DRAFT_KEY && event.key !== null) return;
      try {
        const next = readIntakeDraft(localStorage);
        if ((next?.revision ?? null) !== revision.current) { setEnabled(false); setStored(next); setStatus('conflict'); }
      } catch { setEnabled(false); setStatus('error'); }
    };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const save = async () => {
      try {
        if (!navigator.locks) throw new Error('unavailable');
        await navigator.locks.request(INTAKE_DRAFT_KEY, () => {
          if (!active) return;
          const next = writeIntakeDraft(localStorage, form.getValues(), revision.current, crypto.randomUUID(), new Date().toISOString());
          revision.current = next.revision; setSavedAt(next.savedAt); setStatus('saved');
        });
      } catch (error) {
        if (!active) return;
        setEnabled(false); setStatus(error instanceof Error && error.message === 'conflict' ? 'conflict' : 'error');
        try { setStored(readIntakeDraft(localStorage)); } catch { /* Preserve the in-memory draft. */ }
      }
    };
    // Device fallback is requested immediately; debounce only the reassuring status announcement.
    // No server mutation exists in this fictional mockup.
    setStatus('saving'); void save();
    const flush = () => { if (document.visibilityState === 'hidden') void save(); };
    document.addEventListener('visibilitychange', flush);
    return () => { active = false; document.removeEventListener('visibilitychange', flush); };
  }, [enabled, values, form]);
  const restore = () => {
    if (!stored) return;
    form.reset(stored.data); revision.current = stored.revision; setSavedAt(stored.savedAt); setStored(null); setEnabled(true);
  };
  const toggle = () => { setEnabled(value => !value); if (enabled) setStatus('session'); };
  return { stored, enabled, savedAt, status: enabled && status === 'saved' && values !== settled ? 'saving' as const : status, restore, toggle };
}
const Context = createContext<ReturnType<typeof useIntakeDraftBackup> | null>(null);
export function IntakeDraftBackupProvider({ children }: { children: ReactNode }) {
  const backup = useIntakeDraftBackup();
  return <Context.Provider value={backup}>{children}</Context.Provider>;
}
export function useDraftBackup() {
  const value = useContext(Context); if (!value) throw new Error('IntakeDraftBackupProvider required'); return value;
}
