import {requiresTechnicalRider,validTechnicalRider} from './technicalRider';
import type { NominatedArtistDossier } from '../components/ArtistNominationForm';
import { matchedRestriction } from './vetting';
import { validSoloCount } from './participation2026';

export type DossierScope = Pick<NominatedArtistDossier, 'nationality' | 'medium' | 'proposedWorkTitle' | 'artworkCount'>;
export interface ScopeAmendment { id: string; reason: string; requestedAt: string; baseRevision: number; before: DossierScope; proposed: DossierScope; status: 'PENDING' | 'APPROVED' | 'REJECTED'; decidedAt?: string }
export const scopeOf = (d: NominatedArtistDossier): DossierScope => ({nationality:d.nationality, medium:d.medium, proposedWorkTitle:d.proposedWorkTitle, artworkCount:d.artworkCount});
export function requestScopeChange(d: NominatedArtistDossier, coordinatorId: string, proposed: DossierScope, reason: string, at: string, id: string): NominatedArtistDossier {
  if (d.status !== 'APPROVED' || !coordinatorId || d.assignedCoordinatorId !== coordinatorId || !reason.trim() || !id || !Number.isFinite(Date.parse(at)) || d.amendments?.some(a => a.status === 'PENDING' || a.id === id)) return d;
  const clean = {...proposed, nationality:proposed.nationality.trim(),medium:proposed.medium.trim(),proposedWorkTitle:proposed.proposedWorkTitle.trim()};
  if (!clean.nationality || (d.participationTrack !== 'HONORED_GUEST' && (!clean.medium || !clean.proposedWorkTitle || !Number.isInteger(clean.artworkCount) || clean.artworkCount! < 1)) || !validSoloCount(d.participationTrack,clean.artworkCount) || JSON.stringify(scopeOf(d)) === JSON.stringify(clean)) return d;
  return {...d, amendments:[...(d.amendments ?? []), {id,reason:reason.trim(),requestedAt:at,baseRevision:d.approvalRevision ?? 1,before:scopeOf(d),proposed:clean,status:'PENDING'}]};
}
export function reviewScopeChange(d: NominatedArtistDossier, id: string, approve: boolean, actor: string, tags: string[], contractLocked: boolean, at: string): NominatedArtistDossier {
  const a = d.amendments?.find(a => a.id === id);
  if (actor !== 'BIENNIAL_DIRECTOR' || d.status !== 'APPROVED' || !a || a.status !== 'PENDING' || a.baseRevision !== (d.approvalRevision ?? 1) || !Number.isFinite(Date.parse(at)) || (approve && (contractLocked || matchedRestriction({...d,...a.proposed},tags)))) return d;
  if(approve&&requiresTechnicalRider(a.proposed.medium,d.mediumTag)&&(a.proposed.medium!==d.medium||!validTechnicalRider(d.technicalRider)))return d;
  return {...d,...(approve ? a.proposed : {}), approvalRevision:(d.approvalRevision ?? 1) + (approve ? 1 : 0), amendments:d.amendments!.map(row => row.id === id ? {...row,status:approve ? 'APPROVED' : 'REJECTED',decidedAt:at} : row)};
}
export function readyForDispatch(d: NominatedArtistDossier): boolean {
  return (!requiresTechnicalRider(d.medium,d.mediumTag)||validTechnicalRider(d.technicalRider)) && d.status === 'APPROVED' && Boolean(d.assignedCoordinatorId) && !d.amendments?.some(a => a.status === 'PENDING') && !d.dispatchHistory?.some(row => row.revision === (d.approvalRevision ?? 1));
}
export function recordDossierDispatch(d: NominatedArtistDossier, actor: string, publicationReady: boolean, at: string, coordinatorId?:string): NominatedArtistDossier {
  if (actor !== 'COORDINATOR' || coordinatorId !== d.assignedCoordinatorId || !publicationReady || !readyForDispatch(d) || !Number.isFinite(Date.parse(at))) return d;
  return {...d,dispatchHistory:[...(d.dispatchHistory ?? []),{revision:d.approvalRevision ?? 1,at,scope:scopeOf(d)}]};
}
