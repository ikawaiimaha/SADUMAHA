export type StayException={id:string;artistId:string;departure:string;nightlyAED:number;reason:string;status:'DIRECTOR_REVIEW'|'FINANCE_REVIEW'|'APPROVED'|'REJECTED';events:{actor:string;at:string;decision:string}[]};
export function extraNights(departure:string){const n=(Date.parse(departure)-Date.parse('2026-10-11'))/86400000;return /^\d{4}-\d{2}-\d{2}$/.test(departure)&&Number.isFinite(n)&&Number.isInteger(n)&&n>0&&n<=60&&new Date(departure).toISOString().slice(0,10)===departure?n:0;}
export function decideStay(s:StayException,actor:string,approve:boolean,at:string):StayException{
 if(!Number.isFinite(Date.parse(at))||!extraNights(s.departure)||!Number.isFinite(s.nightlyAED)||s.nightlyAED<=0)return s;
 if(!((s.status==='DIRECTOR_REVIEW'&&actor==='BIENNIAL_DIRECTOR')||(s.status==='FINANCE_REVIEW'&&actor==='FINANCE')))return s;
 return {...s,status:!approve?'REJECTED':actor==='BIENNIAL_DIRECTOR'?'FINANCE_REVIEW':'APPROVED',events:[...s.events,{actor,at,decision:approve?'APPROVE':'REJECT'}]};
}
