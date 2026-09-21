import React from 'react';
import { ShieldCheck, Globe, Fingerprint } from 'lucide-react';
import { Panel } from './Panel';

export interface SignaturePanelProps {
  titleEn?: string;
  titleAr?: string;
  lang?: 'en' | 'ar';
  onUaePass?: () => void;
  onGlobalEcdsa?: () => void;
}

export const SignaturePanel: React.FC<SignaturePanelProps> = ({
  titleEn = 'Authentication & signature route',
  titleAr = 'مسار المصادقة والتوقيع',
  lang = 'en',
  onUaePass,
  onGlobalEcdsa,
}) => {
  const isAr = lang === 'ar';

  const panelTitle = isAr ? titleAr : titleEn;

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-bold text-sadu-charcoal">{panelTitle}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <Panel className="border-sadu-ink/30 bg-sadu-ink text-white" padded={false} as="article">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-200" />
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-amber-200">
                  {isAr ? 'هوية إماراتية' : 'UAE identity'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-base font-bold text-white">{isAr ? 'توقيع عبر UAE PASS' : 'Sign with UAE PASS'}</p>
              <p className="text-xs leading-relaxed text-slate-200">
                {isAr
                  ? 'للمواطنين والمقيمين في الإمارات الذين يملكون حساباً موثّقاً.'
                  : 'For UAE citizens and residents with verified digital identity access.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onUaePass}
              className="w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              {isAr ? 'توقيع عبر UAE PASS' : 'Sign with UAE PASS'}
            </button>
          </div>
        </Panel>

        <Panel className="border-sadu-brick/40 bg-sadu-brick-light" padded={false} as="article">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-sadu-brick" />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-sadu-brick">
                  {isAr ? 'خارجي' : 'International'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-base font-bold text-sadu-charcoal">
                {isAr ? 'توقيع أمني عالمي' : 'Global Secure e-Signature'}
              </p>
              <p className="text-xs leading-relaxed text-sadu-muted">
                {isAr
                  ? 'بوابة موثوقة للتحقق المشفر من جواز السفر قبل اعتماد التوقيع.'
                  : 'Encrypted passport verification gateway for international masters before approval.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onGlobalEcdsa}
              className="w-full rounded-md bg-sadu-brick px-3 py-2 text-sm font-semibold text-white transition hover:bg-sadu-brick-dark"
            >
              {isAr ? 'بوابة التوقيع العالمي الآمن' : 'Global Secure e-Signature'}
            </button>
          </div>
        </Panel>
      </div>
    </section>
  );
};
