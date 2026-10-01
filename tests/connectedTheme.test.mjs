import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createSpatialLedgerService } from '../server/spatial-ledger.mjs';
import { openEcosystemRepository } from '../server/unified-ecosystem.mjs';
import { createHash } from 'node:crypto';
import { createConnectedPilot } from '../server/connected-pilot.mjs';

const proposals=[1,2,3].map(i=>({en:`Theme ${i}`,ar:`موضوع ${i}`,rationale:'Shared practice',feasibility:'Existing spaces',translation:'Review bilingual meaning'}));
const essay={introduction:{en:'Introduction',ar:'مقدمة'},context:{en:'Context',ar:'سياق'},checkedEn:true,checkedAr:true};
async function fixture(){
  const file=join(await mkdtemp(join(tmpdir(),'theme-connected-')),'state.json');
  const repo=await openEcosystemRepository(file,{format:1,version:0,artworks:[{id:'a',exhibitionId:'e'}]});
  const service=createSpatialLedgerService(repo);
  const actor=role=>({id:`account-${role}`,role,exhibitionId:'e'});
  const act=(role,action,fields={})=>service.theme(actor(role),{action,expected:repo.read().themeWorkflow?.revision??0,...fields});
  return {file,repo,service,actor,act};
}
test('shared theme preserves attributed publications, planning alerts and restart state',async()=>{
  const f=await fixture();
  await f.act('Committee','SUBMIT_PROPOSAL',{proposals});
  await f.act('Editorial','PREFLIGHT',{preflight:'Titles reviewed in both languages.'});
  await f.act('Director','ENDORSE');
  await f.act('Chairman','SELECT',{selected:0});
  assert.equal(f.service.readTheme(f.actor('General_Exhibition_Coordinator')).planningAlerts.length,1);
  assert.equal(f.service.readTheme(f.actor('Editorial')).planningAlerts.length,0);
  await f.act('Editorial','SAVE_ESSAY_DRAFT',{essay});
  await f.act('Editorial','SUBMIT_ESSAY',{essay});
  await f.act('Chairman','PUBLISH');
  const publication=structuredClone(f.repo.read().themePublications[0]);
  assert.equal(publication.actorId,'account-Chairman');
  assert.equal(publication.hash,createHash('sha256').update(JSON.stringify(publication.snapshot)).digest('hex'));
  await f.act('Committee','NEW_VERSION');
  assert.deepEqual(f.repo.read().themePublications[0],publication);
  assert.equal(f.repo.read().spatialLedger,undefined,'theme edits must not silently activate contract allocation gates');
  assert.deepEqual((await openEcosystemRepository(f.file)).read(),JSON.parse(JSON.stringify(f.repo.read())));
  assert.ok(f.service.readTheme(f.actor('Director')).invitationReadiness.blockers.some(b=>b.includes('template')));
});
test('drafts can be saved during feedback; unresolved clarification blocks submission',async()=>{
  const f=await fixture();
  await f.act('Committee','SUBMIT_PROPOSAL',{proposals});
  await f.act('Director','RETURN',{note:{reason:'Evidence or clarity required',text:'Clarify scope',anchor:'Proposal 1'}});
  await f.act('Committee','SAVE_PROPOSAL_DRAFT',{proposals});
  await assert.rejects(f.act('Committee','SUBMIT_PROPOSAL',{proposals}),/Resolve every/);
  const noteId=f.repo.read().themeWorkflow.notes[0].id;
  await f.act('Committee','RESOLVE',{noteId,resolution:'Clarification needed',explanation:'Which audience?'});
  await assert.rejects(f.act('Committee','SUBMIT_PROPOSAL',{proposals}),/Resolve every/);
});
test('server identity wins over forged roles and concurrent edits have one winner',async()=>{
  const f=await fixture();
  await assert.rejects(f.service.theme(f.actor('Director'),{role:'Committee',action:'SUBMIT_PROPOSAL',expected:0,proposals}),/not available/);
  const command={action:'SAVE_PROPOSAL_DRAFT',expected:0,proposals};
  const results=await Promise.allSettled([f.service.theme(f.actor('Committee'),command),f.service.theme(f.actor('Committee'),command)]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(f.repo.read().themeDecisions.length,1);
  assert.throws(()=>f.service.readTheme({...f.actor('Director'),exhibitionId:'other'}),/cannot access/);
});

test('HTTP theme workspace uses the authenticated session and shared persisted state',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'theme-http-'));
  const {app}=await createConnectedPilot({directory,gate:(_req,_res,next)=>next()});
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;let cookie='';
  const call=(path,body)=>fetch(origin+path,{method:body?'POST':'GET',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  const login=async role=>{const r=await call('/api/review/session',{accountId:`pilot-${role}`});cookie=r.headers.get('set-cookie').split(';')[0];};
  try {
    assert.equal((await call('/api/review/spatial-ledger/theme')).status,401);
    await login('Committee');
    assert.equal((await call('/api/review/spatial-ledger/theme',{action:'SUBMIT_PROPOSAL',expected:0,proposals,role:'Chairman'})).status,200);
    await login('Director');
    const view=await (await call('/api/review/spatial-ledger/theme')).json();
    assert.equal(view.theme.proposals[0].en,proposals[0].en);
    assert.equal(view.owner,'Editorial');
    assert.equal(view.decisions[0].actorId,'pilot-Committee');
    assert.equal((await call('/api/review/spatial-ledger/theme',{action:'ENDORSE',expected:1})).status,409);
    await login('Artist');assert.equal((await call('/api/review/spatial-ledger/theme')).status,403);
  } finally {await new Promise(resolve=>server.close(resolve));}
});
