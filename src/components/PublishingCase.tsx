import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { useLivingRecord } from '../context/LivingRecordContext';
import { PRINT_ROUTE_ID, selectPublishingRecord } from '../data/publishingRecord';
import type { DemoActor } from '../data/livingRecord';

export const printStages = {
  drafting: ['Drafting · demo', 'إعداد المسودة · تجريبي'],
  'manager-review': ['Manager review · demo', 'مراجعة المدير · تجريبي'],
  'executive-review': ['Executive review · demo', 'مراجعة تنفيذية · تجريبي'],
  released: ['Print release recorded · demo', 'سُجل إذن الطباعة · تجريبي'],
  returned: ['Returned for revision · demo', 'أعيد للتعديل · تجريبي'],
  sent: ['Sent to print · demo', 'أُرسل للطباعة · تجريبي'],
} as const;

export function PublishingCase({ actor }: { actor: DemoActor }) {
  const { state, dispatch } = useLivingRecord();
  const { isAr, formatNumber } = useI18n();
  const t = (en: string, ar: string) => isAr ? ar : en;
  const publishing = state.publishing;
  const summary = selectPublishingRecord(publishing);
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState(0);
  const [editorialChecked, setEditorialChecked] = useState(false);
  const [rightsChecked, setRightsChecked] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const envelope = () => ({ actor, at: new Date().toISOString() });
  const stale = version !== publishing.version;
  const openReview = () => { setVersion(publishing.version); setEditorialChecked(false); setRightsChecked(false); setAcknowledged(false); setOpen(true); };
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  useEffect(() => { setOpen(false); }, [actor]);
  const decide = (outcome: 'release' | 'return') => {
    dispatch({ type: 'DECIDE_PRINT_PROOF', ...envelope(), version, acknowledged, outcome });
    setOpen(false);
  };
  return <div className="lr-print-case">
    <h3>{t('SDC cultural bulletin — fictional issue', 'نشرة ثقافية للدائرة — عدد افتراضي')}</h3>
    <p className="lr-small">{t('Separate demonstration; not an issue of the seven magazines.', 'تجربة مستقلة؛ ليست عدداً من المجلات السبع.')}</p>
    <span className={`lr-status ${summary.stage === 'released' || summary.stage === 'sent' ? 'is-clear' : ''}`} data-testid="publishing-stage">{printStages[summary.stage][isAr ? 1 : 0]}</span>
    {publishing.version ? <p className="lr-small"><bdi>{summary.reference}</bdi> · {t('Source: prepared sample proof', 'المصدر: بروفة تجريبية معدة مسبقاً')}</p> : null}
    {actor === 'COORDINATOR' ? <div className="lr-actions"><button className="lr-primary" disabled={Boolean(publishing.dispatch)} onClick={() => dispatch({ type: 'ATTACH_PRINT_PROOF', ...envelope() })}>{publishing.version ? t('Attach revised sample proof', 'إرفاق بروفة تجريبية معدلة') : t('Attach prepared sample proof', 'إرفاق البروفة التجريبية المعدة')}</button><p className="lr-small">{t('A new version clears the current review and decision; prior events remain in history.', 'يلغي الإصدار الجديد سريان المراجعة والقرار الحاليين؛ وتبقى الأحداث السابقة في السجل.')}</p></div> : null}
    {actor === 'PUBLISHING_MANAGER' ? <div className="lr-actions">
      <button className="lr-primary" disabled={!publishing.version || Boolean(publishing.review)} onClick={openReview}>{t('Review proof and route', 'مراجعة البروفة وإحالتها')}</button>
      <button disabled={publishing.decision?.outcome !== 'release' || Boolean(publishing.dispatch)} onClick={() => dispatch({ type: 'RECORD_PRINT_DISPATCH', ...envelope(), version: publishing.version })}>{t('Record sample print dispatch', 'تسجيل إرسال تجريبي للطباعة')}</button>
    </div> : null}
    {actor === 'CHAIRMAN' && summary.queued ? <button className="lr-link" onClick={openReview}>{t('Review print-release brief', 'مراجعة موجز إذن الطباعة')}</button> : null}
    {publishing.decision ? <p className="lr-small" data-testid="print-decision">{t('Demo decision by ', 'قرار تجريبي من ')}<bdi>DEMO-{publishing.decision.actor}</bdi> · <bdi>v{publishing.decision.version}</bdi> · {new Date(publishing.decision.at).toLocaleString(isAr ? 'ar-AE' : 'en-GB', { timeZone: 'Asia/Dubai' })}</p> : null}
    {actor !== 'CHAIRMAN' ? <p className="lr-small">{t('A proof attachment updates the publishing record. Manager checks and a proposed routing reference are required before executive review.', 'يحدّث إرفاق البروفة سجل النشر. وتلزم مراجعات المدير ومرجع إحالة مقترح قبل المراجعة التنفيذية.')}</p> : null}
    <dialog ref={dialog} className="lr-dialog" aria-labelledby="print-dialog-title" onCancel={() => setOpen(false)} onClose={() => setOpen(false)}>
      <div className="lr-dialog-top"><p className="lr-eyebrow">{t('DEMONSTRATION REVIEW', 'مراجعة تجريبية')}</p><button autoFocus onClick={() => setOpen(false)}>{t('Close review', 'إغلاق المراجعة')}</button></div>
      <h2 id="print-dialog-title">{t('Print-release brief', 'موجز إذن الطباعة')}</h2>
      <p>{t('SDC cultural bulletin — fictional issue', 'نشرة ثقافية للدائرة — عدد افتراضي')} · <bdi>DEMO-PUB-01/v{version}</bdi></p>
      <div className="lr-dossier-evidence">
        <p><a href={`/demo/print-proof.html?version=${version}`} target="_blank" rel="noreferrer">{t('Open prepared bilingual proof', 'فتح البروفة التجريبية ثنائية اللغة')}</a></p>
        <p>{t('Prepared sample text and credits; no real authors, articles or print order.', 'نص وبيانات نسب تجريبية؛ لا كتّاب أو مقالات أو أمر طباعة فعلي.')}</p>
        <p>{t('Proposed review route: ', 'مسار مراجعة مقترح: ')}<bdi>{PRINT_ROUTE_ID}</bdi></p>
        <p>{t('This route demonstrates a possible Chairman review. It is not a verified delegation and does not apply to all publications.', 'يوضح هذا المسار مراجعة محتملة من رئيس الدائرة. وليس تفويضاً موثقاً ولا يسري على جميع الإصدارات.')}</p>
        {publishing.review ? <p>{t('Manager checks recorded for version ', 'سُجلت مراجعات المدير للإصدار ')}{formatNumber(publishing.review.version)} · <bdi>DEMO-PUBLISHING_MANAGER</bdi></p> : null}
      </div>
      {stale ? <p role="alert">{t('The proof changed. Close this brief and review the current version.', 'تغيرت البروفة. أغلق هذا الموجز وراجع الإصدار الحالي.')}</p> : null}
      {actor === 'PUBLISHING_MANAGER' ? <>
        <label className="lr-checkbox"><input type="checkbox" checked={editorialChecked} onChange={e => setEditorialChecked(e.target.checked)}/>{t('I reviewed the sample Arabic and English proof and its version.', 'راجعت البروفة العربية والإنجليزية التجريبية وإصدارها.')}</label>
        <label className="lr-checkbox"><input type="checkbox" checked={rightsChecked} onChange={e => setRightsChecked(e.target.checked)}/>{t('I checked the sample credits and rights note for this demonstration.', 'تحققت من بيانات النسب وملاحظة الحقوق التجريبية لهذا العرض.')}</label>
        <div className="lr-actions"><button className="lr-primary" disabled={stale || !editorialChecked || !rightsChecked || Boolean(publishing.review)} onClick={() => { dispatch({ type: 'ROUTE_PRINT_PROOF', ...envelope(), version, editorialChecked, rightsChecked, route: PRINT_ROUTE_ID }); setOpen(false); }}>{t('Route for executive review (Demo)', 'إحالة للمراجعة التنفيذية (تجريبي)')}</button></div>
      </> : actor === 'CHAIRMAN' ? <>
        <label className="lr-checkbox"><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)}/>{t('I reviewed this version and the sample checks. My decision is recorded for demonstration only.', 'راجعت هذا الإصدار والتحققات التجريبية. يُسجل قراري لأغراض العرض فقط.')}</label>
        <div className="lr-actions"><button disabled={stale || !acknowledged || !summary.queued} onClick={() => decide('return')}>{t('Return for revision (Demo)', 'إعادة للتعديل (تجريبي)')}</button><button className="lr-primary" disabled={stale || !acknowledged || !summary.queued} onClick={() => decide('release')}>{t('Record print release (Demo)', 'تسجيل إذن الطباعة (تجريبي)')}</button></div>
      </> : null}
      <p className="lr-small">{t('Session record only. No digital signature, legal authorization, payment or printer dispatch occurs here.', 'سجل للجلسة فقط. لا يحدث هنا توقيع رقمي أو تفويض قانوني أو دفع أو إرسال إلى المطبعة.')}</p>
    </dialog>
  </div>;
}
