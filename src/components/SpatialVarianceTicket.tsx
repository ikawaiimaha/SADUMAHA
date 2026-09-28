import {AlertTriangle,CheckCircle,Clock} from 'lucide-react';
import {useSessionDraft} from '../context/SessionDrafts';
import {initialSpatialTicket,transitionSpatialTicket,type SpatialModification} from '../data/spatialTicket';
export function SpatialVarianceTicket({isAr}:{isAr:boolean}) {
 const [ticket,setTicket]=useSessionDraft('spatial-ticket:mounir-fatmi:demo',initialSpatialTicket);
 const t=(ar:string,en:string)=>isAr?ar:en;
 const pending=ticket.status==='PENDING_CURATOR_REVIEW',rejected=ticket.status==='REJECTED_ASSET_RISK';
 const Icon=pending?Clock:rejected?AlertTriangle:CheckCircle;
 return <section className="rounded border border-[#D9CEBA] border-s-4 border-s-[#8B261E] bg-[#F7F1E6] ps-5 pe-5 py-5 text-start text-[#1A1817] space-y-4">
 <h2 className="text-xl font-semibold">{t('تعديلات الموقع والطلبات المكانية','Venue Modification & Spatial Requests')}</h2>
 <p className="text-sm">{t('تذكرة تدريبية خيالية؛ محاكاة قرار القيّم داخل المكتب الفني، وليست تفويضاً أو إرسالاً خارجياً.','Fictional rehearsal ticket; simulates curator decisions within the Technical desk, with no actual authorization or external dispatch.')}</p>
 <h3 className="text-lg font-semibold">{t('الفنان: منير فاطمي','Artist: Mounir Fatmi')}</h3>
 <label className="block">{t('نوع التعديل','Modification Type')}<select className="mt-2 block w-full rounded border bg-white ps-3 pe-3 py-2 disabled:opacity-60" value={ticket.modificationType} disabled={!pending} onChange={e=>setTicket(current=>transitionSpatialTicket(current,{type:'modify',value:e.target.value as SpatialModification}))}>
 <option value="FLOOR_TREATMENT">{t('معالجة الأرضية','Floor Treatment')}</option><option value="LIGHTING_RIG">{t('تجهيزات الإضاءة','Lighting Rig')}</option><option value="WALL_PAINT">{t('طلاء الجدران','Wall Paint')}</option></select></label>
 <p>{t('المادة المطلوبة','Requested material')}: <strong>{ticket.material==='Vinyl'?t('فينيل (Vinyl)','Vinyl'):t('سجاد (Carpet)','Carpet')}</strong></p>
 <div role="status" className={`rounded ps-4 pe-4 py-3 ${rejected?'bg-red-50 text-red-800':pending?'bg-amber-50 text-amber-900':'bg-emerald-50 text-emerald-900'}`}><p className="flex flex-wrap items-center gap-2"><Icon aria-hidden="true" className="size-5"/><bdi className="break-all">{ticket.status}</bdi></p><p className="mt-2">{pending?t('بانتظار مراجعة القيّم.','Awaiting curator review.'):rejected?t('رُفض الفينيل بسبب مخاطر على أصول الموقع في هذا السيناريو. البديل المقترح: السجاد.','Vinyl rejected as a venue asset risk in this scenario. Proposed alternative: Carpet.'):t('اعتُمد السجاد بديلاً في المحاكاة.','Carpet approved as the alternative in this rehearsal.')}</p></div>
 {pending&&<button type="button" className="rounded border border-red-700 ps-4 pe-4 py-2 text-red-800" onClick={()=>setTicket(current=>transitionSpatialTicket(current,{type:'reject',at:new Date().toISOString()}))}>{t('محاكاة رفض القيّم — مخاطر على الموقع','Simulate curator rejection — venue risk')}</button>}
 {rejected&&<button type="button" className="rounded bg-[#8B261E] ps-4 pe-4 py-2 text-white" onClick={()=>setTicket(current=>transitionSpatialTicket(current,{type:'approve-alternative',at:new Date().toISOString()}))}>{t('محاكاة اعتماد السجاد بديلاً','Simulate approval of Carpet alternative')}</button>}
 {ticket.workOrder&&<p className="rounded border border-emerald-200 bg-emerald-50 ps-3 pe-3 py-3 text-emerald-900"><CheckCircle aria-hidden="true" className="inline size-5 me-2"/>{t('أُرسل أمر العمل إلى العمليات — محاكاة','Work Order Dispatched to Operations — simulated')} · <bdi>{ticket.workOrder.reference}</bdi></p>}
 {ticket.history.length>0&&<details><summary className="cursor-pointer">{t('سجل قرارات الجلسة','Session decision history')}</summary><ul className="mt-2 space-y-2">{ticket.history.map(row=><li key={row.status}><bdi>{row.status}</bdi> · {row.material} · <bdi>{new Date(row.at).toLocaleString(isAr?'ar-AE':'en-AE')}</bdi></li>)}</ul></details>}
 </section>;
}
