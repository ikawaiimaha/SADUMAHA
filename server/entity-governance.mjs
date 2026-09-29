import { createHash, randomUUID } from 'node:crypto';

const fail = (status, message) => { throw Object.assign(new Error(message), { status, governance: true }); };
const canonical = value => JSON.stringify(value, (_, v) => v && !Array.isArray(v) && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
const digest = value => createHash('sha256').update(canonical(value)).digest('hex');
export const PURPOSES = Object.freeze(['BASELINE_CAPTURE', 'CONTENT_UPDATE', 'CONTRACT_UPDATE', 'CURATORIAL_REVIEW', 'PUBLICATION_REVIEW', 'REVISION_REQUEST', 'FICTIONAL_SPECIALIST_REVIEW']);
export const DEPENDENCIES = Object.freeze({
  Artwork: { Technical: ['dimensions'], Logistics: ['dimensions'], Editorial: ['title', 'concept', 'displayName'], Publication: ['title', 'concept', 'displayName', 'dimensions', 'year', 'profileUrl'] },
  Contract: { Finance: ['amount', 'currency', 'termsVersion', 'scope', 'artworkId'], Logistics: ['scope', 'artworkId'] },
});
const fields = { Artwork: ['title', 'concept', 'dimensions', 'displayName', 'year', 'profileUrl'], Contract: ['artworkId', 'scope', 'amount', 'currency', 'termsVersion'] };
const exact = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).every(k => keys.includes(k));
function validateContent(kind, content) {
  if (!fields[kind] || !exact(content, fields[kind])) fail(422, 'Unknown entity fields; sensitive document payloads are not accepted.');
  const str = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
  if (kind === 'Artwork') {
    if (!str(content.title, 200) || !str(content.concept, 10000)) fail(422, 'Artwork title and concept are required.');
    if (content.dimensions !== null && (!exact(content.dimensions, ['width_cm', 'height_cm']) || !['width_cm', 'height_cm'].every(k => Number.isFinite(content.dimensions[k]) && content.dimensions[k] > 0))) fail(422, 'Dimensions must be positive finite centimetres.');
    if (content.displayName !== null && !str(content.displayName, 120)) fail(422, 'Invalid display name.');
    if (content.year !== null && (!Number.isInteger(content.year) || content.year < 1000 || content.year > 9999)) fail(422, 'Invalid year.');
    if (typeof content.profileUrl !== 'string' || content.profileUrl.length > 256) fail(422, 'Invalid profile URL.');
  } else if (!str(content.scope, 2000) || !str(content.termsVersion, 80) || !/^[A-Z]{3}$/.test(content.currency) || !Number.isFinite(content.amount) || content.amount < 0) fail(422, 'Invalid fictional contract terms.');
  return structuredClone(content);
}
export const artworkContent = content => ({ title: content.title, concept: content.concept, dimensions: content.label ? { width_cm: content.label.width_cm, height_cm: content.label.height_cm } : null, displayName: content.label?.artistName ?? null, year: content.label?.year ?? null, profileUrl: content.label?.profileUrl ?? '' });
export const emptyGovernance = () => ({ format: 1, entities: [], revisions: [], decisions: [], approvals: [], impacts: [] });
export function decision(graph, actor, action, entity, hash, purpose, at) {
  if (!PURPOSES.includes(purpose) || !['CREATED', 'REVISED', 'APPROVED', 'REJECTED', 'REVIEW_REQUESTED'].includes(action)) fail(422, 'A controlled decision purpose and action are required.');
  // Explicit construction: never spread a command, actor profile, note or content into this log.
  if (!/^(demo-(artist|coordinator|director)|system-local-migration)$/.test(actor.id)) fail(403, 'Unknown fictional actor.');
  const row = { id: randomUUID(), actorId: actor.id, actionType: action, targetEntityId: entity.id, versionHash: hash, purpose, at };
  graph.decisions.push(row); return row;
}
export function reviseEntity(graph, entity, content, actor, purpose, at) {
  const snapshot = validateContent(entity.kind, content);
  if (entity.kind === 'Contract' && !graph.entities.some(e => e.id === snapshot.artworkId && e.kind === 'Artwork')) fail(422, 'Contract must reference an existing artwork UUID.');
  const previous = graph.revisions.find(r => r.entityId === entity.id && r.hash === entity.currentRevisionHash);
  const changedFields = fields[entity.kind].filter(k => canonical(previous?.content[k]) !== canonical(snapshot[k]));
  if (previous && !changedFields.length) return previous;
  const revision = { id: randomUUID(), entityId: entity.id, parentHash: previous?.hash ?? null, content: snapshot, createdAt: at };
  revision.hash = digest({ entityId: entity.id, parentHash: revision.parentHash, content: snapshot });
  graph.revisions.push(revision); entity.currentRevisionHash = revision.hash;
  decision(graph, actor, previous ? 'REVISED' : 'CREATED', entity, revision.hash, purpose, at);
  if (previous) for (const [domain, dependencies] of Object.entries(DEPENDENCIES[entity.kind])) {
    const affected = dependencies.filter(field => changedFields.includes(field));
    if (!affected.length) continue;
    const approval = graph.approvals.find(a => a.entityId === entity.id && a.domain === domain && a.status === 'APPROVED');
    if (approval) approval.status = 'STALE';
    graph.impacts.push({ id: randomUUID(), entityId: entity.id, fromHash: previous.hash, toHash: revision.hash, domain, changedFields: affected, approvalId: approval?.id ?? null, status: approval ? 'STALE' : 'REQUIRES_RE_APPROVAL', at });
  }
  return revision;
}
export function createEntity(graph, kind, content, actor, purpose, at) {
  const entity = { id: randomUUID(), kind, currentRevisionHash: null };
  // Add only after content and relations have passed validation.
  reviseEntity(graph, entity, content, actor, purpose, at); graph.entities.push(entity); return entity;
}
export function approveEntity(graph, entity, domain, actor, purpose, at) {
  if (!Object.hasOwn(DEPENDENCIES[entity.kind], domain)) fail(422, 'Unsupported clearance domain.');
  const revision = graph.revisions.find(r => r.entityId === entity.id && r.hash === entity.currentRevisionHash);
  if (entity.kind === 'Artwork' && ['Technical', 'Logistics'].includes(domain) && !revision.content.dimensions) fail(422, 'Save artwork dimensions before recording this review.');
  const old = graph.approvals.find(a => a.entityId === entity.id && a.domain === domain && a.status === 'APPROVED');
  if (old?.versionHash === entity.currentRevisionHash) return old;
  if (old) old.status = 'SUPERSEDED';
  const evidence = decision(graph, actor, 'APPROVED', entity, entity.currentRevisionHash, purpose, at);
  const approval = { id: randomUUID(), entityId: entity.id, domain, versionHash: entity.currentRevisionHash, decisionId: evidence.id, status: 'APPROVED' };
  graph.approvals.push(approval);
  graph.impacts.filter(i => i.entityId === entity.id && i.domain === domain && i.status !== 'RESOLVED').forEach(i => { i.status = 'RESOLVED'; i.resolvedBy = approval.id; });
  return approval;
}
export function ensureGovernance(state, at = new Date().toISOString()) {
  if (state.governance) return;
  state.governance = emptyGovernance();
  // Legacy baseline is captured now; this does not fabricate past approvals or edits.
  const entity = createEntity(state.governance, 'Artwork', artworkContent(state.revisions.at(-1).content), { id: 'system-local-migration' }, 'BASELINE_CAPTURE', at);
  state.artworkId = entity.id;
}
export function syncReviewGovernance(state, actor, command, at) {
  const entity = state.governance.entities.find(e => e.id === state.artworkId);
  const revision = reviseEntity(state.governance, entity, artworkContent(state.revisions.at(-1).content), actor, 'CONTENT_UPDATE', at);
  state.revisions.at(-1).entityRevisionHash = revision.hash;
  if (command.action === 'ready') approveEntity(state.governance, entity, 'Editorial', actor, 'CURATORIAL_REVIEW', at);
  if (command.action === 'publish') approveEntity(state.governance, entity, 'Publication', actor, 'PUBLICATION_REVIEW', at);
  if (['amend', 'request_revision'].includes(command.action)) {
    decision(state.governance, actor, 'REVIEW_REQUESTED', entity, revision.hash, 'REVISION_REQUEST', at);
    for (const a of state.governance.approvals.filter(a => a.entityId === entity.id && ['Editorial', 'Publication'].includes(a.domain) && a.status === 'APPROVED')) a.status = 'STALE';
  }
}
export function governanceCommand(state, actor, command, at = new Date().toISOString()) {
  if (actor.role !== 'General_Exhibition_Coordinator') fail(403, 'Only the fictional Coordinator records contract terms and specialist evidence.');
  if (!exact(command, ['action', 'version', 'entityId', 'expectedHash', 'content', 'domain', 'purpose']) || command.version !== state.version) fail(409, 'Refresh the current record; unknown command fields are not accepted.');
  const next = structuredClone(state); ensureGovernance(next, at); const graph = next.governance;
  if (command.action === 'create_contract') {
    if (command.purpose !== 'CONTRACT_UPDATE') fail(422, 'Contract update purpose is required.');
    createEntity(graph, 'Contract', command.content, actor, command.purpose, at);
  } else {
    const entity = graph.entities.find(e => e.id === command.entityId);
    if (!entity) fail(404, 'Entity not found in this exhibition.');
    if (entity.currentRevisionHash !== command.expectedHash) fail(409, 'Revision changed; refresh before acting.');
    if (command.action === 'revise_contract' && entity.kind === 'Contract' && command.purpose === 'CONTRACT_UPDATE') reviseEntity(graph, entity, command.content, actor, command.purpose, at);
    else if (command.action === 'record_clearance' && ['Technical', 'Logistics', 'Finance'].includes(command.domain) && command.purpose === 'FICTIONAL_SPECIALIST_REVIEW') approveEntity(graph, entity, command.domain, actor, command.purpose, at);
    else fail(422, 'Use the existing review workflow for artwork edits and publication approvals.');
  }
  next.version++; return next;
}
export function governanceProjection(state, actor) {
  const graph = state.governance;
  if (!graph || actor.role === 'Director') return undefined; // No draft metadata leakage to executive-only projection.
  return structuredClone({ artworkId: state.artworkId, entities: graph.entities, revisions: graph.revisions.map(({ content, ...metadata }) => metadata), decisions: graph.decisions, approvals: graph.approvals, impacts: graph.impacts });
}
