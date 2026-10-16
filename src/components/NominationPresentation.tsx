import { useEffect, useMemo, useState } from 'react';
import { useUiText } from '../context/I18nContext';
import { arabicCount, buildDeck, coveringEmail, deckFileName, deckToPptx, type DeckLang, type Slide } from '../lib/nominationDeck';
import { downloadBlob } from '../lib/nominationExport';
import { caseStage, type CaseWork, type NominationCase, type NominationEvent } from '../lib/nominations';

const quiet = 'rounded border border-[#8C8173] bg-white ps-4 pe-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed';
const button = 'rounded bg-[#8B261E] ps-4 pe-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed';

type ImageData = { dataUrl: string; width: number; height: number };

/** Reads a signed image URL into a data URL with its pixel size (for the PowerPoint file). */
export async function loadImage(url: string): Promise<ImageData | null> {
  try {
    const blob = await (await fetch(url)).blob();
    const dataUrl = await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = reject; r.readAsDataURL(blob); });
    const size = await new Promise<{ width: number; height: number }>((resolve, reject) => { const img = new Image(); img.onload = () => resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 }); img.onerror = reject; img.src = dataUrl; });
    return { dataUrl, ...size };
  } catch { return null; }
}

export async function presentationBlob(slides: Slide[], lang: DeckLang, urls: Record<string, string>): Promise<Blob> {
  const paths = [...new Set(slides.flatMap(s => s.kind === 'works' ? s.works.map(w => w.path) : s.kind === 'profile' && s.image ? [s.image.path] : []))];
  const loaded = await Promise.all(paths.map(async p => [p, urls[p] ? await loadImage(urls[p]) : null] as const));
  return deckToPptx(slides, lang, Object.fromEntries(loaded.filter(([, v]) => v)) as Record<string, ImageData>);
}

export function NominationPresentation({ event, cases, works, urls, busy, onExported, onMessage }: {
  event: NominationEvent; cases: NominationCase[]; works: CaseWork[]; urls: Record<string, string>; busy: boolean;
  onExported: (ids: string[], note: string) => void; onMessage: (message: string) => void;
}) {
  const { t, lang: uiLang } = useUiText();
  const eligible = cases.filter(c => ['READY', 'SENT'].includes(caseStage(c)));
  const [chosen, setChosen] = useState<string[]>(() => eligible.map(c => c.id));
  const [lang, setLang] = useState<DeckLang>(uiLang === 'ar' ? 'ar' : 'en');
  const [preview, setPreview] = useState(false);
  const [working, setWorking] = useState(false);
  const eligibleKey = eligible.map(c => c.id).join(',');
  // New ready cases join the selection; cases that are no longer eligible leave it.
  useEffect(() => { setChosen(prev => [...new Set([...prev.filter(id => eligibleKey.split(',').includes(id)), ...eligibleKey.split(',').filter(Boolean)])]); }, [eligibleKey]);
  const selected = eligible.filter(c => chosen.includes(c.id));
  const slides = useMemo(() => buildDeck(event, selected.map(c => ({ ...c, works: works.filter(w => w.dossier_id === c.id) })), lang, new Date()), [event, selected, works, lang]);

  async function downloadPptx() {
    setWorking(true);
    try {
      const date = new Date();
      downloadBlob(await presentationBlob(slides, lang, urls), `${deckFileName(event, lang, date)}.pptx`);
      onExported(selected.map(c => c.id), t('PowerPoint downloaded. Attach it to your email to the Committee.', 'نُزّل ملف PowerPoint. أرفقه برسالتك إلى اللجنة.'));
    } catch (error) { onMessage(error instanceof Error ? error.message : t('The presentation could not be created.', 'تعذّر إنشاء العرض.')); }
    finally { setWorking(false); }
  }
  async function copyEmail() {
    try { await navigator.clipboard.writeText(coveringEmail(event, selected, lang)); onMessage(t('Email text copied. Paste it into Outlook.', 'نُسخ نص الرسالة. الصقه في Outlook.')); }
    catch { onMessage(t('Copying was blocked by the browser.', 'منع المتصفح النسخ.')); }
  }

  return <section className="space-y-3 rounded border border-[#D9CEBA] bg-white ps-4 pe-4 py-4" aria-labelledby="presentation-heading">
    <h3 id="presentation-heading" className="text-lg">{t('Committee presentation', 'العرض التقديمي للجنة')}</h3>
    {!eligible.length ? <p className="text-sm">{t('Press “Ready for Committee” on a case to include it in the presentation.', 'اضغط «جاهز للجنة» في الترشيح لإدراجه في العرض.')}</p> : <>
      <fieldset className="space-y-1"><legend className="text-sm text-[#5E554B]">{t('Cases in the presentation', 'الترشيحات في العرض')}</legend>
        {eligible.map(c => <label key={c.id} className="flex items-center gap-2"><input type="checkbox" checked={chosen.includes(c.id)}
          onChange={e => setChosen(e.target.checked ? [...chosen, c.id] : chosen.filter(id => id !== c.id))} />
          <span><bdi>{c.name}</bdi> · <bdi lang="ar">{c.arabic_name}</bdi>{caseStage(c) === 'SENT' ? ` · ${t('already sent', 'أُرسل سابقاً')}` : ''}</span></label>)}
      </fieldset>
      <fieldset className="flex flex-wrap gap-4"><legend className="text-sm text-[#5E554B]">{t('Presentation language', 'لغة العرض')}</legend>
        <label className="flex items-center gap-2"><input type="radio" name="deck-lang" checked={lang === 'ar'} onChange={() => setLang('ar')} />العربية</label>
        <label className="flex items-center gap-2"><input type="radio" name="deck-lang" checked={lang === 'en'} onChange={() => setLang('en')} />English</label>
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <button type="button" className={button} disabled={busy || working || !selected.length} onClick={() => void downloadPptx()}>{working ? t('Preparing…', 'جارٍ الإعداد…') : t('Download PowerPoint', 'تنزيل PowerPoint')}</button>
        <button type="button" className={quiet} disabled={!selected.length} onClick={() => setPreview(true)}>{t('Preview and save as PDF', 'معاينة وحفظ PDF')}</button>
        <button type="button" className={quiet} disabled={!selected.length} onClick={() => void copyEmail()}>{t('Copy email text', 'نسخ نص الرسالة')}</button>
      </div>
      <p className="text-sm text-[#5E554B]">{t(`${slides.length} slides. Long biographies and rationales are shortened on the slides; the full text is in the export.`, `${arabicCount(slides.length, ['شريحة واحدة', 'شريحتان', 'شرائح', 'شريحة'])}. تُختصر النبذ التعريفية ومبررات الترشيح الطويلة في الشرائح؛ النص الكامل في الملف المُصدَّر.`)}</p>
    </>}
    {preview && <DeckPreview slides={slides} lang={lang} urls={urls} onClose={() => setPreview(false)} />}
  </section>;
}

function DeckPreview({ slides, lang, urls, onClose }: { slides: Slide[]; lang: DeckLang; urls: Record<string, string>; onClose: () => void }) {
  const { t } = useUiText();
  useEffect(() => {
    document.documentElement.classList.add('sadu-deck-printing');
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.documentElement.classList.remove('sadu-deck-printing'); window.removeEventListener('keydown', onKey); };
  }, [onClose]);
  const img = (path: string, alt: string) => urls[path] ? <img src={urls[path]} alt={alt} /> : <div className="sadu-slide-placeholder" />;
  return <div className="sadu-deck" role="dialog" aria-modal="true" aria-label={t('Presentation preview', 'معاينة العرض')}>
    <div className="sadu-deck-bar no-print">
      <p>{t('Use “Save as PDF” as the printer to make the PDF.', 'اختر «حفظ بتنسيق PDF» كطابعة لإنشاء ملف PDF.')}</p>
      <button type="button" className={button} onClick={() => window.print()}>{t('Print or save as PDF', 'طباعة أو حفظ PDF')}</button>
      <button type="button" className={quiet} onClick={onClose}>{t('Close', 'إغلاق')}</button>
    </div>
    <div lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {slides.map((s, i) => <section key={i} className={`sadu-slide sadu-slide-${s.kind}`} aria-label={`${i + 1}`}>
        {s.kind === 'title' && <><h1>{s.title}</h1><p className="sadu-slide-accent">{s.subtitle}</p><p className="sadu-slide-soft">{s.meta}</p></>}
        {s.kind === 'summary' && <><h2>{s.title}</h2><table><thead><tr>{s.headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{s.rows.map(r => <tr key={r[0]}>{r.map((cell, j) => <td key={j}><bdi>{cell}</bdi></td>)}</tr>)}</tbody></table></>}
        {s.kind === 'profile' && <div className="sadu-profile-body">
          <div><h2>{s.name}</h2><p className="sadu-slide-soft"><bdi>{s.otherName}</bdi></p><p className="sadu-slide-accent">{s.facts}</p>
            <h3>{s.bioLabel}</h3><p dir="auto">{s.bio || '—'}</p><h3>{s.rationaleLabel}</h3><p dir="auto">{s.rationale || '—'}</p></div>
          {s.image && <figure>{img(s.image.path, s.image.caption)}<figcaption dir="auto">{s.image.caption}</figcaption></figure>}
        </div>}
        {s.kind === 'works' && <><h2>{s.title}</h2><div className="sadu-works-grid">{s.works.map(w => <figure key={w.path}>{img(w.path, w.caption)}
          <figcaption><strong dir="auto">{w.caption}</strong><span dir="auto">{w.credit}</span></figcaption></figure>)}</div></>}
        {s.kind === 'closing' && <><h2>{s.title}</h2><p className="sadu-slide-soft">{s.intro}</p><ul>{s.items.map((item, k) => <li key={k}><bdi>{item}</bdi></li>)}</ul></>}
      </section>)}
    </div>
  </div>;
}
