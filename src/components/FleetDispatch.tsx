import { damageHold } from '../data/conditionReporting';
import { useState } from 'react';
import { Truck } from 'lucide-react';
import type { CommissionState } from '../types';
import type { CommissionAction } from '../data/commissionScenario';
import { validCrate, vehicleTypes } from '../data/installationOperations';
export function FleetDispatch({state,isAr,onRecord}:{state:CommissionState;isAr:boolean;onRecord:(action:CommissionAction)=>void}) {
 const [vehicle,setVehicle]=useState<string>(vehicleTypes[0]);
 const original=state.contracts[0],c=original?{...original,crate:original.crate?{...original.crate,...(state.logistics?.inspection??{})}:undefined}:undefined,crate=c?.crate;
 const eligible=Boolean(!damageHold(state)&&c&&c.productionOrigin!=='LOCAL_FABRICATION'&&['ARTIST_APPROVED','LOCKED'].includes(c.status)&&validCrate(crate)&&!state.logistics?.closedAt&&state.installationStatus!=='EXECUTIVE_IMPOUND');
 const exists=state.fleetTickets?.some(row=>!row.isSuperseded&&row.contractId===c?.id&&row.crate.reference===crate?.reference);
 const t=(ar:string,en:string)=>isAr?ar:en;
 return <section className="space-y-4 rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-5 text-start"><h2 className="flex items-center gap-2 text-xl font-semibold"><Truck aria-hidden="true" className="size-5"/>{t('أوامر النقل الداخلي','Internal Fleet & Transport Dispatch')}</h2>
 <p>{t('طلبات تدريبية مرتبطة باتفاقية وصندوق؛ لا حجز مركبة أو إرسال خارجي.','Rehearsal requests linked to an agreement and crate; no vehicle booking or external dispatch.')}</p>
 <p>{c?`${c.artistName} · ${c.proposedWorkTitle}`:t('لا توجد اتفاقية.','No agreement recorded.')}</p>
 <label className="block">{state.logistics?.inspection?t('قياسات موثقة عند الاستلام','Verified loading-dock measurements'):t('أبعاد الصندوق ووزنه — من المرحلة السادسة','Crate Dimensions & Weight — from Stage 6')}<input readOnly className="mt-2 block w-full border bg-stone-100 ps-3 pe-3 py-2" value={validCrate(crate)?`${crate.reference} · ${crate.lengthCm} × ${crate.widthCm} × ${crate.heightCm} cm · ${crate.grossWeightKg} kg`:t('مواصفات الصندوق غير مسجلة؛ استكمل المرحلة السادسة.','Crate specifications not recorded; complete Stage 6.')}/></label>
 <label className="block">{t('نوع المركبة المطلوبة','Vehicle Type Required')}<select disabled={!eligible||exists} value={vehicle} onChange={e=>setVehicle(e.target.value)} className="mt-2 block w-full border ps-3 pe-3 py-2">{vehicleTypes.map(value=><option key={value}>{value}</option>)}</select></label>
 <button type="button" disabled={!eligible||exists} className="rounded bg-[#8B261E] ps-4 pe-4 py-2 text-white disabled:opacity-50" onClick={()=>{if(c&&eligible)onRecord({type:'request-fleet',actor:'LOGISTICS',id:crypto.randomUUID(),contractId:c.id,vehicle,at:new Date().toISOString()});}}>{t('تسجيل طلب النقل','Record fleet request')}</button>
 {!eligible&&<p>{t('يلزم اتفاق مقبول ومواصفات صندوق صالحة دون إيقاف تنفيذي أو إغلاق للمعرض.','Requires an accepted agreement, valid crate specifications, and no executive impound or exhibition closure.')}</p>}
 {damageHold(state)&&<p role="status" className="text-red-900">Damage hold: fleet movement blocked.</p>}
 <ul className="space-y-3">{state.fleetTickets?.map(row=><li key={row.id} className="space-y-2 rounded border bg-white ps-4 pe-4 py-4"><h3 className="font-semibold">{row.crate.reference} · {row.vehicle}</h3><p>{row.crate.lengthCm} × {row.crate.widthCm} × {row.crate.heightCm} cm · {row.crate.grossWeightKg} kg</p><p role="status">{row.status} · Revision {row.appliesToRevision ?? 0}{row.isSuperseded ? " · Superseded — historical record" : ""}</p><p>{row.requestedAt}</p>{row.transitAt&&<p>{row.transitAt}</p>}{!row.isSuperseded&&row.status==='PENDING_FLEET_ASSIGNMENT'&&<button type="button" disabled={!eligible} className="rounded border ps-3 pe-3 py-2 disabled:opacity-50" onClick={()=>onRecord({type:'fleet-transit',actor:'LOGISTICS',ticketId:row.id,at:new Date().toISOString()})}>{t('تسجيل بدء النقل — محاكاة','Record departure — simulated')}</button>}</li>)}</ul>
 </section>;
}
