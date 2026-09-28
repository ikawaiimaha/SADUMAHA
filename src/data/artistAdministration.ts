import type { CommissionState } from '../types';
import { acceptedForCatalog } from './catalogMetadata';
export interface ArtistAdministration {contractId:string;holder:string;bankName?:string;bic?:string;iban:string;address:string;country:string;city:string;at:string}
export const normalizeIBAN=(value:string)=>value.replace(/\s/g,'').toUpperCase();
export function validIBAN(value:string){const s=normalizeIBAN(value);if(!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(s))return false;let remainder=0;for(const c of s.slice(4)+s.slice(0,4)){const digits=/[A-Z]/.test(c)?String(c.charCodeAt(0)-55):c;for(const d of digits)remainder=(remainder*10+Number(d))%97;}return remainder===1;}
export const validAdministration=(v:ArtistAdministration)=>Boolean(v.contractId&&v.holder.trim()&&v.holder.length<=200&&validIBAN(v.iban)&&v.address.trim().length>=10&&v.address.length<=2000&&v.country.trim()&&v.country.length<=100&&v.city.trim()&&v.city.length<=100&&Number.isFinite(Date.parse(v.at)));
export const metadataUnlocked=(s:CommissionState)=>Boolean(acceptedForCatalog(s.contracts[0])&&s.contracts[0].tranches.advanceStatus==='DISBURSED'&&s.ledger?.some(r=>r.tranche==='advance'&&r.revision===s.agreementRevision));

export const validBanking=(v:ArtistAdministration)=>validAdministration(v)&&Boolean(v.bankName?.trim()&&v.bankName.length<=200&&/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(v.bic??''));
export const validTransactionDate=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v&&v<=new Date().toISOString().slice(0,10);
