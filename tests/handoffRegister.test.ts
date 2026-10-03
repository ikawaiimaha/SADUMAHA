import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_REGISTER_BYTES, parseHandoffRegister, handoffPhase, handoffsForPhase } from '../src/data/handoffRegister';
import { createCollectionDemo, collectionTransition } from '../src/data/collectionReadiness';

const text = { en: 'Synthetic reference', ar: 'مرجع تجريبي' };
function fixture() {
  return structuredClone({ schemaVersion: 1, mode: 'LOCAL_REFERENCE_ONLY', id: 'synthetic-register', revision: 1, caseName: 'Synthetic case', preparedAt: '2026-10-03T12:00:00Z',
    sources: [{ id: 'S1', kind: 'MAILBOX_SUMMARY', title: 'Synthetic summary', localPath: 'C:/synthetic/source.txt', sha256: 'a'.repeat(64), limitation: text }],
    entries: [{ id: 'H01', title: text, affectedWorks: ['Synthetic sculpture'], sourceRefs: [{ sourceId: 'S1', locator: 'lines 1–2', subject: 'Synthetic task', excerpt: 'A contact was named, but acceptance is not recorded.' }], requestedAction: text, owner: { role: text, assignment: text }, conditions: [text], acknowledgment: { status: 'NOT_ESTABLISHED', detail: text }, unresolvedEvidence: [text], demoPhase: 'handoff', demoBoundary: text }],
  });
}

test('parses a source-linked register without promoting reported communications to decisions', () => {
  const record = parseHandoffRegister(JSON.stringify(fixture()));
  assert.equal(record.entries[0].sourceRefs[0].sourceId, record.sources[0].id);
  assert.equal(record.entries[0].acknowledgment.status, 'NOT_ESTABLISHED');
  assert.ok(record.entries[0].unresolvedEvidence.length);
});

test('rejects broken references, duplicate identities and unsupported authority claims', () => {
  const mutations = [
    (v: any) => { v.entries[0].sourceRefs[0].sourceId = 'unknown'; },
    (v: any) => { v.entries.push(v.entries[0]); },
    (v: any) => { v.sources.push(v.sources[0]); },
    (v: any) => { v.entries[0].acknowledgment.status = 'APPROVED'; },
    (v: any) => { v.mode = 'LIVE'; },
    (v: any) => { v.entries[0].demoPhase = 'payment'; },
    (v: any) => { v.entries[0].unresolvedEvidence = []; },
    (v: any) => { v.entries[0].owner.assignment.ar = ''; },
    (v: any) => { v.sources[0].sha256 = 'not-a-digest'; },
    (v: any) => { v.preparedAt = 'yesterday'; },
  ];
  for (const mutate of mutations) {
    const input = fixture(); mutate(input);
    assert.throws(() => parseHandoffRegister(JSON.stringify(input)));
  }
});

test('bounds malformed and oversized local files', () => {
  for (const input of ['', 'null', '[]', '{broken', ' '.repeat(MAX_REGISTER_BYTES + 1)]) {
    assert.throws(() => parseHandoffRegister(input));
  }
  const large = fixture(); large.entries[0].sourceRefs[0].excerpt = 'x'.repeat(6001);
  assert.throws(() => parseHandoffRegister(JSON.stringify(large)));
});

test('drops imported operational fields rather than applying them', () => {
  const input: any = fixture();
  input.workflow = { stage: 'ready', paymentAuthorized: true };
  input.entries[0].approval = { confirmed: true };
  const record = parseHandoffRegister(JSON.stringify(input));
  assert.equal('workflow' in record, false);
  assert.equal('approval' in record.entries[0], false);
  assert.equal(record.entries[0].acknowledgment.status, 'NOT_ESTABLISHED');
});

test('register follows the current demo step while reset and transitions preserve source claims', () => {
  const input = fixture();
  input.entries.push({ ...input.entries[0], id: 'H02', demoPhase: 'pickup' });
  const register = parseHandoffRegister(JSON.stringify(input));
  const before = JSON.stringify(register);
  let demo = createCollectionDemo();
  assert.deepEqual(handoffsForPhase(register, handoffPhase(demo.stage)).map(x => x.id), ['H01']);
  const send = (type: 'ABSENT' | 'ASSIGN' | 'ACCEPT', actor: string, value?: string) => {
    demo = collectionTransition(demo, { type, actor, value, reason: 'Synthetic coverage', version: demo.version, at: '2026-10-03T12:00:00Z' });
  };
  send('ABSENT', 'Coordinator'); send('ASSIGN', 'Coordinator', 'Logistics B'); send('ACCEPT', 'Logistics B');
  assert.deepEqual(handoffsForPhase(register, handoffPhase(demo.stage)).map(x => x.id), ['H02']);
  assert.equal(JSON.stringify(register), before);
  demo = createCollectionDemo();
  assert.equal(demo.stage, 'confirmed');
  assert.equal(register.entries[0].acknowledgment.status, 'NOT_ESTABLISHED');
  for (const stage of ['packing', 'technical-review', 'cost-review', 'pack-evidence', 'ready'] as const) assert.equal(handoffPhase(stage), 'packing');
  assert.deepEqual(handoffsForPhase(register, 'print'), []);
});
