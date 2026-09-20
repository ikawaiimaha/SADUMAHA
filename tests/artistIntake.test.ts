import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createIntakeDraft, sampleIntakeDraft, recoverableDraft, validateIntake, reviewSubmission, type IntakeSubmission } from '../src/data/artistIntake.ts';
import { INTAKE_DRAFT_KEY, readIntakeDraft, writeIntakeDraft, parseIntakeDraftFile } from '../src/utils/intakeDraftStorage.ts';
import { seedRoster, registerProfile, validateRegistration, createRosterProgramme } from '../src/data/artistRoster.ts';
const at = '2026-09-19T09:00:00Z';
test('downloaded draft files round-trip bilingual text without restoring private fields or authority', () => {
  const draft = sampleIntakeDraft(); draft.proposals['DEMO-CALL-01'].budget.materials = 'unfinished';
  const restored = parseIntakeDraftFile(JSON.stringify({ schema: 1, data: { ...draft, approved: true, files: ['private.pdf'] } }));
  assert.deepEqual(restored, recoverableDraft(draft));
  assert.equal(restored.profile.email, ''); assert.equal(restored.profile.legalNameEn, '');
  assert.equal(restored.proposals['DEMO-CALL-01'].budget.materials, 'unfinished');
  assert.equal('approved' in restored, false); assert.equal('files' in restored, false);
});

test('draft file import rejects malformed structures, unsafe keys, versions and excessive bytes', () => {
  const file = (data: unknown) => JSON.stringify({ schema: 1, data });
  for (const text of ['{', 'null', '[]', JSON.stringify({ schema: 2, data: sampleIntakeDraft() }),
    file({ ...sampleIntakeDraft(), proposals: [] }), file({ ...sampleIntakeDraft(), programmeBriefs: [] }),
    file({ ...sampleIntakeDraft(), profile: null }), '{"schema":1,"__proto__":{"polluted":true}}',
    'ع'.repeat(75001)]) assert.throws(() => parseIntakeDraftFile(text));
  const bad = sampleIntakeDraft(); bad.proposals['DEMO-CALL-01'].programmeId = 'OTHER';
  assert.throws(() => parseIntakeDraftFile(file(bad)));
  assert.equal(({} as Record<string, unknown>).polluted, undefined);
});

test('older exported files migrate only the known legal-name additions', () => {
  const data = JSON.parse(JSON.stringify(sampleIntakeDraft())); delete data.profile.legalNameEn; delete data.profile.legalNameAr;
  const restored = parseIntakeDraftFile('\uFEFF' + JSON.stringify({ schema: 1, data }));
  assert.equal(restored.profile.nameAr, 'فنان تجريبي'); assert.equal(restored.profile.legalNameAr, '');
});
function memoryStorage() {
  const map = new Map<string, string>();
  return { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value); } };
}
test('one profile supports independent programme drafts', () => {
  const draft = sampleIntakeDraft();
  assert.equal(draft.proposals['DEMO-CALL-01'].profileId, draft.proposals['DEMO-CALL-02'].profileId);
  draft.proposals['DEMO-CALL-02'].budget.materials = '25';
  assert.equal(draft.proposals['DEMO-CALL-01'].budget.materials, '1200');
  assert.deepEqual(validateIntake(draft, 'DEMO-CALL-01'), []);
  assert.ok(validateIntake(draft, 'DEMO-CALL-02').length > 0);
});
test('incomplete drafts are recoverable while submission requires completeness', () => {
  const draft = createIntakeDraft(); draft.profile.phone = '+9'; draft.proposals['DEMO-CALL-01'].conceptAr = 'فكرة لم تكتمل بعد';
  const storage = memoryStorage();
  writeIntakeDraft(storage, draft, null, 'r1', at);
  assert.equal(readIntakeDraft(storage)!.data.proposals['DEMO-CALL-01'].conceptAr, 'فكرة لم تكتمل بعد');
  assert.ok(validateIntake(draft, 'DEMO-CALL-01').some(x => x.path === 'profile.phone'));
});
test('backup allowlist excludes contact details and unexpected fields', () => {
  const draft = sampleIntakeDraft(); Object.assign(draft.proposals['DEMO-CALL-01'], { secret: 'do not retain' });
  draft.profile.contactEmail = 'assistant@example.com'; draft.profile.phone = '+971500000000';
  const safe = recoverableDraft(draft);
  assert.equal(safe.profile.email, ''); assert.equal(safe.profile.contactEmail, ''); assert.equal(safe.profile.phone, '');
  assert.ok(!JSON.stringify(safe).includes('secret'));
  assert.equal(safe.profile.nameEn, 'Sample Artist');
  assert.equal(draft.profile.email, 'artist@example.com');
});
test('another tab revision cannot be silently overwritten', () => {
  const storage = memoryStorage(); const draft = sampleIntakeDraft();
  writeIntakeDraft(storage, draft, null, 'r1', at);
  draft.profile.nameEn = 'Updated artist'; writeIntakeDraft(storage, draft, 'r1', 'r2', at);
  assert.throws(() => writeIntakeDraft(storage, sampleIntakeDraft(), 'r1', 'r3', at), /conflict/);
  assert.equal(readIntakeDraft(storage)!.data.profile.nameEn, 'Updated artist');
});
test('corrupt, incompatible and oversized backups do not hydrate the form', () => {
  const storage = memoryStorage();
  for (const value of ['{', 'null', JSON.stringify({ schema: 2 }), ' '.repeat(150001)]) {
    storage.setItem(INTAKE_DRAFT_KEY, value); assert.throws(() => readIntakeDraft(storage));
  }
});
test('quota failure preserves the previous saved draft and surfaces failure', () => {
  const storage = memoryStorage(); writeIntakeDraft(storage, sampleIntakeDraft(), null, 'r1', at);
  const failing = { getItem: storage.getItem, setItem: () => { throw new Error('QuotaExceededError'); } };
  assert.throws(() => writeIntakeDraft(failing, createIntakeDraft(), 'r1', 'r2', at), /Quota/);
  assert.equal(readIntakeDraft(storage)!.revision, 'r1');
});
test('names preserve punctuation and mixed scripts; translation assistance permits one language', () => {
  const draft = sampleIntakeDraft(); draft.profile.nameEn = "O’Neill — ليلى"; draft.profile.email = 'info@example.com';
  draft.profile.nameAr = ''; draft.profile.translationHelp = true;
  draft.proposals['DEMO-CALL-01'].conceptAr = ''; draft.proposals['DEMO-CALL-01'].translationHelp = true;
  assert.deepEqual(validateIntake(draft, 'DEMO-CALL-01'), []);
  draft.profile.translationHelp = false; assert.ok(validateIntake(draft, 'DEMO-CALL-01').length);
});
test('representation needs contacts but does not imply authority', () => {
  const draft = sampleIntakeDraft(); draft.profile.representation = 'gallery';
  assert.ok(validateIntake(draft, 'DEMO-CALL-01').some(i => i.path === 'profile.organisation'));
  Object.assign(draft.profile, { organisation: 'Sample Gallery', contactName: 'Sample Representative', contactEmail: 'info@example.com' });
  assert.deepEqual(validateIntake(draft, 'DEMO-CALL-01'), []);
});
test('submission catches excessive text, unsafe links and invalid budgets without mutating drafts', () => {
  for (const amount of ['-1', '1e3', 'NaN', '16000', '0.001']) {
    const draft = sampleIntakeDraft(); draft.proposals['DEMO-CALL-01'].budget.materials = amount;
    assert.ok(validateIntake(draft, 'DEMO-CALL-01').some(i => i.path.includes('budget')));
    assert.equal(draft.proposals['DEMO-CALL-01'].budget.materials, amount);
  }
  const draft = sampleIntakeDraft(); draft.proposals['DEMO-CALL-01'].conceptEn = 'x'.repeat(3001); draft.profile.website = 'javascript:alert(1)';
  assert.ok(validateIntake(draft, 'DEMO-CALL-01').some(i => i.path.endsWith('conceptEn')));
  assert.ok(validateIntake(draft, 'DEMO-CALL-01').some(i => i.path === 'profile.website'));
});
test('coordinator review requires a reason for revision and cannot rewrite a reviewed version', () => {
  const submission: IntakeSubmission = { id: 'test/1', version: 1, at, programmeId: 'DEMO-CALL-01', snapshot: sampleIntakeDraft(), assets: [], status: 'received', note: '' };
  assert.equal(reviewSubmission(submission, 'DIRECTORATE', 'checked', '', at), submission);
  assert.equal(reviewSubmission(submission, 'COORDINATOR', 'revision', ' ', at), submission);
  const revised = reviewSubmission(submission, 'COORDINATOR', 'revision', 'Clarify mounting method.', at);
  assert.equal(revised.status, 'revision'); assert.equal(submission.status, 'received');
  assert.equal(reviewSubmission(revised, 'COORDINATOR', 'checked', '', at), revised);
});

test('roster registration validates identity independently of all programme proposals', () => {
  const draft = createIntakeDraft(); draft.profile = sampleIntakeDraft().profile;
  assert.deepEqual(validateRegistration(draft.profile), []);
  assert.ok(validateIntake(draft, 'DEMO-CALL-01').length > 0);
  draft.profile.legalNameAr = ''; draft.profile.legalNameEn = '';
  assert.ok(validateRegistration(draft.profile).some(i => i.path === 'profile.legalNameEn'));
  draft.profile.legalNameEn = 'O’Neill — اسم تجريبي';
  assert.deepEqual(validateRegistration(draft.profile), []);
});

test('three seeded profiles are independent fictional entities; submitted profiles await review', () => {
  const seeds = seedRoster(); assert.equal(new Set(seeds.map(x => x.id)).size, 3);
  assert.ok(seeds.every(x => x.status === 'verified-sample' && x.profile.email.endsWith('@example.com')));
  const profile = sampleIntakeDraft().profile;
  const added = registerProfile(seeds, profile, [], at);
  assert.equal(added.length, 4); assert.equal(added.at(-1)!.status, 'pending-review');
  profile.nameEn = 'Updated sample'; assert.equal(added.at(-1)!.profile.nameEn, 'Sample Artist');
  const updated = registerProfile(added, profile, [], at);
  assert.equal(updated.length, 4); assert.equal(updated.at(-1)!.profile.nameEn, 'Updated sample');
  assert.equal(seeds.length, 3);
});

test('programmes link eligible existing roster IDs without duplicating profiles or approving artists', () => {
  const roster = registerProfile(seedRoster(), sampleIntakeDraft().profile, [], at);
  const input = { id: 'DEMO-PROGRAMME-test', titleEn: 'Sample programme', titleAr: 'برنامج تجريبي', createdAt: at, artistIds: [roster[0].id, roster[0].id, roster[1].id] };
  const programme = createRosterProgramme(roster, input)!;
  assert.deepEqual(programme.artistIds, [roster[0].id, roster[1].id]);
  assert.equal(createRosterProgramme(roster, { ...input, artistIds: [roster[3].id] }), null);
  assert.equal(createRosterProgramme(roster, { ...input, artistIds: ['unknown'] }), null);
  assert.equal(createRosterProgramme(roster, { ...input, titleAr: '' }), null);
  assert.equal(createRosterProgramme(roster, { ...input, artistIds: [] }), null);
  assert.equal(roster[3].status, 'pending-review');
});

test('roster snapshots contain general PDFs only, not programme-specific files', () => {
  const assets = ['cv', 'portfolio', 'DEMO-CALL-01'].map(slot => ({ id: slot, slot, name: 'sample.pdf', size: 10, type: 'application/pdf', url: 'blob:sample' })) as IntakeSubmission['assets'];
  const roster = registerProfile(seedRoster(), sampleIntakeDraft().profile, assets, at);
  assert.deepEqual(roster.at(-1)!.assets.map(a => a.slot), ['cv', 'portfolio']);
});

test('old saved drafts migrate missing legal-name fields without losing bilingual text', () => {
  const storage = memoryStorage(); const draft = sampleIntakeDraft();
  const old = JSON.parse(JSON.stringify(draft)); delete old.profile.legalNameEn; delete old.profile.legalNameAr;
  storage.setItem(INTAKE_DRAFT_KEY, JSON.stringify({ schema: 1, revision: 'old', savedAt: at, data: old }));
  const restored = readIntakeDraft(storage)!;
  assert.equal(restored.data.profile.nameAr, 'فنان تجريبي');
  assert.equal(restored.data.profile.legalNameEn, '');
  assert.equal(recoverableDraft(draft).profile.legalNameAr, '');
});
