import type { CommissionState } from '../types';
export interface CollectionTerms {priceUSD:number;returnAddress:string;packing:string;at:string}
export type CloseoutAction = {type:'collection-terms';actor:string;terms:CollectionTerms}|{type:'acquire'|'return-ticket'|'archive';actor:string;at:string}|{type:'return-awb';actor:string;at:string;file:File};
export const validCollectionTerms=(v:CollectionTerms)=>Number.isFinite(v.priceUSD)&&v.priceUSD>0&&v.returnAddress.trim().length>=10&&v.returnAddress.length<=2000&&v.packing.trim().length>0&&v.packing.length<=2000&&Number.isFinite(Date.parse(v.at));
export function closeoutTransition(s:CommissionState,a:CloseoutAction):CommissionState {
 if(s.installationStatus==='ARCHIVED_CLOSED')return s;
 const c=s.contracts[0];if(!c)return s;
 if(a.type==='collection-terms')return a.actor==='ARTIST'&&!s.acquisition&&!s.returnFreight&&validCollectionTerms(a.terms)?{...s,collectionTerms:{...a.terms}}:s;
 if(!Number.isFinite(Date.parse(a.at))||!['ARTIST_APPROVED','LOCKED'].includes(c.status)||!s.logistics||s.installationStatus==='EXECUTIVE_IMPOUND')return s;
 if(a.type==='acquire'){
  if(a.actor!=='BIENNIAL_DIRECTOR'||s.acquisition||s.returnFreight?.awb||!s.collectionTerms||!validCollectionTerms(s.collectionTerms))return s;
  return {...s,acquisition:{status:'ACQUIRED_BY_INSTITUTION',priceUSD:s.collectionTerms.priceUSD,at:a.at,payoutStatus:'PENDING_FINANCE'},returnFreight:s.returnFreight?{...s.returnFreight,status:'CANCELLED_ACQUISITION',cancelledAt:a.at}:undefined};
 }
 if(a.type==='return-ticket'){
  if(a.actor!=='LOGISTICS'||s.acquisition||s.returnFreight||!s.collectionTerms||!validCollectionTerms(s.collectionTerms))return s;
  return {...s,returnFreight:{status:'PENDING_RETURN',address:s.collectionTerms.returnAddress,packing:s.collectionTerms.packing,at:a.at}};
 }
 if(a.type==='return-awb'){
  if(a.actor!=='LOGISTICS'||s.acquisition||s.returnFreight?.status!=='PENDING_RETURN'||s.returnFreight.awb||!a.file||!a.file.size||a.file.size>10*1024*1024||!/\.pdf$/i.test(a.file.name)||!['','application/pdf'].includes(a.file.type))return s;
  return {...s,returnFreight:{...s.returnFreight,awb:a.file,awbAt:a.at}};
 }
 if(a.type==='archive'){
  if(a.actor!=='LOGISTICS'||s.acquisition||!s.returnFreight?.awb||s.returnFreight.status!=='PENDING_RETURN')return s;
  return {...s,installationStatus:'ARCHIVED_CLOSED',archivedAt:a.at,returnFreight:{...s.returnFreight,status:'CLOSED'}};
 }
 return s;
}
