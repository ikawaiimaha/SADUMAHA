import { useId, useRef, useState, type ChangeEvent } from 'react';
import { useArtistIntake } from '../context/ArtistIntakeContext';
import { useI18n } from '../context/I18nContext';
import { useDraftBackup } from '../context/IntakeDraftBackupContext';
import { recoverableDraft, type IntakeDraft } from '../data/artistIntake';
import { MAX_DRAFT_FILE_BYTES, parseIntakeDraftFile } from '../utils/intakeDraftStorage';
import { NativeModal } from './common/NativeModal';

export function IntakeDraftBackup({ visible }: { visible: boolean }) {
  const { form } = useArtistIntake(); const { isAr } = useI18n(); const t = (en: string, ar: string) => isAr ? ar : en;
  const { stored, enabled, savedAt, status, restore, toggle, importText } = useDraftBackup();
  const input = useRef<HTMLInputElement>(null); const readVersion = useRef(0); const titleId = useId();
  const [pending, setPending] = useState<{ data: IntakeDraft; name: string } | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'reading' | 'error' | 'success'>('idle');
  const readFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    const version = ++readVersion.current; setImportStatus('reading');
    try {
      if (file.size > MAX_DRAFT_FILE_BYTES) throw new Error('too-large');
      const data = parseIntakeDraftFile(await file.text());
      if (readVersion.current !== version) return;
      setPending({ data, name: file.name }); setImportStatus('idle');
    } catch {
      if (readVersion.current === version) setImportStatus('error');
    }
  };
  const exportDraft = () => {
    const file = new Blob([JSON.stringify({ schema: 1, data: recoverableDraft(form.getValues()) }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(file); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'SADU-sample-artist-draft.json'; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="intake-backup" hidden={!visible} aria-label={t('Draft recovery', 'استعادة المسودة')}>
    <div><strong role="status">{status === 'saving' ? t('Saving to this device…', 'جارٍ الحفظ على هذا الجهاز…') : status === 'saved' ? t('Saved on this device at ', 'حُفظ على هذا الجهاز في ') + new Date(savedAt).toLocaleTimeString(isAr ? 'ar-AE' : 'en-GB') : status === 'error' ? t('Device save unavailable. Keep this page open or export your text.', 'الحفظ على الجهاز غير متاح. أبقِ الصفحة مفتوحة أو صدّر النص.') : status === 'conflict' ? t('Another tab changed the saved draft. Saving paused.', 'غيّرت علامة تبويب أخرى المسودة المحفوظة. توقف الحفظ.') : t('Draft in this session', 'مسودة في هذه الجلسة')}</strong>
      <p className="lr-small">{t('Optional backup of sample profile and proposal text. Legal names, contact details, file contents and submission receipts are excluded. Nothing syncs to a server. Do not enter real personal data.', 'نسخة اختيارية لنص الملف والمقترح التجريبيين. لا تشمل الأسماء القانونية أو بيانات التواصل أو محتويات الملفات أو إيصالات التقديم. لا مزامنة مع خادم. لا تدخل بيانات شخصية حقيقية.')}</p>
    </div>
    <div className="lr-actions">
      {stored ? <button type="button" onClick={() => { restore(); }}>{t('Restore saved text', 'استعادة النص المحفوظ')}</button> : <button type="button" disabled={status === 'error' || status === 'conflict'} onClick={() => { toggle(); }}>{enabled ? t('Pause device backup', 'إيقاف النسخ على الجهاز') : t('Enable device backup', 'تفعيل النسخ على الجهاز')}</button>}
      <button type="button" onClick={exportDraft}>{t('Export draft text', 'تصدير نص المسودة')}</button>
      <button type="button" data-restore-file disabled={importStatus === 'reading'} onClick={() => input.current?.click()}>{t('Restore from file', 'استعادة من ملف')}</button>
      <input ref={input} type="file" accept=".json,application/json" hidden aria-label={t('SADU draft JSON file', 'ملف مسودة سدو بصيغة JSON')} onChange={readFile} />
    </div>
    <p className="lr-small">{t('JSON files up to 150 KB. Review before replacing text. Unsaved session text can be lost on refresh; browser warnings cannot protect against every interruption.', 'ملفات JSON حتى 150 كيلوبايت. راجع المحتوى قبل استبدال النص. قد تُفقد نصوص الجلسة غير المحفوظة عند تحديث الصفحة؛ ولا تحمي تحذيرات المتصفح من جميع حالات الانقطاع.')}</p>
    <p role="status" aria-atomic="true">{importStatus === 'reading' ? t('Reading draft file…', 'جارٍ قراءة ملف المسودة…') : importStatus === 'error' ? t('Import failed. Choose a valid SADU draft JSON file no larger than 150 KB. Your current text is unchanged.', 'تعذر الاستيراد. اختر ملف مسودة سدو صالحاً بصيغة JSON لا يتجاوز 150 كيلوبايت. لم يتغير النص الحالي.') : importStatus === 'success' ? t('Draft text restored to this session. Device backup is paused; enable it to save these changes.', 'استُعيد نص المسودة في هذه الجلسة. النسخ على الجهاز متوقف؛ فعّله لحفظ التغييرات.') : ''}</p>
    {pending && <NativeModal isOpen onClose={() => setPending(null)} labelledBy={titleId} returnFocusSelector="[data-restore-file]" className="max-w-lg">
      <div className="bg-white text-sadu-charcoal p-6 rounded-lg space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
        <h2 id={titleId}>{t('Replace draft text?', 'استبدال نص المسودة؟')}</h2>
        <p className="break-all"><bdi>{pending.name}</bdi></p>
        <p>{t('This replaces the current form text. Legal names and contact fields will be blank. Attachments and submitted records are not restored or changed. Export your current text first if you need it.', 'سيحل النص المستورد محل نص النموذج الحالي. ستصبح حقول الأسماء القانونية والتواصل فارغة. لا تُستعاد المرفقات والسجلات المقدمة ولا تتغير. صدّر النص الحالي أولاً إذا كنت تحتاج إليه.')}</p>
        <div className="lr-actions">
          <button type="button" data-modal-close onClick={() => setPending(null)}>{t('Cancel', 'إلغاء')}</button>
          <button type="button" onClick={exportDraft}>{t('Export current text', 'تصدير النص الحالي')}</button>
          <button type="button" onClick={() => { importText(pending.data); setPending(null); setImportStatus('success'); }}>{t('Replace with imported text', 'استبدال النص بالنص المستورد')}</button>
        </div>
      </div>
    </NativeModal>}
    {stored && <p className="lr-small">{t('A saved draft is available. Restoring replaces the current form text; export it first if needed. Re-enter sample legal names and contacts, and reselect files after recovery.', 'توجد مسودة محفوظة. تحل الاستعادة محل النص الحالي؛ صدّره أولاً عند الحاجة. أعد إدخال الأسماء القانونية التجريبية وبيانات التواصل واختيار الملفات بعد الاستعادة.')}</p>}
  </section>;
}
