import test from 'node:test';import assert from 'node:assert/strict';
import {addCalendarMonths,immigrationGate,assetGate,vendorProjection,shippingSLADue,visaRejectionGate,governanceMiddleware,type ArtworkEvidence,type Actor} from '../server/governance/validation';
const policy={version:'test',approvedReference:'TEST ONLY',active:true,validFrom:'2026-01-01',validUntil:'2026-12-31',passportMonths:6,nationalIdCountries:['IQ','PK']};
test('calendar-month passport rule and configured national ID gate fail closed',()=>{
 assert.equal(addCalendarMonths('2026-08-31',6),'2027-02-28');
 const input={arrival:'2026-10-06',passportExpiry:'2027-04-05',nationality:'IQ',nationalIdVerified:false};
 assert.throws(()=>immigrationGate(input,policy,'2026-09-29'),/PASSPORT_VALIDITY/);
 assert.throws(()=>immigrationGate({...input,passportExpiry:'2027-04-06'},policy,'2026-09-29'),/NATIONAL_ID/);
 assert.doesNotThrow(()=>immigrationGate({...input,passportExpiry:'2027-04-06',nationalIdVerified:true},policy,'2026-09-29'));
 assert.throws(()=>immigrationGate(input,{...policy,active:false},'2026-09-29'),/POLICY_NOT_APPROVED/);
});
test('complete assets require current image and Editorial revisions; zero insurance is valid',()=>{
 const a:ArtworkEvidence={id:'a',revision:2,title:{ar:'عنوان',en:'Title'},materials:{ar:'حبر',en:'Ink'},concept:{ar:'نبذة',en:'Concept'},height:1,width:1,depth:1,year:2026,insuranceValue:0,insuranceCurrency:'AED',textualDeclarationComplete:true,image:{artworkId:'a',revision:2,storageVerified:true,scanClean:true,widthPx:3000,heightPx:3000,sha256:'a'.repeat(64)},editorialRevision:2};
 assert.doesNotThrow(()=>assetGate([a],1,2000,true));assert.throws(()=>assetGate([a],3,2000),/PENDING_ASSET/);
 assert.throws(()=>assetGate([{...a,editorialRevision:1}],1,2000,true),/EDITORIAL/);
 assert.throws(()=>assetGate([{...a,image:{...a.image!,revision:1}}],1,2000),/IMAGE/);
});
test('vendor allowlist and legally approved rejection templates enforce role boundaries',()=>{
 const actor:Actor={userId:'v',programId:'p',role:'EXTERNAL_VENDOR',active:true};const scope={programId:'p',artistUserId:'a',coordinatorId:'c',vendorUserId:'v'};
 const crate={id:'x',length:1,width:1,height:1,weight:1,pickupAddress:{city:'Sharjah'},insuranceValue:0,insuranceCurrency:'AED',passport:'NEVER PROJECT'};
 assert.equal('passport' in vendorProjection(actor,scope,crate),false);assert.throws(()=>vendorProjection({...actor,userId:'other'},scope,crate),/NOT_ASSIGNED/);
 assert.throws(()=>visaRejectionGate({...actor,role:'COORDINATOR',userId:'c'},scope,'REF',[],['ar','en']),/FORBIDDEN/);
 assert.throws(()=>visaRejectionGate({...actor,role:'PR_OFFICER'},scope,'REF',[],['ar','en']),/LEGAL_TEMPLATE/);
 assert.equal(shippingSLADue('2026-09-01T00:00:00Z','READY_FOR_SHIPPING','2026-09-03T00:00:00Z'),true);assert.equal(shippingSLADue('2026-09-01T00:00:00Z','ACTIONED','2026-09-03T00:00:00Z'),false);
});
test('middleware obtains trusted actor and rejects cross-program scope before mutation',async()=>{
 let executed=false;const run=governanceMiddleware({authenticate:async()=>({userId:'a',programId:'p',role:'ARTIST' as const,active:true}),transaction:async<T>(fn:(tx:object)=>Promise<T>)=>fn({}),loadScope:async()=>({programId:'other',artistUserId:'a',coordinatorId:'c'}),roles:['ARTIST'],execute:async()=>{executed=true;}});
 await assert.rejects(()=>run({}),/FORBIDDEN/);assert.equal(executed,false);
});
