import { activeSpatialClaim, type SpatialClaim } from './spatialClaims';
export type TravelKind = 'visa' | 'escortVisa' | 'flight';
export interface TravelPacket { files: Partial<Record<TravelKind, File>>; status: 'DRAFT' | 'TRAVEL_DOCUMENTS_DISPATCHED'; dispatchedAt?: string }
export const emptyTravelPacket: TravelPacket = { files: {}, status: 'DRAFT' };
export const validTravelFile = (file: File) => /\.pdf$/i.test(file.name) && (!file.type || file.type === 'application/pdf') && file.size > 0 && file.size <= 10 * 1024 * 1024;
export function dispatchTravel(packet: TravelPacket, cleared: boolean, at: string): TravelPacket {
  if (!cleared || packet.status !== 'DRAFT' || !Number.isFinite(Date.parse(at)) || !packet.files.visa || !packet.files.flight || !Object.values(packet.files).every(validTravelFile)) return packet;
  return { ...packet, status: 'TRAVEL_DOCUMENTS_DISPATCHED', dispatchedAt: at };
}
export const equipmentOptions = ['AV Projectors', 'Lighting Rig', 'Pedestal'] as const;
export const mountingOptions = ['Floor Freestanding', 'Ceiling Mount', 'Wall Anchor'] as const;
export interface TechnicalRequest { venueClaim?: SpatialClaim; id: string; equipment: string; mounting: string; phase: 'PROTOTYPING' | 'FINAL_INSTALLATION'; at: string }
export function addTechnicalRequest(rows: TechnicalRequest[], request: TechnicalRequest, claims: SpatialClaim[] = [], artistId = ''): TechnicalRequest[] {
  const venueClaim = activeSpatialClaim(claims, artistId);
  if (requiresVenueApproval(request.equipment, request.mounting) && !venueClaim) return rows;
  if (!['PROTOTYPING','FINAL_INSTALLATION'].includes(request.phase) || !(equipmentOptions as readonly string[]).includes(request.equipment) || !(mountingOptions as readonly string[]).includes(request.mounting) || !Number.isFinite(Date.parse(request.at)) || rows.some(row => row.equipment === request.equipment && row.mounting === request.mounting && row.phase === request.phase)) return rows;
  return [...rows, { ...request, venueClaim: venueClaim ? { ...venueClaim } : undefined }];
}

export const requiresVenueApproval = (equipment: string, mounting: string) => equipment === 'Lighting Rig' || mounting !== 'Floor Freestanding';
