import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable, Writable } from 'node:stream';
import { createPilotDispatch, dispatchView } from '../server/pilot-dispatch.mjs';
import { openEcosystemRepository } from '../server/unified-ecosystem.mjs';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const photo=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4XmN49vDSfwAI4wOZS6NgQwAAAABJRU5ErkJggg==','base64');
async function setup(){
  const file=join(await mkdtemp(join(tmpdir(),'dispatch-')),'state.json');
  const repository=await openEcosystemRepository(file,{format:1,version:0,artworks:[{id:'a',artistActorId:'artist',exhibitionId:'e',currentRevisionId:'r',physicalStatus:'Pending_Shipment'}],revisions:[{id:'r',artworkId:'a',versionHash:'hash',state:'PUBLISHED'}],agreement:{accepted:true,revisionId:'r'},decisions:[],payments:[]});
  const objects=new Map();let sequence=0;
  const storage={openStaging:async()=>{const objectId=String(++sequence);const chunks=[];return {objectId,stream:new Writable({write(chunk,_encoding,done){chunks.push(chunk);done();},final(done){objects.set(objectId,Buffer.concat(chunks));done();}})};}};
  const service=createPilotDispatch({repository,storage,readObject:async id=>objects.get(id)});
  const actor={id:'artist',role:'Artist',exhibitionId:'e'}, coordinator={id:'gc',role:'General_Exhibition_Coordinator',exhibitionId:'e'};
  const command=()=>({version:repository.read().version,versionHash:'hash',damaged:true,notes:'Crack in the frame.',logistics:{origin:'Studio',destination:'Museum',carrier:'Booking 1',handling:'Padded upright crate',gross_weight_kg:90}});
  const review=(action)=>({...command(),reportId:dispatchView(repository.read()).report?.id,action,reason:'Reviewed the condition evidence.'});
  return {repository,service,actor,coordinator,command,review,file,objects};
}
test('damage cannot clear, repair needs new evidence and approval survives restart',async()=>{
  const x=await setup();
  await x.service.submit(x.actor,x.command(),Readable.from(photo));
  await assert.rejects(x.service.review(x.actor,x.review('CLEAR')),/role/);
  await assert.rejects(x.service.review(x.coordinator,x.review('CLEAR')),/Damage/);
  assert.equal(dispatchView(x.repository.read()).ready,false);
  await x.service.review(x.coordinator,x.review('REPAIR'));
  await assert.rejects(x.service.submit(x.actor,{...x.command(),damaged:false},Readable.from(photo)),/new condition/);
  // A different image fixture represents a freshly captured photograph.
  const fresh=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=','base64');
  await x.service.submit(x.actor,{...x.command(),damaged:false},Readable.from(fresh));
  assert.equal(dispatchView(x.repository.read()).ready,false);
  await x.service.review(x.coordinator,x.review('CLEAR'));
  assert.equal(dispatchView(x.repository.read()).ready,true);
  assert.equal(x.repository.read().dispatchReports.length,2);
  assert.deepEqual(dispatchView((await openEcosystemRepository(x.file)).read()),dispatchView(x.repository.read()));
  assert.equal(x.repository.read().payments.length,0);
  await x.repository.transaction(s=>{s.revisions[0].versionHash='changed';});
  assert.equal(dispatchView(x.repository.read()).ready,false);
});
test('interrupted uploads and concurrent submissions cannot partially commit',async()=>{
  const x=await setup(), before=x.repository.read();
  const interrupted=Readable.from((async function*(){yield photo.subarray(0,20);throw new Error('Connection lost');})());
  await assert.rejects(x.service.submit(x.actor,x.command(),interrupted),/Connection lost/);
  assert.deepEqual(x.repository.read(),before);
  const command=x.command();
  const results=await Promise.allSettled([x.service.submit(x.actor,command,Readable.from(photo)),x.service.submit(x.actor,command,Readable.from(photo))]);
  assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
  assert.equal(x.repository.read().dispatchReports.length,1);
  assert.equal(x.repository.read().decisions.length,1);
  await x.service.review(x.coordinator,x.review('CANCEL'));
  await assert.rejects(x.service.submit(x.actor,x.command(),Readable.from(photo)),/no longer editable/);
});
test('private evidence rejects foreign actors and corrupted files',async()=>{
  const x=await setup();
  await assert.rejects(x.service.submit({...x.actor,id:'other'},x.command(),Readable.from(photo)),/role/);
  await assert.rejects(x.service.submit(x.actor,x.command(),Readable.from('not an image')),/PNG/);
  await x.service.submit(x.actor,x.command(),Readable.from(photo));
  assert.deepEqual(await x.service.photo(x.coordinator),photo);
  await assert.rejects(x.service.photo({...x.coordinator,role:'Finance'}),/role/);
  const stored=x.repository.read().dispatchReports[0];x.objects.set(stored.photo.objectId,Buffer.from('tampered'));
  await assert.rejects(x.service.photo(x.coordinator),/integrity/);
  assert.ok(x.repository.read().decisions.every(d=>!('notes' in d)&&!('logistics' in d)));
});
