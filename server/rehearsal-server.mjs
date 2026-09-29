import express from 'express';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { ACCOUNTS, ReviewError, openReviewStore } from './review-store.mjs';
import { openSpatialStore } from './spatial-store.mjs';

export async function createRehearsalApp({ file, staticRoot, spatialFile } = {}) {
  const store = await openReviewStore(file ?? fileURLToPath(new URL('../.local/rehearsal-review.json', import.meta.url)));
  const spatial = await openSpatialStore(spatialFile ?? (file ? `${file}.spatial.json` : fileURLToPath(new URL('../.local/rehearsal-spatial.json', import.meta.url))));
  const app = express(); const sessions = new Map();
  app.disable('x-powered-by');
  app.use('/api/review', (req, res, next) => {
    const host = req.get('host') ?? '';
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host)) return res.status(403).json({ error: 'Local rehearsal access only.' });
    res.set('Cache-Control', 'no-store');
    if (req.method !== 'GET' && req.get('origin') !== `http://${host}`) return res.status(403).json({ error: 'Same-origin requests are required.' });
    next();
  });
  app.use(express.json({ limit: '24kb' }));
  const actorFor = req => {
    const token = (req.headers.cookie ?? '').split(';').map(v => v.trim()).find(v => v.startsWith('sadu_review='))?.slice(12);
    const session = sessions.get(token);
    if (!session || session.expires < Date.now()) { if (token) sessions.delete(token); return null; }
    return ACCOUNTS.find(a => a.id === session.accountId) ?? null;
  };
  app.get('/api/review/session', (req, res) => res.json({ actor: actorFor(req), accounts: ACCOUNTS, mode: 'fictional-local' }));
  app.post('/api/review/session', (req, res) => {
    const account = ACCOUNTS.find(a => a.id === req.body?.accountId);
    if (!account) return res.status(403).json({ error: 'Unknown fictional account. HIP is not an available role.' });
    // Explicit demo account selection, not identity verification or production sign-in.
    for (const [token, session] of sessions) if (session.expires < Date.now()) sessions.delete(token);
    if (sessions.size >= 100) return res.status(429).json({ error: 'Too many local sessions. Restart the local server to reset sessions.' });
    const token = randomUUID(); sessions.set(token, { accountId: account.id, expires: Date.now() + 8 * 3600000 });
    res.cookie('sadu_review', token, { httpOnly: true, sameSite: 'strict', path: '/api/review', maxAge: 8 * 3600000 });
    res.json({ actor: account });
  });
  app.use('/api/review', (req, res, next) => {
    const actor = actorFor(req);
    if (!actor) return res.status(401).json({ error: 'Choose a fictional account to continue.' });
    res.locals.actor = actor; next();
  });
  app.get('/api/review/record', (req, res) => res.json(store.read(res.locals.actor)));
  app.get('/api/review/spatial', (req, res) => res.json(spatial.read(res.locals.actor)));
  app.post('/api/review/spatial', async (req, res, next) => {
    try { res.json(await spatial.act(res.locals.actor, req.body)); } catch (error) { next(error); }
  });
  app.post('/api/review/action', async (req, res, next) => {
    try { res.json(await store.act(res.locals.actor, req.body)); } catch (error) { next(error); }
  });
  app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown endpoint.' }));
  const root = staticRoot ?? fileURLToPath(new URL('../dist-rehearsal', import.meta.url));
  app.use(express.static(root));
  app.get('*', (req, res) => res.sendFile(resolve(root, 'index.html')));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    res.status(error instanceof ReviewError ? error.status : error.status === 400 || error.status === 413 ? error.status : 500)
      .json({ error: error instanceof ReviewError ? error.message : 'The local request could not be saved. Retry or check the server.' });
  });
  return app;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const app = await createRehearsalApp();
  const server = app.listen(3013, '127.0.0.1', () => console.log('Fictional SADU review: http://127.0.0.1:3013/review — external delivery paused.'));
  server.on('error', error => { console.error(`Unable to start local review server: ${error.code}`); process.exitCode = 1; });
}
