import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createIntakeDraft, sampleIntakeDraft, recoverableDraft, validateIntake, reviewSubmission, type IntakeSubmission } from '../src/data/artistIntake.ts';
import { INTAKE_DRAFT_KEY, readIntakeDraft, writeIntakeDraft } from '../src/utils/intakeDraftStorage.ts';
const at = '2026-09-19T09:00:00Z';
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
