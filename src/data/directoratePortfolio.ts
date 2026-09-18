import type { LivingRecord } from './livingRecord';

// Illustrative portfolio, not an asserted organisation chart or actual programme schedule.
// Section names are informed by supplied HR labels; activities and dates are fictional.
export function selectDirectoratePortfolio(state: LivingRecord) {
  const deliveryReady = Boolean(state.acceptance);
  const activities = [
    { id: 'DEMO-A1', section: 'exhibitions', sectionEn: 'Art Exhibitions', sectionAr: 'المعارض الفنية',
      activityEn: 'Exhibition programme', activityAr: 'برنامج المعارض',
      managerEn: 'Exhibitions manager', managerAr: 'مدير المعارض',
      milestoneEn: 'Installation readiness', milestoneAr: 'الجاهزية للتركيب', due: '2026-09-22',
      forecastEn: deliveryReady ? 'Ready for next milestone' : 'Readiness at risk', forecastAr: deliveryReady ? 'جاهز للمرحلة التالية' : 'الجاهزية معرضة للتأخر',
      atRisk: !deliveryReady, escalated: state.deliveryEscalated && !deliveryReady },
    { id: 'DEMO-A2', section: 'exhibitions', sectionEn: 'Art Exhibitions', sectionAr: 'المعارض الفنية',
      activityEn: 'Calligraphy display', activityAr: 'عرض الخط العربي',
      managerEn: 'Exhibitions manager', managerAr: 'مدير المعارض',
      milestoneEn: 'Display preparation', milestoneAr: 'تجهيز العرض', due: '2026-09-24',
      forecastEn: 'Ready for next milestone', forecastAr: 'جاهز للمرحلة التالية', atRisk: false, escalated: false },
    { id: 'DEMO-A3', section: 'activities', sectionEn: 'Art Activities', sectionAr: 'الأنشطة الفنية',
      activityEn: 'Artist workshop series', activityAr: 'سلسلة ورش الفنانين',
      managerEn: 'Art activities manager', managerAr: 'مدير الأنشطة الفنية',
      milestoneEn: 'Workshop launch', milestoneAr: 'بدء الورش', due: '2026-09-25',
      forecastEn: 'Ready for next milestone', forecastAr: 'جاهز للمرحلة التالية', atRisk: false, escalated: false },
    { id: 'DEMO-A4', section: 'international', sectionEn: 'International Programmes', sectionAr: 'البرامج الدولية',
      activityEn: 'Cultural exchange programme', activityAr: 'برنامج التبادل الثقافي',
      managerEn: 'International programmes manager', managerAr: 'مدير البرامج الدولية',
      milestoneEn: 'Programme launch', milestoneAr: 'بدء البرنامج', due: '2026-09-28',
      forecastEn: 'Ready for next milestone', forecastAr: 'جاهز للمرحلة التالية', atRisk: false, escalated: false },
  ];
  const sections = [...new Set(activities.map(activity => activity.section))];
  return {
    activities,
    sectionCount: sections.length,
    sectionsOnTrack: sections.filter(section => !activities.some(activity => activity.section === section && activity.atRisk)).length,
    activitiesAtRisk: activities.filter(activity => activity.atRisk).length,
    escalations: activities.filter(activity => activity.escalated),
  };
}
