export const MISSING_ITEMS = {VIDEO:{en:'High-Res Video Master',ar:'ملف الفيديو النهائي'},SPECS:{en:'Technical/AV Specs',ar:'المواصفات التقنية'},LAYOUT:{en:'Fabrication/Layout Approval',ar:'اعتماد التركيب/المخطط'}} as const;
export type MissingItem=keyof typeof MISSING_ITEMS;
export interface CuratorialNudge {id:string;artistId:string;items:MissingItem[];deadline:string;createdAt:string}
export function deadlineTime(date:string):number {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return NaN;
 const parsed=Date.parse(date+'T00:00:00Z');
 if(!Number.isFinite(parsed)||new Date(parsed).toISOString().slice(0,10)!==date)return NaN;
 return Date.parse(date+'T23:59:59+04:00');
}
export function addNudge(rows:CuratorialNudge[],n:CuratorialNudge,actor:string):CuratorialNudge[]{
 if(actor!=='HIP'||!n.id||!n.artistId||!n.items.length||new Set(n.items).size!==n.items.length||!n.items.every(i=>Object.hasOwn(MISSING_ITEMS,i))||!Number.isFinite(Date.parse(n.createdAt))||!Number.isFinite(deadlineTime(n.deadline))||deadlineTime(n.deadline)<=Date.parse(n.createdAt)||rows.some(r=>r.id===n.id||r.artistId===n.artistId&&r.deadline===n.deadline&&[...r.items].sort().join() === [...n.items].sort().join()))return rows;
 return [...rows,{...n,items:[...n.items]}];
}
export interface FabricationTicket {id:string;artistId:string;item:string;vendor:string;disposition:'RETURN_TO_ARTIST'|'DISCARD';status:'PENDING_FABRICATION'|'READY_FOR_INSTALL';createdAt:string;readyAt?:string}
export function addFabrication(rows:FabricationTicket[],t:FabricationTicket,actor:string,blocked=false):FabricationTicket[]{
 if(blocked||actor!=='COORDINATOR'||!t.id||!t.artistId||!t.item.trim()||t.item.length>250||!t.vendor.trim()||t.vendor.length>200||!['RETURN_TO_ARTIST','DISCARD'].includes(t.disposition)||t.status!=='PENDING_FABRICATION'||t.readyAt||!Number.isFinite(Date.parse(t.createdAt))||rows.some(r=>r.id===t.id||r.artistId===t.artistId&&r.item.trim().toLowerCase()===t.item.trim().toLowerCase()&&r.vendor.trim().toLowerCase()===t.vendor.trim().toLowerCase()))return rows;
 return [...rows,{...t,item:t.item.trim(),vendor:t.vendor.trim()}];
}
export function readyFabrication(rows:FabricationTicket[],id:string,actor:string,at:string,blocked=false):FabricationTicket[]{
 const row=rows.find(r=>r.id===id);if(blocked||actor!=='TECHNICAL'||!row||row.status!=='PENDING_FABRICATION'||!Number.isFinite(Date.parse(at))||Date.parse(at)<Date.parse(row.createdAt))return rows;
 return rows.map(r=>r.id===id?{...r,status:'READY_FOR_INSTALL',readyAt:at}:r);
}
