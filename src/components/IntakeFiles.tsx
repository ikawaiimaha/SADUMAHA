import { useRef, useState } from 'react';
import { useArtistIntake } from '../context/ArtistIntakeContext';
import { useI18n } from '../context/I18nContext';
import { IntakeAsset } from '../data/artistIntake';

export function IntakeFiles({ slot, disabled = false }: { slot: IntakeAsset['slot']; disabled?: boolean }) {
  const { assets, addAsset, removeAsset } = useArtistIntake(); const { isAr, formatNumber } = useI18n();
  const t = (en: string, ar: string) => isAr ? ar : en; const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [drag, setDrag] = useState(false);
  const busyRef = useRef(false); const selected = assets.filter(a => a.slot === slot); const pdfOnly = slot === 'cv' || slot === 'portfolio'; const limit = pdfOnly ? 1 : 5;
  const choose = async (files: File[]) => {
    if (disabled || busyRef.current) return; busyRef.current = true; setBusy(true); setError('');
    try {
      if (selected.length + files.length > limit || files.length === 0) throw new Error(t(`Choose at most ${limit} file(s) for this section.`, `الحد الأقصى لعدد الملفات في هذا القسم: ${formatNumber(limit)}.`));
      if (selected.reduce((sum, a) => sum + a.size, 0) + files.reduce((sum, f) => sum + f.size, 0) > 40 * 1024 * 1024) throw new Error(t('Keep this section under 40 MB.', 'اجعل حجم هذا القسم أقل من ٤٠ ميغابايت.'));
      // Validate the entire batch before adding it. Picker filters alone do not validate files.
      for (const file of files) {
        if (!file.size || file.size > 10 * 1024 * 1024) throw new Error(t('Each file must be non-empty and no larger than 10 MB.', 'يجب ألا يكون الملف فارغاً وألا يتجاوز ١٠ ميغابايت.'));
        const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
        const pdf = file.type === 'application/pdf' && String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
        const png = file.type === 'image/png' && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
        const jpg = file.type === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
        if (!(pdf || (!pdfOnly && (png || jpg)))) throw new Error(t('Use a PDF for roster documents; proposal files may also be JPEG or PNG. This is a local format check, not a security scan.', 'استخدم PDF لمستندات السجل؛ ويمكن للمقترح استخدام JPEG أو PNG أيضاً. هذا فحص صيغة محلي وليس فحصاً أمنياً.'));
      }
      files.forEach(file => addAsset({ id: crypto.randomUUID(), slot, name: file.name, size: file.size, type: file.type, url: URL.createObjectURL(file) }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : t('Could not read the selected file.', 'تعذرت قراءة الملف المختار.')); } finally { busyRef.current = false; setBusy(false); }
  };
  return <div className="intake-files">
    <label className={`intake-drop ${drag ? 'is-dragging' : ''}`} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); void choose(Array.from(e.dataTransfer.files)); }}>
      <strong>{slot === 'cv' ? t('Optional institutional CV · PDF', 'سيرة ذاتية اختيارية للسجل · PDF') : slot === 'portfolio' ? t('Optional general portfolio · PDF', 'ملف أعمال عام اختياري · PDF') : t('Optional concept images or documents', 'صور الفكرة أو مستنداتها الاختيارية')}</strong>
      <span>{t(`Drop files here or choose files. Up to ${limit}; 10 MB each.`, `اسحب الملفات إلى هنا أو اخترها. الحد الأقصى لعدد الملفات: ${formatNumber(limit)}؛ والحجم: ١٠ ميغابايت لكل ملف.`)}</span>
      <input aria-label={slot === 'cv' ? t('Choose sample CV', 'اختيار سيرة تجريبية') : slot === 'portfolio' ? t('Choose sample portfolio PDF', 'اختيار ملف أعمال تجريبي PDF') : t('Choose proposal files', 'اختيار ملفات المقترح')} type="file" disabled={disabled || busy} multiple={!pdfOnly} accept={pdfOnly ? 'application/pdf' : 'application/pdf,image/jpeg,image/png'} onChange={e => { void choose(Array.from(e.target.files ?? [])); e.target.value = ''; }}/>
    </label>
    <p className="lr-small">{t('Local preview only; files are not uploaded or recovered after reload. Original filenames are retained. A portfolio link or written description can be used instead.', 'معاينة محلية فقط؛ لا تُرفع الملفات ولا تُستعاد بعد تحديث الصفحة. تُحفظ أسماؤها الأصلية. يمكن استخدام رابط أعمال أو وصف كتابي بدلاً منها.')}</p>
    {busy && <p role="status">{t('Checking file format…', 'جارٍ فحص صيغة الملف…')}</p>}{error && <p role="alert" className="lr-issue">{error}</p>}
    <ul>{selected.map(file => <li key={file.id}><span><bdi>{file.name}</bdi> · {formatNumber(file.size / 1024 / 1024, { maximumFractionDigits: 1 })} {t('MB', 'ميغابايت')}</span><button type="button" onClick={() => removeAsset(file.id)} aria-label={t('Remove ', 'إزالة ') + file.name}>{t('Remove from draft', 'إزالة من المسودة')}</button></li>)}</ul>
  </div>;
}
