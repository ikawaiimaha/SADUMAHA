import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { airportService, arrivalPreviewReady, type ArrivalDraft } from '../src/data/arrivalPackage';
import { ArrivalPackagePreview } from '../src/components/ArrivalPackagePreview';
import {buildArrivalPackage,recordArrivalDispatch,type ArrivalRecipient} from '../src/data/arrivalPackage';
import {ArrivalDispatchPanel} from '../src/components/ArrivalDispatchPanel';
const reviewed: ArrivalDraft = {airport:'DXB',flight:'DEMO 101',terminal:'3',arrivalLocal:'2026-10-03T01:30',identityReviewed:true,identityReviewedFor:'Fictional guest',itineraryReviewed:true,welcomeGuideIncluded:true};
const recipient:ArrivalRecipient={id:'demo',artistName:'Fictional guest',status:'APPROVED',assignedCoordinatorId:'coordinator',arrivalRecipientTag:'GUEST_ARTIST',approvalRevision:1};
test('arrival manifests fail closed and never give guest artists jury documents',()=>{
  for(const airport of ['DXB','SHJ']) {
    const packet=buildArrivalPackage(recipient,{...reviewed,airport})!;
    assert.equal(packet.service,airport==='DXB'?'Marhaba':'Hala');
    assert.equal(packet.attachments.includes('JUDGING_MECHANISM_PDF'),false);
    assert.equal(buildArrivalPackage({...recipient,arrivalRecipientTag:'JURY_MEMBER'},{...reviewed,airport})!.attachments.includes('JUDGING_MECHANISM_PDF'),true);
  }
  assert.equal(buildArrivalPackage({...recipient,arrivalRecipientTag:undefined},reviewed),null);
  assert.equal(buildArrivalPackage({...recipient,artistName:'Corrected legal name'},reviewed),null);
  assert.equal(buildArrivalPackage({...recipient,status:'PENDING_DIRECTOR_REVIEW'},reviewed),null);
  assert.equal(buildArrivalPackage(recipient,{...reviewed,airport:'AUH'}),null);
});
test('only assigned Coordinators record unique reviewed snapshots without overwriting history',()=>{
  const at='2026-09-29T10:00:00Z';
  const rows=recordArrivalDispatch([],recipient,reviewed,'COORDINATOR','coordinator',true,at);
  assert.equal(rows.length,1);
  assert.equal(recordArrivalDispatch(rows,recipient,reviewed,'COORDINATOR','coordinator',true,at),rows);
  for(const actor of ['HIP','PR_PROTOCOL','ARTIST']) assert.equal(recordArrivalDispatch([],recipient,reviewed,actor,'coordinator',true,at).length,0);
  assert.equal(recordArrivalDispatch([],recipient,reviewed,'COORDINATOR','other',true,at).length,0);
  assert.equal(recordArrivalDispatch([],recipient,reviewed,'COORDINATOR','coordinator',false,at).length,0);
  assert.equal(recordArrivalDispatch([],recipient,reviewed,'COORDINATOR','coordinator',true,'invalid').length,0);
  const changed={...reviewed,airport:'SHJ',itineraryReviewed:false};
  assert.equal(recordArrivalDispatch(rows,recipient,changed,'COORDINATOR','coordinator',true,at),rows);
  const next=recordArrivalDispatch(rows,recipient,{...changed,itineraryReviewed:true},'COORDINATOR','coordinator',true,at);
  assert.equal(next.length,2);assert.equal(rows[0].service,'Marhaba');assert.equal(next[1].service,'Hala');
  assert.notEqual(rows[0].itinerary,reviewed);
});
test('Coordinator waiting view cannot edit recipient designation or message template',()=>{
  const html=renderToStaticMarkup(<ArrivalDispatchPanel recipient={recipient} records={[]} isAr={false} publicationReady onDispatch={()=>{}}/>);
  assert.match(html,/disabled=""/);assert.doesNotMatch(html,/<textarea|<select|JUDGING_MECHANISM|Judging Mechanism|href=/);
});
test('airport routing never falls back to a different provider', () => {
  assert.equal(airportService('DXB'),'Marhaba');
  assert.equal(airportService('SHJ'),'Hala');
  for (const code of ['', 'OTHER', 'AUH']) {
    assert.equal(airportService(code),null);
    assert.equal(arrivalPreviewReady({...reviewed,airport:code}),false);
  }
});
test('preview requires itinerary and all human review checks', () => {
  assert.equal(arrivalPreviewReady(reviewed),true);
  for(const field of ['identityReviewed','itineraryReviewed','welcomeGuideIncluded'] as const) assert.equal(arrivalPreviewReady({...reviewed,[field]:false}),false);
  for(const field of ['flight','terminal','arrivalLocal'] as const) assert.equal(arrivalPreviewReady({...reviewed,[field]:''}),false);
  for (const arrivalLocal of ['2026-99-99T25:00','2026-02-31T01:30']) assert.equal(arrivalPreviewReady({...reviewed,arrivalLocal}),false);
});
test('initial UI clearly marks a local unverified preview and has no dispatch or upload', () => {
  const html=renderToStaticMarkup(<ArrivalPackagePreview isAr={false} artistName="Fictional artist"/>);
  assert.match(html,/Sample data \/ Unverified/);
  assert.match(html,/Draft saved for this session/);
  assert.match(html,/disabled=""/);
  assert.doesNotMatch(html,/type="file"|href=|chat.whatsapp|mailto:/);
});
