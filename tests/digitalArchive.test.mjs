import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { archiveBlockers, culturalSnapshot, openDigitalArchive } from '../server/digital-archive.mjs';
import { createRehearsalApp } from '../server/rehearsal-server.mjs';
const director = { id: 'director', role: 'Director', exhibitionId: 'demo-exhibition' };
const source = () => ({ exhibitionId: 'demo-exhibition', approvedImageOrigins: ['https://images.example.org'], artworks: [{ id: 'art-1', revision: 'hash-1', physical_status: 'RETURN_FREIGHT_CLEARED', culturalApproved: true, artistName: { en: 'Sample artist', ar: 'فنان' }, title: { en: 'Sample artwork', ar: 'عمل' }, description: { en: 'Cultural description', ar: 'وصف' }, images: [{ url: 'https://images.example.org/art-1.jpg', highResolution: true, approvedForArchive: true, passport: 'SECRET' }], tags: ['calligraphy'], layout: { x_cm: 10, y_cm: 20, width_cm: 100, height_cm: 80, ticket: 'SECRET' }, iban: 'SECRET', logistics: { contact: 'SECRET' } }] });
test('archive allowlist excludes nested operational data and uses language-tagged VisualArtwork', () => {
  const output = culturalSnapshot(source());
  assert.equal(output.hasPart[0]['@type'], 'VisualArtwork');
  assert.equal(output.hasPart[0].name[1]['@language'], 'ar');
  assert.doesNotMatch(JSON.stringify(output), /SECRET|passport|iban|logistics|ticket/);
});
test('empty rosters, one pending return, signed URLs and incomplete metadata block archiving', () => {
  assert.ok(archiveBlockers({ artworks: [] }).length);
  for (const mutate of [a => a.physical_status = 'Installed', a => a.images[0].url += '?token=SECRET', a => a.artistName.ar = '', a => a.culturalApproved = false]) {
    const s = source(); mutate(s.artworks[0]); assert.throws(() => culturalSnapshot(s), { status: 409 });
  }
});
test('Director scope, stale source, idempotence, immutable export and durable reopen', async () => {
  const file = join(await mkdtemp(join(tmpdir(), 'sadu-archive-')), 'archive.json'); let input = source();
  const store = await openDigitalArchive(file, () => input);
  assert.throws(() => store.read(director), { status: 404 });
  const version = store.status(director).version;
  await assert.rejects(store.archive({ ...director, role: 'Artist' }, version), { status: 403 });
  await assert.rejects(store.archive({ ...director, exhibitionId: 'other' }, version), { status: 403 });
  input.artworks[0].revision = 'hash-2';
  await assert.rejects(store.archive(director, version), { status: 409 });
  const results = await Promise.all([store.archive(director, store.status(director).version), store.archive(director, store.status(director).version)]);
  assert.equal(results[0].hash, results[1].hash);
  input.artworks[0].title.en = 'Later change';
  assert.equal(store.read(director).hasPart[0].name[0]['@value'], 'Sample artwork');
  assert.deepEqual((await openDigitalArchive(file, () => input)).read(director), store.read(director));
});
test('HTTP archive routes require session, Director authority and same-origin writes', async () => {
  const app = await createRehearsalApp({ file: join(await mkdtemp(join(tmpdir(), 'sadu-archive-http-')), 'review.json'), prelaunchGate: (_req, _res, next) => next() });
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const request = (path, cookie = '', body, suppliedOrigin = origin) => fetch(origin + path, { method: body ? 'POST' : 'GET', headers: { Cookie: cookie, Origin: suppliedOrigin, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  try {
    assert.equal((await request('/api/v1/archive/biennial-2026')).status, 403);
    const login = await request('/api/review/session', '', { accountId: 'demo-director' });
    assert.match(login.headers.get('set-cookie'), /Path=\/api;/);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const status = await (await request('/api/review/archive/status', cookie)).json();
    assert.equal(status.eligible, false); assert.ok(status.blockers.length);
    assert.equal((await request('/api/review/archive', cookie, { version: status.version })).status, 409);
    assert.equal((await request('/api/review/archive', cookie, { version: status.version }, 'https://outside.example')).status, 403);
    assert.equal((await request('/api/v1/archive/biennial-2026', cookie)).status, 404);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
