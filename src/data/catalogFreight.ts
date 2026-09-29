import {CATALOG_SCHEDULE} from './catalogMetadata';
export type TextMetadata={title:string;medium:string;concept:string;bio?:string;language?:string;title_ar?:string};
export type CatalogArtwork={id:string;scenario_id:string;zone_id:string;media_object_name:string;source:TextMetadata;translation_ar:TextMetadata|null;production_year:number;height_cm:number;width_cm:number;weight_kg:number;crate_count:number;translation_status:'PENDING_TRANSLATION'|'TRANSLATION_COMPLETED';translated_at?:string};
export const conceptWords=(text:string)=>text.trim()?text.trim().split(/\s+/u).length:0;
export const validConcept=(text:string)=>Boolean(text.trim()&&conceptWords(text)<=50);
export function safeMapUrl(value:string){try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&['maps.google.com','www.google.com','maps.app.goo.gl','goo.gl','www.makani.ae','makani.ae'].includes(url.hostname);}catch{return false;}}
export function labelCSV(rows:CatalogArtwork[]){
 const cell=(value:unknown)=>'"'+String(value??'').replace(/^[\s]*[=+@\-]/,"'$&").replace(/"/g,'""')+'"';
 return '\uFEFF'+[['Artwork ID','Title Arabic','Original title','Source language','Year','Medium Arabic','Original medium','Concept Arabic','Original concept','Height cm','Width cm','Weight kg','Approved at'],...rows.filter(r=>r.translation_status==='TRANSLATION_COMPLETED').map(r=>[r.id,r.translation_ar?.title,r.source.title,r.source.language,r.production_year,r.translation_ar?.medium,r.source.medium,r.translation_ar?.concept,r.source.concept,r.height_cm,r.width_cm,r.weight_kg,r.translated_at])].map(row=>row.map(cell).join(',')).join('\r\n');
}
export const shipmentStatuses=['PENDING_ORIGIN_DISPATCH','IN_TRANSIT','CUSTOMS_CLEARANCE','RECEIVED_CONDITION_CHECKED'] as const;
export type FreightBooking={id:string;artwork_id:string;artist_id:string;ready_date:string;unavailable_start:string|null;unavailable_end:string|null;address:Record<string,string>;map_url:string;status:typeof shipmentStatuses[number];requested_date:string|null;change_reason:string|null;change_status:string|null;condition_reference:string|null;history:{event:string;at:string;date:string;requested_date?:string}[]};

/** ISO calendar days; blackout endpoints are inclusive. Invalid/incomplete ranges fail closed. */
export function pickupDateAllowed(date:string,start?:string|null,end?:string|null){
 const valid=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
 return Boolean(valid(date)&&((!start&&!end)||(start&&end&&valid(start)&&valid(end)&&start<=end&&(date<start||date>end))));
}

export const PICKUP_DEADLINE=CATALOG_SCHEDULE.delivery;
export const dubaiToday=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dubai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function pickupWithinSchedule(date:string,start?:string|null,end?:string|null,today=dubaiToday()){
 return pickupDateAllowed(date,start,end)&&date>=today&&date<=PICKUP_DEADLINE;
}
