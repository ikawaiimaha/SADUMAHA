import type { NominatedArtistDossier } from '../components/ArtistNominationForm';
export interface CulturalDeclaration { containsText: boolean; explanation: string; exactText?: string; }
/** 'HIP' only appears on verifications recorded before the role was retired; they remain valid history. */
export interface TextualVerification { snapshot: string; at: string; actor: 'GENERAL_COORDINATOR' | 'HIP'; }
const VERIFIER_ACTORS: readonly string[] = ['GENERAL_COORDINATOR', 'HIP'];
export const validDeclaration = (d?: CulturalDeclaration) => Boolean(d && typeof d.containsText === 'boolean' && (!d.containsText || (d.explanation.trim() && d.exactText?.trim() && d.explanation.length <= 8000 && d.exactText.length <= 8000)));
export const textualSnapshot = (d: NominatedArtistDossier) => JSON.stringify([d.id,d.proposedWorkTitle,d.culturalDeclaration]);
export const textualCleared = (d: NominatedArtistDossier) => validDeclaration(d.culturalDeclaration) && (!d.culturalDeclaration?.containsText || Boolean(d.textualVerification && VERIFIER_ACTORS.includes(d.textualVerification.actor) && d.textualVerification.snapshot === textualSnapshot(d) && Number.isFinite(Date.parse(d.textualVerification.at))));
export function verifyTextualContent(d: NominatedArtistDossier, actor: string, at: string): NominatedArtistDossier {
 if (actor !== 'GENERAL_COORDINATOR' || d.status !== 'PENDING_COMMITTEE_REVIEW' || !d.culturalDeclaration?.containsText || !validDeclaration(d.culturalDeclaration) || textualCleared(d) || !Number.isFinite(Date.parse(at)) || Date.parse(at) < Date.parse(d.submittedAt) || !Number.isFinite(Date.parse(d.submittedAt))) return d;
 return {...d,textualVerification:{snapshot:textualSnapshot(d),actor:'GENERAL_COORDINATOR',at}};
}
export const culturalCleared = (d: NominatedArtistDossier) => textualCleared(d) && (d.committeeReview?.decision === 'RECOMMENDED' || d.committeeReview?.decision === 'ENDORSED');
