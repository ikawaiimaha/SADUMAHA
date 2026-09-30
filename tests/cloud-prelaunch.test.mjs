import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloudPrelaunch } from '../server/cloud-prelaunch.mjs';

const password = 'fictional-test-password-with-high-entropy';
const origin = 'https://sadu.example';
const next = ({ headers }) => new Response('protected', { headers });
const req = (path = '/', options = {}) => new Request(origin + path, options);
const unlock = (value = password, other = {}) => req('/api/prelaunch/unlock', { method: 'POST', headers: { origin, 'content-type': 'application/json', ...other }, body: JSON.stringify({ password: value }) });

test('cloud gate denies all anonymous paths and forged cookies', async () => {
  const gate = createCloudPrelaunch({ password });
  for (const path of ['/', '/review', '/assets/app.js', '/api/review/session']) {
    const res = await gate(req(path, { headers: { accept: 'text/html', cookie: '__Host-sadu_preview=true', 'x-middleware-subrequest': 'middleware:middleware:middleware:middleware:middleware' } }), next);
    assert.equal(res.status, 401);
    const body = await res.text(); assert.ok(!body.includes(password)); assert.ok(!body.includes('protected'));
  }
});

test('cloud sessions work across instances, reject tampering and expire', async () => {
  let time = 1800000000000;
  const gate = createCloudPrelaunch({ password, now: () => time });
  const unlocked = await gate(unlock(), next);
  assert.equal(unlocked.status, 200);
  const header = unlocked.headers.get('set-cookie');
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/']) assert.ok(header.includes(flag));
  const cookie = header.split(';')[0];
  const fresh = createCloudPrelaunch({ password, now: () => time });
  assert.equal(await (await fresh(req('/', { headers: { cookie } }), next)).text(), 'protected');
  assert.deepEqual(await (await fresh(req('/api/prelaunch/session', { headers: { cookie } }), next)).json(), { verified: true });
  assert.equal((await fresh(req('/', { headers: { cookie: cookie.slice(0, -1) + 'z' } }), next)).status, 401);
  assert.equal((await createCloudPrelaunch({ password: password + 'rotated', now: () => time })(req('/', { headers: { cookie } }), next)).status, 401);
  time += 8 * 3600000;
  assert.equal((await fresh(req('/', { headers: { cookie } }), next)).status, 401);
});

test('cloud login fails closed, validates origin, limits bodies and throttles guesses', async () => {
  assert.equal((await createCloudPrelaunch()(unlock(), next)).status, 503);
  const gate = createCloudPrelaunch({ password });
  assert.equal((await gate(unlock(password, { origin: 'https://other.example' }), next)).status, 403);
  assert.equal((await gate(unlock('x'.repeat(2048)), next)).status, 413);
  for (let i = 0; i < 4; i++) assert.equal((await gate(unlock('wrong'), next)).status, 401);
  assert.equal((await gate(unlock(), next)).status, 429);
});

test('cloud logout clears the host-only cookie and APIs never cache authentication', async () => {
  const gate = createCloudPrelaunch({ password });
  const res = await gate(req('/api/prelaunch/lock', { method: 'POST', headers: { origin } }), next);
  assert.equal(res.status, 200); assert.match(res.headers.get('set-cookie'), /Max-Age=0/);
  assert.match(res.headers.get('cache-control'), /no-store/);
  assert.equal((await gate(req('/api/prelaunch/unlock'), next)).status, 405);
});
