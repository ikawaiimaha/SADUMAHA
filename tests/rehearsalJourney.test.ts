import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOURNEY_TASKS, createJourney, currentDecision, journeyReducer, ledgerRows, taskById, taskStatus, type JourneyState, type TaskId } from '../src/data/rehearsalJourney';
const at = '2026-09-29T18:00:00Z';
function reported(state: JourneyState, id: TaskId, source: 'Verbal instruction' | 'Email' = 'Verbal instruction') {
  return journeyReducer(state, { type: 'record', id: `${id}-${state.decisions.length}`, at, actor: 'Coordinator', draft: { taskId: id, source, speaker: 'Sample colleague', occurredAt: at, statement: `Review ${id} for the sample artist.` } });
}
function complete(state: JourneyState, id: TaskId) {
  const task = taskById(id); let next = reported(state, id);
  const decisionId = currentDecision(next, id)!.id;
  next = journeyReducer(next, { type: 'confirm', decisionId, at, actor: task.owner, outcome: 'confirmed', note: 'Sample scope confirmed.' });
  return journeyReducer(next, { type: 'complete', taskId: id, decisionId, at, actor: task.owner, checks: task.checks.map(() => true) });
}
test('verbal and email records need attribution but no invented document; recording is not approval', () => {
  for (const source of ['Verbal instruction', 'Email'] as const) {
    const state = reported(createJourney(), 'brief', source);
    assert.equal(state.decisions.length, 1); assert.equal(state.decisions[0].reference, undefined);
    assert.equal(taskStatus(state, taskById('brief')), 'Needs confirmation'); assert.deepEqual(state.completed, {});
    const action = { type: 'confirm' as const, decisionId: state.decisions[0].id, at, actor: 'Finance' as const, outcome: 'confirmed' as const, note: 'Wrong desk' };
    assert.equal(journeyReducer(state, action), state);
  }
});
test('a dispute blocks completion and corrected statements preserve immutable history', () => {
  let state = reported(createJourney(), 'brief'); const id = state.decisions[0].id;
  state = journeyReducer(state, { type: 'confirm', decisionId: id, at, actor: 'Committee', outcome: 'disputed', note: 'Scope misunderstood.' });
  assert.equal(taskStatus(state, taskById('brief')), 'Disputed');
  assert.equal(journeyReducer(state, { type: 'complete', taskId: 'brief', decisionId: id, at, actor: 'Committee', checks: [true] }), state);
  const next = reported(state, 'brief'); assert.equal(next.decisions[0], state.decisions[0]);
  assert.equal(journeyReducer(next, { type: 'confirm', decisionId: id, at, actor: 'Committee', outcome: 'confirmed', note: 'Cannot overwrite' }), next);
});
test('complete journey enforces independent Finance gates, no arrival for advance, and no duplicate payments', () => {
  let state = createJourney();
  for (const id of ['brief', 'selection', 'invitation', 'agreement', 'acceptance', 'materials', 'editorial', 'pr'] as TaskId[]) state = complete(state, id);
  let attempt = complete(state, 'advance'); assert.equal(attempt.completed.advance, undefined); assert.equal(ledgerRows(attempt).length, 0);
  state = complete(state, 'technical'); state = complete(state, 'advance');
  assert.equal(state.completed.receipt, undefined); assert.equal(ledgerRows(state)[0].amount, 13500);
  const advance = currentDecision(state, 'advance')!;
  assert.equal(journeyReducer(state, { type: 'complete', taskId: 'advance', decisionId: advance.id, at, actor: 'Finance', checks: [true] }), state);
  assert.equal(complete(state, 'completion').completed.completion, undefined);
  for (const id of ['receipt', 'delivery', 'return', 'completion'] as TaskId[]) state = complete(state, id);
  assert.equal(Object.keys(state.completed).length, JOURNEY_TASKS.length);
  assert.deepEqual(state.completed.technical?.evidence, taskById('technical').checks);
  assert.notEqual(state.completed.technical?.evidence, taskById('technical').checks);
  assert.equal(ledgerRows(state).reduce((sum, r) => sum + r.amount, 0), 45000);
});
test('materials do not wait for Finance and checks cannot be skipped or completed at the wrong desk', () => {
  let state = complete(complete(createJourney(), 'brief'), 'selection');
  assert.equal(taskStatus(state, taskById('materials')), 'Ready'); assert.equal(state.completed.advance, undefined);
  state = reported(state, 'materials'); const id = currentDecision(state, 'materials')!.id;
  state = journeyReducer(state, { type: 'confirm', decisionId: id, at, actor: 'Artist', outcome: 'confirmed', note: 'Reviewed' });
  for (const checks of [[], [true], [true, false, true]]) assert.equal(journeyReducer(state, { type: 'complete', taskId: 'materials', decisionId: id, at, actor: 'Artist', checks }), state);
  assert.equal(journeyReducer(state, { type: 'complete', taskId: 'materials', decisionId: id, at, actor: 'Coordinator', checks: [true, true, true] }), state);
});
test('unknown tasks, future statements and stale revisions fail closed', () => {
  const state = createJourney();
  for (const draft of [
    { taskId: 'unknown' as TaskId, source: 'Email' as const, speaker: 'Sample', occurredAt: at, statement: 'Test' },
    { taskId: 'brief' as const, source: 'Email' as const, speaker: 'Sample', occurredAt: '2027-01-01', statement: 'Test' },
  ]) assert.equal(journeyReducer(state, { type: 'record', id: 'bad', at, actor: 'Committee', draft }), state);
  const old = reported(state, 'brief'); const revised = { ...old, revision: 2 };
  assert.equal(journeyReducer(revised, { type: 'confirm', decisionId: old.decisions[0].id, at, actor: 'Committee', outcome: 'confirmed', note: 'Old scope' }), revised);
});
