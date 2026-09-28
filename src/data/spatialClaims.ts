import type { NominatedArtistDossier } from '../components/ArtistNominationForm';
import { COORDINATORS } from './participation2026';
export const VENUE_SPACES = [
  { venueId: 'SHARJAH_ART_MUSEUM', curator: 'Sharjah Art Museum — Venue Curator', id: 'sam-hall-1', en: 'Sharjah Art Museum - Hall 1', ar: 'متحف الشارقة للفنون - القاعة 1' },
  { venueId: 'DEPARTMENT', curator: 'Calligraphy Square — Venue Curator', id: 'calligraphy-atrium', en: 'Calligraphy Square - Main Atrium', ar: 'ساحة الخط - البهو الرئيسي' },
  { venueId: 'HOUSE_OF_WISDOM', curator: 'House of Wisdom — Venue Curator', id: 'wisdom-lobby', en: 'House of Wisdom - Lobby', ar: 'بيت الحكمة - الردهة' },
] as const;
export interface SpatialClaim { venueId: string; curator: string; spaceId: string; artistId: string; artistName: string; medium: string; coordinatorId: string; coordinatorName: string; claimedAt: string }
export function claimSpace(claims: SpatialClaim[], input: { spaceId: string; artistId: string; coordinatorId: string; actor: string; at: string }, dossiers: NominatedArtistDossier[]): SpatialClaim[] {
  const coordinator = COORDINATORS.find(c => c.id === input.coordinatorId);
  const artist = dossiers.find(d => d.id === input.artistId);
  if (input.actor !== 'COORDINATOR' || !coordinator || !VENUE_SPACES.some(s => s.id === input.spaceId) || claims.some(c => c.spaceId === input.spaceId || c.artistId === input.artistId) || !artist || artist.status !== 'APPROVED' || artist.assignedCoordinatorId !== coordinator.id || !artist.medium.trim() || artist.amendments?.some(a => a.status === 'PENDING') || !Number.isFinite(Date.parse(input.at))) return claims;
  const space = VENUE_SPACES.find(s => s.id === input.spaceId)!;
  return [...claims, {venueId: space.venueId, curator: space.curator, spaceId: input.spaceId, artistId: artist.id, artistName: artist.artistName, medium: artist.medium, coordinatorId: coordinator.id, coordinatorName: coordinator.name, claimedAt: input.at}];
}

export function activeSpatialClaim(claims: SpatialClaim[], artistId: string): SpatialClaim | undefined {
  return claims.find(claim => claim.artistId === artistId && VENUE_SPACES.some(space => space.id === claim.spaceId && space.venueId === claim.venueId && space.curator === claim.curator));
}
