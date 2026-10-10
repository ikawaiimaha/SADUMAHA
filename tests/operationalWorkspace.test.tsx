import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { workspaceTasks, retainTaskSelection, localized, accountLabel, waitingExplanation, readinessExplanation } from '../src/lib/operationalWorkspace';
import OperationalForms, {EvidenceUpload} from '../src/components/OperationalForms';
import DraftRecovery from '../src/components/DraftRecovery';
import { createPublishingRecord } from '../src/data/publishingRecord';
import type { OperationsView } from '../src/components/ConnectedOperations';
import type { CollectionView } from '../src/lib/useCollectionWorkflow';

const actor={id:'l',role:'Logistics'};
const collection:CollectionView={version:1,state:'TECHNICAL_REVIEW_REQUIRED',ready:false,blocker:'Technical check required',accounts:[{id:'l',name:'Logistics'}],assignment:{primaryId:'l',backupId:null,activeId:'l',acceptedBy:'l'},record:{address:'Synthetic store',city:'Paris',country:'France',contact:'Desk',sourceRef:'TEST',timezone:'Europe/Paris',availability:{start:'2026-10-01',end:'2026-10-31'},closures:[],conflict:false,confirmation:{actorId:'l'},plan:{pickupDate:'2026-10-10',state:'planned'},packing:{specification:'Crate',owner:'Packer',amount:0,requiresTechnical:true,technicalReference:'',costReference:'',evidence:''}}};
const ops=():OperationsView=>({version:1,serverTime:'2026-10-06T10:00:00Z',readiness:{preparationComplete:false,packingVerified:false,conditionAndAgreementCleared:false,departureReady:false,expired:false,blockers:['Condition report missing']},files:[],tasks:[],accounts:[],job:null});

test('stale draft shows separate original, current and proposed values without a resume action',()=>{
  const html=renderToStaticMarkup(createElement(DraftRecovery,{language:'en',status:'ready',candidate:{taskId:'manage:amendPickup',key:'amendPickup',kind:'collection',panel:'decision',baseVersion:1,fields:{pickupDate:'2026-10-23'},fileName:null,attempted:false},version:2,comparison:{currentVersion:2,baselineAvailable:true,changes:[{key:'pickupDate',before:'2026-10-17',current:'2026-10-19'},{key:'activeId',before:'l',current:'backup'}]},tasks:workspaceTasks(ops(),collection,actor),references:{l:'Primary officer',backup:'Backup officer'},canResume:false,busy:false,dirty:false,onResume:()=>{},onDiscard:()=>{},onReload:()=>{}}));
  for(const text of ['What changed?','2026-10-17','2026-10-19','2026-10-23','Your unsubmitted input','Primary officer','Backup officer','Who handles the remaining reviews?'])assert.ok(html.includes(text),text);
  assert.doesNotMatch(html,/>Resume draft</);
});

test('older drafts explain unavailable baselines in Arabic without invented differences',()=>{
  const html=renderToStaticMarkup(createElement(DraftRecovery,{language:'ar',status:'ready',candidate:{taskId:'print:preflight',key:'preflight',kind:'print',panel:'decision',baseVersion:1,fields:{note:'ملاحظة'},fileName:null,attempted:false},version:2,comparison:{currentVersion:2,baselineAvailable:false,changes:[]},references:{},canResume:false,busy:false,dirty:false,onResume:()=>{},onDiscard:()=>{},onReload:()=>{}}));
  assert.match(html,/لا توجد نسخة مرجعية/);assert.doesNotMatch(html,/When draft started|Resume draft|Shared record now/);
});
const renewal=(overrides={})=>({id:'r1',key:'technical',title:'فني / Technical',status:'UNASSIGNED',ownerId:null,dueAt:null,blocker:'المنسقة تحدد المسؤول / Coordinator assigns owner',overdue:false,canAct:false,roles:['Technical'],eligibleOwners:['tech'],evidenceIds:[],href:'#collection-plan',events:[],...overrides});

test('logistics cannot act on a technical packing review or turn preparation into departure',()=>{
  const view=ops(),tasks=workspaceTasks(view,collection,actor);
  assert.equal(tasks.find(t=>t.key==='technical')?.status,'waiting');
  assert.equal(tasks.find(t=>t.key==='technical')?.canAct,false);
  assert.equal(view.readiness?.departureReady,false);
});
test('renewal acceptance is shown before review and uses server canAct',()=>{
  const view=ops();view.renewals=[{id:'cycle',kind:'collection',revision:'c1',createdAt:'now',completed:0,total:1,tasks:[renewal({status:'ASSIGNED',ownerId:'tech'})]}];
  const task=workspaceTasks(view,collection,{id:'tech',role:'Technical'})[0];
  assert.equal(task.acceptance,'renewal');assert.equal(task.status,'now');assert.equal(task.canAct,false);
});
test('coordinator receives assignment action without inheriting technical approval',()=>{
  const view=ops();view.renewals=[{id:'cycle',kind:'collection',revision:'c1',createdAt:'now',completed:0,total:1,tasks:[renewal()]}];
  const task=workspaceTasks(view,collection,{id:'gc',role:'General_Exhibition_Coordinator'})[0];
  assert.equal(task.status,'now');assert.equal(task.canAct,false);
});
test('expired pickup becomes actionable without erasing the recorded date',()=>{
  const view=ops();view.readiness!.expired=true;
  assert.equal(workspaceTasks(view,collection,actor).find(t=>t.key==='pickup')?.canAct,true);
  assert.equal(collection.record?.plan?.pickupDate,'2026-10-10');
});
test('selection remains pinned when a task is superseded or another becomes actionable',()=>{
  const tasks=workspaceTasks(ops(),collection,actor);
  assert.equal(retainTaskSelection('older-revision-task',tasks),'older-revision-task');
  assert.equal(retainTaskSelection(null,tasks),tasks[0].id);
});
test('print correction directs attention to supplier stop rather than a renewal approval',()=>{
  const view=ops();const record=createPublishingRecord();record.version=1;record.dispatch={version:1,actor:'PUBLISHING_MANAGER',at:'now'};record.correction={version:1,actor:'COORDINATOR',at:'now',reason:'Wrong text',stopReference:''};
  view.job={record,deliveries:[],packages:[{revision:1,proofId:'pdf',proofHash:'hash',spec:{quantity:100,supplier:'Synthetic',stock:'Paper',size:'A5',profile:'Test',finishing:'Fold',deliveryDate:'2026-10-20'},preflight:null}]};
  view.renewals=[{id:'cycle',kind:'print',revision:1,createdAt:'now',completed:0,total:1,tasks:[renewal({key:'editorial',roles:['Editorial'],ownerId:'ed',status:'ACCEPTED',canAct:false})]}];
  const tasks=workspaceTasks(view,undefined,{id:'ed',role:'Editorial'});
  assert.equal(tasks[0].key,'stop');assert.equal(tasks[0].canAct,true);assert.equal(tasks.find(t=>t.key==='editorial')?.status,'waiting');
});
test('Arabic decision form contains one language and no future review form',()=>{
  const view=ops(),task={...workspaceTasks(view,collection,actor)[0],key:'packing',canAct:true};
  const html=renderToStaticMarkup(createElement(OperationalForms,{task,ops:view,collection,actor,language:'ar',disabled:false,mark:()=>{},run:async()=>true,evidenceId:'',onEvidence:()=>{}}));
  assert.match(html,/تأكيد فحص التغليف/);assert.doesNotMatch(html,/Confirm packing inspection|Submit editorial review|إحالة المراجعة/);
  assert.match(html,/required=""/);
  assert.match(html,/<button class="work-primary" disabled="">/);
});

test('packing approval excludes superseded files and remains blocked before evidence renders',()=>{
  const view=ops(),task={...workspaceTasks(view,collection,actor)[0],key:'packing',canAct:true};
  const file={id:'old',kind:'PACKING',name:'old.png',url:'/file',source:'TEST',sender:'Tester',receivedAt:null,actorId:'l',at:'now',file_hash:'hash',byte_length:100,currentScope:false};
  view.files=[file,{...file,id:'fresh',name:'fresh.png',currentScope:true}];
  const html=renderToStaticMarkup(createElement(OperationalForms,{task,ops:view,collection,actor,language:'en',disabled:false,mark:()=>{},run:async()=>true,evidenceId:'fresh',evidenceReady:false,onEvidence:()=>{}}));
  assert.doesNotMatch(html,/old.png/);assert.match(html,/fresh.png/);
  assert.match(html,/<button class="work-primary" disabled="">Confirm packing inspection/);
});

test('required upload is the primary control and extra guidance is collapsed',()=>{
  for(const kind of ['PACKING','PRINT_PROOF','PREFLIGHT']){
    const html=renderToStaticMarkup(createElement(EvidenceUpload,{kind,language:'en',disabled:false,mark:()=>{},run:async()=>true}));
    assert.match(html,/<input (?=[^>]*required="")(?=[^>]*type="file")(?=[^>]*name="file")[^>]*>/);
    assert.match(html,/<button class="work-primary" disabled="">Upload and review/);
    assert.match(html,/<details class="work-help"><summary>Optional details and help/);
    if(kind!=='PACKING')assert.doesNotMatch(html,/image\/png/);
  }
});
test('controlled blockers localize without changing arbitrary source text',()=>{
  assert.equal(localized('العنوان / Address','ar'),'العنوان');
  assert.match(localized('Pickup window has elapsed; confirm new availability and a new plan.','ar'),/انقضى/);
  assert.equal(localized('Unexpected service detail','en'),'Unexpected service detail');
});


test('named institutional owners remain distinguishable in both languages',()=>{
  const owner={id:'user-42',name:'Hana Ahmed',role:'Logistics'};
  assert.equal(accountLabel(owner,'ar'),'Hana Ahmed');
  assert.equal(accountLabel(owner,'en'),'Hana Ahmed');
  assert.equal(accountLabel({id:'pilot-Logistics-Backup',name:'Logistics backup',role:'Logistics'},'ar'),'الشؤون اللوجستية — البديل');
});


test('conflicting collection sources open correction rather than a doomed confirmation',()=>{
  const conflicted=structuredClone(collection);conflicted.record!.conflict=true;conflicted.record!.confirmation=null;
  const tasks=workspaceTasks(ops(),conflicted,actor);
  assert.equal(tasks[0].key,'amendSource');assert.equal(tasks[0].canAct,true);
  assert.equal(tasks.some(t=>t.key==='source'),false);
});


test('waiting guidance identifies assignment or acceptance without treating every dependency as the employees task',()=>{
  const view=ops();view.renewals=[{id:'cycle',kind:'collection',revision:'c1',createdAt:'now',completed:0,total:1,tasks:[renewal({key:'plan',roles:['Logistics']})]}];
  const pending=workspaceTasks(view,collection,actor).find(t=>t.key==='plan')!;
  assert.equal(pending.status,'waiting');assert.equal(pending.canAct,false);
  assert.match(waitingExplanation(pending,'Logistics','en'),/Coordinator to assign an owner/);
  pending.renewal!.status='ASSIGNED';pending.ownerId='another-officer';
  assert.match(waitingExplanation(pending,'Hana','en'),/Hana to accept/);
  assert.match(waitingExplanation(pending,'هناء','ar'),/هناء لقبول/);
  assert.equal(pending.canAct,false);
  assert.match(readinessExplanation('Inspect and verify the packing photograph or PDF for the current plan.','en'),/^After packing is complete/);
  assert.equal(readinessExplanation('Unrecognized hold','en'),'Unrecognized hold');
});
