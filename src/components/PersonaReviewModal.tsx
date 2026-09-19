import type { Language } from '../types';
import { useI18n } from '../context/I18nContext';
import { LeadershipPersonaSuite } from './LeadershipPersonaSuite';
import { useEffect, useRef } from 'react';

interface PersonaReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  onOpenLeadershipTab?: () => void;
}
export function PersonaReviewModal({ isOpen, onClose, lang }: PersonaReviewModalProps) {
  const i18n = useI18n();
  const isAr = (lang ?? i18n.lang) === 'ar';
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (isOpen && !dialog.current?.open) dialog.current?.showModal();
    if (!isOpen && dialog.current?.open) dialog.current?.close();
  }, [isOpen]);
  return <dialog ref={dialog} aria-label={isAr ? 'محاور مراجعة مقترحة' : 'Proposed review lenses'}
    onCancel={onClose}
    className="m-auto w-[min(92vw,64rem)] max-h-[85vh] overflow-auto rounded-xl bg-sadu-linen p-6 text-sadu-charcoal backdrop:bg-black/50">
    <button type="button" className="mb-4 rounded border border-sadu-gold px-3 py-2" onClick={onClose}>{isAr ? 'إغلاق' : 'Close'}</button>
    <LeadershipPersonaSuite lang={lang} />
  </dialog>;
}
