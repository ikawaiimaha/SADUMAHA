import type { NominatedArtistDossier } from '../components/ArtistNominationForm';
export interface CulturalDeclaration { containsText: boolean; explanation: string; }
export const validDeclaration = (d?: CulturalDeclaration) => Boolean(d && typeof d.containsText === 'boolean' && (!d.containsText || d.explanation.trim()));
export const culturalCleared = (d: NominatedArtistDossier) => validDeclaration(d.culturalDeclaration) && d.committeeReview?.decision === 'ENDORSED';
