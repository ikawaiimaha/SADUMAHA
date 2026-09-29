import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ACCOUNTS, openReviewStore } from '../server/review-store.mjs';
import { canonicalProfileUrl, dynamicTestProfileUrl, generateLabelArtifact, renderLabelBatch } from '../server/gallery-labels.mjs';
import { createRehearsalApp } from '../server/rehearsal-server.mjs';
const [artist, coordinator, director] = ACCOUNTS;
const content = { title: 'Kufic Horizon', concept: 'A fictional bronze artwork.', label: { artistName: 'Noura Al Mazrouei', height_cm: 120, width_cm: 80, year: 2026 } };
async function prepare(options) {
  const file = join(await mkdtemp(join(tmpdir(), 'sadu-label-test-')), 'review.json');
  const store = await openReviewStore(file, options);
  const command = async (actor, action, extra = {}) => { const view = store.read(actor); return store.act(actor, { version: view.version, revision: view.revisions.at(-1).number, action, ...extra }); };
  await command(artist, 'save', { content }); await command(artist, 'submit'); await command(coordinator, 'ready', { note: 'Fictional label details checked.' });
  return { store, file, command };
}
test('profile URLs are allowlisted and dynamic test URLs use a safe unique artist identifier', () => {
  assert.equal(dynamicTestProfileUrl('noura-12345'), 'https://sdc.gov.ae/en/biennial2026/artist/noura-12345');
  assert.equal(dynamicTestProfileUrl('artist-2', 'https://www.sdc.gov.ae/profiles'), 'https://www.sdc.gov.ae/profiles/artist-2');
  for (const url of ['http://sdc.gov.ae/a', 'https://sdc.gov.ae.evil.test/a', 'https://evil.test/a', 'https://user:pass@sdc.gov.ae/a', 'https://sdc.gov.ae/', 'https://sdc.gov.ae/a?redirect=x', 'https://sdc.gov.ae/a#x']) assert.throws(() => canonicalProfileUrl(url));
  for (const id of ['../admin', 'a/b', 'a?token=x', '']) assert.throws(() => dynamicTestProfileUrl(id));
});
test('PDFs distinguish unverified drafts, test-ready QR and attributed verified profiles', async () => {
  const input = { artistId: 'demo-artist', revision: 1, approvalId: 'approval-one', content };
  const draft = await generateLabelArtifact(input);
  assert.equal(draft.status, 'Draft_No_QR'); assert.equal(draft.qrUrl, null);
  const sample = await generateLabelArtifact({ ...input, labelOptions: { testMode: true } });
  assert.equal(sample.status, 'Test_Ready'); assert.match(sample.qrUrl, /\/demo-artist$/);
  assert.equal(Buffer.from(sample.pdfBase64, 'base64').subarray(0, 5).toString(), '%PDF-');
  assert.equal(sample.sha256.length, 64);
  const url = 'https://sdc.gov.ae/__test__/profile'; // Unit-test fixture, never claimed live or fetched.
  const verified = await generateLabelArtifact({ ...input, content: { ...content, label: { ...content.label, profileUrl: url } }, profileVerification: { url, actorRole: coordinator.role, note: 'Unit-test verification fixture.' } });
  assert.equal(verified.status, 'Ready'); assert.equal(verified.qrUrl, url);
  assert.ok(renderLabelBatch([sample.snapshot, verified.snapshot]).length > 1000);
});
test('missing metadata and unsupported glyphs fail instead of printing invented or garbled captions', async () => {
  for (const label of [{ ...content.label, year: 0 }, { ...content.label, width_cm: undefined }, { ...content.label, artistName: '\u0646\u0648\u0631\u0629' }]) await assert.rejects(generateLabelArtifact({ artistId: 'demo', revision: 1, approvalId: 'a', content: { ...content, label } }));
});
test('Director approval generates and stores one immutable PDF atomically and survives reopening', async () => {
  const { store, file, command } = await prepare({ labelOptions: { testMode: true } });
  assert.equal(store.read(coordinator).labels.length, 0);
  const state = store.read(director);
  const publish = { action: 'publish', version: state.version, revision: 1, note: 'Approved sample.' };
  const results = await Promise.allSettled([store.act(director, publish), store.act(director, publish)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  const label = store.read(coordinator).labels[0];
  assert.equal(label.status, 'Test_Ready'); assert.ok(!('pdfBase64' in label));
  const before = store.label(coordinator, label.id);
  const reopened = await openReviewStore(file, { labelOptions: { testMode: true } });
  assert.deepEqual(reopened.label(coordinator, label.id), before);
  assert.ok(reopened.batch(coordinator).length > 1000);
  assert.throws(() => store.label(artist, label.id), e => e.status === 403);
  assert.throws(() => store.batch(director), e => e.status === 403);
  await command(coordinator, 'amend', { note: 'Correct the label title.' });
  assert.throws(() => store.batch(coordinator), e => e.status === 409);
  assert.deepEqual(store.label(coordinator, label.id), before);
  assert.equal(store.read(coordinator).labels[0].current, false);
});
test('a generator failure rolls back both approval and publication; draft QR cannot enter a verified batch', async () => {
  const failed = await prepare({ labelGenerator: async () => { throw new Error('Simulated PDF failure'); } });
  const before = failed.store.read(director);
  await assert.rejects(failed.command(director, 'publish', { note: 'Try approval' }), /approval was not saved/);
  assert.deepEqual(failed.store.read(director), before);
  const normal = await prepare(); await normal.command(director, 'publish', { note: 'Approve draft label' });
  assert.equal(normal.store.read(coordinator).labels[0].status, 'Draft_No_QR');
  assert.throws(() => normal.store.batch(coordinator), e => e.status === 409);
});
test('profile verification is Coordinator-only, exact-URL-bound and does not carry into amendments', async () => {
  const file = join(await mkdtemp(join(tmpdir(), 'sadu-label-profile-')), 'state.json');
  const store = await openReviewStore(file);
  const action = (actor, name, extra = {}) => { const view = store.read(actor); return store.act(actor, { action: name, version: view.version, revision: view.revisions.at(-1).number, ...extra }); };
  await action(artist, 'save', { content: { ...content, label: { ...content.label, profileUrl: 'https://sdc.gov.ae/__test__/profile' } } });
  await action(artist, 'submit');
  await assert.rejects(action(artist, 'verify_profile', { note: 'Self-verify' }), e => e.status === 403);
  await action(coordinator, 'verify_profile', { note: 'Synthetic test verification only.' });
  await action(coordinator, 'ready', { note: 'Ready' }); await action(director, 'publish', { note: 'Approved' });
  assert.equal(store.read(coordinator).labels[0].status, 'Ready');
  await action(coordinator, 'amend', { note: 'New label version' });
  assert.equal(store.read(artist).revisions.at(-1).profileVerification, undefined);
});
test('PDF download endpoints require Coordinator session and return a single batch document', async t => {
  const { file, command } = await prepare({ labelOptions: { testMode: true } });
  await command(director, 'publish', { note: 'Approve for test batch' });
  const app = await createRehearsalApp({ file, staticRoot: join(file, '..'), labelOptions: { testMode: true } });
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const login = async id => (await fetch(`${origin}/api/review/session`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: id }) })).headers.get('set-cookie').split(';')[0];
  const download = cookie => fetch(`${origin}/api/review/labels/batch.pdf`, { headers: cookie ? { Cookie: cookie } : {} });
  assert.equal((await download()).status, 401);
  assert.equal((await download(await login(artist.id))).status, 403);
  const response = await download(await login(coordinator.id));
  assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), 'application/pdf');
  assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0, 5).toString(), '%PDF-');
});
