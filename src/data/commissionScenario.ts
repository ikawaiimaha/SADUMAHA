import type { CommissionState } from '../types';
import type { BilateralContract } from '../types/contractStage6';

export const COMMISSION = {
  id: 'demo-kufic-horizon',
  artistName: 'Noura Al Mazrouei',
  artistNameAr: 'نورة المزروعي',
  title: 'Kufic Horizon: Architectural Bronze & Black Oxide',
  titleAr: 'أفق كوفي: برونز معماري وأكسيد أسود',
  weightKg: 84,
} as const;

export const emptyEvidence = (): CommissionState['evidence'] => ({
  passportVerified: false, visaCleared: false, prEvidenceGate: false,
  floorLoadVerified: false, mountingVerified: false, technicalEvidenceGate: false,
  financeApprovalGate: false,
});

export const createCommission = (): CommissionState => ({
  contracts: [], agreementRevision: 0, evidence: emptyEvidence(),
});

export function validAgreement(contract?: BilateralContract): boolean {
  if (!contract || !Number.isFinite(contract.productionCost) || contract.productionCost <= 0) return false;
  const t = contract.tranches;
  const percentages = [t.advancePercentage, t.deliveryPercentage, t.installationPercentage];
  const amounts = [t.advanceAmount, t.deliveryAmount, t.installationAmount];
  return percentages.every(n => Number.isFinite(n) && n > 0 && n <= 100)
    && Math.abs(percentages.reduce((a, b) => a + b, 0) - 100) < 0.000001
    && amounts.every(n => Number.isFinite(n) && n > 0)
    && Math.abs(amounts.reduce((a, b) => a + b, 0) - contract.productionCost) < 0.01;
}

export function advanceEligible(state: CommissionState): boolean {
  const c = state.contracts[0];
  return validAgreement(c) && (c.status === 'ARTIST_APPROVED' || c.status === 'LOCKED')
    && state.evidence.prEvidenceGate && state.evidence.technicalEvidenceGate
    && !state.evidence.financeApprovalGate && !state.ledger?.some(row => row.tranche === 'advance');
}

export function milestoneEligible(state: CommissionState, tranche: 'delivery' | 'completion'): boolean {
  const c = state.contracts[0];
  return validAgreement(c) && (c.status === 'ARTIST_APPROVED' || c.status === 'LOCKED')
    && !state.ledger?.some(row => row.tranche === tranche)
    && (tranche === 'delivery' ? state.logistics?.status === 'PHYSICAL_ASSET_RECEIVED'
      : Boolean(state.logistics?.closedAt && state.logistics?.returnReference && state.logistics?.reconciliationReference));
}

type Actor = 'PR_PROTOCOL' | 'TECHNICAL' | 'FINANCE' | string;
export type CommissionAction =
  | { type: 'receive-asset'; actor: Actor; at: string; reference: string }
  | { type: 'close-exhibition'; actor: Actor; at: string; returnReference: string; reconciliationReference: string }
  | { type: 'request-saf'; actor: Actor; at: string; technicians: number; hours: number; rationale: string }
  | { type: 'record-tranche'; actor: Actor; at: string; tranche: 'delivery' | 'completion' }
  | { type: 'contracts'; update: (contracts: BilateralContract[]) => BilateralContract[] }
  | { type: 'pr-check'; actor: Actor; field: 'passportVerified' | 'visaCleared'; value: boolean }
  | { type: 'technical-check'; actor: Actor; field: 'floorLoadVerified' | 'mountingVerified'; value: boolean }
  | { type: 'record-pr' | 'record-technical' | 'authorize-advance'; actor: Actor; at: string };

function termsKey(c?: BilateralContract): string {
  return JSON.stringify(c && [c.id, c.productionCost, c.shippingTerms, c.specialConditions, c.venue, c.venueClearanceReference,
    c.tranches.advancePercentage, c.tranches.advanceAmount, c.tranches.deliveryPercentage,
    c.tranches.deliveryAmount, c.tranches.installationPercentage, c.tranches.installationAmount]);
}

function recordLedger(state: CommissionState, tranche: 'advance' | 'delivery' | 'completion', at: string): CommissionState {
  const contract = state.contracts[0];
  const prefix = tranche === 'completion' ? 'installation' : tranche;
  const amount = contract.tranches[`${prefix}Amount`];
  return { ...state,
    ledger: [...(state.ledger || []), { tranche, amount, at, revision: state.agreementRevision }],
    contracts: [{ ...contract, tranches: { ...contract.tranches, [`${prefix}Status`]: 'DISBURSED', [`${prefix}DisbursedAt`]: at } }]
  };
}

/** Shared transition guard. UI locks are not the only checks; this remains a local demo, not RBAC. */
export function commissionReducer(state: CommissionState, action: CommissionAction): CommissionState {
  const e = state.evidence;
  const c = state.contracts[0];
  const accepted = c?.status === 'ARTIST_APPROVED' || c?.status === 'LOCKED';
  if (action.type === 'receive-asset' && action.actor === 'LOGISTICS' && accepted && action.reference.trim() && !state.logistics) {
    return { ...state, logistics: { status: 'PHYSICAL_ASSET_RECEIVED', reference: action.reference.trim(), receivedAt: action.at } };
  }
  if (action.type === 'close-exhibition' && action.actor === 'LOGISTICS' && accepted && state.logistics && !state.logistics.closedAt
    && action.returnReference.trim() && action.reconciliationReference.trim()) {
    return { ...state, logistics: { ...state.logistics, closedAt: action.at, returnReference: action.returnReference.trim(), reconciliationReference: action.reconciliationReference.trim() } };
  }
  if (action.type === 'request-saf' && action.actor === 'TECHNICAL' && c && !state.safRequest
    && Number.isInteger(action.technicians) && action.technicians > 0 && Number.isFinite(action.hours) && action.hours > 0 && action.rationale.trim()) {
    return { ...state, safRequest: { technicians: action.technicians, hours: action.hours, rationale: action.rationale.trim(), requestedAt: action.at } };
  }
  if (action.type === 'record-tranche' && action.actor === 'FINANCE' && milestoneEligible(state, action.tranche)) {
    return recordLedger(state, action.tranche, action.at);
  }
  if (action.type === 'contracts') {
    const contracts = action.update(state.contracts).filter(c => c.artistId === COMMISSION.id).slice(0, 1);
    const before = state.contracts[0];
    const after = contracts[0];
    if (termsKey(before) !== termsKey(after)) {
      if (state.ledger?.length) return state;
      return { contracts, agreementRevision: state.agreementRevision + 1, evidence: emptyEvidence() };
    }
    const passportChanged = before?.documents.passportUploadedAt !== after?.documents.passportUploadedAt
      || before?.documents.passportFileName !== after?.documents.passportFileName;
    const contractSuspended = before?.status !== after?.status
      && after?.status !== 'ARTIST_APPROVED' && after?.status !== 'LOCKED';
    return { ...state, contracts, evidence: contractSuspended ? emptyEvidence() : passportChanged
      ? { ...e, passportVerified: false, prEvidenceGate: false, financeApprovalGate: false,
          prRecordedAt: undefined, advanceAuthorizedAt: undefined } : e };
  }
  if (action.type === 'pr-check' && action.actor === 'PR_PROTOCOL') {
    return { ...state, evidence: { ...e, [action.field]: action.value, prEvidenceGate: false,
      prRecordedAt: undefined, financeApprovalGate: false, advanceAuthorizedAt: undefined } };
  }
  if (action.type === 'technical-check' && action.actor === 'TECHNICAL') {
    return { ...state, evidence: { ...e, [action.field]: action.value, technicalEvidenceGate: false,
      technicalRecordedAt: undefined, financeApprovalGate: false, advanceAuthorizedAt: undefined } };
  }
  if (action.type === 'record-pr' && action.actor === 'PR_PROTOCOL' && state.contracts.length
    && e.passportVerified && e.visaCleared) {
    return { ...state, evidence: { ...e, prEvidenceGate: true, prRecordedAt: action.at } };
  }
  if (action.type === 'record-technical' && action.actor === 'TECHNICAL' && state.contracts.length
    && e.floorLoadVerified && e.mountingVerified) {
    return { ...state, evidence: { ...e, technicalEvidenceGate: true, technicalRecordedAt: action.at } };
  }
  if (action.type === 'authorize-advance' && action.actor === 'FINANCE' && advanceEligible(state)) {
    return recordLedger({ ...state, evidence: { ...e, financeApprovalGate: true, advanceAuthorizedAt: action.at } }, 'advance', action.at);
  }
  return state;
}
