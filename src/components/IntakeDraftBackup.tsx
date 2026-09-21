import { useI18n } from '../context/I18nContext';
import { useArtistIntake } from '../context/ArtistIntakeContext';
import { useDraftBackup } from '../context/IntakeDraftBackupContext';
import { recoverableDraft } from '../data/artistIntake';

export function IntakeDraftBackup({ visible }: { visible: boolean }) {
  const { form } = useArtistIntake(); const { isAr } = useI18n(); const t = (en: string, ar: string) => isAr ? ar : en;
  const { stored, enabled, savedAt, status, restore, toggle } = useDraftBackup();
  const exportDraft = () => {
    const draft = recoverableDraft(form.getValues());
    const profile = draft.profile;
    const lines = [
      'SADU ARTIST PROFILE',
      '===================',
      '',
      `Catalogue name (English): ${profile.nameEn || 'Not provided'}`,
      `Catalogue name (Arabic): ${profile.nameAr || 'غير متوفر'}`,
      `Biography: ${profile.bio || 'Not provided'}`,
      `Country: ${profile.country || 'Not provided'}`,
      `City: ${profile.city || 'Not provided'}`,
      `Website: ${profile.website || 'Not provided'}`,
      `Representation: ${profile.representation}`,
      `Organisation: ${profile.organisation || 'Not provided'}`,
      '',
      'This local text copy contains sample profile information only.',
    ];
    const file = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(file); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'SADU-artist-profile.txt'; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="intake-backup" hidden={!visible} aria-label={t('Draft recovery', 'استعادة المسودة')}>
    <div><strong role="status">{status === 'saving' ? t('Saving to this device…', 'جارٍ الحفظ على هذا الجهاز…') : status === 'saved' ? t('Saved on this device at ', 'حُفظ على هذا الجهاز في ') + new Date(savedAt).toLocaleTimeString(isAr ? 'ar-AE' : 'en-GB') : status === 'error' ? t('Device save unavailable. Keep this page open or export your text.', 'الحفظ على الجهاز غير متاح. أبقِ الصفحة مفتوحة أو صدّر النص.') : status === 'conflict' ? t('Another tab changed the saved draft. Saving paused.', 'غيّرت علامة تبويب أخرى المسودة المحفوظة. توقف الحفظ.') : t('Draft in this session', 'مسودة في هذه الجلسة')}</strong>
      <p className="lr-small">{t('Optional backup of sample profile and proposal text. Legal names, contact details, file contents and submission receipts are excluded. Nothing syncs to a server. Do not enter real personal data.', 'نسخة اختيارية لنص الملف والمقترح التجريبيين. لا تشمل الأسماء القانونية أو بيانات التواصل أو محتويات الملفات أو إيصالات التقديم. لا مزامنة مع خادم. لا تدخل بيانات شخصية حقيقية.')}</p>
    </div>
    <div className="lr-actions">
      {stored ? <button type="button" onClick={() => { restore(); }}>{t('Restore saved text', 'استعادة النص المحفوظ')}</button> : <button type="button" disabled={status === 'error' || status === 'conflict'} onClick={() => { toggle(); }}>{enabled ? t('Pause device backup', 'إيقاف النسخ على الجهاز') : t('Enable device backup', 'تفعيل النسخ على الجهاز')}</button>}
      <button type="button" onClick={exportDraft}>{t('Download profile (.txt)', 'تنزيل الملف الشخصي (.txt)')}</button>
    </div>
    <p className="lr-small">{t('Download a local text copy of your draft profile. Unsaved session text can be lost on refresh; browser warnings cannot protect against every interruption.', 'نزّل نسخة نصية محلية من ملفك الشخصي. قد تُفقد نصوص الجلسة غير المحفوظة عند تحديث الصفحة؛ ولا تحمي تحذيرات المتصفح من جميع حالات الانقطاع.')}</p>
    {stored && <p className="lr-small">{t('A saved draft is available for local recovery. Restoring replaces the current form text; re-enter sample legal names and contacts after recovery.', 'توجد مسودة محفوظة للاستعادة المحلية. تحل الاستعادة محل النص الحالي؛ أعد إدخال الأسماء القانونية التجريبية وبيانات التواصل بعد الاستعادة.')}</p>}
  </section>;
}
