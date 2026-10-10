import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { jsPDF } from 'jspdf';
import { createConnectedPilot, PILOT_ARTWORK } from '../server/connected-pilot.mjs';

// SYNTHETIC Laura / Mounir scenario. Every name, reference and file here is invented test data.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4XmN49vDSfwAI4wOZS6NgQwAAAABJRU5ErkJggg==', 'base64');
const photo = n => Buffer.concat([png, Buffer.from(`synthetic-photo-${n}`)]);
const pdf = label => { const doc = new jsPDF(); doc.text(label, 20, 20); return Buffer.from(doc.output('arraybuffer')); };
const dueAt = '2026-10-12T12:00:00Z';
const record = (over = {}) => ({ baseRevision: 0, workTitle: 'Heavier Than Words (synthetic)', method: 'Apply the agreed coating to one steel letter as a trial.', sourceRef: 'SYNTHETIC-EMAIL-LAURA-001',
  decisionMaker: { name: 'Synthetic gallery representative', capacity: 'Gallery representative (synthetic)' },
  conditions: [{ domain: 'VENUE', text: 'Ventilation confirmed.' }, { domain: 'ENGINEERING', text: 'Coating compatible with steel.' }, { domain: 'FINANCIAL', text: 'Cost within the approved budget.' }], ...over });

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'sadu-treatment-'));
  const clock = new Date('2026-10-05T10:00:00Z');
  const options = { directory, gate: (_q, _r, next) => next(), now: () => clock };
  let runtime = await createConnectedPilot(options), server, origin;
  const listen = async () => { server = runtime.app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r)); origin = `http://127.0.0.1:${server.address().port}`; };
  await listen(); t.after(() => new Promise(r => server.close(r)));
  const path = '/api/review/pilot/operations/' + PILOT_ARTWORK;
  const client = async role => {
    const response = await fetch(origin + '/api/review/session', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: 'pilot-' + role }) });
    assert.equal(response.status, 200);
    const cookie = response.headers.get('set-cookie').split(';')[0];
    const call = async (url, body, expected = 200) => { const r = await fetch(origin + url, { method: body ? 'POST' : 'GET', headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) }); const value = await r.json(); assert.equal(r.status, expected, JSON.stringify(value)); return value; };
    const view = () => call(path);
    return { call, view,
      command: async (action, extra = {}, expected = 200, operationId = randomUUID()) => call(path, { version: (await view()).version, operationId, action, ...extra }, expected),
      upload: async (kind, bytes, name = 'evidence.pdf', expected = 200) => { const meta = { version: (await view()).version, operationId: randomUUID(), kind, name, source: 'SYNTHETIC-SOURCE', sender: 'Synthetic sender' }; const r = await fetch(origin + path + '/evidence', { method: 'POST', headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/octet-stream', 'x-sadu-metadata': encodeURIComponent(JSON.stringify(meta)) }, body: bytes }); const result = await r.json(); assert.equal(r.status, expected, JSON.stringify(result)); return result.evidenceId; },
      file: async (id, expected = 200) => { const r = await fetch(origin + path + '/evidence/' + id, { headers: { Cookie: cookie } }); assert.equal(r.status, expected); return Buffer.from(await r.arrayBuffer()); } };
  };
  const who = async () => Object.fromEntries(await Promise.all(['General_Exhibition_Coordinator', 'Technical', 'Artist', 'Museum_Operations', 'Finance', 'Logistics', 'Editorial'].map(async r => [r, await client(r)])));
  return { directory, path, client, who, get runtime() { return runtime; }, get origin() { return origin; }, restart: async () => { await new Promise(r => server.close(r)); runtime = await createConnectedPilot(options); await listen(); } };
}
const step = (view, key) => view.treatment.steps.find(s => s.key === key);

/** Records the case, authorizes it externally and gets the trial task accepted. */
async function authorized(c) {
  await c.General_Exhibition_Coordinator.command('TREATMENT_RECORD', record());
  const source = await c.General_Exhibition_Coordinator.upload('TREATMENT_SOURCE', pdf('Synthetic permission record'), 'permission.pdf');
  await c.General_Exhibition_Coordinator.command('TREATMENT_AUTHORIZE', { revision: 1, mode: 'EXTERNAL_PERMISSION', evidenceId: source, reference: 'SYNTHETIC-PERMISSION-1', checked: true });
  await c.General_Exhibition_Coordinator.command('ASSIGN_TASK', { key: 'treatment-trial', ownerId: 'pilot-Technical', dueAt, reason: 'Synthetic handoff' });
  await c.Technical.command('ACCEPT_TASK', { key: 'treatment-trial' });
  return source;
}
async function approvedTrial(c, n = 1, revision = 1) {
  const sample = await c.Technical.upload('TREATMENT_SAMPLE', photo(n), `sample-${n}.png`);
  await c.Technical.command('TREATMENT_SUBMIT_SAMPLE', { revision, evidenceId: sample, checked: true });
  const trial = (await c.Artist.view()).treatment.trials.at(-1);
  await c.Artist.command('TREATMENT_ARTIST_DECISION', { revision, trialId: trial.id, evidenceId: sample, decision: 'APPROVE', checked: true });
  return { sample, trial };
}
const clearRequirements = async c => {
  await c.Museum_Operations.command('TREATMENT_REQUIREMENT', { domain: 'VENUE', checked: true });
  await c.Technical.command('TREATMENT_REQUIREMENT', { domain: 'ENGINEERING', checked: true });
  await c.Finance.command('TREATMENT_REQUIREMENT', { domain: 'FINANCIAL', checked: true, reference: 'SYNTHETIC-BUDGET-1' });
};

test('conditional treatment runs from permission to completion, survives restart and keeps its history', async t => {
  const f = await fixture(t); let c = await f.who();
  const gc = c.General_Exhibition_Coordinator;
  assert.equal(step(await gc.view(), 'tRecord').canAct, true);
  await gc.command('TREATMENT_RECORD', record());
  const source = await gc.upload('TREATMENT_SOURCE', pdf('Synthetic permission record'), 'permission.pdf');
  await gc.command('TREATMENT_AUTHORIZE', { revision: 1, mode: 'EXTERNAL_PERMISSION', evidenceId: source, reference: 'SYNTHETIC-PERMISSION-1', checked: true });
  let view = await gc.view();
  assert.equal(view.treatment.authorizations[0].mode, 'EXTERNAL_PERMISSION');
  assert.equal(view.treatment.authorizations[0].performedInSadu, false, 'External permission is only recorded, not decided, in SADU');
  assert.equal(step(view, 'tSample').assign, true);
  await gc.command('ASSIGN_TASK', { key: 'treatment-trial', ownerId: 'pilot-Technical', dueAt, reason: 'Synthetic handoff' });
  assert.equal(step(await c.Technical.view(), 'tSample').acceptance, true);
  assert.equal(step(await c.Technical.view(), 'tSample').canAct, false, 'Assignment alone does not authorize the work');
  await c.Technical.command('ACCEPT_TASK', { key: 'treatment-trial' });
  assert.equal(step(await c.Technical.view(), 'tSample').canAct, true);
  const sample = await c.Technical.upload('TREATMENT_SAMPLE', photo(1), 'sample-1.png');
  await c.Technical.command('TREATMENT_SUBMIT_SAMPLE', { revision: 1, evidenceId: sample, checked: true });
  await f.restart(); c = await f.who();
  view = await c.Artist.view();
  const trial = view.treatment.trials.at(-1);
  assert.equal(step(view, 'tArtist').canAct, true);
  assert.deepEqual(await c.Artist.file(sample), photo(1), 'The artist sees the exact stored photograph');
  assert.equal(view.treatment.batch.allowed, false);
  await c.Artist.command('TREATMENT_ARTIST_DECISION', { revision: 1, trialId: trial.id, evidenceId: sample, decision: 'APPROVE', checked: true });
  assert.equal((await c.Technical.view()).treatment.batch.allowed, false, 'Approval alone does not clear independent venue, engineering and financial requirements');
  await c.Technical.upload('TREATMENT_COMPLETION', photo(2), 'completion.png', 409);
  await c.Technical.command('TREATMENT_COMPLETE', { revision: 1, evidenceId: 'not-yet', lettersTreated: 12 }, 409);
  await clearRequirements(c);
  const completionPhoto = await c.Technical.upload('TREATMENT_COMPLETION', photo(2), 'completion.png');
  await f.restart(); c = await f.who();
  assert.equal((await c.Technical.view()).treatment.batch.allowed, true);
  await c.Technical.command('TREATMENT_COMPLETE', { revision: 1, evidenceId: completionPhoto, lettersTreated: 12, note: 'Synthetic note' });
  const done = (await c.Artist.view()).treatment;
  assert.equal(done.completions[0].lettersTreated, 12);
  assert.equal(done.revisions.length, 1);
  assert.equal(done.batch.allowed, false, 'A completed treatment is closed');
  // The restart invalidated the earlier session; the coordinator signs in again rather than reusing the old cookie.
  await gc.call(f.path, undefined, 401);
  await c.General_Exhibition_Coordinator.command('TREATMENT_RECORD', record({ baseRevision: 1, method: 'Changed after completion' }), 409);
  const actions = f.runtime.repository.read().decisions.filter(d => d.action.startsWith('TREATMENT_')).map(d => d.action);
  for (const action of ['TREATMENT_RECORD', 'TREATMENT_AUTHORIZE', 'TREATMENT_SUBMIT_SAMPLE', 'TREATMENT_ARTIST_DECISION', 'TREATMENT_REQUIREMENT', 'TREATMENT_COMPLETE']) assert.ok(actions.includes(action), action);
});

test('missing or wrong evidence cannot advance any step', async t => {
  const f = await fixture(t); const c = await f.who(); const gc = c.General_Exhibition_Coordinator;
  await gc.command('TREATMENT_RECORD', record());
  const before = f.runtime.repository.read();
  await gc.command('TREATMENT_AUTHORIZE', { revision: 1, mode: 'EXTERNAL_PERMISSION', reference: 'typed-text-is-not-a-file', checked: true }, 422);
  await gc.command('TREATMENT_AUTHORIZE', { revision: 1, mode: 'EXTERNAL_PERMISSION', evidenceId: 'nope', reference: 'x', checked: true }, 422);
  await gc.upload('TREATMENT_SOURCE', png, 'permission.png', 422);
  assert.deepEqual(f.runtime.repository.read().treatments, before.treatments);
  const source = await gc.upload('TREATMENT_SOURCE', pdf('Synthetic permission'), 'permission.pdf');
  await gc.command('TREATMENT_AUTHORIZE', { revision: 1, mode: 'EXTERNAL_PERMISSION', evidenceId: source, checked: true }, 422);
  await gc.command('TREATMENT_AUTHORIZE', { revision: 1, mode: 'EXTERNAL_PERMISSION', evidenceId: source, reference: 'REF', checked: false }, 422);
  await gc.command('TREATMENT_AUTHORIZE', { revision: 1, mode: 'EXTERNAL_PERMISSION', evidenceId: source, reference: 'REF', checked: true });
  await gc.command('ASSIGN_TASK', { key: 'treatment-trial', ownerId: 'pilot-Technical', dueAt, reason: 'Synthetic handoff' });
  await c.Technical.command('ACCEPT_TASK', { key: 'treatment-trial' });
  await c.Technical.upload('TREATMENT_SAMPLE', pdf('A document is not a photograph'), 'sample.pdf', 422);
  await c.Technical.command('TREATMENT_SUBMIT_SAMPLE', { revision: 1, checked: true }, 422);
  await c.Technical.command('TREATMENT_SUBMIT_SAMPLE', { revision: 1, evidenceId: source, checked: true }, 422);
  const sample = await c.Technical.upload('TREATMENT_SAMPLE', photo(1), 'sample.png');
  await c.Technical.command('TREATMENT_SUBMIT_SAMPLE', { revision: 1, evidenceId: sample, checked: false }, 422);
  assert.equal((await c.Artist.view()).treatment.trials.length, 0);
  assert.equal(step(await c.Artist.view(), 'tArtist').state, 'waiting', 'The artist has nothing to review without a submitted photograph');
});

test('wrong users and unaccepted ownership are rejected by the server', async t => {
  const f = await fixture(t); const c = await f.who(); const gc = c.General_Exhibition_Coordinator;
  await gc.command('TREATMENT_RECORD', record());
  const source = await gc.upload('TREATMENT_SOURCE', pdf('Synthetic permission'), 'permission.pdf');
  await c.Artist.command('TREATMENT_AUTHORIZE', { revision: 1, mode: 'EXTERNAL_PERMISSION', evidenceId: source, reference: 'REF', checked: true }, 403);
  await c.Technical.command('TREATMENT_AUTHORIZE', { revision: 1, mode: 'SADU_APPROVAL', checked: true }, 403);
  await c.Logistics.command('TREATMENT_RECORD', record({ baseRevision: 1 }), 403);
  await c.Artist.command('TREATMENT_RECORD', record({ baseRevision: 1 }), 403);
  await gc.command('ASSIGN_TASK', { key: 'treatment-trial', ownerId: 'pilot-Technical', dueAt, reason: 'too early' }, 409);
  await gc.command('TREATMENT_AUTHORIZE', { revision: 1, mode: 'EXTERNAL_PERMISSION', evidenceId: source, reference: 'REF', checked: true });
  await c.Technical.upload('TREATMENT_SAMPLE', photo(1), 'sample.png', 409);
  await gc.command('ASSIGN_TASK', { key: 'treatment-trial', ownerId: 'pilot-Finance', dueAt, reason: 'wrong role' }, 422);
  await gc.command('ASSIGN_TASK', { key: 'treatment-trial', ownerId: 'pilot-Technical', dueAt, reason: 'Synthetic handoff' });
  await c.Technical.upload('TREATMENT_SAMPLE', photo(1), 'sample.png', 409);
  await c.Finance.command('ACCEPT_TASK', { key: 'treatment-trial' }, 409);
  await c.Technical.command('ACCEPT_TASK', { key: 'treatment-trial' });
  const sample = await c.Technical.upload('TREATMENT_SAMPLE', photo(1), 'sample.png');
  await gc.upload('TREATMENT_SAMPLE', photo(5), 'sample.png', 403);
  await gc.command('TREATMENT_SUBMIT_SAMPLE', { revision: 1, evidenceId: sample, checked: true }, 403);
  await c.Finance.command('TREATMENT_SUBMIT_SAMPLE', { revision: 1, evidenceId: sample, checked: true }, 403);
  // The named owner changes after upload: the former owner cannot continue.
  await f.runtime.repository.transaction(s => { s.operationTasks[`${PILOT_ARTWORK}:treatment-trial`].ownerId = 'pilot-Logistics-Backup'; });
  await c.Technical.command('TREATMENT_SUBMIT_SAMPLE', { revision: 1, evidenceId: sample, checked: true }, 409);
  await f.runtime.repository.transaction(s => { s.operationTasks[`${PILOT_ARTWORK}:treatment-trial`].ownerId = 'pilot-Technical'; s.operationTasks[`${PILOT_ARTWORK}:treatment-trial`].acceptedBy = null; });
  await c.Technical.command('TREATMENT_SUBMIT_SAMPLE', { revision: 1, evidenceId: sample, checked: true }, 409);
  await c.Technical.command('ACCEPT_TASK', { key: 'treatment-trial' });
  await c.Technical.command('TREATMENT_SUBMIT_SAMPLE', { revision: 1, evidenceId: sample, checked: true });
  const trial = (await c.Artist.view()).treatment.trials.at(-1);
  for (const role of ['Technical', 'General_Exhibition_Coordinator', 'Finance']) await c[role].command('TREATMENT_ARTIST_DECISION', { revision: 1, trialId: trial.id, evidenceId: sample, decision: 'APPROVE', checked: true }, 403);
  await c.Artist.command('TREATMENT_ARTIST_DECISION', { revision: 1, trialId: trial.id, evidenceId: sample, decision: 'APPROVE', checked: false }, 422);
  await c.Technical.command('TREATMENT_REQUIREMENT', { domain: 'VENUE', checked: true }, 403);
  await c.Finance.command('TREATMENT_REQUIREMENT', { domain: 'ENGINEERING', checked: true }, 403);
  await c.Museum_Operations.command('TREATMENT_REQUIREMENT', { domain: 'VENUE', checked: false }, 422);
  await c.Museum_Operations.command('TREATMENT_REQUIREMENT', { domain: 'OTHER', checked: true }, 422);
  // Privacy: the permission record and photographs are limited to their workflow.
  await c.Finance.file(sample, 403); await c.Museum_Operations.file(source, 403); await c.Artist.file(source, 403);
  assert.equal((await c.Logistics.view()).treatment, null, 'Roles outside the treatment receive no treatment record');
  assert.equal((await c.Editorial.view()).treatment, null);
  const anonymous = await fetch(f.origin + f.path); assert.equal(anonymous.status, 401);
  await gc.command('TREATMENT_UNKNOWN', {}, 409);
});

test('changing the treatment or the photograph invalidates only dependent approvals', async t => {
  const f = await fixture(t); const c = await f.who(); const gc = c.General_Exhibition_Coordinator;
  const source1 = await authorized(c);
  const first = await approvedTrial(c, 1);
  await clearRequirements(c);
  assert.equal((await gc.view()).treatment.batch.allowed, true);
  // Revised treatment: authorization, trial and approval belong to revision 1; requirements and assignment stay.
  await gc.command('TREATMENT_RECORD', record({ baseRevision: 0 }), 409);
  await gc.command('TREATMENT_RECORD', record({ baseRevision: 1 }), 409);
  await gc.command('TREATMENT_RECORD', record({ baseRevision: 1, method: 'Apply the coating to one letter using a different solvent.' }));
  let view = await c.Technical.view();
  assert.equal(view.treatment.revisions.length, 2);
  assert.equal(view.treatment.authorizations.length, 1, 'Earlier authorization is retained as history');
  assert.equal(step(view, 'tAuthorize').state, 'now');
  assert.equal(step(view, 'tArtist').state, 'waiting');
  assert.equal(view.treatment.checks.length, 3, 'Venue, engineering and financial clearances are preserved');
  assert.equal(step(view, 'tVenue').state, 'done');
  assert.equal(view.treatment.assignment.accepted, true, 'The accepted technician assignment is preserved');
  assert.equal(view.treatment.batch.allowed, false);
  const staleBlocker = view.treatment.batch.blockers.join(' ');
  assert.match(staleBlocker, /Authorization/); assert.match(staleBlocker, /trial photograph/); assert.doesNotMatch(staleBlocker, /requirement/i);
  const completion = await c.Technical.upload('TREATMENT_COMPLETION', photo(9), 'completion.png', 409);
  assert.equal(completion, undefined);
  await c.Technical.upload('TREATMENT_SAMPLE', photo(2), 'sample-2.png', 409);
  await c.Technical.command('TREATMENT_SUBMIT_SAMPLE', { revision: 1, evidenceId: first.sample, checked: true }, 409);
  await c.Artist.command('TREATMENT_ARTIST_DECISION', { revision: 1, trialId: first.trial.id, evidenceId: first.sample, decision: 'APPROVE', checked: true }, 409);
  await gc.command('TREATMENT_AUTHORIZE', { revision: 1, mode: 'EXTERNAL_PERMISSION', evidenceId: source1, reference: 'REF', checked: true }, 409);
  await gc.command('TREATMENT_AUTHORIZE', { revision: 2, mode: 'EXTERNAL_PERMISSION', evidenceId: source1, reference: 'REF', checked: true }, 409);
  const source2 = await gc.upload('TREATMENT_SOURCE', pdf('Synthetic permission for revision 2'), 'permission-2.pdf');
  await gc.command('TREATMENT_AUTHORIZE', { revision: 2, mode: 'EXTERNAL_PERMISSION', evidenceId: source2, reference: 'REF-2', checked: true });
  await c.Technical.command('TREATMENT_SUBMIT_SAMPLE', { revision: 1, evidenceId: first.sample, checked: true }, 409);
  await c.Technical.command('TREATMENT_SUBMIT_SAMPLE', { revision: 2, evidenceId: first.sample, checked: true }, 409);
  const second = await approvedTrial(c, 2, 2);
  view = await c.Technical.view();
  assert.equal(view.treatment.batch.allowed, true);
  // Replacing the photograph invalidates only its approval; the permission and requirements stay current.
  const third = await c.Technical.upload('TREATMENT_SAMPLE', photo(3), 'sample-3.png');
  await c.Technical.command('TREATMENT_SUBMIT_SAMPLE', { revision: 2, evidenceId: third, checked: true });
  view = await c.Technical.view();
  assert.equal(view.treatment.batch.allowed, false);
  assert.match(view.treatment.batch.blockers.join(' '), /artist has not approved/);
  assert.equal(view.treatment.authorizations.length, 2);
  assert.equal(view.treatment.checks.length, 3);
  assert.equal(view.treatment.trials.length, 3, 'Every photograph and approval is retained');
  assert.equal(view.treatment.trials.filter(x => x.supersededAt).length, 1, 'The replaced photograph is superseded, not deleted');
  assert.equal(view.treatment.trials[1].decision.decision, 'APPROVE', 'The superseded approval remains in history');
  await c.Artist.command('TREATMENT_ARTIST_DECISION', { revision: 2, trialId: second.trial.id, evidenceId: second.sample, decision: 'APPROVE', checked: true }, 409);
  await c.Artist.command('TREATMENT_ARTIST_DECISION', { revision: 2, trialId: view.treatment.trials.at(-1).id, evidenceId: second.sample, decision: 'APPROVE', checked: true }, 409);
  await c.Artist.command('TREATMENT_ARTIST_DECISION', { revision: 2, trialId: view.treatment.trials.at(-1).id, evidenceId: third, decision: 'REQUEST_CHANGES', checked: true });
  assert.match(step(await c.Technical.view(), 'tSample').blocker, /changes/);
  assert.equal(step(await c.Technical.view(), 'tSample').canAct, true, 'Requested changes return the trial to the technician');
});

test('duplicate submissions are idempotent or rejected and do not create second records', async t => {
  const f = await fixture(t); const c = await f.who(); const gc = c.General_Exhibition_Coordinator;
  const body = async () => ({ version: (await gc.view()).version, operationId: 'synthetic-record-1', action: 'TREATMENT_RECORD', ...record() });
  const sent = await body();
  const first = await gc.call(f.path, sent);
  assert.deepEqual(await gc.call(f.path, sent), first, 'Retrying the same operation returns the original result');
  await gc.call(f.path, { ...sent, method: 'A different treatment under the same identifier' }, 409);
  assert.equal(f.runtime.repository.read().treatments[PILOT_ARTWORK].revisions.length, 1);
  await gc.command('TREATMENT_RECORD', record(), 409);
  const source = await gc.upload('TREATMENT_SOURCE', pdf('Synthetic permission'), 'permission.pdf');
  const auth = { revision: 1, mode: 'EXTERNAL_PERMISSION', evidenceId: source, reference: 'REF', checked: true };
  await gc.command('TREATMENT_AUTHORIZE', auth);
  await gc.command('TREATMENT_AUTHORIZE', auth, 409);
  await gc.command('ASSIGN_TASK', { key: 'treatment-trial', ownerId: 'pilot-Technical', dueAt, reason: 'Synthetic handoff' });
  await c.Technical.command('ACCEPT_TASK', { key: 'treatment-trial' });
  const sample = await c.Technical.upload('TREATMENT_SAMPLE', photo(1), 'sample.png');
  await c.Technical.command('TREATMENT_SUBMIT_SAMPLE', { revision: 1, evidenceId: sample, checked: true });
  await c.Technical.command('TREATMENT_SUBMIT_SAMPLE', { revision: 1, evidenceId: sample, checked: true }, 409);
  const copy = await c.Technical.upload('TREATMENT_SAMPLE', photo(1), 'same-bytes.png');
  await c.Technical.command('TREATMENT_SUBMIT_SAMPLE', { revision: 1, evidenceId: copy, checked: true }, 409);
  const trial = (await c.Artist.view()).treatment.trials.at(-1);
  const decision = { revision: 1, trialId: trial.id, evidenceId: sample, decision: 'APPROVE', checked: true };
  await c.Artist.command('TREATMENT_ARTIST_DECISION', decision);
  await c.Artist.command('TREATMENT_ARTIST_DECISION', decision, 409);
  await c.Museum_Operations.command('TREATMENT_REQUIREMENT', { domain: 'VENUE', checked: true });
  await c.Museum_Operations.command('TREATMENT_REQUIREMENT', { domain: 'VENUE', checked: true }, 409);
  const view = await c.Artist.view();
  assert.equal(view.treatment.trials.length, 1); assert.equal(view.treatment.checks.length, 1); assert.equal(view.treatment.authorizations.length, 1);
});

test('an approval performed in SADU is separate from recorded external permission', async t => {
  const f = await fixture(t); const c = await f.who(); const gc = c.General_Exhibition_Coordinator;
  await gc.command('TREATMENT_RECORD', record({ decisionMaker: { name: 'Synthetic Finance decision-maker', capacity: 'Named approver (synthetic)', accountId: 'pilot-Finance' } }));
  await gc.command('TREATMENT_RECORD', record({ baseRevision: 1, method: 'Same case, self-named approver', decisionMaker: { name: 'Self', capacity: 'x', accountId: 'pilot-General_Exhibition_Coordinator' } }), 422);
  assert.deepEqual(step(await c.Finance.view(), 'tAuthorize').authModes, ['SADU_APPROVAL']);
  await c.Technical.command('TREATMENT_AUTHORIZE', { revision: 1, mode: 'SADU_APPROVAL', checked: true }, 403);
  await gc.command('TREATMENT_AUTHORIZE', { revision: 1, mode: 'SADU_APPROVAL', checked: true }, 403);
  await c.Finance.command('TREATMENT_AUTHORIZE', { revision: 1, mode: 'EXTERNAL_PERMISSION', evidenceId: 'x', reference: 'x', checked: true }, 403);
  await c.Finance.command('TREATMENT_AUTHORIZE', { revision: 1, mode: 'SADU_APPROVAL', checked: true });
  const authorization = (await gc.view()).treatment.authorizations[0];
  assert.equal(authorization.mode, 'SADU_APPROVAL'); assert.equal(authorization.performedInSadu, true); assert.equal(authorization.actorId, 'pilot-Finance');
});

test('treatment files stay inside their record and nothing outside the treatment is changed', async t => {
  const f = await fixture(t); const c = await f.who();
  await authorized(c);
  const state = f.runtime.repository.read();
  assert.equal(state.artworks[0].lifecycleStatus, 'INVITED');
  assert.equal(state.artworks[0].physicalStatus, 'Pending_Shipment');
  assert.equal(state.payments.length, 0);
  assert.equal(state.collectionRevisions ?? undefined, undefined, 'No collection or print record is created by treatment work');
  assert.equal(state.printJobs ?? undefined, undefined);
  const view = await c.Technical.view();
  assert.ok(view.files.every(x => !('objectId' in x)));
  assert.equal(view.treatment.synthetic, true);
});
