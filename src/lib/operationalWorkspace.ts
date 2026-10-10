import type { CollectionView } from './useCollectionWorkflow';
import type { OperationsView } from '../components/ConnectedOperations';
import type { RenewalTask } from '../components/RenewalQueue';
import { selectPublishingRecord } from '../data/publishingRecord';

export type Language = 'ar' | 'en';
export type Copy = { ar: string; en: string };
export const copy = (ar: string, en: string): Copy => ({ ar, en });
export const roleLabels: Record<string, Copy> = {
  Logistics: copy('الشؤون اللوجستية', 'Logistics'), Technical: copy('الفريق الفني', 'Technical'), Finance: copy('المالية', 'Finance'),
  Editorial: copy('قسم التحرير', 'Editorial'), Chairman: copy('رئيس الدائرة', 'Chairman'), Director: copy('مدير الملتقى', 'Director'),
  General_Exhibition_Coordinator: copy('المنسقة', 'General Exhibition Coordinator'), Exhibition_Coordinator: copy('منسقة المعرض', 'Exhibition Coordinator'),
  Artist: copy('الفنان', 'Artist'), PR: copy('العلاقات العامة', 'PR'), Committee: copy('اللجنة التحضيرية', 'Committee'),
  Museum_Operations: copy('إدارة المتحف', 'Museum Operations'), PREPARATORY_COMMITTEE_SPECTATOR: copy('اللجنة التحضيرية — مشاهدة', 'Committee — read only'),
};
export function accountLabel(account: { id: string; name: string; role: string }, language: Language): string {
  if (!account.id.startsWith('pilot-')) return account.name;
  return (roleLabels[account.role]?.[language] ?? account.name) + (/backup/i.test(account.name) ? (language === 'ar' ? ' — البديل' : ' — backup') : '');
}
export const taskTitles: Record<string, Copy> = {
  source: copy('تأكيد عنوان الاستلام', 'Confirm collection address'), pickup: copy('تحديد موعد الاستلام', 'Plan pickup date'),
  plan: copy('إعداد خطة التغليف', 'Prepare packing plan'), technical: copy('مراجعة التغليف فنياً', 'Review packing specification'),
  cost: copy('مراجعة تكلفة التغليف', 'Review packing cost'), packing: copy('فحص دليل التغليف', 'Inspect packing evidence'),
  package: copy('إعداد أمر الطباعة', 'Prepare print package'), preflight: copy('فحص ملف الطباعة', 'Inspect print preflight'),
  editorial: copy('مراجعة النص وحقوق الاستخدام', 'Review bilingual proof and rights'), executive: copy('اعتماد أمر الطباعة', 'Authorize print package'),
  dispatch: copy('توثيق تسليم البروفة للمورد', 'Record proof dispatch'), supplier: copy('توثيق تأكيد المورد', 'Record supplier acknowledgment'),
  start: copy('تسجيل بدء الطباعة', 'Record printing started'), production: copy('تسجيل اكتمال الطباعة', 'Record production completion'),
  delivery: copy('تسجيل الدفعة المستلمة', 'Record a delivery'), acceptance: copy('فحص الدفعة وقبولها', 'Inspect and accept delivery'),
  stop: copy('توثيق إيقاف المورد', 'Record supplier stop'), correction: copy('الإبلاغ عن تصحيح', 'Report a correction'),
  owners: copy('إدارة المسؤول والبديل', 'Manage owner and backup'), acceptCollection: copy('قبول مسؤولية الاستلام', 'Accept collection responsibility'),
  amendSource: copy('تعديل بيانات الاستلام', 'Amend collection details'), amendPickup: copy('تعديل موعد الاستلام', 'Amend pickup date'),
  reopen: copy('تعديل خطة التغليف', 'Amend packing plan'), amendPackage: copy('إصدار بروفة جديدة', 'Create a new print revision'),
  tRecord: copy('تسجيل المعالجة المشروطة', 'Record the conditional treatment'), amendTreatment: copy('تعديل إصدار المعالجة', 'Revise the treatment'),
  tAuthorize: copy('تسجيل تفويض تجربة الحرف الواحد', 'Record one-letter trial authorization'),
  tVenue: copy('مراجعة متطلب الموقع', 'Clear the venue requirement'), tEngineering: copy('مراجعة المتطلب الهندسي', 'Clear the engineering requirement'),
  tFinancial: copy('مراجعة المتطلب المالي', 'Clear the financial requirement'), tOther: copy('مراجعة شرط آخر', 'Clear the other condition'),
  tSample: copy('تجربة حرف واحد وصورتها', 'One-letter trial and photograph'), tArtist: copy('مراجعة الفنان لصورة العيّنة', 'Artist review of the trial photograph'),
  tComplete: copy('تسجيل اكتمال المعالجة', 'Record batch completion'),
};
export type WorkspaceTask = {
  id: string; key: string; kind: 'collection' | 'print' | 'treatment'; title: Copy; status: 'now' | 'waiting' | 'complete';
  ownerId: string | null; ownerRole: string; blocker: string; canAct: boolean; acceptance?: 'renewal' | 'legacy';
  dueAt?: string | null; overdue?: boolean; renewal?: RenewalTask; legacyKey?: string; evidenceIds: string[];
};
export const complete = (t: RenewalTask) => ['COMPLETE', 'NOT_REQUIRED'].includes(t.status);
// Employee-facing descriptions. These explain existing holds; they never clear them.
export function readinessExplanation(value: string, language: Language): string {
  const descriptions: Record<string, Copy> = {
    'Packing requirements are unresolved. Record the plan and named packing owner.': copy('لم تُسجّل خطة التغليف واسم المسؤول عن تنفيذها بعد.', 'The packing plan and the person responsible for it have not been recorded yet.'),
    'Inspect and verify the packing photograph or PDF for the current plan.': copy('بعد إتمام التغليف، تتحقق الشؤون اللوجستية من صورته أو ملفه.', 'After packing is complete, Logistics must check its photograph or PDF.'),
    'Publish the current artwork revision first.': copy('الإصدار الحالي للعمل لم يُعتمد ويُثبت في السجل بعد.', 'The current artwork version still needs approval and publication in the work record.'),
  };
  return descriptions[value]?.[language] ?? localized(value, language);
}
export function waitingExplanation(task: WorkspaceTask, owner: string, language: Language): string {
  if (task.status !== 'waiting') return '';
  if (task.renewal && ['UNASSIGNED', 'RETURNED'].includes(task.renewal.status))
    return language === 'ar' ? 'بانتظار المنسقة لتعيين المسؤول والموعد.' : 'Waiting for the Coordinator to assign an owner and deadline.';
  if (task.renewal?.status === 'ASSIGNED')
    return language === 'ar' ? `بانتظار ${owner} لقبول المهمة.` : `Waiting for ${owner} to accept the task.`;
  return task.blocker ? localized(task.blocker, language) : language === 'ar' ? `بانتظار إجراء من ${owner}.` : `Waiting for ${owner} to act.`;
}
export function localized(value: string, language: Language): string {
  // Only controlled workflow messages use this helper; never split user-authored evidence or notes.
  const pair = value.split(' / ');
  if (pair.length === 2) return pair[language === 'ar' ? 0 : 1];
  if (language === 'en') return value;
  const messages: Record<string, string> = {
    'Record the physical collection address and availability.': 'سجّل عنوان الاستلام الفعلي وفترة الإتاحة.',
    'The named Logistics owner must accept this handoff.': 'يجب أن يقبل المسؤول اللوجستي المعيّن هذه المهمة.',
    'Resolve conflicting collection information before planning.': 'حلّ تعارض معلومات الاستلام قبل تحديد الموعد.',
    'Confirm the address, contact and availability against source evidence.': 'راجع العنوان وجهة الاتصال وفترة الإتاحة مقابل المصدر، ثم أكدها.',
    'Choose a pickup date within the confirmed availability and outside closures.': 'اختر موعد استلام ضمن الإتاحة المؤكدة وخارج فترات الإغلاق.',
    'Packing requirements are unresolved. Record the plan and named packing owner.': 'التغليف غير محسوم. سجّل الخطة واسم مسؤول تنفيذها.',
    'Finance must record cost approval, including zero-cost arrangements.': 'على المالية تسجيل مراجعة التكلفة، حتى عند عدم وجود تكلفة إضافية.',
    'Check completed packing against the cleared plan and record evidence.': 'افحص التغليف المنفذ مقابل الخطة المعتمدة وسجّل الدليل.',
    'Pickup must fall within the confirmed local-date availability window.': 'اختر موعداً ضمن فترة الإتاحة المؤكدة بتوقيت موقع الاستلام.',
    'Pickup conflicts with a confirmed closure (both boundary dates are closed).': 'الموعد يقع ضمن إغلاق مؤكد للموقع. اختر يوماً خارج فترة الإغلاق، بما فيها يوم البداية والنهاية.',
    'Provide a reason and a future deadline.': 'أدخل سبب التعيين وموعداً نهائياً في المستقبل.',
    'The shared record changed. Refresh and review before retrying.': 'تغيّر السجل المشترك. حدّثه وراجعه قبل المحاولة مجدداً.',
    'Shared record changed. Refresh and review before saving.': 'تغيّر السجل المشترك. حدّثه وراجعه قبل الحفظ.',
    'Choose distinct Logistics owners, an active owner and a handover reason.': 'اختر مسؤولاً أساسياً وبديلًا مختلفين، وحدد من يتولى المهمة الآن وسبب التسليم.',
    'Resolve conflicts and explicitly verify the source before confirmation.': 'حلّ تعارض المعلومات وراجع المصدر قبل تأكيده.',
    'Enter a valid collection timezone, for example Europe/Paris.': 'أدخل منطقة زمنية صحيحة لموقع الاستلام، مثل Europe/Paris.',
    'The named task owner must accept this handoff first.': 'على المسؤول المعيّن قبول المهمة أولاً.',
    'The named Logistics owner must accept this handoff first.': 'على المسؤول اللوجستي المعيّن قبول التسليم أولاً.',

    'The packing plan needs specialist clearance before cost approval or completion.': 'خطة التغليف تحتاج إلى مراجعة فنية قبل اعتماد التكلفة أو تأكيد الاكتمال.',
    'Inspect and verify the packing photograph or PDF for the current plan.': 'يلزم فحص صورة التغليف أو ملفه للإصدار الحالي.',
    'Publish the current artwork revision first.': 'يلزم اعتماد ونشر الإصدار الحالي للعمل أولاً.',
    'Pickup window has elapsed; confirm new availability and a new plan.': 'انقضى موعد الاستلام؛ أكّد فترة الإتاحة وموعداً جديداً.',
    'No named task owner recorded.': 'لم يُعيّن مسؤول لهذه المهمة.',
    'The assigned owner has not accepted.': 'المسؤول المعيّن لم يقبل المهمة بعد.',
    'Review the current evidence.': 'راجع دليل الإصدار الحالي.',
    'This is no longer a pending collection.': 'هذا السجل لم يعد في مرحلة انتظار الاستلام.',
  };
  return messages[value] ?? value;
}

/** A presentation projection, never an authorization decision. The service rechecks every command. */
export function workspaceTasks(ops: OperationsView, collection: CollectionView | undefined, actor: { id: string; role: string }): WorkspaceTask[] {
  const coordinator = actor.role === 'General_Exhibition_Coordinator';
  const tasks: WorkspaceTask[] = [];
  const cycles = (ops.renewals ?? []).filter(c => !c.supersededAt);
  for (const cycle of cycles) for (const task of cycle.tasks) {
    const acceptance = task.ownerId === actor.id && task.status === 'ASSIGNED';
    const assign = coordinator && !complete(task) && !task.ownerId;
    tasks.push({ id: task.id, key: task.key, kind: cycle.kind as 'collection' | 'print', title: taskTitles[task.key],
      status: complete(task) ? 'complete' : task.canAct || acceptance || assign ? 'now' : 'waiting', ownerId: task.ownerId,
      ownerRole: task.roles[0], blocker: task.blocker, canAct: task.canAct, acceptance: acceptance ? 'renewal' : undefined,
      dueAt: task.dueAt, overdue: task.overdue, renewal: task, evidenceIds: task.evidenceIds });
  }
  const add = (key: string, kind: WorkspaceTask['kind'], ownerRole: string, ready: boolean, blocker = '', ownerId: string | null = null, evidenceIds: string[] = []) => {
    if (tasks.some(t => t.key === key && t.kind === kind)) return;
    const legacyKey = { technical: 'packing-technical', cost: 'packing-cost', editorial: 'print-review' }[key];
    const legacy = ops.tasks.find(t => !t.renewal && t.key === legacyKey);
    ownerId = legacy?.ownerId ?? ownerId;
    const owns = ownerId ? ownerId === actor.id : ownerRole === actor.role || ownerRole === 'Technical' && key === 'preflight' && actor.role === 'Editorial';
    const canAct = ready && owns && (!legacy?.ownerId || !!legacy.accepted);
    const acceptance = !!legacy?.ownerId && owns && !legacy.accepted;
    tasks.push({ id: `${kind}:${key}`, key, kind, title: taskTitles[key], status: canAct || acceptance || coordinator && !!legacy && !ownerId ? 'now' : 'waiting',
      ownerId, ownerRole, blocker: blocker || legacy?.blocker || '', canAct, acceptance: acceptance ? 'legacy' : undefined,
      legacyKey: legacy ? legacyKey : undefined, dueAt: legacy?.dueAt, overdue: legacy?.overdue, evidenceIds });
  };
  if (collection && ops.readiness) {
    const r = collection.record, a = collection.assignment;
    if (a.acceptedBy !== a.activeId) add('acceptCollection', 'collection', 'Logistics', true, '', a.activeId);
    const accepted = a.acceptedBy === a.activeId;
    if (r?.conflict) add('amendSource', 'collection', 'Logistics', accepted, 'Resolve conflicting collection information before planning.', a.activeId);
    else if (!r?.confirmation) add('source', 'collection', 'Logistics', accepted, accepted ? '' : 'بانتظار قبول مسؤولية الاستلام / Awaiting collection acceptance', a.activeId);
    else if (!r.plan || ops.readiness.expired) add('pickup', 'collection', 'Logistics', accepted, ops.readiness.expired ? 'Pickup window has elapsed; confirm new availability and a new plan.' : '', a.activeId);
    else if (!r.packing) add('plan', 'collection', 'Logistics', accepted, '', a.activeId);
    else if (collection.state === 'TECHNICAL_REVIEW_REQUIRED') add('technical', 'collection', 'Technical', accepted);
    else if (collection.state === 'COST_REVIEW_REQUIRED') add('cost', 'collection', 'Finance', accepted);
    else if (!ops.readiness.packingVerified) add('packing', 'collection', 'Logistics', accepted && ['PACKING_EVIDENCE_REQUIRED', 'READY_FOR_COLLECTION'].includes(collection.state ?? ''), '', a.activeId, ops.files.filter(f => f.kind === 'PACKING').map(f => f.id));
  }
  if (ops.job) {
    const job = ops.job, pkg = job.packages.find(p => p.revision === job.record.version), stage = selectPublishingRecord(job.record).stage;
    const proof = pkg ? [pkg.proofId, ...(pkg.preflight ? [pkg.preflight.evidenceId] : [])] : [];
    const prepare = ['Exhibition_Coordinator', 'General_Exhibition_Coordinator'].includes(actor.role) ? actor.role : 'Exhibition_Coordinator';
    if (stage === 'correction') {
      // Renewal tasks remain inspectable but cannot compete with the required stop/replacement action.
      for (const t of tasks.filter(t => t.kind === 'print' && t.status !== 'complete')) { t.status = 'waiting'; t.canAct = false; t.acceptance = undefined; }
      if (job.record.dispatch && !job.record.correction?.stopReference) add('stop', 'print', 'Editorial', true, '', null, proof);
      else add('package', 'print', prepare, true, '', null, proof);
    } else if (!pkg) add('package', 'print', prepare, true);
    else {
      if (stage === 'manager-review') {
        if (!pkg.preflight?.passed) add('preflight', 'print', 'Technical', true, '', null, proof);
        else add('editorial', 'print', 'Editorial', true, '', null, proof);
      }
      const next = { 'executive-review': ['executive', 'Chairman'], released: ['dispatch', 'Editorial'], sent: ['supplier', 'Editorial'], acknowledged: ['start', 'Editorial'], printing: ['production', 'Editorial'] }[stage];
      if (next) add(next[0], 'print', next[1], true, '', null, proof);
      if (stage === 'completed') {
        const delivered = job.deliveries.filter(d => d.revision === pkg.revision).reduce((n, d) => n + d.quantity, 0);
        if (delivered < (pkg.completedQuantity ?? 0)) add('delivery', 'print', 'Editorial', true, '', null, proof);
        if (job.deliveries.some(d => d.revision === pkg.revision && !d.acceptance)) add('acceptance', 'print', 'General_Exhibition_Coordinator', true, '', null, proof);
      }
    }
  }
  // Presentation of the SYNTHETIC treatment case. The server computes who can act; nothing is decided here.
  for (const s of ops.treatment?.steps ?? []) {
    if (!(coordinator || s.ownerRole === actor.role || !!s.authModes?.length)) continue;
    tasks.push({ id: `treatment:${s.key}`, key: s.key, kind: 'treatment', title: taskTitles[s.key], ownerId: s.ownerId, ownerRole: s.ownerRole, blocker: s.blocker,
      status: s.state === 'done' ? 'complete' : s.canAct || s.acceptance || s.assign ? 'now' : 'waiting', canAct: s.canAct, acceptance: s.acceptance ? 'legacy' : undefined,
      legacyKey: s.key === 'tSample' ? 'treatment-trial' : undefined, dueAt: s.dueAt, overdue: s.overdue, evidenceIds: s.evidenceIds });
  }
  return tasks.sort((a, b) => ({ now: 0, waiting: 1, complete: 2 }[a.status] - { now: 0, waiting: 1, complete: 2 }[b.status]) || Number(!!b.overdue) - Number(!!a.overdue));
}

export function retainTaskSelection(selectedId: string | null, tasks: WorkspaceTask[]) {
  // A replaced/completed task must not silently redirect somebody who is reviewing it.
  return selectedId ?? tasks.find(t => t.status === 'now')?.id ?? tasks[0]?.id ?? null;
}
