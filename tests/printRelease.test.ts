import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublishingRecord, reducePublishingRecord as reduce, selectPublishingRecord, PRINT_ROUTE_ID } from '../src/data/publishingRecord';
const at = '2026-10-03T09:00:00Z';
const attach = { type: 'ATTACH_PRINT_PROOF', actor: 'COORDINATOR', at } as const;
function released() {
  let s = reduce(createPublishingRecord(), attach);
  s = reduce(s, { type: 'ROUTE_PRINT_PROOF', actor: 'PUBLISHING_MANAGER', at, version: 1, editorialChecked: true, rightsChecked: true, route: PRINT_ROUTE_ID });
  s = reduce(s, { type: 'DECIDE_PRINT_PROOF', actor: 'CHAIRMAN', at, version: 1, acknowledged: true, outcome: 'release' });
  return reduce(s, { type: 'RECORD_PRINT_DISPATCH', actor: 'PUBLISHING_MANAGER', at, version: 1 });
}
const ack = { type: 'ACKNOWLEDGE_PRINT_PROOF', actor: 'PUBLISHING_MANAGER', at, version: 1, reference: 'SYNTHETIC-SUPPLIER-v1' } as const;
const start = { type: 'START_PRINT', actor: 'PUBLISHING_MANAGER', at, version: 1 } as const;
const complete = { type: 'COMPLETE_PRINT', actor: 'PUBLISHING_MANAGER', at, version: 1, reference: 'SYNTHETIC-QC-01' } as const;
const correct = { type: 'REQUEST_PRINT_CORRECTION', actor: 'COORDINATOR', at, version: 1, reason: 'Correct title', stopReference: 'SYNTHETIC-STOP-01' } as const;
test('supplier source is attributed separately and invalid receipt metadata cannot acknowledge', () => {
  const s = released();
  assert.equal(reduce(s, { ...ack, evidence: { source: 'Email', sender: ' ', receivedAt: at } }), s);
  assert.equal(reduce(s, { ...ack, evidence: { source: 'Email', sender: 'Supplier', receivedAt: '2099-01-01' } }), s);
  const evidence = { source: 'WhatsApp' as const, sender: 'Synthetic supplier', receivedAt: at };
  const recorded = reduce(s, { ...ack, evidence });
  evidence.sender = 'Changed input';
  assert.equal(recorded.supplierAck?.evidence?.sender, 'Synthetic supplier');
  assert.equal(recorded.supplierAck?.actor, 'PUBLISHING_MANAGER');
});
test('release → acknowledgment → printing → completion requires ordered, version-bound evidence', () => {
  let s = released();
  for (const a of [start, complete, { ...ack, version: 2 }, { ...ack, actor: 'ARTIST' as const }, { ...ack, reference: ' ' }]) assert.equal(reduce(s, a), s);
  s = reduce(s, ack);
  assert.equal(reduce(s, ack), s);
  assert.equal(selectPublishingRecord(s).stage, 'acknowledged');
  s = reduce(s, start);
  assert.equal(reduce(s, start), s);
  assert.equal(selectPublishingRecord(s).stage, 'printing');
  assert.equal(reduce(s, { ...complete, reference: '' }), s);
  s = reduce(s, complete);
  assert.equal(selectPublishingRecord(s).stage, 'completed');
  assert.equal(reduce(s, complete), s);
});
test('correction preserves old production and requires new approval and supplier evidence', () => {
  const old = reduce(reduce(released(), ack), start);
  assert.equal(reduce(old, attach), old);
  assert.equal(reduce(old, { ...correct, stopReference: '' }), old);
  const held = reduce(old, correct);
  assert.equal(reduce(held, complete), held);
  const next = reduce(held, attach);
  assert.equal(next.version, 2);
  assert.equal(next.decision, null);
  assert.equal(next.supplierAck, null);
  assert.equal(next.production, null);
  assert.equal(next.previous[0].production?.version, 1);
  assert.equal(next.previous[0].correction?.reason, 'Correct title');
  for (const a of [ack, start, complete, { ...ack, version: 2 }, { ...start, version: 2 }]) assert.equal(reduce(next, a), next);
});
test('post-completion defects preserve completion; wrong roles cannot open corrections', () => {
  const finished = reduce(reduce(reduce(released(), ack), start), complete);
  assert.equal(reduce(finished, { ...correct, actor: 'ARTIST' }), finished);
  const revised = reduce(reduce(finished, correct), attach);
  assert.equal(revised.previous[0].production?.completionReference, 'SYNTHETIC-QC-01');
  assert.equal(finished.correction, null);
});
