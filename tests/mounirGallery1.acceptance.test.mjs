import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { emptyEcosystem, openEcosystemRepository, createEcosystemControllers } from '../server/unified-ecosystem.mjs';

test('Gallery 1: source mapping → bounded rehearsal layout → paused equipment requests → recovery', async () => {
  const mapping = JSON.parse(await readFile(new URL('./fixtures/mounir-gallery1.json', import.meta.url), 'utf8'));
  assert.equal(mapping.sourceStatus, 'PARTIAL_SOURCE_INSPECTION_UNRESOLVED_EMAILS_AND_APPROVALS');
  const sources = new Set(mapping.sources.map(s => s.id));
  for (const record of [...mapping.walls, ...mapping.works, ...mapping.equipmentClaims, mapping.intervention]) assert.ok(sources.has(record.sourceId));
  for (const question of mapping.openQuestions) {
    assert.ok(question.owner && question.blocks && question.question);
    assert.ok(question.sourceIds.every(id => sources.has(id)));
  }
  for(const source of mapping.sources) {
    if(source.originalAvailable) assert.match(source.sha256,/^[a-f0-9]{64}$/);
    else assert.equal(source.sha256,null);
  }
  const steel=mapping.works.find(w=>w.title==='Heavier Than Words');
  assert.equal(steel.layoutConflict.resolved,false);
  assert.equal(steel.sourceDocumentFacts.applicabilityToCurrentLayoutConfirmed,false);
  assert.deepEqual(steel.sourceDocumentFacts.pedestal_cm,{length:120,width:45,height:80});
  assert.equal(new Set(mapping.works.map(w => w.id)).size, 5);
  assert.equal(mapping.works.filter(w => w.title === 'Technologia').length, 2);
  assert.ok(mapping.works.every(w => w.dimensions_cm === null));
  assert.equal(mapping.floorPolygon, null);
  assert.equal(mapping.ceilingLoadRating, null);
  assert.equal(mapping.wallOrientationMap, null);
  assert.equal(mapping.intervention.artworkId, mapping.works.find(w=>w.title==='Heavier Than Words').id);
  assert.equal(mapping.intervention.status,'PENDING_ARTIST_APPROVAL');
  assert.equal(mapping.intervention.sampleTreatmentAuthorized,false);
  assert.equal(mapping.intervention.batchTreatmentAuthorized,false);
  assert.equal(mapping.intervention.sampleApproval,null);
  assert.equal(mapping.culturalReview.clearanceGranted,false);
  assert.equal(mapping.culturalReview.clearanceDecision,null);
  assert.ok(mapping.culturalReview.claims.every(c=>!c.verified&&c.artworkIds.every(id=>mapping.works.some(w=>w.id===id))));
  assert.ok(mapping.culturalReview.sourceIds.every(id=>sources.has(id)));
  assert.ok(mapping.works.every(w=>!w.placementVerified));
  assert.equal(mapping.claimHistory[0].intervention.artworkId,null);
  assert.equal(mapping.intervention.authorizedToExecute, false);
  assert.ok(mapping.equipmentClaims.every(e => e.supplierConfirmed === false));

  const seed = emptyEcosystem();
  const exhibitionId = 'synthetic-gallery1-acceptance';
  const actor = role => ({ id: `test-${role}`, role, exhibitionId });
  // Source mapping is preserved alongside the rehearsal, not converted into approval evidence.
  seed.caseEvidenceMapping = mapping;
  seed.artworks = mapping.works.map(w => ({ id: w.id, exhibitionId, artistActorId: actor('Artist').id, physicalStatus: 'Pending_Shipment' }));
  seed.walls = mapping.walls.map(w => ({ id: `test-wall-${w.id}`, exhibitionId, max_width_cm: w.width_mm / 10, max_height_cm: w.height_mm / 10 }));
  const file = join(await mkdtemp(join(tmpdir(), 'sadu-gallery1-acceptance-')), 'state.json');
  const repository = await openEcosystemRepository(file, seed);
  const storage = { openStaging: async () => ({ objectId: randomUUID(), stream: new Writable({ write(_chunk, _encoding, done) { done(); } }) }) };
  const controller = createEcosystemControllers({ repository, storage, endpointOrigin: 'http://127.0.0.1:3013' });
  const projections = mapping.works.filter(w => w.variant === 'projection');
  const commands = [];
  for (const work of projections) {
    const revision = await controller.submitArtwork(actor('Artist'), {
      artworkId: work.id, expectedRevisionId: null,
      artistName: { en: 'Synthetic Gallery 1 Artist', ar: 'فنان تجريبي' },
      title: { en: `Synthetic projection ${commands.length + 1}`, ar: 'عرض تجريبي' },
      concept_text: 'Synthetic projection for local spatial and equipment testing, not an artist statement.',
      width_cm: 200, height_cm: 120, year: 2026,
      heritage: { applicability: 'NOT_APPLICABLE', reason: 'Synthetic engineering fixture, not a heritage assertion.' },
      technicalRequirements: [{ item: 'AV Projector', quantity: 1, external: true }, { item: 'Directional Audio Speaker', quantity: 1, external: true }],
    }, Readable.from([Buffer.from('Synthetic image bytes; no real artist media supplied') ]));
    commands.push({ artworkId: work.id, versionHash: revision.versionHash });
  }
  const first = { ...commands[0], wallId: 'test-wall-A', x_cm: 0, y_cm: 0 };
  const before = repository.read();
  await assert.rejects(controller.placeArtwork(actor('Artist'), first), { status: 403 });
  await assert.rejects(controller.placeArtwork(actor('General_Exhibition_Coordinator'), { ...first, x_cm: 600 }), { status: 409 });
  assert.deepEqual(repository.read(), before, 'Invalid placement must not partially persist');
  await controller.placeArtwork(actor('General_Exhibition_Coordinator'), first);
  const afterFirst = repository.read();
  await assert.rejects(controller.placeArtwork(actor('General_Exhibition_Coordinator'), { ...commands[1], wallId: 'test-wall-A', x_cm: 10, y_cm: 10 }), { status: 409 });
  assert.deepEqual(repository.read(), afterFirst, 'Collision must preserve the existing layout');
  await controller.placeArtwork(actor('General_Exhibition_Coordinator'), { ...commands[1], wallId: 'test-wall-C', x_cm: 0, y_cm: 0 });
  await controller.placeArtwork(actor('General_Exhibition_Coordinator'), { ...first, x_cm: 20 });
  const state = repository.read();
  assert.equal(state.requests.length, 4, 'Moving a projection must not duplicate hardware requests');
  for (const item of ['AV Projector', 'Directional Audio Speaker']) assert.equal(state.requests.filter(r => r.item === item).reduce((sum, r) => sum + r.quantity, 0), 2);
  assert.ok(state.requests.every(r => r.state === 'QUEUED_PAUSED' && r.dispatchedAt === null));
  assert.equal(state.placements.length, 2, 'Floor, sculpture and photo-series geometry was not fabricated');
  await assert.rejects(controller.publish(actor('Director'), commands[0]), { status: 409 });
  assert.equal(repository.read().twins.length, 0);
  assert.equal(repository.read().labels.length, 0);
  const restored = (await openEcosystemRepository(file)).read();
  assert.deepEqual(restored, repository.read(), 'All recorded state must survive reopening');
  assert.deepEqual(restored.caseEvidenceMapping, mapping);
});
