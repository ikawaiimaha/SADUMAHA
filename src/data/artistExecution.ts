import type { CommissionState } from '../types';
import type { CrateSpec } from './installationOperations';
import { validCrate } from './installationOperations';
import { acceptedForCatalog } from './catalogMetadata';
export interface LayoutBlueprint {id:string;contractId:string;revision:number;file:File;at:string}
export interface DomesticPickup {id:string;contractId:string;revision:number;status:'PENDING_COLLECTION';emirate:string;area:string;street:string;building:string;date:string;contact:string;phone:string;crate:CrateSpec;at:string}
export const EMIRATES=['Abu Dhabi','Dubai','Sharjah','Ajman','Umm Al Quwain','Ras Al Khaimah','Fujairah'];
export const domesticCountry=(v?:string)=>['uae','united arab emirates','ae','الإمارات','الإمارات العربية المتحدة'].includes(v?.trim().toLowerCase()??'');
export function validLayout(file:File){return Boolean(file&&file.size>0&&file.size<=20*1024*1024&&((/\.pdf$/i.test(file.name)&&['','application/pdf'].includes(file.type))||(/\.png$/i.test(file.name)&&['','image/png'].includes(file.type))||(/\.jpe?g$/i.test(file.name)&&['','image/jpeg'].includes(file.type))));}
export function validPickup(p:DomesticPickup){const date=new Date(p.date+'T12:00:00+04:00');return EMIRATES.includes(p.emirate)&&[p.area,p.street,p.building,p.contact].every(v=>v.trim().length>0&&v.length<=250)&&/^\+?[\d ()-]{7,25}$/.test(p.phone)&&p.phone.replace(/\D/g,'').length>=7&&p.phone.replace(/\D/g,'').length<=15&&/^\d{4}-\d{2}-\d{2}$/.test(p.date)&&Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===p.date&&Date.parse(p.date+'T23:59:59+04:00')>Date.parse(p.at);}
export type ArtistExecutionAction={type:'upload-layout';actor:string;id:string;contractId:string;file:File;at:string}|{type:'request-domestic-pickup';actor:string;input:Omit<DomesticPickup,'crate'|'revision'|'status'>};
export function artistExecutionTransition(s:CommissionState,a:ArtistExecutionAction):CommissionState {
 const c=s.contracts[0];if(a.actor!=='ARTIST'||!acceptedForCatalog(c)||s.installationStatus==='ARCHIVED_CLOSED'||s.installationStatus==='EXECUTIVE_IMPOUND')return s;
 if(a.type==='upload-layout'){
  if(a.contractId!==c.id||!a.id||!Number.isFinite(Date.parse(a.at))||!validLayout(a.file)||s.layoutBlueprints?.some(r=>r.id===a.id))return s;
  return {...s,layoutBlueprints:[...(s.layoutBlueprints??[]),{id:a.id,contractId:c.id,revision:s.agreementRevision,file:a.file,at:a.at}]};
 }
 const p=a.input;
 if(p.contractId!==c.id||!p.id||!domesticCountry(s.administration?.country)||s.administration?.contractId!==c.id||!validCrate(c.crate)||s.logistics||s.acquisition||s.domesticPickups?.some(r=>r.id===p.id||r.contractId===c.id&&r.revision===s.agreementRevision))return s;
 const ticket:DomesticPickup={...p,crate:{...c.crate},revision:s.agreementRevision,status:'PENDING_COLLECTION'};
 return validPickup(ticket)?{...s,domesticPickups:[...(s.domesticPickups??[]),ticket]}:s;
}
