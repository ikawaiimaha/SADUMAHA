import type { ArtistDocumentIntake, BilateralContract } from '../types/contractStage6';
export const CATALOG_SCHEDULE = {photography:'2026-08-15',delivery:'2026-09-10'} as const;
export interface CatalogMetadata {contractId:string;artistId:string;agreementRevision:number;titleAr:string;titleEn:string;statement:string;submittedAt:string}
export const acceptedForCatalog=(c?:BilateralContract)=>Boolean(c&&['ARTIST_APPROVED','LOCKED'].includes(c.status));
export const validCatalogFields=(m:Pick<CatalogMetadata,'titleAr'|'titleEn'|'statement'>)=>[m.titleAr,m.titleEn].every(v=>typeof v==='string'&&v.trim().length>0&&v.length<=250)&&typeof m.statement==='string'&&m.statement.trim().length>0&&m.statement.length<=12000;
export function photographyStatus(d:ArtistDocumentIntake):'PENDING'|'REVIEW'|'CLEARED'|'REJECTED' {
 if(d.highResStatus==='REJECTED')return 'REJECTED';
 if(d.highResStatus==='NOT_UPLOADED'||!d.highResArtworkFileName||!d.highResUploadedAt)return 'PENDING';
 if(d.highResStatus==='VERIFIED'&&d.highResVerifiedAt&&Number.isFinite(Date.parse(d.highResVerifiedAt))&&Date.parse(d.highResVerifiedAt)>=Date.parse(d.highResUploadedAt)&&Number.isFinite(d.artworkDpi)&&d.artworkDpi>=300)return 'CLEARED';
 return 'REVIEW';
}
