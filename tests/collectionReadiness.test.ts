import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollectionDemo, collectionTransition, collectionTask, validCollectionDemo, type CollectionCommand, type CollectionDemo } from '../src/data/collectionReadiness';
const at = '2026-10-03T14:00:00Z';
function act(s: CollectionDemo, type: CollectionCommand['type'], fields: Partial<CollectionCommand> = {}) { return collectionTransition(s, { type, actor: collectionTask(s).owner, version: s.version, at, ...fields }); }
function assigned() { return act(act(createCollectionDemo(), 'ABSENT'), 'ASSIGN', { value: 'Logistics B', reason: 'Primary on leave' }); }
test('assignment is not acceptance and stale, wrong-owner or premature actions fail', () => {
  const s = assigned();
  assert.equal(s.stage, 'acceptance');
  assert.throws(() => act(s, 'DATE', { value: '2026-10-16' }));
  assert.throws(() => act(s, 'ACCEPT', { actor: 'Logistics A' }));
  assert.throws(() => act(s, 'ACCEPT', { version: 1 }));
  const accepted = act(s, 'ACCEPT');
  assert.throws(() => act(accepted, 'ACCEPT'));
  for (const value of ['2026-12-03', '2026-10-12', '2026-10-32']) assert.throws(() => act(accepted, 'DATE', { value }));
});
test('packing requires named owner, specification, cost authorization and evidence before readiness', () => {
  let s = act(act(assigned(), 'ACCEPT'), 'DATE', { value: '2026-10-16' });
  assert.equal(s.stage, 'packing');
  assert.throws(() => act(s, 'EVIDENCE', { value: 'photo' }));
  assert.throws(() => act(s, 'PACK', { value: '', packingOwner: 'Packer', amount: 1 }));
  assert.throws(() => act(s, 'PACK', { value: 'Crate', packingOwner: 'Packer', amount: NaN }));
  s = act(s, 'PACK', { value: 'Crate', packingOwner: 'Packer', amount: 1200 });
  assert.throws(() => act(s, 'COST', { actor: 'Logistics B', value: 'cost' }));
  assert.throws(() => act(s, 'COST', { actor: 'Finance', value: 'DEMO-COST' }));
  s = act(s, 'TECHNICAL', { value: 'DEMO-TECH' });
  s = act(s, 'COST', { value: 'DEMO-COST' });
  assert.throws(() => act(s, 'EVIDENCE', { value: ' ' }));
  s = act(s, 'EVIDENCE', { value: 'DEMO-PACK-CHECK' });
  assert.equal(s.stage, 'ready');
  assert.match(collectionTask(s).blocker, /No transport booking/);
  const reopened = act(s, 'REOPEN', { value: 'Crate dimensions changed' });
  assert.equal(reopened.stage, 'packing');
  assert.equal(reopened.packing, null);
  assert.ok(reopened.history.some(e => e.action.includes('DEMO-PACK-CHECK')));
  assert.equal(s.packing?.costReference, 'DEMO-COST');
});
test('a replacement backup must accept separately, and reset creates an isolated record', () => {
  const s = act(assigned(), 'ASSIGN', { actor: 'Coordinator', value: 'Logistics C', reason: 'Backup on leave' });
  assert.equal(s.stage, 'acceptance');
  assert.throws(() => act(s, 'ACCEPT', { actor: 'Logistics B' }));
  assert.equal(act(s, 'ACCEPT').owner, 'Logistics C');
  assert.equal(createCollectionDemo().history.length, 0);
});

test('every collection step resumes under one rule set, including a second backup and zero-cost packing', () => {
  let s = createCollectionDemo();
  const resume = () => {
    const saved = JSON.parse(JSON.stringify(s));
    assert.equal(validCollectionDemo(saved), true, `${s.stage}: ${s.history.at(-1)?.action}`);
    assert.deepEqual(collectionTask(saved), collectionTask(s));
  };
  const next = (type: CollectionCommand['type'], fields: Partial<CollectionCommand> = {}) => { s = act(s, type, fields); resume(); };
  resume();
  next('ABSENT'); next('ASSIGN', { value: 'Logistics B', reason: 'Primary away' });
  next('ASSIGN', { actor: 'Coordinator', value: 'Logistics C', reason: 'First backup also away' });
  next('ACCEPT'); next('DATE', { value: '2026-10-16', reason: 'Confirmed response DEMO-REPLY; original December message retained.' });
  next('PACK', { value: 'Custom crate · protective supports', packingOwner: 'Demo packer · Team A', amount: 1200 });
  next('TECHNICAL', { value: 'TECH-01' }); next('COST', { value: 'COST-01' }); next('EVIDENCE', { value: 'CHECK-01' });
  next('REOPEN', { value: 'Packing requirements changed' });
  next('PACK', { value: 'Existing approved crate', packingOwner: 'Gallery', amount: 0, requiresTechnical: false, technicalReason: 'Prepared synthetic non-applicability review' });
  assert.equal(s.stage, 'cost-review', 'zero cost still requires Finance');
  next('COST', { value: 'ZERO-COST-02' }); next('EVIDENCE', { value: 'CHECK-02' });
  next('REOPEN', { value: 'Recheck gallery crate' });
  assert.equal(s.history.some(e => e.action.includes('CHECK-01')), true, 'earlier evidence remains history only');
});

test('restoration rejects missing prerequisites, wrong actors and evidence reused after reopening', () => {
  let s = act(act(assigned(), 'ACCEPT'), 'DATE', { value: '2026-10-16' });
  s = act(s, 'PACK', { value: 'Crate', packingOwner: 'Packer', amount: 1200 });
  s = act(s, 'TECHNICAL', { value: 'TECH-01' }); s = act(s, 'COST', { value: 'COST-01' }); s = act(s, 'EVIDENCE', { value: 'CHECK-01' });
  for (const damage of [
    (v: any) => { v.date = '2026-12-03'; },
    (v: any) => { v.history[2].actor = 'Logistics A'; },
    (v: any) => { v.history[1].action = 'ASSIGN: Logistics C — Backup'; },
    (v: any) => { v.history[5].actor = 'Finance'; },
    (v: any) => { v.history[6].actor = 'Logistics B'; },
    (v: any) => { v.history[4] = null; },
    (v: any) => { v.history[4].version = 999; },
    (v: any) => { v.history[4].action = 'UNKNOWN'; },
    (v: any) => { v.packing.amount = 0; },
    (v: any) => { v.packing.costReference = 'UNRECORDED'; },
    (v: any) => { v.packing.requiresTechnical = false; v.packing.technicalReason = 'Skip'; },
  ]) { const bad = structuredClone(s); damage(bad); assert.equal(validCollectionDemo(bad), false); }
  const reopened = act(s, 'REOPEN', { value: 'New dimensions' });
  assert.equal(validCollectionDemo({ ...reopened, stage: 'ready', packing: s.packing }), false);
  assert.equal(validCollectionDemo({ ...reopened, stage: 'ready' }), false);
  assert.equal(validCollectionDemo(null), false);
  assert.throws(() => act(s, 'UNKNOWN' as CollectionCommand['type']));
});
