import { useEffect, useState } from 'react';

export function PresentationHandoff({ isAr, automatic, onAutomaticChange, pending, onContinue }: {
  isAr: boolean; automatic: boolean; onAutomaticChange: (value: boolean) => void;
  pending: { label: string; id: number } | null; onContinue: () => void;
}) {
  const [remaining, setRemaining] = useState(3500);
  useEffect(() => { setRemaining(3500); }, [pending?.id, automatic]);
  useEffect(() => {
    if (!pending || !automatic) return;
    const started = Date.now();
    const interval = window.setInterval(() => setRemaining(Math.max(0, 3500 - (Date.now() - started))), 100);
    const timer = window.setTimeout(onContinue, 3500);
    return () => { window.clearInterval(interval); window.clearTimeout(timer); };
  }, [pending?.id, automatic, onContinue]);
  return <section dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'التحكم بالعرض' : 'Presentation controls'} className="border-b border-[#D9CEBA] bg-[#F7F1E6] ps-4 pe-4 py-3 flex flex-wrap items-center gap-4 text-start text-sm">
    <label className="flex items-center gap-2"><input type="checkbox" checked={automatic} onChange={e => onAutomaticChange(e.target.checked)} className="size-5" />{isAr ? 'انتقال تلقائي بعد ٣٫٥ ثوانٍ' : 'Auto-forward after 3.5 seconds'}</label>
    {pending && <>
      <p role="status">{isAr ? 'التالي:' : 'Next:'} {pending.label} {automatic && <span aria-hidden="true">· {(remaining / 1000).toFixed(1)}s</span>}</p>
      {automatic && <button type="button" onClick={() => onAutomaticChange(false)} className="rounded border border-[#8B261E] ps-4 pe-4 py-2">{isAr ? 'إيقاف مؤقت' : 'Pause'}</button>}
      <button type="button" onClick={onContinue} className="rounded bg-[#8B261E] text-white ps-4 pe-4 py-2">{isAr ? 'متابعة' : 'Continue'}</button>
    </>}
  </section>;
}
