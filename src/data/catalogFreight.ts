import {formatLabelTitle} from './labelFormatting';
import {CATALOG_SCHEDULE} from './catalogMetadata';
export type TextMetadata={title:string;medium:string;concept:string;bio?:string;language?:string;title_ar?:string};
export type CatalogArtwork={id:string;religious_text?:boolean|null;scenario_id:string;zone_id:string;media_object_name:string;source:TextMetadata;translation_ar:TextMetadata|null;translation_en?:TextMetadata|null;production_year:number;height_cm:number;width_cm:number;weight_kg:number;crate_count:number;translation_status:'PENDING_TRANSLATION'|'TRANSLATION_COMPLETED';translated_at?:string};
export const conceptWords=(text:string)=>text.trim()?text.trim().split(/\s+/u).length:0;
export const validConcept=(text:string)=>Boolean(text.trim()&&conceptWords(text)<=50);
export function safeMapUrl(value:string){try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&['maps.google.com','www.google.com','maps.app.goo.gl','goo.gl','www.makani.ae','makani.ae'].includes(url.hostname);}catch{return false;}}
export function labelCSV(rows:CatalogArtwork[]){
 const cell=(value:unknown)=>'"'+String(value??'').replace(/^[\s]*[=+@\-]/,"'$&").replace(/"/g,'""')+'"';
 return '\uFEFF'+[['Artwork ID','Title Arabic','Original title','Source language','Year','Medium Arabic','Original medium','Concept Arabic','Original concept','Height cm','Width cm','Weight kg','Approved at','Title English','Medium English','Concept English','Biography Arabic','Biography English'],...rows.filter(bilingualComplete).map(r=>[r.id,formatLabelTitle(publicText(r,'ar')?.title??'',r.religious_text===true),formatLabelTitle(r.source.title,r.religious_text===true),r.source.language,r.production_year,publicText(r,'ar')?.medium,r.source.medium,publicText(r,'ar')?.concept,r.source.concept,r.height_cm,r.width_cm,r.weight_kg,r.translated_at,formatLabelTitle(publicText(r,'en')?.title??'',r.religious_text===true),publicText(r,'en')?.medium,publicText(r,'en')?.concept,publicText(r,'ar')?.bio,publicText(r,'en')?.bio])].map(row=>row.map(cell).join(',')).join('\r\n');
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

export const translationFields=['title','medium','concept','bio'] as const;
export function publicText(row:CatalogArtwork,language:'ar'|'en'){return row.source.language===language?row.source:language==='ar'?row.translation_ar:row.translation_en;}
export function bilingualComplete(row:CatalogArtwork){return row.translation_status==='TRANSLATION_COMPLETED'&&(['ar','en'] as const).every(language=>{const text=publicText(row,language);return text&&['title','medium','concept'].every(k=>Boolean(text[k as keyof TextMetadata]?.trim()))&&(!row.source.bio?.trim()||text.bio?.trim());});}

export function amountMinor(value:string){const s=value.trim();if(!/^\d{1,9}(\.\d{1,2})?$/.test(s))return null;const [whole,fraction='']=s.split('.');const n=Number(whole)*100+Number(fraction.padEnd(2,'0'));return Number.isSafeInteger(n)&&n<=100000000000?n:null;}
export function completeLabelGroups(rows:CatalogArtwork[],scopes:{scenario_id:string;expected_count:number}[]){return rows.filter(row=>{const scope=scopes.find(s=>s.scenario_id===row.scenario_id),group=rows.filter(r=>r.scenario_id===row.scenario_id);return scope&&scope.expected_count>0&&group.length===scope.expected_count&&group.every(r=>bilingualComplete(r)&&typeof r.religious_text==='boolean');});}
