export type ChairmanViewMode = 'PORTFOLIO' | 'PROGRAM_DECISIONS';
export interface PortfolioProgram {
  id: string;
  nameEn: string;
  nameAr: string;
  locationEn?: string;
  locationAr?: string;
  startDate?: string;
  endDate?: string;
  assignedCoordinatorId?: string;
  assignedCoordinatorName?: string;
  venueKey?: string;
  /** Explicit exclusive bookings only; a shared venue alone is not a conflict. */
  exclusiveResourceIds?: string[];
  isLiveSessionProgram: boolean;
  budgetCeilingAED?: number;
  sessionThemeArabic?: string;
}
export interface ResourceConflictReport {
  programA: string;
  programB: string;
  type: 'POTENTIAL_OVERLAP' | 'RESOURCE_CONFLICT';
  conflictedResources: string[];
  datesDescription: string;
}
export interface EscalationRecord {
  id: string;
  programId: string;
  programName: string;
  originatingDepartment: 'Coordination' | 'Technical' | 'Finance' | 'PR & Protocol';
  reason: string;
  supportingEvidenceRef: string;
  requestedDecision: string;
  status: 'PENDING_EXECUTIVE_ACTION' | 'RESOLVED';
  executiveDisposition?: 'APPROVED' | 'REJECTED' | 'DEFERRED';
  submittedAt: string;
  decidedAt?: string;
  decisionHistory?: { disposition: 'APPROVED' | 'REJECTED' | 'DEFERRED'; at: string }[];
}

export interface EscalationInput {
  id: string;
  reason: string;
  supportingEvidenceRef: string;
  requestedDecision: string;
}
