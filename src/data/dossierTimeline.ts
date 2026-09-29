import type {NominatedArtistDossier} from '../components/ArtistNominationForm';
import type {BilateralContract} from '../types/contractStage6';
export interface DossierEvent {id:string;at:string;actor:string;en:string;ar:string;revision?:number}
export function dossierEvents(d:NominatedArtistDossier,contracts:BilateralContract[]=[]):DossierEvent[]{
 const events:DossierEvent[]=[];
 const add=(id:string,at:string|undefined,actor:string,en:string,ar:string,revision?:number)=>{if(at&&Number.isFinite(Date.parse(at)))events.push({id,at,actor,en,ar,revision});};
 add('submission',d.submittedAt,d.submittedBy,'Dossier submitted','تم تقديم الملف');
 if(d.committeeReview)add('committee',d.committeeReview.at,d.committeeReview.actor,d.committeeReview.decision==='ENDORSED'?'Committee endorsed nomination':'Committee rejected nomination',d.committeeReview.decision==='ENDORSED'?'اعتمدت اللجنة الترشيح':'رفضت اللجنة الترشيح');
 if(d.status==='APPROVED'||d.status==='VETOED')add('director',d.decisionAt,'BIENNIAL_DIRECTOR',d.status==='APPROVED'?'Director approved':'Director vetoed',d.status==='APPROVED'?'اعتماد المدير':'رفض المدير');
 d.delegationHistory?.forEach((r,i)=>add(`delegation:${i}`,r.at,r.by,'Coordinator assignment changed','تغيير تكليف المنسق'));
 d.amendments?.forEach(a=>{add(`${a.id}:request`,a.requestedAt,'COORDINATOR','Scope amendment requested','طلب تعديل النطاق',a.baseRevision);if(a.status!=='PENDING')add(`${a.id}:decision`,a.decidedAt,'BIENNIAL_DIRECTOR',`Scope amendment ${a.status.toLowerCase()}`,a.status==='APPROVED'?'اعتماد تعديل النطاق':'رفض تعديل النطاق',a.baseRevision);});
 d.dispatchHistory?.forEach((r,i)=>add(`dispatch:${i}`,r.at,'COORDINATOR','Dispatch recorded','تسجيل الإرسال',r.revision));
 contracts.filter(c=>c.artistId===d.id).forEach(c=>{add(`${c.id}:sent`,c.sentAt,'COORDINATOR','Agreement dispatched','إرسال الاتفاقية');add(`${c.id}:signed`,c.signedAt,'ARTIST','Agreement acceptance recorded','تسجيل قبول الاتفاقية');c.auditTrail.forEach(r=>{add(`${c.id}:${r.id}:request`,r.requestedAt??r.createdAt,'ARTIST','Contract amendment requested','طلب تعديل الاتفاقية');add(`${c.id}:${r.id}:resolution`,r.resolvedAt,'COORDINATOR','Contract amendment resolved','معالجة تعديل الاتفاقية');});});
 return events.sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)||a.id.localeCompare(b.id));
}
