import { acceptedForCatalog, validCatalogFields } from './catalogMetadata';
import { conditionTransition, damageHold, type ConditionAction } from './conditionReporting';
import { validParticipationScope } from './soloInvitation2026';
import { validCrate, vehicleTypes } from './installationOperations';
import type { CommissionState } from '../types';
import type { BilateralContract, NegotiationRound } from '../types/contractStage6';

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
  if (!contract || !validParticipationScope(contract) || !Number.isFinite(contract.productionCost) || contract.productionCost <= 0) return false;
  const t = contract.tranches;
  const percentages = [t.advancePercentage, t.deliveryPercentage, t.installationPercentage];
  const amounts = [t.advanceAmount, t.deliveryAmount, t.installationAmount];
  return percentages.every(n => Number.isFinite(n) && n > 0 && n <= 100)
    && Math.abs(percentages.reduce((a, b) => a + b, 0) - 100) < 0.000001
    && amounts.every((n, index) => Number.isFinite(n) && n > 0 && Math.abs(n - contract.productionCost * percentages[index] / 100) <= 1)
    && Math.abs(amounts.reduce((a, b) => a + b, 0) - contract.productionCost) < 0.01;
}

export function advanceEligible(state: CommissionState): boolean {
  if (state.installationStatus === 'EXECUTIVE_IMPOUND' || damageHold(state)) return false;
  const c = state.contracts[0];
  return validAgreement(c) && (c.status === 'ARTIST_APPROVED' || c.status === 'LOCKED')
    && state.evidence.prEvidenceGate && state.evidence.technicalEvidenceGate
    && !state.evidence.financeApprovalGate && !state.ledger?.some(row => row.tranche === 'advance');
}

export function milestoneEligible(state: CommissionState, tranche: 'delivery' | 'completion'): boolean {
  if (state.installationStatus === 'EXECUTIVE_IMPOUND' || damageHold(state)) return false;
  const c = state.contracts[0];
  return validAgreement(c) && (c.status === 'ARTIST_APPROVED' || c.status === 'LOCKED')
    && !state.ledger?.some(row => row.tranche === tranche)
    && (tranche === 'delivery' ? state.logistics?.status === 'PHYSICAL_ASSET_RECEIVED'
      : Boolean(state.logistics?.closedAt && state.logistics?.returnReference && state.logistics?.reconciliationReference));
}

type Actor = 'PR_PROTOCOL' | 'TECHNICAL' | 'FINANCE' | string;
export type CommissionAction = ConditionAction
  | {type:'submit-catalog';actor:string;contractId:string;titleAr:string;titleEn:string;statement:string;at:string}
  | { type: 'impound'; actor: Actor; artistId: string; directives: string; id: string; at: string }
  | { type: 'acknowledge-alterations'; actor: Actor; impoundId: string; confirmed: boolean; at: string }
  | { type: 'request-fleet'; actor: Actor; contractId: string; vehicle: string; id: string; at: string }
  | { type: 'fleet-transit'; actor: Actor; ticketId: string; at: string }
  | { type: 'CONTRACT_DISPUTED'; actor: Actor; contractId: string; round: NegotiationRound }
  | { type: 'receive-asset'; actor: Actor; at: string; reference: string }
  | { type: 'close-exhibition'; actor: Actor; at: string; returnReference: string; reconciliationReference: string }
  | { type: 'request-saf'; actor: Actor; at: string; technicians: number; hours: number; rationale: string }
  | { type: 'record-tranche'; actor: Actor; at: string; tranche: 'delivery' | 'completion' }
  | { type: 'contracts'; update: (contracts: BilateralContract[]) => BilateralContract[] }
  | { type: 'pr-check'; actor: Actor; field: 'passportVerified' | 'visaCleared'; value: boolean }
  | { type: 'technical-check'; actor: Actor; field: 'floorLoadVerified' | 'mountingVerified'; value: boolean }
  | { type: 'record-pr' | 'record-technical' | 'authorize-advance'; actor: Actor; at: string };

function termsKey(c?: BilateralContract): string {
  return JSON.stringify(c && [c.id, c.shippingLiability, c.crate, c.themeArabic, c.participationCategory, c.artworkCount, c.invitationSourceId, c.productionCost, c.shippingTerms, c.specialConditions, c.venue, c.venueClearanceReference,
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
  if (['record-condition','dispatch-damage','request-plan-b','review-plan-b'].includes(action.type)) return conditionTransition(state, action as ConditionAction);
  if (damageHold(state) && ['request-fleet','fleet-transit','close-exhibition','record-technical','technical-check','contracts','CONTRACT_DISPUTED'].includes(action.type)) return state;
  if(action.type==='submit-catalog') {
    const contract=state.contracts[0];
    if(action.actor!=='ARTIST'||!acceptedForCatalog(contract)||contract.id!==action.contractId||!validCatalogFields(action)||!Number.isFinite(Date.parse(action.at)))return state;
    const data={contractId:contract.id,artistId:contract.artistId,agreementRevision:state.agreementRevision,titleAr:action.titleAr.trim(),titleEn:action.titleEn.trim(),statement:action.statement.trim(),submittedAt:action.at};
    const last=state.catalogSubmissions?.at(-1);
    if(last&&last.agreementRevision===data.agreementRevision&&last.contractId===data.contractId&&last.titleAr===data.titleAr&&last.titleEn===data.titleEn&&last.statement===data.statement)return state;
    return {...state,catalogSubmissions:[...(state.catalogSubmissions??[]),data]};
  }
  const e = state.evidence;
  const c = state.contracts[0];
  const accepted = c?.status === 'ARTIST_APPROVED' || c?.status === 'LOCKED';
  const impounded = state.installationStatus === 'EXECUTIVE_IMPOUND';
  if (action.type === 'impound') {
    if (action.actor !== 'BIENNIAL_DIRECTOR' || !accepted || !state.logistics || state.logistics.closedAt || impounded || action.artistId !== c.artistId || !action.directives.trim() || !action.id || !Number.isFinite(Date.parse(action.at)) || state.impounds?.some(r=>r.id===action.id)) return state;
    return {...state, installationStatus:'EXECUTIVE_IMPOUND', impounds:[...(state.impounds??[]),{id:action.id,artistId:c.artistId,directives:action.directives,issuedAt:action.at}], evidence:{...e,floorLoadVerified:false,mountingVerified:false,technicalEvidenceGate:false,technicalRecordedAt:undefined}};
  }
  if (action.type === 'acknowledge-alterations') {
    const last = state.impounds?.at(-1);
    if (action.actor !== 'COORDINATOR' || !impounded || !action.confirmed || !last || last.id!==action.impoundId || last.acknowledgedAt || !Number.isFinite(Date.parse(action.at)) || Date.parse(action.at)<Date.parse(last.issuedAt)) return state;
    return {...state,installationStatus:'CONTRACT_EXECUTED',impounds:state.impounds!.map(r=>r.id===last.id?{...r,acknowledgedAt:action.at}:r)};
  }
  if (impounded && ['technical-check','record-technical','request-saf','close-exhibition','CONTRACT_DISPUTED','contracts','request-fleet','fleet-transit'].includes(action.type)) return state;
  if (action.type === 'request-fleet') {
    if(action.actor!=='LOGISTICS'||!accepted||state.logistics?.closedAt||c.id!==action.contractId||!validCrate(c.crate)||!vehicleTypes.includes(action.vehicle as typeof vehicleTypes[number])||!action.id||!Number.isFinite(Date.parse(action.at))||state.fleetTickets?.some(r=>r.id===action.id||!r.isSuperseded&&r.contractId===c.id&&r.crate.reference===c.crate!.reference))return state;
    return {...state,fleetTickets:[...(state.fleetTickets??[]),{appliesToRevision:state.agreementRevision,id:action.id,contractId:c.id,artistId:c.artistId,crate:{...c.crate},vehicle:action.vehicle,status:'PENDING_FLEET_ASSIGNMENT',requestedAt:action.at}]};
  }
  if(action.type==='fleet-transit') {
    const ticket=state.fleetTickets?.find(r=>r.id===action.ticketId);
    if(action.actor!=='LOGISTICS'||!accepted||state.logistics?.closedAt||!ticket||ticket.isSuperseded||ticket.contractId!==c.id||ticket.status!=='PENDING_FLEET_ASSIGNMENT'||!Number.isFinite(Date.parse(action.at))||Date.parse(action.at)<Date.parse(ticket.requestedAt))return state;
    return {...state,fleetTickets:state.fleetTickets!.map(r=>r.id===ticket.id?{...r,status:'IN_TRANSIT',transitAt:action.at}:r)};
  }
  const advanceRecorded = state.ledger?.some(row => row.tranche === 'advance') || c?.tranches.advanceStatus === 'DISBURSED';
  const financeHistory = advanceRecorded
    ? { financeApprovalGate: e.financeApprovalGate, advanceAuthorizedAt: e.advanceAuthorizedAt }
    : { financeApprovalGate: false, advanceAuthorizedAt: undefined };
  if (action.type === 'CONTRACT_DISPUTED') {
    if (action.actor !== 'ARTIST' || !c || c.id !== action.contractId || state.ledger?.length
      || !['SENT_TO_ARTIST', 'ARTIST_APPROVED', 'LOCKED'].includes(c.status)
      || !action.round.artistJustification?.trim()) return state;
    return { ...state, evidence: emptyEvidence(), contracts: [{ ...c, status: 'CONTRACT_DISPUTED',
      signedAt: undefined, signatureReference: undefined, auditTrail: [...c.auditTrail, action.round] }] };
  }
  if (action.type === 'receive-asset' && action.actor === 'LOGISTICS' && accepted && action.reference.trim() && !state.logistics) {
    return { ...state, logistics: { appliesToRevision: state.agreementRevision, status: 'PHYSICAL_ASSET_RECEIVED', reference: action.reference.trim(), receivedAt: action.at } };
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
    if (after && !validParticipationScope(after)) return state;
    // Generic updates cannot unlock an accepted contract or impersonate an amendment request.
    if ((accepted && after?.status !== before.status) || (after?.status === 'CONTRACT_DISPUTED' && before?.status !== 'CONTRACT_DISPUTED')) return state;
    if (termsKey(before) !== termsKey(after)) {
      if (accepted || before?.status === 'SENT_TO_ARTIST') return state;
      if (before && after && ['ARTIST_APPROVED', 'LOCKED'].includes(after.status)) return state;
      if (state.ledger?.length) return state;
      return { ...state, contracts, agreementRevision: state.agreementRevision + 1, evidence: emptyEvidence(),
        fleetTickets: state.fleetTickets?.map(ticket => ticket.isSuperseded ? ticket : { ...ticket, appliesToRevision: ticket.appliesToRevision ?? state.agreementRevision, isSuperseded: true }),
        receiptHistory: state.logistics ? [...(state.receiptHistory ?? []), { ...state.logistics, appliesToRevision: state.logistics.appliesToRevision ?? state.agreementRevision, isSuperseded: true }] : state.receiptHistory,
        logistics: undefined,
      };
    }
    const passportChanged = before?.documents.passportUploadedAt !== after?.documents.passportUploadedAt
      || before?.documents.passportFileName !== after?.documents.passportFileName;
    const contractSuspended = before?.status !== after?.status
      && after?.status !== 'ARTIST_APPROVED' && after?.status !== 'LOCKED';
    return { ...state, contracts, evidence: contractSuspended ? { ...emptyEvidence(), ...financeHistory } : passportChanged
      ? { ...e, passportVerified: false, prEvidenceGate: false, ...financeHistory,
          prRecordedAt: undefined } : e };
  }
  if (action.type === 'pr-check' && action.actor === 'PR_PROTOCOL') {
    if (e[action.field] === action.value) return state;
    return { ...state, evidence: { ...e, [action.field]: action.value, prEvidenceGate: false,
      prRecordedAt: undefined, ...financeHistory } };
  }
  if (action.type === 'technical-check' && action.actor === 'TECHNICAL') {
    if (e[action.field] === action.value) return state;
    return { ...state, evidence: { ...e, [action.field]: action.value, technicalEvidenceGate: false,
      technicalRecordedAt: undefined, ...financeHistory } };
  }
  if (action.type === 'record-pr' && (e.prRecordedAt || e.prEvidenceGate)) return state;
  if (action.type === 'record-technical' && (e.technicalRecordedAt || e.technicalEvidenceGate)) return state;
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
