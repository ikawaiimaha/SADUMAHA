import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CASE_ID, createLivingRecord, livingRecordReducer as reduce, selectLivingRecord, DemoActor, DemoAction } from '../src/data/livingRecord.ts';
import { selectDirectoratePortfolio } from '../src/data/directoratePortfolio.ts';
import { PRINT_ROUTE_ID, selectPublishingRecord } from '../src/data/publishingRecord.ts';
import { selectChairmanBrief } from '../src/data/chairmanBrief.ts';
const at = '2026-09-18T08:00:00.000Z';
const arrival = { type: 'RECEIVE', actor: 'LOGISTICS', crateId: CASE_ID, sealMatches: true, at } as const;
const report = { type: 'CONDITION', actor: 'TECHNICAL', outcome: 'clear', at } as const;
const accept = { type: 'ACCEPT', actor: 'MANAGER', reportVersion: 1, acknowledged: true, at } as const;
const actors: DemoActor[] = ['CHAIRMAN', 'DIRECTORATE', 'MANAGER', 'LOGISTICS', 'TECHNICAL', 'COORDINATOR', 'FINANCE', 'PUBLISHING_MANAGER', 'OBSERVER'];

test('receipt and evidence do not independently clear the executive readiness gate', () => {
  let state = createLivingRecord();
  assert.equal(selectLivingRecord(state).readyCount, 0);
  assert.equal(selectLivingRecord(state).evidencePercent, 60);
  state = reduce(state, arrival);
  assert.equal(selectLivingRecord(state).readyCount, 0);
  assert.equal(selectLivingRecord(state).evidencePercent, 80);
  state = reduce(state, report);
  assert.equal(selectLivingRecord(state).readyCount, 0);
  assert.equal(selectLivingRecord(state).evidencePercent, 100);
  state = reduce(state, accept);
  assert.equal(selectLivingRecord(state).readyCount, 1);
  assert.equal(state.events.length, 3);
  assert.equal(state.acceptance?.reportId, 'DEMO-CR-04');
  assert.equal(state.acceptance?.actor, 'MANAGER');
});

test('all out-of-sequence, mismatched, unacknowledged and wrong-role attempts are inert', () => {
  const empty = createLivingRecord();
  assert.equal(reduce(empty, report), empty);
  assert.equal(reduce(empty, accept), empty);
  const mismatch = reduce(empty, { ...arrival, crateId: 'WRONG' });
  assert.equal(mismatch.receiptIssue, true);
  assert.equal(reduce(mismatch, report), mismatch);
  const arrived = reduce(mismatch, arrival);
  assert.equal(arrived.receiptIssue, false);
  assert.equal(arrived.events[0].kind, 'receipt-issue');
  const ready = reduce(arrived, report);
  assert.equal(reduce(ready, { ...accept, acknowledged: false }), ready);
  for (const actor of actors) {
    if (actor !== 'LOGISTICS') assert.equal(reduce(empty, { ...arrival, actor }), empty);
    if (actor !== 'TECHNICAL') assert.equal(reduce(arrived, { ...report, actor }), arrived);
    if (actor !== 'MANAGER') assert.equal(reduce(ready, { ...accept, actor }), ready);
  }
});

test('condition discrepancies block acceptance and a new report invalidates a stale review', () => {
  let state = reduce(createLivingRecord(), arrival);
  state = reduce(state, { ...report, outcome: 'issue' });
  assert.equal(reduce(state, accept), state);
  assert.equal(selectLivingRecord(state).nextActor, 'TECHNICAL');
  state = reduce(state, report);
  assert.equal(state.condition?.version, 2);
  assert.deepEqual(state.conditionHistory.map(item => [item.version, item.outcome]), [[1, 'issue'], [2, 'clear']]);
  assert.equal(reduce(state, accept), state);
  assert.equal(reduce(state, { ...accept, reportVersion: 2 }).acceptance?.reportVersion, 2);
});

test('accepted handover cannot be rewritten or double-submitted', () => {
  const state = reduce(reduce(reduce(createLivingRecord(), arrival), report), accept);
  for (const action of [arrival, report, accept, { ...report, outcome: 'issue' } as DemoAction]) assert.equal(reduce(state, action), state);
});

test('missing statement changes evidence completeness independently and requires assigned follow-up', () => {
  const complete = reduce(reduce(reduce(createLivingRecord(), arrival), report), accept);
  let state = reduce(complete, { type: 'FLAG_STATEMENT', actor: 'COORDINATOR', at });
  assert.equal(selectLivingRecord(state).evidencePercent, 80);
  assert.equal(selectLivingRecord(state).readyCount, 1);
  assert.equal(reduce(state, { type: 'RESTORE_STATEMENT', actor: 'COORDINATOR', at }), state);
  state = reduce(state, { type: 'ASSIGN_STATEMENT', actor: 'MANAGER', at });
  state = reduce(state, { type: 'RESTORE_STATEMENT', actor: 'COORDINATOR', at });
  assert.equal(selectLivingRecord(state).evidencePercent, 100);
  assert.equal(state.statementTask, false);
});

test('Finance and the assigned manager must each act before an executive review item appears', () => {
  let state = createLivingRecord();
  const escalate = { type: 'ESCALATE_FINANCE', actor: 'MANAGER', at } as const;
  assert.equal(reduce(state, escalate), state);
  state = reduce(state, { type: 'SUBMIT_FINANCE', actor: 'FINANCE', at });
  assert.equal(selectLivingRecord(state).executiveQueue, 0);
  assert.equal(reduce(state, { ...escalate, actor: 'FINANCE' }), state);
  state = reduce(state, escalate);
  assert.equal(selectLivingRecord(state).executiveQueue, 1);
  assert.equal(reduce(state, escalate), state);
});

test('invalid timestamps cannot enter history and reset clears only the fictional session state', () => {
  const initial = createLivingRecord();
  assert.equal(reduce(initial, { ...arrival, at: 'invalid' }), initial);
  const state = reduce(reduce(initial, arrival), report);
  assert.deepEqual(reduce(state, { type: 'RESET' }), initial);
  assert.equal(state.events.length, 2);
});

test('Directorate cannot execute routine manager, technical, logistics or finance actions', () => {
  const ready = reduce(reduce(createLivingRecord(), arrival), report);
  const missing = reduce(ready, { type: 'FLAG_STATEMENT', actor: 'COORDINATOR', at });
  const submitted = reduce(missing, { type: 'SUBMIT_FINANCE', actor: 'FINANCE', at });
  for (const action of [arrival, report, accept,
    { type: 'ASSIGN_STATEMENT', at }, { type: 'SUBMIT_FINANCE', at },
    { type: 'ESCALATE_FINANCE', at }, { type: 'ESCALATE_DELIVERY', at },
  ]) assert.equal(reduce(submitted, { ...action, actor: 'DIRECTORATE' } as DemoAction), submitted);
  assert.equal(selectLivingRecord(ready).nextActor, 'MANAGER');
});

test('Directorate sees reported forecasts and explicit manager escalations without inventing programme progress', () => {
  let state = createLivingRecord();
  assert.equal(selectDirectoratePortfolio(state).areas.length, 3);
  assert.equal(selectDirectoratePortfolio(state).reportedCount, 1);
  assert.equal(selectDirectoratePortfolio(state).awaitingUpdateCount, 10);
  assert.equal(selectDirectoratePortfolio(state).activities.length, 11);
  assert.equal(selectDirectoratePortfolio(state).activitiesAtRisk, 1);
  assert.equal(selectDirectoratePortfolio(state).escalations.length, 0);
  for (const actor of actors.filter(actor => actor !== 'MANAGER')) {
    assert.equal(reduce(state, { type: 'ESCALATE_DELIVERY', actor, at }), state);
  }
  state = reduce(state, { type: 'ESCALATE_DELIVERY', actor: 'MANAGER', at });
  assert.equal(selectDirectoratePortfolio(state).escalations.length, 1);
  assert.equal(reduce(state, { type: 'ESCALATE_DELIVERY', actor: 'MANAGER', at }), state);
  state = reduce(reduce(reduce(state, arrival), report), accept);
  const overview = selectDirectoratePortfolio(state);
  assert.equal(overview.reportedCount, 1);
  assert.equal(overview.awaitingUpdateCount, 10);
  assert.equal(overview.activities.filter(activity => activity.forecast === 'on-track').length, 1);
  assert.equal(overview.activitiesAtRisk, 0);
  assert.equal(overview.escalations.length, 0);
  assert.equal(selectLivingRecord(state).readyCount, 1);
  assert.equal(state.events.filter(event => event.kind === 'delivery-escalated').length, 1);
  assert.equal(reduce(state, { type: 'ESCALATE_DELIVERY', actor: 'MANAGER', at }), state);
});

test('portfolio filters isolate areas while summary totals remain scoped to the whole portfolio', () => {
  const state = createLivingRecord();
  for (const [area, count] of [['awards', 3], ['programmes', 6], ['publishing', 2]] as const) {
    const portfolio = selectDirectoratePortfolio(state, area);
    assert.equal(portfolio.visibleActivities.length, count);
    assert.ok(portfolio.visibleActivities.every(activity => activity.area === area));
    assert.equal(portfolio.activities.length, 11);
    assert.equal(portfolio.reportedCount, 1);
    assert.equal(portfolio.activitiesAtRisk, 1);
  }
  const references = selectDirectoratePortfolio(state).activities.filter(activity => activity.scope !== 'fictional-case');
  assert.ok(references.every(activity => activity.source && !activity.due && !activity.managerEn && !activity.escalated && activity.forecast === 'awaiting-update'));
  assert.equal(references.find(activity => activity.id === 'REF-MAGAZINES')?.scope, 'department-output');
});

const attachProof = { type: 'ATTACH_PRINT_PROOF', actor: 'COORDINATOR', at } as const;
const routeProof = { type: 'ROUTE_PRINT_PROOF', actor: 'PUBLISHING_MANAGER', version: 1, editorialChecked: true, rightsChecked: true, route: PRINT_ROUTE_ID, at } as const;
const releaseProof = { type: 'DECIDE_PRINT_PROOF', actor: 'CHAIRMAN', version: 1, acknowledged: true, outcome: 'release', at } as const;
const dispatchProof = { type: 'RECORD_PRINT_DISPATCH', actor: 'PUBLISHING_MANAGER', version: 1, at } as const;

test('attaching a proof updates publishing but does not enter the Chairman queue', () => {
  const initial = createLivingRecord();
  assert.equal(reduce(initial, routeProof), initial);
  assert.equal(reduce(initial, releaseProof), initial);
  let state = reduce(initial, attachProof);
  assert.equal(selectPublishingRecord(state.publishing).stage, 'manager-review');
  assert.equal(selectChairmanBrief(state).executiveQueue, 0);
  for (const change of [{ editorialChecked: false }, { rightsChecked: false }, { route: 'unverified' }, { version: 2 }]) {
    assert.equal(reduce(state, { ...routeProof, ...change }), state);
  }
  state = reduce(state, routeProof);
  assert.equal(selectChairmanBrief(state).executiveQueue, 1);
  assert.equal(selectPublishingRecord(state.publishing).stage, 'executive-review');
  assert.equal(reduce(state, routeProof), state);
});

test('only assigned sample roles can attach, route, decide or record print dispatch', () => {
  const initial = createLivingRecord();
  const attached = reduce(initial, attachProof);
  const queued = reduce(attached, routeProof);
  const released = reduce(queued, releaseProof);
  for (const actor of actors) {
    if (actor !== 'COORDINATOR') assert.equal(reduce(initial, { ...attachProof, actor }), initial);
    if (actor !== 'PUBLISHING_MANAGER') assert.equal(reduce(attached, { ...routeProof, actor }), attached);
    if (actor !== 'CHAIRMAN') assert.equal(reduce(queued, { ...releaseProof, actor }), queued);
    if (actor !== 'PUBLISHING_MANAGER') assert.equal(reduce(released, { ...dispatchProof, actor }), released);
  }
  assert.equal(reduce(queued, { ...releaseProof, acknowledged: false }), queued);
});

test('executive decision and printer dispatch are separate, version-bound events', () => {
  const queued = reduce(reduce(createLivingRecord(), attachProof), routeProof);
  assert.equal(reduce(queued, dispatchProof), queued);
  const released = reduce(queued, releaseProof);
  assert.equal(selectChairmanBrief(released).executiveQueue, 0);
  assert.equal(selectPublishingRecord(released.publishing).stage, 'released');
  assert.equal(released.publishing.dispatch, null);
  assert.equal(reduce(released, releaseProof), released);
  const sent = reduce(released, dispatchProof);
  assert.equal(selectPublishingRecord(sent.publishing).stage, 'sent');
  assert.equal(reduce(sent, dispatchProof), sent);
  assert.equal(reduce(sent, attachProof), sent);
  assert.equal(sent.events.length, 4);
});

test('new proof versions invalidate queued and released versions without losing prior events', () => {
  const queued = reduce(reduce(createLivingRecord(), attachProof), routeProof);
  const revisedQueue = reduce(queued, attachProof);
  assert.equal(selectChairmanBrief(revisedQueue).executiveQueue, 0);
  assert.equal(reduce(revisedQueue, releaseProof), revisedQueue);
  const released = reduce(queued, releaseProof);
  const revisedRelease = reduce(released, attachProof);
  assert.equal(revisedRelease.publishing.version, 2);
  assert.equal(revisedRelease.publishing.review, null);
  assert.equal(revisedRelease.publishing.decision, null);
  assert.equal(reduce(revisedRelease, dispatchProof), revisedRelease);
  assert.equal(revisedRelease.publishing.proofs.length, 2);
  assert.ok(revisedRelease.events.some(event => event.reference === 'DEMO-PUB-01/v1/release'));
  const requeued = reduce(revisedRelease, { ...routeProof, version: 2 });
  assert.equal(selectChairmanBrief(requeued).executiveQueue, 1);
});

test('returned proofs require revision and unknown magazine cycles remain unknown', () => {
  const queued = reduce(reduce(createLivingRecord(), attachProof), routeProof);
  const returned = reduce(queued, { ...releaseProof, outcome: 'return' });
  assert.equal(selectPublishingRecord(returned.publishing).stage, 'returned');
  assert.equal(reduce(returned, dispatchProof), returned);
  assert.equal(reduce(returned, routeProof), returned);
  const revised = reduce(returned, attachProof);
  assert.equal(selectPublishingRecord(revised.publishing).stage, 'manager-review');
  const brief = selectChairmanBrief(revised);
  assert.equal(brief.units.length, 4);
  assert.equal(brief.magazineCycles.length, 7);
  assert.ok(brief.magazineCycles.every(cycle => cycle.stage === 'awaiting-report'));
  assert.equal(brief.units.find(unit => unit.id === 'theatre')?.state, 'awaiting-report');
  assert.equal(brief.units.find(unit => unit.id === 'regional')?.state, 'awaiting-report');
});

test('finance and publishing queue items aggregate independently; reset clears both', () => {
  let state = reduce(reduce(createLivingRecord(), attachProof), routeProof);
  state = reduce(state, { type: 'SUBMIT_FINANCE', actor: 'FINANCE', at });
  state = reduce(state, { type: 'ESCALATE_FINANCE', actor: 'MANAGER', at });
  assert.equal(selectChairmanBrief(state).executiveQueue, 2);
  assert.equal(selectLivingRecord(state).executiveQueue, 2);
  state = reduce(state, releaseProof);
  assert.equal(selectChairmanBrief(state).executiveQueue, 1);
  assert.deepEqual(reduce(state, { type: 'RESET' }), createLivingRecord());
  assert.equal(reduce(state, { ...attachProof, at: 'invalid' }), state);
});
