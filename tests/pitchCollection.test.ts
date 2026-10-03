import test from 'node:test';
import assert from 'node:assert/strict';
import { pickupError } from '../src/data/collectionReadiness';

test('presentation pickup window rejects malformed dates and inclusive closure boundaries', () => {
  for (const date of ['', '2026-10-00', '2026-10-32', '2026-09-30', '2026-11-01', '2026-10-10', '2026-10-12', '2026-10-15']) assert.ok(pickupError(date), date);
  for (const date of ['2026-10-01', '2026-10-09', '2026-10-16', '2026-10-31']) assert.equal(pickupError(date), '', date);
});
