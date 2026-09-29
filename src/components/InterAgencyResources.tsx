import {useEffect,useState} from 'react';
import {Building2,Clock,FileDown,LifeBuoy} from 'lucide-react';
import {RESOURCES,responseDue,contingencyOpen,type ResourceTicket,type ResourceAction,type Agency} from '../data/interAgencyResources';
import type {NominatedArtistDossier} from './ArtistNominationForm';
const input='block w-full rounded border bg-[#FFFDF7] ps-3 pe-3 py-2';
const button='rounded border ps-4 pe-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed';
function Ticket({ticket:t,actor,eligible,isAr,now,onAction}:{ticket:ResourceTicket;actor:string;eligible:boolean;isAr:boolean;now:number;onAction:(action:ResourceAction)=>void}){
 const [reference,setReference]=useState(''),[delivery,setDelivery]=useState(''),[vendor,setVendor]=useState(''),[amount,setAmount]=useState(''),[reason,setReason]=useState(''),[pdfBusy,setPdfBusy]=useState(false),[error,setError]=useState('');
 const tr=(ar:string,en:string)=>isAr?ar:en;const open=contingencyOpen(t,now);
 return <article className="space-y-3 rounded border border-[#D9CEBA] bg-[#FFFDF7] ps-4 pe-4 py-4">
 <h3 className="font-semibold">{t.agency} · {t.resource}</h3><p><bdi>{t.id}</bdi> · {tr('ملف الفنان','Artist dossier')}: <bdi>{t.artistId}</bdi></p>
 <p>{tr('مطلوب في','Required')}: <time dateTime={t.requiredAt}>{new Date(t.requiredAt).toLocaleString(isAr?'ar-AE':'en-AE')}</time></p>
 <p className="flex items-center gap-2"><Clock aria-hidden="true"/>{tr('مهلة الرد','Response due')}: {new Date(responseDue(t)).toLocaleString(isAr?'ar-AE':'en-AE')}</p>
 <p role="status" className={open?'text-red-800':'text-[#736357]'}>{t.response?.status??(open?tr('انقضت 48 ساعة — لا رد مسجل','48 hours elapsed — no response recorded'):tr('بانتظار رد الجهة','Awaiting agency response'))}</p>
 {Date.parse(t.requiredAt)<responseDue(t)&&!t.response&&<p className="text-amber-900">{tr('المورد مطلوب قبل انتهاء مهلة الرد؛ يلزم تصعيد مبكر.','Required before the response deadline; escalate early.')}</p>}
 {t.response&&<p>{t.response.reference} · {t.response.at}{t.response.deliveryAt&&<> · {tr('موعد التسليم المؤكد','Confirmed delivery')}: {new Date(t.response.deliveryAt).toLocaleString(isAr?'ar-AE':'en-AE')}</>}</p>}
 <button type="button" disabled={pdfBusy} className={button} onClick={async()=>{setPdfBusy(true);setError('');try{const {downloadResourceRequest}=await import('../utils/resourceRequestPdf');await downloadResourceRequest(t,isAr);}catch{setError(tr('تعذر إنشاء الوثيقة. أعد المحاولة.','Unable to generate PDF. Retry.'));}finally{setPdfBusy(false);}}}><FileDown aria-hidden="true" className="inline size-4"/> {tr('تنزيل طلب الإرسال التدريبي PDF','Download Rehearsal Dispatch PDF')}</button>
 {error&&<p role="alert">{error}</p>}
 {!eligible&&<p role="status">{tr('السجل للقراءة فقط؛ الملف غير مؤهل حالياً.','Read-only history: dossier is not currently eligible.')}</p>}
 {actor==='TECHNICAL'&&eligible&&!t.response&&!t.rental?.decision&&<details><summary>{tr('تسجيل رد رسمي مستلم — محاكاة','Record received agency response — rehearsal')}</summary><div className="mt-3 space-y-3">
 <label>{tr('مرجع الرد الرسمي','Agency response reference')}<input className={input} value={reference} maxLength={500} onChange={e=>setReference(e.target.value)}/></label>
 <label>{tr('موعد التسليم المؤكد — إلزامي للتأكيد','Confirmed delivery time — required to confirm')}<input type="datetime-local" className={input} value={delivery} onChange={e=>setDelivery(e.target.value)}/></label>
 <div className="flex flex-wrap gap-2"><button className={`${button} sadu-action-approve`} disabled={!reference.trim()||!delivery||!Number.isFinite(Date.parse(delivery))||Date.parse(delivery)<now} onClick={()=>onAction({type:'response',id:t.id,status:'CONFIRMED',reference,deliveryAt:new Date(delivery).toISOString()})}>{tr('تسجيل التأكيد','Record Confirmed')}</button><button className={`${button} sadu-action-reject`} disabled={!reference.trim()} onClick={()=>onAction({type:'response',id:t.id,status:'DENIED',reference})}>{tr('تسجيل الرفض','Record Denied')}</button></div></div></details>}
 {t.response?.deliveryAt&&Date.parse(t.response.deliveryAt)>Date.parse(t.requiredAt)&&<p className="text-amber-900">{tr('موعد التسليم بعد الموعد المطلوب — يحتاج متابعة.','Confirmed delivery is later than required — follow-up needed.')}</p>}
 {actor==='COORDINATOR'&&eligible&&!t.rental&&<fieldset disabled={!open} className="space-y-3 rounded border-s-4 border-amber-600 ps-4 pe-3 py-3"><legend className="font-semibold"><LifeBuoy aria-hidden="true" className="inline size-5"/> {tr('خطة الاستئجار البديلة','Third-Party Rental Contingency')}</legend>
 {!open&&<p>{tr('مقفلة حتى الرفض أو مرور 48 ساعة دون رد.','Locked until denial or 48 hours without a response.')}</p>}
 <label>{tr('المورد الخاص','Rental vendor')}<input className={input} value={vendor} maxLength={200} onChange={e=>setVendor(e.target.value)}/></label>
 <label>{tr('طلب المصروفات بالدرهم','Petty-cash request (AED)')}<input className={input} type="number" min="0.01" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)}/></label>
 <label>{tr('المبررات','Rationale')}<textarea className={input} value={reason} maxLength={2000} onChange={e=>setReason(e.target.value)}/></label>
 <button className={button} disabled={!open||!vendor.trim()||!reason.trim()||!Number.isFinite(Number(amount))||Number(amount)<=0} onClick={()=>onAction({type:'rental',id:t.id,vendor,amount:Number(amount),reason})}>{tr('إرسال طلب للمالية — محاكاة','Request Finance Approval — rehearsal')}</button></fieldset>}
 {t.rental&&<section className="space-y-3 border-s-4 border-amber-600 ps-4"><h4 className="font-semibold">{tr('طلب التمويل البديل','Rental funding request')}</h4><p>{t.rental.vendor} · AED {t.rental.amount.toLocaleString()} · {t.rental.decision??'PENDING_FINANCE_APPROVAL'}</p><p>{t.rental.reason}</p><p>{t.rental.requestedBy} · {t.rental.at}</p>{t.rental.decision&&<p>{t.rental.reference} · {t.rental.decidedAt}</p>}
 {t.response?.status==='CONFIRMED'&&!t.rental.decision&&<p role="status">{tr('وصل التأكيد؛ تم تعليق الطلب البديل لمنع الحجز المزدوج.','Agency confirmation received; contingency funding paused to prevent double booking.')}</p>}
 {actor==='FINANCE'&&eligible&&!t.rental.decision&&<><label>{tr('مرجع القرار المالي','Finance decision reference')}<input className={input} value={reference} maxLength={500} onChange={e=>setReference(e.target.value)}/></label><div className="flex gap-2">{[true,false].map(approve=><button key={String(approve)} className={`${button} ${approve?'sadu-action-approve':'sadu-action-reject'}`} disabled={!open||!reference.trim()} onClick={()=>onAction({type:'finance',id:t.id,approve,reference})}>{approve?tr('اعتماد الطلب — محاكاة','Approve Request — rehearsal'):tr('رفض الطلب','Reject Request')}</button>)}</div></>}
 </section>}
 </article>;
}
export function InterAgencyResources({rows,dossiers,eligibleIds,scopeKeys,actor,coordinatorId,isAr,onAction}:{rows:ResourceTicket[];dossiers:NominatedArtistDossier[];eligibleIds:string[];scopeKeys:Record<string,string>;actor:string;coordinatorId:string;isAr:boolean;onAction:(action:ResourceAction)=>void}){
 const [artist,setArtist]=useState(''),[agency,setAgency]=useState<Agency>('SAF'),[resource,setResource]=useState<typeof RESOURCES[number]>(RESOURCES[0]),[required,setRequired]=useState('');
 const [now,setNow]=useState(Date.now());useEffect(()=>{const update=()=>setNow(Date.now());const timer=setInterval(update,1000);window.addEventListener('focus',update);return()=>{clearInterval(timer);window.removeEventListener('focus',update);};},[]);
 const tr=(ar:string,en:string)=>isAr?ar:en;
 const visible=rows.filter(t=>actor!=='COORDINATOR'||dossiers.some(d=>d.id===t.artistId&&d.assignedCoordinatorId===coordinatorId));
 return <section className="mx-auto my-6 max-w-5xl space-y-4 rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-5 text-start" dir={isAr?'rtl':'ltr'}><h2 className="flex items-center gap-2 text-2xl font-semibold"><Building2 aria-hidden="true"/>{tr('طلبات الموارد بين الجهات','Inter-Agency Resource Dispatch')}</h2>
 <p className="text-sm">{tr('محاكاة للجلسة فقط؛ لا إرسال خارجي أو تأكيد حجز أو صرف مالي. مهلة الرد 48 ساعة متصلة من تسجيل الطلب.','Session rehearsal only; no external dispatch, booking or payment. Response window: 48 elapsed hours from request recording.')}</p>
 {actor==='TECHNICAL'&&<form className="grid gap-3 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();if(!eligibleIds.includes(artist)||!required||Date.parse(required)<=Date.now())return;onAction({type:'request',ticket:{id:crypto.randomUUID(),artistId:artist,scopeKey:scopeKeys[artist],agency,resource,requiredAt:new Date(required).toISOString(),requestedAt:new Date().toISOString()}});}}>
 <label>{tr('ملف مؤهل باتفاقية مقبولة','Eligible dossier with accepted agreement')}<select required className={input} value={artist} onChange={e=>setArtist(e.target.value)}><option value="">{tr('اختر الفنان','Select artist')}</option>{dossiers.filter(d=>eligibleIds.includes(d.id)).map(d=><option key={d.id} value={d.id}>{d.artistName}</option>)}</select></label>
 <label>{tr('الجهة المطلوبة','Requested agency')}<select className={input} value={agency} onChange={e=>setAgency(e.target.value as Agency)}><option>SAF</option><option>SMA</option></select></label>
 <label>{tr('المورد المطلوب','Resource required')}<select className={input} value={resource} onChange={e=>setResource(e.target.value as typeof resource)}>{RESOURCES.map(r=><option key={r}>{r}</option>)}</select></label>
 <label>{tr('التاريخ والوقت المطلوب — توقيت المتصفح المحلي','Required date/time — browser local time')}<input required type="datetime-local" className={input} value={required} onChange={e=>setRequired(e.target.value)}/></label>
 <button className={button} disabled={!eligibleIds.includes(artist)||!required||!Number.isFinite(Date.parse(required))||Date.parse(required)<=now}>{tr('تسجيل طلب المورد','Record Resource Request')}</button>
 </form>}
 {!visible.length&&<p>{tr('لا توجد طلبات موارد مسجلة.','No resource requests recorded.')}</p>}
 {visible.map(ticket=><Ticket key={ticket.id} ticket={ticket} actor={actor} eligible={eligibleIds.includes(ticket.artistId)&&ticket.scopeKey===scopeKeys[ticket.artistId]} isAr={isAr} now={now} onAction={onAction}/>)}
 </section>;
}
