import type { CommissionState } from '../types';
import type { EscalationRecord, PortfolioProgram, ResourceConflictReport } from '../types/chairman';

export function deriveDepartmentEvidenceStatus(departmentName: string, timestamp?: string | null, isCleared?: boolean | null, referenceId?: string | null, isAr = false) {
  const isComplete = isCleared === true && Boolean(timestamp && Number.isFinite(Date.parse(timestamp)));
  return {
    isComplete,
    label: isComplete ? `${isAr ? 'مسجّل في الجلسة' : 'Recorded in session'} · ${timestamp}` : `${isAr ? 'لم يرد تقرير' : 'Not reported'} — ${departmentName}`,
    evidenceRef: referenceId?.trim() || (isAr ? 'لا يوجد مرجع مسجّل' : 'No reference recorded'),
  };
}

export function commissionEvidence(state: CommissionState, isAr = false) {
  const advance = state.ledger?.find(row => row.tranche === 'advance');
  return [
    deriveDepartmentEvidenceStatus(isAr ? 'التشريفات' : 'PR & Protocol', state.evidence.prRecordedAt, state.evidence.prEvidenceGate, undefined, isAr),
    deriveDepartmentEvidenceStatus(isAr ? 'الفريق الفني' : 'Technical', state.evidence.technicalRecordedAt, state.evidence.technicalEvidenceGate, undefined, isAr),
    deriveDepartmentEvidenceStatus(isAr ? 'اللوجستيات' : 'Logistics', state.logistics?.receivedAt, state.logistics?.status === 'PHYSICAL_ASSET_RECEIVED', state.logistics?.reference, isAr),
    deriveDepartmentEvidenceStatus(isAr ? 'المالية — قيد الدفعة المقدمة' : 'Finance — advance ledger entry', advance?.at, Boolean(advance), undefined, isAr),
  ];
}

export function analyzePortfolioConflicts(programs: PortfolioProgram[]): ResourceConflictReport[] {
  const reports: ResourceConflictReport[] = [];
  for (let i = 0; i < programs.length; i++) for (let j = i + 1; j < programs.length; j++) {
    const a = programs[i], b = programs[j];
    const dates = [a.startDate, a.endDate, b.startDate, b.endDate].map(value => value ? Date.parse(value) : NaN);
    if (!dates.every(Number.isFinite) || dates[0] > dates[1] || dates[2] > dates[3]) continue;
    const start = Math.max(dates[0], dates[2]), end = Math.min(dates[1], dates[3]);
    if (start > end) continue;
    const resources = (a.exclusiveResourceIds ?? []).filter(id => id.trim() && b.exclusiveResourceIds?.includes(id));
    reports.push({ programA: a.id, programB: b.id, type: resources.length ? 'RESOURCE_CONFLICT' : 'POTENTIAL_OVERLAP', conflictedResources: [...new Set(resources)], datesDescription: `${new Date(start).toISOString().slice(0,10)} – ${new Date(end).toISOString().slice(0,10)}` });
  }
  return reports;
}

/** Records executive disposition only; never grants specialist or financial clearance. */
export function resolveEscalation(rows: EscalationRecord[], id: string, disposition: NonNullable<EscalationRecord['executiveDisposition']>, actor: string, at: string): EscalationRecord[] {
  if (actor !== 'CHAIRMAN' || !['APPROVED', 'REJECTED', 'DEFERRED'].includes(disposition) || !Number.isFinite(Date.parse(at))) return rows;
  const target = rows.find(row => row.id === id);
  if (!target || target.status !== 'PENDING_EXECUTIVE_ACTION' || !target.supportingEvidenceRef.trim()) return rows;
  return rows.map(row => row.id === id ? {...row, status: 'RESOLVED', executiveDisposition: disposition, decidedAt: at} : row);
}
