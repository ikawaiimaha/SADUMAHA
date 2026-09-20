import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sampleIntakeDraft, sampleProposal, recoverableDraft, isIntakeDraft, findIntakeProgramme, validateIntake, ARTIST_ID, INTAKE_PROGRAMMES, type IntakeSubmission } from '../src/data/artistIntake';
import { intakeWorkflowReducer as reduce, selectIntakeWorkflow, type IntakeWorkflow } from '../src/data/intakeWorkflow';
import { registerProfile, seedRoster, reviewRoster, createRosterProgramme } from '../src/data/artistRoster';
import { calculateDynamicWordCount, calculateGatePercentage } from '../src/utils/metrics';
import { editorialSamples, EDITORIAL_PROGRAMME_ID, recordEditorialCheck } from '../src/data/editorialSamples';
const at = '2026-09-20T08:00:00Z';
const submission = (programmeId = 'DEMO-CALL-01', version = 1): IntakeSubmission => ({ id: `${programmeId}/proposal-${version}`, programmeId, version, at, snapshot: sampleIntakeDraft(), assets: [], status: 'received', note: '' });
const empty = (): IntakeWorkflow => ({ submissions: [], deliveries: [] });
function activated(programmeId = 'DEMO-CALL-01') {
  let state = reduce(empty(), { type: 'SUBMIT', submission: submission(programmeId) });
  state = reduce(state, { type: 'REVIEW', id: state.submissions[0].id, actor: 'COORDINATOR', outcome: 'checked', note: '', at });
  return reduce(state, { type: 'ACTIVATE', id: state.submissions[0].id, actor: 'SELECTION', acknowledged: true, at });
}
test('sample proposal changes only its selected programme and preserves the shared identity', () => {
  const draft = sampleIntakeDraft(); draft.profile.nameEn = 'Keep my name'; draft.proposals['DEMO-CALL-01'].conceptEn = 'Keep first draft';
  draft.proposals['DEMO-CALL-02'] = sampleProposal('DEMO-CALL-02');
  assert.equal(draft.profile.nameEn, 'Keep my name'); assert.equal(draft.proposals['DEMO-CALL-01'].conceptEn, 'Keep first draft');
  assert.equal(draft.proposals['DEMO-CALL-02'].programmeId, 'DEMO-CALL-02');
});
test('roster eligibility needs a simulated coordinator check and edits return it to pending', () => {
  let roster = registerProfile(seedRoster(), sampleIntakeDraft().profile, [], at);
  assert.equal(reviewRoster(roster, ARTIST_ID, 'DIRECTORATE', at), roster);
  roster = reviewRoster(roster, ARTIST_ID, 'COORDINATOR', at);
  assert.equal(roster.at(-1)?.reviewedBy, 'DEMO-COORDINATOR');
  const programme = createRosterProgramme(roster, { id: 'DEMO-PROGRAMME-new', titleEn: 'New', titleAr: 'جديد', artistIds: [ARTIST_ID], createdAt: at });
  assert.ok(programme); assert.equal(registerProfile(roster, sampleIntakeDraft().profile, [], at).at(-1)?.status, 'pending-review');
});
test('dynamic programme briefs and partial proposals survive allowed text recovery, without review status', () => {
  const draft = sampleIntakeDraft(); const id = 'DEMO-PROGRAMME-new';
  draft.programmeBriefs = { [id]: { ...INTAKE_PROGRAMMES[0], id, en: 'New programme', artistIds: [ARTIST_ID] } };
  draft.proposals[id] = sampleProposal(id);
  assert.equal(isIntakeDraft(draft), true); assert.equal(validateIntake(draft, id).length, 0);
  const recovered = recoverableDraft(draft);
  assert.equal(isIntakeDraft(recovered), true); assert.equal(findIntakeProgramme(recovered, id)?.en, 'New programme');
  assert.equal(recovered.proposals[id].titleAr, 'طبقات الذاكرة'); assert.equal(recovered.profile.email, '');
  assert.equal(findIntakeProgramme(recovered, 'unknown'), undefined);
  recovered.programmeBriefs![id].budget = NaN; assert.equal(isIntakeDraft(recovered), false);
});
test('completeness is not selection; only a separate acknowledged selection creates one linked asset', () => {
  let state = reduce(empty(), { type: 'SUBMIT', submission: submission() }); const id = state.submissions[0].id;
  assert.equal(reduce(state, { type: 'ACTIVATE', id, actor: 'SELECTION', acknowledged: true, at }), state);
  state = reduce(state, { type: 'REVIEW', id, actor: 'COORDINATOR', outcome: 'checked', note: '', at });
  assert.equal(state.deliveries.length, 0);
  for (const actor of ['COORDINATOR', 'DIRECTORATE', 'CHAIRMAN']) assert.equal(reduce(state, { type: 'ACTIVATE', id, actor, acknowledged: true, at }), state);
  assert.equal(reduce(state, { type: 'ACTIVATE', id, actor: 'SELECTION', acknowledged: false, at }), state);
  state = reduce(state, { type: 'ACTIVATE', id, actor: 'SELECTION', acknowledged: true, at });
  assert.equal(state.deliveries[0].proposalId, id); assert.equal(state.deliveries[0].artistId, ARTIST_ID);
  assert.equal(reduce(state, { type: 'ACTIVATE', id, actor: 'SELECTION', acknowledged: true, at }), state);
});
test('revision preserves old versions and only a checked latest version can activate', () => {
  let state = reduce(empty(), { type: 'SUBMIT', submission: submission() });
  state = reduce(state, { type: 'REVIEW', id: state.submissions[0].id, actor: 'COORDINATOR', outcome: 'revision', note: 'Clarify materials', at });
  state = reduce(state, { type: 'SUBMIT', submission: submission('DEMO-CALL-01', 2) });
  state = reduce(state, { type: 'REVIEW', id: state.submissions[1].id, actor: 'COORDINATOR', outcome: 'checked', note: '', at });
  assert.equal(reduce(state, { type: 'ACTIVATE', id: state.submissions[0].id, actor: 'SELECTION', acknowledged: true, at }), state);
  state = reduce(state, { type: 'ACTIVATE', id: state.submissions[1].id, actor: 'SELECTION', acknowledged: true, at });
  assert.equal(state.deliveries[0].proposalVersion, 2); assert.equal(state.submissions[0].note, 'Clarify materials');
});
test('linked custody enforces sequence, role, identity and exact evidence version; summaries share state', () => {
  let state = activated(); const id = state.deliveries[0].id;
  const act = (action: Parameters<typeof reduce>[1] & { type: 'DELIVERY' }) => { state = reduce(state, action); };
  act({ type: 'DELIVERY', id, action: { type: 'CONDITION', actor: 'TECHNICAL', outcome: 'clear', at } });
  assert.equal(state.deliveries[0].record.condition, null);
  act({ type: 'DELIVERY', id, action: { type: 'RECEIVE', actor: 'LOGISTICS', crateId: 'DEMO-MF-04', sealMatches: true, at } });
  assert.equal(state.deliveries[0].record.receiptIssue, true);
  act({ type: 'DELIVERY', id, action: { type: 'RECEIVE', actor: 'LOGISTICS', crateId: id, sealMatches: true, at } });
  for (const outcome of ['issue', 'clear'] as const) act({ type: 'DELIVERY', id, action: { type: 'CONDITION', actor: 'TECHNICAL', outcome, at } });
  for (const [actor, reportVersion] of [['DIRECTORATE', 2], ['MANAGER', 1]] as const) {
    act({ type: 'DELIVERY', id, action: { type: 'ACCEPT', actor, reportVersion, acknowledged: true, at } });
    assert.equal(selectIntakeWorkflow(state).accepted, 0);
  }
  act({ type: 'DELIVERY', id, action: { type: 'ACCEPT', actor: 'MANAGER', reportVersion: 2, acknowledged: true, at } });
  assert.equal(selectIntakeWorkflow(state).accepted, 1); assert.equal(selectIntakeWorkflow(state, 'other').total, 0);
  const record = state.deliveries[0].record;
  act({ type: 'DELIVERY', id, action: { type: 'CONDITION', actor: 'TECHNICAL', outcome: 'issue', at } });
  assert.equal(state.deliveries[0].record, record);
});
test('two programmes retain independent delivery states and scoped totals', () => {
  const a = activated(); const b = activated('DEMO-CALL-02');
  let state = { submissions: [...a.submissions, ...b.submissions], deliveries: [...a.deliveries, ...b.deliveries] };
  const id = state.deliveries[0].id;
  state = reduce(state, { type: 'DELIVERY', id, action: { type: 'RECEIVE', actor: 'LOGISTICS', crateId: id, sealMatches: true, at } });
  assert.equal(selectIntakeWorkflow(state).received, 1); assert.equal(selectIntakeWorkflow(state).total, 2);
  assert.equal(selectIntakeWorkflow(state, 'DEMO-CALL-02').received, 0);
});
test('editorial records require matching programme and role; counts match displayed English and Arabic', () => {
  const checked = recordEditorialCheck({}, EDITORIAL_PROGRAMME_ID, 'CAT-01', 'EDITORIAL', at);
  assert.equal(Object.keys(checked).length, 1);
  assert.equal(recordEditorialCheck(checked, EDITORIAL_PROGRAMME_ID, 'CAT-01', 'EDITORIAL', at), checked);
  assert.deepEqual(recordEditorialCheck({}, 'other', 'CAT-01', 'EDITORIAL', at), {});
  assert.deepEqual(recordEditorialCheck({}, EDITORIAL_PROGRAMME_ID, 'CAT-01', 'CHAIRMAN', at), {});
  assert.deepEqual(editorialSamples.map(e => calculateDynamicWordCount(e.curatorialStatementEn)), [20, 15]);
  assert.deepEqual(editorialSamples.map(e => calculateDynamicWordCount(e.curatorialStatementAr)), [22, 17]);
  assert.equal(calculateDynamicWordCount('   '), 0); assert.equal(calculateGatePercentage(18, 22), 82);
  assert.equal(calculateGatePercentage(9, 20), 45); assert.equal(calculateGatePercentage(0, 0), 0);
});
