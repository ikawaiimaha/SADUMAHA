import { validPassportPDF } from './visaIntake';
export interface ArtworkLabel { id:string; titleAr:string; titleEn:string; year:string; medium:string; height:string; width:string; depth:string; image?:File; productionEnabled?:boolean; printingFraming?:string; avRequirements?:string; technicalPDF?:File; technicalPDFVerified?:boolean }
export interface ArtworkRoster { artistId:string; status:'DRAFT'|'LOCKED_PENDING_REVIEW'|'AMENDMENT_REQUESTED'; items:ArtworkLabel[]; history:{revision:number;items:ArtworkLabel[];at:string}[]; events:{action:string;actor:string;at:string}[] }
export type RosterAction = {type:'edit';items:ArtworkLabel[]}|{type:'submit'|'request'|'unlock';at:string};
export function validLabelImage(f?:File){return Boolean(f&&/\.(png|tif|tiff)$/i.test(f.name)&&['','image/png','image/tiff','image/x-tiff'].includes(f.type)&&f.size>0&&f.size<=50*1024*1024);}
export const validProductionSpecs=(a:ArtworkLabel)=>!a.productionEnabled||Boolean((a.printingFraming?.trim()||a.avRequirements?.trim())&&(a.printingFraming?.length??0)<=4000&&(a.avRequirements?.length??0)<=4000&&(!a.technicalPDF||(validPassportPDF(a.technicalPDF)&&a.technicalPDFVerified===true)));
export function validArtwork(a:ArtworkLabel){return Boolean(a.id&&/[\u0620-\u064a]/.test(a.titleAr)&&/[a-z]/i.test(a.titleEn)&&a.titleAr.length<=250&&a.titleEn.length<=250&&a.medium.trim()&&a.medium.length<=250&&/^\d{4}$/.test(a.year)&&+a.year>=1000&&+a.year<=new Date().getFullYear()&&[a.height,a.width,a.depth].every(v=>v.trim()!==''&&Number.isFinite(+v)&&+v>0)&&validLabelImage(a.image)&&validProductionSpecs(a));}
export function rosterTransition(s:ArtworkRoster,a:RosterAction,actor:string,assigned=false):ArtworkRoster {
 if(a.type==='edit')return actor==='ARTIST'&&s.status==='DRAFT'&&a.items.length<=100?{...s,items:a.items.map(i=>({...i}))}:s;
 if(!Number.isFinite(Date.parse(a.at)))return s;
 if(a.type==='submit'&&actor==='ARTIST'&&s.status==='DRAFT'&&s.items.length>0&&s.items.every(validArtwork)&&new Set(s.items.map(i=>i.id)).size===s.items.length)return {...s,status:'LOCKED_PENDING_REVIEW',history:[...s.history,{revision:s.history.length+1,items:s.items.map(i=>({...i})),at:a.at}],events:[...s.events,{action:a.type,actor,at:a.at}]};
 if(a.type==='request'&&actor==='ARTIST'&&s.status==='LOCKED_PENDING_REVIEW')return {...s,status:'AMENDMENT_REQUESTED',events:[...s.events,{action:a.type,actor,at:a.at}]};
 if(a.type==='unlock'&&actor==='COORDINATOR'&&assigned&&s.status==='AMENDMENT_REQUESTED')return {...s,status:'DRAFT',events:[...s.events,{action:a.type,actor,at:a.at}]};
 return s;
}
