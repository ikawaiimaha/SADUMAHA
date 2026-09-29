import type { NominatedArtistDossier } from '../components/ArtistNominationForm';

export type InvitationVersion = {
  id: string; artistId: string; artistName: string; work: string;
  version: number; createdAt: string; bodyAr: string; bodyEn: string;
  approval?: { approver: string; delegation: string; evidence: string; at: string; recordedBy: string };
};
export type ArchiveAction =
  | { type: 'draft'; artistId: string; bodyAr: string; bodyEn: string }
  | { type: 'record-approval'; id: string; approver: string; delegation: string; evidence: string; reviewed: boolean };
export const invitationEligible = (d: NominatedArtistDossier) => d.status === 'APPROVED' && !d.amendments?.some(a => a.status === 'PENDING');
export function invitationArchiveTransition(rows: InvitationVersion[], action: ArchiveAction, dossiers: NominatedArtistDossier[], actor: string, coordinatorId: string, at: string): InvitationVersion[] {
  if (actor !== 'COORDINATOR' || !Number.isFinite(Date.parse(at))) return rows;
  const old = action.type === 'record-approval' ? rows.find(r => r.id === action.id) : undefined;
  const artistId = action.type === 'draft' ? action.artistId : old?.artistId;
  const dossier = dossiers.find(d => d.id === artistId);
  if (!dossier || !invitationEligible(dossier) || dossier.assignedCoordinatorId !== coordinatorId) return rows;
  const latest = rows.filter(r => r.artistId === artistId).at(-1);
  if (action.type === 'draft') {
    if (![action.bodyAr, action.bodyEn].every(s => s.trim().length > 0 && s.length <= 3000)) return rows;
    const version = (latest?.version ?? 0) + 1;
    return [...rows, { id: `${dossier.id}-invitation-v${version}`, artistId: dossier.id, artistName: dossier.artistName,
      work: dossier.proposedWorkTitle, version, createdAt: at, bodyAr: action.bodyAr.trim(), bodyEn: action.bodyEn.trim() }];
  }
  if (!old || old !== latest || old.approval || !action.reviewed || Date.parse(at) < Date.parse(old.createdAt)
    || ![action.approver, action.delegation, action.evidence].every(s => s.trim().length > 0 && s.length <= 200)) return rows;
  return rows.map(r => r.id === old.id ? { ...r, approval: { approver: action.approver.trim(), delegation: action.delegation.trim(), evidence: action.evidence.trim(), at, recordedBy: coordinatorId } } : r);
}
export function matchesInvitation(row: InvitationVersion, query: string): boolean {
  const normalize = (s: string) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase().trim();
  return normalize(`${row.artistId} ${row.artistName} ${row.work} ${row.id}`).includes(normalize(query));
}
