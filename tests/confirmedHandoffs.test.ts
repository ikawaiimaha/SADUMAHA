import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommunicationReview, communicationTransition as comm, type CommunicationReview, type CommunicationCommand } from '../src/data/communicationReview';
import { createCuratorialHandoff, curatorialTransition as curate, curatorialOwner, type CuratorialHandoff, type CuratorialCommand } from '../src/data/curatorialHandoff';
const at = '2026-10-03T14:00:00Z';
const m = (s: CommunicationReview, type: CommunicationCommand['type'], extra: Partial<CommunicationCommand> = {}) => comm(s, { type, actor: 'Assigned Logistics', version: s.version, at, ...extra });
const c = (s: CuratorialHandoff, type: CuratorialCommand['type'], extra: Partial<CuratorialCommand> = {}) => curate(s, { type, actor: curatorialOwner(s), version: s.version, at, ...extra });
test('communication capture cannot update collection without linking, clarification and confirmation', () => {
  let s = createCommunicationReview();
  assert.throws(() => m(s, 'APPLY'));
  assert.throws(() => m(s, 'LINK', { reference: 'DEMO-001' }));
  s = m(s, 'CHECK_TRANSCRIPT');
  assert.throws(() => m(s, 'LINK', { reference: 'OTHER' }));
  s = m(s, 'LINK', { reference: 'DEMO-001' });
  s = m(s, 'CLARIFY');
  assert.throws(() => m(s, 'PROPOSE', { reference: 'REPLY-02', date: '2026-12-03' }));
  s = m(s, 'PROPOSE', { reference: 'REPLY-02', date: '2026-10-16' });
  assert.throws(() => m(s, 'APPLY'));
  assert.throws(() => m(s, 'CONFIRM', { actor: 'Observer' }));
  assert.throws(() => m(s, 'CONFIRM', { version: 1 }));
  s = m(m(s, 'CONFIRM'), 'APPLY');
  assert.equal(s.original.text, 'Please collect on 3 December 2026.');
  assert.equal(s.correction?.date, '2026-10-16');
  assert.equal(s.history.length, 6);
  assert.throws(() => m(s, 'APPLY'));
});
function reviewed(specialist: boolean) {
  let s = c(createCuratorialHandoff(), 'SUBMIT', { title: 'Study', rationale: 'Responds to rhythm' });
  s = c(s, 'CHECK', { note: 'Dimensions checked; material question noted', requiresSpecialist: specialist });
  if (specialist) {
    assert.throws(() => c(s, 'RECOMMEND', { note: 'Skip review' }));
    s = c(s, 'SPECIALIST', { note: 'DEMO-SPEC-01: material concern resolved' });
  }
  return s;
}
test('optional specialist route feeds recommendation, separate executive approval and unsent invitation', () => {
  for (const specialist of [true, false]) {
    let s = reviewed(specialist);
    assert.throws(() => c(s, 'APPROVE', { note: 'Committee approval' }));
    s = c(s, 'RECOMMEND', { note: 'Candidate A matches the wall better than B' });
    assert.equal(s.decision, '');
    assert.throws(() => c(s, 'PREPARE'));
    assert.throws(() => c(s, 'APPROVE', { actor: 'Committee', note: 'Yes' }));
    s = c(s, 'APPROVE', { note: 'Approve within sample brief' });
    s = c(s, 'PREPARE');
    assert.equal(s.stage, 'invitation');
    const amended = c(s, 'REVISE', { note: 'Change proposal dimensions' });
    assert.equal(amended.revision, 2);
    assert.equal(amended.decision, '');
    assert.equal(amended.recommendation, '');
    assert.ok(amended.history.some(e => e.action === 'APPROVE' && e.revision === 1));
    assert.throws(() => c(amended, 'PREPARE'));
  }
});
test('reason-bearing returns and stale actions cannot advance review', () => {
  const s = reviewed(false);
  assert.throws(() => c(s, 'RETURN', { note: '' }));
  assert.throws(() => c(s, 'RECOMMEND', { note: 'Yes', version: 1 }));
  const returned = c(s, 'RETURN', { note: 'Clarify fit to brief' });
  assert.equal(curatorialOwner(returned), 'Coordinator');
  assert.equal(c(returned, 'REVISE', { note: 'Address committee feedback' }).revision, 2);
});
