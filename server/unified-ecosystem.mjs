import { requireRecordAccess } from './acquisition.mjs';
import { validateConservation, conservationWarnings, normalizedPin, budgetGauge } from '../src/logistics/museumCare.mjs';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { hashUploadStream } from './file-integrity.mjs';
import { extractKeywords } from '../src/curation/keywords.mjs';
import { validateLayout, isDimension } from '../src/spatial/geometry.mjs';
import { arrivalPolicy, checkArrivalLocation } from '../src/logistics/geofence.mjs';
import { renderLabelBatch, validateLabelContent } from './gallery-labels.mjs';
import { ReviewError } from './review-store.mjs';

const hash = v => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const reject = (status, message) => { throw new ReviewError(status, message); };
const text = v => typeof v === 'string' && v.trim().length > 0 && v.length <= 10000;
const pair = v => v && text(v.en) && text(v.ar);
const bilingual = v => ['en','ar'].map(lang => ({ '@language': lang, '@value': v[lang] }));
export const emptyEcosystem = () => ({ format: 1, version: 0, artworks: [], revisions: [], dictionary: [], walls: [], placements: [], requests: [], twins: [], labels: [], decisions: [] });

/** Local single-process transactional adapter; production must use database transactions/row locks. */
export async function openEcosystemRepository(file, seed = emptyEcosystem()) {
  await mkdir(dirname(file), { recursive: true });
  let state; try { state = JSON.parse(await readFile(file, 'utf8')); } catch(e) { if (e.code !== 'ENOENT') throw e; state = structuredClone(seed); }
  if (state.format !== 1) throw new Error('Unsupported unified store format.');
  let queue = Promise.resolve();
  return {
    read: () => structuredClone(state),
    transaction(work) {
      const result = queue.then(async () => { const next = structuredClone(state); const output = await work(next); next.version++; const temp = `${file}.${randomUUID()}.tmp`; await writeFile(temp, JSON.stringify(next), { mode: 0o600 }); await rename(temp, file); state = next; return structuredClone(output); });
      queue = result.catch(() => {}); return result;
    },
  };
}
function scoped(state, actor, artworkId, roles) {
  const artwork = state.artworks.find(a => a.id === artworkId);
  if (!actor || !artwork || actor.exhibitionId !== artwork.exhibitionId || !roles.includes(actor.role) || (actor.role === 'Artist' && artwork.artistActorId !== actor.id)) reject(403, 'Actor is not assigned to this artwork action.');
  requireRecordAccess(actor,artwork);
  return artwork;
}
function revisionFor(state, artwork, expected) {
  if (artwork.acquisition) reject(409, 'Acquisition freezes the approved revision.');
  if (artwork.lifecycleStatus === 'ARCHIVED_CLOSED') reject(409, 'Archived dossiers are read-only.');
  const revision = state.revisions.find(r => r.id === artwork.currentRevisionId);
  if (!revision || revision.versionHash !== expected) reject(409, 'Artwork revision changed. Reload the dossier.');
  return revision;
}
function decision(state, actor, revision, action) { state.decisions.push({ id: randomUUID(), actorId: actor.id, targetId: revision.artworkId, versionHash: revision.versionHash, action, at: new Date().toISOString() }); }

/** Actor is supplied by authentication middleware, never by request body. */
export function createEcosystemControllers({ repository, storage, dockPolicy = arrivalPolicy(), endpointOrigin }) {
  const origin = new URL(endpointOrigin);
  if (origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/' || !(origin.protocol === 'https:' || origin.protocol === 'http:' && ['localhost','127.0.0.1'].includes(origin.hostname))) throw new Error('Use a trusted HTTPS origin or local development origin.');
  return {
    async submitArtwork(actor, command, mediaStream) {
      const initial = repository.read(); const existing = scoped(initial, actor, command.artworkId, ['Artist']);
      if(existing.acquisition) reject(409, 'Acquisition freezes the approved revision.');
      if (existing.lifecycleStatus === 'ARCHIVED_CLOSED') reject(409, 'Archived dossiers are read-only.');
      if ((existing.currentRevisionId ?? null) !== command.expectedRevisionId) reject(409, 'Revision changed before upload.');
      if (!text(command.concept_text) || !pair(command.title) || !pair(command.artistName) || !isDimension(command.width_cm) || !isDimension(command.height_cm)) reject(422, 'Bilingual name/title, concept and exact dimensions are required.');
      const conservation = command.conservation_reqs == null ? null : validateConservation(command.conservation_reqs);
      const requirements = command.technicalRequirements ?? [];
      if (!Array.isArray(requirements) || requirements.length > 100 || requirements.some(r => !text(r.item) || r.item.length > 150 || !Number.isSafeInteger(r.quantity) || r.quantity < 1 || typeof r.external !== 'boolean')) reject(422, 'Invalid technical requirements.');
      const staged = await storage.openStaging({ actorId: actor.id, artworkId: existing.id });
      const integrity = await hashUploadStream(mediaStream, staged.stream);
      return repository.transaction(state => {
        const artwork = scoped(state, actor, command.artworkId, ['Artist']);
        if (artwork.acquisition) reject(409, 'Acquisition freezes the approved revision.');
        if (artwork.lifecycleStatus === 'ARCHIVED_CLOSED') reject(409, 'Archived dossiers are read-only.');
        if ((artwork.currentRevisionId ?? null) !== command.expectedRevisionId) reject(409, 'Revision changed during upload. Staging object retained for reconciliation.');
        const tags = extractKeywords(command.concept_text);
        const revision = { id: randomUUID(), artworkId: artwork.id, sequence: state.revisions.filter(r => r.artworkId === artwork.id).length + 1, state: 'EDITORIAL_DRAFT', conservation_reqs: conservation, artistName: { en: command.artistName.en, ar: command.artistName.ar }, title: { en: command.title.en, ar: command.title.ar }, concept_text: command.concept_text, width_cm: command.width_cm, height_cm: command.height_cm, year: command.year, media: { objectId: staged.objectId, ...integrity }, curatorial_tags: tags,
          Arabic_Terms: tags.flatMap(term => { const entry = state.dictionary.filter(d => d.exhibitionId === artwork.exhibitionId && d.english.toLowerCase() === term && d.approvedBy && d.approvedAt).sort((a,b) => b.version - a.version)[0]; return entry ? [{ term, arabic: entry.arabic, dictionaryId: entry.id, dictionaryVersion: entry.version, status: 'SUGGESTED' }] : []; }),
          technicalRequirements: requirements.map(r => ({ id: randomUUID(), item: r.item, quantity: r.quantity, external: r.external })), approvals: {},
        };
        revision.versionHash = hash(revision);
        state.requests.filter(r => r.artworkId === artwork.id && r.state !== 'ALLOCATED').forEach(r => r.state = 'SUPERSEDED');
        state.placements = state.placements.filter(p => p.artworkId !== artwork.id);
        artwork.currentRevisionId = revision.id; state.revisions.push(revision); decision(state, actor, revision, 'SUBMITTED');
        return revision;
      });
    },
    approveEditorial(actor, command) {
      return repository.transaction(state => {
        const artwork = scoped(state, actor, command.artworkId, ['Editorial']); const revision = revisionFor(state, artwork, command.versionHash);
        if (revision.state !== 'EDITORIAL_DRAFT' || !pair(command.description)) reject(409, 'An editable editorial draft and verified bilingual description are required.');
        revision.description = { en: command.description.en, ar: command.description.ar }; revision.versionHash = hash({ previous: revision.versionHash, description: revision.description });
        revision.approvals.editorial = { actorId: actor.id, hash: revision.versionHash }; revision.state = 'EXECUTIVE_REVIEW';
        decision(state, actor, revision, 'BILINGUAL_TEXT_VERIFIED'); return revision;
      });
    },
    placeArtwork(actor, command) {
      return repository.transaction(state => {
        const artwork = scoped(state, actor, command.artworkId, ['General_Exhibition_Coordinator']); const revision = revisionFor(state, artwork, command.versionHash);
        if (revision.state === 'PUBLISHED') reject(409, 'Published layout is frozen. Submit a new revision.');
        const wall = state.walls.find(w => w.id === command.wallId && w.exhibitionId === artwork.exhibitionId);
        if (!wall) reject(403, 'Wall is outside this exhibition.');
        const placement = { artworkId: artwork.id, revisionId: revision.id, wallId: wall.id, artwork_id: artwork.id, x_cm: command.x_cm, y_cm: command.y_cm };
        const neighbours = state.placements.filter(p => p.wallId === wall.id && p.artworkId !== artwork.id);
        const placements = [...neighbours, placement];
        const works = placements.map(p => { const r = state.revisions.find(r => r.id === p.revisionId); return { id: p.artworkId, title: r.title.en, width_cm: r.width_cm, height_cm: r.height_cm }; });
        const issues = validateLayout(wall, works, placements); if (issues.length) reject(409, issues.map(i => i.message).join(' '));
        state.placements = [...state.placements.filter(p => p.artworkId !== artwork.id), placement];
        delete revision.approvals.venue;
        for (const requirement of revision.technicalRequirements.filter(r => r.external)) {
          if (!state.requests.some(r => r.requirementId === requirement.id)) state.requests.push({ id: randomUUID(), artworkId: artwork.id, revisionId: revision.id, requirementId: requirement.id, item: requirement.item, quantity: requirement.quantity, state: 'QUEUED_PAUSED', deadline: new Date(Date.now() + 48 * 3600000).toISOString(), dispatchedAt: null });
        }
        decision(state, actor, revision, 'PLACED'); return { placement, allocationRequests: state.requests.filter(r => r.revisionId === revision.id) };
      });
    },
    readyForDirector(actor, command) {
      return repository.transaction(state => {
        const artwork = scoped(state, actor, command.artworkId, ['General_Exhibition_Coordinator']); const revision = revisionFor(state, artwork, command.versionHash);
        if (revision.state !== 'EXECUTIVE_REVIEW' || revision.approvals.editorial?.hash !== revision.versionHash) reject(409, 'Editorial verification is required.');
        revision.approvals.coordinator = { actorId: actor.id, hash: revision.versionHash }; decision(state, actor, revision, 'READY_FOR_DIRECTOR'); return revision;
      });
    },
    receiveCrate(actor, command) {
      return repository.transaction(state => {
        const artwork = scoped(state, actor, command.artworkId, ['General_Exhibition_Coordinator', 'Logistics']); const revision = revisionFor(state, artwork, command.versionHash);
        const check = checkArrivalLocation({ ...dockPolicy, required: true }, command.location); if (!check.allowed) reject(409, check.reason);
        if (artwork.physicalStatus === 'On_Site_Sharjah') return { physicalStatus: artwork.physicalStatus };
        if (!['Pending_Shipment','In_Transit','Customs_Clearance'].includes(artwork.physicalStatus)) reject(409, 'Arrival would regress or skip an unsupported physical state.');
        artwork.physicalStatus = 'On_Site_Sharjah'; decision(state, actor, revision, 'ARRIVAL_RECORDED'); return { physicalStatus: artwork.physicalStatus };
      });
    },
    publish(actor, command) {
      return repository.transaction(state => {
        const artwork = scoped(state, actor, command.artworkId, ['Director']); const revision = revisionFor(state, artwork, command.versionHash);
        const existing = state.twins.find(t => t.revisionId === revision.id); if (existing) return { twin: existing, label: state.labels.find(l => l.twinId === existing.id) };
        const placement = state.placements.find(p => p.revisionId === revision.id);
        if (revision.state !== 'EXECUTIVE_REVIEW' || revision.approvals.editorial?.hash !== revision.versionHash || revision.approvals.coordinator?.hash !== revision.versionHash || !pair(revision.description) || !placement) reject(409, 'Current bilingual verification, Coordinator review and a valid placement are required.');
        const content = { title: revision.title.en, label: { artistName: revision.artistName.en, width_cm: revision.width_cm, height_cm: revision.height_cm, year: revision.year } }; validateLabelContent(content);
        if (revision.conservation_reqs && revision.approvals.venue?.hash !== revision.versionHash) reject(409, 'Museum Operations conservation clearance is required.');
        const id = randomUUID(), uri = `${origin.origin}/api/review/ecosystem/twins/${id}`;
        const document = { '@context': { '@vocab': 'https://schema.org/', sadu: 'urn:sadu:' }, '@type': 'VisualArtwork', '@id': uri, name: bilingual(revision.title), creator: { '@type': 'Person', name: bilingual(revision.artistName) }, description: bilingual(revision.description), keywords: revision.curatorial_tags, 'sadu:fileHash': revision.media.file_hash, 'sadu:hashAlgorithm': 'SHA-256', 'sadu:spatialLayout': { 'sadu:x_cm': placement.x_cm, 'sadu:y_cm': placement.y_cm, 'sadu:width_cm': revision.width_cm, 'sadu:height_cm': revision.height_cm } };
        const twin = { id, artworkId: artwork.id, revisionId: revision.id, uri, document, payloadHash: hash(document) };
        const bytes = renderLabelBatch([{ id, revision: revision.sequence, artistName: content.label.artistName, title: content.title, width_cm: revision.width_cm, height_cm: revision.height_cm, year: revision.year, qrUrl: uri, status: 'Test_Ready', templateVersion: 1, qrCaption: 'Private digital twin' }]);
        const label = { id: randomUUID(), twinId: id, pdfBase64: bytes.toString('base64'), file_hash: createHash('sha256').update(bytes).digest('hex') };
        state.twins.push(twin); state.labels.push(label); revision.state = 'PUBLISHED'; decision(state, actor, revision, 'PUBLISHED');
        return { twin, label };
      });
    },
    clearVenue(actor, command) {
      return repository.transaction(state => {
        const artwork = scoped(state, actor, command.artworkId, ['Museum_Operations']); const revision = revisionFor(state, artwork, command.versionHash);
        const placement = state.placements.find(p => p.revisionId === revision.id);
        const wall = state.walls.find(w => w.id === placement?.wallId);
        if (revision.state === 'PUBLISHED') reject(409, 'Published record is frozen.');
        const warnings = conservationWarnings(revision.conservation_reqs, wall?.climateCapability);
        if (warnings.length) reject(409, warnings.join(' '));
        revision.approvals.venue = { actorId: actor.id, hash: revision.versionHash, wallId: wall.id }; decision(state, actor, revision, 'VENUE_CLEARANCE'); return revision.approvals.venue;
      });
    },
    async recordCondition(actor, command, photoStream) {
      const before = repository.read(); const artwork = scoped(before, actor, command.artworkId, ['Logistics','General_Exhibition_Coordinator']);
      const revision = revisionFor(before, artwork, command.versionHash);
      const point = normalizedPin(command.x_pct, command.y_pct);
      if (!text(command.description) || command.description.length > 2000) reject(422, 'Describe this observation.');
      const staged = await storage.openStaging({ actorId: actor.id, artworkId: artwork.id });
      const integrity = await hashUploadStream(photoStream, staged.stream, { maxBytes: 20 * 1024 * 1024 });
      return repository.transaction(state => {
        const currentArtwork = scoped(state, actor, artwork.id, ['Logistics','General_Exhibition_Coordinator']); revisionFor(state, currentArtwork, command.versionHash);
        const pin = { id: randomUUID(), artworkId: artwork.id, revisionId: revision.id, referenceImageHash: revision.media.file_hash, ...point, description: command.description.trim(), photo: { objectId: staged.objectId, ...integrity }, actorId: actor.id, at: new Date().toISOString() };
        (state.conditionPins ??= []).push(pin); decision(state, actor, revision, 'CONDITION_OBSERVATION'); return pin;
      });
    },
    museumView(actor, artworkId) {
      const state = repository.read(); const artwork = scoped(state, actor, artworkId, ['Artist','Logistics','Museum_Operations','General_Exhibition_Coordinator','Director']);
      const revision = state.revisions.find(r => r.id === artwork.currentRevisionId);
      if (!revision) reject(404, 'No current artwork revision.');
      const placement = state.placements.find(p => p.revisionId === revision.id);
      const wall = state.walls.find(w => w.id === placement?.wallId);
      return { artworkId, versionHash: revision.versionHash, conservation_reqs: revision.conservation_reqs, climateCapability: wall?.climateCapability ?? null, referenceImageHash: revision.media.file_hash, pins: (state.conditionPins ?? []).filter(p => p.revisionId === revision.id).map(p => ({ id:p.id, x_pct:p.x_pct, y_pct:p.y_pct, description:p.description, photoHash:p.photo.file_hash })) };
    },
    setParticipation(actor, command) {
      return repository.transaction(state => {
        const artwork = scoped(state, actor, command.artworkId, ['General_Exhibition_Coordinator']);
        const revision = revisionFor(state, artwork, command.versionHash);
        if (!['WITHDRAWN','REJECTED'].includes(command.status)) reject(422, 'Use the approved participation workflow for active states.');
        artwork.lifecycleStatus = command.status; decision(state, actor, revision, 'PARTICIPATION_UPDATED'); return { lifecycleStatus: artwork.lifecycleStatus };
      });
    },
    releaseBudget(actor, command) {
      return repository.transaction(state => {
        const artwork = scoped(state, actor, command.artworkId, ['Finance']); const revision = revisionFor(state, artwork, command.versionHash);
        const line = state.budgetRows?.find(r => r.id === command.lineId && r.artworkId === artwork.id && r.exhibitionId === artwork.exhibitionId);
        if (!line || !['WITHDRAWN','REJECTED'].includes(artwork.lifecycleStatus) || !Number.isSafeInteger(command.releaseMinor) || command.releaseMinor < 0 || command.releaseMinor > line.amount-line.paid || command.expectedReleased !== line.released) reject(409, 'Reconcile current outstanding commitments before releasing funds.');
        line.released = command.releaseMinor; decision(state, actor, revision, 'BUDGET_RELEASE_RECONCILED'); return { released: line.released };
      });
    },
    budget(actor) {
      if (!actor || !['General_Exhibition_Coordinator','Director','Finance'].includes(actor.role)) reject(403, 'Budget access is restricted.');
      const state = repository.read(); const exhibition = state.budgets?.find(b => b.exhibitionId === actor.exhibitionId);
      if (!exhibition) reject(409, 'No verified exhibition budget has been configured.');
      return budgetGauge(exhibition.ceiling, (state.budgetRows ?? []).filter(r => r.exhibitionId === actor.exhibitionId).filter(r=>{try{requireRecordAccess(actor,state.artworks.find(a=>a.id===r.artworkId)??{});return true;}catch{return false;}}).map(r => ({ ...r, status: state.artworks.find(a => a.id === r.artworkId)?.lifecycleStatus ?? 'UNCONFIRMED' })));
    },
    getTwin(actor, id) { const state = repository.read(); const twin = state.twins.find(t => t.id === id); if (!twin) reject(404, 'Unknown digital twin.'); scoped(state, actor, twin.artworkId, ['Director','General_Exhibition_Coordinator','Editorial','Artist']); return structuredClone(twin.document); },
  };
}
