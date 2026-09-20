import { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { useLivingRecord } from '../context/LivingRecordContext';
import { selectDirectoratePortfolio, type PortfolioFilter } from '../data/directoratePortfolio';
import { ClaimProvenance } from './ClaimProvenance';

export function DirectorateOversight() {
  const { isAr, formatNumber } = useI18n();
  const { state } = useLivingRecord();
  const [filter, setFilter] = useState<PortfolioFilter>('all');
  const portfolio = selectDirectoratePortfolio(state, filter);
  const t = (en: string, ar: string) => isAr ? ar : en;
  const date = (value: string) => new Intl.DateTimeFormat(isAr ? 'ar-AE-u-nu-arab' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
  return <div className="lr-oversight">
    <p className="lr-oversight-intro">{t('Oversee delivery across awards, cultural programmes, and publishing. Follow manager reports, schedules, and escalated risks; managers remain responsible for day-to-day execution.', 'تابع الإنجاز عبر الجوائز والبرامج الثقافية والنشر، من خلال تقارير المديرين والجداول والمخاطر المصعّدة. ويبقى التنفيذ اليومي من مسؤولية المديرين.')}</p>
    <div className="lr-brief">
      <section className="lr-panel"><h2>{t('Delivery reports available', 'تقارير التنفيذ المتاحة')}</h2><p className="lr-metric" data-testid="activities-reported">{isAr ? <>{formatNumber(portfolio.reportedCount)} <span>من</span> {formatNumber(portfolio.activities.length)}</> : <bdi dir="ltr">{formatNumber(portfolio.reportedCount)} / {formatNumber(portfolio.activities.length)}</bdi>}</p><p>{t('One fictional report is connected. Public programme references await manager updates.', 'تقرير تجريبي واحد مترابط. وتنتظر مراجع البرامج المنشورة تحديثات المديرين.')}</p></section>
      <section className="lr-panel"><h2>{t('Reported schedule risks', 'مخاطر الجدول المبلّغ عنها')}</h2><p className="lr-metric" data-testid="activities-at-risk">{formatNumber(portfolio.activitiesAtRisk)}</p><p>{t('Reported activities only. An unreported activity is not counted as on track.', 'للأنشطة التي لها تقارير فقط. لا يُعد النشاط الذي لم يرد عنه تقرير منتظماً في التنفيذ.')}</p></section>
      <section className="lr-panel"><h2>{t('Manager escalations', 'تصعيدات المديرين')}</h2><p className="lr-metric" data-testid="manager-escalations">{formatNumber(portfolio.escalations.length)}</p><p>{t('Risks explicitly raised for cross-department attention.', 'مخاطر رُفعت صراحة للمتابعة بين الأقسام.')}</p></section>
    </div>
    <section className="lr-panel">
      <div className="lr-section-title"><h2>{t('Portfolio delivery and schedules', 'إنجاز البرامج والجداول الزمنية')}</h2><span className="lr-status">{t('Proposed portfolio grouping', 'تصنيف مقترح للبرامج')}</span></div>
      <div className="lr-portfolio-filters" role="group" aria-label={t('Filter portfolio area', 'تصفية مجال البرامج')}>
        <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>{t('All areas', 'جميع المجالات')} <span>{formatNumber(portfolio.activities.length)}</span></button>
        {portfolio.areas.map(area => <button type="button" key={area.id} aria-pressed={filter === area.id} onClick={() => setFilter(area.id)}>{t(area.en, area.ar)} <span>{formatNumber(area.count)}</span></button>)}
      </div>
      <p className="lr-small" aria-live="polite">{t(`Showing ${portfolio.visibleActivities.length} of ${portfolio.activities.length} activities. Summary counts cover all areas.`, `عرض ${formatNumber(portfolio.visibleActivities.length)} من ${formatNumber(portfolio.activities.length)} نشاطاً. تشمل المؤشرات جميع المجالات.`)}</p>
      <div className="lr-table-wrap" tabIndex={0} role="region" aria-label={t('Portfolio schedule table', 'جدول مواعيد البرامج')}><table className="lr-portfolio-table">
        <caption className="sr-only">{t('Programme references, proposed outputs, manager reports and dates. Reference entries have no live status.', 'مراجع البرامج والمخرجات المقترحة وتقارير المديرين والمواعيد. لا تتوفر حالة فعلية للمراجع المنشورة.')}</caption>
        <thead><tr>{[t('Activity / programme', 'النشاط / البرنامج'), t('Output to monitor', 'المخرج المطلوب متابعته'), t('Manager report / next date', 'تقرير المدير / الموعد التالي'), t('Delivery forecast', 'توقع التنفيذ')].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{portfolio.visibleActivities.map(activity => {
          const awaiting = activity.forecast === 'awaiting-update';
          return <tr key={activity.id} data-activity-id={activity.id}>
            <th scope="row"><strong>{t(activity.activityEn, activity.activityAr)}</strong>
              {activity.contextEn && activity.contextAr ? <span className="lr-small lr-cell-note">{t(activity.contextEn, activity.contextAr)}</span> : null}
              {activity.provenance ? <ClaimProvenance sourceKey={activity.provenance} isAr={isAr}/> : <span className="lr-small lr-cell-note">{t('Fictional case · session only', 'حالة افتراضية · الجلسة الحالية فقط')}</span>}
            </th>
            <td>{t(activity.outputEn, activity.outputAr)}<span className="lr-small lr-cell-note">{t('Proposed reporting field', 'حقل متابعة مقترح')}</span></td>
            <td>{activity.managerEn && activity.managerAr ? t(activity.managerEn, activity.managerAr) : t('Manager assignment unconfirmed', 'لم يُؤكد تكليف المدير')}<span className="lr-small lr-cell-note">{activity.due ? <>{t('Demo milestone: ', 'موعد تجريبي: ')}<time dateTime={activity.due}>{date(activity.due)}</time></> : t('Next milestone and date: awaiting report', 'المرحلة التالية وموعدها: بانتظار التقرير')}</span></td>
            <td><span className={`lr-status ${awaiting ? '' : activity.forecast === 'at-risk' ? 'is-waiting' : 'is-clear'}`}>{awaiting ? t('Awaiting manager update', 'بانتظار تحديث المدير') : activity.forecast === 'at-risk' ? t('At risk · demo', 'معرض للتأخر · تجريبي') : t('On track · demo', 'وفق الخطة · تجريبي')}</span>{!awaiting ? <span className="lr-small lr-cell-note">{t('Installation milestone only', 'مرحلة الجاهزية للتركيب فقط')}</span> : null}</td>
          </tr>;
        })}</tbody>
      </table></div>
      <p className="lr-small">{t(`Awaiting updates: ${portfolio.awaitingUpdateCount}. These are portfolio areas, not confirmed departments or reporting lines. Programme sources do not establish current progress, manager assignments, or approval rights.`, `بانتظار التحديث: ${formatNumber(portfolio.awaitingUpdateCount)}. هذه مجالات للبرامج وليست أقساماً أو خطوط إشراف معتمدة. لا تثبت مصادر البرامج مستوى الإنجاز الحالي أو تكليفات المديرين أو صلاحيات الاعتماد.`)}</p>
    </section>
    <section className="lr-panel">
      <h2>{t('Risks requiring Directorate attention', 'مخاطر تتطلب اهتمام الإدارة')}</h2>
      {portfolio.escalations.length ? portfolio.escalations.map(activity => <div key={activity.id} className="lr-oversight-escalation">
        <h3>{t('Exhibition schedule risk', 'مخاطر جدول المعارض')}</h3>
        <dl>
          <dt>{t('Responsible manager', 'المدير المسؤول')}</dt><dd>{t(activity.managerEn ?? 'Assignment pending', activity.managerAr ?? 'التكليف قيد التحديد')}</dd>
          <dt>{t('Impact', 'الأثر')}</dt><dd>{t('The demo installation milestone on 22 September may slip.', 'قد يتأخر الموعد التجريبي للجاهزية للتركيب في ٢٢ سبتمبر.')}</dd>
          <dt>{t('Attention requested', 'المتابعة المطلوبة')}</dt><dd>{t('Coordinate priorities and resources across departments. The manager retains responsibility for resolving the delivery dependency.', 'تنسيق الأولويات والموارد بين الأقسام. يبقى المدير مسؤولاً عن معالجة متطلب التنفيذ.')}</dd>
        </dl>
      </div>) : <p>{t('No manager has an open escalation. Routine delivery issues remain with the responsible managers.', 'لا توجد تصعيدات مفتوحة من المديرين. تبقى مسائل التنفيذ اليومية لدى المديرين المسؤولين.')}</p>}
    </section>
  </div>;
}
