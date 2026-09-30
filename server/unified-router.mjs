import express from 'express';
import { twinAudioView } from './twin-audio-view.mjs';

/** Mount under /api/review/ecosystem after existing trusted session middleware.
 * Intake stream parsing/storage stays behind the host's authenticated upload adapter.
 * The router never accepts an actor, clearance or arbitrary mutation name from the body.
 */
export function unifiedRouter(controllers) {
  const router = express.Router();
  router.use((req, res, next) => {
    res.set({ 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
    if (!res.locals.actor) return res.status(401).json({ error: 'Sign in to continue.' });
    if (req.method !== 'GET' && req.get('origin') !== `${req.protocol}://${req.get('host')}`) return res.status(403).json({ error: 'Same-origin requests are required.' });
    next();
  });
  const run = method => async (req, res, next) => { try { res.json(await controllers[method](res.locals.actor, req.body)); } catch(e) { next(e); } };
  router.post('/submission', async (req, res, next) => {
    if (!req.fileStream) return res.status(415).json({ error: 'Configure an authenticated single-file multipart stream adapter before intake.' });
    try { res.json(await controllers.submitArtwork(res.locals.actor, req.body, req.fileStream)); } catch(e) { next(e); }
  });
  router.post('/social-actors', run('registerSocialActor'));
  router.post('/artist-heritage', run('recordArtistHeritage'));
  router.get('/assertion/:artworkId', (req,res,next) => { try { res.json(controllers.assertion(res.locals.actor, req.params.artworkId)); } catch(e) { next(e); } });
  router.post('/editorial', run('approveEditorial'));
  router.post('/placement', run('placeArtwork'));
  router.post('/ready', run('readyForDirector'));
  router.patch('/arrival', run('receiveCrate'));
  router.post('/publish', run('publish'));
  router.post('/venue-clearance', run('clearVenue'));
  router.post('/participation', run('setParticipation'));
  router.post('/budget-release', run('releaseBudget'));
  router.get('/museum/:artworkId', (req, res, next) => { try { res.json(controllers.museumView(res.locals.actor, req.params.artworkId)); } catch(e) { next(e); } });
  router.get('/budget', (req, res, next) => { try { res.json(controllers.budget(res.locals.actor)); } catch(e) { next(e); } });
  router.post('/condition', async (req, res, next) => {
    if (!req.fileStream) return res.status(415).json({ error: 'An authenticated photograph upload stream is required.' });
    try { res.json(await controllers.recordCondition(res.locals.actor, req.body, req.fileStream)); } catch(e) { next(e); }
  });
  router.get('/twins/:id', (req, res, next) => { try { const twin = controllers.getTwin(res.locals.actor, req.params.id); if (req.accepts(['html','application/ld+json']) === 'html') res.type('html').send(twinAudioView(twin)); else res.type('application/ld+json').send(JSON.stringify(twin)); } catch(e) { next(e); } });
  return router;
}
