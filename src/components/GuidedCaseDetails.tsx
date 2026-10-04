import type { CollectionDemo } from '../data/collectionReadiness';
import { collectionReceipt, guidedCase } from '../data/guidedCase';

export function GuidedCaseReceipt({ record, ar }: { record: CollectionDemo; ar: boolean }) {
  const t = (a: string, e: string) => ar ? a : e;
  const r = collectionReceipt(record, ar);
  return <div className="guide-receipt">
    <p className="guide-label"><bdi>{r.id}</bdi> · {r.work} · {t('حالة تجريبية', 'Synthetic case')}</p>
    <h2>{r.status}</h2>
    <dl><div><dt>{t('المسؤول', 'Owner')}</dt><dd>{r.owner} · {r.acceptance}</dd></div>
      <div><dt>{t('موعد الاستلام · باريس', 'Pickup · Paris')}</dt><dd>{r.date}</dd></div>
      <div><dt>{t('دليل الإكمال', 'Completion evidence')}</dt><dd><bdi>{r.evidence}</bdi></dd></div>
      <div><dt>{t('الحجز والتسليم', 'Booking and handover')}</dt><dd>{t('النقل غير محجوز · لم يُسجل تسليم فعلي', 'Transport not booked · no physical handover recorded')}</dd></div></dl>
  </div>;
}

export function GuidedPackingEvidence({ record, ar }: { record: CollectionDemo; ar: boolean }) {
  const t = (a: string, e: string) => ar ? a : e;
  const r = collectionReceipt(record, ar);
  return <article className="guide-evidence">
    <p className="guide-label">{t('ورقة فحص توضيحية — معدّة للمحاكاة فقط', 'Illustrative check sheet — prepared for simulation only')}</p>
    <h3>{t('صندوق مخصص مع دعامات واقية', 'Custom crate with protective supports')}</h3>
    <div className="guide-evidence-layout">
      <svg viewBox="0 0 280 200" role="img" aria-label={t('رسم توضيحي لصندوق يحيط بلوحة ودعامات عند الزوايا، وليس صورة فحص', 'Schematic of a crate surrounding an artwork with corner supports; not an inspection photograph')}>
        <rect x="12" y="12" width="256" height="176" rx="4" fill="#d8bd94" stroke="#806747" strokeWidth="3"/>
        <rect x="36" y="34" width="208" height="132" fill="#f7f1e6" stroke="#806747" strokeWidth="2"/>
        <rect x="58" y="51" width="164" height="98" fill="#365e80"/>
        <path d="M58 128L105 77L158 135L195 60L222 98V149H58Z" fill="#9bb3c6"/>
        <path d="M40 62V38H66M214 38H240V62M40 138V162H66M214 162H240V138" fill="none" stroke="#ad9c7b" strokeWidth="14"/>
      </svg>
      <ul><li>{t('الصندوق مطابق للخطة التجريبية.', 'Crate matches the prepared plan.')}</li><li>{t('الدعامات تفصل سطح العمل عن الصندوق.', 'Supports separate the artwork surface from the crate.')}</li><li>{t('أُرفق مرجع مراجعة فنية وموافقة تكلفة منفصلة.', 'Technical review and separate cost approval references are attached.')}</li></ul>
    </div>
    <details><summary>{t('مصدر الورقة ومراجع المراجعة والتكلفة', 'Sheet source, review and cost references')}</summary><dl><div><dt>{t('المرجع', 'Reference')}</dt><dd><bdi>{guidedCase.evidence}</bdi></dd></div>
      <div><dt>{t('المصدر', 'Source')}</dt><dd>{t('سجل مقاول التغليف التجريبي — ليس مستنداً مستلماً', 'Prepared packing-contractor fixture — not a received document')}</dd></div>
      <div><dt>{t('مراجعة الخطة', 'Plan review')}</dt><dd><bdi>{record.packing?.technicalReference}</bdi></dd></div>
      <div><dt>{t('موافقة التكلفة فقط', 'Cost approval only')}</dt><dd>AED {record.packing?.amount.toLocaleString(ar ? 'ar-AE' : 'en-GB')} · <bdi>{record.packing?.costReference}</bdi></dd></div>
      <div><dt>{t('تأكيد الإكمال', 'Completion check')}</dt><dd>{r.recordedAt ? `${r.owner} · ${new Intl.DateTimeFormat(ar ? 'ar-AE' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dubai' }).format(new Date(r.recordedAt))} · ${t('دبي · النسخة', 'Dubai · revision')} ${r.recordedVersion}` : t('بانتظار تسجيل تحقق مسؤولة الاستلام', 'Awaiting the collection officer’s recorded check')}</dd></div></dl></details>
    <p className="guide-note">{t('الرسم وورقة الفحص توضيحيان. لم تُرفع صورة ميدانية ولا يمثل المثال اعتماد سلامة أو إذناً بالدفع.', 'The diagram and check sheet are illustrative. No field photograph was uploaded; this example is not a safety certification or payment authorization.')}</p>
  </article>;
}
