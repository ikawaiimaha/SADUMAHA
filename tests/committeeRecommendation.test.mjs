import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createConnectedPilot } from '../server/connected-pilot.mjs';
import { projectCuratorialLedger } from '../src/lib/curatorialAccess.ts';
import { ledgerSeed } from '../src/lib/spatialLedger.ts';

// Exercises the real path: HTTP session -> /api/review/spatial-ledger/command -> service.mutate
// -> repository.transaction -> applyLedger -> applyCuration -> state.json. Synthetic data only.
const MINUTE = 'Committee minute: recommend endorsement of this exact revision.';
const base = '/api/review/spatial-ledger';
const proposals = [1, 2, 3].map(i => ({ en: `Theme ${i}`, ar: `موضوع ${i}`, rationale: 'Shared practice', feasibility: 'Existing spaces', translation: 'Review bilingual meaning' }));

async function start(directory) {
  const { app } = await createConnectedPilot({ directory, gate: (_req, _res, next) => next() });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  const call = (path, body) => fetch(origin + path, { method: body ? 'POST' : 'GET', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const login = async role => { const r = await call('/api/review/session', { accountId: `pilot-${role}` }); assert.equal(r.status, 200); cookie = r.headers.get('set-cookie').split(';')[0]; };
  const version = async () => (await (await call(base)).json()).ledger.version;
  const command = async (role, body, expected) => { await login(role); return call(`${base}/command`, { expected: expected ?? await version(), ...body }); };
  const theme = async (role, action, fields = {}) => { await login(role); const revision = (await (await call(`${base}/theme`)).json()).theme.revision; const r = await call(`${base}/theme`, { action, expected: revision, ...fields }); assert.equal(r.status, 200, `${role} ${action}`); };
  const view = async role => { await login(role); return (await call(base)).json(); };
  const close = () => new Promise(resolve => server.close(resolve));
  return { call, login, command, theme, view, close, version };
}
const stateFile = directory => join(directory, 'state.json');
const ok = async (response, label) => { assert.equal(response.status, 200, `${label}: ${await response.clone().text()}`); return response.json(); };

async function lockedBoard(directory) {
  const s = await start(directory);
  await s.theme('Committee', 'SUBMIT_PROPOSAL', { proposals });
  await s.theme('Editorial', 'PREFLIGHT', { preflight: 'Titles reviewed in both languages.' });
  await s.theme('Director', 'ENDORSE');
  await s.theme('Chairman', 'SELECT', { selected: 0 });
  await ok(await s.command('Director', { action: 'AUTHORIZE_BLOCK' }), 'authorize');
  const artistId = (await s.view('Director')).ledger.artworks[0].id;
  await ok(await s.command('General_Exhibition_Coordinator', { action: 'CURATE_CREATE_SLOTS', id: 'brief', galleryId: 'gallery-a', quantity: 1, areaM2: 10, budgetMinor: 100000, coordinatorId: 'pilot-Exhibition_Coordinator', brief: 'Classical calligraphy with clear links to continuity of practice.' }), 'brief');
  await ok(await s.command('Exhibition_Coordinator', { action: 'CURATE_PROPOSE', id: 'proposal', slotId: 'brief:1', artistId, areaM2: 8, costMinor: 80000, fit: 'The proposed work explains shared artistic practice.', evidence: 'Synthetic dossier reference 01.' }), 'propose');
  await ok(await s.command('General_Exhibition_Coordinator', { action: 'CURATE_SHORTLIST', id: 'proposal', revision: 1 }), 'shortlist');
  await ok(await s.command('General_Exhibition_Coordinator', { action: 'CURATE_LOCK', id: 'board-1' }), 'lock');
  return { s, artistId };
}
const recommend = (s, role = 'Committee', fields = {}) => s.command(role, { action: 'CURATE_COMMITTEE_RECOMMEND', id: 'proposal', revision: 1, note: MINUTE, ...fields });

test('recommendation is attributed, exact-revision, visible to a second account, durable and never an approval', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'committee-recommendation-'));
  let { s } = await lockedBoard(directory);
  try {
    const before = await readFile(stateFile(directory), 'utf8');
    // Unauthorized and invalid submissions fail with no write at all.
    for (const [label, response, status] of [
      ['Artist cannot reach venue planning', await s.command('Artist', { action: 'CURATE_COMMITTEE_RECOMMEND', id: 'proposal', revision: 1, note: MINUTE }, 1), 403],
      ['Director cannot record the Committee minute', await recommend(s, 'Director'), 403],
      ['Coordinator cannot record the Committee minute', await recommend(s, 'Exhibition_Coordinator'), 403],
      ['stale revision', await recommend(s, 'Committee', { revision: 2 }), 409],
      ['minute too short', await recommend(s, 'Committee', { note: 'short' }), 422],
      ['unknown proposal', await recommend(s, 'Committee', { id: 'missing' }), 409],
      ['old approval action is not accepted live', await s.command('Committee', { action: 'CURATE_COMMITTEE_APPROVE', id: 'proposal', revision: 1 }), 422],
      ['Director cannot endorse without minutes', await s.command('Director', { action: 'CURATE_ENDORSE' }), 409],
    ]) assert.equal(response?.status, status, label);
    assert.equal(await readFile(stateFile(directory), 'utf8'), before, 'failed submissions must not write');

    // Success: attributed to the signed-in account; the request body cannot forge identity.
    const recorded = await ok(await recommend(s, 'Committee', { actorId: 'forged', role: 'Director' }), 'recommend');
    const rec = recorded.curation.recommendations[0];
    assert.deepEqual([rec.actorId, rec.role, rec.proposalId, rec.revision, rec.snapshotId, rec.outcome], ['pilot-Committee', 'Committee', 'proposal', 1, 'board-1', 'RECOMMEND_ENDORSEMENT']);
    assert.equal(rec.minute, MINUTE);
    assert.equal(recorded.curation.nominations[0].status, 'SHORTLISTED', 'a recommendation must not change the nomination');
    assert.equal(recorded.artworks[0].state, 'UNASSIGNED', 'a recommendation must not allocate the artwork');
    assert.equal(recorded.curation.phase, 'DIRECTOR_REVIEW');

    // Duplicate fails without a second write.
    const afterFirst = await readFile(stateFile(directory), 'utf8');
    assert.equal((await recommend(s)).status, 409);
    assert.equal(await readFile(stateFile(directory), 'utf8'), afterFirst);

    // An authorized second account sees it; an unauthorized account cannot.
    for (const role of ['Director', 'General_Exhibition_Coordinator']) {
      const seen = (await s.view(role)).ledger.curation.recommendations;
      assert.equal(seen.length, 1, role);
      assert.equal(seen[0].actorId, 'pilot-Committee');
    }
    await s.login('Artist');
    assert.equal((await s.call(base)).status, 403);

    // Retained after restart; the Director then decides separately.
    await s.close();
    s = await start(directory);
    const restarted = (await s.view('Director')).ledger.curation;
    assert.deepEqual(restarted.recommendations, [rec]);
    const endorsed = await ok(await s.command('Director', { action: 'CURATE_ENDORSE' }), 'endorse');
    assert.equal(endorsed.curation.nominations[0].status, 'ENDORSED');
    assert.deepEqual(endorsed.curation.recommendations, [rec], 'history is retained after endorsement');
  } finally { await s.close(); }
});

test('a legacy board in Director review keeps its history, is not auto-approved, and recovers through a real minute', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'committee-legacy-'));
  let { s } = await lockedBoard(directory);
  try {
    await s.close();
    // Reproduce what the previous version saved: status COMMITTEE_APPROVED, Director review, no minutes.
    const file = stateFile(directory);
    const state = JSON.parse(await readFile(file, 'utf8'));
    state.spatialLedger.curation.nominations[0].status = 'COMMITTEE_APPROVED';
    state.spatialLedger.curation.phase = 'DIRECTOR_REVIEW';
    delete state.spatialLedger.curation.recommendations;
    await writeFile(file, JSON.stringify(state));
    const legacy = await readFile(file, 'utf8');
    s = await start(directory);

    assert.equal((await s.view('Director')).ledger.curation.nominations[0].status, 'COMMITTEE_APPROVED');
    assert.equal((await s.command('Director', { action: 'CURATE_ENDORSE' })).status, 409);
    assert.equal(await readFile(file, 'utf8'), legacy, 'refused endorsement must not write');
    assert.equal((await recommend(s, 'Director')).status, 403);

    const recovered = await ok(await recommend(s), 'recover');
    assert.equal(recovered.curation.recommendations.length, 1);
    assert.equal(recovered.curation.recommendations[0].actorId, 'pilot-Committee');
    assert.equal(recovered.curation.nominations[0].status, 'COMMITTEE_APPROVED', 'original status is preserved, not rewritten');
    const endorsed = await ok(await s.command('Director', { action: 'CURATE_ENDORSE' }), 'endorse');
    assert.equal(endorsed.curation.nominations[0].status, 'ENDORSED');
    assert.equal(endorsed.curation.snapshots.length, 1);
  } finally { await s.close(); }
});

test('recommendations on restricted benchmark slots are projected only to roles that may see them', () => {
  const ledger = ledgerSeed('e');
  const revision = { number: 1, artistId: 'case-murat-kurt', areaM2: 5, costMinor: 1, fit: 'x', evidence: 'x', at: 'now' };
  ledger.curation = {
    phase: 'COMMITTEE_REVIEW',
    benchmarks: [{ id: 'case-murat-kurt', name: 'Benchmark', rationale: 'x', themeId: 't', assigned: true }],
    slots: [{ id: 's1', restricted: true, galleryId: 'gallery-a', areaM2: 5, budgetMinor: 1, brief: 'x', selectedId: 'n1' }],
    nominations: [{ id: 'n1', slotId: 's1', authorId: 'a', status: 'SHORTLISTED', revisions: [revision], feedback: [] }],
    snapshots: [],
    recommendations: [{ id: 'r1', proposalId: 'n1', revision: 1, snapshotId: 'b', outcome: 'RECOMMEND_ENDORSEMENT', minute: MINUTE, actorId: 'c', role: 'Committee', at: 'now' }],
  };
  assert.equal(projectCuratorialLedger(ledger, 'Exhibition_Coordinator').curation.recommendations.length, 0);
  assert.equal(projectCuratorialLedger(ledger, 'Technical').curation.recommendations.length, 0);
  assert.equal(projectCuratorialLedger(ledger, 'Committee').curation.recommendations.length, 1);
  assert.equal(projectCuratorialLedger(ledger, 'General_Exhibition_Coordinator').curation.recommendations.length, 1);
});
