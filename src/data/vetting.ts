import { COORDINATORS, validSoloCount } from './participation2026';
import type { NominatedArtistDossier } from '../components/ArtistNominationForm';
export const ASSIGNED_COORDINATOR = 'demo-coordinator';
export function validDossier(d: NominatedArtistDossier): boolean {
  if (!COORDINATORS.some(c => c.id === d.assignedCoordinatorId) || !validSoloCount(d.participationTrack, d.artworkCount)) return false;
  if (d.participationTrack === 'HONORED_GUEST') return Boolean(d.artistName.trim() && d.nationality.trim());
  return Boolean(d.artistName.trim() && d.nationality.trim() && d.medium.trim() && d.proposedWorkTitle.trim() && d.cvFileName)
    && ['Emerging', 'Established'].includes(d.artistCategory) && d.previousWorksCount > 0
    && (d.isCommissioned === true ? d.mockupCount > 0 : d.isCommissioned === false && Boolean(d.provenanceFileName));
}
export function matchedRestriction(d: NominatedArtistDossier, tags: string[]): string | undefined {
  return tags.find(tag => {
    const value = tag.replace(/^(restricted nationality|hazardous medium|directive):\s*/i, '').trim().toLowerCase();
    return value && [d.nationality, d.medium].some(field => field.trim().toLowerCase().includes(value));
  });
}
export function submitForVetting(d: NominatedArtistDossier, actor: string, coordinatorId: string, tags: string[]): NominatedArtistDossier | null {
  if (actor !== 'COORDINATOR' || coordinatorId !== d.assignedCoordinatorId || d.status !== 'DRAFT' || !validDossier(d)) return null;
  const match = matchedRestriction(d, tags);
  return { ...d, status: match ? 'REJECTED_COMPLIANCE' : 'PENDING_DIRECTOR_REVIEW', complianceReason: match, submittedBy: 'Coordinator', submittedAt: new Date().toISOString() };
}
