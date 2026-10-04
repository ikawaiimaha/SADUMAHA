import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublishingRecord, reducePublishingRecord as reduce, selectPublishingRecord, validPublishingRecord, canReplacePrintProof, PRINT_ROUTE_ID } from '../src/data/publishingRecord';
import { createLivingRecord, livingRecordReducer, validLivingRecord } from '../src/data/livingRecord';
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
  assert.ok(reduce(old, { ...correct, stopReference: '' }).correction);
  const held = reduce(old, correct);
  assert.equal(reduce(held, complete), held);
  assert.equal(reduce(held, attach), held);
  const stopped = reduce(held, { type: 'CONFIRM_PRINT_STOP', actor: 'PUBLISHING_MANAGER', at, version: 1, reference: 'SYNTHETIC-STOP-01' });
  const next = reduce(stopped, attach);
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
  const held = reduce(finished, correct);
  const stopped = reduce(held, { type: 'CONFIRM_PRINT_STOP', actor: 'PUBLISHING_MANAGER', at, version: 1, reference: 'SYNTHETIC-DISPOSITION-01' });
  const revised = reduce(stopped, attach);
  assert.equal(revised.previous[0].production?.completionReference, 'SYNTHETIC-QC-01');
  assert.equal(finished.correction, null);
});

test('all print stages and preserved revisions resume without clearing correction holds', () => {
  let s = createPublishingRecord();
  const check = () => {
    const saved = JSON.parse(JSON.stringify(s));
    assert.equal(validPublishingRecord(saved), true, selectPublishingRecord(s).stage);
    assert.equal(validLivingRecord({ ...createLivingRecord(), publishing: saved }), true);
    assert.deepEqual(selectPublishingRecord(saved), selectPublishingRecord(s));
  };
  check();
  for (const action of [attach,
    { type: 'ROUTE_PRINT_PROOF', actor: 'PUBLISHING_MANAGER', at, version: 1, editorialChecked: true, rightsChecked: true, route: PRINT_ROUTE_ID },
    { type: 'DECIDE_PRINT_PROOF', actor: 'CHAIRMAN', at, version: 1, outcome: 'release', acknowledged: true },
    { type: 'RECORD_PRINT_DISPATCH', actor: 'PUBLISHING_MANAGER', at, version: 1 }, ack, start, complete, correct,
  ] as const) { s = reduce(s, action); check(); }
  assert.equal(canReplacePrintProof(s), false);
  s = JSON.parse(JSON.stringify(s));
  assert.equal(reduce(s, attach), s, 'refresh cannot clear an unconfirmed supplier stop');
  s = reduce(s, { type: 'CONFIRM_PRINT_STOP', actor: 'PUBLISHING_MANAGER', at, version: 1, reference: 'STOP-01' }); check();
  assert.equal(canReplacePrintProof(s), true);
  s = reduce(s, attach); check();
  assert.equal(s.supplierAck, null);
  assert.equal(s.previous[0].production?.completionReference, 'SYNTHETIC-QC-01');
});

test('restoration cannot manufacture print approval, supplier acknowledgment or a stopped press', () => {
  const base = reduce(reduce(reduce(released(), ack), start), correct);
  for (const damage of [
    (s: any) => { s.review = null; },
    (s: any) => { s.review.route = 'unapproved-route'; },
    (s: any) => { s.decision.outcome = 'return'; },
    (s: any) => { s.decision.actor = 'COORDINATOR'; },
    (s: any) => { s.dispatch.version = 2; },
    (s: any) => { s.supplierAck.version = 0; },
    (s: any) => { s.supplierAck.reference = ''; },
    (s: any) => { s.supplierAck.evidence = { source: 'Email', sender: 'Demo', receivedAt: '2099-01-01' }; },
    (s: any) => { s.production.at = 'bad'; },
    (s: any) => { s.production.completionReference = 'Missing completion time'; },
    (s: any) => { s.correction.stopReference = 'Missing actor and time'; },
    (s: any) => { s.proofs[0] = null; },
    (s: any) => { s.previous = [null]; },
  ]) {
    const bad = structuredClone(base); damage(bad);
    assert.equal(validPublishingRecord(bad), false);
    assert.equal(validLivingRecord({ ...createLivingRecord(), publishing: bad }), false);
  }
  const stopped = reduce(base, { type: 'CONFIRM_PRINT_STOP', actor: 'PUBLISHING_MANAGER', at, version: 1, reference: 'STOP-01' });
  const next = reduce(stopped, attach);
  next.previous[0].correction!.stopReference = '';
  assert.equal(validPublishingRecord(next), false, 'new proof cannot hide an unresolved supplier hold in its predecessor');
  assert.equal(validLivingRecord({ ...createLivingRecord(), events: [null] }), false);
});

test('shared context validation preserves the independent custody and Finance demonstration', () => {
  let s = createLivingRecord();
  for (const action of [
    { type: 'RECEIVE', actor: 'LOGISTICS', crateId: s.caseId, sealMatches: false, at },
    { type: 'RECEIVE', actor: 'LOGISTICS', crateId: s.caseId, sealMatches: true, at },
    { type: 'CONDITION', actor: 'TECHNICAL', outcome: 'issue', at },
    { type: 'CONDITION', actor: 'TECHNICAL', outcome: 'clear', at },
    { type: 'ACCEPT', actor: 'MANAGER', reportVersion: 2, acknowledged: true, at },
    { type: 'SUBMIT_FINANCE', actor: 'FINANCE', at },
    { type: 'ESCALATE_FINANCE', actor: 'MANAGER', at },
  ] as const) {
    s = livingRecordReducer(s, action);
    assert.equal(validLivingRecord(JSON.parse(JSON.stringify(s))), true, action.type);
  }
  assert.equal(s.publishing.version, 0);
});
