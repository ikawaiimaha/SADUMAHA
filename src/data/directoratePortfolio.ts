import type { LivingRecord } from './livingRecord';
import { claimRegister, type ClaimKey } from './claimRegister';

// Proposed portfolio groups, not a formal organisation chart. Public sources establish
// programme context; they do not establish delivery status, assignments or delegation.
export const portfolioAreas = [
  { id: 'awards', en: 'Awards and criticism', ar: 'الجوائز والنقد' },
  { id: 'programmes', en: 'Forums, festivals and arts', ar: 'الملتقيات والمهرجانات والفنون' },
  { id: 'publishing', en: 'Publishing and institutional output', ar: 'النشر والمنجز المؤسسي' },
] as const;
export type PortfolioArea = typeof portfolioAreas[number]['id'];
export type PortfolioFilter = 'all' | PortfolioArea;

export const portfolioSources = {
  calendar: 'https://sdc.gov.ae/en/media-center/news/31/8/2026/sharjah-department-of-culture-announces-annual-program-of-permanent-festivals-and-forums',
  creativity: 'https://sdc.gov.ae/en/media-center/news/5/5/2026/sharjah-award-for-arab-creativity-sets-october-31-as-final-deadline-for-submissions',
  artCriticism: 'https://sdc.gov.ae/ar/media-center/news/22/2/2026/the-sharjah-award-for-art-criticism-announces-the-theme-of-its-17th-edition',
  poetryCriticism: claimRegister.poetryCriticism.url,
} as const;

interface PortfolioActivity {
  id: string;
  area: PortfolioArea;
  activityEn: string;
  activityAr: string;
  contextEn?: string;
  contextAr?: string;
  outputEn: string;
  outputAr: string;
  source?: keyof typeof portfolioSources;
  provenance?: ClaimKey;
  scope: 'programme-reference' | 'department-output' | 'fictional-case';
  managerEn?: string;
  managerAr?: string;
  due?: string;
  forecast: 'awaiting-update' | 'at-risk' | 'on-track';
  escalated: boolean;
}

// Expected outputs are proposed reporting fields. News articles are not live reports.
const programmeReferences: Omit<PortfolioActivity, 'forecast' | 'escalated'>[] = [
  { id: 'REF-AWARD-ART', area: 'awards', scope: 'programme-reference', source: 'artCriticism',
    activityEn: 'Sharjah Award for Artistic Criticism', activityAr: 'جائزة الشارقة للبحث النقدي التشكيلي',
    outputEn: 'Award-cycle milestones and research publication handover', outputAr: 'مراحل دورة الجائزة وتسليم البحوث للنشر' },
  { id: 'REF-AWARD-CREATIVITY', area: 'awards', scope: 'programme-reference', source: 'creativity',
    activityEn: 'Sharjah Award for Arab Creativity', activityAr: 'جائزة الشارقة للإبداع العربي',
    contextEn: 'Six fields: short story, poetry, novel, theatre, children’s literature, and literary criticism.',
    contextAr: 'ستة مجالات: القصة القصيرة والشعر والرواية والمسرح وأدب الطفل والنقد الأدبي.',
    outputEn: 'Cycle schedule, results documentation and publication handover', outputAr: 'جدول الدورة وتوثيق النتائج والتسليم للنشر' },
  { id: 'REF-AWARD-POETRY', area: 'awards', scope: 'programme-reference', source: 'poetryCriticism',
    activityEn: 'Sharjah Award for Arabic Poetry Criticism', activityAr: 'جائزة الشارقة لنقد الشعر العربي',
    outputEn: 'Research-cycle milestones and documented outcomes', outputAr: 'مراحل الدورة البحثية وتوثيق المخرجات' },
  { id: 'REF-CALLIGRAPHY', area: 'programmes', scope: 'programme-reference', source: 'calendar',
    activityEn: 'Sharjah Calligraphy Biennial', activityAr: 'ملتقى الشارقة للخط',
    outputEn: 'Exhibitions, workshops and programme documentation', outputAr: 'المعارض والورش وتوثيق البرنامج' },
  { id: 'REF-POETRY-FORUMS', area: 'programmes', scope: 'programme-reference', source: 'calendar',
    activityEn: 'Arabic poetry forums and festivals', activityAr: 'ملتقيات ومهرجانات الشعر العربي',
    contextEn: 'Arab and African programmes; partners and editions require separate plans.',
    contextAr: 'برامج عربية وأفريقية؛ تتطلب الجهات الشريكة والدورات خططاً مستقلة.',
    outputEn: 'Programme calendar, partner milestones and event reports', outputAr: 'تقويم البرامج ومراحل عمل الشركاء وتقارير الفعاليات' },
  { id: 'REF-NARRATION', area: 'programmes', scope: 'programme-reference', source: 'calendar',
    activityEn: 'Sharjah Narration Forum', activityAr: 'ملتقى الشارقة للسرد',
    outputEn: 'Forum delivery and proceedings documentation', outputAr: 'تنفيذ الملتقى وتوثيق أعماله' },
  { id: 'REF-KATATIB', area: 'programmes', scope: 'programme-reference', source: 'calendar',
    activityEn: 'Katatib calligraphy programme', activityAr: 'برنامج كتاتيب',
    outputEn: 'Workshop schedule and learning-outcome report', outputAr: 'جدول الورش وتقرير المخرجات التعليمية' },
  { id: 'REF-KALBA', area: 'programmes', scope: 'programme-reference', source: 'calendar',
    activityEn: 'Kalba Cultural Festival', activityAr: 'مهرجان كلباء الثقافي',
    outputEn: 'Festival milestones and delivery report', outputAr: 'مراحل المهرجان وتقرير التنفيذ' },
  { id: 'REF-RESEARCH-PUBLISHING', area: 'publishing', scope: 'programme-reference', source: 'artCriticism',
    activityEn: 'Award research and literature', activityAr: 'بحوث الجوائز وأعمالها الأدبية',
    outputEn: 'Publication schedule and distribution evidence', outputAr: 'جدول النشر وأدلة التوزيع' },
  { id: 'REF-MAGAZINES', area: 'publishing', scope: 'department-output', source: 'calendar',
    activityEn: 'Department magazines', activityAr: 'مجلات دائرة الثقافة',
    contextEn: 'Includes Al-Qawafi and Al-Heera Min Al-Shariqa. Direct reporting to the Director is unconfirmed.',
    contextAr: 'تشمل القوافي والحيرة من الشارقة. لم يُثبت ارتباطها الإداري المباشر بمدير الإدارة.',
    outputEn: 'Issue schedule and publication record', outputAr: 'جدول الإصدارات وسجل النشر' },
];

export function selectDirectoratePortfolio(state: LivingRecord, filter: PortfolioFilter = 'all') {
  const deliveryReady = Boolean(state.acceptance);
  const activities: PortfolioActivity[] = [
    { id: 'DEMO-A1', area: 'programmes', scope: 'fictional-case',
      activityEn: 'Exhibition delivery — demonstration', activityAr: 'تنفيذ المعرض — حالة تجريبية',
      outputEn: 'Installation readiness', outputAr: 'الجاهزية للتركيب',
      managerEn: 'Exhibitions manager — sample role', managerAr: 'مدير المعارض — دور تجريبي',
      due: '2026-09-22', forecast: deliveryReady ? 'on-track' : 'at-risk',
      escalated: state.deliveryEscalated && !deliveryReady },
    ...programmeReferences.map(activity => ({ ...activity, provenance: activity.source, forecast: 'awaiting-update' as const, escalated: false })),
  ];
  return {
    activities,
    visibleActivities: activities.filter(activity => filter === 'all' || activity.area === filter),
    areas: portfolioAreas.map(area => ({ ...area, count: activities.filter(activity => activity.area === area.id).length })),
    reportedCount: activities.filter(activity => activity.forecast !== 'awaiting-update').length,
    awaitingUpdateCount: activities.filter(activity => activity.forecast === 'awaiting-update').length,
    activitiesAtRisk: activities.filter(activity => activity.forecast === 'at-risk').length,
    escalations: activities.filter(activity => activity.escalated),
  };
}
