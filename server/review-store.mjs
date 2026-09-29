import { extractKeywords, EXTRACTOR_VERSION } from '../src/curation/keywords.mjs';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { canonicalProfileUrl, validateLabelContent, generateLabelArtifact, renderLabelBatch } from './gallery-labels.mjs';

export const ROLES = Object.freeze(['Artist', 'General_Exhibition_Coordinator', 'Director']);
export const ACCOUNTS = Object.freeze([
  { id: 'demo-artist', name: 'Noura — fictional artist', role: 'Artist', exhibitionId: 'demo-exhibition', artistId: 'demo-kufic-horizon' },
  { id: 'demo-coordinator', name: 'Fictional General Exhibition Coordinator', role: 'General_Exhibition_Coordinator', exhibitionId: 'demo-exhibition' },
  { id: 'demo-director', name: 'Fictional Director', role: 'Director', exhibitionId: 'demo-exhibition' },
]);
export class ReviewError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new ReviewError(status, message); };
const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const current = state => state.revisions.at(-1);
export const initialReview = () => ({
  format: 1, version: 0, exhibitionId: 'demo-exhibition', artistId: 'demo-kufic-horizon',
  revisions: [{ number: 1, status: 'Draft', content: { title: 'Kufic Horizon: Architectural Bronze & Black Oxide', concept: 'A fictional 84 kg bronze sculpture exploring architectural calligraphy.' } }],
  events: [], alerts: [], outbox: [], labels: [],
});
function authorize(state, actor) {
  if (!actor || !ROLES.includes(actor.role) || actor.exhibitionId !== state.exhibitionId ||
    (actor.role === 'Artist' && actor.artistId !== state.artistId)) fail(403, 'This account is not assigned to this artist and exhibition.');
}
export function projectReview(state, actor) {
  authorize(state, actor);
  // Director receives only records explicitly sent to executive review, never raw drafts.
  const revisions = actor.role === 'Director' ? state.revisions.filter(r => ['Executive_Review', 'Publication_Approved'].includes(r.status)) : state.revisions;
  const visible = new Set(revisions.map(r => r.number));
  const r = current(state);
  const owner = ['Draft', 'Revision_Requested'].includes(r.status) ? 'Artist' : r.status === 'Coordinator_Review' ? 'General_Exhibition_Coordinator' : r.status === 'Executive_Review' ? 'Director' : null;
  return structuredClone({
    version: state.version, artistId: state.artistId, revisions,
    curationArtworks: actor.role === 'General_Exhibition_Coordinator' && ['Coordinator_Review', 'Executive_Review', 'Publication_Approved'].includes(r.status) ? [{ id: `${state.artistId}:publication-artwork`, revision: r.number, title: r.content.title, concept: r.content.concept, tags: r.tagging?.tags ?? [], extracted: Boolean(r.tagging), extractorVersion: r.tagging?.extractorVersion }] : [],
    events: state.events.filter(e => visible.has(e.revision)),
    alerts: state.alerts.filter(a => a.accountId === actor.id),
    outbox: state.outbox.map(({ payload, ...receipt }) => receipt),
    labels: (state.labels ?? []).map(({ pdfBase64, snapshot, ...metadata }) => ({ ...metadata, current: r.number === metadata.revision && r.status === 'Publication_Approved' })),
    tasks: owner && (actor.role !== 'Director' || owner === 'Director') ? [{ revision: r.number, owner, title: owner === 'Artist' ? 'Revise and submit artwork text' : owner === 'Director' ? 'Review finalized publication record' : 'Review submission and record critique' }] : [],
  });
}
export function transitionReview(state, actor, command, at = new Date().toISOString()) {
  authorize(state, actor);
  if (!command || typeof command !== 'object') fail(400, 'An action is required.');
  if (command.version !== state.version || command.revision !== current(state).number) fail(409, 'This record changed. Refresh before acting.');
  const next = structuredClone(state); const r = current(next);
  const assert = (role, statuses) => {
    if (actor.role !== role) fail(403, 'Your role cannot perform this action.');
    if (!statuses.includes(r.status)) fail(409, 'This action is not available in the current state.');
  };
  const event = (action, note) => {
    const e = { id: randomUUID(), revision: r.number, action, note, actorId: actor.id, actorRole: actor.role, at };
    next.events.push(e); return e;
  };
  const alert = (role, message) => {
    for (const account of ACCOUNTS.filter(a => a.role === role && a.exhibitionId === state.exhibitionId)) {
      next.alerts.push({ id: randomUUID(), accountId: account.id, revision: current(next).number, message, at, resolved: false });
    }
  };
  const resolve = () => next.alerts.filter(a => a.accountId === actor.id && a.revision === r.number).forEach(a => { a.resolved = true; });
  switch (command.action) {
    case 'save': {
      assert('Artist', ['Draft', 'Revision_Requested']);
      if (!text(command.content?.title, 200) || !text(command.content?.concept, 10000)) fail(422, 'Enter a title (up to 200 characters) and concept (up to 10,000 characters).');
      const supplied = command.content.label;
      const label = supplied && typeof supplied === 'object' ? { artistName: supplied.artistName, width_cm: supplied.width_cm, height_cm: supplied.height_cm, year: supplied.year, profileUrl: supplied.profileUrl ?? '' } : undefined;
      r.content = { title: command.content.title.trim(), concept: command.content.concept.trim(), ...(label ? { label } : {}) };
      event('Draft_Saved', 'Artist saved draft text.'); break;
    }
    case 'submit':
      assert('Artist', ['Draft', 'Revision_Requested']);
      if (!text(r.content.title, 200) || !text(r.content.concept, 10000)) fail(422, 'Save complete artwork text first.');
      r.tagging = { tags: extractKeywords(r.content.concept), extractorVersion: EXTRACTOR_VERSION, source: 'concept', at };
      r.status = 'Coordinator_Review'; event('Submitted', 'Artist submitted this immutable review snapshot.'); resolve();
      alert('General_Exhibition_Coordinator', `Revision ${r.number} is ready for critique.`); break;
    case 'amend':
    case 'request_revision':
      assert('General_Exhibition_Coordinator', command.action === 'amend' ? ['Publication_Approved'] : ['Coordinator_Review', 'Executive_Review']);
      if (!text(command.note, 2000)) fail(422, 'Critique notes are required (up to 2,000 characters).');
      if (command.action !== 'amend') r.status = 'Revision_Requested';
      r.critique = command.note.trim();
      if (command.action === 'amend') next.outbox.filter(row => row.revision === r.number && row.delivery === 'Paused').forEach(row => { row.delivery = 'Cancelled'; });
      event('Revision_Requested', r.critique); resolve();
      next.revisions.push({ number: r.number + 1, status: 'Revision_Requested', content: { ...r.content }, critique: r.critique });
      alert('Artist', r.critique); break;
    case 'tag_existing':
      assert('General_Exhibition_Coordinator', ['Coordinator_Review', 'Executive_Review', 'Publication_Approved']);
      if (r.tagging) fail(409, 'This revision already has extracted tags.');
      r.tagging = { tags: extractKeywords(r.content.concept), extractorVersion: EXTRACTOR_VERSION, source: 'concept', at };
      event('Thematic_Tags_Extracted', 'Generated local keyword suggestions for an existing submission; content and approvals unchanged.'); break;
    case 'verify_profile': {
      assert('General_Exhibition_Coordinator', ['Coordinator_Review']);
      if (!text(command.note, 2000)) fail(422, 'Record how the profile URL and artist identity were verified.');
      let url; try { url = canonicalProfileUrl(r.content.label?.profileUrl); } catch (error) { fail(422, error.message); }
      r.profileVerification = { url, actorId: actor.id, actorRole: actor.role, note: command.note.trim(), at };
      event('Profile_Verification_Recorded', command.note.trim()); break;
    }
    case 'ready':
      assert('General_Exhibition_Coordinator', ['Coordinator_Review']);
      if (!text(command.note, 2000)) fail(422, 'Record your review note before forwarding.');
      try { validateLabelContent(r.content); } catch (error) { fail(422, error.message); }
      r.status = 'Executive_Review'; r.coordinatorReview = event('Ready_For_Executive', command.note.trim()).id; resolve();
      alert('Director', `Revision ${r.number} is finalized for executive review.`); break;
    case 'publish': {
      assert('Director', ['Executive_Review']);
      if (!r.coordinatorReview || !next.events.some(e => e.id === r.coordinatorReview && e.revision === r.number && e.action === 'Ready_For_Executive')) fail(409, 'Current coordinator approval is required.');
      if (!text(command.note, 2000)) fail(422, 'Record the executive approval note.');
      try { validateLabelContent(r.content); } catch (error) { fail(422, error.message); }
      r.status = 'Publication_Approved'; const approval = event('Publication_Approved', command.note.trim()); resolve();
      next.outbox.push({ id: randomUUID(), revision: r.number, approvalId: approval.id, syncStatus: 'Pending_Sync', delivery: 'Paused', createdAt: at,
        payload: { artistId: state.artistId, revision: r.number, title: r.content.title, concept: r.content.concept } });
      alert('General_Exhibition_Coordinator', `Revision ${r.number} approved. External delivery remains paused.`); break;
    }
    default: fail(400, 'Unknown action.');
  }
  next.version++; return next;
}

export async function openReviewStore(file, { labelGenerator = generateLabelArtifact, labelOptions = {} } = {}) {
  await mkdir(dirname(file), { recursive: true });
  let state;
  try { state = JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; state = initialReview(); await writeFile(file, JSON.stringify(state, null, 2), { flag: 'wx', mode: 0o600 }); }
  if (state.format !== 1 || !Number.isInteger(state.version) || !Array.isArray(state.revisions) || !state.revisions.length) throw new Error('Unsupported local review data. Preserve it and inspect before continuing.');
  let queue = Promise.resolve();
  return {
    read: actor => projectReview(state, actor),
    label(actor, id) {
      authorize(state, actor);
      if (actor.role !== 'General_Exhibition_Coordinator') fail(403, 'Only the assigned Coordinator can download gallery labels.');
      const label = (state.labels ?? []).find(row => row.id === id);
      if (!label) fail(404, 'Label not found. Earlier approvals are not silently backfilled.');
      return Buffer.from(label.pdfBase64, 'base64');
    },
    batch(actor) {
      authorize(state, actor);
      if (actor.role !== 'General_Exhibition_Coordinator') fail(403, 'Only the assigned Coordinator can download gallery labels.');
      const r = current(state);
      const eligible = (state.labels ?? []).filter(label => (label.status === 'Ready' || (label.status === 'Test_Ready' && labelOptions.testMode === true)) && label.revision === r.number && r.status === 'Publication_Approved');
      if (!eligible.length) fail(409, 'No current QR-verified labels are ready for a print batch.');
      return renderLabelBatch(eligible.map(label => label.snapshot));
    },
    act(actor, command) {
      const result = queue.then(async () => {
        const next = transitionReview(state, actor, command);
        if (command.action === 'publish') {
          const r = current(next); const approval = next.events.at(-1);
          // Generate before committing: failure leaves approval and outbox unchanged.
          let artifact;
          try { artifact = await labelGenerator({ artistId: next.artistId, revision: r.number, approvalId: approval.id, content: r.content, profileVerification: r.profileVerification, labelOptions }); }
          catch (error) { throw new ReviewError(422, `Label generation failed; approval was not saved. ${error.message}`); }
          next.labels = [...(next.labels ?? []), { ...artifact, createdAt: approval.at }];
        }
        const temp = `${file}.${randomUUID()}.tmp`;
        await writeFile(temp, JSON.stringify(next, null, 2), { mode: 0o600 });
        await rename(temp, file); // Publish the state only after durable file replacement succeeds.
        state = next; return projectReview(state, actor);
      });
      queue = result.catch(() => {}); return result;
    },
  };
}
