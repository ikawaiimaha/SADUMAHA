import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommission, commissionReducer as reduce, advanceEligible, milestoneEligible, validAgreement, COMMISSION } from '../src/data/commissionScenario';
import { submitForVetting, ASSIGNED_COORDINATOR, validDossier } from '../src/data/vetting';
import type { BilateralContract } from '../src/types/contractStage6';
import type { NominatedArtistDossier } from '../src/components/ArtistNominationForm';
const at = '2026-09-28T10:00:00Z';
const contract: BilateralContract = {
  id: 'contract-demo', artistId: COMMISSION.id, artistName: COMMISSION.artistName, artistCategory: 'Emerging', nationality: 'Fictional country', medium: 'Bronze', proposedWorkTitle: COMMISSION.title,
  productionCost: 10000, shippingTerms: 'Fictional courier', cancellationClauseMandatory: true, status: 'ARTIST_APPROVED', auditTrail: [],
  tranches: {advancePercentage:30,advanceAmount:3000,advanceStatus:'PENDING',deliveryPercentage:40,deliveryAmount:4000,deliveryStatus:'PENDING',installationPercentage:30,installationAmount:3000,installationStatus:'PENDING'},
  documents: {passportStatus:'SUBMITTED',artworkDpi:300,highResStatus:'NOT_UPLOADED',catalogBioStatus:'DRAFT'}
};
const accepted = () => reduce(createCommission(), {type:'contracts',update:() => [contract]});

test('advance requires both departmental evidence gates but never crate arrival', () => {
  let s=accepted();
  assert.equal(advanceEligible(s),false);
  s=reduce(s,{type:'pr-check',actor:'PR_PROTOCOL',field:'passportVerified',value:true});
  s=reduce(s,{type:'pr-check',actor:'PR_PROTOCOL',field:'visaCleared',value:true});
  s=reduce(s,{type:'record-pr',actor:'PR_PROTOCOL',at});
  assert.equal(advanceEligible(s),false);
  s=reduce(s,{type:'technical-check',actor:'TECHNICAL',field:'floorLoadVerified',value:true});
  s=reduce(s,{type:'technical-check',actor:'TECHNICAL',field:'mountingVerified',value:true});
  s=reduce(s,{type:'record-technical',actor:'TECHNICAL',at});
  assert.equal(s.logistics,undefined);
  assert.equal(advanceEligible(s),true);
  assert.equal(reduce(s,{type:'authorize-advance',actor:'TECHNICAL',at}),s);
  s=reduce(s,{type:'authorize-advance',actor:'FINANCE',at});
  assert.equal(s.ledger?.[0].amount,3000);
  assert.equal(s.contracts[0].tranches.advanceStatus,'DISBURSED');
  assert.equal(reduce(s,{type:'authorize-advance',actor:'FINANCE',at}),s);
});

test('delivery and completion require distinct logistics evidence and cannot be double recorded', () => {
  let s=accepted();
  assert.equal(milestoneEligible(s,'delivery'),false);
  assert.equal(reduce(s,{type:'receive-asset',actor:'FINANCE',reference:'R1',at}),s);
  assert.equal(reduce(s,{type:'receive-asset',actor:'LOGISTICS',reference:' ',at}),s);
  s=reduce(s,{type:'receive-asset',actor:'LOGISTICS',reference:'R1',at});
  assert.equal(milestoneEligible(s,'delivery'),true);
  assert.equal(milestoneEligible(s,'completion'),false);
  assert.equal(reduce(s,{type:'close-exhibition',actor:'LOGISTICS',returnReference:'return',reconciliationReference:'',at}),s);
  s=reduce(s,{type:'record-tranche',actor:'FINANCE',tranche:'delivery',at});
  assert.equal(reduce(s,{type:'record-tranche',actor:'FINANCE',tranche:'delivery',at}),s);
  s=reduce(s,{type:'close-exhibition',actor:'LOGISTICS',returnReference:'return',reconciliationReference:'condition',at});
  assert.equal(milestoneEligible(s,'completion'),true);
  s=reduce(s,{type:'record-tranche',actor:'FINANCE',tranche:'completion',at});
  assert.deepEqual(s.ledger?.map(r=>r.amount),[4000,3000]);
  assert.equal(s.contracts[0].tranches.deliveryStatus,'DISBURSED');
  assert.equal(s.contracts[0].tranches.installationStatus,'DISBURSED');
  assert.equal(reduce(s,{type:'record-tranche',actor:'FINANCE',tranche:'completion',at}),s);
  assert.equal(reduce(s,{type:'contracts',update:()=>[{...contract,productionCost:20000}]}),s);
});

test('SAF resource request does not clear structural evidence or Finance', () => {
  let s=accepted();
  const request={type:'request-saf',actor:'TECHNICAL',technicians:2,hours:8,rationale:'Mounting team',at} as const;
  assert.equal(reduce(s,{...request,actor:'PR_PROTOCOL'}),s);
  assert.equal(reduce(s,{...request,technicians:1.5}),s);
  s=reduce(s,request);
  assert.equal(s.safRequest?.technicians,2);
  assert.equal(s.evidence.technicalEvidenceGate,false);
  assert.equal(advanceEligible(s),false);
});

const dossier: NominatedArtistDossier={id:'d1',artistName:'Fictional artist',artistCategory:'Emerging',nationality:'Country X',medium:'Bronze',proposedWorkTitle:'Study',isCommissioned:true,cvFileName:'cv.pdf',previousWorksCount:1,mockupCount:1,submittedBy:'Preparatory Committee',submittedAt:at,status:'DRAFT',assignedCoordinatorId:ASSIGNED_COORDINATOR};
test('dossier schemas distinguish new and existing work and do not fabricate attachments',()=>{
  assert.equal(validDossier(dossier),true);
  assert.equal(validDossier({...dossier,mockupCount:0}),false);
  assert.equal(validDossier({...dossier,isCommissioned:false,mockupCount:0}),false);
  assert.equal(validDossier({...dossier,isCommissioned:false,mockupCount:0,provenanceFileName:'provenance.pdf'}),true);
});
test('only assigned Coordinator submits; active compliance matches never reach Director',()=>{
  assert.equal(submitForVetting(dossier,'PREP_COMMITTEE',ASSIGNED_COORDINATOR,[]),null);
  assert.equal(submitForVetting(dossier,'COORDINATOR','other',[]),null);
  assert.equal(submitForVetting(dossier,'COORDINATOR',ASSIGNED_COORDINATOR,['Restricted Nationality: Country X'])?.status,'REJECTED_COMPLIANCE');
  const passed=submitForVetting(dossier,'COORDINATOR',ASSIGNED_COORDINATOR,[]);
  assert.equal(passed?.status,'PENDING_DIRECTOR_REVIEW');
  assert.equal(submitForVetting(passed!,'COORDINATOR',ASSIGNED_COORDINATOR,[]),null);
});


test('accepted and locked terms require an explicit dispute before amendment', () => {
  for (const status of ['ARTIST_APPROVED', 'LOCKED'] as const) {
    const s = reduce(createCommission(), {type:'contracts',update:()=>[{...contract,status}]});
    assert.equal(reduce(s,{type:'contracts',update:cs=>cs.map(c=>({...c,shippingTerms:'mutated'}))}),s);
    assert.equal(reduce(s,{type:'contracts',update:cs=>cs.map(c=>({...c,status:'CONTRACT_DISPUTED'}))}),s);
    const action = {type:'CONTRACT_DISPUTED',actor:'ARTIST',contractId:contract.id,round:{id:'r1',disputedCategory:'SHIPPING_TERMS',artistJustification:'Revise courier'}} as const;
    assert.equal(reduce(s,{...action,actor:'COORDINATOR'}),s);
    const disputed=reduce(s,action);
    assert.equal(disputed.contracts[0].status,'CONTRACT_DISPUTED');
    assert.equal(reduce(disputed,action),disputed);
    const amended=reduce(disputed,{type:'contracts',update:cs=>cs.map(c=>({...c,status:'SENT_TO_ARTIST',shippingTerms:'new courier'}))});
    assert.equal(amended.contracts[0].shippingTerms,'new courier');
    assert.equal(advanceEligible(amended),false);
  }
});

test('clearance replay is idempotent and evidence edits preserve recorded advance history', () => {
  let s=accepted();
  s={...s,evidence:{...s.evidence,passportVerified:true,visaCleared:true,floorLoadVerified:true,mountingVerified:true}};
  s=reduce(s,{type:'record-pr',actor:'PR_PROTOCOL',at});
  s=reduce(s,{type:'record-technical',actor:'TECHNICAL',at});
  assert.equal(reduce(s,{type:'record-pr',actor:'PR_PROTOCOL',at:'later'}),s);
  assert.equal(reduce(s,{type:'record-technical',actor:'TECHNICAL',at:'later'}),s);
  s=reduce(s,{type:'authorize-advance',actor:'FINANCE',at});
  const changed=reduce(s,{type:'pr-check',actor:'PR_PROTOCOL',field:'passportVerified',value:false});
  assert.equal(changed.evidence.prEvidenceGate,false);
  assert.equal(changed.evidence.financeApprovalGate,true);
  assert.equal(changed.evidence.advanceAuthorizedAt,at);
  assert.equal(changed.ledger,s.ledger);
  const technical=reduce(s,{type:'technical-check',actor:'TECHNICAL',field:'mountingVerified',value:false});
  assert.equal(technical.evidence.technicalEvidenceGate,false);
  assert.equal(technical.evidence.advanceAuthorizedAt,at);
  const replacement=reduce(s,{type:'contracts',update:cs=>cs.map(c=>({...c,documents:{...c.documents,passportFileName:'replacement.pdf'}}))});
  assert.equal(replacement.evidence.financeApprovalGate,true);
  assert.equal(replacement.evidence.advanceAuthorizedAt,at);
});

test('each tranche amount must match its percentage within one AED', () => {
  const withAmounts=(advanceAmount:number,deliveryAmount:number)=>({...contract,tranches:{...contract.tranches,advanceAmount,deliveryAmount}});
  assert.equal(validAgreement(withAmounts(3001,3999)),true);
  assert.equal(validAgreement(withAmounts(3001.01,3998.99)),false);
  assert.equal(validAgreement(withAmounts(6999,1)),false);
  assert.equal(validAgreement({...contract,productionCost:0}),false);
});


test('solo invitation scope validates inclusive artwork boundaries without affecting single works', async () => {
  const { validParticipationScope } = await import('../src/data/soloInvitation2026');
  for (const artworkCount of [15, 16, 20]) assert.equal(validParticipationScope({participationCategory:'SOLO_EXHIBITION',artworkCount}), true);
  for (const artworkCount of [0, 14, 21, 15.5, NaN, Infinity, undefined]) {
    const invalid = {...contract, participationCategory:'SOLO_EXHIBITION' as const, artworkCount};
    assert.equal(validParticipationScope(invalid), false);
    assert.equal(validAgreement(invalid), false);
    const initial = createCommission();
    assert.equal(reduce(initial, {type:'contracts',update:() => [invalid]}), initial);
  }
  assert.equal(validParticipationScope({participationCategory:'SINGLE_WORK',artworkCount:1}), true);
  assert.equal(validAgreement(contract), true);
});

test('accepted solo artwork scope cannot be silently changed', () => {
  const solo = {...contract, participationCategory:'SOLO_EXHIBITION' as const, artworkCount:15, invitationSourceId:'user-transcription:6'};
  const state = reduce(createCommission(), {type:'contracts',update:() => [solo]});
  for (const patch of [{artworkCount:20}, {participationCategory:'SINGLE_WORK' as const,artworkCount:1}, {invitationSourceId:'different-source'}]) {
    assert.equal(reduce(state,{type:'contracts',update: cs => cs.map(c => ({...c,...patch}))}),state);
  }
});
