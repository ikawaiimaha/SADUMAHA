import React from 'react';
import { Check, CircleAlert } from 'lucide-react';
import type { DemoActor, DemoEvent, LivingRecord } from '../../data/livingRecord';

interface BilingualTimelineProps {
  record: Pick<LivingRecord, 'events' | 'receiptIssue' | 'condition' | 'conditionHistory'>;
  isArabic: boolean;
  eventLabel: (event: DemoEvent) => string;
  roleLabel: (actor: DemoActor) => string;
  formatTime: (timestamp: string) => string;
}

/** Read-only session history. Current blocking state is separate from historical exceptions. */
export function BilingualTimeline({ record, isArabic, eventLabel, roleLabel, formatTime }: BilingualTimelineProps) {
  const t = (en: string, ar: string) => isArabic ? ar : en;
  const reports = new Map(record.conditionHistory.map(report => [`${report.id}/v${report.version}`, report]));
  const blocked = record.receiptIssue || record.condition?.outcome === 'issue';

  return <div className="lr-timeline text-start" dir={isArabic ? 'rtl' : 'ltr'}>
    {blocked && <p className="lr-timeline-notice border-s-4 ps-4" role="status">
      <strong>{t('Handover blocked. ', 'التسليم متوقف. ')}</strong>
      {record.receiptIssue
        ? t('Identity or seal mismatch: logistics supervisor review is required before receipt can continue.', 'عدم تطابق الهوية أو الختم: تلزم مراجعة مشرف اللوجستيات قبل متابعة الاستلام.')
        : t('Condition discrepancy: technical follow-up is required before manager review.', 'اختلاف في الحالة: تلزم متابعة الفريق الفني قبل مراجعة المدير.')}
    </p>}
    {record.events.length === 0 ? <p>{t('No actions recorded in this session.', 'لم تُسجل إجراءات في هذه الجلسة.')}</p> : <>
      <p className="lr-small">{t('Recorded demo transitions in session order; navigation and rejected actions are not logged.', 'انتقالات الحالة التجريبية حسب ترتيب تسجيلها في الجلسة؛ لا يُسجل التنقل أو الإجراءات المرفوضة.')}</p>
      <ol className="lr-timeline-list" role="list" aria-label={t('Session activity timeline', 'التسلسل الزمني لنشاط الجلسة')}>
        {record.events.map(event => {
          // Bind each condition event to its own report version, never the latest report's outcome.
          const report = event.kind === 'condition' ? reports.get(event.reference) : undefined;
          const exception = event.kind === 'receipt-issue' || report?.outcome === 'issue';
          const activeException = event.kind === 'receipt-issue' ? record.receiptIssue
            : report?.outcome === 'issue' && record.condition?.id === report.id && record.condition.version === report.version;
          const tone = activeException ? 'blocked' : exception ? 'exception' : event.kind === 'handover' ? 'acknowledged' : 'recorded';
          return <li key={event.id} className="lr-timeline-event relative ps-8" data-state={tone}>
            <span className="lr-timeline-marker absolute start-0" aria-hidden="true">
              {exception ? <CircleAlert size={16}/> : event.kind === 'handover' ? <Check size={16}/> : <span/>}
            </span>
            <h3>{report ? report.outcome === 'issue'
              ? t('Condition evidence recorded · discrepancy', 'سُجلت أدلة الحالة · يوجد اختلاف')
              : t('Condition evidence recorded · clear', 'سُجلت أدلة الحالة · لا توجد ملاحظات')
              : eventLabel(event)}</h3>
            {exception && <p className="lr-timeline-exception">{activeException
              ? t('Active exception · handover blocked', 'استثناء قائم · التسليم متوقف')
              : t('Earlier exception · see subsequent records', 'استثناء سابق · راجع السجلات اللاحقة')}</p>}
            <dl className="lr-timeline-meta">
              <div><dt>{t('Event / time (UAE)', 'الحدث / الوقت (الإمارات)')}</dt><dd>
                <bdi>{event.id}</bdi><time dateTime={event.at}>{formatTime(event.at)}</time>
                <bdi className="lr-timeline-code">{event.at}</bdi>
              </dd></div>
              <div><dt>{t('Sample role', 'الدور التجريبي')}</dt><dd>{roleLabel(event.actor)}<bdi className="lr-timeline-code">DEMO-{event.actor}</bdi></dd></div>
              <div><dt>{t('Record / version reference', 'مرجع السجل / الإصدار')}</dt><dd><bdi>{event.reference}</bdi><bdi className="lr-timeline-code">{event.kind}</bdi></dd></div>
            </dl>
          </li>;
        })}
      </ol>
    </>}
  </div>;
}
