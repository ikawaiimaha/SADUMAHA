export type ExhibitionState = 'ACTIVE' | 'ARCHIVED_DIGITAL_TWIN';
export type ReturnFreightStatus = 'UNCONFIRMED' | 'RETURN_FREIGHT_CLEARED';
export type BilingualArchiveText = { en: string; ar: string };
/** Trusted server projection only; never populate clearance or approval from a browser request. */
export interface ArchiveArtwork {
  id: string;
  revision: string;
  physical_status: string;
  culturalApproved: boolean;
  artistName: BilingualArchiveText;
  title: BilingualArchiveText;
  description: BilingualArchiveText;
  images: { url: string; approvedForArchive: boolean; highResolution: boolean }[];
  tags: string[];
  layout: { x_cm: number; y_cm: number; width_cm: number; height_cm: number };
}
export interface ArchiveSource {
  exhibitionId: string;
  approvedImageOrigins: string[];
  artworks: ArchiveArtwork[];
}
