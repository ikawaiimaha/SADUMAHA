import type {NominatedArtistDossier} from '../components/ArtistNominationForm';
import {COORDINATORS} from './participation2026';
type Evidence={id:string;status:string;prCleared?:boolean};
const inactive=['ARCHIVED_CLOSED','DIRECTOR_VETOED','COMMITTEE_REJECTED','CONTRACT_DISPUTED','AMENDMENT_UNDER_REVIEW','EXECUTIVE_IMPOUND','DAMAGED_PENDING_ARTIST_APPROVAL'];
export function institutionalMetrics(dossiers:NominatedArtistDossier[],evidence:Evidence[]){
 const people=[...new Map(evidence.map(a=>[a.id,a])).values()];
 const active=[...new Map(dossiers.map(d=>[d.id,d])).values()].filter(d=>d.status==='APPROVED'&&!d.amendments?.some(a=>a.status==='PENDING')&&!inactive.includes(people.find(a=>a.id===d.id)?.status??''));
 return {executedArtists:people.filter(a=>a.status==='CONTRACT_EXECUTED'&&active.some(d=>d.id===a.id)).length,
  clearedGuests:people.filter(a=>a.prCleared===true&&!['ARCHIVED_CLOSED','DIRECTOR_VETOED','COMMITTEE_REJECTED'].includes(a.status)&&dossiers.some(d=>d.id===a.id&&d.status==='APPROVED')).length,
  approvedDossiers:active.length,
  workloads:COORDINATORS.map(c=>{const rows=active.filter(d=>d.assignedCoordinatorId===c.id);return {...c,dossiers:rows.length,artworks:rows.reduce((n,d)=>n+(Number.isInteger(d.artworkCount)&&d.artworkCount!>=0?d.artworkCount!:0),0),unknownCounts:rows.filter(d=>!Number.isInteger(d.artworkCount)||d.artworkCount!<0).length};})};
}
export function reassignDossier(rows:NominatedArtistDossier[],id:string,target:string,reason:string,actor:string,at:string,lockedIds:readonly string[]){
 const d=rows.find(d=>d.id===id);
 if(actor!=='BIENNIAL_DIRECTOR'||!d||d.status!=='APPROVED'||lockedIds.includes(id)||d.amendments?.some(a=>a.status==='PENDING')||d.assignedCoordinatorId===target||!COORDINATORS.some(c=>c.id===target)||!reason.trim()||reason.length>1000||!Number.isFinite(Date.parse(at)))return rows;
 return rows.map(row=>row.id===id?{...row,assignedCoordinatorId:target,delegationHistory:[...(row.delegationHistory??[]),{from:row.assignedCoordinatorId,to:target,region:'INDIVIDUAL_TRANSFER',reason:reason.trim(),by:actor,at}]}:row);
}
