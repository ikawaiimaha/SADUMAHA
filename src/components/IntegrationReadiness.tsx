// Current mockup inventory, not a live service-health probe. Update only when an
// implemented integration and its verification evidence exist.
const readiness = [
  { id: 'identity', en: 'UAE PASS', ar: 'الهوية الرقمية UAE PASS', statusEn: 'Not connected', statusAr: 'غير متصل', detailEn: 'The role switcher is a demonstration, not a verified sign-in service.', detailAr: 'اختيار الدور للتجربة فقط، وليس خدمة دخول موثقة.' },
  { id: 'network', en: 'FEDNet / GSB', ar: 'الشبكة الاتحادية / ناقل الخدمات الحكومية', statusEn: 'Not connected', statusAr: 'غير متصل', detailEn: 'Institutional eligibility, onboarding and data-sharing approval remain unconfirmed.', detailAr: 'لم تُثبت أهلية الجهة أو إجراءات الربط أو الموافقة على تبادل البيانات.' },
  { id: 'finance', en: 'Financial service', ar: 'الخدمة المالية', statusEn: 'Not connected', statusAr: 'غير متصل', detailEn: 'No payment service or financial authorization is implemented.', detailAr: 'لا توجد خدمة دفع أو آلية تفويض مالي منفذة.' },
  { id: 'forecast', en: 'AI forecasting', ar: 'التنبؤ بالذكاء الاصطناعي', statusEn: 'Not implemented', statusAr: 'غير منفذ', detailEn: 'The readiness outlook uses a stated deadline rule and fictional records.', detailAr: 'يستخدم استشراف الجاهزية قاعدة معلنة للمواعيد وسجلات افتراضية.' },
  { id: 'accessibility', en: 'WCAG 2.2 AA conformance', ar: 'التوافق مع WCAG 2.2 AA', statusEn: 'Assessment pending', statusAr: 'بانتظار التقييم', detailEn: 'Layout checks do not establish full accessibility conformance.', detailAr: 'لا تثبت فحوص التخطيط التوافق الكامل مع متطلبات إمكانية الوصول.' },
  { id: 'strategy', en: 'Institutional strategy alignment', ar: 'المواءمة مع استراتيجية المؤسسة', statusEn: 'Assessment pending', statusAr: 'بانتظار التقييم', detailEn: 'An applicable mandate, current target and measurement baseline are required.', detailAr: 'يلزم تحديد التكليف المطبق والهدف الحالي وخط أساس للقياس.' },
];

export function IntegrationReadiness({ isAr }: { isAr: boolean }) {
  return <details className="lr-integration-readiness" data-testid="integration-readiness">
    <summary>{isAr ? 'حالة الربط والتقييم' : 'Integration and assurance status'} <span>{isAr ? 'تجربة توضيحية · الخدمات الخارجية غير متصلة' : 'Demonstration · External services not connected'}</span></summary>
    <dl>{readiness.map(item => <div key={item.id}>
      <dt>{isAr ? item.ar : item.en}</dt>
      <dd><strong>{isAr ? item.statusAr : item.statusEn}</strong><p>{isAr ? item.detailAr : item.detailEn}</p></dd>
    </div>)}</dl>
    <p className="lr-small">{isAr ? 'تعكس هذه الحالة ما نُفذ في النموذج التوضيحي، وليست فحصاً مباشراً لصحة الخدمات الخارجية.' : 'This describes the implemented mockup, not a live external-service health check.'}</p>
  </details>;
}
