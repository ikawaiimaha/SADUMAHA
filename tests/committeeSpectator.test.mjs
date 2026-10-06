import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createConnectedPilot } from '../server/connected-pilot.mjs';
import { spectatorView, SPECTATOR_ROLE } from '../server/committee-spectator.mjs';
const actor={role:SPECTATOR_ROLE,exhibitionId:'connected-pilot'};
function fixture(){return {artworks:[{id:'a',exhibitionId:'connected-pilot',currentRevisionId:'r'}],revisions:[{id:'r',artistName:{en:'Artist',ar:'فنان'},concept_text:'Concept',media:{objectId:'private'},passport:'secret'}],themeWorkflow:{proposals:[{en:'Theme',ar:'موضوع',rationale:'Rationale',privateNotes:'secret'}]},spatialLedger:{exhibitionId:'connected-pilot',venues:[{id:'v',name:'Museum',active:true}],galleries:[{id:'g',venueId:'v',name:'Hall',active:true}],artworks:[{id:'a',galleryId:'g',state:'APPROVED'}],curation:{phase:'COMMITTEE_REVIEW',nominations:[{id:'n',status:'SHORTLISTED',revisions:[{number:1}]}],snapshots:[{state:'LOCKED',rows:[{proposalId:'n',slot:{galleryId:'g'},revision:{artistId:'a',number:1}}]}]}}};}
test('shared board projection excludes restricted, stale and non-pending candidates and private fields',()=>{
 const s=fixture();assert.equal(spectatorView(s,actor).candidates[0].status,'PENDING_COMMITTEE_REVIEW');assert.doesNotMatch(JSON.stringify(spectatorView(s,actor)),/secret|private/);
 for(const mutate of [s=>s.artworks[0].ownership_state='SOVEREIGN_COLLECTION',s=>s.spatialLedger.curation.snapshots[0].rows[0].slot.restricted=true,s=>s.spatialLedger.curation.nominations[0].status='ENDORSED',s=>s.spatialLedger.curation.nominations[0].revisions.push({number:2}),s=>s.spatialLedger.galleries[0].active=false]){const copy=fixture();mutate(copy);assert.equal(spectatorView(copy,actor).candidates.length,0);}
 assert.throws(()=>spectatorView(s,{...actor,exhibitionId:'other'}));assert.throws(()=>spectatorView(s,{...actor,role:'Artist'}));
});
test('spectator HTTP session cannot mutate, escalate roles or access private exports',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'sadu-spectator-'));const runtime=await createConnectedPilot({directory,gate:(_q,_r,next)=>next()});const server=runtime.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const origin=`http://127.0.0.1:${server.address().port}`;
 try{const login=await fetch(origin+'/api/review/session',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({accountId:`pilot-${SPECTATOR_ROLE}`})});assert.equal(login.status,200);const Cookie=login.headers.get('set-cookie').split(';')[0];
 const get=path=>fetch(origin+path,{headers:{Cookie}});
 assert.equal((await get('/api/review/committee-spectator')).status,200);assert.deepEqual((await(await get('/api/review/session')).json()).accounts,[]);
 for(const path of ['/api/review/pilot','/api/review/pilot/media','/api/review/pilot/label.pdf','/api/review/signing-envelope','/api/review/spatial-ledger'])assert.equal((await get(path)).status,403,path);
 for(const path of ['/api/review/session','/api/review/pilot/action','/api/review/ecosystem/publish','/api/review/committee-spectator'])assert.equal((await fetch(origin+path,{method:'POST',headers:{Cookie,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({accountId:'pilot-Director'})})).status,403,path);
 }finally{await new Promise(r=>server.close(r));}
});

 test('image bytes are verified and access is rechecked after loading',async()=>{
 const { committeeSpectatorService }=await import('../server/committee-spectator.mjs');const {createHash}=await import('node:crypto');const s=fixture();const bytes=Buffer.from('test image');s.revisions[0].media.file_hash=createHash('sha256').update(bytes).digest('hex');
 const repository={read:()=>s};
 assert.deepEqual(await committeeSpectatorService(repository,async()=>bytes).media(actor,'a','r'),bytes);
 await assert.rejects(committeeSpectatorService(repository,async()=>Buffer.from('tampered')).media(actor,'a','r'),/integrity/);
 await assert.rejects(committeeSpectatorService(repository,async()=>{s.artworks[0].ownership_state='SOVEREIGN_COLLECTION';return bytes;}).media(actor,'a','r'),/changed/);
 });
