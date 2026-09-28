import { useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { CommissionState } from '../types';
import type { CommissionAction } from '../data/commissionScenario';
export function InstallationIntervention({state,isAr,actor,onRecord}:{state:CommissionState;isAr:boolean;actor:'BIENNIAL_DIRECTOR'|'COORDINATOR'|'TECHNICAL';onRecord?:(action:CommissionAction)=>void}) {
 const [directives,setDirectives]=useState('');
 const [confirmed,setConfirmed]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 const c=state.contracts[0];
 const active=Boolean(state.installationStatus!=='ARCHIVED_CLOSED'&&c&&['ARTIST_APPROVED','LOCKED'].includes(c.status)&&state.logistics&&!state.logistics.closedAt);
 const locked=state.installationStatus==='EXECUTIVE_IMPOUND';
 const last=state.impounds?.slice(-1)[0];
 const t=(ar:string,en:string)=>isAr?ar:en;
 if(actor!=='BIENNIAL_DIRECTOR'&&!last)return null;
 return <section className={`my-5 space-y-4 rounded border-2 ps-5 pe-5 py-5 text-start ${locked?'border-red-700 bg-red-50':'border-[#D9CEBA] bg-[#F7F1E6]'}`}>
 <h2 className="flex items-center gap-2 text-xl font-semibold"><AlertTriangle aria-hidden="true" className="size-5"/>{actor==='BIENNIAL_DIRECTOR'?t('متابعة التركيبات النشطة','Active Installations Monitoring'):t('توجيه إداري','Administrative Directive')}</h2>
 {active?<p>{c!.artistName} · {c!.proposedWorkTitle} · {locked?'EXECUTIVE_IMPOUND':t('المرحلة 7 — التركيب','Stage 7 — Installation')}</p>:<p>{t('لا توجد أعمال في التركيب: يلزم اتفاق مقبول واستلام فعلي دون إغلاق المعرض.','No active installations: requires an accepted agreement and physical receipt before exhibition closure.')}</p>}
 {last&&<><p className="whitespace-pre-wrap break-words text-lg font-semibold">{last.directives}</p><p>{last.issuedAt}</p>{last.acknowledgedAt&&<p>{t('تأكيد تنفيذ التعديلات؛ يلزم تجديد المراجعة الفنية','Alterations acknowledged; renewed technical review required')} · {last.acknowledgedAt}</p>}</>}
 {locked&&<p role="alert">{t('سجل التركيب مقفل بقرار المدير.','Installation ledger locked by Director mandate.')}</p>}
 {actor==='BIENNIAL_DIRECTOR'&&<button type="button" disabled={!active||locked} className="rounded bg-red-800 ps-4 pe-4 py-2 text-white disabled:opacity-50" onClick={()=>{setDirectives('');dialog.current?.showModal();}}>{t('إيقاف تنفيذي / تعديل إلزامي','Executive Impound / Mandate Alteration')}</button>}
 {actor==='COORDINATOR'&&locked&&last&&<><label className="flex items-center gap-2"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>{t('تم تنفيذ التعديلات وفق رؤية الدائرة','Alterations executed as per Department vision.')}</label><button type="button" disabled={!confirmed||!onRecord} className="rounded border ps-4 pe-4 py-2 disabled:opacity-50" onClick={()=>{onRecord?.({type:'acknowledge-alterations',actor:'COORDINATOR',impoundId:last.id,confirmed,at:new Date().toISOString()});setConfirmed(false);}}>{t('تسجيل التنفيذ وإحالة للمراجعة الفنية','Record execution and return for technical review')}</button></>}
 {actor==='BIENNIAL_DIRECTOR'&&<dialog ref={dialog} aria-labelledby="impound-title" className="m-auto w-full max-w-xl rounded bg-[#F7F1E6] ps-6 pe-6 py-6 text-start backdrop:bg-black/50" dir={isAr?'rtl':'ltr'}><h3 id="impound-title" className="text-xl font-semibold">{t('توجيهات التعديل الإلزامي','Mandatory alteration directives')}</h3><form className="mt-4 space-y-4" onSubmit={e=>{e.preventDefault();if(!active||locked||!directives.trim()||!c)return;onRecord?.({type:'impound',actor:'BIENNIAL_DIRECTOR',artistId:c.artistId,directives,id:crypto.randomUUID(),at:new Date().toISOString()});dialog.current?.close();}}><label className="block">{t('التوجيه المحدد','Specific directive')}<textarea required value={directives} onChange={e=>setDirectives(e.target.value)} className="mt-2 block w-full border ps-3 pe-3 py-2"/></label><button disabled={!directives.trim()} className="rounded bg-red-800 ps-4 pe-4 py-2 text-white disabled:opacity-50">{t('تسجيل الإيقاف — محاكاة','Record impound — simulated')}</button><button type="button" className="ms-3 rounded border ps-4 pe-4 py-2" onClick={()=>dialog.current?.close()}>{t('إلغاء','Cancel')}</button></form></dialog>}
 </section>;
}
