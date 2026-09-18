import type { LivingRecord } from './livingRecord';
import { selectPublishingRecord } from './publishingRecord';

export const SDC_STRUCTURE_SOURCE = 'https://sdc.gov.ae/ar/about-sdc';
export const SDC_MAGAZINES_SOURCE = 'https://sdc.gov.ae/ar/our-publications/magazines';
export const sdcMagazines = [
  { id: 'rafid', en: 'Al Rafid', ar: 'الرافد' },
  { id: 'cultural', en: 'Sharjah Cultural', ar: 'الشارقة الثقافية' },
  { id: 'heera', en: 'Al Heera from Sharjah', ar: 'الحيرة من الشارقة' },
  { id: 'qawafi', en: 'Al Qawafi', ar: 'القوافي' },
  { id: 'wusta', en: 'Al Wusta', ar: 'الوسطى' },
  { id: 'sharqiya', en: 'Al Sharqiya', ar: 'الشرقية' },
  { id: 'masrah', en: 'Al Masrah', ar: 'المسرح' },
];

export function selectChairmanBrief(state: LivingRecord) {
  const publishing = selectPublishingRecord(state.publishing);
  return {
    // Named units are public references. The state belongs to separate fictional cases.
    units: [
      { id: 'culture', en: 'Cultural Affairs', ar: 'الشؤون الثقافية',
        examplesEn: 'Calligraphy Biennial · Arabic poetry forums', examplesAr: 'ملتقى الخط · ملتقيات الشعر العربي',
        state: state.acceptance ? 'sample-cleared' : 'sample-risk' },
      { id: 'theatre', en: 'Theatre', ar: 'المسرح',
        examplesEn: 'Theatre Days · short-play festivals', examplesAr: 'أيام الشارقة المسرحية · مهرجانات المسرحيات القصيرة', state: 'awaiting-report' },
      { id: 'publishing', en: 'Studies and Publishing', ar: 'الدراسات والنشر',
        examplesEn: 'Books, research and publishing milestones', examplesAr: 'الكتب والبحوث ومراحل النشر',
        state: state.publishing.version ? 'sample-publishing' : 'awaiting-report' },
      { id: 'regional', en: 'Eastern Region Administration', ar: 'إدارة المنطقة الشرقية',
        examplesEn: 'Regional activities · Kalba and Khor Fakkan', examplesAr: 'الأنشطة الإقليمية · كلباء وخورفكان', state: 'awaiting-report' },
    ],
    publishing,
    executiveQueue: (state.finance === 'escalated' ? 1 : 0) + (publishing.queued ? 1 : 0),
    // Unknown magazine cycles are not counted as published or late.
    magazineCycles: sdcMagazines.map(magazine => ({ ...magazine, stage: 'awaiting-report' as const })),
  };
}
