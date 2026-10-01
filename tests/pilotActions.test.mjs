import test from 'node:test';
import assert from 'node:assert/strict';
import { pilotActions } from '../server/pilot-actions.mjs';
import { openEcosystemRepository } from '../server/unified-ecosystem.mjs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const seed = () => ({format:1,version:0,artworks:[{id:'a',currentRevisionId:'r'}],revisions:[{id:'r',versionHash:'h',state:'EXECUTIVE_REVIEW',approvals:{}}],placements:[],payments:[]});
test('queues isolate owners and explain revision-dependent blockers without mutating data', () => {
  const state=seed(), before=structuredClone(state);
  const finance=pilotActions(state,'Finance');
  assert.equal(finance.length,1);
  assert.match(finance[0].blocker,/acceptance/);
  assert.ok(finance.every(t=>t.owner==='Finance'));
  state.agreement={accepted:true,revisionId:'r'};
  state.revisions[0].approvals={pr:{hash:'old'},technical:{hash:'h'}};
  assert.match(pilotActions(state,'Finance')[0].blocker,/PR and Technical/);
  state.revisions[0].approvals.pr.hash='h';
  assert.equal(pilotActions(state,'Finance')[0].blocker,'');
  state.payments=[{tranche:0}];
  assert.match(pilotActions(state,'Finance')[0].blocker,/receipt/);
  state.artworks[0].lifecycleStatus='ARCHIVED_CLOSED';
  assert.deepEqual(pilotActions(state,'Finance'),[]);
  const fresh=seed();pilotActions(fresh,'Director');assert.deepEqual(fresh,before);
});
test('competing versioned transactions preserve one winner and recover after restart',async()=>{
  const file=join(await mkdtemp(join(tmpdir(),'sadu-concurrency-')),'state.json');
  const repository=await openEcosystemRepository(file,seed());
  const change=actor=>repository.transaction(s=>{
    if(s.version!==0)throw new Error('Conflict');
    s.decisions=[{actor}];
  });
  const results=await Promise.allSettled([change('first'),change('second')]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(results.filter(r=>r.status==='rejected').length,1);
  const persisted=repository.read();
  await assert.rejects(repository.transaction(s=>{s.decisions.push({actor:'failed'});throw new Error('Interrupted');}));
  assert.deepEqual(repository.read(),persisted);
  const reopened=await openEcosystemRepository(file);
  assert.deepEqual(reopened.read(),persisted);
});
