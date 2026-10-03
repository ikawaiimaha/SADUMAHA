import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollectionDemo, collectionTransition, collectionTask, type CollectionCommand, type CollectionDemo } from '../src/data/collectionReadiness';
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
