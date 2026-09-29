export const RESOURCES=['3-Ton Hydraulic Pickup','Climate-Controlled Fine Art Van','AV Projector','Installation Technicians'] as const;
export type Agency='SAF'|'SMA';
export interface ResourceTicket {
 id:string;artistId:string;scopeKey:string;resource:typeof RESOURCES[number];agency:Agency;requiredAt:string;requestedAt:string;
 response?:{status:'CONFIRMED'|'DENIED';reference:string;at:string;deliveryAt?:string};
 rental?:{vendor:string;amount:number;reason:string;at:string;requestedBy:string;decision?:'APPROVED'|'REJECTED';reference?:string;decidedAt?:string};
}
export const responseDue=(ticket:ResourceTicket)=>Date.parse(ticket.requestedAt)+48*60*60*1000;
export const contingencyOpen=(ticket:ResourceTicket,now:number)=>Number.isFinite(now)&&ticket.response?.status!=='CONFIRMED'&&(ticket.response?.status==='DENIED'||now>=responseDue(ticket));
export type ResourceAction=
 | {type:'request';ticket:ResourceTicket}
 | {type:'response';id:string;status:'CONFIRMED'|'DENIED';reference:string;deliveryAt?:string}
 | {type:'rental';id:string;vendor:string;amount:number;reason:string}
 | {type:'finance';id:string;approve:boolean;reference:string};
export function resourceTransition(rows:ResourceTicket[],action:ResourceAction,actor:string,at:string,eligibleIds:readonly string[],assignedIds:readonly string[],coordinatorId:string,scopeKeys:Record<string,string>):ResourceTicket[]{
 const now=Date.parse(at);if(!Number.isFinite(now))return rows;
 if(action.type==='request'){
  const t=action.ticket;
  if(actor!=='TECHNICAL'||!eligibleIds.includes(t.artistId)||!scopeKeys[t.artistId]||t.scopeKey!==scopeKeys[t.artistId]||!t.id||!RESOURCES.includes(t.resource)||!['SAF','SMA'].includes(t.agency)||t.response||t.rental||t.requestedAt!==at||!Number.isFinite(Date.parse(t.requiredAt))||Date.parse(t.requiredAt)<=now||rows.some(r=>r.id===t.id||(r.artistId===t.artistId&&r.scopeKey===t.scopeKey&&r.agency===t.agency&&r.resource===t.resource&&r.requiredAt===t.requiredAt)))return rows;
  return [...rows,{...t}];
 }
 const ticket=rows.find(t=>t.id===action.id);
 if(!ticket||!eligibleIds.includes(ticket.artistId)||ticket.scopeKey!==scopeKeys[ticket.artistId]||now<Date.parse(ticket.requestedAt))return rows;
 let updated:ResourceTicket;
 if(action.type==='response'){
  // This records a supplied agency response; it does not impersonate the agency.
  if(actor!=='TECHNICAL'||ticket.response||!['CONFIRMED','DENIED'].includes(action.status)||!action.reference.trim()||action.reference.length>500||ticket.rental?.decision==='APPROVED'||(action.status==='CONFIRMED'&&(!action.deliveryAt||!Number.isFinite(Date.parse(action.deliveryAt))||Date.parse(action.deliveryAt)<now)))return rows;
  updated={...ticket,response:{status:action.status,reference:action.reference.trim(),at,...(action.status==='CONFIRMED'?{deliveryAt:action.deliveryAt}:{})}};
 }else if(action.type==='rental'){
  if(actor!=='COORDINATOR'||!assignedIds.includes(ticket.artistId)||!coordinatorId||ticket.rental||!contingencyOpen(ticket,now)||!action.vendor.trim()||action.vendor.length>200||!action.reason.trim()||action.reason.length>2000||!Number.isFinite(action.amount)||action.amount<=0)return rows;
  updated={...ticket,rental:{vendor:action.vendor.trim(),amount:action.amount,reason:action.reason.trim(),at,requestedBy:coordinatorId}};
 }else{
  if(actor!=='FINANCE'||!ticket.rental||ticket.rental.decision||!contingencyOpen(ticket,now)||now<Date.parse(ticket.rental.at)||!action.reference.trim()||action.reference.length>500)return rows;
  updated={...ticket,rental:{...ticket.rental,decision:action.approve?'APPROVED':'REJECTED',reference:action.reference.trim(),decidedAt:at}};
 }
 return rows.map(t=>t.id===ticket.id?updated:t);
}
