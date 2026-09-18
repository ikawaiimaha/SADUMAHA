import { ArrowRight, Check, Circle } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useLivingRecord } from '../context/LivingRecordContext';
import { CASE_ID, selectLivingRecord } from '../data/livingRecord';

export function StoryCaseGraphic({ chapter }: { chapter: number }) {
  const { isAr, formatNumber } = useI18n();
  const { state } = useLivingRecord();
  const metrics = selectLivingRecord(state);
  const t = (en: string, ar: string) => isAr ? ar : en;
  return <div className="story-case-graphic">
    <p className="story-case-eyebrow">{t('SHARED DEMONSTRATION RECORD', 'السجل التجريبي المشترك')}</p>
    <strong>{chapter === 7 ? t('SDC internal operations', 'العمليات الداخلية لدائرة الثقافة') : t('Mounir Fatmi · Crate 4', 'منير فاطمي · الصندوق ٤')}</strong><bdi>{chapter === 7 ? `${CASE_ID} · DEMO-PUB-01` : CASE_ID}</bdi>
    {chapter === 7 ? <div className="story-case-metrics">
      <div><strong>{metrics.custodyReady ? t('Clear', 'مكتمل') : t('Pending', 'معلق')}</strong><span>{t('Sample delivery', 'التسليم التجريبي')}</span></div>
      <div><strong>{formatNumber(metrics.evidencePercent)}%</strong><span>{t('Evidence present', 'اكتمال الأدلة')}</span></div>
      <div><strong>{formatNumber(metrics.executiveQueue)}</strong><span>{t('Executive reviews', 'مراجعات تنفيذية')}</span></div>
    </div> : <ol className="story-case-flow">
      {[
        { en: 'Logistics', ar: 'اللوجستيات', actionEn: 'Record arrival', actionAr: 'تسجيل الوصول', done: Boolean(state.receipt), active: chapter === 4 },
        { en: 'Technical', ar: 'الفريق الفني', actionEn: 'Attach condition evidence', actionAr: 'إرفاق أدلة الحالة', done: Boolean(state.condition), active: chapter === 5 },
        { en: 'Exhibition manager', ar: 'مدير المعارض', actionEn: 'Review & acknowledge handover', actionAr: 'مراجعة التسليم وتأكيده', done: Boolean(state.acceptance), active: chapter === 6 },
      ].map((step, i) => <li key={step.en} className={step.active ? 'is-active' : ''}><div>{step.done ? <Check/> : <Circle/>}<strong>{t(step.en, step.ar)}</strong><span>{t(step.actionEn, step.actionAr)}</span></div>{i < 2 && <ArrowRight className="story-case-arrow" aria-hidden="true"/>}</li>)}
    </ol>}
    <p className="story-case-note">{t('Current session state · fictional records · no official approvals', 'حالة الجلسة الحالية · سجلات افتراضية · لا اعتمادات رسمية')}</p>
  </div>;
}
