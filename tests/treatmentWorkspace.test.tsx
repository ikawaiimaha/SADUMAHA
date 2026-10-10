import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { workspaceTasks } from '../src/lib/operationalWorkspace';
import OperationalForms from '../src/components/OperationalForms';
import TreatmentSummary from '../src/components/TreatmentSummary';
import type { OperationsView } from '../src/components/ConnectedOperations';
import type { TreatmentView, TreatmentStep } from '../src/lib/treatment';
import { treatmentBlocker } from '../src/lib/treatment';

// SYNTHETIC Laura / Mounir scenario data only.
const revision = { revision: 2, workTitle: 'Heavier Than Words (synthetic)', scope: 'ONE_LETTER_TRIAL', method: 'Coat one steel letter.', sourceRef: 'SYNTH-1', hash: 'h', actorId: 'gc', at: '2026-10-05T10:00:00Z',
  decisionMaker: { name: 'Synthetic representative', capacity: 'Gallery', accountId: null }, conditions: [{ id: 'c1', domain: 'VENUE' as const, text: 'Ventilation confirmed.' }] };
const step = (key: string, extra: Partial<TreatmentStep> = {}): TreatmentStep => ({ key, state: 'waiting', ownerRole: 'Technical', ownerId: null, canAct: false, blocker: '', evidenceIds: [], ...extra });
const treatment = (steps: TreatmentStep[], extra: Partial<TreatmentView> = {}): TreatmentView => ({ scenario: 'SYNTHETIC_LAURA_MOUNIR', synthetic: true, current: revision, revisions: [revision], authorizations: [], trials: [], checks: [], completions: [], batch: { allowed: false, blockers: ['لا موافقة / The artist has not approved the current trial photograph.'] }, assignment: null, steps, ...extra });
const ops = (t: TreatmentView): OperationsView => ({ version: 3, serverTime: '2026-10-06T10:00:00Z', readiness: null, files: [], tasks: [], accounts: [{ id: 'tech', name: 'Technical', role: 'Technical' }, { id: 'gc', name: 'Coordinator', role: 'General_Exhibition_Coordinator' }], job: null, treatment: t });
const noop = async () => true;

test('an artist waiting for a sample is directed to the named technician, never to themselves', () => {
  const artistStep = step('tArtist', { ownerRole: 'Artist', ownerId: 'artist' });
  const t = treatment([artistStep], {
    authorizations: [{ id: 'a', revision: 2, mode: 'EXTERNAL_PERMISSION', performedInSadu: false, actorId: 'gc', at: revision.at }],
    assignment: { ownerId: 'tech', dueAt: null, accepted: true },
  });
  const accounts = [{ id: 'artist', name: 'Synthetic artist', role: 'Artist' }, { id: 'tech', name: 'Synthetic technician', role: 'Technical' }];
  assert.equal(treatmentBlocker(t, artistStep, accounts, 'en'), 'Missing: the trial photograph — Synthetic technician must upload it.');
  assert.match(treatmentBlocker(t, artistStep, accounts, 'ar'), /صورة العيّنة.*Synthetic technician/);
  t.assignment!.accepted = false;
  assert.equal(treatmentBlocker(t, artistStep, accounts, 'en'), 'Missing: acceptance of the task — Synthetic technician must accept it.');
  t.assignment = null;
  assert.match(treatmentBlocker(t, artistStep, accounts, 'en'), /named technician and deadline.*Coordinator must assign them/);
});

test('authorization blockers respect the named decision-maker and do not reuse an earlier revision', () => {
  const artistStep = step('tArtist', { ownerRole: 'Artist', ownerId: 'artist' });
  const t = treatment([artistStep], {
    current: { ...revision, decisionMaker: { ...revision.decisionMaker, accountId: 'decision-maker' } },
    authorizations: [{ id: 'old', revision: 1, mode: 'SADU_APPROVAL', performedInSadu: true, actorId: 'decision-maker', at: revision.at }],
  });
  assert.equal(treatmentBlocker(t, artistStep, [], 'en'), 'Missing: authorization of this revision — Synthetic representative must approve it.');
  assert.equal(treatmentBlocker(t, { ...artistStep, state: 'done' }, [], 'en'), '');
  assert.equal(treatmentBlocker(t, { ...artistStep, canAct: true }, [], 'en'), '');
});

test('a requested replacement photograph remains the technician’s task', () => {
  const artistStep = step('tArtist', { ownerRole: 'Artist', ownerId: 'artist' });
  const t = treatment([artistStep], {
    authorizations: [{ id: 'a', revision: 2, mode: 'EXTERNAL_PERMISSION', performedInSadu: false, actorId: 'gc', at: revision.at }],
    assignment: { ownerId: 'tech', dueAt: null, accepted: true },
    trials: [{ id: 'trial', revision: 2, evidenceId: 'photo', sampleHash: 'hash', note: null, actorId: 'tech', at: revision.at, supersededAt: null,
      decision: { decision: 'REQUEST_CHANGES', note: 'Try again.', actorId: 'artist', at: revision.at, evidenceId: 'photo' } }],
  });
  assert.equal(treatmentBlocker(t, artistStep, ops(t).accounts, 'en'), 'Missing: a new photograph — Technical must upload it.');
});

test('each role sees only its own treatment steps and the server decides who can act', () => {
  const t = treatment([step('tRecord', { state: 'done', ownerRole: 'General_Exhibition_Coordinator' }), step('tSample', { state: 'now', assign: true }), step('tArtist', { ownerRole: 'Artist' }), step('tFinancial', { ownerRole: 'Finance' })]);
  const gc = workspaceTasks(ops(t), undefined, { id: 'gc', role: 'General_Exhibition_Coordinator' });
  assert.equal(gc.length, 4); assert.equal(gc.find(x => x.key === 'tSample')?.status, 'now'); assert.equal(gc.find(x => x.key === 'tSample')?.legacyKey, 'treatment-trial');
  assert.equal(gc.find(x => x.key === 'tRecord')?.status, 'complete');
  const artist = workspaceTasks(ops(t), undefined, { id: 'pilot-Artist', role: 'Artist' });
  assert.deepEqual(artist.map(x => x.key), ['tArtist']); assert.equal(artist[0].status, 'waiting'); assert.equal(artist[0].canAct, false);
  const finance = workspaceTasks(ops(t), undefined, { id: 'fin', role: 'Finance' });
  assert.deepEqual(finance.map(x => x.key), ['tFinancial']);
});

test('technician acceptance precedes work and the accepted technician gets the action', () => {
  const pending = workspaceTasks(ops(treatment([step('tSample', { state: 'now', ownerId: 'tech', acceptance: true })])), undefined, { id: 'tech', role: 'Technical' })[0];
  assert.equal(pending.acceptance, 'legacy'); assert.equal(pending.canAct, false); assert.equal(pending.status, 'now');
  const accepted = workspaceTasks(ops(treatment([step('tSample', { state: 'now', ownerId: 'tech', canAct: true })])), undefined, { id: 'tech', role: 'Technical' })[0];
  assert.equal(accepted.canAct, true); assert.equal(accepted.acceptance, undefined);
});

test('the trial form is blocked until an actual photograph is chosen and shown', () => {
  const view = ops(treatment([step('tSample', { state: 'now', ownerId: 'tech', canAct: true })]));
  const task = workspaceTasks(view, undefined, { id: 'tech', role: 'Technical' })[0];
  const render = (language: 'ar' | 'en', evidenceId = '', evidenceReady = false) => renderToStaticMarkup(createElement(OperationalForms, { task, ops: view, actor: { id: 'tech', role: 'Technical' }, language, disabled: false, mark: () => {}, run: noop, evidenceId, evidenceReady, onEvidence: () => {} }));
  const arabic = render('ar'), english = render('en');
  assert.match(arabic, /إرسال التجربة لمراجعة الفنان/); assert.match(english, /Submit the trial for artist review/);
  assert.match(arabic, /<button[^>]*disabled=""[^>]*>إرسال التجربة/, 'No photograph selected: the submit button is disabled');
  assert.match(english, /Optional note/, 'Explanations remain optional');
});

test('summary labels recorded external permission as not an approval made in SADU, using logical styling only', () => {
  const t = treatment([step('tAuthorize', { state: 'done', ownerRole: 'General_Exhibition_Coordinator' })], { authorizations: [{ id: 'a', revision: 2, mode: 'EXTERNAL_PERMISSION', performedInSadu: false, actorId: 'gc', at: '2026-10-05T11:00:00Z', grantor: 'Synthetic representative' }] });
  const en = renderToStaticMarkup(createElement(TreatmentSummary, { treatment: t, accounts: [], language: 'en', open: true }));
  assert.match(en, /Recorded external permission \(the decision was not made in SADU\)/); assert.match(en, /Synthetic scenario/);
  const ar = renderToStaticMarkup(createElement(TreatmentSummary, { treatment: t, accounts: [], language: 'ar', open: true }));
  assert.match(ar, /إذن خارجي مُسجَّل/); assert.doesNotMatch(ar + en, /\b(?:pl|pr|ml|mr)-\d|text-left|text-right/);
});
