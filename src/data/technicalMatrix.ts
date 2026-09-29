import type {NominatedArtistDossier} from '../components/ArtistNominationForm';
import {activeSpatialClaim,type SpatialClaim} from './spatialClaims';
import type {Governance,VenueApproval} from './venueGovernance';

export const HARDWARE=['AV_PROJECTOR','LIGHTING_RIG','DISPLAY_SCREEN','PEDESTAL'] as const;
export const MOUNTING=['FLOOR_FREESTANDING','CEILING_MOUNT','WALL_ANCHOR'] as const;
export interface TechnicalRequirement {id:string;equipment:typeof HARDWARE[number];specifications:string;mounting:typeof MOUNTING[number]}
export function validTechnicalRequirements(rows:TechnicalRequirement[]):boolean {
  return Array.isArray(rows)&&rows.length<=20&&new Set(rows.map(r=>r?.id)).size===rows.length&&rows.every(r=>r&&typeof r.id==='string'&&r.id.trim()&&HARDWARE.includes(r.equipment)&&MOUNTING.includes(r.mounting)&&typeof r.specifications==='string'&&r.specifications.trim().length>0&&r.specifications.length<=2000);
}
export function technicalMatrixTicket(d:NominatedArtistDossier,requirement:TechnicalRequirement,claims:SpatialClaim[],blocked=false):Omit<VenueApproval,'status'>|null {
  const claim=activeSpatialClaim(claims,d.id);
  if(d.status!=='APPROVED'||!claim||claim.coordinatorId!==d.assignedCoordinatorId||!validTechnicalRequirements(d.technicalRequirements??[])||!d.technicalRequirements?.some(r=>JSON.stringify(r)===JSON.stringify(requirement)))return null;
  // Approval is specific to this room allocation, approved scope, equipment and mounting specification.
  const binding=JSON.stringify([d.approvalRevision??1,claim.spaceId,claim.claimedAt,claim.curator,claim.coordinatorId,requirement]);
  return {id:`matrix:${d.id}:${encodeURIComponent(binding)}`,artistId:d.id,venueId:claim.venueId,authority:claim.curator,coordinator:claim.coordinatorName,
    title:`${d.artistName} · ${claim.spaceId} · ${requirement.equipment} · ${requirement.specifications}`,
    constraints:[`Room: ${claim.spaceId}`,`Equipment: ${requirement.equipment}`,`Specifications: ${requirement.specifications}`,`Mounting: ${requirement.mounting}`, 'Confirm suitability and all required mounting/safety conditions before clearing.'],
    blocked:blocked||Boolean(d.amendments?.some(a=>a.status==='PENDING'))};
}
export function matrixCleared(ticket:Omit<VenueApproval,'status'>|null,state:Governance):boolean {
  if(!ticket||ticket.blocked)return false;
  const r=state.tickets[ticket.id];
  return Boolean(r&&!r.blocked&&r.status==='APPROVED_FOR_INSTALLATION'&&r.venueId===ticket.venueId&&r.authority===ticket.authority&&r.clearedBy&&r.clearedAt&&Number.isFinite(Date.parse(r.clearedAt)));
}
