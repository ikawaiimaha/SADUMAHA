import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { jsPDF } from 'jspdf';
import { createConnectedPilot, PILOT_ARTWORK } from '../server/connected-pilot.mjs';

const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4XmN49vDSfwAI4wOZS6NgQwAAAABJRU5ErkJggg==','base64');
const pdf=label=>{const doc=new jsPDF();doc.text(label,20,20);return Buffer.from(doc.output('arraybuffer'));};
const spec={supplier:'Synthetic printer',quantity:100,size:'A5 with 3 mm bleed',stock:'170 gsm coated',finishing:'Fold and stitch',profile:'Supplier-approved test profile',deliveryDate:'2026-10-20'};
async function fixture(t) {
  const directory=await mkdtemp(join(tmpdir(),'sadu-operations-'));let clock=new Date('2026-10-05T10:00:00Z');
  const options={directory,gate:(_q,_r,next)=>next(),now:()=>clock};let runtime=await createConnectedPilot(options),server,origin;
  const listen=async()=>{server=runtime.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));origin=`http://127.0.0.1:${server.address().port}`;};await listen();
  t.after(()=>new Promise(r=>server.close(r)));
  const path='/api/review/pilot/operations/'+PILOT_ARTWORK,collection='/api/review/pilot/collection/'+PILOT_ARTWORK;
  const client=async role=>{
    const response=await fetch(origin+'/api/review/session',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({accountId:'pilot-'+role})});assert.equal(response.status,200);
    const cookie=response.headers.get('set-cookie').split(';')[0];
    const call=async(url,body,expected=200)=>{const r=await fetch(origin+url,{method:body?'POST':'GET',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const value=await r.json();assert.equal(r.status,expected,JSON.stringify(value));return value;};
    const view=()=>call(path);
    const reviewed=async(url,command,expected)=>{if(expected===200&&['SAVE','PLAN','REOPEN','SET_PRINT_PACKAGE'].includes(command.action)){const impact=await call(url+'/impact',command);if(impact.required)command.impactToken=impact.token;}return call(url,command,expected);};
    return {cookie,view,call,command:async(action,extra={},expected=200)=>reviewed(path,{version:(await view()).version,operationId:randomUUID(),action,...extra},expected),collection:async(action,extra={},expected=200)=>reviewed(collection,{version:(await call(collection)).version,action,...extra},expected),
      upload:async(kind,bytes,name='evidence.pdf',extra={},expected=200)=>{const meta={version:(await view()).version,operationId:randomUUID(),kind,name,source:'SYNTHETIC-SOURCE',sender:'Synthetic sender',...extra};const r=await fetch(origin+path+'/evidence',{method:'POST',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/octet-stream','x-sadu-metadata':encodeURIComponent(JSON.stringify(meta))},body:bytes});const result=await r.json();assert.equal(r.status,expected,JSON.stringify(result));return result.evidenceId;},
      file:async(evidenceId,expected=200)=>{const r=await fetch(origin+path+'/evidence/'+evidenceId,{headers:{Cookie:cookie}});assert.equal(r.status,expected);return Buffer.from(await r.arrayBuffer());}
    };
  };
  return {directory,path,collection,client,get runtime(){return runtime;},get origin(){return origin;},setClock:v=>{clock=new Date(v);},restart:async()=>{await new Promise(r=>server.close(r));runtime=await createConnectedPilot(options);await listen();}};
}
async function prepareCollection(logistics,technical,finance) {
  await logistics.collection('SAVE',{details:{address:'Synthetic store',city:'Paris',country:'France',contact:'Synthetic desk',sourceRef:'COLLECTION-SOURCE',timezone:'Europe/Paris',availability:{start:'2026-10-01',end:'2026-10-31'},closures:[],conflict:false}});
  await logistics.collection('ACCEPT');await logistics.collection('CONFIRM',{checked:true});await logistics.collection('PLAN',{pickupDate:'2026-10-10'});
  await logistics.collection('PACK',{value:'Padded crate',packingOwner:'Synthetic packer',amount:0,requiresTechnical:true});
  await technical.collection('TECHNICAL',{value:'Technical plan review'});await finance.collection('COST',{value:'Zero-cost approval'});
}
async function preparePrint(f) {
  const coordinator=await f.client('Exhibition_Coordinator'),editor=await f.client('Editorial'),chair=await f.client('Chairman'),gc=await f.client('General_Exhibition_Coordinator');
  const proof=await coordinator.upload('PRINT_PROOF',pdf('Synthetic proof v1'));
  await coordinator.command('SET_PRINT_PACKAGE',{evidenceId:proof,spec});
  const report=await editor.upload('PREFLIGHT',pdf('Synthetic preflight report'));
  await editor.command('PREFLIGHT',{revision:1,evidenceId:report,passed:true,note:'File and agreed technical profile checked.'});
  await editor.command('REVIEW_PRINT',{revision:1,editorialChecked:true,rightsChecked:true});
  await chair.command('APPROVE_PRINT',{revision:1,checked:true});
  await editor.command('DISPATCH_PRINT',{revision:1});
  return {coordinator,editor,chair,gc,proof,report};
}

async function assignRenewal(gc, owner, key, ownerId, {accept=true,dueAt='2026-10-06T12:00:00Z'}={}) {
  const task=(await gc.view()).renewals.filter(c=>!c.supersededAt).flatMap(c=>c.tasks).find(t=>t.key===key);
  assert.ok(task, `Missing renewal ${key}`);
  await gc.command('ASSIGN_RENEWAL',{taskId:task.id,ownerId:'pilot-'+ownerId,dueAt,reason:'Synthetic review handoff'});
  if(accept)await owner.command('ACCEPT_RENEWAL',{taskId:task.id});
  return task.id;
}

test('packing evidence is inspectable, revision-bound, private and held when missing or changed',async t=>{
  const f=await fixture(t),l=await f.client('Logistics'),tech=await f.client('Technical'),fin=await f.client('Finance'),gc=await f.client('General_Exhibition_Coordinator');
  await prepareCollection(l,tech,fin);
  const initial=f.runtime.repository.read();
  await l.command('VERIFY_PACKING',{checked:true},422);
  await l.command('VERIFY_PACKING',{evidenceId:'typed-reference-is-not-a-file',checked:true},422);
  assert.deepEqual(f.runtime.repository.read(),initial,'Missing evidence must not create a decision or advance the record');
  const file=await l.upload('PACKING',png,'packing.png');assert.deepEqual(await l.file(file),png);
  assert.equal((await l.view()).files.find(e=>e.id===file).currentScope,true);
  assert.equal((await l.view()).readiness.packingVerified,false,'Uploading alone is not an inspection');
  await l.command('VERIFY_PACKING',{evidenceId:file,checked:false},409);
  await l.command('VERIFY_PACKING',{evidenceId:file,checked:true});let view=await l.view();
  assert.equal(view.readiness.packingVerified,true);assert.equal(view.readiness.preparationComplete,true);assert.equal(view.readiness.departureReady,false);assert.match(view.readiness.blockers.join(' '),/Publish/);
  const anonymous=await fetch(f.origin+f.path+'/evidence/'+file);assert.equal(anonymous.status,401);
  const artist=await f.client('Artist');await artist.file(file,403);
  const outsider=await f.client('Editorial');await outsider.file(file,403);
  await gc.command('VERIFY_PACKING',{evidenceId:file,checked:true},403);
  await l.collection('PLAN',{pickupDate:'2026-10-11'});assert.equal((await l.view()).readiness.packingVerified,false);
  assert.equal((await l.view()).files.find(e=>e.id===file).currentScope,false,'Prior files remain inspectable but cannot satisfy a changed plan');
  await assignRenewal(gc,l,'plan','Logistics');
  await l.collection('PACK',{value:'Padded crate',packingOwner:'Synthetic packer',amount:0,requiresTechnical:true});await assignRenewal(gc,tech,'technical','Technical');await tech.collection('TECHNICAL',{value:'Technical plan review'});await assignRenewal(gc,fin,'cost','Finance');await fin.collection('COST',{value:'Zero-cost approval'});
  await assignRenewal(gc,l,'packing','Logistics');
  await l.command('VERIFY_PACKING',{evidenceId:file,checked:true},409);
  const fresh=await l.upload('PACKING',png,'new-packing.png');await l.command('VERIFY_PACKING',{evidenceId:fresh,checked:true});
  const object=f.runtime.repository.read().operationalEvidence.find(e=>e.id===fresh).objectId;await writeFile(join(f.directory,'objects',object),'corrupt');
  await l.file(fresh,409);assert.equal((await l.view()).readiness.packingVerified,false);
  assert.deepEqual(f.runtime.repository.read().payments,[]);
});

test('print package survives separate sessions and restart; delivery and acceptance are separate and idempotent',async t=>{
  const f=await fixture(t);const {editor,gc,proof}=await preparePrint(f);
  const approved=(await editor.view()).job.packages[0];
  const decision=approved.decisions.find(d=>d.action==='APPROVE_PRINT');
  assert.equal(decision.actorId,'pilot-Chairman');assert.equal(decision.proofId,proof);assert.equal(decision.proofHash,approved.proofHash);assert.equal(decision.printRevision,1);assert.match(decision.specificationHash,/^[a-f0-9]{64}$/);
  await editor.command('ACK_PRINT',{revision:1,proofId:'wrong-file',sender:'Supplier',receivedAt:'2026-10-05T09:00:00Z',reference:'ACK'},422);
  await editor.command('START_PRINT',{revision:1},409);
  await editor.command('ACK_PRINT',{revision:1,proofId:proof,sender:'Supplier',receivedAt:'2026-10-05T09:00:00Z',reference:'Supplier confirms file and specification v1'});
  await editor.command('START_PRINT',{revision:1});await editor.command('COMPLETE_PRINT',{revision:1,quantity:100,reference:'PRODUCED-100'});
  const command={version:(await editor.view()).version,operationId:randomUUID(),action:'RECORD_DELIVERY',revision:1,quantity:40,reference:'DELIVERY-40',actorId:'pilot-Chairman'};
  await editor.call(f.path,command);await editor.call(f.path,command);
  let v=await gc.view();assert.equal(v.job.deliveries.length,1);assert.equal(v.job.deliveries[0].acceptance,null);
  assert.equal(v.job.deliveries[0].actorId,'pilot-Editorial');
  assert.equal(v.job.packages[0].decisions.filter(d=>d.action==='RECORD_DELIVERY').length,1);
  await editor.command('RECORD_DELIVERY',{revision:1,quantity:61,reference:'Too many'},422);
  await editor.command('ACCEPT_DELIVERY',{revision:1,deliveryId:v.job.deliveries[0].id,checked:true,reference:'Not my authority'},403);
  await gc.command('ACCEPT_DELIVERY',{revision:1,deliveryId:v.job.deliveries[0].id,checked:true,reference:'Inspected 40'});
  v=await editor.view();assert.equal(v.job.deliveries[0].acceptance.actorId,'pilot-General_Exhibition_Coordinator');
  const saved=structuredClone(v.job),bytes=await editor.file(proof);await f.restart();const next=await f.client('Editorial');
  assert.deepEqual((await next.view()).job,saved);assert.deepEqual(await next.file(proof),bytes);
});

test('failed preflight and correction holds block release; replacement cannot inherit supplier acknowledgment',async t=>{
  const f=await fixture(t);const {editor,coordinator,proof,gc}=await preparePrint(f);
  await coordinator.command('CORRECT_PRINT',{revision:1,reason:'Correct Arabic proof'});
  const replacement=await coordinator.upload('PRINT_PROOF',pdf('Synthetic corrected proof'));
  await coordinator.command('SET_PRINT_PACKAGE',{evidenceId:replacement,spec},409);
  await editor.command('STOP_PRINT',{revision:1,reference:'Supplier confirmed not printing'});
  await coordinator.command('SET_PRINT_PACKAGE',{evidenceId:replacement,spec:{...spec,quantity:200}});
  let v=await editor.view();assert.equal(v.job.record.version,2);assert.equal(v.job.record.supplierAck,null);assert.equal(v.job.record.previous[0].correction.stopReference,'Supplier confirmed not printing');
  assert.notDeepEqual(await coordinator.file(proof),await coordinator.file(replacement));
  await editor.command('ACK_PRINT',{revision:1,proofId:proof,sender:'Old supplier',receivedAt:'2026-10-05T09:00:00Z',reference:'OLD'},409);
  const report=await editor.upload('PREFLIGHT',pdf('Fonts missing'));
  await assignRenewal(gc,editor,'preflight','Editorial');
  await editor.command('PREFLIGHT',{revision:2,evidenceId:report,passed:false,note:'Missing fonts'});
  await editor.command('REVIEW_PRINT',{revision:2,editorialChecked:true,rightsChecked:true},409);
  assert.equal((await editor.view()).job.record.review,null);
});

test('named tasks require acceptance and elapsed pickup windows surface without booking or payment',async t=>{
  const f=await fixture(t),l=await f.client('Logistics'),tech=await f.client('Technical'),fin=await f.client('Finance'),gc=await f.client('General_Exhibition_Coordinator');
  await prepareCollection(l,tech,fin);await l.collection('REOPEN',{value:'Reassess plan'});
  await assignRenewal(gc,l,'plan','Logistics');await l.collection('PACK',{value:'Revised crate',packingOwner:'Packer',amount:20,requiresTechnical:true});
  const taskId=await assignRenewal(gc,tech,'technical','Technical',{accept:false});
  await gc.command('ASSIGN_RENEWAL',{taskId,ownerId:'pilot-Finance',dueAt:'2026-10-06T12:00:00Z',reason:'Wrong role'},422);
  await tech.collection('TECHNICAL',{value:'Not accepted'},409);await fin.command('ACCEPT_RENEWAL',{taskId},403);
  f.setClock('2026-10-07T12:00:00Z');const task=(await tech.view()).renewals.at(-1).tasks.find(t=>t.id===taskId);assert.equal(task.overdue,true);assert.equal(task.status,'ASSIGNED');
  await tech.command('ACCEPT_RENEWAL',{taskId});await tech.collection('TECHNICAL',{value:'Accepted reviewed plan'});
  f.setClock('2026-10-11T00:01:00Z');let v=await l.view();assert.equal(v.readiness.expired,true);assert.ok(v.tasks.some(t=>t.id.endsWith('pickup-expired')));
  const before=f.runtime.repository.read();await l.view();await l.view();assert.deepEqual(f.runtime.repository.read(),before);
  assert.equal(v.readiness.transportBooked,false);assert.deepEqual(before.payments,[]);assert.equal(before.artworks[0].physicalStatus,'Pending_Shipment');
});

test('concurrent stale writes and malformed evidence cannot overwrite the shared print package',async t=>{
  const f=await fixture(t),c=await f.client('Exhibition_Coordinator');
  await c.upload('PRINT_PROOF',Buffer.from('not a PDF'),'bad.pdf',{},422);
  const e=await c.upload('PRINT_PROOF',pdf('First proof')),version=(await c.view()).version;
  const commands=[1,2].map(()=>({action:'SET_PRINT_PACKAGE',operationId:randomUUID(),version,evidenceId:e,spec}));
  const responses=await Promise.all(commands.map(body=>fetch(f.origin+f.path,{method:'POST',headers:{Origin:f.origin,Cookie:c.cookie,'Content-Type':'application/json'},body:JSON.stringify(body)})));
  assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);assert.equal((await c.view()).job.packages.length,1);
  const evidence=f.runtime.repository.read().operationalEvidence[0];assert.ok((await readFile(join(f.directory,'objects',evidence.objectId))).length>0);
});

test('collection impact is read-only, exact, scoped, stale-safe and preserves unrelated decisions',async t=>{
  const f=await fixture(t),l=await f.client('Logistics'),tech=await f.client('Technical'),fin=await f.client('Finance'),gc=await f.client('General_Exhibition_Coordinator');
  await prepareCollection(l,tech,fin);
  const e=await l.upload('PACKING',png,'packing.png');await l.command('VERIFY_PACKING',{evidenceId:e,checked:true});
  await gc.command('ASSIGN_TASK',{key:'packing-cost',ownerId:'pilot-Finance',dueAt:'2026-10-08T10:00:00Z',reason:'Named Finance reviewer'});
  const before=f.runtime.repository.read();
  const command={version:before.version,action:'PLAN',pickupDate:'2026-10-12'};
  const impact=await l.call(f.collection+'/impact',command);
  assert.deepEqual(f.runtime.repository.read(),before,'Inspecting or cancelling the preview must not write');
  assert.equal(impact.required,true);assert.equal(impact.changes[0].before,'2026-10-10');assert.equal(impact.changes[0].after,'2026-10-12');
  assert.deepEqual(impact.renewals.map(r=>r.key),['technical','cost','packing']);
  assert.equal(impact.renewals.find(r=>r.key==='cost').owner.id,'pilot-Finance');
  assert.equal(impact.renewals.find(r=>r.key==='technical').owner.id,null,'Unassigned roles must not get an invented owner');
  assert.equal(impact.next.owner.id,'pilot-Logistics');
  assert.ok(impact.retained.some(r=>r.en.includes('Confirmed address')));
  assert.ok(impact.retained.some(r=>r.en.includes('existing holds still apply')));
  await l.call(f.collection,command,409);
  await l.call(f.collection,{...command,pickupDate:'2026-10-13',impactToken:impact.token},409);
  assert.deepEqual(f.runtime.repository.read(),before,'Missing and mismatched acknowledgments must roll back');
  await fin.call(f.collection+'/impact',command,403);
  await l.call(f.collection+'/impact',{...command,pickupDate:'2026-11-01'},422);
  await l.call(f.collection,{...command,impactToken:impact.token});
  const saved=f.runtime.repository.read(),r=saved.collectionRevisions.at(-1);
  assert.equal(r.packing,null);assert.deepEqual(r.confirmation,before.collectionRevisions.at(-1).confirmation);
  assert.deepEqual(saved.collectionAssignments,before.collectionAssignments);assert.deepEqual(saved.payments,before.payments);
  assert.equal(saved.decisions.at(-1).amendmentReview.reviewedBy,'pilot-Logistics');
  assert.deepEqual(saved.decisions.at(-1).amendmentReview.renewedChecks,impact.renewals.map(r=>r.key));
  const unchanged={version:saved.version,action:'PLAN',pickupDate:'2026-10-12'};
  assert.equal((await l.call(f.collection+'/impact',unchanged)).required,false);
  await l.call(f.collection,unchanged);assert.deepEqual(f.runtime.repository.read().collectionRevisions,saved.collectionRevisions);
  const pending={version:f.runtime.repository.read().version,action:'PLAN',pickupDate:'2026-10-14'};
  const stale=await l.call(f.collection+'/impact',pending);
  await gc.collection('ASSIGN',{primaryId:'pilot-Logistics',backupId:'pilot-Logistics-Backup',activeId:'pilot-Logistics-Backup',reason:'Backup taking over'});
  await l.call(f.collection,{...pending,impactToken:stale.token},409);
  const backup=await f.client('Logistics-Backup');await backup.collection('ACCEPT');
  const updated={...pending,version:f.runtime.repository.read().version};
  const refreshed=await backup.call(f.collection+'/impact',updated);assert.equal(refreshed.next.owner.id,'pilot-Logistics-Backup');
  await backup.call(f.collection,{...updated,impactToken:stale.token},409);
});

test('packing reopen previews completed checks only and retains pickup; print replacement binds every renewal',async t=>{
  const f=await fixture(t),l=await f.client('Logistics'),tech=await f.client('Technical'),fin=await f.client('Finance');
  await prepareCollection(l,tech,fin);
  const reopen={version:(await l.view()).version,action:'REOPEN',value:'New packing specification needed'};
  const packingImpact=await l.call(f.collection+'/impact',reopen);
  assert.deepEqual(packingImpact.renewals.map(r=>r.key),['technical','cost'],'Uncompleted packing evidence is not a renewed approval');
  assert.ok(packingImpact.retained.some(r=>r.en.includes('current pickup plan')));
  await l.call(f.collection,{...reopen,impactToken:packingImpact.token});assert.equal((await l.call(f.collection)).record.plan.pickupDate,'2026-10-10');
  const {coordinator,editor,gc,proof}=await preparePrint(f);
  await editor.command('ACK_PRINT',{revision:1,proofId:proof,sender:'Supplier',receivedAt:'2026-10-05T09:00:00Z',reference:'ACK'});
  await editor.command('START_PRINT',{revision:1});await editor.command('COMPLETE_PRINT',{revision:1,quantity:100,reference:'DONE'});
  await editor.command('RECORD_DELIVERY',{revision:1,quantity:40,reference:'DELIVERY'});
  const delivered=(await gc.view()).job.deliveries[0];await gc.command('ACCEPT_DELIVERY',{revision:1,deliveryId:delivered.id,checked:true,reference:'CHECKED'});
  const replacement=await coordinator.upload('PRINT_PROOF',pdf('Corrected print PDF'));
  const candidate=()=>({version:f.runtime.repository.read().version,operationId:randomUUID(),action:'SET_PRINT_PACKAGE',evidenceId:replacement,spec:{...spec,quantity:200}});
  await coordinator.call(f.path+'/impact',candidate(),409);
  await coordinator.command('CORRECT_PRINT',{revision:1,reason:'Proof correction'});
  await coordinator.call(f.path+'/impact',candidate(),409);
  await editor.command('STOP_PRINT',{revision:1,reference:'Supplier acknowledged old stock disposition'});
  const before=f.runtime.repository.read(),command=candidate();
  const impact=await coordinator.call(f.path+'/impact',command);
  assert.deepEqual(f.runtime.repository.read(),before);
  assert.deepEqual(impact.renewals.map(r=>r.key),['preflight','editorial','executive','dispatch','supplier']);
  assert.ok(impact.changes.some(c=>c.label.en==='Quantity'&&c.before===100&&c.after===200));
  assert.ok(impact.retained.some(r=>r.en.includes('Earlier production')));
  await coordinator.call(f.path,command,409);
  await coordinator.call(f.path,{...command,spec:{...command.spec,quantity:201},impactToken:impact.token},409);
  assert.deepEqual(f.runtime.repository.read(),before);
  await coordinator.call(f.path,{...command,impactToken:impact.token});
  const after=f.runtime.repository.read();assert.equal(after.printJobs[PILOT_ARTWORK].record.review,null);assert.equal(after.printJobs[PILOT_ARTWORK].record.supplierAck,null);
  assert.deepEqual(after.printJobs[PILOT_ARTWORK].deliveries,before.printJobs[PILOT_ARTWORK].deliveries);
  assert.deepEqual(after.collectionRevisions,before.collectionRevisions);
  assert.equal(after.printJobs[PILOT_ARTWORK].packages.at(-1).decisions.at(-1).amendmentReview.token,impact.token);
  await coordinator.call(f.path,{...command,impactToken:impact.token});
  assert.equal(f.runtime.repository.read().printJobs[PILOT_ARTWORK].packages.length,2,'A confirmed retry cannot create another revision');
  const remembered=f.runtime.repository.read().printJobs[PILOT_ARTWORK];await f.restart();const restored=await f.client('Exhibition_Coordinator');
  assert.deepEqual((await restored.view()).job,remembered);
});

test('renewal return, reassignment, accepted authority and closure survive restart without granting other approvals',async t=>{
  const f=await fixture(t),{coordinator,editor,chair,gc,report}=await preparePrint(f);
  await coordinator.command('CORRECT_PRINT',{revision:1,reason:'Correct specification'});
  await editor.command('STOP_PRINT',{revision:1,reference:'Supplier stopped'});
  const proof=await coordinator.upload('PRINT_PROOF',pdf('Revision two'));
  await coordinator.command('SET_PRINT_PACKAGE',{evidenceId:proof,spec});
  const initial=(await gc.view()).renewals.at(-1);assert.equal(initial.tasks.length,5);assert.ok(initial.tasks.every(t=>t.status==='UNASSIGNED'));
  await editor.command('PREFLIGHT',{revision:2,evidenceId:report,passed:true,note:'Unassigned'},409);
  const taskId=await assignRenewal(gc,editor,'preflight','Editorial',{accept:false});
  await editor.command('RETURN_RENEWAL',{taskId,reason:''},422);
  await editor.command('RETURN_RENEWAL',{taskId,reason:'Need a new supplier profile'});
  let task=(await gc.view()).renewals.at(-1).tasks[0];assert.equal(task.status,'RETURNED');assert.equal(task.ownerId,null);
  assert.match(task.events.at(-1).reason,/supplier/);
  await gc.command('ASSIGN_RENEWAL',{taskId,ownerId:'pilot-Editorial',dueAt:'2026-10-04T12:00:00Z',reason:'Past deadline'},422);
  await assignRenewal(gc,editor,'preflight','Editorial');
  const fresh=await editor.upload('PREFLIGHT',pdf('Revision two passed'));
  await editor.command('PREFLIGHT',{revision:2,evidenceId:fresh,passed:true,note:'Current file checked',actorId:'pilot-Chairman'});
  task=(await gc.view()).renewals.at(-1).tasks[0];assert.equal(task.status,'COMPLETE');assert.equal(task.events.at(-1).actorId,'pilot-Editorial');assert.deepEqual(task.evidenceIds,[proof,fresh]);
  await gc.command('ASSIGN_RENEWAL',{taskId,ownerId:'pilot-Editorial',dueAt:'2026-10-06T12:00:00Z',reason:'Overwrite completion'},409);
  await assignRenewal(gc,editor,'editorial','Editorial');await editor.command('REVIEW_PRINT',{revision:2,editorialChecked:true,rightsChecked:true});
  await assignRenewal(gc,chair,'executive','Chairman');await chair.command('APPROVE_PRINT',{revision:2,checked:true});
  await assignRenewal(gc,editor,'dispatch','Editorial');await editor.command('DISPATCH_PRINT',{revision:2});
  await assignRenewal(gc,editor,'supplier','Editorial');await editor.command('ACK_PRINT',{revision:2,proofId:proof,sender:'Supplier',receivedAt:'2026-10-05T09:00:00Z',reference:'V2 confirmation'});
  const cycle=(await gc.view()).renewals.at(-1);assert.equal(cycle.completed,5);assert.equal((await gc.view()).job.record.production,null);assert.deepEqual(f.runtime.repository.read().payments,[]);
  const stored=f.runtime.repository.read().renewalCycles;await f.restart();assert.deepEqual(f.runtime.repository.read().renewalCycles,stored);
  const restored=await f.client('General_Exhibition_Coordinator');assert.equal((await restored.view()).renewals.at(-1).completed,5);
});

test('a new amendment supersedes old task IDs and backup handoff clears outstanding ownership',async t=>{
  const f=await fixture(t),l=await f.client('Logistics'),tech=await f.client('Technical'),fin=await f.client('Finance'),gc=await f.client('General_Exhibition_Coordinator');
  await prepareCollection(l,tech,fin);await l.collection('PLAN',{pickupDate:'2026-10-11'});
  const first=await assignRenewal(gc,l,'plan','Logistics');
  await l.collection('PLAN',{pickupDate:'2026-10-12'});
  await l.command('ACCEPT_RENEWAL',{taskId:first},409);
  let cycles=(await gc.view()).renewals;assert.ok(cycles[0].supersededAt);assert.equal(cycles[1].tasks[0].acceptedBy,null);
  const plan=await assignRenewal(gc,l,'plan','Logistics');
  await gc.collection('ASSIGN',{primaryId:'pilot-Logistics',backupId:'pilot-Logistics-Backup',activeId:'pilot-Logistics-Backup',reason:'Primary unavailable'});
  const backup=await f.client('Logistics-Backup');await backup.collection('ACCEPT');
  await backup.collection('PACK',{value:'Crate',packingOwner:'Packer',amount:0,requiresTechnical:false,technicalReason:'Standard crate'},409);
  const current=(await gc.view()).renewals.at(-1).tasks[0];assert.equal(current.id,plan);assert.equal(current.ownerId,null);assert.deepEqual(current.eligibleOwners,['pilot-Logistics-Backup']);
  await assignRenewal(gc,backup,'plan','Logistics-Backup');await backup.collection('PACK',{value:'Crate',packingOwner:'Packer',amount:0,requiresTechnical:false,technicalReason:'Standard crate'});
  cycles=(await gc.view()).renewals;assert.equal(cycles.at(-1).tasks.find(t=>t.key==='technical').status,'NOT_REQUIRED');
  assert.equal(cycles.at(-1).tasks.find(t=>t.key==='cost').status,'UNASSIGNED');
  const readOnly=f.runtime.repository.read();await gc.view();assert.deepEqual(f.runtime.repository.read(),readOnly);
});
