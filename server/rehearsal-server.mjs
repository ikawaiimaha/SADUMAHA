import { unifiedRouter } from './unified-router.mjs';
import { createPrelaunchGate } from './prelaunch-gate.mjs';
import { openDigitalArchive } from './digital-archive.mjs';
import { LocalAuthProvider } from '../src/governance/localAdapters.ts';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { ACCOUNTS, ReviewError, openReviewStore } from './review-store.mjs';
import { openLogisticsStore } from './logistics-store.mjs';
import { openSpatialStore } from './spatial-store.mjs';
import { DEFAULT_CMS_BASE_URL, dynamicTestProfileUrl } from './gallery-labels.mjs';

export async function createRehearsalApp({ ecosystemControllers, prelaunchGate = createPrelaunchGate(), file, staticRoot, spatialFile, authProvider = new LocalAuthProvider(ACCOUNTS), labelOptions = { testMode: process.env.SDC_LABEL_TEST_MODE !== 'false', baseUrl: process.env.SDC_CMS_BASE_URL || DEFAULT_CMS_BASE_URL } } = {}) {
  if (labelOptions.testMode) dynamicTestProfileUrl('configuration-check', labelOptions.baseUrl);
  const store = await openReviewStore(file ?? fileURLToPath(new URL('../.local/rehearsal-review.json', import.meta.url)), { labelOptions });
  const spatial = await openSpatialStore(spatialFile ?? (file ? `${file}.spatial.json` : fileURLToPath(new URL('../.local/rehearsal-spatial.json', import.meta.url))));
  const logistics = await openLogisticsStore(file ? `${file}.logistics.json` : fileURLToPath(new URL('../.local/rehearsal-logistics.json', import.meta.url)), actor => store.read(actor));
  const app = express();
  const archive = await openDigitalArchive(file ? `${file}.archive.json` : fileURLToPath(new URL('../.local/rehearsal-archive.json', import.meta.url)), () => {
    const coordinator = ACCOUNTS.find(a => a.role === 'General_Exhibition_Coordinator');
    const review = store.read(coordinator); const shipment = logistics.read(coordinator); const plan = spatial.read(coordinator);
    const revision = review.revisions.at(-1);
    // These modules do not yet share approved bilingual/image metadata. Fail closed rather than invent an archival record.
    const ids = [...new Set([review.governance?.artworkId, ...shipment.artwork_records.map(a => a.id), ...plan.artwork_records.map(a => a.id)].filter(Boolean))];
    return { exhibitionId: 'demo-exhibition', approvedImageOrigins: [], artworks: ids.map(id => ({ id, revision: String(revision?.number ?? ''), physical_status: shipment.artwork_records.find(a => a.id === id)?.physical_status ?? 'UNCONFIRMED', culturalApproved: false })) };
  });
  app.use(prelaunchGate);
  if (authProvider.mode !== 'fictional-local') throw new Error('External authentication remains paused.');
  app.disable('x-powered-by');
  app.use('/api/review', (req, res, next) => {
    const host = req.get('host') ?? '';
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host)) return res.status(403).json({ error: 'Local rehearsal access only.' });
    res.set('Cache-Control', 'no-store');
    if (req.method !== 'GET' && req.get('origin') !== `http://${host}`) return res.status(403).json({ error: 'Same-origin requests are required.' });
    next();
  });
  app.use(express.json({ limit: '24kb' }));
  const actorFor = async req => {
    const token = (req.headers.cookie ?? '').split(';').map(v => v.trim()).find(v => v.startsWith('sadu_review='))?.slice(12);
    return token ? authProvider.authenticate(token) : null;
  };
  app.get('/api/review/session', async (req, res, next) => {
    try { res.json({ actor: await actorFor(req), accounts: ACCOUNTS, mode: 'fictional-local' }); } catch (error) { next(error); }
  });
  app.post('/api/review/session', async (req, res, next) => {
    try {
      const account = ACCOUNTS.find(a => a.id === req.body?.accountId);
      if (!account) return res.status(403).json({ error: 'Unknown fictional account. HIP is not an available role.' });
      const token = await authProvider.selectAccount(account.id);
      res.cookie('sadu_review', token, { httpOnly: true, sameSite: 'strict', path: '/api', maxAge: 8 * 3600000 });
      res.json({ actor: account });
    } catch (error) { next(error); }
  });
  app.use('/api/review', async (req, res, next) => {
    try {
      const actor = await actorFor(req);
      if (!actor) return res.status(401).json({ error: 'Choose a fictional account to continue.' });
      res.locals.actor = actor; next();
    } catch (error) { next(error); }
  });
  if (ecosystemControllers) app.use('/api/review/ecosystem', unifiedRouter(ecosystemControllers));
  app.get('/api/review/logistics', (req, res) => res.json(logistics.read(res.locals.actor)));
  app.get('/api/review/archive/status', (req, res) => res.json(archive.status(res.locals.actor)));
  app.post('/api/review/archive', async (req, res, next) => {
    try { res.json(await archive.archive(res.locals.actor, req.body?.version)); } catch (error) { next(error); }
  });
  app.post('/api/review/logistics', async (req, res, next) => {
    try { res.json(await logistics.act(res.locals.actor, req.body)); } catch (error) { next(error); }
  });
  app.get('/api/review/logistics/:id/manifest.pdf', (req, res) => {
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="SADU-shipping-manifest.pdf"', 'X-Content-Type-Options': 'nosniff' }).send(logistics.manifest(res.locals.actor, req.params.id));
  });
  app.post('/api/review/ingestion/:channel', (req, res) => res.status(503).json({ error: 'External ingestion is paused. No message was stored.' }));
  app.get('/api/review/governance', (req, res) => {
    const record = store.read(res.locals.actor);
    if (!record.governance) return res.status(403).json({ error: 'Use the finalized executive review projection.' });
    res.json({ version: record.version, ...record.governance });
  });
  app.get('/api/review/entities/:id', (req, res) => res.json(store.entity(res.locals.actor, req.params.id)));
  app.post('/api/review/governance', async (req, res, next) => {
    try { res.json(await store.governance(res.locals.actor, req.body)); } catch (error) { next(error); }
  });
  app.get('/api/review/record', (req, res) => res.json(store.read(res.locals.actor)));
  app.get('/api/review/labels/batch.pdf', (req, res) => {
    const bytes = store.batch(res.locals.actor);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="SADU-approved-labels.pdf"', 'X-Content-Type-Options': 'nosniff' }).send(bytes);
  });
  app.get('/api/review/labels/:id.pdf', (req, res) => {
    const bytes = store.label(res.locals.actor, req.params.id);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="SADU-gallery-label.pdf"', 'X-Content-Type-Options': 'nosniff' }).send(bytes);
  });
  app.get('/api/review/spatial', (req, res) => res.json(spatial.read(res.locals.actor)));
  app.post('/api/review/spatial', async (req, res, next) => {
    try { res.json(await spatial.act(res.locals.actor, req.body)); } catch (error) { next(error); }
  });
  app.post('/api/review/action', async (req, res, next) => {
    try { res.json(await store.act(res.locals.actor, req.body)); } catch (error) { next(error); }
  });
  app.get('/api/v1/archive/biennial-2026', async (req, res, next) => {
    try { res.set({ 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }).type('application/ld+json').send(JSON.stringify(archive.read(await actorFor(req)))); } catch (error) { next(error); }
  });
  app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown endpoint.' }));
  const root = staticRoot ?? fileURLToPath(new URL('../dist-rehearsal', import.meta.url));
  app.use(express.static(root, { cacheControl: false }));
  app.get('*', (req, res) => res.sendFile(resolve(root, 'index.html')));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    res.status(error instanceof ReviewError || error.governance ? error.status : error.status === 400 || error.status === 413 || error.status === 429 ? error.status : 500)
      .json({ error: error instanceof ReviewError || error.governance ? error.message : 'The local request could not be saved. Retry or check the server.' });
  });
  return app;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const app = await createRehearsalApp();
  const server = app.listen(3013, '127.0.0.1', () => console.log('Fictional SADU review: http://127.0.0.1:3013/review — external delivery paused.'));
  server.on('error', error => { console.error(`Unable to start local review server: ${error.code}`); process.exitCode = 1; });
}
