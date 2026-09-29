import { test } from 'node:test';
import assert from 'node:assert/strict';
import { invitationArchiveTransition as transition, matchesInvitation, type InvitationVersion } from '../src/data/invitationArchive';
import type { NominatedArtistDossier } from '../src/components/ArtistNominationForm';
const dossier = { id: 'artist-1', artistName: 'Noura', proposedWorkTitle: 'Horizon', status: 'APPROVED', assignedCoordinatorId: 'coord-1' } as NominatedArtistDossier;
const draft = { type: 'draft', artistId: dossier.id, bodyAr: 'مسودة', bodyEn: 'Draft' } as const;
const at = '2026-09-29T12:00:00Z';
const run = (rows: InvitationVersion[], action: Parameters<typeof transition>[1], actor = 'COORDINATOR', coord = 'coord-1', dossiers = [dossier]) => transition(rows, action, dossiers, actor, coord, at);
test('invitation drafts require approved current assignment; executive title grants no write power', () => {
  assert.equal(run([], draft, 'CHAIRMAN').length, 0);
  assert.equal(run([], draft, 'COORDINATOR', 'other').length, 0);
  assert.equal(run([], draft, 'COORDINATOR', 'coord-1', [{ ...dossier, status: 'VETOED' }]).length, 0);
  const rows = run([], draft); assert.equal(rows.length, 1); assert.equal(rows[0].approval, undefined);
});
test('approval evidence is version-specific, immutable and never inherited by a replacement', () => {
  const rows = run([], draft);
  const approve = { type: 'record-approval', id: rows[0].id, approver: 'Sample reviewer', delegation: 'DEMO scope', evidence: 'DEMO ref', reviewed: true } as const;
  assert.equal(run(rows, { ...approve, delegation: '' }), rows);
  assert.equal(run(rows, { ...approve, reviewed: false }), rows);
  const approved = run(rows, approve); assert.ok(approved[0].approval);
  assert.equal(run(approved, approve), approved);
  const next = run(approved, { ...draft, bodyEn: 'New text' });
  assert.equal(next[0], approved[0]); assert.equal(next[1].version, 2); assert.equal(next[1].approval, undefined);
  assert.equal(run(next, approve), next);
});
test('search works by stable artist ID, name and artwork without changing source names', () => {
  const [row] = run([], draft);
  for (const query of ['ARTIST-1', 'noura', 'horizon']) assert.ok(matchesInvitation(row, query));
  assert.equal(matchesInvitation(row, 'missing'), false);
});
