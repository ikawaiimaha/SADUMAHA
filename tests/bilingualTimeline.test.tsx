import React from 'react';
import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { BilingualTimeline } from '../src/components/common/BilingualTimeline';
import { CASE_ID, createLivingRecord, livingRecordReducer, type DemoAction, type LivingRecord } from '../src/data/livingRecord';

const at = '2026-09-20T08:01:02.345Z';
const receive = { type: 'RECEIVE', actor: 'LOGISTICS', crateId: CASE_ID, sealMatches: true, at } as const;
const condition = { type: 'CONDITION', actor: 'TECHNICAL', outcome: 'clear', at } as const;
const run = (...actions: DemoAction[]) => actions.reduce(livingRecordReducer, createLivingRecord());
const render = (record: LivingRecord, isArabic = false) => renderToStaticMarkup(<BilingualTimeline
  record={record} isArabic={isArabic} eventLabel={event => event.kind}
  roleLabel={actor => actor} formatTime={timestamp => timestamp}
/>);

test('empty timeline does not invent expected arrival or future steps', () => {
  const html = render(createLivingRecord());
  assert.match(html, /No actions recorded/);
  assert.doesNotMatch(html, /<li|<time|Awaiting next/);
});

test('receipt exception stops progression; corrected receipt preserves history and removes block', () => {
  const mismatch = { ...receive, sealMatches: false };
  const blocked = run(mismatch);
  assert.match(render(blocked), /data-state="blocked"/);
  assert.match(render(blocked), /logistics supervisor review/);
  const recovered = livingRecordReducer(blocked, receive);
  const html = render(recovered);
  assert.doesNotMatch(html, /data-state="blocked"|Handover blocked/);
  assert.match(html, /Earlier exception/);
  assert.equal((html.match(/<li /g) ?? []).length, 2);
});

test('condition outcomes stay bound to report versions when an issue is superseded', () => {
  const blocked = run(receive, { ...condition, outcome: 'issue' });
  assert.match(render(blocked), /technical follow-up/);
  const recovered = livingRecordReducer(blocked, condition);
  const html = render(recovered);
  assert.match(html, /data-state="exception"[\s\S]*discrepancy[\s\S]*DEMO-CR-04\/v1/);
  assert.match(html, /Condition evidence recorded · clear[\s\S]*DEMO-CR-04\/v2/);
  assert.doesNotMatch(html, /data-state="blocked"/);
  const blockedAgain = livingRecordReducer(recovered, { ...condition, outcome: 'issue' });
  assert.equal((render(blockedAgain).match(/data-state="blocked"/g) ?? []).length, 1);
});

test('acknowledgement retains exact actor, version and timestamp without future items', () => {
  const state = run(receive, condition, { type: 'ACCEPT', actor: 'MANAGER', reportVersion: 1, acknowledged: true, at });
  const html = render(state);
  assert.match(html, /data-state="acknowledged"/);
  assert.match(html, /DEMO-MANAGER/);
  assert.match(html, /DEMO-CR-04\/v1/);
  assert.ok(html.includes(`dateTime="${at}"`));
  assert.equal((html.match(/<li /g) ?? []).length, state.events.length);
  assert.doesNotMatch(html, /Awaiting next/);
});

test('Arabic list preserves references and all non-custody events in session order', () => {
  const state = run(receive, { type: 'FLAG_STATEMENT', actor: 'COORDINATOR', at }, { type: 'SUBMIT_FINANCE', actor: 'FINANCE', at });
  const html = render(state, true);
  assert.match(html, /dir="rtl"/);
  assert.match(html, /<ol[^>]*aria-label="التسلسل الزمني لنشاط الجلسة"/);
  assert.match(html, /الدور التجريبي/);
  assert.equal((html.match(/<li /g) ?? []).length, 3);
  for (const event of state.events) assert.ok(html.includes(event.reference));
  assert.ok(html.indexOf('DEMO-E1') < html.indexOf('DEMO-E2'));
  assert.ok(html.indexOf('DEMO-E2') < html.indexOf('DEMO-E3'));
});
