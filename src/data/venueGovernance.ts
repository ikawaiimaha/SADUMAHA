import { VENUE_SPACES } from './spatialClaims';
export interface RoleDelegation {role:string;onLeave:boolean;backupName:string}
export interface VenueApproval {id:string;artistId:string;title:string;venueId:string;authority:string;coordinator:string;vendor?:string;constraints:string[];blocked:boolean;status:'PENDING_VENUE_APPROVAL'|'APPROVED_FOR_INSTALLATION';clearedAt?:string;clearedBy?:string;notifications?:{recipient:string;at:string}[]}
export interface Governance {delegations:Record<string,RoleDelegation>;tickets:Record<string,VenueApproval>}
export const emptyGovernance:Governance={delegations:{},tickets:{}};
export function assignee(role:string,delegations:Governance['delegations']){const d=delegations[role];return d?.onLeave?(d.backupName.trim()?`${role}:backup`:null):`${role}:primary`;}
export function setDelegation(s:Governance,role:string,onLeave:boolean,backupName:string){if(!role||backupName.length>100||onLeave&&!backupName.trim())return s;return {...s,delegations:{...s.delegations,[role]:{role,onLeave,backupName:backupName.trim()}}};}
export function clearVenue(s:Governance,id:string,identity:string,at:string):Governance {
 const t=s.tickets[id];if(!t||t.blocked||t.status!=='PENDING_VENUE_APPROVAL'||!VENUE_SPACES.some(v=>v.venueId===t.venueId)||!t.authority.trim()||!t.coordinator.trim()||!t.constraints.length||t.constraints.some(c=>!c.trim())||!Number.isFinite(Date.parse(at))||identity!==assignee(`VENUE:${t.venueId}`,s.delegations))return s;
 return {...s,tickets:{...s.tickets,[id]:{...t,status:'APPROVED_FOR_INSTALLATION',clearedAt:at,clearedBy:identity,notifications:[{recipient:t.coordinator,at},...(t.vendor?[{recipient:t.vendor,at}]:[])]}}};
}

