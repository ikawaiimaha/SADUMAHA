import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Check, Copy, Download, Eye, Send } from 'lucide-react';
import { useUiText } from '../context/I18nContext';
import { arabicCount, buildDeck, coveringEmail, deckFileName, deckToPptx, type DeckLang, type Slide } from '../lib/nominationDeck';
import { downloadBlob } from '../lib/nominationExport';
import { caseStage, type CaseWork, type NominationCase, type NominationEvent, type SentDeck } from '../lib/nominations';

// Same look as NominationWorkspace's ui (kept local: that module imports this one).
const quiet = 'inline-flex items-center justify-center gap-2 rounded-md border border-[#CBB89F] bg-white ps-4 pe-4 py-2 font-medium hover:bg-[#FFFAF0] disabled:cursor-not-allowed disabled:opacity-40';
const button = 'inline-flex items-center justify-center gap-2 rounded-md bg-[#8B261E] ps-4 pe-4 py-2 font-semibold text-white shadow-sm hover:bg-[#74201A] disabled:cursor-not-allowed disabled:opacity-40';
const card = 'rounded-xl border border-[#E4D8C4] bg-white shadow-[0_1px_2px_rgba(44,42,41,0.06)]';

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

export function NominationPresentation({ event, cases, works, urls, busy, onExported, onMessage, onRecordSent, onOpenCase }: {
  event: NominationEvent; cases: NominationCase[]; works: CaseWork[]; urls: Record<string, string>; busy: boolean;
  onExported: (ids: string[], note: string) => void; onMessage: (message: string) => void;
  /** Records the downloaded PowerPoint as the deck sent to the Committee; resolves true when recorded. */
  onRecordSent: (deck: SentDeck) => Promise<boolean>;
  onOpenCase: (id: string) => void;
}) {
  const { t, lang: uiLang, isAr } = useUiText();
  const eligible = cases.filter(c => ['READY', 'SENT'].includes(caseStage(c)));
  const [chosen, setChosen] = useState<string[]>(() => eligible.map(c => c.id));
  const [lang, setLang] = useState<DeckLang>(uiLang === 'ar' ? 'ar' : 'en');
  const [preview, setPreview] = useState(false);
  const [working, setWorking] = useState(false);
  // The last PowerPoint downloaded, kept so the file recorded as sent is the very file that was emailed.
  const [downloaded, setDownloaded] = useState<(SentDeck & { key: string }) | null>(null);
  const eligibleKey = eligible.map(c => c.id).join(',');
  // New ready cases join the selection; cases that are no longer eligible leave it.
  useEffect(() => { setChosen(prev => [...new Set([...prev.filter(id => eligibleKey.split(',').includes(id)), ...eligibleKey.split(',').filter(Boolean)])]); }, [eligibleKey]);
  const selected = eligible.filter(c => chosen.includes(c.id));
  const deckKey = `${lang}:${selected.map(c => c.id).join(',')}`;
  const recordable = downloaded && downloaded.key === deckKey ? downloaded : null;
  const slides = useMemo(() => buildDeck(event, selected.map(c => ({ ...c, works: works.filter(w => w.dossier_id === c.id) })), lang, new Date()), [event, selected, works, lang]);
  const scouting = cases.filter(c => caseStage(c) === 'DRAFT').length;
  const thumb = (id: string) => { const w = works.find(x => x.dossier_id === id); return w ? urls[w.image_path] : undefined; };

  async function downloadPptx() {
    setWorking(true);
    try {
      const date = new Date();
      const blob = await presentationBlob(slides, lang, urls), fileName = deckFileName(event, lang, date);
      downloadBlob(blob, `${fileName}.pptx`);
      setDownloaded({ key: deckKey, blob, fileName, lang, caseIds: selected.map(c => c.id) });
      onExported(selected.map(c => c.id), t('PowerPoint downloaded. Attach it to your email to the Committee.', 'نُزّل ملف PowerPoint. أرفقه برسالتك إلى اللجنة.'));
    } catch (error) { onMessage(error instanceof Error ? error.message : t('The presentation could not be created.', 'تعذّر إنشاء العرض.')); }
    finally { setWorking(false); }
  }
  async function copyEmail() {
    try { await navigator.clipboard.writeText(coveringEmail(event, selected, lang)); onMessage(t('Email text copied. Paste it into Outlook.', 'نُسخ نص الرسالة. الصقه في Outlook.')); }
    catch { onMessage(t('Copying was blocked by the browser.', 'منع المتصفح النسخ.')); }
  }
  const step = (n: number, title: string, body: ReactNode, done = false) => <li className={`${card} flex gap-4 ps-5 pe-5 py-5`}>
    <span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${done ? 'bg-[#8B261E] text-white' : 'bg-[#F7F1E6] text-[#8B261E]'}`}>{done ? <Check aria-hidden className="size-4" /> : n}</span>
    <div className="min-w-0 flex-1 space-y-3"><h3 className="font-serif text-lg leading-8">{title}</h3>{body}</div>
  </li>;

  return <section className="space-y-4" aria-labelledby="presentation-heading">
    <div><h2 id="presentation-heading" className="font-serif text-2xl">{t('Committee presentation', 'العرض التقديمي للجنة')}</h2>
      <p className="text-sm text-[#6E6259]">{t('The Committee and the Director do not use SADU. You send them this deck by email, and record their reply on each artist.', 'لا تستخدم اللجنة والمدير سدو. ترسل إليهم هذا العرض بالبريد الإلكتروني، وتسجّل ردّهم في ملف كل فنان.')}</p></div>
    {!eligible.length ? <div className={`${card} space-y-2 ps-6 pe-6 py-8 text-center`}>
      <h3 className="font-serif text-xl">{t('No artist is ready yet', 'لا يوجد فنان جاهز بعد')}</h3>
      <p className="mx-auto max-w-md text-sm text-[#6E6259]">{scouting
        ? t(`Open an artist from the Artists tab, complete the case and press “Ready for Committee”. ${scouting} case(s) are still being scouted.`, `افتح ملف فنان من تبويب الفنانين، واستكمله، ثم اضغط «جاهز للجنة». ما زال ${scouting} من الملفات قيد الاستكشاف.`)
        : t('Start an artist case in the Artists tab first.', 'ابدأ بملف فنان في تبويب الفنانين أولاً.')}</p>
    </div> : <ol className="space-y-3">
      {step(1, t('Choose the artists', 'اختر الفنانين'), <ul className="grid gap-2 sm:grid-cols-2">
        {eligible.map(c => { const on = chosen.includes(c.id); return <li key={c.id}><label className={`flex cursor-pointer items-center gap-3 rounded-lg border ps-3 pe-3 py-2 ${on ? 'border-[#8B261E] bg-[#FBF4F1]' : 'border-[#D9CEBA] bg-white'}`}>
          <input type="checkbox" className="size-4 accent-[#8B261E]" checked={on} onChange={e => setChosen(e.target.checked ? [...chosen, c.id] : chosen.filter(id => id !== c.id))} />
          {thumb(c.id) ? <img src={thumb(c.id)} alt="" className="size-10 rounded-md object-cover" /> : <span aria-hidden className="size-10 rounded-md bg-[#F1E7D6]" />}
          <span className="min-w-0 flex-1"><strong className="block truncate"><bdi>{isAr ? c.arabic_name : c.name}</bdi></strong>
            <span className="block truncate text-xs text-[#6E6259]">{caseStage(c) === 'SENT' ? t('Already sent once', 'أُرسل سابقاً') : t('Ready', 'جاهز')} · {c.nationality}</span></span>
          <button type="button" className="text-xs text-[#8B261E] underline" onClick={e => { e.preventDefault(); onOpenCase(c.id); }}>{t('Open', 'فتح')}</button>
        </label></li>; })}
      </ul>, selected.length > 0)}
      {step(2, t('Pick the language and check the slides', 'اختر اللغة وراجع الشرائح'), <>
        <div className="inline-flex rounded-lg border border-[#D9CEBA] bg-white p-1" role="radiogroup" aria-label={t('Presentation language', 'لغة العرض')}>
          {(['ar', 'en'] as DeckLang[]).map(l => <button key={l} type="button" role="radio" aria-checked={lang === l} onClick={() => setLang(l)}
            className={`rounded-md ps-4 pe-4 py-1.5 text-sm font-semibold ${lang === l ? 'bg-[#1A1817] text-white' : 'text-[#3F3A35]'}`} lang={l}>{l === 'ar' ? 'العربية' : 'English'}</button>)}
        </div>
        <p className="text-sm text-[#6E6259]">{t(`${slides.length} slides. Long biographies and rationales are shortened on the slides; the full text is in the export.`, `${arabicCount(slides.length, ['شريحة واحدة', 'شريحتان', 'شرائح', 'شريحة'])}. تُختصر النبذ التعريفية ومبررات الترشيح الطويلة في الشرائح؛ النص الكامل في الملف المُصدَّر.`)}</p>
        <button type="button" className={quiet} disabled={!selected.length} onClick={() => setPreview(true)}><Eye aria-hidden className="size-4" />{t('Preview slides (and save as PDF)', 'معاينة الشرائح (وحفظها PDF)')}</button>
      </>)}
      {step(3, t('Download the PowerPoint and email it', 'نزّل ملف PowerPoint وأرسله بالبريد'), <>
        <div className="flex flex-wrap gap-3">
          <button type="button" className={button} disabled={busy || working || !selected.length} onClick={() => void downloadPptx()}><Download aria-hidden className="size-4" />{working ? t('Preparing…', 'جارٍ الإعداد…') : t('Download PowerPoint', 'تنزيل PowerPoint')}</button>
          <button type="button" className={quiet} disabled={!selected.length} onClick={() => void copyEmail()}><Copy aria-hidden className="size-4" />{t('Copy email text', 'نسخ نص الرسالة')}</button>
        </div>
        <p className="text-sm text-[#6E6259]">{t('Attach the file to an Outlook email to the Committee and paste the text as the message.', 'أرفق الملف برسالة Outlook إلى اللجنة والصق النص في متن الرسالة.')}</p>
      </>, !!recordable)}
      {step(4, t('Record it as sent', 'سجّل الإرسال'), recordable ? <>
        <p className="text-sm">{t(`After you email “${recordable.fileName}.pptx” to the Committee, record it here. SADU keeps a copy of that file and which ${recordable.caseIds.length} case(s) it carried, so each decision can be matched to what the Committee read.`,
          `بعد إرسال «${recordable.fileName}.pptx» إلى اللجنة بالبريد الإلكتروني، سجّله هنا. يحتفظ سدو بنسخة من الملف وبالترشيحات التي تضمنها (${recordable.caseIds.length})، ليُطابَق كل قرار بما اطّلعت عليه اللجنة.`)}</p>
        <button type="button" className={button} disabled={busy || working} onClick={() => void onRecordSent(recordable).then(ok => { if (ok) setDownloaded(null); })}>
          <Send aria-hidden className="size-4" />{t('Record this PowerPoint as sent', 'تسجيل إرسال ملف PowerPoint هذا')}</button>
      </> : <p className="text-sm text-[#6E6259]">{t('Available after you download the PowerPoint in step 3, so SADU keeps the exact file you emailed.', 'يتاح بعد تنزيل ملف PowerPoint في الخطوة 3، ليحتفظ سدو بالملف نفسه الذي أرسلته.')}</p>)}
    </ol>}
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
