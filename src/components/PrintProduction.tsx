import { useState } from 'react';
import { useLivingRecord } from '../context/LivingRecordContext';
import { useI18n } from '../context/I18nContext';
import type { DemoActor } from '../data/livingRecord';
import { selectPublishingRecord } from '../data/publishingRecord';

/** Attributed recording of supplier evidence, never impersonation of the supplier. */
export function PrintProduction({ actor }: { actor: DemoActor }) {
  const { state, dispatch } = useLivingRecord();
  const { isAr } = useI18n();
  const t = (en: string, ar: string) => isAr ? ar : en;
  const p = state.publishing;
  const { stage, reference } = selectPublishingRecord(p);
  const [evidence, setEvidence] = useState('');
  const [reason, setReason] = useState('');
  const [stop, setStop] = useState('');
  if (!p.version) return null;
  const envelope = () => ({ actor, version: p.version, at: new Date().toISOString() });
  const tasks = {
    drafting: ['Coordinator: attach proof', 'المنسقة: إرفاق البروفة'],
    'manager-review': ['Publishing manager: check the corrected proof', 'مدير النشر: مراجعة البروفة المصححة'],
    'executive-review': ['Chairman: decide on this revision', 'رئيس الدائرة: اتخاذ القرار لهذا الإصدار'],
    released: ['Publishing manager: record handoff to supplier', 'مدير النشر: تسجيل التسليم للمورد'],
    returned: ['Coordinator: prepare a corrected revision', 'المنسقة: إعداد إصدار مصحح'],
    sent: ['Publishing manager: record supplier acknowledgment', 'مدير النشر: تسجيل تأكيد المورد'],
    acknowledged: ['Publishing manager: record printing start', 'مدير النشر: تسجيل بدء الطباعة'],
    printing: ['Publishing manager: record completion or correction', 'مدير النشر: تسجيل الاكتمال أو التصحيح'],
    completed: ['Complete. A later defect opens a correction.', 'مكتمل. يُفتح تصحيح عند ظهور عيب لاحق.'],
    correction: ['Coordinator: attach corrected proof; approval must restart', 'المنسقة: إرفاق البروفة المصححة وإعادة الاعتماد'],
  };
  return <section aria-label={t('Print production handoff', 'تسليم تنفيذ الطباعة')}>
    <p role="status"><strong>{t('Next action: ', 'الخطوة التالية: ')}{tasks[stage][isAr ? 1 : 0]}</strong></p>
    <p className="lr-small">{reference} · {t('Session simulation. Supplier evidence is recorded by the publishing manager; no message or print order is sent.', 'محاكاة للجلسة. يسجل مدير النشر أدلة المورد؛ لا تُرسل رسائل أو أوامر طباعة.')}</p>
    {actor === 'PUBLISHING_MANAGER' && (stage === 'sent' || stage === 'printing') && <form onSubmit={e => { e.preventDefault(); dispatch({ type: stage === 'sent' ? 'ACKNOWLEDGE_PRINT_PROOF' : 'COMPLETE_PRINT', ...envelope(), reference: evidence }); }}>
      <label>{stage === 'sent' ? t('Supplier confirmation reference naming this revision', 'مرجع تأكيد المورد الذي يحدد هذا الإصدار') : t('Completion / quality-check evidence reference', 'مرجع دليل الاكتمال وفحص الجودة')}<input required maxLength={240} value={evidence} onChange={e => setEvidence(e.target.value)}/></label>
      <div className="lr-actions"><button className="lr-primary" disabled={!evidence.trim()}>{stage === 'sent' ? t('Record acknowledgment of this revision', 'تسجيل تأكيد هذا الإصدار') : t('Record printing completed', 'تسجيل اكتمال الطباعة')}</button></div>
    </form>}
    {actor === 'PUBLISHING_MANAGER' && stage === 'acknowledged' && <button className="lr-primary" onClick={() => dispatch({ type: 'START_PRINT', ...envelope() })}>{t('Record printing started', 'تسجيل بدء الطباعة')}</button>}
    {p.supplierAck && <p className="lr-small">{t('Supplier evidence: ', 'دليل المورد: ')}{p.supplierAck.reference} · v{p.supplierAck.version}</p>}
    {p.correction && <p role="status">{p.correction.reason} · {p.correction.stopReference}</p>}
    {['COORDINATOR', 'PUBLISHING_MANAGER'].includes(actor) && !p.correction && <details><summary>{t('Something needs correcting', 'يلزم تصحيح')}</summary>
      <form onSubmit={e => { e.preventDefault(); dispatch({ type: 'REQUEST_PRINT_CORRECTION', ...envelope(), reason, stopReference: stop }); }}>
        <label>{t('What must change?', 'ما المطلوب تغييره؟')}<textarea required maxLength={500} value={reason} onChange={e => setReason(e.target.value)}/></label>
        {p.dispatch && <label>{t('Supplier stop/recall confirmation or completed-stock disposition reference', 'مرجع تأكيد الإيقاف أو الاسترجاع من المورد أو معالجة النسخ المكتملة')}<input required maxLength={240} value={stop} onChange={e => setStop(e.target.value)}/></label>}
        <p className="lr-small">{t('Record how the old job was handled before replacing it. SADU cannot stop a physical press or recall downloaded copies.', 'سجل معالجة المهمة السابقة قبل استبدالها. لا يستطيع سدو إيقاف المطبعة أو استرجاع النسخ المنزلة.')}</p>
        <button disabled={!reason.trim() || Boolean(p.dispatch && !stop.trim())}>{t('Open correction & block this release', 'فتح تصحيح وإيقاف هذا الإذن')}</button>
      </form>
    </details>}
    {p.previous.length > 0 && <details><summary>{t('Preserved earlier revisions', 'الإصدارات السابقة المحفوظة')} ({p.previous.length})</summary><ul>{p.previous.map(old => <li key={old.version}>v{old.version} · {old.decision?.outcome ?? '—'} · {old.supplierAck?.reference ?? '—'} · {old.production?.completedAt ?? old.production?.at ?? '—'} · {old.correction?.reason ?? '—'} · {old.correction?.stopReference ?? '—'}</li>)}</ul></details>}
  </section>;
}
