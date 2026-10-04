import type { CollectionDemo } from './collectionReadiness';

// Display aliases only. Authorities remain the existing simulated role IDs.
export const guidedCase = {
  id: 'DEMO-001',
  work: { ar: 'دراسة بالأزرق', en: 'Study in Blue' },
  artist: { ar: 'الفنان التجريبي ٠١', en: 'Demo Artist 01' },
  backup: { ar: 'سارة — مسؤولة الاستلام البديلة (شخصية تجريبية)', en: 'Sara — backup collection officer (fictional)' },
  evidence: 'GUIDED-SYNTHETIC-PACKING-CHECK-01',
};

export function formatCaseTimestamp(value: string, ar: boolean): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(ar ? 'ar-AE' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dubai' }).format(date)
    : ar ? 'وقت غير صالح — يلزم استعادة الحالة' : 'Invalid time — restore the case';
}

function formatPickupDate(value: string, ar: boolean): string {
  if (!value) return ar ? 'لم يُحدد' : 'Not selected';
  const date = new Date(`${value}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return ar ? 'موعد غير صالح — يلزم استعادة الحالة' : 'Invalid date — restore the case';
  }
  return new Intl.DateTimeFormat(ar ? 'ar-AE' : 'en-GB', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(date);
}

export function guidedHistoryLabel(action: string, ar: boolean): string {
  const labels: Record<string, [string, string]> = {
    ABSENT: ['سُجّل غياب المسؤول الأساسي', 'Primary officer marked unavailable'],
    ASSIGN: ['عُيّنت سارة مسؤولةً بديلة', 'Sara assigned as backup'],
    ACCEPT: ['قُبلت مسؤولية الاستلام', 'Collection responsibility accepted'],
    DATE: ['تأكد موعد الاستلام', 'Pickup date confirmed'],
    PACK: ['سُجّلت خطة التغليف', 'Packing plan recorded'],
    TECHNICAL: ['سُجّلت المراجعة الفنية', 'Technical review recorded'],
    COST: ['سُجّلت موافقة تكلفة التغليف', 'Packing cost approval recorded'],
    EVIDENCE: ['سُجّل التحقق من اكتمال التغليف', 'Packing completion check recorded'],
  };
  return labels[action.split(':')[0]]?.[ar ? 0 : 1] ?? (ar ? 'خطوة مسجلة' : 'Recorded step');
}

export function guidedActorLabel(actor: string, ar: boolean): string {
  const labels: Record<string, [string, string]> = {
    Coordinator: ['المنسقة', 'Coordinator'], 'Logistics A': ['مسؤول الاستلام الأساسي', 'Primary collection officer'],
    'Logistics B': ['سارة — مسؤولة الاستلام البديلة', 'Sara — backup collection officer'],
    Technical: ['المختص الفني', 'Technical specialist'], Finance: ['المالية', 'Finance'],
  };
  return labels[actor]?.[ar ? 0 : 1] ?? (ar ? 'مسؤول مسجل' : 'Recorded officer');
}

export function collectionReceipt(c: CollectionDemo, ar: boolean) {
  const t = (a: string, e: string) => ar ? a : e;
  const accepted = c.history.find(entry => entry.actor === c.owner && entry.action === 'ACCEPT');
  const completion = c.history.find(entry => entry.action === `EVIDENCE: ${c.packing?.evidence}`);
  return {
    id: guidedCase.id,
    work: guidedCase.work[ar ? 'ar' : 'en'],
    owner: c.owner === 'Logistics B' ? guidedCase.backup[ar ? 'ar' : 'en'] : t('مسؤول الاستلام الأساسي — تجريبي', 'Primary collection officer — fictional'),
    acceptance: accepted ? t('قبلت المهمة', 'Responsibility accepted') : t('بانتظار القبول', 'Acceptance pending'),
    date: formatPickupDate(c.date, ar),
    status: c.stage === 'ready' ? t('جاهز للاستلام — النقل غير محجوز', 'Ready for collection — transport not booked') : t('الاستلام غير جاهز بعد', 'Collection is not ready yet'),
    evidence: c.packing?.evidence || t('بانتظار دليل الإكمال', 'Completion evidence pending'),
    evidenceLabel: completion ? t('ورقة فحص التغليف — تحققت منها سارة', 'Packing check sheet — checked by Sara') : t('بانتظار التحقق من اكتمال التغليف', 'Packing completion check pending'),
    recordedAt: completion?.at ?? null,
    recordedVersion: completion ? completion.version + 1 : null,
  };
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

export function pilotBriefHtml(c: CollectionDemo, ar: boolean): string {
  const t = (a: string, e: string) => ar ? a : e;
  const r = collectionReceipt(c, ar);
  const rows = [
    [t('القرار المطلوب', 'Decision requested'), t('تسمية مسؤول تشغيلي وممثل لتقنية المعلومات لعقد جلسة تحديد نطاق تجربة استلام واحدة.', 'Nominate an operational owner and an IT counterpart for a scoping meeting about one collection-workflow trial.')],
    [t('نطاق التجربة المقترح', 'Proposed scope'), t('عنوان مؤكد ← مسؤول بديل يقبل المهمة ← موعد صالح ← اكتمال التغليف. لا يشمل الحجز أو الدفع أو الشحن الفعلي.', 'Confirmed address → accepted backup → valid date → packing completion. Booking, payment and live shipping are excluded.')],
    [t('ما أظهره المثال', 'What the example showed'), `${r.id} · ${r.work} · ${r.status}. ${r.owner} · ${r.acceptance}. ${r.date}. ${r.evidence}.`],
    [t('قبل بدء التجربة', 'Before the trial'), t('الاتفاق على المدة والتكلفة والبيانات المسموح بها والسجل المعتمد والصلاحيات وطريقة المطابقة مع العمل الحالي. جميعها تنتظر الاتفاق.', 'Agree duration, fee, permitted data, authoritative record, permissions and reconciliation with current work. All remain to be agreed.')],
    [t('معايير التحقق', 'Acceptance checks'), t('لا تتقدم الحالة دون قبول المسؤول وموعد صالح ودليل تغليف؛ تُختبر استعادة الحالة بعد الانقطاع وتعارض التعديلات؛ لا تبدأ عمليات خارجية.', 'The case cannot advance without owner acceptance, a valid date and packing evidence. Test interrupted-session recovery and conflicting edits. No external operations start.')],
    [t('ما سنقيسه', 'What to measure'), t('وقت إكمال المهمة، عدد المتابعات، المعلومات الناقصة، التصحيحات وإجمالي جهد الموظفين مقارنة بالطريقة الحالية. تُحدد أهداف القياس مع الفريق؛ لم يُثبت وفر بعد.', 'Completion time, follow-ups, missing information, corrections and total staff effort against the current process. Agree targets with the team; savings are not yet established.')],
    [t('متى نتوقف', 'Stop conditions'), t('نتوقف عند فقد سجل أو وصول غير مصرح أو اختلاف غير قابل للمطابقة مع السجل المعتمد. زيادة الازدواجية تستدعي التعديل أو التوقف.', 'Stop for record loss, unauthorized access or a discrepancy that cannot be reconciled with the authoritative record. Increased duplication calls for revision or stopping.')],
    [t('المخرج والقرار التالي', 'Deliverable and next decision'), t('نتائج موثقة وخطة إنتاج محددة التكلفة. القرار: نستمر، نعدّل أو نتوقف. لا يُسجل هذا الملخص موافقة مؤسسية.', 'Documented findings and a costed production plan. Decide to proceed, revise or stop. This brief records no institutional approval.')],
  ];
  return `<!doctype html><html lang="${ar ? 'ar' : 'en'}" dir="${ar ? 'rtl' : 'ltr'}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${t('سدو — ملخص التجربة المقترحة', 'SADU — Proposed pilot brief')}</title><style>body{font:16px/1.65 Tahoma,Arial,sans-serif;color:#1d2a39;background:#f7f1e6;max-width:820px;margin:36px auto;padding:24px}h1{font-size:28px}h2{font-size:17px;margin-block-end:4px}p{margin-block:4px 16px}article{break-inside:avoid;border-block-start:1px solid #d5c9b6;padding-block:8px}small{color:#5b5146}@media print{body{background:white;margin:0;padding:0;font-size:11pt}h1{font-size:20pt}h2{font-size:12pt}p{margin-block-end:8px}@page{size:A4;margin:16mm}}</style><body><small>SADU · ${t('للمناقشة — بيانات تجريبية', 'For discussion — synthetic data')}</small><h1>${t('تحديد نطاق تجربة استلام واحدة', 'Scope one collection-workflow trial')}</h1>${rows.map(([title, body]) => `<article><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p></article>`).join('')}<small>${t('الربط الخارجي متوقف. لا يمثل هذا الملف عقداً أو تكليفاً أو اعتماداً حكومياً.', 'External integrations are paused. This file is not a contract, commission or government endorsement.')}</small></body></html>`;
}
