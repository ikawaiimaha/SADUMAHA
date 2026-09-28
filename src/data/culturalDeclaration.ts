import type { NominatedArtistDossier } from '../components/ArtistNominationForm';
export interface CulturalDeclaration { containsText: boolean; explanation: string; }
export const validDeclaration = (d?: CulturalDeclaration) => Boolean(d && typeof d.containsText === 'boolean' && (!d.containsText || d.explanation.trim()));
export const culturalCleared = (d: NominatedArtistDossier) => validDeclaration(d.culturalDeclaration) && Boolean(d.culturalClearedAt && Number.isFinite(Date.parse(d.culturalClearedAt)));
export function clearCultural(d: NominatedArtistDossier, actor: string, at: string): NominatedArtistDossier {
  if (actor !== 'HIP' || d.status !== 'DRAFT' || d.culturalClearedAt || !validDeclaration(d.culturalDeclaration) || !Number.isFinite(Date.parse(at))) return d;
  return {...d, culturalClearedAt: at};
}
