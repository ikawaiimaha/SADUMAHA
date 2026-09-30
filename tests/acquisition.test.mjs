import {openEcosystemRepository,emptyEcosystem} from '../server/unified-ecosystem.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {nextAccessionNumber,acquisitionService} from '../server/acquisition.mjs';
import {createConnectedPilot,PILOT_ARTWORK} from '../server/connected-pilot.mjs';
import {LocalSignatureProvider} from '../src/governance/localAdapters.ts';

test('accession convention validates input and never reuses existing numbers',()=>{
 const state={artworks:[{accession_number:'2026.1.000001'}]};
 assert.equal(nextAccessionNumber(state,2026,1),'2026.1.000002');assert.equal(nextAccessionNumber(state,2026,1),'2026.1.000003');
 assert.throws(()=>nextAccessionNumber(state,2026,0),/valid accession/);
});
test('accession counters serialize concurrent approvals and survive restart',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'sadu-accessions-'));const file=join(directory,'state.json');const repo=await openEcosystemRepository(file,emptyEcosystem());
 const results=await Promise.all(Array.from({length:12},()=>repo.transaction(s=>nextAccessionNumber(s,2026,2))));assert.equal(new Set(results).size,12);
 const restored=await openEcosystemRepository(file);assert.equal(await restored.transaction(s=>nextAccessionNumber(s,2026,2)),'2026.2.000013');
});
for(const buyer of ['SDC_OWNED','SOVEREIGN_COLLECTION'])test(`acquisition HTTP fork, documents and access: ${buyer}`,async()=>{
 const directory=await mkdtemp(join(tmpdir(),'sadu-acquisition-'));const runtime=await createConnectedPilot({directory,gate:(_req,_res,next)=>next()});
 const hash='a'.repeat(64),revisionId='test-published-revision';
 await runtime.repository.transaction(s=>{s.artworks[0].currentRevisionId=revisionId;s.artworks[0].physicalStatus='On_Site_Sharjah';s.revisions.push({id:revisionId,artworkId:PILOT_ARTWORK,sequence:1,state:'PUBLISHED',versionHash:hash,artistName:{en:'Noura Al Mazrouei',ar:'نورة المزروعي'},title:{en:'Kufic Horizon',ar:'أفق كوفي'},description:{en:'Verified fictional metadata',ar:'بيانات تجريبية'},width_cm:120,height_cm:180,year:2026,media:{file_hash:hash},approvals:{}});});
 const server=runtime.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const origin=`http://127.0.0.1:${server.address().port}`;let cookie='';
 const call=(path,body)=>fetch(origin+path,{...(body?{method:'POST',body:JSON.stringify(body)}:{}),headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'}});
 const login=async role=>{const r=await call('/api/review/session',{accountId:'pilot-'+role});cookie=r.headers.get('set-cookie').split(';')[0];};
 const command={artworkId:PILOT_ARTWORK,versionHash:hash,buyer,purchaseMinor:8500000,priceAgreementRef:'Fictional price agreement A-1'};
 try{
 await login('Logistics');assert.equal((await call('/api/review/acquisition/initiate',command)).status,403);
 await login('Director');assert.equal((await call('/api/review/acquisition/initiate',{...command,purchaseMinor:0})).status,422);
 const before=runtime.repository.read();const failing=acquisitionService({repository:runtime.repository,signatureProvider:new LocalSignatureProvider(),render:()=>{throw new Error('PDF failed');}});
 await assert.rejects(failing.initiate({id:'pilot-Director',role:'Director',exhibitionId:'connected-pilot'},command),/PDF failed/);assert.deepEqual(runtime.repository.read(),before);
 assert.equal((await call('/api/review/acquisition/initiate',command)).status,200);assert.equal((await call('/api/review/acquisition/initiate',command)).status,409);
 const q=runtime.repository.read().artworks[0].acquisition;const approval={artworkId:PILOT_ARTWORK,documentHash:q.documentHash,year:2026,edition:1};
 assert.equal((await call('/api/review/acquisition/approve',approval)).status,409);
 assert.equal((await call('/api/review/pilot/manifest.pdf')).status,409);
 await login('Artist');assert.equal((await call('/api/review/signing-envelope')).status,200);
 const title=await call(`/api/review/signing-envelope/${PILOT_ARTWORK}.pdf`);assert.equal(title.status,200);const bytes=Buffer.from(await title.arrayBuffer());assert.equal(bytes.subarray(0,5).toString(),'%PDF-');await writeFile(join(directory,'transfer-of-title.pdf'),bytes);
 if(buyer==='SOVEREIGN_COLLECTION')for(const path of ['/api/review/pilot','/api/review/spatial','/api/review/pilot/media','/api/review/pilot/label.pdf','/api/review/ecosystem/budget'])assert.equal((await call(path)).status,403,path);
 assert.equal((await call('/api/review/acquisition/sign',{...approval,confirm:true,documentHash:'bad'})).status,409);
 assert.equal((await call('/api/review/acquisition/sign',{...approval,confirm:true})).status,200);
 await login('Director');assert.equal((await call('/api/review/acquisition/approve',approval)).status,200);assert.equal((await call('/api/review/acquisition/approve',approval)).status,409);
 assert.equal(runtime.repository.read().artworks[0].accession_number,'2026.1.000001');
 await login('Logistics');const destination=buyer==='SDC_OWNED'?'SDC Main Storage':'H.H. Sovereign Private Collection';
 if(buyer==='SOVEREIGN_COLLECTION'){assert.equal((await call('/api/review/acquisition/route',{...approval,destination})).status,403);await login('General_Exhibition_Coordinator');}
 assert.equal((await call('/api/review/acquisition/route',{...approval,destination:'Unknown'})).status,422);
 assert.equal((await call('/api/review/acquisition/route',{...approval,destination})).status,200);
 await login('Artist');const envelopeAfter=await (await call('/api/review/signing-envelope')).json();assert.equal(envelopeAfter.state,'SIMULATED_ARTIST_ACCEPTED');assert.equal(envelopeAfter.destination,undefined);const afterRoute=await call(`/api/review/signing-envelope/${PILOT_ARTWORK}.pdf`);assert.deepEqual(Buffer.from(await afterRoute.arrayBuffer()),bytes);await login(buyer==='SOVEREIGN_COLLECTION'?'General_Exhibition_Coordinator':'Logistics');
 const manifest=await call(`/api/review/acquisition/${PILOT_ARTWORK}/manifest.pdf`);assert.equal(manifest.status,200);await writeFile(join(directory,'permanent-transfer.pdf'),Buffer.from(await manifest.arrayBuffer()));
 const service=acquisitionService({repository:runtime.repository,signatureProvider:new LocalSignatureProvider()});assert.throws(()=>service.document({id:'x',role:'Director',exhibitionId:'other'},PILOT_ARTWORK,'title'),/not assigned/);
 const restored=await createConnectedPilot({directory,gate:(_q,_s,next)=>next()});assert.equal(restored.repository.read().artworks[0].accession_number,'2026.1.000001');
 console.log('ACQUISITION_EVIDENCE '+directory);
 }finally{await new Promise(r=>server.close(r));}
});
