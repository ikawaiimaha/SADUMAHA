import { COORDINATORS, validSoloCount } from './participation2026';
import { validDeclaration } from './culturalDeclaration';
import type { NominatedArtistDossier } from '../components/ArtistNominationForm';
export const ASSIGNED_COORDINATOR = 'demo-coordinator';
export function validDossier(d: NominatedArtistDossier): boolean {
  if (!validDeclaration(d.culturalDeclaration)) return false;
  if (!COORDINATORS.some(c => c.id === d.assignedCoordinatorId) || !validSoloCount(d.participationTrack, d.artworkCount)) return false;
  if (d.participationTrack === 'HONORED_GUEST') return Boolean(d.artistName.trim() && d.nationality.trim());
  return Boolean(d.artistName.trim() && d.nationality.trim() && d.medium.trim() && d.proposedWorkTitle.trim() && d.cvFileName)
    && ['Emerging', 'Established'].includes(d.artistCategory) && d.previousWorksCount > 0
    && (d.isCommissioned === true ? d.mockupCount > 0 : d.isCommissioned === false && Boolean(d.provenanceFileName));
}
export function matchedRestriction(d: NominatedArtistDossier, tags: string[]): string | undefined {
  return tags.find(tag => {
    const value = tag.replace(/^(restricted nationality|restricted medium|restricted style|hazardous medium|directive):\s*/i, '').trim().toLowerCase();
    return value && [d.nationality, d.medium, d.style??''].some(field => field.trim().toLowerCase().includes(value));
  });
}
export function submitForVetting(d: NominatedArtistDossier, actor: string, coordinatorId: string, tags: string[]): NominatedArtistDossier | null {
  if (actor !== 'COORDINATOR' || coordinatorId !== d.assignedCoordinatorId || d.status !== 'DRAFT' || !validDossier(d)) return null;
  return queueNomination({ ...d, submittedAt: new Date().toISOString() }, actor, coordinatorId, tags);
}

export function queueNomination(d:NominatedArtistDossier,actor:string,coordinatorId:string,tags:string[]):NominatedArtistDossier|null {
  if (!['COORDINATOR','PREP_COMMITTEE'].includes(actor) || !validDossier(d) || !d.id || d.status !== 'DRAFT'
    || (actor==='COORDINATOR' && coordinatorId!==d.assignedCoordinatorId)) return null;
  return {...d,committeeReview:undefined,culturalClearedAt:undefined,status:'PENDING_COMMITTEE_REVIEW',
    complianceReason:matchedRestriction(d,tags),submittedBy:actor==='COORDINATOR'?'Coordinator':'Preparatory Committee'};
}
export function reviewByCommittee(d:NominatedArtistDossier,actor:string,endorse:boolean,minutes:string,tags:string[],at:string):NominatedArtistDossier {
  if (actor!=='PREP_COMMITTEE' || d.status!=='PENDING_COMMITTEE_REVIEW' || d.committeeReview || !Number.isFinite(Date.parse(at))
    || !Number.isFinite(Date.parse(d.submittedAt)) || Date.parse(at)<Date.parse(d.submittedAt) || minutes.length>4000 || (!endorse&&!minutes.trim())
    || (endorse&&(!validDossier(d)||matchedRestriction(d,tags)))) return d;
  return {...d,status:endorse?'PENDING_DIRECTOR_REVIEW':'COMMITTEE_REJECTED',committeeReview:{decision:endorse?'ENDORSED':'REJECTED',minutes:minutes.trim(),at,actor:'PREP_COMMITTEE'}};
}
export function directorEligible(d:NominatedArtistDossier,tags:string[]):boolean {
  return d.status==='PENDING_DIRECTOR_REVIEW' && d.committeeReview?.decision==='ENDORSED' && validDossier(d) && !matchedRestriction(d,tags);
}
export function safePortfolioUrl(value?:string):string|undefined {
  try { const url=new URL(value??'');return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url.href:undefined; } catch { return undefined; }
}
