import type { NominatedArtistDossier } from '../components/ArtistNominationForm';
export interface SupplierDelivery {
  id: string; dossierId: string; coordinatorId: string; vendorName: string; vendorId: string;
  deliverable: string; invoiceReference: string; evidenceReference: string; recordedAt: string;
  signedOffAt?: string; receivedByFinanceAt?: string;
}
export type SupplierAction =
  | {type:'record'; actor:string; record:SupplierDelivery}
  | {type:'sign-off'|'finance-receipt'; actor:string; id:string; coordinatorId:string; at:string};
export function supplierTransition(rows:SupplierDelivery[], action:SupplierAction, dossiers:NominatedArtistDossier[]):SupplierDelivery[] {
  if(action.type==='record') {
    const r=action.record, d=dossiers.find(d=>d.id===r.dossierId);
    if(action.actor!=='TECHNICAL'||!d||d.status!=='APPROVED'||d.assignedCoordinatorId!==r.coordinatorId||!r.coordinatorId||r.signedOffAt||r.receivedByFinanceAt||!Number.isFinite(Date.parse(r.recordedAt))||[r.id,r.vendorName,r.vendorId,r.deliverable,r.invoiceReference,r.evidenceReference].some(v=>!v.trim())||rows.some(row=>row.id===r.id||(row.vendorId===r.vendorId.trim()&&row.invoiceReference===r.invoiceReference.trim()))) return rows;
    return [...rows,{...r,vendorName:r.vendorName.trim(),vendorId:r.vendorId.trim(),deliverable:r.deliverable.trim(),invoiceReference:r.invoiceReference.trim(),evidenceReference:r.evidenceReference.trim()}];
  }
  const r=rows.find(r=>r.id===action.id), d=r&&dossiers.find(d=>d.id===r.dossierId);
  if(!r||!d||d.status!=='APPROVED'||!Number.isFinite(Date.parse(action.at))) return rows;
  if(action.type==='sign-off') {
    if(action.actor!=='COORDINATOR'||r.coordinatorId!==action.coordinatorId||d.assignedCoordinatorId!==action.coordinatorId||r.signedOffAt||d.amendments?.some(a=>a.status==='PENDING')) return rows;
    return rows.map(row=>row.id===r.id?{...row,signedOffAt:action.at}:row);
  }
  if(action.actor!=='FINANCE'||!r.signedOffAt||r.receivedByFinanceAt) return rows;
  return rows.map(row=>row.id===r.id?{...row,receivedByFinanceAt:action.at}:row);
}
export interface PackingEvidence {containerType:'CRATE'|'PLASTIC_CYLINDER'; carrierReference:string; files:File[]; recordedAt:string}
export const validPhoto = (f:Pick<File,'type'|'size'>) => ['image/jpeg','image/png','image/webp'].includes(f.type)&&f.size>0&&f.size<=10*1024*1024;
export function validPacking(record:PackingEvidence) {
  return ['CRATE','PLASTIC_CYLINDER'].includes(record.containerType)&&Boolean(record.carrierReference.trim())&&Number.isFinite(Date.parse(record.recordedAt))&&record.files.length>0&&record.files.length<=10&&record.files.every(validPhoto);
}
