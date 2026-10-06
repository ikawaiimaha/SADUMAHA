import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCollectionDemo, DEMO_ARTWORK } from '../server/collection-demo.mjs';

test('isolated collection handoff rejects all other operations and preserves restart state',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'sadu-collection-demo-'));
  const runtime=await createCollectionDemo(directory),server=runtime.app.listen(0,'127.0.0.1');
  await new Promise(r=>server.once('listening',r));
  const origin=`http://127.0.0.1:${server.address().port}`,path=`/api/review/pilot/collection/${DEMO_ARTWORK}`;
  let cookie='';
  const call=(url,body,method)=>fetch(origin+url,{method:method??(body?'POST':'GET'),headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  const login=async accountId=>{const r=await call('/api/review/session',{accountId});assert.equal(r.status,200);cookie=r.headers.get('set-cookie').split(';')[0];};
  const view=async()=>{const r=await call(path);assert.equal(r.status,200);return r.json();};
  const send=async(action,extra={},status=200)=>{const command={version:(await view()).version,action,...extra};if(status===200&&['SAVE','PLAN','REOPEN'].includes(action)){const p=await call(path+'/impact',command);assert.equal(p.status,200);const impact=await p.json();if(impact.required)command.impactToken=impact.token;}const r=await call(path,command);assert.equal(r.status,status,await r.text());};
  const details={address:'Synthetic store 1',city:'Paris',country:'France',contact:'Demo desk',sourceRef:'SYNTHETIC-01',timezone:'Europe/Paris',availability:{start:'2026-10-01',end:'2026-10-31'},closures:[{start:'2026-10-10',end:'2026-10-15'}],conflict:false};
  try {
    assert.equal((await call(path)).status,401);
    assert.equal((await call('/api/review/session',{accountId:'pilot-Director'})).status,403);
    await login('pilot-Logistics');
    await send('SAVE',{details:{...details,address:''}},422);
    await send('SAVE',{details:{...details,conflict:true}});await send('CONFIRM',{checked:true},409);
    await send('SAVE',{details});await send('ACCEPT');await send('CONFIRM',{checked:true});
    const before=runtime.repository.read();
    for(const pickupDate of ['2026-10-10','2026-10-15'])await send('PLAN',{pickupDate},409);
    assert.deepEqual(runtime.repository.read(),before);
    const oldVersion=(await view()).version;
    await login('demo-coordinator');
    await send('ASSIGN',{primaryId:'pilot-Logistics',backupId:'demo-backup',activeId:'demo-backup',reason:'Synthetic planned absence'});
    await send('CONFIRM',{checked:true},403);
    await login('pilot-Logistics');
    assert.equal((await call(path,{version:oldVersion,action:'PLAN',pickupDate:'2026-10-16'})).status,409);
    await send('PLAN',{pickupDate:'2026-10-16'},403);
    await login('demo-backup');
    const q=await(await call('/api/review/pilot')).json();assert.equal(q.nextActions[0].ownerId,'demo-backup');assert.equal(q.nextActions[0].id,`${DEMO_ARTWORK}-collection`);
    await send('PLAN',{pickupDate:'2026-10-16'},409);await send('ACCEPT');
    await send('PLAN',{pickupDate:'2026-10-16'});assert.equal((await view()).state,'PACKING_REQUIRED');
    await send('PACK',{value:'Crate',packingOwner:'Demo packer',amount:100,requiresTechnical:true});
    await login('demo-technical');await send('TECHNICAL',{value:'TEST-TECH'});
    await login('demo-finance');await send('COST',{value:'TEST-COST'});
    await login('demo-backup');await send('EVIDENCE',{value:'TEST-PACKING'});
    assert.equal((await view()).ready,true);
    const stable=runtime.repository.read();
    for(const endpoint of ['/api/review/pilot/action','/api/review/ecosystem/arrival','/api/review/acquisition/initiate','/api/review/pilot/invitation','/api/review/pilot/manifest.pdf','/api/anything']) {
      assert.equal((await call(endpoint,{action:'pay'})).status,403);
      assert.equal((await call(endpoint)).status,403);
    }
    assert.equal((await call(path,{action:'DELETE'},'DELETE')).status,403);
    await send('PAY',{},422);
    assert.deepEqual(runtime.repository.read(),stable);
    assert.deepEqual(stable.payments,[]);assert.equal(stable.artworks[0].lifecycleStatus,'INVITED');assert.equal(stable.artworks[0].physicalStatus,'Pending_Shipment');
    const restarted=await createCollectionDemo(directory);assert.deepEqual(restarted.repository.read(),stable);
    await send('SAVE',{details:{...details,address:'Synthetic store 2'}});
    assert.equal((await view()).state,'SOURCE_CONFIRMATION_REQUIRED');assert.equal((await view()).record.plan,null);
    await login('demo-coordinator');await send('ASSIGN',{primaryId:'pilot-Logistics',backupId:'demo-backup',activeId:'pilot-Logistics',reason:'Primary returned'});
    assert.equal((await view()).assignment.activeId,'pilot-Logistics');
  } finally {await new Promise(r=>server.close(r));}
});
