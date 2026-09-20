import { useEffect, useRef, useState } from 'react';
import { useArtistIntake } from '../context/ArtistIntakeContext';
import { useI18n } from '../context/I18nContext';
import { selectIntakeWorkflow, type DeliveryAsset } from '../data/intakeWorkflow';
import type { DemoActor } from '../data/livingRecord';
import { IntakeDossier } from './ArtistIntake';

export function ProposalSelection() {
  const { workflow, activate } = useArtistIntake();
  const { isAr } = useI18n(); const t = (en: string, ar: string) => isAr ? ar : en;
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const checked = workflow.submissions.filter(s => s.status === 'checked');
  return <section className="lr-panel artist-intake" aria-label={t('Sample selection queue', 'قائمة الاختيار التجريبي')}>
    <h2>{t('Selection simulation · reviewed proposal versions', 'محاكاة الاختيار · إصدارات المقترحات المراجعة')}</h2>
    <p>{t('A separate sample selection step creates one delivery record for this proposal version. This is not institutional selection, spending approval or delegated authority.', 'تنشئ خطوة اختيار تجريبية مستقلة سجل تنفيذ واحداً لإصدار المقترح. لا يمثل ذلك اختياراً مؤسسياً أو موافقة مالية أو صلاحية مفوّضة.')}</p>
    {!checked.length && <p>{t('No completeness-checked proposals yet.', 'لا توجد مقترحات رُوجع اكتمالها بعد.')}</p>}
    {checked.map(s => { const asset = workflow.deliveries.find(d => d.proposalId === s.id); return <details key={s.id} className="intake-review-item">
      <summary><bdi>{s.id}</bdi> · {asset ? t('Selected and activated · simulation', 'اختير وفُعّل · محاكاة') : t('Ready for sample selection review', 'جاهز لمراجعة الاختيار التجريبية')}</summary>
      <IntakeDossier draft={s.snapshot} programmeId={s.programmeId} assets={s.assets}/>
      {asset ? <p role="status"><bdi>{asset.id} · {asset.activatedBy} · {asset.activatedAt}</bdi></p> : <>
        <label className="lr-checkbox"><input type="checkbox" checked={confirmed[s.id] ?? false} onChange={e => setConfirmed(prev => ({ ...prev, [s.id]: e.target.checked }))}/>{t('I reviewed this version for a simulated selection only.', 'راجعت هذا الإصدار لاختيار تجريبي فقط.')}</label>
        <button className="lr-primary" disabled={!confirmed[s.id]} onClick={() => activate(s.id, confirmed[s.id])}>{t('Simulate selection & create delivery', 'محاكاة الاختيار وإنشاء سجل التنفيذ')}</button>
      </>}
    </details>; })}
  </section>;
}

function DeliveryCard({ asset, actor }: { asset: DeliveryAsset; actor: DemoActor }) {
  const { actOnDelivery } = useArtistIntake(); const { isAr } = useI18n();
  const t = (en: string, ar: string) => isAr ? ar : en;
  const [identity, setIdentity] = useState(''); const [seal, setSeal] = useState(false);
  const [outcome, setOutcome] = useState<'clear' | 'issue'>('clear');
  const [reviewVersion, setReviewVersion] = useState<number | null>(null); const [acknowledged, setAcknowledged] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const record = asset.record;
  const canAccept = !record.acceptance && !!record.receipt && !record.receiptIssue && record.condition?.outcome === 'clear';
  const envelope = () => ({ actor, at: new Date().toISOString() });
  useEffect(() => { if (reviewVersion !== null) dialog.current?.showModal(); else dialog.current?.close(); }, [reviewVersion]);
  const reviewedReport = record.conditionHistory.find(c => c.version === reviewVersion);
  const status = record.acceptance ? t('Handover acknowledged', 'تم تأكيد التسليم') : record.receiptIssue ? t('Identity or seal mismatch', 'عدم تطابق الهوية أو الختم') : !record.receipt ? t('Awaiting arrival', 'بانتظار الوصول') : !record.condition ? t('Awaiting condition evidence', 'بانتظار أدلة الحالة') : record.condition.outcome === 'issue' ? t('Condition exception · on hold', 'استثناء في الحالة · معلق') : t('Awaiting manager handover review', 'بانتظار مراجعة المدير للتسليم');
  return <article className="lr-panel" data-testid="proposal-delivery">
    <h3>{isAr ? asset.titleAr || asset.titleEn : asset.titleEn || asset.titleAr}</h3>
    <p>{isAr ? asset.programmeAr : asset.programmeEn}</p>
    <p className="lr-small"><bdi>{asset.id}</bdi><br/><bdi>{asset.artistId} · {asset.proposalId} · v{asset.proposalVersion}</bdi></p>
    <p role="status" className={record.acceptance ? 'lr-confirmed' : 'lr-status'}>{status}</p>
    {actor === 'LOGISTICS' && !record.receipt && <form className="lr-form" onSubmit={e => { e.preventDefault(); actOnDelivery(asset.id, { type: 'RECEIVE', ...envelope(), crateId: identity, sealMatches: seal }); }}>
      <label>{t('Expected asset identity', 'هوية الأصل المتوقعة')}<input dir="ltr" value={identity} onChange={e => setIdentity(e.target.value)} required autoComplete="off"/></label>
      <label className="lr-checkbox"><input type="checkbox" checked={seal} onChange={e => setSeal(e.target.checked)}/>{t('Identity and seal checked against this sample record', 'رُوجعت الهوية والختم وفق هذا السجل التجريبي')}</label>
      <button className="lr-primary">{t('Record linked arrival', 'تسجيل الوصول المرتبط')}</button>
    </form>}
    {actor === 'TECHNICAL' && !record.acceptance && <div className="lr-form">
      <label>{t('Linked condition outcome', 'نتيجة الحالة المرتبطة')}<select value={outcome} onChange={e => setOutcome(e.target.value as 'clear' | 'issue')}><option value="clear">{t('No discrepancy in sample', 'لا اختلاف في العينة')}</option><option value="issue">{t('Exception · stop handover', 'استثناء · إيقاف التسليم')}</option></select></label>
      <button className="lr-primary" disabled={!record.receipt || record.receiptIssue} onClick={() => actOnDelivery(asset.id, { type: 'CONDITION', ...envelope(), outcome })}>{t('Record linked condition evidence', 'تسجيل أدلة الحالة المرتبطة')}</button>
    </div>}
    {record.condition && <details><summary>{t('View linked condition evidence', 'عرض أدلة الحالة المرتبطة')} · <bdi>{record.condition.id}/v{record.condition.version}</bdi></summary><p>{t('Generated scenario evidence; no real inspection or file upload.', 'أدلة منشأة للسيناريو؛ لا فحص فعلي ولا رفع ملفات.')}</p>{record.conditionHistory.map(c => <p key={c.version}><bdi>{c.id}/v{c.version} · DEMO-{c.actor} · {c.at}</bdi> · {c.outcome === 'clear' ? t('No discrepancy reported', 'لا اختلاف مسجل') : t('Exception reported', 'استثناء مسجل')}</p>)}</details>}
    {actor === 'MANAGER' && !record.acceptance && <button className="lr-primary" disabled={!canAccept} onClick={() => { setAcknowledged(false); setReviewVersion(record.condition!.version); }}>{t('Review linked handover', 'مراجعة التسليم المرتبط')}</button>}
    {record.acceptance && <p className="lr-small"><bdi>DEMO-MANAGER · {record.acceptance.at} · {record.acceptance.reportId}/v{record.acceptance.reportVersion}</bdi></p>}
    <details className="lr-log"><summary>{t('Linked session history', 'سجل الجلسة المرتبط')}</summary><p><bdi>DEMO-SELECTION · {asset.activatedAt} · {asset.proposalId}</bdi></p>{record.events.map(e => <p key={e.id}><bdi>{e.kind} · DEMO-{e.actor} · {e.at} · {e.reference}</bdi></p>)}</details>
    <dialog ref={dialog} className="lr-dialog" aria-labelledby={`review-${asset.id}`} onCancel={() => setReviewVersion(null)} onClose={() => setReviewVersion(null)}>
      <button autoFocus onClick={() => setReviewVersion(null)}>{t('Close linked dossier', 'إغلاق الملف المرتبط')}</button>
      <h2 id={`review-${asset.id}`}>{t('Review linked handover', 'مراجعة التسليم المرتبط')}</h2>
      <p>{isAr ? asset.titleAr : asset.titleEn}</p><p><bdi>{asset.id} · {asset.proposalId}</bdi></p>
      <p><bdi>{reviewedReport?.id}/v{reviewVersion} · {reviewedReport?.at}</bdi></p>
      <p>{t('Sample condition outcome: no discrepancy. This records a session acknowledgement, not a digital signature or legal custody.', 'نتيجة الحالة التجريبية: لا اختلاف. يسجل هذا تأكيداً للجلسة، وليس توقيعاً رقمياً أو حيازة قانونية.')}</p>
      <label className="lr-checkbox"><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)}/>{t('I reviewed this exact sample evidence version.', 'راجعت هذا الإصدار المحدد من الأدلة التجريبية.')}</label>
      <button className="lr-primary" disabled={!acknowledged || !canAccept || reviewVersion !== record.condition?.version || actor !== 'MANAGER'} onClick={() => { actOnDelivery(asset.id, { type: 'ACCEPT', ...envelope(), reportVersion: reviewVersion!, acknowledged }); setReviewVersion(null); }}>{t('Record linked handover acknowledgement', 'تسجيل تأكيد التسليم المرتبط')}</button>
    </dialog>
  </article>;
}

export function ProposalDeliveries({ actor }: { actor: DemoActor }) {
  const { workflow } = useArtistIntake(); const { isAr, formatNumber } = useI18n();
  const t = (en: string, ar: string) => isAr ? ar : en;
  const [filter, setFilter] = useState('');
  const metrics = selectIntakeWorkflow(workflow, filter || undefined);
  const programmeIds = [...new Set(workflow.deliveries.map(d => d.programmeId))];
  const oversight = actor === 'CHAIRMAN' || actor === 'DIRECTORATE';
  return <section className="lr-panel" aria-label={t('Proposal-linked delivery overview', 'متابعة التنفيذ المرتبط بالمقترحات')}>
    <h2>{t('Proposal-linked delivery', 'التنفيذ المرتبط بالمقترحات')}</h2>
    <p className="lr-small">{t('Session-only selected proposals. Counts cover linked delivery acknowledgements, not full programme readiness. Prepared demonstration cases below are separate.', 'مقترحات مختارة لهذه الجلسة فقط. تشمل الأعداد تأكيدات التسليم المرتبطة، ولا تمثل جاهزية البرنامج الكاملة. الحالات التجريبية المعدة أدناه مستقلة.')}</p>
    <label className="intake-field">{t('Linked programme scope', 'نطاق البرنامج المرتبط')}<select value={filter} onChange={e => setFilter(e.target.value)}><option value="">{t('All activated sample programmes', 'كل البرامج التجريبية المفعّلة')}</option>{programmeIds.map(id => { const p = workflow.deliveries.find(d => d.programmeId === id)!; return <option key={id} value={id}>{isAr ? p.programmeAr : p.programmeEn}</option>; })}</select></label>
    <p role="status" data-testid="linked-totals">{t('Linked handovers', 'التسليمات المرتبطة')}: {formatNumber(metrics.accepted)} / {formatNumber(metrics.total)} · {t('Pending', 'قيد الانتظار')}: {formatNumber(metrics.pending)}</p>
    {!metrics.total && <p>{t('No selected proposal has been activated in this scope.', 'لم يُفعّل مقترح مختار في هذا النطاق.')}</p>}
    {oversight ? <ul>{metrics.assets.map(d => <li key={d.id}>{isAr ? d.programmeAr : d.programmeEn} · <bdi>{d.id}</bdi> · {d.record.acceptance ? t('Delivery acknowledged', 'تم تأكيد التسليم') : !d.record.receipt ? t('Next responsible role: Logistics', 'الدور المسؤول التالي: اللوجستيات') : d.record.condition?.outcome !== 'clear' ? t('Next responsible role: Technical', 'الدور المسؤول التالي: الفريق الفني') : t('Next responsible role: Exhibition manager', 'الدور المسؤول التالي: مدير المعارض')}</li>)}</ul> : metrics.assets.map(asset => <DeliveryCard key={asset.id} asset={asset} actor={actor}/>)}
  </section>;
}
