import { useArtistIntake } from '../context/ArtistIntakeContext';
import { useI18n } from '../context/I18nContext';
import { useDraftBackup } from '../context/IntakeDraftBackupContext';
import { recoverableDraft } from '../data/artistIntake';

export function IntakeDraftBackup({ visible }: { visible: boolean }) {
  const { form } = useArtistIntake(); const { isAr } = useI18n(); const t = (en: string, ar: string) => isAr ? ar : en;
  const { stored, enabled, savedAt, status, restore, toggle } = useDraftBackup();
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
    </div>
    {stored && <p className="lr-small">{t('A saved draft is available. Restoring replaces the current form text; export it first if needed. Re-enter sample legal names and contacts, and reselect files after recovery.', 'توجد مسودة محفوظة. تحل الاستعادة محل النص الحالي؛ صدّره أولاً عند الحاجة. أعد إدخال الأسماء القانونية التجريبية وبيانات التواصل واختيار الملفات بعد الاستعادة.')}</p>}
  </section>;
}
