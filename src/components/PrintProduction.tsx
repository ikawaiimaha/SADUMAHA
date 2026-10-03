import { useState } from 'react';
import { useLivingRecord } from '../context/LivingRecordContext';
import { useI18n } from '../context/I18nContext';
import type { DemoActor } from '../data/livingRecord';
import { selectPublishingRecord } from '../data/publishingRecord';
import type { SupplierEvidence } from '../data/publishingRecord';
import { NextActionCard } from './NextActionCard';

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
  const [source, setSource] = useState<SupplierEvidence['source']>('Email');
  const [sender, setSender] = useState('Demo print supplier');
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
    correction: p.dispatch && !p.correction?.stopReference ? ['Publishing manager: obtain supplier stop acknowledgment', 'مدير النشر: الحصول على تأكيد إيقاف المورد'] : ['Coordinator: attach corrected proof; approval must restart', 'المنسقة: إرفاق البروفة المصححة وإعادة الاعتماد'],
  };
  return <section aria-label={t('Print production handoff', 'تسليم تنفيذ الطباعة')}>
    <NextActionCard isAr={isAr} title={tasks[stage][isAr ? 1 : 0]} owner={['returned', 'drafting'].includes(stage) || (stage === 'correction' && (!p.dispatch || p.correction?.stopReference)) ? t('Coordinator', 'المنسقة') : stage === 'executive-review' ? t('Chairman', 'رئيس الدائرة') : t('Publishing manager', 'مدير النشر')} blocker={t('Only the current revision can advance. Captured correspondence is not executive approval.', 'لا ينتقل إلا الإصدار الحالي. المراسلات المسجلة ليست اعتماداً تنفيذياً.')} evidence={{ source: p.supplierAck ? `${p.supplierAck.evidence?.source ?? t('Channel not recorded', 'القناة غير مسجلة')} · ${p.supplierAck.reference}` : t('Prepared sample proof', 'بروفة تجريبية معدة'), sender: p.supplierAck?.evidence?.sender ?? t('Not recorded', 'غير مسجل'), receivedAt: p.supplierAck?.evidence?.receivedAt ?? t('Not recorded; recording time is separate', 'غير مسجل؛ وقت التسجيل منفصل'), revision: reference, recordedBy: p.supplierAck?.actor ?? p.proofs.at(-1)?.actor ?? '—', confirmation: p.supplierAck ? t('Acknowledgment recorded by manager; supplier identity is simulated', 'سجل المدير التأكيد؛ هوية المورد تجريبية') : t('Supplier acknowledgment not yet recorded', 'لم يسجل تأكيد المورد بعد') }}/>
    <p className="lr-small">{reference} · {t('Session simulation. Supplier evidence is recorded by the publishing manager; no message or print order is sent.', 'محاكاة للجلسة. يسجل مدير النشر أدلة المورد؛ لا تُرسل رسائل أو أوامر طباعة.')}</p>
    {actor === 'PUBLISHING_MANAGER' && (stage === 'sent' || stage === 'printing') && <form onSubmit={e => { e.preventDefault(); const stamp = envelope(); dispatch({ type: stage === 'sent' ? 'ACKNOWLEDGE_PRINT_PROOF' : 'COMPLETE_PRINT', ...stamp, reference: evidence, ...(stage === 'sent' ? { evidence: { source, sender, receivedAt: stamp.at } } : {}) }); }}>
      {stage === 'sent' && <><label>{t('Evidence channel', 'قناة الدليل')}<select value={source} onChange={e => setSource(e.target.value as SupplierEvidence['source'])}>{(['Email', 'WhatsApp', 'Portal', 'Verbal'] as const).map(c => <option key={c}>{c}</option>)}</select></label><label>{t('Sender / speaker · synthetic', 'المرسل / المتحدث · تجريبي')}<input required maxLength={100} value={sender} onChange={e => setSender(e.target.value)}/></label><p>{t('This prepared demo simulates receipt now. A voice transcription must be checked against its source before recording acknowledgment.', 'تحاكي هذه التجربة الاستلام الآن. يجب مراجعة تفريغ الصوت مع مصدره قبل تسجيل التأكيد.')}</p></>}
      <label>{stage === 'sent' ? t('Supplier confirmation reference naming this revision', 'مرجع تأكيد المورد الذي يحدد هذا الإصدار') : t('Completion / quality-check evidence reference', 'مرجع دليل الاكتمال وفحص الجودة')}<input required maxLength={240} value={evidence} onChange={e => setEvidence(e.target.value)}/></label>
      <div className="lr-actions"><button className="lr-primary" disabled={!evidence.trim()}>{stage === 'sent' ? t('Record acknowledgment of this revision', 'تسجيل تأكيد هذا الإصدار') : t('Record printing completed', 'تسجيل اكتمال الطباعة')}</button></div>
    </form>}
    {actor === 'PUBLISHING_MANAGER' && stage === 'acknowledged' && <button className="lr-primary" onClick={() => dispatch({ type: 'START_PRINT', ...envelope() })}>{t('Record printing started', 'تسجيل بدء الطباعة')}</button>}
    {p.supplierAck && <p className="lr-small">{t('Supplier evidence: ', 'دليل المورد: ')}{p.supplierAck.reference} · v{p.supplierAck.version}</p>}
    {p.correction && <><p role="status">{p.correction.reason} · {p.dispatch && !p.correction.stopReference ? t('Internal hold active. Supplier stop unconfirmed.', 'الإيقاف الداخلي سارٍ. لم يؤكد المورد الإيقاف.') : p.correction.stopReference}</p>{actor === 'PUBLISHING_MANAGER' && p.dispatch && !p.correction.stopReference && <form onSubmit={e => { e.preventDefault(); dispatch({ type: 'CONFIRM_PRINT_STOP', ...envelope(), reference: stop }); }}><label>{t('Supplier stop acknowledgment or completed-stock disposition reference', 'مرجع تأكيد إيقاف المورد أو معالجة النسخ المكتملة')}<input required maxLength={240} value={stop} onChange={e => setStop(e.target.value)}/></label><button>{t('Record supplier stop acknowledgment', 'تسجيل تأكيد إيقاف المورد')}</button></form>}</>}
    {['COORDINATOR', 'PUBLISHING_MANAGER'].includes(actor) && !p.correction && <details><summary>{t('Something needs correcting', 'يلزم تصحيح')}</summary>
      <form onSubmit={e => { e.preventDefault(); dispatch({ type: 'REQUEST_PRINT_CORRECTION', ...envelope(), reason, stopReference: stop }); }}>
        <label>{t('What must change?', 'ما المطلوب تغييره؟')}<textarea required maxLength={500} value={reason} onChange={e => setReason(e.target.value)}/></label>
        <p className="lr-small">{t('This immediately holds internal progression. Supplier stop acknowledgment is recorded separately before replacing a dispatched proof. No stop message is sent.', 'يوقف هذا الإجراء التقدم الداخلي فوراً. يُسجل تأكيد إيقاف المورد منفصلاً قبل استبدال البروفة المرسلة. لا تُرسل رسالة إيقاف.')}</p>
        <button disabled={!reason.trim()}>{t('Report defect & hold release', 'تسجيل العيب وإيقاف الإذن')}</button>
      </form>
    </details>}
    {p.previous.length > 0 && <details><summary>{t('Preserved earlier revisions', 'الإصدارات السابقة المحفوظة')} ({p.previous.length})</summary><ul>{p.previous.map(old => <li key={old.version}>v{old.version} · {old.decision?.outcome ?? '—'} · {old.supplierAck?.reference ?? '—'} · {old.production?.completedAt ?? old.production?.at ?? '—'} · {old.correction?.reason ?? '—'} · {old.correction?.stopReference ?? '—'}</li>)}</ul></details>}
  </section>;
}
