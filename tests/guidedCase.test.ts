import test from 'node:test';
import assert from 'node:assert/strict';
import { createGuidedSession, guidedCollection } from '../src/data/guidedPresentation';
import { collectionReceipt, pilotBriefHtml } from '../src/data/guidedCase';

const at = '2026-10-04T12:00:00Z';
function readyCase() {
  let c = createGuidedSession().collection;
  c = guidedCollection(c, 'ASSIGN', at);
  c = guidedCollection(c, 'ACCEPT', at);
  c = guidedCollection(c, 'DATE', at, '2026-10-16');
  c = guidedCollection(c, 'PREPARE_PACKING', at);
  return guidedCollection(c, 'COMPLETE_PACKING', at);
}
test('the receipt reflects actual recorded acceptance and completion, not the prepared plan', () => {
  let c = guidedCollection(createGuidedSession().collection, 'ASSIGN', at);
  assert.equal(collectionReceipt(c, false).acceptance, 'Acceptance pending');
  c = guidedCollection(c, 'ACCEPT', at);
  c = guidedCollection(c, 'DATE', at, '2026-10-16');
  c = guidedCollection(c, 'PREPARE_PACKING', at);
  assert.equal(collectionReceipt(c, false).recordedAt, null);
  assert.equal(collectionReceipt(c, false).status, 'Collection is not ready yet');
  c = guidedCollection(c, 'COMPLETE_PACKING', at);
  const r = collectionReceipt(c, false);
  assert.equal(r.date, '16 October 2026');
  assert.equal(r.recordedAt, at);
  assert.equal(r.recordedVersion, c.version);
  assert.equal(r.status, 'Ready for collection — transport not booked');
  assert.equal(collectionReceipt(c, true).status, 'جاهز للاستلام — النقل غير محجوز');
  assert.equal(c.owner, 'Logistics B', 'display aliases never replace role IDs');
});
test('the downloadable brief preserves evidence boundaries and escapes record content', () => {
  const c = readyCase();
  const before = JSON.stringify(c);
  for (const ar of [true, false]) {
    const html = pilotBriefHtml(c, ar);
    assert.ok(html.includes(`dir="${ar ? 'rtl' : 'ltr'}"`));
    assert.ok(html.includes(c.packing!.evidence));
    assert.ok(!html.includes('<script'));
    assert.ok(!html.includes('https://'));
  }
  assert.equal(JSON.stringify(c), before, 'export never authorizes a workflow action');
  const hostile = { ...c, packing: { ...c.packing!, evidence: '<img src=x onerror="alert(1)">' } };
  assert.ok(pilotBriefHtml(hostile, false).includes('&lt;img'));
  assert.ok(!pilotBriefHtml(hostile, false).includes('<img'));
});
