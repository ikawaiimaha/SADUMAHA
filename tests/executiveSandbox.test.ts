import test from 'node:test';
import assert from 'node:assert/strict';
import { applySandboxEvent, emptySandbox, restoreSandbox, type SandboxAction, type SandboxRole } from '../src/lib/executiveSandbox';

const id = 'case-mounir-fatmi';
function fixture() {
  let state = emptySandbox();
  const events: any[] = [];
  return {
    get state() { return state; }, events,
    act(role: SandboxRole, action: SandboxAction, fields = {}) {
      const event = { id: crypto.randomUUID(), at: new Date().toISOString(), dossierId: id, role, action, fields, expectedRevision: state.dossiers[id].revision };
      state = applySandboxEvent(state, event); events.push(event);
    },
  };
}
test('five-role sandbox handoff persists collection, evidence and Director approval', () => {
  const f = fixture();
  assert.throws(() => f.act('Director', 'PUBLISH'), /Waiting for the Artist/);
  f.act('Artist_Portal', 'SUBMIT', { submission: 'Synthetic artwork with verified dimensions.' });
  assert.throws(() => f.act('Director', 'READY'), /another role/);
  f.act('General_Exhibition_Coordinator', 'READY');
  assert.throws(() => f.act('Director', 'PUBLISH'), /PR evidence/);
  f.act('PR_Officer', 'VERIFY_PR', { identity: 'confirmed', travel: 'confirmed' });
  assert.throws(() => f.act('Director', 'PUBLISH'), /Logistics/);
  f.act('Logistics_Officer', 'COLLECTION', { address: 'Synthetic Gallery, Paris', date: '2026-10-15', packing: 'Two padded demo crates' });
  f.act('Director', 'PUBLISH');
  assert.equal(f.state.dossiers[id].status, 'Published in sandbox');
  assert.equal(f.state.dossiers['case-murat-kurt'].revision, 0);
  assert.deepEqual(restoreSandbox(JSON.stringify({ version: 1, events: f.events })).state, f.state);
  assert.ok(!JSON.stringify(f.state.decisions).includes('Paris'));
  assert.throws(() => f.act('Artist_Portal', 'SUBMIT', { submission: 'Attempt to edit published work' }), /locked/);
});
test('artist revisions invalidate prior specialist evidence and require fresh approvals', () => {
  const f = fixture();
  f.act('Artist_Portal', 'SUBMIT', { submission: 'Synthetic artwork proposal, first revision.' });
  f.act('PR_Officer', 'VERIFY_PR', { identity: 'confirmed', travel: 'confirmed' });
  f.act('Logistics_Officer', 'COLLECTION', { address: 'Synthetic Gallery', date: '2026-10-15', packing: 'Padded crate' });
  f.act('General_Exhibition_Coordinator', 'REQUEST_REVISION', { critique: 'Please revise the installation measurements.' });
  f.act('Artist_Portal', 'SUBMIT', { submission: 'Synthetic artwork proposal, updated measurements.' });
  assert.equal(f.state.dossiers[id].revision, 2);
  assert.equal(f.state.dossiers[id].prRevision, 0);
  assert.equal(f.state.dossiers[id].collectionRevision, 0);
  assert.equal(f.state.dossiers[id].status, 'Under coordinator review');
  assert.throws(() => f.act('Director', 'PUBLISH'), /Coordinator/);
});
test('invalid input, role forgery, stale and duplicate actions are rejected', () => {
  const f = fixture();
  f.act('Artist_Portal', 'SUBMIT', { submission: 'Synthetic initial artwork proposal.' });
  assert.throws(() => f.act('PR_Officer', 'VERIFY_PR', { identity: 'confirmed' }), /required fields/);
  assert.throws(() => f.act('Logistics_Officer', 'COLLECTION', { address: 'Demo address', date: '2026-02-30', packing: 'Padded crate' }), /valid collection date/);
  assert.throws(() => applySandboxEvent(f.state, f.events[0]), /already been recorded/);
  assert.throws(() => applySandboxEvent(f.state, { ...f.events[0], id: 'stale' }), /revision changed/);
  assert.throws(() => restoreSandbox(JSON.stringify({ version: 1, events: [{ ...f.events[0], role: 'Director' }] })), /another role/);
  assert.throws(() => restoreSandbox('{broken'));
});
