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

// Sourced directly from SDC Official Calendar: September 2026 – August 2027.
const programmeReferences: Omit<PortfolioActivity, 'forecast' | 'escalated'>[] = [
  // Pillar 1: Awards & Criticism (الجوائز والنقد)
  {
    id: 'REF-AWARD-ART',
    area: 'awards',
    scope: 'programme-reference',
    activityEn: '17th Sharjah Award for Artistic Criticism',
    activityAr: 'جائزة الشارقة للبحث النقدي التشكيلي — الدورة 17',
    contextEn: '9 December 2026 · Department of Culture',
    contextAr: 'الأربعاء 9 ديسمبر 2026 · دائرة الثقافة',
    outputEn: 'Award research evaluation and publication handover',
    outputAr: 'تحكيم بحوث الجائزة وتسليم الأبحاث الفائزة للنشر',
  },
  {
    id: 'REF-AWARD-CREATIVITY',
    area: 'awards',
    scope: 'programme-reference',
    activityEn: '30th Sharjah Award for Arab Creativity',
    activityAr: 'جائزة الشارقة للإبداع العربي — الدورة 30 (الإصدار الأول)',
    contextEn: '7–8 April 2027 · Cultural Palace',
    contextAr: '7–8 أبريل 2027 · قصر الثقافة',
    outputEn: 'First-edition literary winners ceremony & publication release',
    outputAr: 'حفل الفائزين بالإصدار الأول وإجازة نشر المطبوعات الفائزة',
  },

  // Pillar 2: Flagship Festivals & Cultural Affairs (الملتقيات والمهرجانات والفنون)
  {
    id: 'REF-CALLIGRAPHY-12',
    area: 'programmes',
    scope: 'programme-reference',
    activityEn: '12th Sharjah Calligraphy Biennial (Mīzān)',
    activityAr: 'ملتقى الشارقة للخط — الدورة 12 (ميزان)',
    contextEn: '7 Oct – 15 Nov 2026 · Calligraphy Square & Sharjah Art Museum',
    contextAr: '7 أكتوبر – 15 نوفمبر 2026 · ساحة الخط ومتحف الشارقة للفنون',
    outputEn: 'Exhibition installation, catalog delivery & guest protocol',
    outputAr: 'تثبيت الأعمال الفنية، استلام الكتالوج، وإجراءات التشريفات',
  },
  {
    id: 'REF-KALBA-FESTIVAL',
    area: 'programmes',
    scope: 'programme-reference',
    activityEn: '8th Kalba Cultural Festival',
    activityAr: 'مهرجان كلباء الثقافي — الدورة 8',
    contextEn: '23–24 October 2026 · Kalba Cultural Centre',
    contextAr: '23–24 أكتوبر 2026 · المركز الثقافي بكلباء',
    outputEn: 'Eastern region operational milestones & community showcase',
    outputAr: 'مراحل الجاهزية التشغيلية بالمنطقة الشرقية وتنسيق الفعاليات',
  },
  {
    id: 'REF-DESERT-THEATRE',
    area: 'programmes',
    scope: 'programme-reference',
    activityEn: '10th Sharjah Desert Theatre Festival',
    activityAr: 'مهرجان الشارقة للمسرح الصحراوي — الدورة 10',
    contextEn: '11–15 December 2026 · Al Kuhaif Area',
    contextAr: '11–15 ديسمبر 2026 · منطقة الكهيف',
    outputEn: 'Site logistics, tent infrastructure & regional troupes intake',
    outputAr: 'لوجستيات الموقع الميداني، البنية التحتية، واستقبال الفرق العربية',
  },
  {
    id: 'REF-THEATRE-DAYS',
    area: 'programmes',
    scope: 'programme-reference',
    activityEn: '36th Sharjah Theatre Days',
    activityAr: 'أيام الشارقة المسرحية — الدورة 36',
    contextEn: '17–24 March 2027 · Cultural Palace',
    contextAr: '17–24 مارس 2027 · قصر الثقافة',
    outputEn: 'Jury schedule, local theatrical production & performance permits',
    outputAr: 'جدول لجنة التحكيم، عروض الفرق الأهلية، وتصاريح المشاهدة',
  },
  {
    id: 'REF-CALLIGRAPHY-STUDENTS',
    area: 'programmes',
    scope: 'programme-reference',
    activityEn: 'Sharjah Calligraphy Centre Students Exhibition',
    activityAr: 'معرض نتاج دورات مركز الشارقة للخط',
    contextEn: '5 May 2027 · Calligraphy Square',
    contextAr: 'الأربعاء 5 مايو 2027 · ساحة الخط',
    outputEn: 'Student works framing, mounting & certificate issuance',
    outputAr: 'تأطير لوحات الخريجين، تجهيز المعرض، وإصدار شهادات الإجازة',
  },
  {
    id: 'REF-INTL-POETRY-NETWORK',
    area: 'programmes',
    scope: 'programme-reference',
    activityEn: 'International Arabic Poetry Forums Network (14 Countries)',
    activityAr: 'شبكة ملتقيات الشعر العربي في أفريقيا والوطن العربي (14 ملتقى دولياً)',
    contextEn: 'July – August 2027 · Morocco, Mauritania, Egypt, Sudan, Chad, Mali, Senegal, etc.',
    contextAr: 'يوليو – أغسطس 2027 · المغرب، موريتانيا، مصر، السودان، تشاد، مالي، السنغال، وغيرها',
    outputEn: 'Partner cultural centers reporting & diplomatic delegation protocol',
    outputAr: 'تقارير المراكز الثقافية الشريكة، المواعيد، وتنسيق وفود الدائرة',
  },

  // Pillar 3: Publishing & Heritage (النشر والمنجز المؤسسي)
  {
    id: 'REF-SDC-AUTHORS-HONOR',
    area: 'publishing',
    scope: 'programme-reference',
    activityEn: 'Honoring SDC Publication Authors (2026 Releases)',
    activityAr: 'تكريم مؤلفي إصدارات دائرة الثقافة لعام 2026',
    contextEn: '25 March 2027 · Department of Culture HQ',
    contextAr: 'الخميس 25 مارس 2027 · دائرة الثقافة',
    outputEn: '2026 publishing archive closeout & author royalties clearance',
    outputAr: 'إغلاق السجل الببليوغرافي لإصدارات 2026 وتسوية مكافآت المؤلفين',
  },
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
