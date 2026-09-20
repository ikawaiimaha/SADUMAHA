import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../context/I18nContext';

/** A body-level print boundary keeps the mounted application and its draft state intact. */
export function PrintWrapper({ children }: { children: ReactNode }) {
  const { isAr } = useI18n();
  return createPortal(<div data-print-root dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'}>{children}</div>, document.body);
}

let preparing = false;
export async function printDocument() {
  if (preparing) return;
  preparing = true;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    // Use readable fallback fonts if an optional font service is unavailable.
    await Promise.race([document.fonts.ready, new Promise(resolve => { timeout = setTimeout(resolve, 2000); })]);
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    window.print();
  } finally {
    clearTimeout(timeout);
    preparing = false;
  }
}
