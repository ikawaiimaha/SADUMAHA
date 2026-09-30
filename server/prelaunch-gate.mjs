import express from 'express';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function loadPrelaunchPassword() {
  if (process.env.SADU_PRELAUNCH_PASSWORD) return process.env.SADU_PRELAUNCH_PASSWORD;
  try { return readFileSync(fileURLToPath(new URL('../.local/prelaunch-password.txt', import.meta.url)), 'utf8').trim(); }
  catch { return ''; }
}
const hash = value => createHash('sha256').update(value).digest();
import { lockPage } from './prelaunch-page.mjs';
export { lockPage } from './prelaunch-page.mjs';

/** Protects documents, assets and APIs before any static file or operational middleware. */
export function createPrelaunchGate({ password = loadPrelaunchPassword(), now = Date.now, ttl = 8 * 3600000 } = {}) {
  const router = express.Router(); const sessions = new Map(); const attempts = new Map();
  const configured = typeof password === 'string' && password.length >= 20 && password.length <= 256;
  const expected = hash(configured ? password : randomBytes(32).toString('hex'));
  const token = req => (req.headers.cookie ?? '').split(';').map(s => s.trim()).find(s => s.startsWith('sadu_prelaunch='))?.slice(15);
  const authorized = req => { const t = token(req); const until = sessions.get(t); if (!until || until <= now()) { sessions.delete(t); return false; } return true; };
  router.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    if (req.path.startsWith('/api/prelaunch/') && req.method !== 'GET') {
      const origin = `${req.socket.encrypted ? 'https' : 'http'}://${req.headers.host}`;
      if (req.headers.origin !== origin) return res.status(403).json({ error: 'Same-origin requests required.' });
    }
    next();
  });
  router.get('/api/prelaunch/session', (req, res) => res.json({ verified: authorized(req) }));
  router.post('/api/prelaunch/unlock', express.json({ limit: '1kb' }), (req, res) => {
    if (!configured) return res.status(503).json({ error: 'Preview access is not configured.' });
    const key = req.socket.remoteAddress ?? 'local'; const time = now();
    for (const [k, row] of attempts) if (row.until <= time) attempts.delete(k);
    if (attempts.size >= 1000 && !attempts.has(key)) return res.status(429).json({ error: 'Try later.' });
    const attempt = attempts.get(key) ?? { count: 0, until: time + 15 * 60000 };
    if (attempt.count >= 5) return res.status(429).json({ error: 'Try later.' });
    attempt.count++; attempts.set(key, attempt);
    if (typeof req.body?.password !== 'string' || req.body.password.length > 256 || !timingSafeEqual(hash(req.body.password), expected)) return res.status(401).json({ error: 'Unable to unlock.' });
    for (const [t, until] of sessions) if (until <= time) sessions.delete(t);
    if (sessions.size >= 100) return res.status(429).json({ error: 'Session limit reached.' });
    attempts.delete(key); const t = randomBytes(32).toString('hex'); sessions.set(t, time + ttl);
    res.cookie('sadu_prelaunch', t, { httpOnly: true, sameSite: 'strict', secure: Boolean(req.socket.encrypted), path: '/' });
    res.json({ verified: true });
  });
  router.post('/api/prelaunch/lock', (req, res) => { sessions.delete(token(req)); res.clearCookie('sadu_prelaunch', { path: '/' }); res.json({ verified: false }); });
  router.use((req, res, next) => {
    if (authorized(req)) return next();
    if ((req.method === 'GET' || req.method === 'HEAD') && req.accepts('html') && !req.path.startsWith('/api/')) return res.status(401).type('html').send(lockPage);
    res.status(401).json({ error: 'Preview locked.' });
  });
  return router;
}

export function prelaunchVitePlugin() {
  return { name: 'sadu-prelaunch-gate', configureServer(server) { server.middlewares.use(express().use(createPrelaunchGate())); }, configurePreviewServer(server) { server.middlewares.use(express().use(createPrelaunchGate())); } };
}
