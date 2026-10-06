import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createConnectedPilot,PILOT_ARTWORK} from '../server/connected-pilot.mjs';

const path='/api/review/pilot/drafts/'+PILOT_ARTWORK;
const draft=version=>({taskId:'manage:amendPickup',key:'amendPickup',kind:'collection',panel:'decision',baseVersion:version,fields:{pickupDate:'2026-10-20'},fileName:null,attempted:false});
async function fixture(t) {
  const directory=await mkdtemp(join(tmpdir(),'sadu-private-drafts-')),options={directory,gate:(_q,_r,next)=>next()};
  let runtime=await createConnectedPilot(options),server,origin;
  const listen=async()=>{server=runtime.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));origin=`http://127.0.0.1:${server.address().port}`;};await listen();
  t.after(()=>new Promise(r=>server.close(r)));
  const client=async(role='Logistics')=>{
    const id='pilot-'+role,r=await fetch(origin+'/api/review/session',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({accountId:id})});
    const cookie=r.headers.get('set-cookie').split(';')[0];
    return async(body,status=200,owner=id)=>{
      const response=await fetch(origin+path,{method:body?'PUT':'GET',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json','x-sadu-draft-owner':owner},...(body?{body:JSON.stringify(body)}:{})});
      const result=await response.json();assert.equal(response.status,status,JSON.stringify(result));return result;
    };
  };
  return {client,get repository(){return runtime.repository;},restart:async()=>{await new Promise(r=>server.close(r));runtime=await createConnectedPilot(options);await listen();}};
}

test('private draft persists through restart without changing decisions, approvals or shared version',async t=>{
  const f=await fixture(t),call=await f.client(),before=f.repository.read();
  const saved=await call({expectedRevision:0,draft:draft(before.version)});
  assert.equal(saved.revision,1);assert.ok(saved.draft.savedAt);assert.deepEqual(f.repository.read(),before);
  await f.restart();await call(undefined,401);
  const reopened=await f.client();assert.deepEqual((await reopened()).draft,saved.draft);
  assert.deepEqual(f.repository.read(),before);
});
test('two tabs cannot overwrite or resurrect a discarded draft with an old revision',async t=>{
  const f=await fixture(t),a=await f.client(),b=await f.client(),payload=draft(f.repository.read().version);
  const outcomes=await Promise.all([a({expectedRevision:0,draft:payload}),b({expectedRevision:0,draft:{...payload,fields:{pickupDate:'2026-10-21'}}},409)]);
  assert.equal(outcomes[0].revision,1);
  await a({expectedRevision:1,draft:null});await b({expectedRevision:1,draft:payload},409);
  assert.equal((await a()).draft,null);assert.equal((await a()).revision,2);
});
test('drafts remain isolated by authenticated owner; body identity and role switching cannot leak them',async t=>{
  const f=await fixture(t),l=await f.client(),backup=await f.client('Logistics-Backup'),gc=await f.client('General_Exhibition_Coordinator');
  await l({expectedRevision:0,actorId:'pilot-General_Exhibition_Coordinator',draft:draft(f.repository.read().version)});
  assert.equal((await backup()).draft,null);assert.equal((await gc()).draft,null);
  await gc(undefined,403,'pilot-Logistics');await backup({expectedRevision:0,draft:null},403,'pilot-Logistics');
  assert.equal((await l()).revision,1);
});
test('changed business revision is reported without rebasing or discarding the input',async t=>{
  const f=await fixture(t),call=await f.client(),base=f.repository.read().version;
  await call({expectedRevision:0,draft:draft(base)});
  await f.repository.transaction(s=>{s.followups.push({reason:'Concurrent change'});});
  const recovered=await call();assert.equal(recovered.draft.baseVersion,base);assert.ok(recovered.currentVersion>base);
  await call({expectedRevision:1,draft:{...draft(base),fields:{pickupDate:'2026-10-22'}}});
  assert.equal((await call()).draft.baseVersion,base);
});
test('review assertions, file bytes, future revisions and oversized fields cannot enter a draft',async t=>{
  const f=await fixture(t),call=await f.client(),payload=draft(f.repository.read().version);
  for(const fields of [{checked:'true'},{bilingual:'true'},{result:'pass'},{file:'base64-data'},{note:'a'.repeat(2001)}])await call({expectedRevision:0,draft:{...payload,fields}},422);
  await call({expectedRevision:0,draft:{...payload,baseVersion:payload.baseVersion+1}},422);
  assert.equal((await call()).revision,0);
});
test('revoked sovereign access blocks reading and writing previously owned drafts',async t=>{
  const f=await fixture(t),call=await f.client();await call({expectedRevision:0,draft:draft(f.repository.read().version)});
  await f.repository.transaction(s=>{s.artworks[0].ownership_state='SOVEREIGN_COLLECTION';s.artworks[0].acquisition={buyer:'SOVEREIGN_COLLECTION'};});
  await call(undefined,403);await call({expectedRevision:1,draft:null},403);
});
test('archived drafts are reference-only and spectators and artists cannot query the draft service',async t=>{
  const f=await fixture(t),call=await f.client(),payload=draft(f.repository.read().version);
  await call({expectedRevision:0,draft:payload});await f.repository.transaction(s=>{s.artworks[0].lifecycleStatus='ARCHIVED_CLOSED';});
  assert.equal((await call()).draft.baseVersion,payload.baseVersion);await call({expectedRevision:1,draft:payload},409);
  await call({expectedRevision:1,draft:null});
  await (await f.client('Artist'))(undefined,403);await (await f.client('PREPARATORY_COMMITTEE_SPECTATOR'))(undefined,403);
});
test('an attempted submission stays explicit after recovery; no command or approval is replayed',async t=>{
  const f=await fixture(t),call=await f.client(),before=f.repository.read();
  await call({expectedRevision:0,draft:{...draft(before.version),attempted:true,fileName:'reattach.pdf'}});
  const read=await call();assert.equal(read.draft.attempted,true);assert.equal(read.draft.fileName,'reattach.pdf');assert.deepEqual(f.repository.read(),before);
});
test('collection responsibility can journal an attempted form without recording acceptance',async t=>{
  const f=await fixture(t),call=await f.client(),before=f.repository.read();
  await call({expectedRevision:0,draft:{...draft(before.version),taskId:'collection:acceptCollection',key:'acceptCollection',fields:{},attempted:true}});
  assert.deepEqual(f.repository.read(),before);assert.equal((await call()).draft.key,'acceptCollection');
});

test('recovery compares authoritative collection values and retains its original baseline across restart and autosave',async t=>{
  const f=await fixture(t),call=await f.client();
  await f.repository.transaction(s=>{s.collectionRevisions=[{id:'c1',artworkId:PILOT_ARTWORK,address:'Synthetic old store',availability:{start:'2026-10-01',end:'2026-10-31'},plan:{pickupDate:'2026-10-17'},closures:[]}];});
  const base=f.repository.read().version;
  await call({expectedRevision:0,draft:{...draft(base),baseline:{fields:{pickupDate:'forged'}}}});
  await f.repository.transaction(s=>{s.collectionRevisions[0].plan.pickupDate='2026-10-19';s.collectionRevisions[0].closures=[{start:'2026-10-20',end:'2026-10-21'}];});
  await call({expectedRevision:1,draft:{...draft(base),fields:{pickupDate:'2026-10-23'}}});
  await f.restart();const read=await (await f.client())();
  assert.equal(read.comparison.baselineAvailable,true);
  assert.deepEqual(read.comparison.changes.find(c=>c.key==='pickupDate'),{key:'pickupDate',before:'2026-10-17',current:'2026-10-19'});
  assert.ok(read.comparison.changes.some(c=>c.key==='closures'));
  assert.equal(read.draft.fields.pickupDate,'2026-10-23');
  assert.equal(read.comparison.currentVersion,read.currentVersion);
});

test('a late first save cannot fabricate historical values; an unrelated change creates no field differences',async t=>{
  const f=await fixture(t),call=await f.client(),base=f.repository.read().version;
  await f.repository.transaction(s=>{s.followups.push({reason:'Other workflow'});});
  const saved=await call({expectedRevision:0,draft:draft(base)});
  assert.equal((await call()).comparison.baselineAvailable,false);
  await call({expectedRevision:saved.revision,draft:null});
  await call({expectedRevision:2,draft:draft(f.repository.read().version)});
  await f.repository.transaction(s=>{s.followups.push({reason:'Another unrelated change'});});
  assert.deepEqual((await call()).comparison.changes,[]);
});

test('print recovery compares the exact proof, specification, approvals and task ownership',async t=>{
  const f=await fixture(t),call=await f.client('Editorial');
  await f.repository.transaction(s=>{s.printJobs={[PILOT_ARTWORK]:{record:{version:1,review:{},decision:{}},packages:[{revision:1,proofId:'old-pdf',spec:{quantity:100,supplier:'Synthetic printer'},preflight:{passed:true}}]}};});
  const base=f.repository.read().version;
  await call({expectedRevision:0,draft:{...draft(base),kind:'print',key:'preflight',taskId:'print:preflight',fields:{note:'Unsubmitted note'}}});
  await f.repository.transaction(s=>{const j=s.printJobs[PILOT_ARTWORK];j.record={version:2};j.packages.push({revision:2,proofId:'new-pdf',spec:{quantity:200,supplier:'Synthetic printer'},preflight:null});s.operationTasks={[`${PILOT_ARTWORK}:print-review`]:{ownerId:'pilot-Editorial',dueAt:'2026-10-25T12:00:00Z'}};});
  const {comparison}=await call();
  for(const key of ['printRevision','evidenceId','quantity','preflightCheck','editorialCheck','executiveCheck','task.editorial.ownerId','task.editorial.dueAt','task.editorial.status'])assert.ok(comparison.changes.some(c=>c.key===key),key);
  assert.deepEqual(comparison.changes.find(c=>c.key==='editorialCheck'),{key:'editorialCheck',before:'complete',current:'pending'});
  assert.equal(comparison.changes.some(c=>c.key==='address'),false);
});

test('draft comparisons cannot be used to read the other workflow by changing kind',async t=>{
  const f=await fixture(t),logistics=await f.client(),editorial=await f.client('Editorial'),payload=draft(f.repository.read().version);
  await logistics({expectedRevision:0,draft:{...payload,kind:'print'}},403);
  await editorial({expectedRevision:0,draft:payload},403);
});
