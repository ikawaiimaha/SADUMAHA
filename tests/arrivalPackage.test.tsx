import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { airportService, arrivalPreviewReady, type ArrivalDraft } from '../src/data/arrivalPackage';
import { ArrivalPackagePreview } from '../src/components/ArrivalPackagePreview';
const reviewed: ArrivalDraft = {airport:'DXB',flight:'DEMO 101',terminal:'3',arrivalLocal:'2026-10-03T01:30',identityReviewed:true,itineraryReviewed:true,juryGuideIncluded:true};
test('airport routing never falls back to a different provider', () => {
  assert.equal(airportService('DXB'),'Marhaba');
  assert.equal(airportService('SHJ'),'Hala');
  for (const code of ['', 'OTHER', 'AUH']) {
    assert.equal(airportService(code),null);
    assert.equal(arrivalPreviewReady({...reviewed,airport:code}),false);
  }
});
test('preview requires itinerary and all human review checks', () => {
  assert.equal(arrivalPreviewReady(reviewed),true);
  for(const field of ['identityReviewed','itineraryReviewed','juryGuideIncluded'] as const) assert.equal(arrivalPreviewReady({...reviewed,[field]:false}),false);
  for(const field of ['flight','terminal','arrivalLocal'] as const) assert.equal(arrivalPreviewReady({...reviewed,[field]:''}),false);
  for (const arrivalLocal of ['2026-99-99T25:00','2026-02-31T01:30']) assert.equal(arrivalPreviewReady({...reviewed,arrivalLocal}),false);
});
test('initial UI clearly marks a local unverified preview and has no dispatch or upload', () => {
  const html=renderToStaticMarkup(<ArrivalPackagePreview isAr={false} artistName="Fictional artist"/>);
  assert.match(html,/Sample data \/ Unverified/);
  assert.match(html,/draft resets/);
  assert.match(html,/disabled=""/);
  assert.doesNotMatch(html,/type="file"|href=|chat.whatsapp|mailto:/);
});
