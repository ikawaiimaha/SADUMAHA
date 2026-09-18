import { useI18n } from '../context/I18nContext';
import { useLivingRecord } from '../context/LivingRecordContext';
import { SDC_MAGAZINES_SOURCE, SDC_STRUCTURE_SOURCE, selectChairmanBrief } from '../data/chairmanBrief';
import { selectLivingRecord } from '../data/livingRecord';
import { PublishingCase, printStages } from './PublishingCase';

interface Props { onDirectorate: () => void; onPublishing: () => void; onFinance: () => void }
export function ChairmanBrief({ onDirectorate, onPublishing, onFinance }: Props) {
  const { isAr, formatNumber } = useI18n();
  const { state } = useLivingRecord();
  const t = (en: string, ar: string) => isAr ? ar : en;
  const brief = selectChairmanBrief(state);
  const caseMetrics = selectLivingRecord(state);
  return <>
    <p className="lr-oversight-intro">{t('SDC internal operations: readiness across directorates, publication cycles, and decisions raised for executive review.', 'العمليات الداخلية لدائرة الثقافة: الجاهزية عبر الإدارات ودورات النشر والقرارات المرفوعة للمراجعة التنفيذية.')}</p>
    <div className="lr-brief lr-chairman-brief">
      <section className="lr-panel">
        <p className="lr-eyebrow">{t('01 · PROGRAMME READINESS', '٠١ · جاهزية البرامج')}</p>
        <h2>{t('Across SDC directorates', 'عبر إدارات دائرة الثقافة')}</h2>
        <ul className="lr-unit-matrix">{brief.units.map(unit => <li key={unit.id} data-unit={unit.id}>
          <strong>{t(unit.en, unit.ar)}</strong><span className="lr-small">{t(unit.examplesEn, unit.examplesAr)}</span>
          <span className={`lr-status ${unit.state === 'sample-cleared' ? 'is-clear' : unit.state === 'sample-risk' ? 'is-waiting' : ''}`}>{unit.state === 'sample-cleared' ? t('Sample exhibition: delivery cleared', 'المعرض التجريبي: اكتمل التسليم') : unit.state === 'sample-risk' ? t('Sample exhibition: delivery risk', 'المعرض التجريبي: مخاطر في التسليم') : unit.state === 'sample-publishing' ? printStages[brief.publishing.stage][isAr ? 1 : 0] : t('Awaiting directorate report', 'بانتظار تقرير الإدارة')}</span>
        </li>)}</ul>
        <p className="lr-small">{t('Examples identify SDC programmes. Only the separate fictional cases have connected status; clearing one delivery does not clear an entire festival or directorate.', 'تحدد الأمثلة برامج الدائرة. ترتبط الحالة بالتجارب الافتراضية المستقلة فقط؛ ولا يعني اكتمال تسليم واحد جاهزية المهرجان أو الإدارة بأكملها.')}</p>
        <button className="lr-link" onClick={onDirectorate}>{t('View Cultural Affairs oversight', 'عرض متابعة الشؤون الثقافية')}</button>
        <details className="lr-basis"><summary>{t('Sample exhibition evidence', 'أدلة المعرض التجريبي')}</summary><p data-testid="evidence-health">{formatNumber(caseMetrics.evidencePercent)}{isAr ? '٪' : '%'} · {t('Five required case records; presence is not compliance or opening authorization.', 'خمسة سجلات مطلوبة للحالة؛ وجودها ليس إثبات امتثال أو إذناً بالافتتاح.')}</p></details>
        <a className="lr-source-link" href={SDC_STRUCTURE_SOURCE} target="_blank" rel="noreferrer">{t('SDC department reference', 'مرجع إدارات الدائرة')}</a>
      </section>
      <section className="lr-panel">
        <p className="lr-eyebrow">{t('02 · PUBLISHING CYCLES', '٠٢ · دورات النشر')}</p>
        <h2>{t('Institutional publishing', 'النشر المؤسسي')}</h2>
        <p className="lr-small">{t('Seven monthly titles. Current issue dates and stages await a publishing report.', 'سبعة عناوين شهرية. تنتظر مواعيد الأعداد الحالية ومراحلها تقرير النشر.')}</p>
        <ul className="lr-magazine-grid">{brief.magazineCycles.map(magazine => <li key={magazine.id}><strong>{t(magazine.en, magazine.ar)}</strong><span>{t('Awaiting report', 'بانتظار التقرير')}</span></li>)}</ul>
        <a className="lr-source-link" href={SDC_MAGAZINES_SOURCE} target="_blank" rel="noreferrer">{t('Official magazine catalogue', 'دليل المجلات الرسمي')}</a>
        <div className="lr-print-summary"><h3>{t('Connected publishing example', 'مثال النشر المترابط')}</h3><p className="lr-small">{t('Fictional cultural bulletin · separate from the seven titles', 'نشرة ثقافية افتراضية · مستقلة عن العناوين السبعة')}</p><span className="lr-status" data-testid="chairman-publishing-stage">{printStages[brief.publishing.stage][isAr ? 1 : 0]}</span></div>
        <button className="lr-link" onClick={onPublishing}>{t('Open sample publishing pipeline', 'فتح مسار النشر التجريبي')}</button>
      </section>
      <section className="lr-panel">
        <p className="lr-eyebrow">{t('03 · EXECUTIVE REVIEW', '٠٣ · المراجعة التنفيذية')}</p>
        <h2>{t('SDC decision queue', 'قائمة قرارات الدائرة')}</h2>
        <p className="lr-metric" data-testid="escalations">{formatNumber(brief.executiveQueue)}</p>
        <p>{t('Items routed for executive review', 'بنود محالة للمراجعة التنفيذية')}</p>
        {!brief.executiveQueue ? <p className="lr-small">{t('No pending review. An attachment alone cannot enter this queue.', 'لا توجد مراجعة معلقة. لا يكفي إرفاق ملف لإدخاله في هذه القائمة.')}</p> : null}
        {brief.publishing.queued || state.publishing.decision ? <PublishingCase actor="CHAIRMAN"/> : null}
        {state.finance === 'escalated' ? <div className="lr-print-summary"><h3>{t('Finance exception · sample', 'استثناء مالي · تجريبي')}</h3><p className="lr-small">{t('Delegation validation required; signing unavailable.', 'يلزم التحقق من التفويض؛ التوقيع غير متاح.')}</p><button className="lr-link" onClick={onFinance}>{t('Review finance exception', 'مراجعة الاستثناء المالي')}</button></div> : null}
        <details className="lr-basis"><summary>{t('Authority and routing', 'الصلاحية ومسار الإحالة')}</summary><p>{t('Agreements, procurement, awards and publication releases each require their applicable route and delegation. No blanket Chairman signing power is inferred. This demo records sample decisions, not legal signatures or financial authorizations.', 'تتطلب الاتفاقيات والمشتريات والجوائز وإجازات النشر مسار الإحالة والتفويض الخاص بكل منها. لا يُفترض تفويض توقيع شامل لرئيس الدائرة. يسجل النموذج قرارات تجريبية، وليس توقيعات قانونية أو تفويضات مالية.')}</p></details>
      </section>
    </div>
  </>;
}
