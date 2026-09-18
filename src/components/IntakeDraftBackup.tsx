import { useEffect, useRef, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { useArtistIntake } from '../context/ArtistIntakeContext';
import { useI18n } from '../context/I18nContext';
import { recoverableDraft } from '../data/artistIntake';
import { DraftEnvelope, INTAKE_DRAFT_KEY, readIntakeDraft, writeIntakeDraft } from '../utils/intakeDraftStorage';

export function IntakeDraftBackup({ visible }: { visible: boolean }) {
  const { form } = useArtistIntake(); const { isAr } = useI18n(); const t = (en: string, ar: string) => isAr ? ar : en;
  // Only this small status component subscribes to the whole form.
  const values = useWatch({ control: form.control });
  const [enabled, setEnabled] = useState(false); const [stored, setStored] = useState<DraftEnvelope | null>(null);
  const [status, setStatus] = useState<'session' | 'saving' | 'saved' | 'error' | 'conflict'>('session');
  const [savedAt, setSavedAt] = useState(''); const revision = useRef<string | null>(null);
  useEffect(() => {
    try { setStored(readIntakeDraft(localStorage)); } catch { setStatus('error'); }
    const changed = (event: StorageEvent) => {
      if (event.key !== INTAKE_DRAFT_KEY && event.key !== null) return;
      try { const next = readIntakeDraft(localStorage); if ((next?.revision ?? null) !== revision.current) { setEnabled(false); setStored(next); setStatus('conflict'); } } catch { setEnabled(false); setStatus('error'); }
    };
    window.addEventListener('storage', changed); return () => window.removeEventListener('storage', changed);
  }, []);
  useEffect(() => {
    if (!enabled) return;
    let active = true; setStatus('saving');
    const save = async () => {
      try {
        // Serializes cooperating tabs. Without this facility offer export, never claim conflict-safe saving.
        if (!navigator.locks) throw new Error('unavailable');
        await navigator.locks.request(INTAKE_DRAFT_KEY, () => {
          if (!active) return;
          const next = writeIntakeDraft(localStorage, form.getValues(), revision.current, crypto.randomUUID(), new Date().toISOString());
          revision.current = next.revision; setSavedAt(next.savedAt); setStatus('saved');
        });
      } catch (error) { if (active) { setEnabled(false); setStatus(error instanceof Error && error.message === 'conflict' ? 'conflict' : 'error'); try { setStored(readIntakeDraft(localStorage)); } catch { /* Current in-memory text remains available. */ } } }
    };
    const timer = window.setTimeout(save, 350);
    const flush = () => { if (document.visibilityState === 'hidden') { clearTimeout(timer); void save(); } };
    document.addEventListener('visibilitychange', flush);
    return () => { active = false; clearTimeout(timer); document.removeEventListener('visibilitychange', flush); };
  }, [enabled, values, form]);
  const exportDraft = () => {
    const file = new Blob([JSON.stringify({ schema: 1, data: recoverableDraft(form.getValues()) }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(file); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'SADU-sample-artist-draft.json'; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="intake-backup" hidden={!visible} aria-label={t('Draft recovery', 'استعادة المسودة')}>
    <div><strong role="status">{status === 'saving' ? t('Saving to this device…', 'جارٍ الحفظ على هذا الجهاز…') : status === 'saved' ? t('Saved on this device at ', 'حُفظ على هذا الجهاز في ') + new Date(savedAt).toLocaleTimeString(isAr ? 'ar-AE' : 'en-GB') : status === 'error' ? t('Device save unavailable. Keep this page open or export your text.', 'الحفظ على الجهاز غير متاح. أبقِ الصفحة مفتوحة أو صدّر النص.') : status === 'conflict' ? t('Another tab changed the saved draft. Saving paused.', 'غيّرت علامة تبويب أخرى المسودة المحفوظة. توقف الحفظ.') : t('Draft in this session', 'مسودة في هذه الجلسة')}</strong>
      <p className="lr-small">{t('Optional backup of sample profile and proposal text. Contact details, file contents and submission receipts are excluded. Nothing syncs to a server. Do not enter real personal data.', 'نسخة اختيارية لنص الملف والمقترح التجريبيين. لا تشمل بيانات التواصل أو محتويات الملفات أو إيصالات التقديم. لا مزامنة مع خادم. لا تدخل بيانات شخصية حقيقية.')}</p>
    </div>
    <div className="lr-actions">
      {stored ? <button type="button" onClick={() => { form.reset(stored.data); revision.current = stored.revision; setSavedAt(stored.savedAt); setStored(null); setEnabled(true); }}>{t('Restore saved text', 'استعادة النص المحفوظ')}</button> : <button type="button" disabled={status === 'error' || status === 'conflict'} onClick={() => { setEnabled(v => !v); if (enabled) setStatus('session'); }}>{enabled ? t('Pause device backup', 'إيقاف النسخ على الجهاز') : t('Enable device backup', 'تفعيل النسخ على الجهاز')}</button>}
      <button type="button" onClick={exportDraft}>{t('Export draft text', 'تصدير نص المسودة')}</button>
    </div>
    {stored && <p className="lr-small">{t('A saved draft is available. Restoring replaces the current form text; export it first if needed. Re-enter contacts and reselect files after recovery.', 'توجد مسودة محفوظة. تحل الاستعادة محل النص الحالي؛ صدّره أولاً عند الحاجة. أعد إدخال بيانات التواصل واختيار الملفات بعد الاستعادة.')}</p>}
  </section>;
}
