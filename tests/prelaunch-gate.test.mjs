import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createPrelaunchGate } from '../server/prelaunch-gate.mjs';

const password = 'test-fixture-password-not-a-real-secret';
async function fixture(t, options = {}) {
  const app = express().use(createPrelaunchGate({ password, ...options }));
  app.use((_req, res) => res.send('protected sentinel'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, value, cookie = '', origin = base) => fetch(base + path, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ password: value }) });
  return { base, post };
}
test('blocks deep links, assets and APIs; valid cookie unlocks, logout revokes', async t => {
  const { base, post } = await fixture(t);
  for (const path of ['/review', '/journey', '/assets/main.js', '/api/review/session']) {
    const res = await fetch(base + path, { headers: { Cookie: 'sadu_prelaunch=true' } });
    assert.equal(res.status, 401); const body = await res.text();
    assert.ok(!body.includes('protected sentinel')); assert.ok(!body.includes(password));
  }
  assert.equal((await post('/api/prelaunch/unlock', 'wrong')).status, 401);
  assert.equal((await post('/api/prelaunch/unlock', password, '', 'https://other.example')).status, 403);
  const res = await post('/api/prelaunch/unlock', password);
  assert.equal(res.status, 200);
  const header = res.headers.get('set-cookie'); assert.match(header, /HttpOnly/); assert.match(header, /SameSite=Strict/);
  const cookie = header.split(';')[0];
  assert.deepEqual(await (await fetch(base + '/api/prelaunch/session', { headers: { Cookie: cookie } })).json(), { verified: true });
  assert.equal(await (await fetch(base + '/api/review/session', { headers: { Cookie: cookie } })).text(), 'protected sentinel');
  await post('/api/prelaunch/lock', '', cookie);
  assert.equal((await fetch(base + '/review', { headers: { Cookie: cookie } })).status, 401);
});
test('fails closed without server configuration', async t => {
  const { base, post } = await fixture(t, { password: '' });
  assert.equal((await post('/api/prelaunch/unlock', password)).status, 503);
  assert.equal((await fetch(base + '/')).status, 401);
});
test('sessions expire and repeated guesses are throttled', async t => {
  let now = 1000;
  const { base, post } = await fixture(t, { now: () => now, ttl: 100 });
  const res = await post('/api/prelaunch/unlock', password);
  const cookie = res.headers.get('set-cookie').split(';')[0];
  now += 101;
  assert.equal((await fetch(base + '/', { headers: { Cookie: cookie } })).status, 401);
  for (let i = 0; i < 5; i++) assert.equal((await post('/api/prelaunch/unlock', 'bad')).status, 401);
  assert.equal((await post('/api/prelaunch/unlock', password)).status, 429);
});

test('rehearsal app installs the gate before operational routes and static files', async t => {
  const { mkdtemp, writeFile } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { createRehearsalApp } = await import('../server/rehearsal-server.mjs');
  const folder = await mkdtemp(join(tmpdir(), 'sadu-prelaunch-test-'));
  await writeFile(join(folder, 'private.js'), 'private asset sentinel');
  const app = await createRehearsalApp({ file: join(folder, 'review.json'), staticRoot: folder });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  for (const path of ['/review', '/private.js', '/api/review/session']) {
    const res = await fetch(`http://127.0.0.1:${server.address().port}${path}`);
    assert.equal(res.status, 401);
    assert.ok(!(await res.text()).includes('private asset sentinel'));
  }
});
