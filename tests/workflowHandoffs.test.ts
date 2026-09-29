import { isThemeBatchComplete } from '../src/components/CommitteeThemeWorkspace';
import {validTechnicalRequirements,technicalMatrixTicket,matrixCleared,type TechnicalRequirement} from '../src/data/technicalMatrix';
import { operationalHandoff } from '../src/data/operationalHandoff';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommission, commissionReducer as reduce, advanceEligible, milestoneEligible, validAgreement, COMMISSION } from '../src/data/commissionScenario';
import { submitForVetting, ASSIGNED_COORDINATOR, validDossier, queueNomination, reviewByCommittee, directorEligible, safePortfolioUrl } from '../src/data/vetting';
import type { BilateralContract } from '../src/types/contractStage6';
import type { NominatedArtistDossier } from '../src/components/ArtistNominationForm';
const at = '2026-09-28T10:00:00Z';
const contract: BilateralContract = {
  id: 'contract-demo', artistId: COMMISSION.id, artistName: COMMISSION.artistName, artistCategory: 'Emerging', nationality: 'Fictional country', medium: 'Bronze', proposedWorkTitle: COMMISSION.title,
  productionCost: 10000, shippingLiability: 'DEPARTMENT', shippingTerms: 'Fictional courier', cancellationClauseMandatory: true, status: 'ARTIST_APPROVED', auditTrail: [],
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
  assert.equal(milestoneEligible(s,'delivery'),false);
  s=reduce(s,{type:'record-condition',actor:'LOGISTICS',id:'inspection',condition:'INTACT',photos:[],at});
  s=reduce(s,{type:'verify-arrival',actor:'LOGISTICS',token:s.logistics!.reference,inspection:{lengthCm:100,widthCm:80,heightCm:60,grossWeightKg:100,seal:'MATCH',condition:'INTACT'}});
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

const dossier: NominatedArtistDossier={culturalDeclaration:{containsText:false,explanation:''},culturalClearedAt:at,id:'d1',artistName:'Fictional artist',artistCategory:'Emerging',nationality:'Country X',medium:'Bronze',proposedWorkTitle:'Study',isCommissioned:true,cvFileName:'cv.pdf',previousWorksCount:1,mockupCount:1,submittedBy:'Preparatory Committee',submittedAt:at,status:'DRAFT',assignedCoordinatorId:ASSIGNED_COORDINATOR};
test('technical matrix requires exact approved requirements, room and recorded venue authority',()=>{
 const req:TechnicalRequirement={id:'projector',equipment:'AV_PROJECTOR',specifications:'4K projector',mounting:'CEILING_MOUNT'};
 assert.equal(validTechnicalRequirements([{...req,specifications:' '}]),false);
 assert.equal(validTechnicalRequirements([req,req]),false);
 assert.equal(validDossier({...dossier,technicalRequirements:[{...req,specifications:''}]}),false);
 const approved:NominatedArtistDossier={...dossier,status:'APPROVED',approvalRevision:1,technicalRequirements:[req]};
 const claims=claimSpace([],{spaceId:'sam-hall-1',artistId:approved.id,coordinatorId:ASSIGNED_COORDINATOR,actor:'COORDINATOR',at},[approved]);
 assert.equal(technicalMatrixTicket(approved,req,[]),null);
 assert.equal(technicalMatrixTicket({...approved,status:'DRAFT'},req,claims),null);
 const ticket=technicalMatrixTicket(approved,req,claims)!;
 let state:Governance={...emptyGovernance,tickets:{[ticket.id]:{...ticket,status:'PENDING_VENUE_APPROVAL'}}};
 assert.equal(matrixCleared(ticket,state),false);
 assert.equal(clearVenue(state,ticket.id,'TECHNICAL:primary',at),state);
 state=clearVenue(state,ticket.id,'VENUE:SHARJAH_ART_MUSEUM:primary',at);
 assert.equal(matrixCleared(ticket,state),true);
 assert.equal(matrixCleared({...ticket,blocked:true},state),false);
 assert.equal(clearVenue(state,ticket.id,'VENUE:SHARJAH_ART_MUSEUM:primary',at),state);
 for(const changed of [{...req,specifications:'8K projector'},{...req,mounting:'WALL_ANCHOR' as const}]){
   const next=technicalMatrixTicket({...approved,technicalRequirements:[changed]},changed,claims)!;
   assert.notEqual(next.id,ticket.id);assert.equal(matrixCleared(next,state),false);
 }
 assert.equal(matrixCleared(technicalMatrixTicket({...approved,approvalRevision:2},req,claims),state),false);
 assert.equal(matrixCleared(technicalMatrixTicket(approved,req,claims.map(c=>({...c,claimedAt:'2026-10-01T10:00:00Z'}))),state),false);
 assert.equal(technicalMatrixTicket({...approved,assignedCoordinatorId:'other'},req,claims),null);
});
test('dossier schemas distinguish new and existing work and do not fabricate attachments',()=>{
  assert.equal(validDossier(dossier),true);
  assert.equal(validDossier({...dossier,mockupCount:0}),false);
  assert.equal(validDossier({...dossier,isCommissioned:false,mockupCount:0}),false);
  assert.equal(validDossier({...dossier,isCommissioned:false,mockupCount:0,provenanceFileName:'provenance.pdf'}),true);
});
test('only assigned Coordinator submits; active compliance matches never reach Director',()=>{
  assert.equal(submitForVetting(dossier,'PREP_COMMITTEE',ASSIGNED_COORDINATOR,[]),null);
  assert.equal(submitForVetting(dossier,'COORDINATOR','other',[]),null);
  assert.equal(submitForVetting(dossier,'COORDINATOR',ASSIGNED_COORDINATOR,['Restricted Nationality: Country X'])?.status,'HIP_BLOCKED');
  const passed=submitForVetting(dossier,'COORDINATOR',ASSIGNED_COORDINATOR,[]);
  assert.equal(passed?.status,'PENDING_COMMITTEE_REVIEW');
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


test('operational summary follows actual evidence without changing any gates', () => {
  const initial = createCommission();
  assert.equal(operationalHandoff(initial, false).owner, 'COORDINATOR');
  const pending = {...initial, contracts: [{...contract, status: 'SENT_TO_ARTIST' as const}]};
  assert.equal(operationalHandoff(pending, false).owner, 'ARTIST');
  const state = accepted();
  const before = JSON.stringify(state);
  assert.equal(operationalHandoff(state, false).owner, 'PR_PROTOCOL');
  assert.equal(JSON.stringify(state), before);
  const pr = {...state, evidence: {...state.evidence, prEvidenceGate: true}};
  assert.equal(operationalHandoff(pr, false).owner, 'TECHNICAL');
  const cleared = {...pr, evidence: {...pr.evidence, technicalEvidenceGate: true}};
  assert.equal(cleared.logistics, undefined);
  assert.equal(operationalHandoff(cleared, false).owner, 'FINANCE');
  const paid = reduce(cleared, {type:'authorize-advance', actor:'FINANCE', at});
  assert.equal(operationalHandoff(paid, false).owner, 'LOGISTICS');
  const received = reduce(paid, {type:'receive-asset', actor:'LOGISTICS', reference:'R1', at});
  assert.equal(operationalHandoff(received, false).owner, 'FINANCE');
});

test('published theme snapshot is immutable after acceptance', () => {
  const state = reduce(createCommission(), {type:'contracts', update:() => [{...contract, themeArabic:'النقطة'}]});
  assert.equal(reduce(state, {type:'contracts', update:rows => rows.map(row => ({...row, themeArabic:'ميزان'}))}), state);
});
import { assignedTo, COORDINATORS, HONORED_GUESTS, HONORED_EVENT, validSoloCount } from '../src/data/participation2026';

test('source roster has 53 unique guests, nine exclusive coordinator assignments', () => {
  assert.equal(HONORED_GUESTS.length, 53);
  assert.equal(new Set(HONORED_GUESTS.map(g => g.name)).size, 53);
  assert.deepEqual(COORDINATORS.slice(1).map(c => assignedTo(HONORED_GUESTS, c.id).length).sort((a,b) => a-b), [2,2,2,2,3,4,4,10,24]);
  const maha = COORDINATORS.find(c => c.name === 'مها السويدي')!;
  assert.deepEqual(assignedTo(HONORED_GUESTS, maha.id).map(g => g.name), ['فاطمة الحمادي', 'Murat Kurt']);
  assert.deepEqual(assignedTo(HONORED_GUESTS, 'unknown'), []);
  assert.equal(HONORED_EVENT.date, '2026-10-10');
  assert.equal(HONORED_EVENT.requiresExternalClearance, true);
});

test('only solo participation requires 15–20 whole artworks', () => {
  for (const count of [undefined, 0, 14, 15.5, 21, NaN]) assert.equal(validSoloCount('SOLO_EXHIBITION', count), false);
  for (const count of [15, 20]) assert.equal(validSoloCount('SOLO_EXHIBITION', count), true);
  assert.equal(validSoloCount('HONORED_GUEST'), true);
  assert.equal(validSoloCount('GENERAL_COMPETITION'), true);
});

test('honored guest vetting needs identity and the assigned coordinator, not invented artwork', () => {
  const d: NominatedArtistDossier = {
    culturalDeclaration: {containsText:false,explanation:''}, culturalClearedAt: at,
    id: 'test-guest', artistName: 'Fictional guest', artistCategory: 'Not applicable',
    nationality: 'Fictional country', medium: '', proposedWorkTitle: '', cvFileName: '',
    previousWorksCount: 0, mockupCount: 0, submittedBy: 'Coordinator', submittedAt: at,
    assignedCoordinatorId: COORDINATORS[1].id, participationTrack: 'HONORED_GUEST', status: 'DRAFT',
  };
  assert.equal(validDossier(d), true);
  assert.equal(submitForVetting(d, 'COORDINATOR', COORDINATORS[2].id, []), null);
  assert.equal(submitForVetting(d, 'COORDINATOR', COORDINATORS[1].id, [])?.status, 'PENDING_COMMITTEE_REVIEW');
  assert.equal(submitForVetting(d, 'COORDINATOR', COORDINATORS[1].id, ['Fictional country'])?.status, 'HIP_BLOCKED');
  assert.equal(validDossier({...d, nationality: ''}), false);
  assert.equal(validDossier({...d, assignedCoordinatorId: undefined}), false);
});

import { analyzePortfolioConflicts, deriveDepartmentEvidenceStatus, commissionEvidence, resolveEscalation, submitEscalation } from '../src/utils/chairmanOversight';
import type { PortfolioProgram, EscalationRecord } from '../src/types/chairman';
test('Chairman evidence requires a valid timestamp and clearance; counts use the same evidence', () => {
  assert.equal(deriveDepartmentEvidenceStatus('PR', undefined, true).isComplete, false);
  assert.equal(deriveDepartmentEvidenceStatus('PR', 'invalid', true).isComplete, false);
  assert.equal(deriveDepartmentEvidenceStatus('PR', at, false).isComplete, false);
  assert.equal(deriveDepartmentEvidenceStatus('PR', at, true).isComplete, true);
  assert.equal(commissionEvidence(createCommission()).filter(e => e.isComplete).length, 0);
  const s = createCommission();
  s.evidence.financeApprovalGate = true;
  s.evidence.advanceAuthorizedAt = at;
  assert.equal(commissionEvidence(s)[3].isComplete, false);
  s.ledger = [{tranche:'advance', amount:10, revision:0, at}];
  assert.equal(commissionEvidence(s)[3].isComplete, true);
});
test('calendar intersection is not resource proof; missing and inverted dates do not report overlaps', () => {
  const a: PortfolioProgram = {id:'a',nameAr:'a',nameEn:'a',isLiveSessionProgram:true,startDate:'2026-10-07',endDate:'2026-11-15',assignedCoordinatorId:'same',venueKey:'same'};
  const b = {...a,id:'b',startDate:'2026-10-23',endDate:'2026-10-24'};
  assert.equal(analyzePortfolioConflicts([a,b])[0].type, 'POTENTIAL_OVERLAP');
  assert.equal(analyzePortfolioConflicts([a,b])[0].datesDescription, '2026-10-23 – 2026-10-24');
  assert.equal(analyzePortfolioConflicts([{...a,exclusiveResourceIds:['technician-1']},{...b,exclusiveResourceIds:['technician-1']}])[0].type, 'RESOURCE_CONFLICT');
  assert.deepEqual(analyzePortfolioConflicts([a,{...b,endDate:'2026-10-01'}]), []);
  assert.deepEqual(analyzePortfolioConflicts([a,{...b,startDate:undefined}]), []);
});
test('executive disposition is role guarded, idempotent and retained in parent records', () => {
  const rows: EscalationRecord[] = [{id:'e', programId:'p', programName:'test', originatingDepartment:'Technical', reason:'test', supportingEvidenceRef:'test-ref', requestedDecision:'Review scope', status:'PENDING_EXECUTIVE_ACTION',submittedAt:at}];
  assert.equal(resolveEscalation(rows,'e','APPROVED','TECHNICAL',at),rows);
  const next = resolveEscalation(rows,'e','DEFERRED','CHAIRMAN',at);
  assert.equal(next[0].executiveDisposition,'DEFERRED');
  assert.equal(next[0].status, 'PENDING_EXECUTIVE_ACTION');
  assert.equal(resolveEscalation(next,'e','DEFERRED','CHAIRMAN',at), next);
  const resolved = resolveEscalation(next,'e','APPROVED','CHAIRMAN',at);
  assert.equal(resolved[0].status, 'RESOLVED');
  assert.deepEqual(resolved[0].decisionHistory?.map(d => d.disposition), ['DEFERRED','APPROVED']);
  assert.equal(resolveEscalation(resolved,'e','REJECTED','CHAIRMAN',at), resolved);
  assert.equal(rows[0].status,'PENDING_EXECUTIVE_ACTION');
});

test('department escalation intake validates evidence, roles and duplicate submissions', () => {
  const empty: EscalationRecord[] = [];
  const input = {id:'new-escalation',reason:'Venue scope review',supportingEvidenceRef:'SESSION-REF-1',requestedDecision:'Review inter-entity dependency'};
  for (const actor of ['ARTIST','CHAIRMAN','HIP','toString']) assert.equal(submitEscalation(empty,input,actor,at),empty);
  assert.equal(submitEscalation(empty,{...input,supportingEvidenceRef:'  '},'TECHNICAL',at),empty);
  assert.equal(submitEscalation(empty,input,'TECHNICAL','invalid'),empty);
  for (const actor of ['COORDINATOR','PR_PROTOCOL','TECHNICAL','FINANCE']) assert.equal(submitEscalation(empty,input,actor,at).length,1);
  const rows = submitEscalation(empty,input,'TECHNICAL',at);
  assert.equal(rows[0].originatingDepartment,'Technical');
  assert.equal(submitEscalation(rows,input,'TECHNICAL',at),rows);
  assert.equal(submitEscalation(rows,{...input,id:'retry'},'TECHNICAL',at),rows);
  const deferred = resolveEscalation(rows,input.id,'DEFERRED','CHAIRMAN',at);
  assert.equal(submitEscalation(deferred,{...input,id:'retry'},'TECHNICAL',at),deferred);
  assert.equal(empty.length,0);
});

import { requestScopeChange, reviewScopeChange, recordDossierDispatch, scopeOf } from '../src/data/dossierLedger';
const approvedDossier: NominatedArtistDossier = {...dossier,status:'APPROVED',approvalRevision:1,artworkCount:1,participationTrack:'GENERAL_COMPETITION'};
const proposedScope = {...scopeOf(approvedDossier),artworkCount:2};
test('scope amendments retain approval, enforce ownership and prevent duplicate pending requests',()=>{
  assert.equal(requestScopeChange(approvedDossier,'wrong',proposedScope,'Reason',at,'a'),approvedDossier);
  assert.equal(requestScopeChange(approvedDossier,ASSIGNED_COORDINATOR,{...proposedScope,artworkCount:0},'Reason',at,'a'),approvedDossier);
  const pending=requestScopeChange(approvedDossier,ASSIGNED_COORDINATOR,proposedScope,'Reason',at,'a');
  assert.equal(pending.artworkCount,1);
  assert.equal(pending.amendments?.[0].proposed.artworkCount,2);
  assert.equal(requestScopeChange(pending,ASSIGNED_COORDINATOR,proposedScope,'Reason',at,'b'),pending);
  assert.equal(recordDossierDispatch(pending,'HIP',true,at),pending);
});
test('amendment decisions enforce authority, compliance and contract locks with revision history',()=>{
  const pending=requestScopeChange(approvedDossier,ASSIGNED_COORDINATOR,proposedScope,'Reason',at,'a');
  assert.equal(reviewScopeChange(pending,'a',true,'HIP',[],false,at),pending);
  assert.equal(reviewScopeChange(pending,'a',true,'BIENNIAL_DIRECTOR',[],true,at),pending);
  assert.equal(reviewScopeChange(pending,'a',true,'BIENNIAL_DIRECTOR',['Bronze'],false,at),pending);
  const approved=reviewScopeChange(pending,'a',true,'BIENNIAL_DIRECTOR',[],false,at);
  assert.equal(approved.artworkCount,2);
  assert.equal(approved.approvalRevision,2);
  assert.equal(approved.amendments?.[0].before.artworkCount,1);
  assert.equal(reviewScopeChange(approved,'a',true,'BIENNIAL_DIRECTOR',[],false,at),approved);
  const rejected=reviewScopeChange(pending,'a',false,'BIENNIAL_DIRECTOR',[],true,at);
  assert.equal(rejected.artworkCount,1);
  assert.equal(rejected.approvalRevision,1);
});
test('dispatch requires publication and assigned Coordinator authority; snapshots survive later amendments',()=>{
  assert.equal(recordDossierDispatch(approvedDossier,'COORDINATOR',false,at,ASSIGNED_COORDINATOR),approvedDossier);
  assert.equal(recordDossierDispatch(approvedDossier,'HIP',true,at),approvedDossier);
  const sent=recordDossierDispatch(approvedDossier,'COORDINATOR',true,at,ASSIGNED_COORDINATOR);
  assert.equal(recordDossierDispatch(sent,'COORDINATOR',true,at,ASSIGNED_COORDINATOR),sent);
  const pending=requestScopeChange(sent,ASSIGNED_COORDINATOR,proposedScope,'Reason',at,'a');
  const amended=reviewScopeChange(pending,'a',true,'BIENNIAL_DIRECTOR',[],false,at);
  const resent=recordDossierDispatch(amended,'COORDINATOR',true,at,ASSIGNED_COORDINATOR);
  assert.deepEqual(resent.dispatchHistory?.map(r=>[r.revision,r.scope.artworkCount]),[[1,1],[2,2]]);
});

import {supplierTransition,validPacking,validPhoto,type SupplierDelivery} from '../src/data/operationalRegisters';
const supplierRecord:SupplierDelivery={id:'vendor-delivery-1',dossierId:approvedDossier.id,coordinatorId:ASSIGNED_COORDINATOR,vendorName:'Demo technician',vendorId:'DEMO-123',deliverable:'Mount installation',invoiceReference:'INV-DEMO-1',evidenceReference:'INSPECTION-DEMO-1',recordedAt:at};
test('supplier invoices require Technical entry and assigned Coordinator sign-off before Finance',()=>{
 const empty:SupplierDelivery[]=[];
 assert.equal(supplierTransition(empty,{type:'record',actor:'FINANCE',record:supplierRecord},[approvedDossier]),empty);
 assert.equal(supplierTransition(empty,{type:'record',actor:'TECHNICAL',record:{...supplierRecord,vendorId:''}},[approvedDossier]),empty);
 const recorded=supplierTransition(empty,{type:'record',actor:'TECHNICAL',record:supplierRecord},[approvedDossier]);
 assert.equal(recorded.length,1);
 assert.equal(supplierTransition(recorded,{type:'record',actor:'TECHNICAL',record:{...supplierRecord,id:'duplicate'}},[approvedDossier]),recorded);
 const finance={type:'finance-receipt',actor:'FINANCE',id:supplierRecord.id,coordinatorId:ASSIGNED_COORDINATOR,at} as const;
 assert.equal(supplierTransition(recorded,finance,[approvedDossier]),recorded);
 const sign={type:'sign-off',actor:'COORDINATOR',id:supplierRecord.id,coordinatorId:ASSIGNED_COORDINATOR,at} as const;
 assert.equal(supplierTransition(recorded,{...sign,coordinatorId:'wrong'},[approvedDossier]),recorded);
 const signed=supplierTransition(recorded,sign,[approvedDossier]);
 assert.equal(signed[0].signedOffAt,at);
 assert.equal(supplierTransition(signed,sign,[approvedDossier]),signed);
 const received=supplierTransition(signed,finance,[approvedDossier]);
 assert.equal(received[0].receivedByFinanceAt,at);
 assert.equal(supplierTransition(received,finance,[approvedDossier]),received);
});
test('packing evidence validates image size/type, count, container and reference without clearing receipt',()=>{
 const file={type:'image/png',size:100} as File;
 assert.equal(validPhoto({type:'image/svg+xml',size:100}),false);
 assert.equal(validPhoto({type:'image/png',size:11*1024*1024}),false);
 const record={containerType:'PLASTIC_CYLINDER' as const,carrierReference:'DEMO-CARRIER',files:[file],recordedAt:at};
 assert.equal(validPacking(record),true);
 assert.equal(validPacking({...record,files:[]}),false);
 assert.equal(validPacking({...record,files:Array(11).fill(file)}),false);
 assert.equal(validPacking({...record,carrierReference:' '}),false);
});

import {assetFileError,updateIdentityAssets,ASSET_LIMIT,type IdentityAsset} from '../src/data/identityAssets';
const identityAsset:IdentityAsset={id:'asset1',groupId:'asset1',version:1,file:{name:'logo.png',type:'image/png',size:100} as File,digest:'hash1',attachedAt:at};
test('identity assets reject invalid formats, empty/oversized files, duplicate content and locked uploads',()=>{
 assert.equal(assetFileError({name:'logo.exe',type:'image/png',size:100}),'format');
 assert.equal(assetFileError({name:'logo.svg',type:'text/html',size:100}),'format');
 assert.equal(assetFileError({name:'logo.png',type:'image/png',size:0}),'size');
 assert.equal(assetFileError({name:'logo.png',type:'image/png',size:11*1024*1024}),'size');
 const empty:IdentityAsset[]=[];
 assert.equal(updateIdentityAssets(empty,{type:'attach',asset:identityAsset},false),empty);
 const rows=updateIdentityAssets(empty,{type:'attach',asset:identityAsset},true);
 assert.equal(rows.length,1);
 assert.equal(updateIdentityAssets(rows,{type:'attach',asset:{...identityAsset,id:'other'}},true),rows);
 const full=Array.from({length:ASSET_LIMIT},(_,i)=>({...identityAsset,id:`a${i}`,digest:`h${i}`}));
 assert.equal(updateIdentityAssets(full,{type:'attach',asset:identityAsset},true),full);
});
test('identity review and approval are separate, idempotent; approved versions cannot be removed',()=>{
 let rows=[identityAsset];
 assert.equal(updateIdentityAssets(rows,{type:'approve',id:'asset1',at},true),rows);
 rows=updateIdentityAssets(rows,{type:'review',id:'asset1',at},true);
 assert.equal(updateIdentityAssets(rows,{type:'review',id:'asset1',at:'2026-10-01T10:00:00Z'},true),rows);
 rows=updateIdentityAssets(rows,{type:'approve',id:'asset1',at},true);
 assert.equal(updateIdentityAssets(rows,{type:'remove',id:'asset1',at},true),rows);
 const next=updateIdentityAssets(rows,{type:'attach',replaceId:'asset1',asset:{...identityAsset,id:'asset2',digest:'hash2'}},true);
 assert.equal(next[0],rows[0]);assert.equal(next[1].version,2);assert.equal(next[1].groupId,'asset1');assert.equal(next[1].approvedAt,undefined);
});
test('removed asset drafts can be restored and obsolete versions cannot supersede later approval',()=>{
 const removed=updateIdentityAssets([identityAsset],{type:'remove',id:'asset1',at},true);
 assert.equal(removed[0].removed,true);
 assert.equal(updateIdentityAssets(removed,{type:'approve',id:'asset1',at},true),removed);
 const restored=updateIdentityAssets(removed,{type:'restore',id:'asset1',at},true);
 assert.equal(restored[0].removed,false);
 const versions=[{...identityAsset,reviewedAt:at},{...identityAsset,id:'asset2',version:2,digest:'hash2',reviewedAt:at,approvedAt:at}];
 assert.equal(updateIdentityAssets(versions,{type:'approve',id:'asset1',at},true),versions);
});

import {initialSpatialTicket,transitionSpatialTicket} from '../src/data/spatialTicket';
test('spatial ticket requires rejection before alternative approval and preserves original decisions',()=>{
 assert.equal(transitionSpatialTicket(initialSpatialTicket,{type:'approve-alternative',at}),initialSpatialTicket);
 const rejected=transitionSpatialTicket(initialSpatialTicket,{type:'reject',at});
 assert.equal(rejected.status,'REJECTED_ASSET_RISK');
 assert.equal(rejected.workOrder,undefined);
 assert.equal(transitionSpatialTicket(rejected,{type:'modify',value:'WALL_PAINT'}),rejected);
 assert.equal(transitionSpatialTicket(rejected,{type:'reject',at}),rejected);
 const approved=transitionSpatialTicket(rejected,{type:'approve-alternative',at});
 assert.equal(approved.material,'Carpet');
 assert.equal(approved.history.length,2);
 assert.equal(approved.workOrder?.at,at);
 assert.equal(transitionSpatialTicket(approved,{type:'approve-alternative',at}),approved);
 assert.equal(initialSpatialTicket.history.length,0);
 assert.equal(transitionSpatialTicket(initialSpatialTicket,{type:'reject',at:'invalid'}),initialSpatialTicket);
});

import { dispatchTravel, emptyTravelPacket, addTechnicalRequest, type TravelPacket } from '../src/data/executionBridges';
test('travel dispatch requires PR clearance and both primary documents, and is immutable after dispatch', () => {
 const file = {name:'sample.pdf',type:'application/pdf',size:100} as File;
 assert.equal(dispatchTravel(emptyTravelPacket,true,at),emptyTravelPacket);
 const draft:TravelPacket={status:'DRAFT',files:{visa:file,flight:file}};
 assert.equal(dispatchTravel(draft,false,at),draft);
 const sent=dispatchTravel(draft,true,at);
 assert.equal(sent.status,'TRAVEL_DOCUMENTS_DISPATCHED');
 assert.equal(dispatchTravel(sent,true,'2026-10-01T10:00:00Z'),sent);
 const invalid:TravelPacket={...draft,files:{visa:file,flight:{...file,size:0}}};
 assert.equal(dispatchTravel(invalid,true,at),invalid);
});
test('technical requests validate routing choices and prevent duplicate submissions', () => {
 const request={id:'demo-1',equipment:'AV Projectors',mounting:'Ceiling Mount',phase:'FINAL_INSTALLATION' as const,at};
 const rows=addTechnicalRequest([],request,routedClaims,COMMISSION.id);
 assert.equal(rows.length,1);
 assert.equal(addTechnicalRequest(rows,{...request,id:'demo-2'},routedClaims,COMMISSION.id),rows);
 assert.equal(addTechnicalRequest(rows,{...request,mounting:'supplier decides'}),rows);
});


import { culturalCleared } from '../src/data/culturalDeclaration';
import { ingestMaster, requestPrototype, decidePrototype, type PrototypeTicket } from '../src/data/productionBridge';
test('Committee alone endorses complete declarations; rejection requires immutable consensus minutes',()=>{
 const draft={...dossier,culturalDeclaration:undefined,culturalClearedAt:undefined};
 assert.equal(queueNomination(draft,'COORDINATOR',ASSIGNED_COORDINATOR,[]),null);
 assert.equal(queueNomination(dossier,'HIP',ASSIGNED_COORDINATOR,[]),null);
 assert.equal(queueNomination(dossier,'COORDINATOR','other',[]),null);
 const pending=queueNomination({...dossier,culturalClearedAt:undefined},'COORDINATOR',ASSIGNED_COORDINATOR,[])!;
 assert.equal(pending.status,'PENDING_COMMITTEE_REVIEW');
 assert.equal(directorEligible(pending,[]),false);
 assert.equal(queueNomination(dossier,'PREP_COMMITTEE','unused',[])?.status,'PENDING_COMMITTEE_REVIEW');
 for(const actor of ['HIP','COORDINATOR','BIENNIAL_DIRECTOR','ARTIST'])assert.equal(reviewByCommittee(pending,actor,true,'',[],at),pending);
 assert.equal(reviewByCommittee(pending,'PREP_COMMITTEE',false,'   ',[],at),pending);
 assert.equal(reviewByCommittee(pending,'PREP_COMMITTEE',true,'',['Hazardous Medium: Bronze'],at),pending);
 const rejected=reviewByCommittee(pending,'PREP_COMMITTEE',false,'Consensus minute 07: scope mismatch',[],at);
 assert.equal(rejected.status,'COMMITTEE_REJECTED');
 assert.equal(rejected.committeeReview?.minutes,'Consensus minute 07: scope mismatch');
 assert.equal(reviewByCommittee(rejected,'PREP_COMMITTEE',true,'',[],at),rejected);
 assert.equal(directorEligible(rejected,[]),false);
 const endorsed=reviewByCommittee(pending,'PREP_COMMITTEE',true,'Recorded collective endorsement',[],at);
 assert.equal(endorsed.status,'PENDING_DIRECTOR_REVIEW');
 assert.equal(culturalCleared(endorsed),true);
 assert.equal(directorEligible(endorsed,[]),true);
 assert.equal(directorEligible(endorsed,['Hazardous Medium: Bronze']),false);
 assert.equal(reviewByCommittee(endorsed,'PREP_COMMITTEE',false,'Override',[],at),endorsed);
 assert.equal(safePortfolioUrl('javascript:alert(1)'),undefined);
 assert.equal(safePortfolioUrl('https://example.com/portfolio'),'https://example.com/portfolio');
});
test('digital ingestion rejects links, unsupported formats, oversized files and duplicate assets',()=>{
 const item={id:'video1',file:{name:'master.mp4',size:100,lastModified:1} as File,at};
 assert.equal(ingestMaster([],item,'TECHNICAL').length,0);
 const rows=ingestMaster([],item,'ARTIST');
 assert.equal(rows.length,1);
 assert.equal(ingestMaster(rows,{...item,id:'copy'},'ARTIST'),rows);
 for(const file of [{name:'Dropbox.url',size:10},{name:'master.mov',size:3*1024**3},{name:'empty.m2v',size:0}]) assert.equal(ingestMaster(rows,{...item,file:file as File},'ARTIST'),rows);
});
test('prototype decisions require artist authority and retain first decision timestamp',()=>{
 const ticket:PrototypeTicket={id:'sample1',title:'Rust Coating Test #1',photos:[{name:'test.png',type:'image/png',size:100} as File],status:'PENDING_ARTIST_APPROVAL',requestedAt:at};
 assert.equal(requestPrototype([],ticket,'ARTIST').length,0);
 const rows=requestPrototype([],ticket,'TECHNICAL');
 assert.equal(rows.length,1);
 assert.equal(requestPrototype(rows,ticket,'TECHNICAL'),rows);
 assert.equal(decidePrototype(rows,ticket.id,true,'TECHNICAL',at),rows);
 const approved=decidePrototype(rows,ticket.id,true,'ARTIST',at);
 assert.equal(approved[0].status,'ARTIST_APPROVED');
 assert.equal(approved[0].decidedAt,at);
 assert.equal(decidePrototype(approved,ticket.id,false,'ARTIST','2026-10-02T10:00:00Z'),approved);
 assert.equal(decidePrototype(rows,ticket.id,false,'ARTIST',at)[0].status,'ARTIST_REJECTED');
});


test('deployment phase separates temporary and final equipment requests',()=>{
 const request={id:'phase1',equipment:'AV Projectors',mounting:'Ceiling Mount',phase:'PROTOTYPING' as const,at};
 const rows=addTechnicalRequest([],request,routedClaims,COMMISSION.id);
 assert.equal(addTechnicalRequest(rows,{...request,id:'phase2',phase:'FINAL_INSTALLATION'},routedClaims,COMMISSION.id).length,2);
 assert.equal(addTechnicalRequest(rows,{...request,id:'phase3'}),rows);
});
test('fleet requests use accepted crate snapshots and only Logistics can record departure',()=>{
 const crate={reference:'DEMO-CRATE-1',lengthCm:140,widthCm:100,heightCm:90,grossWeightKg:110};
 let s=reduce(createCommission(),{type:'contracts',update:()=>[{...contract,crate}]});
 const request={type:'request-fleet',actor:'LOGISTICS',contractId:contract.id,vehicle:'3-Ton Hydraulic Pickup',id:'fleet1',at} as const;
 assert.equal(reduce(accepted(),request).fleetTickets,undefined);
 assert.equal(reduce(s,{...request,actor:'COORDINATOR'}),s);
 assert.equal(reduce(s,{...request,contractId:'wrong'}),s);
 s=reduce(s,request);
 assert.equal(s.fleetTickets?.[0].crate.grossWeightKg,110);
 assert.equal(reduce(s,{...request,id:'repeat'}),s);
 const departed=reduce(s,{type:'fleet-transit',actor:'LOGISTICS',ticketId:'fleet1',at});
 assert.equal(departed.fleetTickets?.[0].status,'IN_TRANSIT');
 assert.equal(reduce(departed,{type:'fleet-transit',actor:'LOGISTICS',ticketId:'fleet1',at}),departed);
 assert.equal(reduce(s,{type:'contracts',update:cs=>cs.map(c=>({...c,crate:{...crate,grossWeightKg:20}}))}),s);
});
test('executive impound locks installation and finance until explicit Coordinator acknowledgement',()=>{
 const action={type:'impound',actor:'BIENNIAL_DIRECTOR',artistId:contract.artistId,directives:'Remove unauthorized text from sculpture base.',id:'hold1',at} as const;
 let s=accepted();
 assert.equal(reduce(s,action),s);
 s=reduce(s,{type:'receive-asset',actor:'LOGISTICS',reference:'CRATE-1',at});
 assert.equal(reduce(s,{...action,actor:'TECHNICAL'}),s);
 assert.equal(reduce(s,{...action,directives:' '}),s);
 const held=reduce(s,action);
 assert.equal(held.installationStatus,'EXECUTIVE_IMPOUND');
 assert.equal(held.impounds?.[0].directives,action.directives);
 assert.equal(advanceEligible(held),false);
 assert.equal(milestoneEligible(held,'delivery'),false);
 assert.equal(reduce(held,{type:'technical-check',actor:'TECHNICAL',field:'floorLoadVerified',value:true}),held);
 assert.equal(reduce(held,{type:'record-technical',actor:'TECHNICAL',at}),held);
 assert.equal(reduce(held,action),held);
 const ack={type:'acknowledge-alterations',actor:'COORDINATOR',impoundId:'hold1',confirmed:true,at} as const;
 assert.equal(reduce(held,{...ack,actor:'TECHNICAL'}),held);
 assert.equal(reduce(held,{...ack,confirmed:false}),held);
 const released=reduce(held,ack);
 assert.equal(released.installationStatus,'LOGISTICS_PENDING_PR');
 assert.equal(released.evidence.technicalEvidenceGate,false);
 assert.equal(released.impounds?.[0].acknowledgedAt,at);
 assert.equal(reduce(released,ack),released);
});

import { claimSpace } from '../src/data/spatialClaims';
test('spatial claims enforce approved ownership and lock the space against competing requests',()=>{
 const approved={...dossier,status:'APPROVED' as const};
 const input={spaceId:'sam-hall-1',artistId:approved.id,coordinatorId:ASSIGNED_COORDINATOR,actor:'COORDINATOR',at};
 const empty: import('../src/data/spatialClaims').SpatialClaim[]=[];
 assert.equal(claimSpace(empty,input,[dossier]),empty);
 assert.equal(claimSpace(empty,{...input,actor:'HIP'},[approved]),empty);
 assert.equal(claimSpace(empty,{...input,coordinatorId:'coordinator-3'},[approved]),empty);
 assert.equal(claimSpace(empty,{...input,spaceId:'invented-space'},[approved]),empty);
 const claimed=claimSpace(empty,input,[approved]);
 assert.equal(claimed.length,1);
 assert.equal(claimed[0].artistName,approved.artistName);
 assert.equal(claimed[0].medium,approved.medium);
 assert.equal(claimSpace(claimed,input,[approved]),claimed);
 const competitor={...approved,id:'artist2',assignedCoordinatorId:'coordinator-3'};
 assert.equal(claimSpace(claimed,{...input,artistId:competitor.id,coordinatorId:'coordinator-3'},[competitor]),claimed);
 assert.equal(claimSpace(claimed,{...input,spaceId:'wisdom-lobby',artistId:competitor.id,coordinatorId:'coordinator-3'},[competitor]).length,2);
 assert.equal(claimed[0].claimedAt,at);
});

import { agreementPipelineReady } from '../src/data/workflowEligibility';
import { type SpatialClaim } from '../src/data/spatialClaims';
const routedClaims: SpatialClaim[] = [{spaceId:'wisdom-lobby',venueId:'HOUSE_OF_WISDOM',curator:'House of Wisdom — Venue Curator',artistId:COMMISSION.id,artistName:'Demo',medium:'Bronze',coordinatorId:ASSIGNED_COORDINATOR,coordinatorName:'Demo coordinator',claimedAt:at}];

test('agreement publication gate fails closed except explicit isolated rehearsal',()=>{
 for(const theme of ['DRAFT','CHAIRMAN_APPROVED','PUBLISHED_OFFICIAL']) {
  for(const guidelines of ['DRAFT','PENDING_TRANSLATION','REQUEST_REVISION','PUBLISHED']) {
   assert.equal(agreementPipelineReady(theme,guidelines),theme==='PUBLISHED_OFFICIAL'&&guidelines==='PUBLISHED');
  }
 }
 assert.equal(agreementPipelineReady('DRAFT','DRAFT',true),true);
});

test('amendments retain superseded receipt and fleet history without reusing evidence',()=>{
 const crate={reference:'history-crate',lengthCm:140,widthCm:100,heightCm:90,grossWeightKg:110};
 let state=reduce(createCommission(),{type:'contracts',update:()=>[{...contract,crate}]});
 state=reduce(state,{type:'receive-asset',actor:'LOGISTICS',reference:'receipt-original',at});
 state=reduce(state,{type:'request-fleet',actor:'LOGISTICS',contractId:contract.id,vehicle:'Standard Transit',id:'fleet-original',at});
 const original=state;
 state=reduce(state,{type:'CONTRACT_DISPUTED',actor:'ARTIST',contractId:contract.id,round:{artistJustification:'Amend shipping'} as any});
 state=reduce(state,{type:'contracts',update:rows=>rows.map(c=>({...c,shippingTerms:'Revised shipping'}))});
 assert.equal(state.receiptHistory?.[0].reference,'receipt-original');
 assert.equal(state.receiptHistory?.[0].appliesToRevision,original.agreementRevision);
 assert.equal(state.receiptHistory?.[0].isSuperseded,true);
 assert.equal(state.fleetTickets?.[0].isSuperseded,true);
 assert.equal(original.fleetTickets?.[0].isSuperseded,undefined);
 assert.equal(state.logistics,undefined);
 state=reduce(state,{type:'contracts',update:rows=>rows.map(c=>({...c,status:'ARTIST_APPROVED'}))});
 assert.equal(milestoneEligible(state,'delivery'),false);
 assert.equal(reduce(state,{type:'fleet-transit',actor:'LOGISTICS',ticketId:'fleet-original',at}),state);
 state=reduce(state,{type:'request-fleet',actor:'LOGISTICS',contractId:contract.id,vehicle:'Standard Transit',id:'fleet-new',at});
 assert.equal(state.fleetTickets?.length,2);
 state=reduce(state,{type:'receive-asset',actor:'LOGISTICS',reference:'receipt-new',at});
 assert.equal(state.logistics?.appliesToRevision,state.agreementRevision);
 assert.equal(state.receiptHistory?.length,1);
});

test('venue modifications require the matching artist claim and snapshot its jurisdiction',()=>{
 const request={id:'venue-request',equipment:'Lighting Rig',mounting:'Floor Freestanding',phase:'FINAL_INSTALLATION' as const,at};
 assert.equal(addTechnicalRequest([],request).length,0);
 assert.equal(addTechnicalRequest([],request,routedClaims,'other-artist').length,0);
 const rows=addTechnicalRequest([],request,routedClaims,COMMISSION.id);
 assert.equal(rows[0].venueClaim?.curator,'House of Wisdom — Venue Curator');
 assert.equal(rows[0].venueClaim?.spaceId,'wisdom-lobby');
 assert.notEqual(rows[0].venueClaim,routedClaims[0]);
 assert.equal(addTechnicalRequest([],{...request,equipment:'Pedestal'}).length,1);
});

import { filterProfiles, validPressFile, type MasterProfile } from '../src/data/masterDirectory';
test('master directory filters combine without losing bilingual search or affiliations',()=>{
 const p:MasterProfile={id:'profile',name:'Demo Artist',nationality:'Fictional region',medium:'Video Installation',editions:['12th Edition'],bioAr:'سيرة فنان',bioEn:'Contemporary practice',affiliations:'Demo Gallery',press:[]};
 assert.equal(filterProfiles([p],'gallery','Video Installation','Fictional region','12th Edition').length,1);
 assert.equal(filterProfiles([p],'فنان','','','').length,1);
 assert.equal(filterProfiles([p],'','','','10th Edition').length,0);
 assert.equal(filterProfiles([p],'','Bronze Sculpture','','').length,0);
});
test('press attachments reject non-PDF, empty and oversized files',()=>{
 const file={name:'press.pdf',type:'application/pdf',size:1024} as File;
 assert.equal(validPressFile(file),true);
 assert.equal(validPressFile({...file,name:'press.html'} as File),false);
 assert.equal(validPressFile({...file,size:0} as File),false);
 assert.equal(validPressFile({...file,size:21*1024*1024} as File),false);
});

import { artistRegion, delegateRegion, GENERAL_COORDINATOR_ID } from '../src/data/regionalDelegation';
test('regional tags use exact origin aliases and leave ambiguous origins unclassified',()=>{
 assert.equal(artistRegion({nationality:'United Arab Emirates'}),'GCC');
 assert.equal(artistRegion({nationality:'تركيا'}),'TURKEY_EASTERN_EUROPE');
 assert.equal(artistRegion({nationality:'Jordan / UAE'}),'UNCLASSIFIED');
 assert.equal(artistRegion({nationality:'Unknown'}),'UNCLASSIFIED');
});
test('regional delegation requires general coordinator, transfers whole group and records history',()=>{
 const a={id:'regional-a',nationality:'Turkey',assignedCoordinatorId:'coordinator-1'} as NominatedArtistDossier;
 const b={id:'regional-b',nationality:'Poland',assignedCoordinatorId:'coordinator-2'} as NominatedArtistDossier;
 const c={id:'regional-c',nationality:'Morocco',assignedCoordinatorId:'coordinator-3'} as NominatedArtistDossier;
 const rows=[a,b,c];const input={actor:'COORDINATOR',coordinatorId:GENERAL_COORDINATOR_ID,region:'TURKEY_EASTERN_EUROPE' as const,target:'coordinator-6',at};
 assert.equal(delegateRegion(rows,{...input,coordinatorId:'coordinator-1'},[]),rows);
 assert.equal(delegateRegion(rows,{...input,actor:'HIP'},[]),rows);
 assert.equal(delegateRegion(rows,{...input,target:'invalid'},[]),rows);
 assert.equal(delegateRegion(rows,input,['regional-b']),rows);
 const next=delegateRegion(rows,input,[]);
 assert.equal(next[0].assignedCoordinatorId,'coordinator-6');assert.equal(next[1].assignedCoordinatorId,'coordinator-6');assert.equal(next[2],c);
 assert.equal(next[0].delegationHistory?.[0].from,'coordinator-1');assert.equal(next[0].delegationHistory?.[0].at,at);
 assert.equal(a.assignedCoordinatorId,'coordinator-1');
 assert.equal(delegateRegion(next,input,[]),next);
});

import { canAccessPressKit } from '../src/components/OfficialPressKit';
test('official press kit is available only after accepted agreement and locks during disputes',()=>{
 assert.equal(canAccessPressKit('ARTIST_APPROVED'),true);
 assert.equal(canAccessPressKit('LOCKED'),true);
 for(const status of [undefined,'NOT_DRAFTED','DRAFT','SENT_TO_ARTIST','CONTRACT_DISPUTED','AMENDMENT_UNDER_REVIEW'] as const)assert.equal(canAccessPressKit(status),false);
});

import { damageHold } from '../src/data/conditionReporting';
test('damage requires photo evidence and explicit contractual liability; reports cannot be overwritten',()=>{
 let s=reduce(createCommission(),{type:'contracts',update:()=>[{...contract,shippingLiability:'DEPARTMENT'}]});
 s=reduce(s,{type:'receive-asset',actor:'LOGISTICS',reference:'damage-crate',at});
 const photo={name:'damage.jpg',type:'image/jpeg',size:100} as File;
 const report={type:'record-condition' as const,actor:'LOGISTICS',id:'damage-report',condition:'DAMAGED' as const,photos:[photo],at};
 assert.equal(reduce(s,{...report,photos:[]}),s);
 assert.equal(reduce(s,{...report,actor:'ARTIST'}),s);
 assert.equal(reduce(s,{...report,photos:[{...photo,size:0} as File]}),s);
 const damaged=reduce(s,report);
 assert.equal(damaged.conditionReports?.[0].insuranceStatus,'INSURANCE_CLAIM_PENDING');
 assert.equal(damageHold(damaged),true);
 assert.equal(milestoneEligible(damaged,'delivery'),false);
 assert.equal(reduce(damaged,{...report,condition:'INTACT'}),damaged);
 assert.equal(reduce(damaged,{type:'close-exhibition',actor:'LOGISTICS',at,returnReference:'return',reconciliationReference:'clear'}),damaged);
 assert.equal(reduce(damaged,{type:'record-technical',actor:'TECHNICAL',at}),damaged);
 assert.equal(reduce(damaged,{type:'contracts',update:()=>[]}),damaged);
});
test('artist-liable evidence dispatch and emergency approvals are role-bound and idempotent',()=>{
 let s=reduce(createCommission(),{type:'contracts',update:()=>[{...contract,shippingLiability:'ARTIST'}]});
 s=reduce(s,{type:'receive-asset',actor:'LOGISTICS',reference:'artist-crate',at});
 s=reduce(s,{type:'record-condition',actor:'LOGISTICS',id:'artist-damage',condition:'DAMAGED',photos:[{name:'damage.png',type:'image/png',size:100} as File],at});
 assert.equal(s.conditionReports?.[0].insuranceStatus,undefined);
 const dispatch={type:'dispatch-damage' as const,actor:'LOGISTICS',reportId:'artist-damage',at};
 s=reduce(s,dispatch);assert.equal(s.conditionReports?.[0].artistDispatchedAt,at);assert.equal(reduce(s,dispatch),s);
 const plan={type:'request-plan-b' as const,actor:'LOGISTICS',id:'emergency',reportId:'artist-damage',grant:5000,flight:'Fictional return flight, 10 October',reason:'Reproduction',at};
 assert.equal(reduce(s,{...plan,grant:NaN}),s);assert.equal(reduce(s,{...plan,flight:''}),s);
 s=reduce(s,plan);assert.equal(reduce(s,plan),s);
 const approve={type:'review-plan-b' as const,actor:'FINANCE',requestId:'emergency',approve:true,at};
 assert.equal(reduce(s,approve),s);
 s=reduce(s,{...approve,actor:'BIENNIAL_DIRECTOR'});s=reduce(s,approve);
 assert.equal(s.emergencyRequests?.[0].financeDecision,'APPROVED');assert.equal(reduce(s,approve),s);
 assert.equal(s.ledger,undefined);assert.equal(damageHold(s),true);
});

import { photographyStatus, CATALOG_SCHEDULE } from '../src/data/catalogMetadata';
test('catalog submissions require accepted agreement, valid fields and artist role; history is preserved',()=>{
 const action={type:'submit-catalog' as const,actor:'ARTIST',contractId:contract.id,titleAr:'ميزان',titleEn:'Mizan',statement:'Artist concept',at};
 assert.equal(reduce(createCommission(),action).catalogSubmissions,undefined);
 let state=accepted();
 assert.equal(reduce(state,action),state);
 state={...state,ledger:[{tranche:'advance',amount:3000,at,revision:state.agreementRevision}],contracts:[{...state.contracts[0],tranches:{...state.contracts[0].tranches,advanceStatus:'DISBURSED'}}]};
 assert.equal(reduce(state,{...action,actor:'COORDINATOR'}),state);
 assert.equal(reduce(state,{...action,titleAr:' '}),state);
 assert.equal(reduce(state,{...action,contractId:'someone-else'}),state);
 state=reduce(state,action);assert.equal(state.catalogSubmissions?.length,1);
 assert.equal(state.catalogSubmissions?.[0].agreementRevision,state.agreementRevision);
 assert.equal(reduce(state,action),state);
 state=reduce(state,{...action,statement:'Updated concept'});assert.equal(state.catalogSubmissions?.length,2);
 const disputed={...state,contracts:[{...state.contracts[0],status:'CONTRACT_DISPUTED' as const}]};
 assert.equal(reduce(disputed,action),disputed);
});
test('photography clearance requires current reviewed evidence and deadlines match the master schedule',()=>{
 const d={...contract.documents};assert.equal(photographyStatus(d),'PENDING');
 const submitted={...d,highResArtworkFileName:'photo.tiff',highResUploadedAt:at,highResStatus:'SUBMITTED' as const};
 assert.equal(photographyStatus(submitted),'REVIEW');
 assert.equal(photographyStatus({...submitted,highResStatus:'VERIFIED'}),'REVIEW');
 assert.equal(photographyStatus({...submitted,highResStatus:'VERIFIED',highResVerifiedAt:at}),'CLEARED');
 assert.equal(photographyStatus({...submitted,highResStatus:'VERIFIED',highResVerifiedAt:'2026-01-01T00:00:00Z'}),'REVIEW');
 assert.equal(photographyStatus({...submitted,highResStatus:'REJECTED'}),'REJECTED');
 assert.equal(CATALOG_SCHEDULE.photography,'2026-08-15');assert.equal(CATALOG_SCHEDULE.delivery,'2026-09-10');
});

import { addNudge, deadlineTime, addFabrication, readyFabrication, type FabricationTicket } from '../src/data/deliverableRouting';
test('HIP nudges validate deadline, items, actor and duplicate requests',()=>{
 const n={id:'n1',artistId:'artist-1',items:['VIDEO','SPECS'] as ('VIDEO'|'SPECS')[],deadline:'2026-10-01',createdAt:at};
 assert.equal(Number.isNaN(deadlineTime('2026-02-30')),true);
 assert.equal(deadlineTime('2026-10-01'),Date.parse('2026-10-01T19:59:59Z'));
 assert.equal(addNudge([],n,'COORDINATOR').length,0);
 assert.equal(addNudge([],{...n,items:[]},'HIP').length,0);
 assert.equal(addNudge([],{...n,deadline:'2026-01-01'},'HIP').length,0);
 const rows=addNudge([],n,'HIP');assert.equal(rows.length,1);
 assert.equal(addNudge(rows,{...n,id:'n2',items:['SPECS','VIDEO']},'HIP'),rows);
 assert.equal(addNudge(rows,{...n,id:'n2',artistId:'artist-2'},'HIP').length,2);
});
test('fabrication requests remain separate from disposal, installation and Finance authority',()=>{
 const ticket:FabricationTicket={id:'f1',artistId:'artist-1',item:'Custom plinth',vendor:'Sample vendor',disposition:'DISCARD',status:'PENDING_FABRICATION',createdAt:at};
 assert.equal(addFabrication([],ticket,'TECHNICAL').length,0);
 assert.equal(addFabrication([],ticket,'COORDINATOR',true).length,0);
 assert.equal(addFabrication([],{...ticket,vendor:' '},'COORDINATOR').length,0);
 const rows=addFabrication([],ticket,'COORDINATOR');assert.equal(rows.length,1);
 assert.equal(addFabrication(rows,{...ticket,id:'f2'},'COORDINATOR'),rows);
 assert.equal(readyFabrication(rows,'f1','COORDINATOR',at),rows);
 assert.equal(readyFabrication(rows,'f1','TECHNICAL',at,true),rows);
 const ready=readyFabrication(rows,'f1','TECHNICAL',at);assert.equal(ready[0].status,'READY_FOR_INSTALL');assert.equal(ready[0].disposition,'DISCARD');
 assert.equal(readyFabrication(ready,'f1','TECHNICAL',at),ready);
});
import { validVisaIntake, validPassportPDF, pdfHasSignature, type VisaIntake } from '../src/data/visaIntake';
const visa = ():VisaIntake => ({id:'visa-1',contractId:contract.id,passportNumber:'DEMO123',expiryDate:'2028-10-01',motherName:'Sample',nationality:'Sample',personalPhoto:new File(['test image'],'portrait.jpg',{type:'image/jpeg'}),photoDimensions:{width:1200,height:1600},passport:new File(['%PDF-1.4 sample'], 'sample.pdf',{type:'application/pdf'}),submittedAt:at});
test('visa intake rejects invalid dates, incomplete companion consent and non-PDF files',async()=>{
 const v=visa();assert.equal(validVisaIntake(v),true);
 for(const expiryDate of ['2027-02-30','2026-01-01','invalid'])assert.equal(validVisaIntake({...v,expiryDate}),false);
 assert.equal(validVisaIntake({...v,companion:{name:'Guest',passport:v.passport,liabilityAcknowledged:false as true}}),false);
 assert.equal(validPassportPDF(new File(['x'],'photo.jpg',{type:'image/jpeg'})),false);
 assert.equal(validPassportPDF(new File([],'empty.pdf',{type:'application/pdf'})),false);
 assert.equal(await pdfHasSignature(new File(['not a PDF'],'fake.pdf',{type:'application/pdf'})),false);
 assert.equal(await pdfHasSignature(v.passport),true);
});
test('visa submission is role-bound, idempotent and revokes PR on replacement without deleting history',()=>{
 const s=accepted(), v=visa();
 assert.equal(reduce(s,{type:'submit-visa',actor:'COORDINATOR',intake:v}),s);
 assert.equal(reduce(s,{type:'submit-visa',actor:'ARTIST',intake:{...v,contractId:'other'}}),s);
 const submitted=reduce(s,{type:'submit-visa',actor:'ARTIST',intake:v});
 assert.equal(submitted.visaIntakes?.length,1);
 assert.equal(reduce(submitted,{type:'submit-visa',actor:'ARTIST',intake:v}),submitted);
 const cleared={...submitted,evidence:{...submitted.evidence,prEvidenceGate:true,prRecordedAt:at,passportVerified:true,visaCleared:true}};
 const changed=reduce(cleared,{type:'submit-visa',actor:'ARTIST',intake:{...v,id:'visa-2',passportNumber:'NEW123'}});
 assert.equal(changed.evidence.prEvidenceGate,false);
 assert.equal(changed.evidence.prRecordedAt,undefined);
 assert.equal(changed.visaIntakes?.length,2);
 assert.equal(cleared.evidence.prEvidenceGate,true);
});
import { rosterTransition, validArtwork, type ArtworkRoster, type ArtworkLabel } from '../src/data/artworkRoster';
const label = ():ArtworkLabel => ({id:'a1',titleAr:'ميزان',titleEn:'Balance',descriptionAr:'Description AR',descriptionEn:'A study of balance',year:'2026',medium:'Bronze',height:'10',width:'20',depth:'1',image:new File(['sample'],'sample.png',{type:'image/png'})});
test('artwork roster enforces bilingual complete labels and image constraints',()=>{
 const a=label();assert.equal(validArtwork(a),true);
 for(const patch of [{titleAr:'English'},{titleEn:'ميزان'},{year:'9999'},{height:'0'},{depth:'NaN'},{medium:' '},{image:undefined},{image:new File(['x'],'photo.jpg',{type:'image/jpeg'})}])assert.equal(validArtwork({...a,...patch}),false);
});
test('artwork revisions lock atomically and only assigned Coordinator unlocks requested amendments',()=>{
 const draft:ArtworkRoster={artistId:'artist',status:'DRAFT',exhibitionTitleAr:'Exhibition AR',exhibitionTitleEn:'Balance',items:[label()],history:[],events:[]};
 assert.equal(rosterTransition({...draft,items:[]},{type:'submit',at},'ARTIST').status,'DRAFT');
 const locked=rosterTransition(draft,{type:'submit',at},'ARTIST');
 assert.equal(locked.status,'LOCKED_PENDING_REVIEW');
 assert.equal(rosterTransition(locked,{type:'submit',at},'ARTIST'),locked);
 assert.equal(rosterTransition(locked,{type:'edit',items:[]},'ARTIST'),locked);
 assert.equal(rosterTransition(locked,{type:'unlock',at},'COORDINATOR',true),locked);
 const requested=rosterTransition(locked,{type:'request',at},'ARTIST');
 assert.equal(rosterTransition(requested,{type:'unlock',at},'ARTIST',true),requested);
 assert.equal(rosterTransition(requested,{type:'unlock',at},'COORDINATOR',false),requested);
 const unlocked=rosterTransition(requested,{type:'unlock',at},'COORDINATOR',true);
 const edited=rosterTransition(unlocked,{type:'edit',items:[{...label(),titleEn:'Revised'}]},'ARTIST');
 const revised=rosterTransition(edited,{type:'submit',at},'ARTIST');
 assert.equal(revised.history.length,2);assert.equal(revised.history[0].items[0].titleEn,'Balance');assert.equal(revised.history[1].items[0].titleEn,'Revised');
});
import { validIBAN, metadataUnlocked, type ArtistAdministration } from '../src/data/artistAdministration';
test('IBAN accepts alphanumeric Spanish accounts and rejects invalid checksums',()=>{
 assert.equal(validIBAN('ES91 2100 0418 4502 0005 1332'),true);
 assert.equal(validIBAN('GB82 WEST 1234 5698 7654 32'),true);
 assert.equal(validIBAN('ES00 2100 0418 4502 0005 1332'),false);
 assert.equal(validIBAN('123456789'),false);
});
test('bank/address intake and loan payment are guarded, idempotent and do not substitute for advance',()=>{
 let s=accepted();const data:ArtistAdministration={contractId:contract.id,holder:'Sample Artist',iban:'ES91 2100 0418 4502 0005 1332',address:'Sample Street 12, Unit 4, 10000',country:'Sample Country',city:'Sample City',at};
 assert.equal(reduce(s,{type:'save-administration',actor:'FINANCE',data}),s);
 assert.equal(reduce(s,{type:'save-administration',actor:'ARTIST',data:{...data,address:''}}),s);
 s=reduce(s,{type:'save-administration',actor:'ARTIST',data});assert.equal(s.administration?.iban,'ES9121000418450200051332');
 const pay={type:'record-loan-payment' as const,actor:'FINANCE',contractId:contract.id,amount:100,reference:'SAMPLE-1',at};
 assert.equal(reduce(s,pay),s);
 s={...s,evidence:{...s.evidence,prEvidenceGate:true,technicalEvidenceGate:true}};
 assert.equal(reduce(s,{...pay,actor:'ARTIST'}),s);
 assert.equal(reduce(s,{...pay,amount:-1}),s);
 const paid=reduce(s,pay);assert.equal(paid.loanPayment?.amount,100);
 assert.equal(reduce(paid,pay),paid);assert.equal(metadataUnlocked(paid),false);
 assert.equal(reduce(paid,{type:'save-administration',actor:'ARTIST',data:{...data,holder:'Other'}}),paid);
 const advanced={...paid,ledger:[{tranche:'advance' as const,amount:3000,at,revision:paid.agreementRevision}],contracts:[{...contract,tranches:{...contract.tranches,advanceStatus:'DISBURSED' as const}}]};
 assert.equal(metadataUnlocked(advanced),true);assert.equal(metadataUnlocked({...advanced,agreementRevision:advanced.agreementRevision+1}),false);
});
import { closeoutTransition } from '../src/data/collectionCloseout';
test('acquisition snapshots artist USD price and cancels pending return freight without deleting evidence',()=>{
 let s=accepted();s=reduce(s,{type:'collection-terms',actor:'ARTIST',terms:{priceUSD:4500,returnAddress:'Sample return street, city, country',packing:'Use original crate',at}});
 s=reduce(s,{type:'receive-asset',actor:'LOGISTICS',reference:'R1',at});
 s=reduce(s,{type:'return-ticket',actor:'LOGISTICS',at});assert.equal(s.returnFreight?.status,'PENDING_RETURN');
 assert.equal(reduce(s,{type:'acquire',actor:'ARTIST',at}),s);
 const acquired=reduce(s,{type:'acquire',actor:'BIENNIAL_DIRECTOR',at});
 assert.equal(acquired.acquisition?.priceUSD,4500);assert.equal(acquired.returnFreight?.status,'CANCELLED_ACQUISITION');assert.equal(acquired.returnFreight?.packing,'Use original crate');
 assert.equal(reduce(acquired,{type:'acquire',actor:'BIENNIAL_DIRECTOR',at}),acquired);
 assert.equal(reduce(acquired,{type:'archive',actor:'LOGISTICS',at}),acquired);
});
test('archive requires return AWB and terminal state blocks every commission mutation',()=>{
 let s=accepted();s=reduce(s,{type:'collection-terms',actor:'ARTIST',terms:{priceUSD:4500,returnAddress:'Sample return street, city, country',packing:'Use original crate',at}});
 s=reduce(s,{type:'receive-asset',actor:'LOGISTICS',reference:'R1',at});s=reduce(s,{type:'return-ticket',actor:'LOGISTICS',at});
 assert.equal(reduce(s,{type:'archive',actor:'LOGISTICS',at}),s);
 assert.equal(reduce(s,{type:'return-awb',actor:'LOGISTICS',at,file:new File(['x'],'a.jpg')}),s);
 s=reduce(s,{type:'return-awb',actor:'LOGISTICS',at,file:new File(['%PDF-sample'],'sample.pdf',{type:'application/pdf'})});
 assert.equal(reduce(s,{type:'acquire',actor:'BIENNIAL_DIRECTOR',at}),s);
 assert.equal(reduce(s,{type:'archive',actor:'ARTIST',at}),s);
 const closed=reduce(s,{type:'archive',actor:'LOGISTICS',at});assert.equal(closed.installationStatus,'ARCHIVED_CLOSED');
 assert.equal(reduce(closed,{type:'contracts',update:()=>[]}),closed);
 assert.equal(reduce(closed,{type:'archive',actor:'LOGISTICS',at}),closed);
 assert.equal(reduce(closed,{type:'pr-check',actor:'PR_PROTOCOL',field:'passportVerified',value:true}),closed);
 assert.equal(closeoutTransition(closed,{type:'return-ticket',actor:'LOGISTICS',at}),closed);
});
import { artistExecutionTransition, validLayout } from '../src/data/artistExecution';
test('layout uploads retain revisions and reject unauthorized or archived edits',()=>{
 const s=accepted(),action={type:'upload-layout' as const,actor:'ARTIST',id:'layout-1',contractId:contract.id,file:new File(['sample'],'layout.png',{type:'image/png'}),at};
 assert.equal(validLayout(new File(['x'],'script.svg',{type:'image/svg+xml'})),false);
 assert.equal(reduce(s,{...action,actor:'TECHNICAL'}),s);
 const uploaded=reduce(s,action);assert.equal(uploaded.layoutBlueprints?.length,1);
 assert.equal(reduce(uploaded,action),uploaded);
 const updated=reduce(uploaded,{...action,id:'layout-2'});assert.equal(updated.layoutBlueprints?.length,2);
 const archived={...s,installationStatus:'ARCHIVED_CLOSED' as const};assert.equal(artistExecutionTransition(archived,action),archived);
});
test('domestic pickup uses explicit UAE collection country and approved crate snapshot',()=>{
 let s=accepted();s={...s,contracts:[{...contract,crate:{reference:'CRATE-1',lengthCm:100,widthCm:80,heightCm:60,grossWeightKg:84}}],administration:{contractId:contract.id,holder:'Sample',iban:'ES9121000418450200051332',address:'Sample street 123',country:'UAE',city:'Sharjah',at}};
 const action={type:'request-domestic-pickup' as const,actor:'ARTIST',input:{id:'pickup-1',contractId:contract.id,emirate:'Sharjah',area:'Area',street:'Street',building:'Villa 1',date:'2026-10-01',contact:'Sample',phone:'+971501234567',at}};
 assert.equal(reduce(s,{...action,actor:'COORDINATOR'}),s);
 assert.equal(reduce(s,{...action,input:{...action.input,date:'2026-02-30'}}),s);
 const foreign={...s,administration:{...s.administration!,country:'Spain'}};assert.equal(reduce(foreign,action),foreign);
 assert.equal(reduce(s,{...action,input:{...action.input,phone:'-------'}}),s);
 const queued=reduce(s,action);assert.equal(queued.domesticPickups?.[0].status,'PENDING_COLLECTION');assert.equal(queued.domesticPickups?.[0].crate.grossWeightKg,84);assert.notEqual(queued.domesticPickups?.[0].crate,s.contracts[0].crate);
 assert.equal(reduce(queued,{...action,input:{...action.input,id:'duplicate'}}),queued);
 const delivered={...s,logistics:{status:'PHYSICAL_ASSET_RECEIVED' as const,reference:'R',receivedAt:at}};assert.equal(reduce(delivered,action),delivered);
});
import { validProductionSpecs } from '../src/data/artworkRoster';
test('production specs are conditional and reject invalid or unchecked technical PDFs',()=>{
 const a=label();assert.equal(validProductionSpecs(a),true);
 assert.equal(validProductionSpecs({...a,productionEnabled:true}),false);
 assert.equal(validProductionSpecs({...a,productionEnabled:true,avRequirements:'Screen 55 inch, loop audio'}),true);
 const file=new File(['%PDF-sample'],'schematics.pdf',{type:'application/pdf'});
 assert.equal(validProductionSpecs({...a,productionEnabled:true,printingFraming:'Paper A, frame 50x70 cm',technicalPDF:file}),false);
 assert.equal(validProductionSpecs({...a,productionEnabled:true,printingFraming:'Paper A, frame 50x70 cm',technicalPDF:file,technicalPDFVerified:true}),true);
 assert.equal(validProductionSpecs({...a,productionEnabled:true,avRequirements:'Screen',technicalPDF:new File(['x'],'sheet.jpg'),technicalPDFVerified:true}),false);
});
test('submitted production instructions remain immutable during authorized amendment',()=>{
 const item={...label(),productionEnabled:true,printingFraming:'Original paper'};
 const draft:ArtworkRoster={artistId:'artist',status:'DRAFT',exhibitionTitleAr:'Exhibition AR',exhibitionTitleEn:'Balance',items:[item],history:[],events:[]};
 const locked=rosterTransition(draft,{type:'submit',at},'ARTIST');
 assert.equal(rosterTransition(locked,{type:'edit',items:[{...item,printingFraming:'Changed'}]},'ARTIST'),locked);
 const request=rosterTransition(locked,{type:'request',at},'ARTIST');
 const unlocked=rosterTransition(request,{type:'unlock',at},'COORDINATOR',true);
 const edited=rosterTransition(unlocked,{type:'edit',items:[{...item,printingFraming:'Changed'}]},'ARTIST');
 assert.equal(edited.history[0].items[0].printingFraming,'Original paper');
 assert.equal(edited.items[0].printingFraming,'Changed');
});
import { assignee, clearVenue, emptyGovernance, setDelegation, type Governance } from '../src/data/venueGovernance';
test('leave routing requires a backup and preserves same-role authority',()=>{
 assert.equal(setDelegation(emptyGovernance,'HIP',true,''),emptyGovernance);
 const delegated=setDelegation(emptyGovernance,'HIP',true,'Sample backup');
 assert.equal(assignee('HIP',delegated.delegations),'HIP:backup');
 assert.equal(assignee('PR_PROTOCOL',delegated.delegations),'PR_PROTOCOL:primary');
 assert.equal(assignee('HIP',setDelegation(delegated,'HIP',false,'Sample backup').delegations),'HIP:primary');
});
test('venue clearance enforces designated host, readiness, delegated reviewer and idempotent notifications',()=>{
 const s:Governance={delegations:{},tickets:{one:{id:'one',artistId:'a1',title:'Plinth',venueId:'SHARJAH_ART_MUSEUM',authority:'Museum Curator',coordinator:'Coordinator',vendor:'Sample Vendor',constraints:['Floor protection'],blocked:false,status:'PENDING_VENUE_APPROVAL'}}};
 assert.equal(clearVenue(s,'one','TECHNICAL:primary',at),s);
 assert.equal(clearVenue(s,'one','VENUE:HOUSE_OF_WISDOM:primary',at),s);
 const blocked={...s,tickets:{one:{...s.tickets.one,blocked:true}}};assert.equal(clearVenue(blocked,'one','VENUE:SHARJAH_ART_MUSEUM:primary',at),blocked);
 const leave=setDelegation(s,'VENUE:SHARJAH_ART_MUSEUM',true,'Backup host');
 assert.equal(clearVenue(leave,'one','VENUE:SHARJAH_ART_MUSEUM:primary',at),leave);
 const approved=clearVenue(leave,'one','VENUE:SHARJAH_ART_MUSEUM:backup',at);
 assert.equal(approved.tickets.one.status,'APPROVED_FOR_INSTALLATION');assert.equal(approved.tickets.one.notifications?.length,2);
 assert.equal(clearVenue(approved,'one','VENUE:SHARJAH_ART_MUSEUM:backup',at),approved);
 assert.equal(s.tickets.one.status,'PENDING_VENUE_APPROVAL');
});


test('portal invitation freezes terms and requires identity before agreement creation', () => {
  const draft={...contract,status:'SENT_TO_ARTIST' as const,shippingLiability:'DEPARTMENT' as const,venue:'DEPARTMENT',crate:{reference:'TEST',lengthCm:100,widthCm:100,heightCm:100,grossWeightKg:84}};
  const action={type:'dispatch-invitation' as const,actor:'COORDINATOR',pipelineReady:true,id:'invite-1',at,contract:draft};
  const initial=createCommission();
  assert.equal(reduce(initial,{...action,actor:'ARTIST'}),initial);
  assert.equal(reduce(initial,{...action,pipelineReady:false}),initial);
  assert.equal(reduce(initial,{...action,contract:{...draft,venue:'SHARJAH_ART_MUSEUM'}}),initial);
  const pending=reduce(initial,action);
  assert.equal(pending.invitation?.status,'INVITATION_DISPATCHED');
  assert.equal(pending.contracts.length,0);
  assert.equal(operationalHandoff(pending,false).owner,'ARTIST');
  assert.equal(reduce(pending,action),pending);
  assert.equal(reduce(pending,{type:'contracts',update:()=>[draft]}),pending);
  const confirm={type:'confirm-identity' as const,actor:'ARTIST',pipelineReady:true,invitationId:'invite-1',legalName:'Noura Corrected',at};
  for(const patch of [{actor:'COORDINATOR'},{pipelineReady:false},{invitationId:'wrong'},{legalName:'   '},{legalName:'1234'},{legalName:'Name\u202E'},{at:'invalid'}])assert.equal(reduce(pending,{...confirm,...patch}),pending);
  const confirmed=reduce(pending,confirm);
  assert.equal(confirmed.contracts[0].artistName,'Noura Corrected');
  assert.equal(confirmed.contracts[0].status,'SENT_TO_ARTIST');
  assert.equal(confirmed.invitation?.originalName,COMMISSION.artistName);
  assert.equal(confirmed.agreementRevision,1);
  assert.equal(reduce(confirmed,confirm),confirmed);
  assert.equal(reduce(confirmed,{type:'contracts',update:rows=>rows.map(c=>({...c,artistName:'Another name'}))}),confirmed);
  assert.equal(advanceEligible(confirmed),false);
  assert.notEqual(pending.invitation?.draft,draft);
});


test('dated banking receipts require Finance, valid banking, and an existing tranche; replay preserves the snapshot',()=>{
 let s=accepted();const bank={contractId:contract.id,holder:'Sample Beneficiary',bankName:'Fictional Bank',bic:'AAAAESMMXXX',iban:'ES9121000418450200051332',address:'Sample gallery, street 123',country:'France',city:'Paris',at};
 s=reduce(s,{type:'save-administration',actor:'ARTIST',data:bank});
 const action={type:'record-payment-receipt' as const,actor:'FINANCE',tranche:'advance',date:'2026-09-28',at};
 assert.equal(reduce(s,action),s);
 s={...s,ledger:[{tranche:'advance',amount:3000,at,revision:s.agreementRevision}]};
 assert.equal(reduce(s,{...action,actor:'ARTIST'}),s);
 assert.equal(reduce(s,{...action,date:'2026-02-30'}),s);
 const next=reduce(s,action);assert.equal(next.paymentReceipts?.[0].date,'2026-09-28');assert.equal(next.paymentReceipts?.[0].bank.country,'France');
 assert.equal(reduce(next,action),next);
 assert.equal(reduce(next,{type:'save-administration',actor:'ARTIST',data:{...bank,holder:'Changed'}}),next);
});
test('freight uses per-artwork physical origin, rejects unknown assets and freezes ticket snapshots',()=>{
 let s=accepted();const assetId=`${contract.id}:1`;
 assert.equal(reduce(s,{type:'request-origin-freight',actor:'LOGISTICS',assetId,at}),s);
 const save={type:'save-origin' as const,actor:'ARTIST',assetId,address:'Sample Gallery, 10 Rue Example, Paris',country:'France',at};
 assert.equal(reduce(s,{...save,assetId:'unknown'}),s);
 s=reduce(s,save);assert.equal(s.freightOrigins?.[assetId].country,'France');
 assert.equal(reduce(s,{type:'request-origin-freight',actor:'ARTIST',assetId,at}),s);
 const next=reduce(s,{type:'request-origin-freight',actor:'LOGISTICS',assetId,at});
 assert.equal(next.originTickets?.[0].address,save.address);assert.equal(next.originTickets?.[0].country,'France');
 assert.equal(reduce(next,{...save,address:'Different address'}),next);
 assert.equal(reduce(next,{type:'request-origin-freight',actor:'LOGISTICS',assetId,at}),next);
 assert.equal(reduce({...s,agreementRevision:s.agreementRevision+1},{type:'request-origin-freight',actor:'LOGISTICS',assetId,at}).originTickets,undefined);
});

import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {PaymentReceiptSync,ArtworkFreightOrigins} from '../src/components/BankingFreightBridge';
test('banking and freight views render dated receipts and per-artwork origin without nationality fallback',()=>{
 const s=accepted();
 const artist=renderToStaticMarkup(createElement(ArtworkFreightOrigins,{state:s,actor:'ARTIST'}));
 assert.match(artist,/Current Physical Location/);assert.match(artist,/Current country/);
 const logistics=renderToStaticMarkup(createElement(ArtworkFreightOrigins,{state:s,actor:'LOGISTICS'}));
 assert.match(logistics,/Artist must provide/);assert.doesNotMatch(logistics,/Fictional country/);
 assert.match(renderToStaticMarkup(createElement(PaymentReceiptSync,{state:s,actor:'FINANCE'})),/Transaction date/);
});

import {completeScenario,mediaContentType,type SpatialZone,type ScenarioMedia} from '../src/data/exhibitionScenario';
test('scenario requires every declared media category for each distinct complete zone',()=>{
 const zone:SpatialZone={id:'zone1',name:'Wall 1',artworkCount:2,medium:'Print and video',displaySpecifications:'Matte glass',printRequired:true,avRequired:true,darkRoom:true};
 const print:ScenarioMedia={object_name:'print',scenario_id:'s',zone_id:'zone1',category:'PRINT',file_name:'a.png'};
 assert.equal(completeScenario([],[]),false);assert.equal(completeScenario([zone],[print]),false);
 const av={...print,object_name:'video',category:'AV' as const};
 assert.equal(completeScenario([zone],[print,av]),true);
 assert.equal(completeScenario([zone,{...zone,id:'zone2'}],[print,av]),false);
 assert.equal(completeScenario([zone,zone],[print,av]),false);
 assert.equal(completeScenario([{...zone,displaySpecifications:' '}],[print,av]),false);
 assert.equal(completeScenario([{...zone,artworkCount:1.5}],[print,av]),false);
});
test('scenario media checks category, extension, file header and empty payloads',async()=>{
 assert.equal(await mediaContentType(new File(['fake'],'forged.png'),'PRINT'),null);
 assert.equal(await mediaContentType(new File([new Uint8Array([137,80,78,71,13,10,26,10,0])],'sample.png'),'PRINT'),'image/png');
 assert.equal(await mediaContentType(new File([new Uint8Array([137,80,78,71,13,10,26,10,0])],'sample.png'),'AV'),null);
 assert.equal(await mediaContentType(new File([],'video.mov'),'AV'),null);
 assert.equal(await mediaContentType(new File([new Uint8Array([0,0,0,20,102,116,121,112,113,116,32,32])],'sample.mov'),'AV'),'video/quicktime');
});

import {ExhibitionScenario} from '../src/components/ExhibitionScenario';
test('scenario submission stays disabled without configured authenticated storage',()=>{
 const html=renderToStaticMarkup(createElement(ExhibitionScenario));
 assert.match(html,/Submission is locked/);assert.match(html,/disabled=""[^>]*>إرسال الملفات النهائية/);
});

import {vaultNotification} from '../src/lib/vaultNotification';
import {tusEndpoint,MEDIA_LIMIT,createMediaTransfer} from '../src/lib/resumableMedia';
import {Upload} from 'tus-js-client';
import type {SupabaseClient} from '@supabase/supabase-js';
test('vault notification repeats notice, escapes body and rejects unsafe links and injected headers',()=>{
 const mail=vaultNotification('Missing files','<script>bad</script>','https://vault.example/artist?token=sample','https://vault.example');
 assert.equal(mail.text.split('⚠️ IMPORTANT:').length,3);assert.equal(mail.html.split('⚠️ IMPORTANT:').length,3);
 assert.ok(mail.html.includes('&lt;script&gt;'));assert.ok(!mail.html.includes('<script>'));
 assert.throws(()=>vaultNotification('A\r\nB','body','https://vault.example/','https://vault.example'));
 assert.throws(()=>vaultNotification('A','body','https://other.example/','https://vault.example'));
 assert.equal(mail.headers['Auto-Submitted'],'auto-generated');
});
test('resumable upload retains task for retry, uses 6 MiB chunks and cancels without overwrite',async()=>{
 let starts=0;const progress:number[]=[];
 class SimulatedUpload extends Upload {async findPreviousUploads(){return [];}start(){starts++;assert.equal(this.options.chunkSize,6*1024*1024);assert.equal(this.options.storeFingerprintForResuming,true);this.options.onProgress?.(5,10);if(starts===1)this.options.onError?.(new Error('Network interrupted'));else this.options.onSuccess?.({lastResponse:null});}async abort(){}}
 const task=createMediaTransfer(new File(['sample'],'a.png'),'user/path/a.png','image/png','user',p=>progress.push(p),{client:{} as SupabaseClient,url:'http://127.0.0.1:54321',UploadClass:SimulatedUpload});
 await assert.rejects(task.start(),/interrupted/);await task.start();assert.equal(starts,2);assert.deepEqual(progress,[50,50]);task.cancel();await assert.rejects(task.start(),/cancelled/);
 assert.equal(tusEndpoint('https://abc.supabase.co'),'https://abc.storage.supabase.co/storage/v1/upload/resumable');
 assert.equal(tusEndpoint('http://127.0.0.1:54321'),'http://127.0.0.1:54321/storage/v1/upload/resumable');assert.equal(MEDIA_LIMIT,2147483648);
});
test('heavy media validation accepts a declared 2 GiB header without buffering the full file and rejects oversize',async()=>{
 const f=new File([new Uint8Array([73,73,42,0])],'large.tiff');Object.defineProperty(f,'size',{value:2147483648,configurable:true});assert.equal(await mediaContentType(f,'PRINT'),'image/tiff');Object.defineProperty(f,'size',{value:2147483649});assert.equal(await mediaContentType(f,'PRINT'),null);
});

import {publishBoundaries,nominationOpen,categoryTags} from '../src/data/curatorialBoundaries';
test('curatorial publication requires HIP, bilingual guidelines, category review and completed Director decisions',()=>{
 const publish=(actor='HIP',theme='PUBLISHED_OFFICIAL',status='PUBLISHED',pending=false,checks=[true,true,true])=>publishBoundaries(null,actor,theme,status,'دليل','Guidelines',['Restricted Medium: Abstract Ink','Restricted Style: Non-Classical Script'],pending,checks,at);
 assert.equal(nominationOpen(null),false);assert.equal(publish('COORDINATOR'),null);assert.equal(publish('HIP','DRAFT'),null);assert.equal(publish('HIP','PUBLISHED_OFFICIAL','PENDING_TRANSLATION'),null);assert.equal(publish('HIP','PUBLISHED_OFFICIAL','PUBLISHED',true),null);assert.equal(publish('HIP','PUBLISHED_OFFICIAL','PUBLISHED',false,[true,false,true]),null);
 const locked=publish()!;assert.equal(nominationOpen(locked),true);assert.equal(locked.status,'CURATORIAL_DIRECTIVES_PUBLISHED');assert.deepEqual(categoryTags(locked.tags,'Style'),['Restricted Style: Non-Classical Script']);assert.deepEqual(categoryTags(locked.tags,'Nationality'),[]);
 assert.equal(publishBoundaries(locked,'HIP','PUBLISHED_OFFICIAL','PUBLISHED','Changed','Changed',[],false,[true,true,true],at),locked);
 const tags=['Restricted Medium: Abstract Ink'];const snapshot=publishBoundaries(null,'HIP','PUBLISHED_OFFICIAL','PUBLISHED','دليل','Guide',tags,false,[true,true,true],at)!;tags.push('Other');assert.equal(snapshot.tags.length,1);
});
import {CuratorialBoundaries} from '../src/components/CuratorialBoundaries';
test('Coordinator boundaries gate renders a waiting state, then the exact published master list',()=>{
 assert.match(renderToStaticMarkup(createElement(CuratorialBoundaries,{isAr:false})),/Waiting for Head of International Programs/);
 const published=publishBoundaries(null,'HIP','PUBLISHED_OFFICIAL','PUBLISHED','دليل','Guide',['Restricted Medium: Abstract Ink'],false,[true,true,true],at);
 const html=renderToStaticMarkup(createElement(CuratorialBoundaries,{isAr:false,published}));assert.match(html,/Active Curatorial Boundaries/);assert.match(html,/Restricted Medium: Abstract Ink/);assert.match(html,/None declared/);
});


test('two-tranche 30/70 agreements cannot disburse a zero completion milestone', () => {
 const two={...contract,tranches:{...contract.tranches,deliveryPercentage:70,deliveryAmount:7000,installationPercentage:0,installationAmount:0}};
 assert.equal(validAgreement(two),true);
 let state=reduce(createCommission(),{type:'contracts',update:()=>[two]});
 state={...state,logistics:{appliesToRevision:state.agreementRevision,status:'PHYSICAL_ASSET_RECEIVED',receivedAt:at,reference:'receipt'}};
 state=reduce(state,{type:'record-condition',actor:'LOGISTICS',id:'two-tranche-inspection',condition:'INTACT',photos:[],at});
 state=reduce(state,{type:'verify-arrival',actor:'LOGISTICS',token:state.logistics!.reference,inspection:{lengthCm:100,widthCm:80,heightCm:60,grossWeightKg:100,seal:'MATCH',condition:'INTACT'}});
 state=reduce(state,{type:'close-exhibition',actor:'LOGISTICS',returnReference:'return',reconciliationReference:'condition',at});
 assert.equal(milestoneEligible(state,'delivery'),true);
 assert.equal(milestoneEligible(state,'completion'),false);
 assert.equal(reduce(state,{type:'record-tranche',actor:'FINANCE',tranche:'completion',at}),state);
 assert.equal(validAgreement({...two,tranches:{...two.tranches,installationAmount:0.5,deliveryAmount:6999.5}}),false);
 assert.equal(validAgreement({...two,tranches:{...two.tranches,advancePercentage:-1,deliveryPercentage:101}}),false);
});


import {CoordinatorContractWorkspace} from '../src/components/CoordinatorContractWorkspace';
import {ContractSecureIntake} from '../src/components/ContractSecureIntake';
test('contract queues distinguish Director-approved intake from disputed amendments',()=>{
 const base={name_ar:'فنان',name_en:'Approved Test',nationality:'Test',medium:'Test',category:'EMERGING' as const};
 const html=renderToStaticMarkup(createElement(CoordinatorContractWorkspace,{isAr:false,artists:[{...base,id:'a',status:'DIRECTOR_APPROVED'},{...base,id:'b',name_en:'Amendment Test',status:'CONTRACT_DISPUTED'},{...base,id:'c',name_en:'Unreviewed Test',status:'PENDING_COMMITTEE_REVIEW'}],onDispatchContract:()=>false}));
 assert.match(html,/Approved Test/);assert.match(html,/Agreement Amendment Queue/);assert.match(html,/Amendment Test/);assert.doesNotMatch(html,/Unreviewed Test/);
});
test('secure intake never offers unauthenticated uploads',()=>{
 const html=renderToStaticMarkup(createElement(ContractSecureIntake));
 assert.equal((html.match(/type="file" disabled=""/g)??[]).length,2);
 assert.match(html,/Sign in at \/pilot/);
});


test('automated compliance holds cannot be manually endorsed by Committee or HIP',()=>{
 const held=queueNomination(dossier,'COORDINATOR',ASSIGNED_COORDINATOR,['Restricted Nationality: Country X'])!;
 assert.equal(held.status,'HIP_BLOCKED');
 assert.equal(reviewByCommittee(held,'PREP_COMMITTEE',true,'Override',[],at),held);
 assert.equal(reviewByCommittee(held,'HIP',false,'Reject',[],at),held);
 assert.equal(directorEligible(held,[]),false);
});

import {dossierEvents} from '../src/data/dossierTimeline';
import {DossierTimeline} from '../src/components/DossierTimeline';
import {readRecovery,saveRecovery,recoveryKey,validZoneDraft} from '../src/lib/mediaRecovery';
test('timeline uses dated evidence only, preserves order and does not infer compliance',()=>{
 const d={id:'a',submittedBy:'Coordinator',submittedAt:'2026-01-02T00:00:00Z',status:'APPROVED',committeeReview:{decision:'ENDORSED',actor:'PREP_COMMITTEE',at:'2026-01-03T00:00:00Z'},decisionAt:'bad'} as any;
 const before=JSON.stringify(d);const events=dossierEvents(d);
 assert.deepEqual(events.map(e=>e.id),['submission','committee']);assert.equal(JSON.stringify(d),before);
 const html=renderToStaticMarkup(createElement(DossierTimeline,{dossier:d,isAr:false}));assert.match(html,/not an immutable legal ledger/);assert.doesNotMatch(html,/Blocklist cleared/);
 const ar=renderToStaticMarkup(createElement(DossierTimeline,{dossier:d,isAr:true}));assert.match(ar,/dir="rtl"/);
});
test('timeline contract events are scoped to artist and retain amendment requests',()=>{
 const d={id:'a',submittedAt:'bad'} as any;
 const contract={id:'c',artistId:'a',auditTrail:[{id:'r',requestedAt:'2026-02-01T00:00:00Z',resolvedAt:'2026-02-02T00:00:00Z'}]} as any;
 assert.equal(dossierEvents(d,[contract]).length,2);assert.equal(dossierEvents({...d,id:'other'},[contract]).length,0);
});
test('recovery isolates projects and users and safely handles malformed browser storage',()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage');const map=new Map<string,string>();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>map.set(k,v)}});
 try{const key=recoveryKey('p','a','draft');assert.equal(saveRecovery(key,{name:'draft'}),true);assert.deepEqual(readRecovery(key),{name:'draft'});assert.equal(readRecovery(recoveryKey('p','b','draft')),null);assert.equal(readRecovery(recoveryKey('q','a','draft')),null);map.set(key,'invalid');assert.equal(readRecovery(key),null);map.set(key,JSON.stringify({at:0,value:'expired'}));assert.equal(readRecovery(key),null);assert.equal(validZoneDraft([null]),false);assert.equal(validZoneDraft([{id:'x'}]),false);}finally{if(original)Object.defineProperty(globalThis,'localStorage',original);else Reflect.deleteProperty(globalThis,'localStorage');}
});
test('restart resumes only a matching server URL and concurrent starts share one transfer',async()=>{
 let resumed='';let starts=0;let options:any;
 class RecoveryUpload extends Upload {
  async findPreviousUploads(){return [{uploadUrl:'https://wrong.example/upload',urlStorageKey:'bad'},{uploadUrl:'http://127.0.0.1:54321/storage/v1/upload/resumable/saved',urlStorageKey:'ok'}] as any;}
  resumeFromPreviousUpload(p:any){resumed=p.uploadUrl;}
  start(){starts++;options=this.options;this.options.onSuccess?.({lastResponse:null});}
 }
 const file=new File(['a'],'a.png');const task=createMediaTransfer(file,'u/path','image/png','u',()=>{}, {client:{} as SupabaseClient,url:'http://127.0.0.1:54321',UploadClass:RecoveryUpload});
 const first=task.start();assert.equal(task.start(),first);await first;assert.equal(starts,1);assert.match(resumed,/resumable\/saved$/);const fingerprint=await options.fingerprint();assert.match(fingerprint,/u\/path/);assert.equal(options.removeFingerprintOnSuccess,true);
});

import {idlePhase,IDLE_WARNING_MS,IDLE_LOCK_MS} from '../src/data/idleLock';
test('idle warning begins at nine minutes and locks at ten',()=>{
 const start=1000;assert.equal(idlePhase(start,start+IDLE_WARNING_MS-1),'active');assert.equal(idlePhase(start,start+IDLE_WARNING_MS),'warning');assert.equal(idlePhase(start,start+IDLE_LOCK_MS-1),'warning');assert.equal(idlePhase(start,start+IDLE_LOCK_MS),'locked');
});
test('sleep and timer throttling do not bypass idle lock, and activity cannot unlock it',()=>{
 assert.equal(idlePhase(1000,1000+60*60*1000),'locked');assert.equal(idlePhase(1000,1000,true),'locked');assert.equal(idlePhase(1000,1000,false),'active');
});


import {requiredWallMeters,crateToken} from '../src/data/logisticsExpansion';
test('wall planning adds 40cm for every work and fails closed for missing widths',()=>{
 assert.equal(requiredWallMeters([{width:'100'},{width:'200'}]),3.8);
 for(const width of ['', '0', '-5', 'Infinity','abc'])assert.equal(requiredWallMeters([{width}]),null);
 assert.equal(requiredWallMeters([]),null);
});
test('local production requires approved vendor proof before delivery and rejects freight paths',()=>{
 const local={...contract,productionOrigin:'LOCAL_FABRICATION' as const,localVendorId:'demo-print'};
 let s=reduce(createCommission(),{type:'contracts',update:()=>[local]});
 const delivery={type:'local-production' as const,actor:'COORDINATOR',stage:'DELIVERED' as const,reference:'Vendor receipt',at};
 assert.equal(reduce(s,delivery),s);
 assert.equal(reduce(s,{type:'save-origin',actor:'ARTIST',assetId:`${local.id}:1`,address:'A valid physical location',country:'France',at}),s);
 assert.equal(reduce(s,{type:'receive-asset',actor:'LOGISTICS',reference:'local receipt',at}),s);
 const proof={...delivery,stage:'PROOF_RECORDED' as const};
 assert.equal(reduce(s,{...proof,actor:'ARTIST'}),s);
 s=reduce(s,proof);assert.equal(reduce(s,proof),s);
 s=reduce(s,delivery);assert.equal(s.localProductionEvents?.length,2);
 assert.equal(milestoneEligible(s,'delivery'),false);
 s=reduce(s,{type:'receive-asset',actor:'LOGISTICS',reference:'local receipt',at});
 s=reduce(s,{type:'record-condition',actor:'LOGISTICS',id:'local inspection',condition:'INTACT',photos:[],at});
 s=reduce(s,{type:'verify-arrival',actor:'LOGISTICS',token:s.logistics!.reference,inspection:{lengthCm:100,widthCm:80,heightCm:60,grossWeightKg:100,seal:'MATCH',condition:'INTACT'}});
 assert.equal(milestoneEligible(s,'delivery'),true);assert.equal(milestoneEligible(s,'completion'),false);
 assert.equal(crateToken(s),null);
 assert.equal(reduce(s,{type:'contracts',update:rows=>rows.map(c=>({...c,localVendorId:'demo-frame'}))}),s);
});
test('QR receipt rejects wrong or stale tokens, requires damage evidence and records intact inspection atomically',()=>{
 const c={...contract,productionOrigin:'INTERNATIONAL_FREIGHT' as const,crate:{reference:'crate-1',lengthCm:100,widthCm:80,heightCm:60,grossWeightKg:100}};
 const s=reduce(createCommission(),{type:'contracts',update:()=>[c]});
 const a={type:'receive-crate' as const,inspection:{lengthCm:100,widthCm:80,heightCm:60,grossWeightKg:100,seal:'MATCH' as const,condition:'INTACT' as const},actor:'LOGISTICS',token:crateToken(s)!,condition:'INTACT' as const,photos:[],id:'inspection',at};
 assert.equal(reduce(s,{...a,actor:'ARTIST'}),s);
 assert.equal(reduce(s,{...a,token:'unknown'}),s);
 const revised={...s,agreementRevision:s.agreementRevision+1};assert.equal(reduce(revised,a),revised);
 assert.equal(reduce(s,{...a,condition:'DAMAGED'}),s);
 const result=reduce(s,a);assert.ok(result.logistics);assert.equal(result.conditionReports?.length,1);
 assert.equal(milestoneEligible(result,'delivery'),true);assert.equal(milestoneEligible(result,'completion'),false);
 assert.equal(reduce(result,a),result);
 const damaged=reduce(s,{...a,condition:'DAMAGED',inspection:{...a.inspection,condition:'MINOR_DAMAGE'},photos:[new File(['image'],'damage.png',{type:'image/png'})]});
 assert.equal(damaged.conditionReports?.[0].insuranceStatus,'INSURANCE_CLAIM_PENDING');assert.equal(milestoneEligible(damaged,'delivery'),false);
});

import {conceptWords,validConcept,safeMapUrl,labelCSV} from '../src/data/catalogFreight';
test('catalog concepts enforce 50 words, map links reject credentials and lookalike hosts',()=>{
 assert.equal(conceptWords('  two   words '),2);assert.equal(validConcept(''),false);
 assert.equal(validConcept(Array(50).fill('word').join(' ')),true);assert.equal(validConcept(Array(51).fill('word').join(' ')),false);
 assert.equal(safeMapUrl('https://maps.app.goo.gl/test'),true);
 for(const url of ['javascript:alert(1)','https://maps.google.com.evil.org/','https://user:pass@www.google.com/maps','http://www.google.com/maps'])assert.equal(safeMapUrl(url),false);
});
test('wall-label CSV exports only translated records and neutralizes spreadsheet formulas',()=>{
 const label={id:'id',source:{title:'  =HYPERLINK("bad")',language:'en',medium:'Ink',concept:'Study'},translation_ar:{title:'ميزان',medium:'حبر',concept:'دراسة'},translation_status:'TRANSLATION_COMPLETED'} as any;
 const csv=labelCSV([label,{...label,id:'pending-id',translation_status:'PENDING_TRANSLATION'}]);
 assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes("'  =HYPERLINK"));assert.ok(!csv.includes('pending-id'));assert.ok(csv.includes('ميزان'));
});


test('gallery freight data requires positive measurements, currency and trusted map host', async () => {
 const {validConsignment}=await import('../src/data/consignment');
 const data={length_cm:100,width_cm:80,height_cm:40,weight_kg:84,insurance_value:8000,currency:'EUR',country:'France',city:'Paris',district:'Test',street:'Test',building:'Test Gallery',map_url:'https://maps.google.com/?q=test',hours:'8 AM - noon',phone:'+33123456789'};
 assert.equal(validConsignment(data),true);
 for(const patch of [{weight_kg:0},{length_cm:-1},{insurance_value:Infinity},{currency:'XYZ'},{phone:''},{map_url:'https://maps.google.com.evil.invalid/'}])assert.equal(validConsignment({...data,...patch}),false);
});


test('dock clearance rejects invalid dimensions and tampering, persists verified measurements and resets on revision',()=>{
 const c={...contract,productionOrigin:'INTERNATIONAL_FREIGHT' as const,crate:{reference:'dock-crate',lengthCm:100,widthCm:80,heightCm:60,grossWeightKg:100}};
 const s=reduce(createCommission(),{type:'contracts',update:()=>[c]});
 const inspection={lengthCm:110,widthCm:85,heightCm:65,grossWeightKg:114,seal:'MATCH' as const,condition:'INTACT' as const};
 const a={type:'receive-crate' as const,actor:'LOGISTICS',token:crateToken(s)!,inspection,condition:'INTACT' as const,photos:[],id:'dock-inspection',at};
 assert.equal(reduce(s,{...a,inspection:{...inspection,widthCm:0}}),s);
 assert.equal(reduce(s,{...a,inspection:{...inspection,grossWeightKg:NaN}}),s);
 assert.equal(reduce(s,{...a,inspection:{...inspection,seal:'TAMPERED'}}),s);
 const booked=reduce(s,{type:'request-fleet',actor:'LOGISTICS',contractId:c.id,vehicle:'Standard Transit',id:'old-fleet',at});
 const measured=reduce(booked,a);assert.equal(measured.fleetTickets?.[0].isSuperseded,true);
 const cleared=reduce(s,a);assert.equal(milestoneEligible(cleared,'delivery'),true);assert.equal(cleared.logistics?.inspection?.grossWeightKg,114);
 assert.equal(milestoneEligible({...cleared,agreementRevision:cleared.agreementRevision+1},'delivery'),false);
 const held=reduce(s,{...a,condition:'DAMAGED',inspection:{...inspection,seal:'TAMPERED'},photos:[new File(['photo'],'seal.png',{type:'image/png'})]});
 assert.ok(held.logistics);assert.equal(milestoneEligible(held,'delivery'),false);
});


test('repair authorization is artist-only, immutable and does not clear damaged artwork',()=>{
 let s=accepted();s=reduce(s,{type:'receive-asset',actor:'LOGISTICS',reference:'damage-receipt',at});
 s=reduce(s,{type:'record-condition',actor:'LOGISTICS',id:'damage-review',condition:'DAMAGED',photos:[new File(['photo'],'damage.png',{type:'image/png'})],at});
 const a={type:'authorize-repair' as const,actor:'ARTIST',reportId:'damage-review',choice:'DEPARTMENT' as const,at};
 assert.equal(reduce(s,{...a,actor:'TECHNICAL'}),s);
 const decided=reduce(s,a);assert.equal(decided.conditionReports?.[0].repairChoice,'DEPARTMENT');
 assert.equal(reduce(decided,{...a,choice:'ARTIST'}),decided);
 assert.equal(milestoneEligible(decided,'delivery'),false);
});
test('PR intake rejects absent MIME, wrong photo format and insufficient pixels',()=>{
 const v=visa();
 assert.equal(validPassportPDF(new File(['%PDF-'],'passport.pdf')),false);
 assert.equal(validVisaIntake({...v,personalPhoto:undefined}),false);
 assert.equal(validVisaIntake({...v,photoDimensions:{width:100,height:100}}),false);
 assert.equal(validVisaIntake({...v,personalPhoto:new File(['x'],'photo.png',{type:'image/jpeg'})}),false);
});


test('theme batches require three distinct Arabic proposals without mandatory English', () => {
  const proposal = {arabicName:'الميزان',englishName:'',aestheticFramework:'إطار',contemporaryRelevance:'صلة',curatorialJustification:'مبرر'};
  const batch = [proposal, {...proposal,arabicName:'النقطة'}, {...proposal,arabicName:'تجليات'}];
  assert.equal(isThemeBatchComplete(batch),true);
  assert.equal(isThemeBatchComplete(batch.slice(0,2)),false);
  assert.equal(isThemeBatchComplete([proposal, {...proposal,arabicName:' الميزان '},batch[2]]),false);
  assert.equal(isThemeBatchComplete([batch[0],batch[1],{...batch[2],aestheticFramework:''}]),false);
});

import {verifyTextualContent,textualCleared,validDeclaration} from '../src/data/culturalDeclaration';
import {completePrototype} from '../src/data/productionBridge';
test('exact textual verification is HIP-only and precedes Committee to Director handoff',()=>{
 const text={containsText:true,exactText:'Fictional source text with reference',explanation:'Translation and context'};
 assert.equal(validDeclaration({...text,exactText:''}),false);
 const pending=queueNomination({...dossier,culturalDeclaration:text},'COORDINATOR',ASSIGNED_COORDINATOR,[])!;
 assert.equal(reviewByCommittee(pending,'PREP_COMMITTEE',true,'',[],at),pending);
 for(const actor of ['TECHNICAL','ARTIST','COORDINATOR','BIENNIAL_DIRECTOR','PREP_COMMITTEE'])assert.equal(verifyTextualContent(pending,actor,at),pending);
 const verified=verifyTextualContent(pending,'HIP',at);
 assert.equal(textualCleared(verified),true);
 assert.equal(verifyTextualContent(verified,'HIP','2026-10-02T10:00:00Z'),verified);
 assert.equal(verified.status,'PENDING_COMMITTEE_REVIEW');
 const endorsed=reviewByCommittee(verified,'PREP_COMMITTEE',true,'Verified',[],at);
 assert.equal(directorEligible(endorsed,[]),true);
 assert.equal(directorEligible({...endorsed,culturalDeclaration:{...text,exactText:'Replacement text'}},[]),false);
 assert.equal(directorEligible({...endorsed,proposedWorkTitle:'Different work'},[]),false);
 assert.equal(verifyTextualContent(pending,'HIP','invalid'),pending);
});
test('test-work completion requires current-revision artist approval and preserves decisions',()=>{
 const ticket:PrototypeTicket={id:'coating',title:'Coating test',photos:[{name:'test.png',type:'image/png',size:100} as File],status:'PENDING_ARTIST_APPROVAL',requestedAt:at,revision:1};
 const rows=requestPrototype([],ticket,'TECHNICAL');
 assert.equal(completePrototype(rows,ticket.id,'TECHNICAL',at,1),rows);
 assert.equal(decidePrototype(rows,ticket.id,true,'ARTIST',at,2),rows);
 const approved=decidePrototype(rows,ticket.id,true,'ARTIST',at,1);
 assert.equal(completePrototype(approved,ticket.id,'ARTIST',at,1),approved);
 assert.equal(completePrototype(approved,ticket.id,'TECHNICAL',at,2),approved);
 const done=completePrototype(approved,ticket.id,'TECHNICAL',at,1);
 assert.equal(done[0].completedAt,at);
 assert.equal(done[0].decidedAt,at);
 assert.equal(completePrototype(done,ticket.id,'TECHNICAL','2026-10-02T10:00:00Z',1),done);
 const rejected=decidePrototype(rows,ticket.id,false,'ARTIST',at,1);
 assert.equal(completePrototype(rejected,ticket.id,'TECHNICAL',at,1),rejected);
});

import {resourceTransition,contingencyOpen,responseDue,type ResourceTicket} from '../src/data/interAgencyResources';
import {institutionalMetrics,reassignDossier} from '../src/data/institutionalMetrics';
test('inter-agency contingency opens at 48 hours or denial, with independent assignment and Finance guards',()=>{
 const t:ResourceTicket={id:'saf1',artistId:'d1',scopeKey:'c1:1',agency:'SAF',resource:'3-Ton Hydraulic Pickup',requiredAt:'2026-10-10T10:00:00Z',requestedAt:at};
 const keys={d1:'c1:1'};const apply=(rows:ResourceTicket[],action:Parameters<typeof resourceTransition>[1],actor:string,time=at,assigned=['d1'],scope=keys)=>resourceTransition(rows,action,actor,time,['d1'],assigned,'demo-coordinator',scope);
 assert.equal(apply([],{type:'request',ticket:t},'COORDINATOR').length,0);
 const rows=apply([],{type:'request',ticket:t},'TECHNICAL');assert.equal(rows.length,1);
 assert.equal(apply(rows,{type:'request',ticket:{...t,id:'duplicate'}},'TECHNICAL'),rows);
 assert.equal(contingencyOpen(t,responseDue(t)-1),false);assert.equal(contingencyOpen(t,responseDue(t)),true);
 const late=new Date(responseDue(t)).toISOString();const rental={type:'rental',id:t.id,vendor:'Fictional Rental',amount:500,reason:'No agency response'} as const;
 assert.equal(apply(rows,rental,'COORDINATOR'),rows);assert.equal(apply(rows,rental,'COORDINATOR',late,[]),rows);
 assert.equal(apply(rows,rental,'COORDINATOR',late,['d1'],{d1:'c1:2'}),rows);
 const requested=apply(rows,rental,'COORDINATOR',late);assert.equal(requested[0].rental?.amount,500);
 assert.equal(apply(requested,rental,'COORDINATOR',late),requested);
 const decision={type:'finance',id:t.id,approve:true,reference:'FIN-01'} as const;
 assert.equal(apply(requested,decision,'COORDINATOR',late),requested);
 const funded=apply(requested,decision,'FINANCE',late);assert.equal(funded[0].rental?.decision,'APPROVED');assert.equal(apply(funded,decision,'FINANCE',late),funded);
 const denied=apply(rows,{type:'response',id:t.id,status:'DENIED',reference:'SAF-response-01'},'TECHNICAL');assert.equal(contingencyOpen(denied[0],Date.parse(at)),true);
 assert.equal(apply(denied,rental,'COORDINATOR')[0].rental?.amount,500);
 const confirmed=apply(requested,{type:'response',id:t.id,status:'CONFIRMED',reference:'SAF-response-02',deliveryAt:t.requiredAt},'TECHNICAL',late);
 assert.equal(contingencyOpen(confirmed[0],Date.parse(late)),false);assert.equal(apply(confirmed,decision,'FINANCE',late),confirmed);
 assert.equal(apply(rows,{type:'response',id:t.id,status:'CONFIRMED',reference:'Missing date'},'TECHNICAL'),rows);
});
test('institutional totals deduplicate people, distinguish accepted/executed and exclude revoked workloads',()=>{
 const approved={...dossier,id:'a',status:'APPROVED' as const,artworkCount:4};
 const other={...approved,id:'b',artworkCount:undefined};
 const metrics=institutionalMetrics([approved,approved,other],[{id:'a',status:'CONTRACT_EXECUTED',prCleared:true},{id:'a',status:'CONTRACT_EXECUTED',prCleared:true},{id:'b',status:'LOGISTICS_PENDING_PR'}]);
 assert.equal(metrics.executedArtists,1);assert.equal(metrics.clearedGuests,1);assert.equal(metrics.approvedDossiers,2);
 assert.equal(metrics.workloads[0].artworks,4);assert.equal(metrics.workloads[0].unknownCounts,1);
 const held=institutionalMetrics([approved],[{id:'a',status:'EXECUTIVE_IMPOUND',prCleared:true}]);assert.equal(held.approvedDossiers,0);assert.equal(held.clearedGuests,1);
 const cancelled=institutionalMetrics([approved,other],[{id:'a',status:'DIRECTOR_VETOED',prCleared:true},{id:'b',status:'ARCHIVED_CLOSED'}]);assert.equal(cancelled.approvedDossiers,0);assert.equal(cancelled.clearedGuests,0);
 const rows=[approved];assert.equal(reassignDossier(rows,'a','coordinator-2','Workload','HIP',at,[]),rows);assert.equal(reassignDossier(rows,'a','coordinator-2','Workload','BIENNIAL_DIRECTOR',at,['a']),rows);
 const moved=reassignDossier(rows,'a','coordinator-2','Workload','BIENNIAL_DIRECTOR',at,[]);assert.equal(moved[0].assignedCoordinatorId,'coordinator-2');assert.equal(moved[0].delegationHistory?.[0].from,ASSIGNED_COORDINATOR);
});

import {publicationComplete,currentPublication} from '../src/data/artworkRoster';
import {pickupDateAllowed} from '../src/data/catalogFreight';
test('publication requires complete bilingual snapshot and Editorial; amendment revokes design export',()=>{
 const draft:ArtworkRoster={artistId:'test',status:'DRAFT',items:[label()],history:[],events:[],exhibitionTitleAr:'AR',exhibitionTitleEn:'EN'};
 assert.equal(publicationComplete({...draft,exhibitionTitleEn:''}),false);
 assert.equal(publicationComplete({...draft,items:[{...label(),descriptionEn:''}]}),false);
 const locked=rosterTransition(draft,{type:'submit',at},'ARTIST');
 const action={type:'publish' as const,at,revision:1,inspected:true};
 assert.equal(rosterTransition(locked,action,'ARTIST'),locked);
 assert.equal(rosterTransition(locked,{...action,revision:2},'EDITORIAL'),locked);
 assert.equal(rosterTransition(locked,{...action,inspected:false},'EDITORIAL'),locked);
 const published=rosterTransition(locked,action,'EDITORIAL');assert.equal(currentPublication(published)?.revision,1);
 assert.equal(rosterTransition(published,action,'EDITORIAL'),published);
 const requested=rosterTransition(published,{type:'request',at},'ARTIST');assert.equal(currentPublication(requested),undefined);
 assert.equal(requested.publications?.length,1);assert.equal(requested.history[0].items[0].titleEn,'Balance');
});
test('pickup blackout is inclusive and invalid ranges fail closed',()=>{
 for(const day of ['2026-09-13','2026-09-18','2026-09-22'])assert.equal(pickupDateAllowed(day,'2026-09-13','2026-09-22'),false);
 for(const day of ['2026-09-03','2026-09-12','2026-09-23'])assert.equal(pickupDateAllowed(day,'2026-09-13','2026-09-22'),true);
 assert.equal(pickupDateAllowed('2026-09-03','2026-09-13',null),false);
 assert.equal(pickupDateAllowed('2026-02-30'),false);
});

import {pickupWithinSchedule,PICKUP_DEADLINE} from '../src/data/catalogFreight';
test('edition calendar rejects December typo, expired intake and stale approval dates',()=>{
 assert.equal(PICKUP_DEADLINE,'2026-09-10');
 assert.equal(pickupWithinSchedule('2026-09-03',null,null,'2026-09-01'),true);
 assert.equal(pickupWithinSchedule('2026-12-03',null,null,'2026-09-01'),false);
 assert.equal(pickupWithinSchedule('2026-09-10',null,null,'2026-09-01'),true);
 assert.equal(pickupWithinSchedule('2026-09-11',null,null,'2026-09-01'),false);
 assert.equal(pickupWithinSchedule('2026-09-03',null,null,'2026-09-29'),false);
 assert.equal(pickupWithinSchedule('2026-09-03','2026-09-03','2026-09-05','2026-09-01'),false);
});

test('spatial planning requires a PDF blueprint separate from print/video media',async()=>{
 const z:SpatialZone={id:'z',name:'Wall',artworkCount:1,medium:'Ink',displaySpecifications:'Wall mount',printRequired:true,avRequired:false,darkRoom:false,requires_spatial_planning:true};
 const print:ScenarioMedia={scenario_id:'s',zone_id:'z',object_name:'print',category:'PRINT',file_name:'a.png'};
 assert.equal(completeScenario([z],[print]),false);
 assert.equal(completeScenario([z],[print,{...print,category:'BLUEPRINT',object_name:'pdf',file_name:'layout.pdf'}]),true);
 assert.equal(await mediaContentType(new File(['not PDF'],'layout.pdf'),'BLUEPRINT'),null);
 assert.equal(await mediaContentType(new File(['%PDF-1.7'],'layout.pdf'),'BLUEPRINT'),'application/pdf');
 const large=new File(['%PDF-1.7'],'layout.pdf');Object.defineProperty(large,'size',{value:20971521});assert.equal(await mediaContentType(large,'BLUEPRINT'),null);
});
