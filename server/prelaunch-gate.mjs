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
export const lockPage = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SADU — Restricted preview</title>
<style>body{margin:0;min-height:100svh;display:grid;place-items:center;background:#F7F1E6;color:#111817;font:16px/1.6 system-ui}main{width:min(360px,85vw);text-align:center}h1{letter-spacing:.2em}input,button{box-sizing:border-box;width:100%;padding:14px;font:inherit;margin-top:12px;border:1px solid #111817;border-radius:4px}button{background:#111817;color:#F7F1E6;cursor:pointer}label{display:block;text-align:start}#error{min-height:2em}small{display:block}</style>
<main><small>Sharjah Department of Culture</small><h1>SADU</h1><p>System under construction. Authorized personnel only.</p><form><label for="password">Password</label><input id="password" type="password" autocomplete="current-password" required maxlength="256"><button type="submit">Submit</button><p id="error" role="status" aria-live="polite"></p></form><small>Restricted fictional prototype</small></main>
<script>document.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const b=document.querySelector('button');b.disabled=true;try{const r=await fetch('/api/prelaunch/unlock',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:document.querySelector('input').value})});if(r.ok){location.reload();return}document.querySelector('#error').textContent=r.status===429?'Too many attempts. Try again later.':r.status===503?'Preview access is not configured.':'Unable to unlock. Check your password.'}catch{document.querySelector('#error').textContent='Unable to connect. Try again.'}document.querySelector('input').value='';b.disabled=false});</script></html>`;

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
