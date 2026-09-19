import type { ArtworkRecord, RoleKey } from '../types';

export interface SampleTechnicalReview {
  assetId: string;
  actorRole: RoleKey;
  recordedAt: string;
  evidenceReference: string;
  version: number;
}

export const canRecordSampleTechnicalReview = (role: RoleKey) =>
  role === 'TECHNICAL_MUSEUM' || role === 'TECHNICAL' || role === 'SAF_TECHNICIAN';

// A role-aware demonstration transition, not authentication or engineering approval.
export function recordSampleTechnicalReview(role: RoleKey, recordedAt: string, previous: SampleTechnicalReview | null): SampleTechnicalReview | null {
  if (previous || !canRecordSampleTechnicalReview(role)) return previous;
  return { assetId: 'art-02', actorRole: role, recordedAt, evidenceReference: 'DEMO-TECH-BASE-01', version: 1 };
}

export function operationsBaselineRecords(artworks: ArtworkRecord[], review: SampleTechnicalReview | null, isAr: boolean) {
  return artworks.map(art => ({
    id: art.canonicalCode,
    title: isAr ? art.titleAr : art.titleEn,
    category: isAr ? art.mediumAr : art.mediumEn,
    assigneeOrArtist: isAr ? art.artistNameAr : art.artistNameEn,
    dimensions: art.dimensionsCm,
    status: art.id === 'art-02'
      ? review?.assetId === art.id
        ? (isAr ? 'سُجلت مراجعة فنية تجريبية' : 'Sample technical review recorded')
        : (isAr ? 'بانتظار مراجعة فنية تجريبية' : 'Sample technical review pending')
      : (isAr ? 'سجل تجريبي؛ لم تُجرَ مراجعة فنية' : 'Sample record; no technical review'),
  }));
}
