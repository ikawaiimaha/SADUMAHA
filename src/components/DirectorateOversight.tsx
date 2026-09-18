import { useI18n } from '../context/I18nContext';
import { useLivingRecord } from '../context/LivingRecordContext';
import { selectDirectoratePortfolio } from '../data/directoratePortfolio';

export function DirectorateOversight() {
  const { isAr, formatNumber } = useI18n();
  const { state } = useLivingRecord();
  const portfolio = selectDirectoratePortfolio(state);
  const t = (en: string, ar: string) => isAr ? ar : en;
  const date = (value: string) => new Intl.DateTimeFormat(isAr ? 'ar-AE-u-nu-arab' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
  return <div className="lr-oversight">
    <p className="lr-oversight-intro">{t('Are the departments delivering their activities on schedule? See the responsible manager, the next milestone, and any risk that needs your attention.', 'هل تنفذ الأقسام أنشطتها وفق الجدول؟ تابع المدير المسؤول والمرحلة التالية وأي مخاطر تتطلب اهتمامك.')}</p>
    <div className="lr-brief">
      <section className="lr-panel"><h2>{t('Departments on track', 'الأقسام المنتظمة في التنفيذ')}</h2><p className="lr-metric" data-testid="departments-on-track"><bdi dir="ltr">{formatNumber(portfolio.sectionsOnTrack)} / {formatNumber(portfolio.sectionCount)}</bdi></p><p>{t('All listed activities within each department are on track.', 'جميع الأنشطة المدرجة في كل قسم تسير وفق الخطة.')}</p></section>
      <section className="lr-panel"><h2>{t('Activities at risk', 'أنشطة معرضة للتأخر')}</h2><p className="lr-metric" data-testid="activities-at-risk">{formatNumber(portfolio.activitiesAtRisk)}</p><p>{t('Delivery prerequisites may affect the planned milestone.', 'قد تؤثر متطلبات التنفيذ غير المكتملة في موعد المرحلة المخطط.')}</p></section>
      <section className="lr-panel"><h2>{t('Manager escalations', 'تصعيدات المديرين')}</h2><p className="lr-metric" data-testid="manager-escalations">{formatNumber(portfolio.escalations.length)}</p><p>{t('Risks explicitly raised for cross-department attention.', 'مخاطر رُفعت صراحة للمتابعة بين الأقسام.')}</p></section>
    </div>
    <section className="lr-panel">
      <div className="lr-section-title"><h2>{t('Department delivery and schedules', 'تنفيذ الأقسام والجداول الزمنية')}</h2><span className="lr-status">{t('Sample planning date: 18 September 2026', 'تاريخ التخطيط التجريبي: ١٨ سبتمبر ٢٠٢٦')}</span></div>
      <div className="lr-table-wrap"><table className="lr-portfolio-table">
        <caption className="sr-only">{t('Activities by department, responsible manager, next milestone, planned date, and forecast', 'الأنشطة حسب القسم والمدير المسؤول والمرحلة التالية والموعد المخطط والتوقع')}</caption>
        <thead><tr>{[t('Department', 'القسم'), t('Activity / responsible manager', 'النشاط / المدير المسؤول'), t('Next milestone', 'المرحلة التالية'), t('Planned date', 'الموعد المخطط'), t('Delivery forecast', 'توقع التنفيذ')].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{portfolio.activities.map(activity => <tr key={activity.id}>
          <th scope="row">{t(activity.sectionEn, activity.sectionAr)}</th>
          <td><strong>{t(activity.activityEn, activity.activityAr)}</strong><span className="lr-small lr-cell-note">{t(activity.managerEn, activity.managerAr)}</span></td>
          <td>{t(activity.milestoneEn, activity.milestoneAr)}</td>
          <td><time dateTime={activity.due}>{date(activity.due)}</time></td>
          <td><span className={`lr-status ${activity.atRisk ? 'is-waiting' : 'is-clear'}`}>{activity.atRisk ? t('At risk', 'معرض للتأخر') : t('On track', 'وفق الخطة')}</span><span className="lr-small lr-cell-note">{t(activity.forecastEn, activity.forecastAr)}</span></td>
        </tr>)}</tbody>
      </table></div>
      <p className="lr-small">{t('Illustrative portfolio: three sample sections and four activities. Dates and reporting lines are examples. Schedule status is a forecast, not proof that an activity has finished.', 'محفظة توضيحية: ثلاثة أقسام تجريبية وأربعة أنشطة. المواعيد وخطوط الإشراف أمثلة. حالة الجدول توقع وليست إثباتاً لانتهاء النشاط.')}</p>
    </section>
    <section className="lr-panel">
      <h2>{t('Risks requiring Directorate attention', 'مخاطر تتطلب اهتمام الإدارة')}</h2>
      {portfolio.escalations.length ? portfolio.escalations.map(activity => <div key={activity.id} className="lr-oversight-escalation">
        <h3>{t('Exhibition schedule risk', 'مخاطر جدول المعارض')}</h3>
        <dl>
          <dt>{t('Responsible manager', 'المدير المسؤول')}</dt><dd>{t(activity.managerEn, activity.managerAr)}</dd>
          <dt>{t('Impact', 'الأثر')}</dt><dd>{t('Installation readiness on 22 September may slip.', 'قد تتأخر الجاهزية للتركيب المقررة في ٢٢ سبتمبر.')}</dd>
          <dt>{t('Attention requested', 'المتابعة المطلوبة')}</dt><dd>{t('Coordinate priorities and resources across departments. The manager retains responsibility for resolving the delivery dependency.', 'تنسيق الأولويات والموارد بين الأقسام. يبقى المدير مسؤولاً عن معالجة متطلب التنفيذ.')}</dd>
        </dl>
      </div>) : <p>{t('No manager has an open escalation. Routine delivery issues remain with the responsible managers.', 'لا توجد تصعيدات مفتوحة من المديرين. تبقى مسائل التنفيذ اليومية لدى المديرين المسؤولين.')}</p>}
    </section>
  </div>;
}
