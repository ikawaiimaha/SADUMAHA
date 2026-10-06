import { createHash } from 'node:crypto';
import { collectionReadiness } from '../src/logistics/collectionRules.mjs';

const pair = (ar, en) => ({ ar, en });
const roles = {
  Logistics: pair('الشؤون اللوجستية', 'Logistics'), Technical: pair('الفريق الفني', 'Technical'),
  Finance: pair('المالية', 'Finance'), Editorial: pair('قسم التحرير', 'Editorial'),
  Chairman: pair('رئيس الدائرة', 'Chairman'), General_Exhibition_Coordinator: pair('المنسقة', 'General Exhibition Coordinator'),
};
const latest = (s, id) => s.collectionRevisions?.filter(r => r.artworkId === id).at(-1);
const canonical = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v)
  ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v);
const same = (a, b) => canonical(a ?? null) === canonical(b ?? null);
const ownerFor = (s, id, role, accounts, taskKey) => {
  const ownerId = role === 'Logistics' ? s.collectionAssignments?.[id]?.activeId ?? 'pilot-Logistics'
    : s.operationTasks?.[`${id}:${taskKey}`]?.ownerId ?? null;
  return { role, label: roles[role], id: ownerId, name: accounts.find(a => a.id === ownerId)?.name ?? null };
};
const item = (key, label, owner, reason) => ({ key, label, owner, reason });
const history = pair('تُحفظ الإصدارات والملفات والقرارات السابقة في السجل.', 'Earlier revisions, files and decisions remain in history.');

/** Describes the result of the real transition applied to a private copy. Never writes a record. */
export function amendmentImpact(before, after, actor, id, command, accounts) {
  const result = { required: false, version: before.version, token: null, changes: [], renewals: [], retained: [], next: null };
  const change = (label, oldValue, newValue) => {
    if (!same(oldValue, newValue)) result.changes.push({ label, before: oldValue ?? null, after: newValue ?? null });
  };
  const owner = (role, taskKey) => ownerFor(before, id, role, accounts, taskKey);
  const old = latest(before, id), next = latest(after, id);
  if (old && (command.action === 'SAVE' || command.action === 'PLAN' && old.plan || command.action === 'REOPEN' && old.packing) && old.id !== next?.id) {
    result.required = true;
    if (command.action === 'SAVE') {
      for (const [key, label] of Object.entries({ address: pair('عنوان الاستلام', 'Collection address'), city: pair('المدينة', 'City'), country: pair('البلد', 'Country'), contact: pair('جهة الاتصال', 'Contact'), sourceRef: pair('مرجع المصدر', 'Source reference'), timezone: pair('المنطقة الزمنية', 'Timezone'), availability: pair('فترة الإتاحة', 'Availability'), closures: pair('فترات الإغلاق', 'Closures'), conflict: pair('تعارض المعلومات', 'Conflicting information') })) change(label, old[key], next[key]);
    } else if (command.action === 'PLAN') change(pair('موعد الاستلام', 'Pickup date'), old.plan?.pickupDate, next.plan?.pickupDate);
    else change(pair('خطة التغليف', 'Packing plan'), old.packing?.specification, null);
    const reason = pair('مرتبط بنطاق الاستلام السابق؛ يلزم تأكيد جديد.', 'Bound to the previous collection scope; a fresh check is required.');
    if (old.confirmation && !next.confirmation) result.renewals.push(item('source', pair('تأكيد بيانات المصدر', 'Source confirmation'), owner('Logistics'), reason));
    if (old.plan && !next.plan) result.renewals.push(item('pickup', pair('تأكيد خطة الاستلام', 'Pickup planning'), owner('Logistics'), reason));
    if (old.packing && !next.packing) {
      if (old.packing.technicalReference) result.renewals.push(item('technical', pair('اعتماد التغليف الفني', 'Technical packing clearance'), owner('Technical', 'packing-technical'), reason));
      if (old.packing.costReference) result.renewals.push(item('cost', pair('اعتماد تكلفة التغليف', 'Packing cost approval'), owner('Finance', 'packing-cost'), reason));
      if (old.packing.evidence) result.renewals.push(item('packing', pair('فحص اكتمال التغليف', 'Packing completion check'), owner('Logistics'), reason));
      if (old.packing.requiresTechnical === false) result.renewals.push(item('technical-scope', pair('مبرر عدم الحاجة لمراجعة فنية', 'Technical-review exemption'), owner('Logistics'), pair('يجب إعادة تقييم المبرر مع خطة التغليف الجديدة.', 'Reassess the reason with the new packing plan.')));
    }
    if (old.confirmation && same(old.confirmation, next.confirmation)) result.retained.push(pair('تأكيد العنوان وبيانات المصدر.', 'Confirmed address and source details.'));
    if (old.plan && same(old.plan, next.plan)) result.retained.push(pair('خطة الاستلام الحالية.', 'The current pickup plan.'));
    if (before.collectionAssignments?.[id]?.acceptedBy) result.retained.push(pair('قبول مسؤولية الاستلام من الموظف المسمى.', 'The named owner’s acceptance of collection responsibility.'));
    result.retained.push(pair('سجلات الحالة والاتفاق والطباعة لا تتغير؛ تبقى أي تعليقات قائمة سارية.', 'Condition, agreement and print records are unchanged; existing holds still apply.'), history);
    const a = after.collectionAssignments?.[id] ?? {};
    const readiness = collectionReadiness({ details: !!next, conflict: next?.conflict, confirmed: !!next?.confirmation, planned: !!next?.plan, accepted: !!a.activeId && a.acceptedBy === a.activeId, packing: next?.packing });
    const labels = {
      ACCEPTANCE_REQUIRED: pair('قبول مسؤولية الاستلام', 'Accept collection responsibility'),
      CONFLICT_REQUIRES_RESOLUTION: pair('حل تعارض بيانات المصدر', 'Resolve conflicting source details'),
      SOURCE_CONFIRMATION_REQUIRED: pair('إعادة تأكيد بيانات المصدر', 'Reconfirm source details'),
      PICKUP_PLAN_REQUIRED: pair('اختيار موعد استلام صالح', 'Choose a valid pickup date'),
      PACKING_REQUIRED: pair('تسجيل خطة تغليف جديدة ثم استكمال مراجعاتها', 'Record a new packing plan, then complete its reviews'),
    };
    result.next = item('next', labels[readiness.state] ?? pair('مراجعة متطلبات الاستلام', 'Review collection prerequisites'), owner(readiness.role), pair('تظل الجاهزية معلّقة حتى استكمال المتطلبات.', 'Readiness stays on hold until the prerequisites are complete.'));
  }
  if (command.action === 'SET_PRINT_PACKAGE') {
    const oldJob = before.printJobs?.[id], newJob = after.printJobs?.[id];
    const oldPackage = oldJob?.packages.find(p => p.revision === oldJob.record.version);
    const newPackage = newJob?.packages.find(p => p.revision === newJob.record.version);
    if (oldPackage && newPackage && oldPackage.revision !== newPackage.revision) {
      result.required = true;
      const fileLabel = pkg => { const f = before.operationalEvidence?.find(e => e.id === pkg.proofId); return `${f?.name ?? 'PDF'} · ${pkg.proofHash}`; };
      change(pair('ملف البروفة', 'Proof PDF'), fileLabel(oldPackage), fileLabel(newPackage));
      for (const [key, label] of Object.entries({ supplier: pair('المورد', 'Supplier'), quantity: pair('الكمية', 'Quantity'), size: pair('المقاس والهوامش', 'Size and bleed'), stock: pair('الخامة', 'Stock'), finishing: pair('التشطيب', 'Finishing'), profile: pair('مواصفات الفحص', 'Preflight profile'), deliveryDate: pair('موعد التسليم', 'Delivery date') })) change(label, oldPackage.spec[key], newPackage.spec[key]);
      const reason = pair('المراجعة تخص الملف والمواصفات في الإصدار السابق.', 'The review belongs to the previous file and specification.');
      if (oldPackage.preflight) result.renewals.push(item('preflight', pair('الفحص الفني للملف', 'PDF preflight'), owner('Technical'), reason));
      if (oldJob.record.review) result.renewals.push(item('editorial', pair('مراجعة النصين وصلاحيات الاستخدام', 'Bilingual and usage-rights review'), owner('Editorial', 'print-review'), reason));
      if (oldJob.record.decision) result.renewals.push(item('executive', pair('قرار اعتماد الطباعة', 'Print authorization decision'), owner('Chairman'), reason));
      if (oldJob.record.dispatch) result.renewals.push(item('dispatch', pair('تسجيل تسليم البروفة للمورد', 'Proof dispatch record'), owner('Editorial', 'print-review'), reason));
      if (oldJob.record.supplierAck) result.renewals.push(item('supplier', pair('تأكيد المورد للملف والمواصفات', 'Supplier acknowledgment of file and specification'), owner('Editorial', 'print-review'), pair('يُطلب تأكيد جديد من المورد ويسجله قسم التحرير.', 'Obtain a fresh supplier acknowledgment; Editorial records it.')));
      result.retained.push(pair('بيانات الاستلام والتغليف والحالة والاتفاق لا تتغير.', 'Collection, packing, condition and agreement records are unchanged.'), history);
      if (oldJob.record.production || oldJob.deliveries.length) result.retained.push(pair('الإنتاج والاستلام السابقان يبقيان موثقين، ولا يُحتسبان لإصدار الطباعة الجديد.', 'Earlier production and deliveries remain recorded; they do not count toward the new package.'));
      result.next = item('next', pair('إرفاق فحص فني جديد قبل إحالة المراجعة', 'Attach a new preflight report before routing for review'), { ...owner('Technical'), label: pair('الفريق الفني أو قسم التحرير', 'Technical or Editorial') }, pair('ثم مراجعة قسم التحرير واعتماد رئيس الدائرة قبل تسليم البروفة للمورد.', 'Then Editorial review and Chairman authorization precede dispatch to the supplier.'));
    }
  }
  if (result.required) {
    const { impactToken, operationId, ...input } = command;
    result.token = createHash('sha256').update(canonical({ actorId: actor.id, artworkId: id, input, impact: result })).digest('hex');
  }
  return result;
}

export function requireImpactConfirmation(impact, command) {
  if (impact.required && command.impactToken !== impact.token) throw Object.assign(new Error('Review the amendment impact for these exact changes before saving.'), { status: 409 });
}

export function recordImpactReview(state, actor, id, command, impact) {
  if (!impact.required) return;
  // Preserve attribution without copying addresses or other private draft content into audit entries.
  const decision = state.decisions.at(-1);
  if (decision?.actorId === actor.id && decision.targetId === id) decision.amendmentReview = {
    token: impact.token, version: impact.version, action: command.action,
    renewedChecks: impact.renewals.map(r => r.key), reviewedBy: actor.id, reviewedAt: decision.at,
  };
}
