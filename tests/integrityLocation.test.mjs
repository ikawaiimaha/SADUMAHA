import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable, Writable } from 'node:stream';
import { createHash } from 'node:crypto';
import { hashUploadStream, integrityUploadMiddleware, documentHashCaption } from '../server/file-integrity.mjs';
import { arrivalPolicy, checkArrivalLocation, haversineMetres } from '../src/logistics/geofence.mjs';
const sink = () => new Writable({ write(_chunk, _encoding, callback) { callback(); } });
test('stream hash matches exact binary bytes independent of chunks; limits and failures reject', async () => {
  const bytes = Buffer.from([0, 255, 1, 20]);
  const result = await hashUploadStream(Readable.from([bytes.subarray(0, 2), bytes.subarray(2)]), sink());
  assert.equal(result.file_hash, createHash('sha256').update(bytes).digest('hex'));
  assert.equal(result.byte_length, 4);
  assert.match(documentHashCaption(result), /Source document SHA-256:/);
  await assert.rejects(hashUploadStream(Readable.from([bytes]), sink(), { maxBytes: 3 }));
  await assert.rejects(hashUploadStream(Readable.from([]), sink()));
  await assert.rejects(hashUploadStream(Readable.from([bytes]), new Writable({ write(_c, _e, done) { done(new Error('storage failure')); } })));
});
test('middleware never commits metadata after a failed stream', async () => {
  let committed = false;
  const middleware = integrityUploadMiddleware({ authorize: async () => ({ actorId: 'a', entityId: 'e' }), openStaging: async () => ({ objectId: 's', stream: sink() }), saveDocument: async () => { committed = true; }, maxBytes: 1 });
  await new Promise(resolve => middleware({ fileStream: Readable.from([Buffer.from('too large')]) }, { locals: {} }, error => { assert.ok(error); resolve(); }));
  assert.equal(committed, false);
});
test('location gate handles missing config, boundary, uncertainty, stale fixes and invalid coordinates', () => {
  const now = 100000, policy = { required: true, latitude: 0, longitude: 0, radiusMetres: 200 };
  const fix = { latitude: 0, longitude: 0, accuracy: 10, timestamp: now };
  assert.equal(checkArrivalLocation(policy, fix, now).allowed, true);
  assert.equal(checkArrivalLocation(policy, { ...fix, latitude: 0.003 }, now).allowed, false);
  assert.equal(checkArrivalLocation(policy, { ...fix, accuracy: 201 }, now).allowed, false);
  assert.equal(checkArrivalLocation(policy, { ...fix, timestamp: now - 60001 }, now).allowed, false);
  assert.equal(checkArrivalLocation(policy, { ...fix, latitude: 91 }, now).allowed, false);
  assert.equal(checkArrivalLocation(arrivalPolicy({ SADU_REQUIRE_ARRIVAL_LOCATION: 'true' }), fix, now).allowed, false);
  assert.equal(checkArrivalLocation(arrivalPolicy({}), undefined, now).allowed, true);
  assert.ok(Math.abs(haversineMetres({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }) - 111195) < 1);
});
