import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { loadCheckpoint, saveCheckpoint } from './demoCheckpoint';
const tabStorage = () => { try { return window.sessionStorage; } catch { return undefined; } };
export function useDemoCheckpoint<T>(key: string | undefined, initial: () => T, valid: (value: unknown) => boolean): [T, Dispatch<SetStateAction<T>>, string] {
  const [loaded] = useState(() => key ? loadCheckpoint(tabStorage(), key, initial, valid) : { value: initial(), warning: '' });
  const [value, render] = useState(loaded.value);
  const current = useRef(value);
  const [warning, setWarning] = useState(loaded.warning);
  const setValue = useCallback<Dispatch<SetStateAction<T>>>((update) => {
    const next = typeof update === 'function' ? (update as (previous: T) => T)(current.current) : update;
    // Save in the event, before authentication can unmount the component.
    if (key) setWarning(saveCheckpoint(tabStorage(), key, next));
    current.current = next;
    render(next);
  }, [key]);
  return [value, setValue, warning];
}
