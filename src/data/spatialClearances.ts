export interface SpatialClearance {
  artworkCode: string;
  artist: { ar: string; en: string };
  venue: { ar: string; en: string };
  equipment: { ar: string; en: string };
  authority: { ar: string; en: string };
  status: 'CLEARED_BY_VENUE' | 'PENDING_VENUE_REVIEW';
}

export function clearanceFromClaim(claim: import('./spatialClaims').SpatialClaim): SpatialClearance {
  return { artworkCode: claim.artistId, artist: { ar: claim.artistName, en: claim.artistName },
    venue: { ar: claim.spaceId, en: claim.spaceId }, equipment: { ar: 'لم يعتمد بعد', en: 'Not approved yet' },
    authority: { ar: claim.curator, en: claim.curator }, status: 'PENDING_VENUE_REVIEW' };
}
