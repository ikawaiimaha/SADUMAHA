import type {BilateralContract} from '../types/contractStage6';
import type {CommissionState} from '../types';
import {validCrate} from './installationOperations';

export const LOCAL_VENDORS = [{id:'demo-print',name:'Sharjah Print Workshop — sample'}, {id:'demo-frame',name:'Sharjah Framing Workshop — sample'}];
export type ProductionOrigin = 'INTERNATIONAL_FREIGHT'|'LOCAL_FABRICATION';
export function productionReady(c:{productionOrigin?:ProductionOrigin;localVendorId?:string;crate?:BilateralContract['crate']}):boolean {
 return c.productionOrigin==='LOCAL_FABRICATION' ? LOCAL_VENDORS.some(v=>v.id===c.localVendorId) : validCrate(c.crate);
}
export function requiredWallMeters(items:{width:string}[]):number|null {
 if(!items.length||items.some(item=>!item.width.trim()||!Number.isFinite(Number(item.width))||Number(item.width)<=0))return null;
 return items.reduce((sum,item)=>sum+Number(item.width)+40,0)/100;
}
/** Encodes identity/revision only; no contact or passport details in a QR. */
export function crateToken(state:CommissionState):string|null {
 const c=state.contracts[0];
 if(!c||c.productionOrigin==='LOCAL_FABRICATION'||!validCrate(c.crate))return null;
 return `SADU-CRATE:${encodeURIComponent(c.id)}:${state.agreementRevision}:${encodeURIComponent(c.crate.reference)}`;
}
export interface LocalProductionEvent {contractId:string;revision:number;vendorId:string;stage:'PROOF_RECORDED'|'DELIVERED';reference:string;at:string}
