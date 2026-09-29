export interface GuestTravelRow {
 id:string;contract_id:string;artist_id:string;artist_name:string;contract_status:string;
 arrival:string;departure:string;airport:'DXB'|'SHJ'|'OTHER';companion_name:string|null;
 photo_extension:'jpg'|'png';created_at:string;passport_uploaded:boolean;photo_uploaded:boolean;companion_uploaded:boolean;
}
export function validTravelDates(arrival:string,departure:string){
 const valid=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
 return valid(arrival)&&valid(departure)&&departure>=arrival;
}
export function latestGuestRows(rows:GuestTravelRow[]){
 const latest=new Map<string,GuestTravelRow>();
 for(const r of [...rows].sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.id.localeCompare(a.id)))if(!latest.has(r.contract_id))latest.set(r.contract_id,r);
 return [...latest.values()];
}
export const guestFilesComplete=(r:GuestTravelRow)=>r.passport_uploaded&&r.photo_uploaded&&(!r.companion_name||r.companion_uploaded);
