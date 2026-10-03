// Shared by the browser rehearsal and the authoritative local service.
// Role and record access must be checked by the caller; these are domain rules.
const fail = message => { throw Object.assign(new Error(message), { status: 409 }); };
const reference = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 1000;
export function packingStage(packing) {
  if (!packing) return 'packing';
  if (packing.requiresTechnical !== false && !packing.technicalReference) return 'technical-review';
  if (!packing.costReference) return 'cost-review';
  if (!packing.evidence) return 'pack-evidence';
  return 'ready';
}
export function packingTransition(packing, command, role) {
  const stage = packingStage(packing);
  const value = command.value?.trim() ?? '';
  if (command.type === 'PACK') {
    if (packing) fail('Reopen the packing checks with a reason before replacing the plan.');
    if (role !== 'Logistics' || !reference(value) || !reference(command.packingOwner) || !Number.isFinite(command.amount) || command.amount < 0 || typeof command.requiresTechnical !== 'boolean') fail('Record a packing plan, named owner, valid cost and technical-review requirement.');
    if (!command.requiresTechnical && !reference(command.technicalReason)) fail('Explain why specialist review is not required.');
    return { specification: value, owner: command.packingOwner.trim(), amount: command.amount, requiresTechnical: command.requiresTechnical, technicalReason: command.technicalReason?.trim() ?? '', technicalReference: '', costReference: '', evidence: '' };
  }
  if (!reference(value)) fail('A source reference or reason is required.');
  if (command.type === 'TECHNICAL' && role === 'Technical' && stage === 'technical-review') return { ...packing, technicalReference: value };
  if (command.type === 'COST' && role === 'Finance' && stage === 'cost-review') return { ...packing, costReference: value };
  if (command.type === 'EVIDENCE' && role === 'Logistics' && stage === 'pack-evidence') return { ...packing, evidence: value };
  if (command.type === 'REOPEN' && role === 'Logistics' && packing) return null;
  fail('This packing action is not available to this role at the current step.');
}
export function collectionReadiness({ details, conflict, confirmed, planned, accepted, packing }) {
  if (!details) return { state: 'DETAILS_REQUIRED', blocker: 'Record the physical collection address and availability.', role: 'Logistics' };
  if (!accepted) return { state: 'ACCEPTANCE_REQUIRED', blocker: 'The named Logistics owner must accept this handoff.', role: 'Logistics' };
  if (conflict) return { state: 'CONFLICT_REQUIRES_RESOLUTION', blocker: 'Resolve conflicting collection information before planning.', role: 'Logistics' };
  if (!confirmed) return { state: 'SOURCE_CONFIRMATION_REQUIRED', blocker: 'Confirm the address, contact and availability against source evidence.', role: 'Logistics' };
  if (!planned) return { state: 'PICKUP_PLAN_REQUIRED', blocker: 'Choose a pickup date within the confirmed availability and outside closures.', role: 'Logistics' };
  const stage = packingStage(packing);
  return {
    packing: { state: 'PACKING_REQUIRED', blocker: 'Packing requirements are unresolved. Record the plan and named packing owner.', role: 'Logistics' },
    'technical-review': { state: 'TECHNICAL_REVIEW_REQUIRED', blocker: 'The packing plan needs specialist clearance before cost approval or completion.', role: 'Technical' },
    'cost-review': { state: 'COST_REVIEW_REQUIRED', blocker: 'Finance must record cost approval, including zero-cost arrangements.', role: 'Finance' },
    'pack-evidence': { state: 'PACKING_EVIDENCE_REQUIRED', blocker: 'Check completed packing against the cleared plan and record evidence.', role: 'Logistics' },
    ready: { state: 'READY_FOR_COLLECTION', blocker: '', role: 'Logistics' },
  }[stage];
}
