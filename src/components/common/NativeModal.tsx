import { ReactNode, useLayoutEffect, useRef } from 'react';
import './NativeModal.css';

interface NativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  className?: string;
  id?: string;
  returnFocusSelector?: string;
}

/** Keep the existing dialog content; the browser supplies modal isolation. */
export function NativeModal({ isOpen, onClose, labelledBy, children, className = '', id, returnFocusSelector }: NativeModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!isOpen || !dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = 'hidden';
    dialog.querySelector<HTMLElement>('[data-modal-close]')?.focus();
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      // A command/role menu may unmount its trigger before the dialog opens.
      const target = opener?.isConnected && opener !== document.body && opener.getClientRects().length > 0
        ? opener
        : returnFocusSelector ? Array.from(document.querySelectorAll<HTMLElement>(returnFocusSelector)).find(element => element.getClientRects().length > 0) : null;
      target?.focus({ preventScroll: true });
    };
  }, [isOpen, returnFocusSelector]);

  return <dialog ref={ref} id={id} aria-labelledby={labelledBy}
    className={`sadu-native-modal ${className}`}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const dialog = event.currentTarget;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]'))
        .filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0);
      const first = controls[0]; const last = controls.at(-1);
      // Native modality makes the page inert; wrap Tab before it moves into browser chrome.
      if (first && last && (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    }}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClose={() => { if (isOpen && ref.current && !ref.current.open) onClose(); }}>
    {children}
  </dialog>;
}
