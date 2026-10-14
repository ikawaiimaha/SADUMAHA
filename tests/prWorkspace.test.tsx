import React from 'react';
import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import PRWorkspace from '../src/components/PRWorkspace';
import FinanceWorkspace from '../src/components/FinanceWorkspace';
import TechnicalWorkspace from '../src/components/TechnicalWorkspace';
import { AgreementMilestones } from '../src/components/CommissionSummary';
import { COMMISSION, createCommission, commissionReducer as reduce, advanceEligible } from '../src/data/commissionScenario';
import type { BilateralContract } from '../src/types/contractStage6';

const contract = (): BilateralContract => ({
  id: 'contract-demo', artistId: COMMISSION.id, artistName: COMMISSION.artistName,
  artistCategory: 'Emerging', nationality: 'United Arab Emirates', medium: 'Bronze',
  proposedWorkTitle: COMMISSION.title, productionCost: 45000, shippingTerms: 'Sample delivery',
  cancellationClauseMandatory: false, status: 'ARTIST_APPROVED', auditTrail: [],
  tranches: { advancePercentage: 25, advanceAmount: 11250, advanceStatus: 'PENDING',
    deliveryPercentage: 35, deliveryAmount: 15750, deliveryStatus: 'PENDING',
    installationPercentage: 40, installationAmount: 18000, installationStatus: 'PENDING' },
  documents: { passportStatus: 'NOT_UPLOADED', artworkDpi: 0, highResStatus: 'NOT_UPLOADED', catalogBioStatus: 'DRAFT' },
});
const withContract = (c: BilateralContract) => reduce(createCommission(), {type:'contracts',update:()=>[c]});
const initial = () => withContract(contract());
const advanceButton = (html: string) => html.match(/<button[^>]*aria-describedby="advance-help"[^>]*>/)?.[0] ?? '';
const at = '2026-09-26T10:00:00Z';
const authorize = {type:'authorize-advance',actor:'FINANCE',at} as const;
function pr(s = initial()) {
  s=reduce(s,{type:'pr-check',actor:'PR_PROTOCOL',field:'passportVerified',value:true});
  s=reduce(s,{type:'pr-check',actor:'PR_PROTOCOL',field:'visaCleared',value:true});
  return reduce(s,{type:'record-pr',actor:'PR_PROTOCOL',at});
}
function technical(s = initial()) {
  s=reduce(s,{type:'technical-check',actor:'TECHNICAL',field:'floorLoadVerified',value:true});
  s=reduce(s,{type:'technical-check',actor:'TECHNICAL',field:'mountingVerified',value:true});
  return reduce(s,{type:'record-technical',actor:'TECHNICAL',at});
}

test('advance requires BOTH recorded specialist gates; no specialist automatically approves',()=>{
  for (const state of [initial(),pr(),technical()]) {
    assert.equal(advanceEligible(state),false);
    assert.strictEqual(reduce(state,authorize),state);
  }
  const ready=technical(pr());
  assert.equal(ready.evidence.financeApprovalGate,false);
  assert.equal(advanceEligible(ready),true);
  const result=reduce(ready,authorize);
  assert.equal(result.evidence.financeApprovalGate,true);
  assert.equal(result.evidence.advanceAuthorizedAt,at);
  assert.deepEqual(result.ledger,[{tranche:'advance',amount:11250,at,revision:1}]);
  assert.equal(result.contracts[0].tranches.advanceStatus,'DISBURSED');
  assert.equal(result.paymentReceipts,undefined,'a ledger entry is not a bank settlement receipt');
  assert.strictEqual(reduce(result,authorize),result,'duplicate approval is a no-op');
});

test('partial checks and incorrect actors cannot record or authorize evidence',()=>{
  let state=initial();
  state=reduce(state,{type:'pr-check',actor:'PR_PROTOCOL',field:'passportVerified',value:true});
  assert.strictEqual(reduce(state,{type:'record-pr',actor:'PR_PROTOCOL',at}),state);
  assert.strictEqual(reduce(state,{type:'technical-check',actor:'FINANCE',field:'floorLoadVerified',value:true}),state);
  const ready=technical(pr());
  assert.strictEqual(reduce(ready,{...authorize,actor:'PR_PROTOCOL'}),ready);
  assert.strictEqual(reduce(ready,{...authorize,actor:'TECHNICAL'}),ready);
});

test('unsigned and disputed contracts remain locked despite evidence',()=>{
  const unsigned=technical(pr(withContract({...contract(),status:'SENT_TO_ARTIST'})));
  assert.equal(advanceEligible(unsigned),false);
  assert.strictEqual(reduce(unsigned,authorize),unsigned);

  const accepted=initial();
  assert.strictEqual(reduce(accepted,{type:'contracts',update:cs=>cs.map(c=>({...c,status:'SENT_TO_ARTIST'}))}),accepted,
    'a generic update cannot unlock an accepted contract');
  let disputed=reduce(accepted,{type:'CONTRACT_DISPUTED',actor:'ARTIST',contractId:'contract-demo',round:{id:'round-1',artistJustification:'Shipping terms need revision'}});
  assert.equal(disputed.contracts[0].status,'CONTRACT_DISPUTED');
  disputed=technical(pr(disputed));
  assert.equal(advanceEligible(disputed),false);
  assert.strictEqual(reduce(disputed,authorize),disputed);
});

test('revising a draft agreement invalidates evidence; recorded advance freezes the terms',()=>{
  const draft=technical(pr(withContract({...contract(),status:'DRAFT'})));
  assert.equal(draft.evidence.prEvidenceGate,true);
  const changed=reduce(draft,{type:'contracts',update:cs=>cs.map(c=>({...c,shippingTerms:'Changed venue'}))});
  assert.equal(changed.agreementRevision,2);
  assert.equal(changed.evidence.prEvidenceGate,false);
  assert.equal(changed.evidence.technicalEvidenceGate,false);
  assert.equal(changed.evidence.financeApprovalGate,false);

  const approved=reduce(technical(pr()),authorize);
  assert.strictEqual(reduce(approved,{type:'contracts',update:cs=>cs.map(c=>({...c,shippingTerms:'Changed venue'}))}),approved);
});

test('reopening a specialist check clears only that gate and never re-enables the advance',()=>{
  const ready=technical(pr());
  const reopened=reduce(ready,{type:'technical-check',actor:'TECHNICAL',field:'mountingVerified',value:false});
  assert.equal(reopened.evidence.prEvidenceGate,true);
  assert.equal(reopened.evidence.technicalEvidenceGate,false);
  assert.equal(advanceEligible(reopened),false);

  const approved=reduce(ready,authorize);
  const changed=reduce(approved,{type:'technical-check',actor:'TECHNICAL',field:'mountingVerified',value:false});
  assert.equal(changed.evidence.prEvidenceGate,true);
  assert.equal(changed.evidence.technicalEvidenceGate,false);
  assert.equal(changed.evidence.financeApprovalGate,true,'a recorded advance stays in history');
  assert.equal(advanceEligible(technical(changed)),false,'the advance cannot be recorded twice');
});

test('PR includes only identity and travel, no imagery or structural controls',()=>{
  for (const isAr of [false,true]) {
    const html=renderToStaticMarkup(<PRWorkspace isAr={isAr} state={pr()} onCheck={()=>{}} onClearPR={()=>{}} />);
    assert.doesNotMatch(html,/300 DPI|High.Res|Mounting|84|Floor Load|CLEARED_FOR_FINANCE/);
    assert.match(html,isAr ? /التحقق من وثائق الهوية والسفر/ : /Verify Identity &amp; Travel Documents/);
    assert.match(html,isAr ? /dir="rtl"/ : /dir="ltr"/);
  }
});

test('Finance uses exact nondefault Coordinator percentages and amounts with a locked action',()=>{
  const state=initial();
  const html=renderToStaticMarkup(<FinanceWorkspace isAr={false} state={state} onAuthorizeAdvance={()=>{}}/>);
  assert.match(html,/25%/); assert.match(html,/35%/); assert.match(html,/40%/);
  assert.match(html,/11,250/); assert.match(html,/15,750/); assert.match(html,/18,000/);
  assert.match(advanceButton(html),/disabled=""/); assert.doesNotMatch(html,/Authorize Final Clearing|70%/);
  const ready=renderToStaticMarkup(<FinanceWorkspace isAr={false} state={technical(pr())} artist={{id: COMMISSION.id, prCleared: true, technicalCleared: true}} onAuthorizeAdvance={()=>{}}/>);
  assert.notEqual(advanceButton(ready),'');
  assert.doesNotMatch(advanceButton(ready),/disabled=""/);
});

test('Technical requires both checks and describes a simulation, not a calculation',()=>{
  const html=renderToStaticMarkup(<TechnicalWorkspace isAr={false} state={initial()} onCheck={()=>{}} onClearTechnical={()=>{}}/>);
  assert.match(html,/Approve 84 kg Floor Load Variance/);
  assert.match(html,/Verify Mounting Bracket Specs/);
  assert.match(html,/disabled=""/);
  assert.match(html,/not an engineering calculation/);
});

test('no contract means no fallback financial amounts; unrelated artists are excluded',()=>{
  const state=reduce(createCommission(),{type:'contracts',update:()=>[{...contract(),artistId:'other'}]});
  assert.equal(state.contracts.length,0);
  assert.equal(advanceEligible(state),false);
  const html=renderToStaticMarkup(<FinanceWorkspace isAr={false} state={state} onAuthorizeAdvance={()=>{}}/>);
  assert.match(html,/No fallback amounts/);
});

test('malformed agreement cannot enable approval',()=>{
  const accepted=initial();
  assert.strictEqual(reduce(accepted,{type:'contracts',update:cs=>cs.map(c=>({...c,productionCost:NaN}))}),accepted,
    'accepted terms cannot be replaced');
  const state=technical(pr(withContract({...contract(),productionCost:NaN})));
  assert.equal(advanceEligible(state),false);
  assert.strictEqual(reduce(state,authorize),state);
});


test('Finance fails closed for missing, partial or mismatched artist clearances', () => {
  const state = technical(pr());
  for (const artist of [undefined, { id: COMMISSION.id, prCleared: true },
    { id: COMMISSION.id, technicalCleared: true }, { id: 'other', prCleared: true, technicalCleared: true }]) {
    const html = renderToStaticMarkup(<FinanceWorkspace isAr={false} state={state} artist={artist} onAuthorizeAdvance={()=>{}} />);
    assert.match(advanceButton(html), /disabled=""/);
    assert.match(html, /Waiting on .* clearance/);
  }
});
