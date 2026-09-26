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
    && !state.evidence.financeApprovalGate;
}

type Actor = 'PR_PROTOCOL' | 'TECHNICAL' | 'FINANCE' | string;
export type CommissionAction =
  | { type: 'contracts'; update: (contracts: BilateralContract[]) => BilateralContract[] }
  | { type: 'pr-check'; actor: Actor; field: 'passportVerified' | 'visaCleared'; value: boolean }
  | { type: 'technical-check'; actor: Actor; field: 'floorLoadVerified' | 'mountingVerified'; value: boolean }
  | { type: 'record-pr' | 'record-technical' | 'authorize-advance'; actor: Actor; at: string };

function termsKey(c?: BilateralContract): string {
  return JSON.stringify(c && [c.id, c.productionCost, c.shippingTerms, c.specialConditions,
    c.tranches.advancePercentage, c.tranches.advanceAmount, c.tranches.deliveryPercentage,
    c.tranches.deliveryAmount, c.tranches.installationPercentage, c.tranches.installationAmount]);
}

/** Shared transition guard. UI locks are not the only checks; this remains a local demo, not RBAC. */
export function commissionReducer(state: CommissionState, action: CommissionAction): CommissionState {
  const e = state.evidence;
  if (action.type === 'contracts') {
    const contracts = action.update(state.contracts).filter(c => c.artistId === COMMISSION.id).slice(0, 1);
    const before = state.contracts[0];
    const after = contracts[0];
    if (termsKey(before) !== termsKey(after)) {
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
    return { ...state, evidence: { ...e, financeApprovalGate: true, advanceAuthorizedAt: action.at } };
  }
  return state;
}
