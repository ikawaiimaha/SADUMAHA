import type { CommissionState } from '../types';
import type { WorkspaceHandoff } from '../components/WorkspaceNavigation';

/** Presentation only: mirrors evidence; never grants authority or changes gates. */
export function operationalHandoff(state: CommissionState, isAr: boolean): WorkspaceHandoff {
  const message = (title: [string, string], description: [string, string], owner?: WorkspaceHandoff['owner']): WorkspaceHandoff => ({ title: title[isAr ? 0 : 1], description: description[isAr ? 0 : 1], owner });
  const contract = state.contracts[0];
  if (!contract || ['DRAFT', 'NOT_DRAFTED', 'CONTRACT_DISPUTED', 'AMENDMENT_UNDER_REVIEW'].includes(contract.status))
    return message(['بانتظار إعداد الاتفاقية', 'Agreement preparation pending'], ['المنسق: استكمال البنود وموافقة المكان', 'Coordinator: complete terms and venue clearance'], 'COORDINATOR');
  if (!['ARTIST_APPROVED', 'LOCKED'].includes(contract.status))
    return message(['الاتفاقية جاهزة للمراجعة', 'Agreement ready for review'], ['الفنان: محاكاة القبول أو طلب تعديل', 'Artist: simulate acceptance or request an amendment'], 'ARTIST');
  if (!state.evidence.prEvidenceGate || !state.evidence.technicalEvidenceGate)
    return message(['تم قبول الاتفاقية', 'Agreement accepted'], [
      `بانتظار ${!state.evidence.prEvidenceGate ? 'أدلة التشريفات ' : ''}${!state.evidence.technicalEvidenceGate ? 'والأدلة الفنية' : ''}`,
      `Waiting on ${[!state.evidence.prEvidenceGate && 'PR travel evidence', !state.evidence.technicalEvidenceGate && 'Technical structural evidence'].filter(Boolean).join(' and ')}`
    ], !state.evidence.prEvidenceGate ? 'PR_PROTOCOL' : 'TECHNICAL');
  const recorded = (tranche: 'advance' | 'delivery' | 'completion') => state.ledger?.some(row => row.tranche === tranche);
  if (!recorded('advance')) return message(['اكتملت أدلة المقدّم', 'Advance evidence complete'], ['المالية: مراجعة المقدّم وتسجيله؛ لا يشترط وصول الشحنة', 'Finance: review and record the advance; crate arrival is not required'], 'FINANCE');
  if (!state.logistics) return message(['سُجّل المقدّم', 'Advance recorded'], ['اللوجستيات: توثيق الاستلام الفعلي لدفعة التسليم', 'Logistics: record physical receipt for the delivery tranche'], 'LOGISTICS');
  if (!recorded('delivery')) return message(['وصول العمل موثق', 'Physical receipt recorded'], ['المالية: مراجعة دفعة التسليم وتسجيلها', 'Finance: review and record delivery'], 'FINANCE');
  if (!state.logistics.closedAt || !state.logistics.returnReference || !state.logistics.reconciliationReference)
    return message(['سُجّلت دفعة التسليم', 'Delivery recorded'], ['اللوجستيات: إغلاق المعرض والإعادة وتسوية الحالة', 'Logistics: exhibition closure, safe return and condition reconciliation'], 'LOGISTICS');
  if (!recorded('completion')) return message(['اكتملت أدلة الإغلاق', 'Closure evidence complete'], ['المالية: مراجعة الدفعة الختامية وتسجيلها', 'Finance: review and record completion'], 'FINANCE');
  return message(['اكتمل سجل المحاكاة', 'Rehearsal record complete'], ['لا إجراء خارجي أو تحويل مالي', 'No external action or money transfer']);
}
