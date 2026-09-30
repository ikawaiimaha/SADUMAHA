import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ACCOUNTS, openReviewStore, initialReview } from '../server/review-store.mjs';
import { createRehearsalApp } from '../server/rehearsal-server.mjs';
const [artist, coordinator, director] = ACCOUNTS;
const content = { title: 'Fictional bronze', concept: 'Architecture and bronze', label: { artistName: 'Fictional Artist', width_cm: 80, height_cm: 120, year: 2026 } };
async function fixture() { const file = join(await mkdtemp(join(tmpdir(), 'sadu-governance-')), 'review.json'); return { file, store: await openReviewStore(file) }; }
const save = (store, data = content) => { const r = store.read(artist); return store.act(artist, { version: r.version, revision: r.currentRevision, action: 'save', content: data }); };
async function approve(store, domain, entityId) {
  const r = store.read(coordinator); const e = r.governance.entities.find(e => e.id === (entityId ?? r.governance.artworkId));
  return store.governance(coordinator, { action: 'record_clearance', version: r.version, entityId: e.id, expectedHash: e.currentRevisionHash, domain, purpose: 'FICTIONAL_SPECIALIST_REVIEW' });
}
test('UUID and append-only hash revisions survive save/reopen; no-op content does not duplicate', async () => {
  const { file, store } = await fixture(); await save(store);
  const before = await store.entity(artist, store.read(artist).governance.artworkId);
  await save(store, { ...content, title: 'Second title' }); await save(store, { ...content, title: 'Second title' });
  const reopened = await openReviewStore(file); const after = reopened.entity(artist, before.entity.id);
  assert.match(before.entity.id, /^[0-9a-f-]{36}$/); assert.equal(after.entity.id, before.entity.id);
  assert.equal(after.revisions.length, before.revisions.length + 1);
  assert.deepEqual(after.revisions.slice(0, -1), before.revisions);
  assert.equal(after.revisions.at(-1).parentHash, before.entity.currentRevisionHash);
  assert.notEqual(after.entity.currentRevisionHash, before.entity.currentRevisionHash);
});
test('dimensions invalidate Technical and Logistics; concept-only edits retain them; reapproval resolves impacts', async () => {
  const { store } = await fixture(); await save(store); await approve(store, 'Technical'); await approve(store, 'Logistics');
  await save(store, { ...content, concept: 'New concept' });
  assert.equal(store.read(coordinator).governance.approvals.filter(a => a.status === 'APPROVED').length, 2);
  await save(store, { ...content, label: { ...content.label, width_cm: 100 } });
  let g = store.read(coordinator).governance;
  assert.deepEqual(g.approvals.map(a => a.status), ['STALE', 'STALE']);
  assert.ok(g.impacts.some(i => i.domain === 'Technical' && i.status === 'STALE'));
  await approve(store, 'Technical'); g = store.read(coordinator).governance;
  assert.ok(g.impacts.filter(i => i.domain === 'Technical').every(i => i.status === 'RESOLVED'));
  assert.equal(g.approvals.find(a => a.domain === 'Logistics').status, 'STALE');
});
test('audit stores operational codes only; spoofed metadata and free-text reason are rejected', async () => {
  const { store } = await fixture(); await save(store, { ...content, concept: 'Do not copy private@example.test into the decision log' });
  const record = store.read(coordinator);
  assert.ok(!JSON.stringify(record.governance.decisions).includes('private@example.test'));
  assert.ok(record.governance.decisions.every(d => Object.keys(d).sort().join(',') === 'actionType,actorId,at,id,purpose,sourceType,targetEntityId,versionHash'));
  await assert.rejects(store.governance(coordinator, { version: record.version, action: 'record_clearance', note: 'passport payload' }), e => e.status === 409);
  await assert.rejects(store.governance(artist, { version: record.version, action: 'record_clearance' }), e => e.status === 403);
  assert.equal(store.read(director).governance, undefined);
});
test('contracts reference stable artwork and maintain immutable versions with Finance invalidation', async () => {
  const { store } = await fixture(); const r = store.read(coordinator);
  const terms = { artworkId: r.governance.artworkId, scope: 'Fictional loan', amount: 45000, currency: 'AED', termsVersion: 'demo-v1' };
  let g = await store.governance(coordinator, { action: 'create_contract', version: r.version, purpose: 'CONTRACT_UPDATE', content: terms });
  const contract = g.entities.find(e => e.kind === 'Contract'); await approve(store, 'Finance', contract.id);
  g = await store.governance(coordinator, { action: 'revise_contract', version: store.read(coordinator).version, entityId: contract.id, expectedHash: contract.currentRevisionHash, purpose: 'CONTRACT_UPDATE', content: { ...terms, amount: 46000 } });
  assert.equal(g.approvals.find(a => a.domain === 'Finance').status, 'STALE');
  assert.equal(store.entity(coordinator, contract.id).revisions[0].content.amount, 45000);
  await assert.rejects(store.governance(coordinator, { action: 'revise_contract', version: g.version, entityId: contract.id, expectedHash: contract.currentRevisionHash, purpose: 'CONTRACT_UPDATE', content: terms }), e => e.status === 409);
});
test('legacy migration is idempotent and records baseline capture rather than invented approval', async () => {
  const { file } = await fixture(); const legacy = initialReview(); await writeFile(file, JSON.stringify(legacy));
  const first = await openReviewStore(file); const id = first.read(coordinator).governance.artworkId;
  const second = await openReviewStore(file); assert.equal(second.read(coordinator).governance.artworkId, id);
  assert.equal(second.read(coordinator).governance.approvals.length, 0);
  assert.equal(second.read(coordinator).governance.decisions[0].actorId, 'system-local-migration');
  assert.deepEqual(JSON.parse(await readFile(file, 'utf8')).revisions, legacy.revisions);
});
test('shared write queue prevents competing contract writes from accepting the same version', async () => {
  const { store } = await fixture(); const r = store.read(coordinator);
  const cmd = { action: 'create_contract', version: r.version, purpose: 'CONTRACT_UPDATE', content: { artworkId: r.governance.artworkId, scope: 'Loan', amount: 1, currency: 'AED', termsVersion: 'demo' } };
  const result = await Promise.allSettled([store.governance(coordinator, cmd), store.governance(coordinator, cmd)]);
  assert.equal(result.filter(r => r.status === 'fulfilled').length, 1);
});
test('governance HTTP requires session, rejects cross-origin and Director draft access', async t => {
  const { file } = await fixture(); const app = await createRehearsalApp({ file });
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r)); t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(`${base}/api/review/governance`)).status, 401);
  const login = await fetch(`${base}/api/review/session`, { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: director.id }) });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  assert.equal((await fetch(`${base}/api/review/governance`, { headers: { Cookie: cookie } })).status, 403);
  assert.equal((await fetch(`${base}/api/review/governance`, { method: 'POST', headers: { Cookie: cookie, Origin: 'https://example.test', 'Content-Type': 'application/json' }, body: '{}' })).status, 403);
  const coordLogin = await fetch(`${base}/api/review/session`, { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: coordinator.id }) });
  const coordCookie = coordLogin.headers.get('set-cookie').split(';')[0];
  const graph = await (await fetch(`${base}/api/review/governance`, { headers: { Cookie: coordCookie } })).json();
  const created = await fetch(`${base}/api/review/governance`, { method: 'POST', headers: { Cookie: coordCookie, Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create_contract', version: graph.version, purpose: 'CONTRACT_UPDATE', content: { artworkId: graph.artworkId, scope: 'Fictional loan', amount: 10, currency: 'AED', termsVersion: 'demo' } }) });
  assert.equal(created.status, 200);
  const contract = (await created.json()).entities.find(e => e.kind === 'Contract');
  const detail = await fetch(`${base}/api/review/entities/${contract.id}`, { headers: { Cookie: coordCookie } });
  assert.equal(detail.status, 200); assert.equal((await detail.json()).revisions.length, 1);

});

test('portal submission logs authenticated actor and source automatically, rejecting failed actions without a log', async () => {
  const { store } = await fixture(); await save(store);
  const r = store.read(artist);
  const command = { action: 'submit', version: r.version, revision: r.currentRevision, sourceType: 'WhatsApp', actorId: 'forged' };
  const submitted = await store.act(artist, command);
  const log = submitted.governance.decisions.at(-1);
  assert.equal(log.actionType, 'SUBMITTED'); assert.equal(log.sourceType, 'SADU_Portal'); assert.equal(log.actorId, artist.id);
  await assert.rejects(store.act(artist, command));
  assert.equal(store.read(artist).governance.decisions.length, submitted.governance.decisions.length);
});
import { ingestCommunication } from '../server/communication-ingestion.mjs';
test('ingestion is disabled by default, resolves trusted dossier bindings and deduplicates without copying messages', async () => {
  const rows = []; const raw = { text: 'private message', attachment: 'sensitive bytes' };
  await assert.rejects(ingestCommunication(rows, raw, null, () => null), e => e.status === 503);
  const verified = { channel: 'WHATSAPP', providerAccountId: 'fixture-account', bindingId: 'binding', eventId: 'fixture-event', evidenceRef: 'c84bf77f-8c54-4d61-a852-83c30b3ceaf9' };
  const adapter = { mode: 'local-test', verify: async () => verified };
  await assert.rejects(ingestCommunication(rows, raw, adapter, () => null), e => e.status === 422);
  const resolve = () => ({ channel: 'WHATSAPP', providerAccountId: 'fixture-account', targetEntityId: 'dossier-fixture', exhibitionId: 'demo-exhibition' });
  const first = await ingestCommunication(rows, raw, adapter, resolve);
  assert.equal((await ingestCommunication(rows, raw, adapter, resolve)).id, first.id); assert.equal(rows.length, 1);
  assert.equal(first.status, 'RECEIVED_UNREVIEWED'); assert.ok(!JSON.stringify(rows).includes('private message')); assert.ok(!JSON.stringify(rows).includes('sensitive bytes'));
  await assert.rejects(ingestCommunication(rows, raw, adapter, () => ({ ...resolve(), targetEntityId: 'other' })), e => e.status === 409);
});
