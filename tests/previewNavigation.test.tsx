import test from 'node:test';
import React from 'react';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import RehearsalJourney from '../src/components/RehearsalJourney';
import PreviewUnavailable from '../src/components/PreviewUnavailable';
import { isLocalPreview, normalizePreviewPath, journeyPaths, pausedPaths } from '../src/lib/previewRoutes';
import { JOURNEY_TASKS } from '../src/data/rehearsalJourney';
import { emptyJournal, journalReducer, serializeJournal } from '../src/data/journeyJournal';

test('every preview navigation destination has an exact SPA rewrite; APIs and unknown URLs do not', () => {
  const routes = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')).routes;
  const rewrites = routes.filter(r => r.dest === '/index.html').map(r => new RegExp(`^${r.src}`));
  for (const path of [...journeyPaths.filter(p => p !== '/'), '/overview', '/review', ...pausedPaths]) {
    assert.ok(rewrites.some(re => re.test(path)), path);
    assert.ok(rewrites.some(re => re.test(path + '/')), `${path}/`);
    assert.equal(normalizePreviewPath(path + '/'), path);
  }
  for (const path of ['/api/review/session', '/assets/missing.js', '/review/unknown', '/unknown']) assert.ok(!rewrites.some(re => re.test(path)), path);
  assert.equal(isLocalPreview('sadumaha.vercel.app'), false);
  assert.equal(isLocalPreview('localhost.example.org'), false);
  assert.equal(isLocalPreview('127.0.0.1'), true);
});

test('hosted availability screen explains the boundary and provides a working route back', () => {
  const html = renderToStaticMarkup(<PreviewUnavailable review />);
  assert.match(html, /Advanced review is available locally/);
  assert.match(html, /href="\/journey"/);
  assert.doesNotMatch(html, /<select|<form|npm run/);
});

test('journey resumes pending work, numbers tasks uniquely and has no dead completion button', () => {
  let journal = emptyJournal();
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { hostname: 'sadumaha.vercel.app' } } });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: () => serializeJournal(journal) } });
  try {
    const complete = task => { journal = journalReducer(journal, { type: 'portal_complete', taskId: task.id, actor: task.owner, at: '2026-09-29T12:00:00Z', id: `navigation-${task.id}`, checks: task.checks.map(() => true) }); };
    complete(JOURNEY_TASKS[0]);
    let html = renderToStaticMarkup(<RehearsalJourney />);
    assert.match(html, /Continue: Record the artist selection/);
    assert.match(html, /Advanced review · local service only/);
    assert.match(html, /14\. Authorize the sample completion tranche/);
    for (const task of JOURNEY_TASKS.slice(1)) complete(task);
    html = renderToStaticMarkup(<RehearsalJourney />);
    assert.match(html, /Journey complete/);
    assert.match(html, /Export your review record/);
    assert.doesNotMatch(html, />All tasks complete<|>Open next available task<|>Continue:/);
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow); else delete globalThis.window;
    if (originalStorage) Object.defineProperty(globalThis, 'sessionStorage', originalStorage); else delete globalThis.sessionStorage;
  }
});
