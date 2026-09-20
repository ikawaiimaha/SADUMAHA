import { useI18n } from '../context/I18nContext';
import { useLivingRecord } from '../context/LivingRecordContext';
import { SDC_MAGAZINES_SOURCE, SDC_STRUCTURE_SOURCE, selectChairmanBrief } from '../data/chairmanBrief';
import { selectLivingRecord } from '../data/livingRecord';
import { PublishingCase, printStages } from './PublishingCase';
import { selectReadinessOutlook } from '../data/readinessOutlook';
import { IntegrationReadiness } from './IntegrationReadiness';
import { ClaimProvenance } from './ClaimProvenance';

interface Props { onDirectorate: () => void; onPublishing: () => void; onFinance: () => void }
export function ChairmanBrief({ onDirectorate, onPublishing, onFinance }: Props) {
  const { isAr, formatNumber, localizeDigits } = useI18n();
  const { state } = useLivingRecord();
  const t = (en: string, ar: string) => isAr ? ar : en;
  const brief = selectChairmanBrief(state);
  const caseMetrics = selectLivingRecord(state);
  const outlook = selectReadinessOutlook(state);
  const deadline = outlook.caseDeadline?.due;
  const deadlineLabel = deadline ? new Intl.DateTimeFormat(isAr ? 'ar-AE-u-nu-arab' : 'en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${deadline}T00:00:00Z`)) : t('Not reported', 'غير مُبلّغ');
  return <>
    <IntegrationReadiness isAr={isAr}/>
    <p className="lr-oversight-intro">{t('SDC internal operations: readiness across directorates, publication cycles, and decisions raised for executive review.', 'العمليات الداخلية لدائرة الثقافة: الجاهزية عبر الإدارات ودورات النشر والقرارات المرفوعة للمراجعة التنفيذية.')}</p>
    <div className="lr-brief lr-chairman-brief">
      <section className="lr-panel">
        <p className="lr-eyebrow">{t('01 · PROGRAMME READINESS', '٠١ · جاهزية البرامج')}</p>
        <h2>{t('Readiness outlook', 'استشراف الجاهزية')}</h2>
        <p className="lr-small">{t('Rule-based demonstration · scenario date', 'عرض تجريبي بقواعد محددة · تاريخ السيناريو')} <bdi>{localizeDigits(outlook.asOf)}</bdi></p>
        <div className="lr-outlook" aria-live="polite" aria-atomic="true">
          <div><strong className="lr-metric" data-testid="upcoming-risks">{formatNumber(outlook.dueSoon.length)}</strong><span>{t('Unresolved delivery milestones due within 7 days', 'عدد مراحل التسليم غير المكتملة المستحقة خلال ٧ أيام')}</span></div>
          <p className="lr-status" data-testid="readiness-outlook">{state.acceptance ? t('Sample delivery dependency cleared', 'اكتمل متطلب التسليم التجريبي') : t('Manager follow-up needed before the milestone', 'تلزم متابعة المدير قبل موعد المرحلة')}</p>
          <p className="lr-small">{t('Installation milestone', 'مرحلة التركيب')} · {deadlineLabel}</p>
          <p className="lr-small">{formatNumber(outlook.awaitingReports)} · {t('Portfolio activities awaiting dated reports; no forecast assigned.', 'أنشطة ضمن محفظة البرامج تنتظر تقارير مؤرخة؛ لم تُسند إليها توقعات.')}</p>
        </div>
        <details className="lr-basis"><summary>{t('Outlook calculation', 'طريقة حساب الاستشراف')}</summary><p>{t('Flags a dated milestone when its manager handover is incomplete and its due date is within seven calendar days of the scenario date. The handover is the sample dependency; other opening requirements are outside this indicator. Unknown reports stay unknown. No AI model, probability, government target, funding instruction or opening approval is implied.', 'يُبرز المؤشر مرحلة ذات موعد محدد إذا لم يكتمل تسليم المدير وكان موعدها خلال سبعة أيام تقويمية من تاريخ السيناريو. التسليم هو المتطلب التجريبي، ولا يشمل المؤشر بقية متطلبات الافتتاح. تبقى التقارير غير المتاحة غير معلومة. لا يتضمن ذلك نموذج ذكاء اصطناعي أو احتمالاً أو هدفاً حكومياً أو توجيهاً للتمويل أو إذناً بالافتتاح.')}</p></details>
        <details className="lr-basis lr-unit-detail"><summary>{t('Across SDC directorates', 'عبر إدارات دائرة الثقافة')}</summary>
        <ul className="lr-unit-matrix">{brief.units.map(unit => <li key={unit.id} data-unit={unit.id}>
          <strong>{t(unit.en, unit.ar)}</strong><span className="lr-small">{t(unit.examplesEn, unit.examplesAr)}</span>
          <span className={`lr-status ${unit.state === 'sample-cleared' ? 'is-clear' : unit.state === 'sample-risk' ? 'is-waiting' : ''}`}>{unit.state === 'sample-cleared' ? t('Sample exhibition: delivery cleared', 'المعرض التجريبي: اكتمل التسليم') : unit.state === 'sample-risk' ? t('Sample exhibition: delivery risk', 'المعرض التجريبي: مخاطر في التسليم') : unit.state === 'sample-publishing' ? printStages[brief.publishing.stage][isAr ? 1 : 0] : t('Awaiting directorate report', 'بانتظار تقرير الإدارة')}</span>
        </li>)}</ul>
        <p className="lr-small">{t('Examples identify SDC programmes. Only the separate fictional cases have connected status; clearing one delivery does not clear an entire festival or directorate.', 'تحدد الأمثلة برامج الدائرة. ترتبط الحالة بالتجارب الافتراضية المستقلة فقط؛ ولا يعني اكتمال تسليم واحد جاهزية المهرجان أو الإدارة بأكملها.')}</p>
        <p className="lr-small" data-testid="evidence-health">{formatNumber(caseMetrics.evidencePercent)}{isAr ? '٪' : '%'} · {t('Five required case records; presence is not compliance or opening authorization.', 'خمسة سجلات مطلوبة للحالة؛ وجودها ليس إثبات امتثال أو إذناً بالافتتاح.')}</p>
        <ClaimProvenance sourceKey="department" isAr={isAr}/>
        </details>
        <button className="lr-link" onClick={onDirectorate}>{t('View Cultural Affairs oversight', 'عرض متابعة الشؤون الثقافية')}</button>
      </section>
      <section className="lr-panel">
        <p className="lr-eyebrow">{t('02 · PUBLISHING CYCLES', '٠٢ · دورات النشر')}</p>
        <h2>{t('Institutional publishing', 'النشر المؤسسي')}</h2>
        <p className="lr-small">{t('Seven monthly titles. Current issue dates and stages await a publishing report.', 'سبعة عناوين شهرية. ننتظر تقرير النشر لتحديد مواعيد الأعداد الحالية ومراحل إعدادها.')}</p>
        <ul className="lr-magazine-grid">{brief.magazineCycles.map(magazine => <li key={magazine.id}><strong>{t(magazine.en, magazine.ar)}</strong><span>{t('Awaiting report', 'بانتظار التقرير')}</span></li>)}</ul>
        <ClaimProvenance sourceKey="magazines" isAr={isAr}/>
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
