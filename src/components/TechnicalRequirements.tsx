import {MonitorPlay,Plus,Trash2,ShieldCheck} from 'lucide-react';
import {HARDWARE,MOUNTING,technicalMatrixTicket,matrixCleared,type TechnicalRequirement} from '../data/technicalMatrix';
import {useSessionDraft} from '../context/SessionDrafts';
import {activeSpatialClaim,VENUE_SPACES,type SpatialClaim} from '../data/spatialClaims';
import {emptyGovernance,type Governance} from '../data/venueGovernance';
import {VenueClearanceStep} from './VenueGovernance';
import type {NominatedArtistDossier} from './ArtistNominationForm';
const hardwareAr=['جهاز عرض مرئي','تجهيزات إضاءة','شاشة عرض','قاعدة عرض'];
const mountingAr=['قائم على الأرض','تثبيت سقفي','تثبيت جداري'];
const field='block w-full rounded border border-[#D9CEBA] bg-white ps-3 pe-3 py-2';
export function TechnicalRequirementsEditor({rows,onChange,isAr}:{rows:TechnicalRequirement[];onChange:(rows:TechnicalRequirement[])=>void;isAr:boolean}){
 return <section className="space-y-3 rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-4 pe-4 py-4 text-start"><h3 className="flex items-center gap-2 font-semibold"><MonitorPlay aria-hidden="true"/>{isAr?'المتطلبات التقنية':'Technical Requirements'}</h3><p>{isAr?'سجّل كل احتياج للتنفيذ. ترك القائمة فارغة يعني عدم طلب معدات.':'Record each execution requirement. An empty list means no equipment requested.'}</p>
 {rows.map((row,index)=><fieldset key={row.id} className="grid gap-3 rounded border ps-3 pe-3 py-3 sm:grid-cols-2"><legend>{isAr?'متطلب':'Requirement'} {index+1}</legend>
 <label>{isAr?'المعدات':'Hardware'}<select className={field} value={row.equipment} onChange={e=>onChange(rows.map(r=>r.id===row.id?{...r,equipment:e.target.value as TechnicalRequirement['equipment']}:r))}>{HARDWARE.map((v,i)=><option key={v} value={v}>{isAr?hardwareAr[i]:v.replaceAll('_',' ')}</option>)}</select></label>
 <label>{isAr?'طريقة التثبيت':'Mounting method'}<select className={field} value={row.mounting} onChange={e=>onChange(rows.map(r=>r.id===row.id?{...r,mounting:e.target.value as TechnicalRequirement['mounting']}:r))}>{MOUNTING.map((v,i)=><option key={v} value={v}>{isAr?mountingAr[i]:v.replaceAll('_',' ')}</option>)}</select></label>
 <label className="sm:col-span-2">{isAr?'المواصفات المطلوبة':'Required specifications'}<textarea required maxLength={2000} className={field} value={row.specifications} onChange={e=>onChange(rows.map(r=>r.id===row.id?{...r,specifications:e.target.value}:r))}/></label>
 <button type="button" className="flex items-center gap-2 text-red-800" onClick={()=>onChange(rows.filter(r=>r.id!==row.id))}><Trash2 aria-hidden="true"/>{isAr?'حذف المتطلب':'Remove requirement'} {index+1}</button></fieldset>)}
 <button type="button" disabled={rows.length>=20} className="flex items-center gap-2 rounded border ps-3 pe-3 py-2 disabled:opacity-50" onClick={()=>onChange([...rows,{id:crypto.randomUUID(),equipment:'AV_PROJECTOR',specifications:'',mounting:'FLOOR_FREESTANDING'}])}><Plus aria-hidden="true"/>{isAr?'إضافة متطلب تقني':'Add technical requirement'}</button></section>;
}
export function GreenlightedTechnicalMatrix({dossier,isAr,blocked=false,register=false}:{dossier:NominatedArtistDossier;isAr:boolean;blocked?:boolean;register?:boolean}){
 const [claims]=useSessionDraft<SpatialClaim[]>('spatial-claims:biennial-2026',[]);
 const [governance]=useSessionDraft<Governance>('venue-governance:v1',emptyGovernance);
 const claim=activeSpatialClaim(claims,dossier.id);
 return <section className="my-4 space-y-3 rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-5 text-start"><h2 className="flex items-center gap-2 text-xl"><ShieldCheck aria-hidden="true"/>{isAr?'مصفوفة التصاريح التقنية':'Greenlighted Technical Matrix'}</h2><h3>{dossier.artistName}</h3>
 <p className="text-sm">{isAr?'سجل محاكاة مشترك — اعتماد العمل أو حجز القاعة لا يمنح تصريح تركيب.':'Shared rehearsal record — artwork approval or a room claim does not grant installation clearance.'}</p>
 <p>{claim?`${VENUE_SPACES.find(v=>v.id===claim.spaceId)?.[isAr?'ar':'en']} · ${claim.curator}`:(isAr?'بانتظار تخصيص القاعة':'Awaiting room allocation')}</p>
 {!dossier.technicalRequirements?.length&&<p>{isAr?'لم تسجل متطلبات تقنية؛ لا يفترض النظام تصريحاً.':'No technical requirements recorded; clearance is not inferred.'}</p>}
 {dossier.technicalRequirements?.map(r=>{const ticket=technicalMatrixTicket(dossier,r,claims,blocked),cleared=matrixCleared(ticket,governance),record=ticket?governance.tickets[ticket.id]:undefined;return <article key={r.id} className={`space-y-2 rounded border ps-4 pe-4 py-4 ${cleared?'border-green-600 bg-green-50':'border-amber-300 bg-white'}`}><h4>{isAr?hardwareAr[HARDWARE.indexOf(r.equipment)]:r.equipment}</h4><p>{r.specifications}</p><p>{isAr?mountingAr[MOUNTING.indexOf(r.mounting)]:r.mounting}</p><p role="status">{cleared?'CLEARED_BY_CURATOR':blocked||ticket?.blocked?'LOCKED':ticket?'PENDING_VENUE_APPROVAL':'AWAITING_APPROVED_ROOM'}</p>
 {cleared&&<p>{record?.clearedBy} · {record?.clearedAt} · {isAr?'استخدم التصريح المسجل؛ لا يلزم طلب مكرر للنطاق نفسه.':'Use this recorded clearance; no repeat request is needed for this exact scope.'}</p>}
 {register&&ticket&&<VenueClearanceStep ticket={ticket}/>}</article>;})}</section>;
}
