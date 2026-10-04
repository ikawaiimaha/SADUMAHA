import test from 'node:test';
import assert from 'node:assert/strict';
import { createGuidedSession, guidedCollection, acknowledgeGuidedProof, canAdvanceGuided, validGuidedSession, guidedNavigation, navigateGuidedSession } from '../src/data/guidedPresentation';
import { collectionTransition, validCollectionDemo } from '../src/data/collectionReadiness';
import { validPublishingRecord } from '../src/data/publishingRecord';
import { loadCheckpoint, saveCheckpoint } from '../src/lib/demoCheckpoint';
const at = '2026-10-03T10:00:00Z';
test('guided handoff retains acceptance, date and packing gates', () => {
  const initial = createGuidedSession();
  let c = initial.collection;
  assert.equal(canAdvanceGuided({ ...initial, scene: 1 }), false);
  assert.throws(() => guidedCollection(c, 'COMPLETE_PACKING', at));
  c = guidedCollection(c, 'ASSIGN', at);
  assert.equal(c.stage, 'acceptance');
  assert.equal(canAdvanceGuided({ ...initial, scene: 1, collection: c }), false);
  assert.throws(() => guidedCollection(c, 'DATE', at, '2026-10-16'));
  c = guidedCollection(c, 'ACCEPT', at);
  assert.throws(() => guidedCollection(c, 'DATE', at, '2026-10-12'));
  assert.throws(() => guidedCollection(c, 'DATE', at, '2026-12-03'));
  c = guidedCollection(c, 'DATE', at, '2026-10-16');
  assert.equal(canAdvanceGuided({ ...initial, scene: 2, collection: c }), false);
  c = guidedCollection(c, 'PREPARE_PACKING', at);
  assert.equal(c.stage, 'pack-evidence');
  assert.deepEqual(c.history.slice(-3).map(e => e.actor), ['Logistics B', 'Technical', 'Finance']);
  assert.throws(() => collectionTransition(c, { type: 'EVIDENCE', actor: 'Coordinator', version: c.version, at, value: 'wrong authority' }));
  c = guidedCollection(c, 'COMPLETE_PACKING', at);
  assert.equal(canAdvanceGuided({ ...initial, scene: 2, collection: c }), true);
  assert.equal(c.stage, 'ready');
  assert.equal(canAdvanceGuided({ ...initial, scene: 2, collection: c, paused: true }), false);
  assert.equal(validGuidedSession(JSON.parse(JSON.stringify({ ...initial, scene: 2, collection: c }))), true);
  assert.equal(createGuidedSession().collection.stage, 'unavailable');
});
test('prepared proof preserves old approval but rejects stale supplier acknowledgment', () => {
  const s = createGuidedSession();
  assert.equal(s.print.previous[0].decision?.outcome, 'release');
  assert.equal(s.print.supplierAck, null);
  assert.equal(acknowledgeGuidedProof(s.print, 1, at), s.print);
  const next = acknowledgeGuidedProof(s.print, 2, at);
  assert.equal(next.supplierAck?.version, 2);
  assert.equal(next.production, null);
  assert.equal(canAdvanceGuided({ ...s, scene: 3, print: next }), true);
});
test('checkpoint validation rejects incomplete states and unsupported language or scenes', () => {
  const s = createGuidedSession();
  assert.equal(validGuidedSession(s), true);
  assert.equal(validGuidedSession({ ...s, scene: 9 }), false);
  assert.equal(validGuidedSession({ ...s, language: 'bad' }), false);
  assert.equal(validGuidedSession({ ...s, collection: { ...s.collection, stage: 'ready', packing: null } }), false);
  assert.equal(validGuidedSession(null), false);
});

test('every guided collection stage can resume, while malformed saved records recover without deleting the source', () => {
  let s = createGuidedSession();
  assert.equal(validGuidedSession(s), true);
  for (const command of ['ASSIGN', 'ACCEPT', 'DATE', 'PREPARE_PACKING', 'COMPLETE_PACKING'] as const) {
    s = { ...s, collection: guidedCollection(s.collection, command, at, command === 'DATE' ? '2026-10-16' : undefined) };
    assert.equal(validCollectionDemo(s.collection), true, 'the guided flow uses the shared collection contract');
    assert.equal(validGuidedSession(JSON.parse(JSON.stringify(s))), true, command);
  }
  const invalid = [
    (v: any) => { v.collection.date = 'damaged-date'; },
    (v: any) => { v.collection.date = '2026-10-32'; },
    (v: any) => { v.collection.date = '2026-10-12'; },
    (v: any) => { v.collection.date = ''; },
    (v: any) => { v.collection.history[0] = null; },
    (v: any) => { v.collection.history[0].at = 'damaged-time'; },
    (v: any) => { v.collection.history[0].action = null; },
    (v: any) => { v.collection.history[0].version = -1; },
    (v: any) => { v.collection.history.find((e: any) => e.action === 'ACCEPT').actor = 'Coordinator'; },
    (v: any) => { v.collection.packing.amount = '1200'; },
    (v: any) => { v.collection.packing.amount = -1; },
    (v: any) => { v.collection.packing.requiresTechnical = 'yes'; },
    (v: any) => { v.collection.packing.specification = ''; },
    (v: any) => { v.collection.packing.owner = null; },
    (v: any) => { v.collection.packing.evidence = 'unrecorded-reference'; },
    (v: any) => { v.collection.packing.technicalReference = 'unrecorded-review'; },
    (v: any) => { v.collection.packing.costReference = ''; },
  ];
  for (const mutate of invalid) {
    const damaged = JSON.parse(JSON.stringify(s)); mutate(damaged);
    assert.equal(validGuidedSession(damaged), false);
    const raw = JSON.stringify({ schema: 1, value: damaged });
    let writes = 0;
    const storage = { getItem: () => raw, setItem: () => { writes++; } };
    const recovered = loadCheckpoint(storage, 'demo', createGuidedSession, validGuidedSession);
    assert.equal(recovered.value.collection.stage, 'unavailable');
    assert.match(recovered.warning, /could not be restored/);
    assert.equal(storage.getItem(), raw);
    assert.equal(writes, 0, 'recovery retains the rejected checkpoint');
  }
  assert.equal(validGuidedSession({ ...createGuidedSession(), scene: 5 }), false, 'a completed presentation cannot restore unfinished collection');
});

test('guided and detailed print examples reject the same damaged revision and actor evidence', () => {
  const original = createGuidedSession();
  for (const damage of [
    (s: any) => { s.print.review = null; },
    (s: any) => { s.print.decision.outcome = 'return'; },
    (s: any) => { s.print.decision.actor = 'COORDINATOR'; },
    (s: any) => { s.print.dispatch.version = 1; },
    (s: any) => { s.print.previous[0].proofs[0].at = 'bad'; },
  ]) {
    const bad = structuredClone(original); damage(bad);
    assert.equal(validPublishingRecord(bad.print), false);
    assert.equal(validGuidedSession(bad), false);
    const raw = JSON.stringify({ schema: 1, value: bad });
    const recovered = loadCheckpoint({ getItem: () => raw, setItem: () => assert.fail('loading must not discard the source') }, 'guided', createGuidedSession, validGuidedSession);
    assert.equal(recovered.rejected, raw);
    assert.equal(validGuidedSession(recovered.value), true);
  }
});

test('the first fresh save preserves rejected data and does not overwrite an older recovery copy', () => {
  const raw = '{damaged checkpoint';
  const entries = new Map([['demo', raw], ['demo:rejected', 'earlier damaged checkpoint']]);
  const storage = { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => { entries.set(key, value); } };
  const loaded = loadCheckpoint(storage, 'demo', createGuidedSession, validGuidedSession);
  assert.equal(saveCheckpoint(storage, 'demo', loaded.value, loaded.rejected), '');
  assert.equal(entries.get('demo:rejected'), 'earlier damaged checkpoint');
  assert.equal(entries.get('demo:rejected:1'), raw);
  assert.equal(validGuidedSession(JSON.parse(entries.get('demo')!).value), true);
  entries.set('demo', 'another damaged checkpoint');
  const blocked = { getItem: storage.getItem, setItem: () => { throw new Error('Quota exceeded'); } };
  assert.match(saveCheckpoint(blocked, 'demo', loaded.value, 'another damaged checkpoint'), /could not be saved/);
  assert.equal(entries.get('demo'), 'another damaged checkpoint', 'failed recovery copy must not replace the original');
});

test('the main pitch completes collection before the proposal, without completing the optional print job', () => {
  let s = navigateGuidedSession(createGuidedSession(), 1);
  assert.equal(navigateGuidedSession(s, 4), s, 'cannot skip ownership');
  s = { ...s, collection: guidedCollection(s.collection, 'ASSIGN', at) };
  assert.equal(navigateGuidedSession(s, 2), s, 'assignment still needs acceptance');
  s = { ...s, collection: guidedCollection(s.collection, 'ACCEPT', at) };
  s = navigateGuidedSession(s, 2);
  assert.equal(navigateGuidedSession(s, 4), s, 'cannot skip date and packing');
  s = { ...s, collection: guidedCollection(s.collection, 'DATE', at, '2026-10-16') };
  s = { ...s, collection: guidedCollection(s.collection, 'PREPARE_PACKING', at) };
  assert.equal(guidedNavigation(s).next, null, 'a plan is not completion evidence');
  s = { ...s, collection: guidedCollection(s.collection, 'COMPLETE_PACKING', at) };
  assert.equal(guidedNavigation(s).next, 4);
  const proposal = navigateGuidedSession(s, 4);
  assert.equal(proposal.scene, 4);
  assert.equal(proposal.print.supplierAck, null);
  assert.equal(proposal.collection, s.collection);
  const optional = navigateGuidedSession(proposal, 3);
  assert.equal(optional.scene, 3);
  assert.equal(validGuidedSession(JSON.parse(JSON.stringify(optional))), true);
  const returned = navigateGuidedSession(optional, 4);
  assert.equal(returned.scene, 4);
  assert.equal(returned.print, proposal.print, 'leaving the optional example cannot acknowledge a proof');
  assert.equal(guidedNavigation(returned).previous, 2);
  assert.equal(navigateGuidedSession(returned, 5).scene, 5);
  const paused = { ...returned, paused: true };
  assert.equal(navigateGuidedSession(paused, 3), paused);
  assert.deepEqual(guidedNavigation(paused), { previous: null, next: null });
});
