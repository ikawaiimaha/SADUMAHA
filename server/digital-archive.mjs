import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ReviewError } from './review-store.mjs';

export const EXHIBITION_STATES = Object.freeze(['ACTIVE', 'ARCHIVED_DIGITAL_TWIN']);
const fail = (status, message) => { throw new ReviewError(status, message); };
const text = v => typeof v === 'string' && v.trim().length > 0 && v.length <= 10000;
const bilingual = v => v && text(v.en) && text(v.ar);
const literal = v => ['en', 'ar'].map(language => ({ '@value': v[language].trim(), '@language': language }));
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function authorize(actor, exhibitionId, write = false) {
  if (!actor || actor.exhibitionId !== exhibitionId || !(write ? ['Director'] : ['Director', 'General_Exhibition_Coordinator']).includes(actor.role)) fail(403, 'Archive access requires an assigned exhibition account. Only the Director may archive.');
}
export function archiveBlockers(source) {
  const blockers = [];
  if (!Array.isArray(source.artworks) || !source.artworks.length) return ['The exhibition artwork roster is empty.'];
  if (new Set(source.artworks.map(a => a.id)).size !== source.artworks.length) blockers.push('Artwork identifiers must be unique.');
  for (const a of source.artworks) {
    if (!text(a.id) || !text(a.revision)) blockers.push('Stable artwork identifiers and revisions are required.');
    if (a.physical_status !== 'RETURN_FREIGHT_CLEARED') blockers.push('Every artwork requires confirmed return-freight clearance.');
    if (!a.culturalApproved || !bilingual(a.artistName) || !bilingual(a.title) || !bilingual(a.description)) blockers.push('Approved bilingual cultural metadata is incomplete.');
    if (!Array.isArray(a.images) || !a.images.length || a.images.some(i => {
      try { const u = new URL(i.url); return i.approvedForArchive !== true || i.highResolution !== true || u.protocol !== 'https:' || u.username || u.password || u.search || u.hash || !source.approvedImageOrigins?.includes(u.origin); } catch { return true; }
    })) blockers.push('Archive-approved high-resolution image URLs on approved origins are required; signed URLs are not accepted.');
    if (!Array.isArray(a.tags) || a.tags.some(t => !text(t) || t.length > 100)) blockers.push('Curatorial tags are invalid.');
    if (!a.layout || !['x_cm', 'y_cm', 'width_cm', 'height_cm'].every(k => Number.isFinite(a.layout[k]) && a.layout[k] >= 0) || a.layout.width_cm === 0 || a.layout.height_cm === 0) blockers.push('Validated spatial coordinates are required.');
  }
  return [...new Set(blockers)];
}
export function culturalSnapshot(source) {
  const blockers = archiveBlockers(source); if (blockers.length) fail(409, blockers.join(' '));
  // Construct from an allowlist. Never serialize operational records or nested payloads.
  return { '@context': { '@vocab': 'https://schema.org/', sadu: 'urn:sadu:archive:' }, '@id': `urn:sadu:exhibition:${encodeURIComponent(source.exhibitionId)}`, '@type': 'Collection', hasPart: source.artworks.map(a => ({
    '@id': `urn:sadu:artwork:${encodeURIComponent(a.id)}`, '@type': 'VisualArtwork', version: a.revision,
    creator: { '@type': 'Person', name: literal(a.artistName) }, name: literal(a.title), description: literal(a.description),
    image: a.images.map(i => i.url), keywords: a.tags.map(t => t.trim()),
    'sadu:spatialLayout': Object.fromEntries(['x_cm', 'y_cm', 'width_cm', 'height_cm'].map(k => [`sadu:${k}`, a.layout[k]])),
  })) };
}
export async function openDigitalArchive(file, sourceFor, exhibitionId = 'demo-exhibition') {
  await mkdir(dirname(file), { recursive: true });
  let saved = null;
  try { saved = JSON.parse(await readFile(file, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  if (saved && (saved.exhibitionId !== exhibitionId || saved.state !== 'ARCHIVED_DIGITAL_TWIN' || digest(saved.document) !== saved.hash)) throw new Error('Archive integrity check failed.');
  let queue = Promise.resolve();
  return {
    status(actor) { authorize(actor, exhibitionId); const source = sourceFor(); const blockers = saved ? [] : archiveBlockers(source); return { state: saved ? saved.state : 'ACTIVE', eligible: !saved && !blockers.length, blockers, version: digest(source), hash: saved?.hash ?? null }; },
    read(actor) { authorize(actor, exhibitionId); if (!saved) fail(404, 'No digital archive exists for this exhibition.'); return structuredClone(saved.document); },
    archive(actor, expectedVersion) {
      const operation = queue.then(async () => {
        authorize(actor, exhibitionId, true);
        if (saved) return { state: saved.state, hash: saved.hash }; // Idempotent; archived cultural snapshot is immutable.
        const source = sourceFor(); if (source.exhibitionId !== exhibitionId || expectedVersion !== digest(source)) fail(409, 'Exhibition data changed. Refresh before archiving.');
        const document = culturalSnapshot(source);
        const next = { format: 1, exhibitionId, state: 'ARCHIVED_DIGITAL_TWIN', hash: digest(document), document, decision: { actorId: actor.id, action: 'ARCHIVED_DIGITAL_TWIN', at: new Date().toISOString() } };
        const temp = `${file}.${randomUUID()}.tmp`; await writeFile(temp, JSON.stringify(next), { mode: 0o600 }); await rename(temp, file); saved = next;
        return { state: next.state, hash: next.hash };
      }); queue = operation.catch(() => {}); return operation;
    },
  };
}
