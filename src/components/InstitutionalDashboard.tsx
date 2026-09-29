import {useState} from 'react';
import {BarChart3,Users,Download} from 'lucide-react';
import {institutionalMetrics,inventoryCSV} from '../data/institutionalMetrics';
import {COORDINATORS} from '../data/participation2026';
import type {NominatedArtistDossier} from './ArtistNominationForm';
export function InstitutionalDashboard({dossiers,evidence,isAr,canReassign,lockedIds,onReassign}:{dossiers:NominatedArtistDossier[];evidence:{id:string;status:string;prCleared?:boolean}[];isAr:boolean;canReassign:boolean;lockedIds:string[];onReassign:(id:string,target:string,reason:string)=>void}){
 const [artist,setArtist]=useState(''),[target,setTarget]=useState(''),[reason,setReason]=useState('');
 const [showInactive,setShowInactive]=useState(false);
 const stats=institutionalMetrics(dossiers,evidence),tr=(ar:string,en:string)=>isAr?ar:en;
 const selected=dossiers.find(d=>d.id===artist);const allowed=selected?.status==='APPROVED'&&!lockedIds.includes(artist)&&!selected.amendments?.some(a=>a.status==='PENDING');
 function exportInventory(){const url=URL.createObjectURL(new Blob([inventoryCSV(dossiers,new Date().toISOString())],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='SADU-session-inventory.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
 const max=Math.max(1,...stats.workloads.map(c=>c.dossiers));
 return <section className="mx-auto my-6 max-w-5xl space-y-5 rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-5 text-start" dir={isAr?'rtl':'ltr'}>
 <h2 className="flex items-center gap-2 text-2xl font-semibold"><BarChart3 aria-hidden="true"/>{tr('الإحصاءات المؤسسية الحية','Live Institutional Dashboard')}</h2>
 <p>{tr('محسوبة من سجلات الجلسة الحالية، وليست أعداد الحضور أو حجوزات الفنادق المعتمدة.','Calculated from current session records; these are not attendance totals or approved hotel bookings.')}</p>
 <button disabled={!dossiers.length} onClick={exportInventory} className="flex items-center gap-2 rounded border ps-4 pe-4 py-2 disabled:opacity-50"><Download aria-hidden="true"/>{tr('تنزيل تقرير جرد الجلسة','Download session inventory report')}</button>
 <dl className="grid gap-3 sm:grid-cols-3">{[[tr('عقود منفذة مسجلة','Recorded executed artists'),stats.executedArtists],[tr('ضيوف تحقق منهم التشريفات','PR-cleared primary guests'),stats.clearedGuests],[tr('ملفات معتمدة نشطة','Active approved dossiers'),stats.approvedDossiers]].map(([label,value])=><div key={label} className="rounded border bg-[#FFFDF7] ps-4 pe-4 py-3"><dt>{label}</dt><dd className="text-3xl font-semibold">{value}</dd></div>)}</dl>
 <p className="text-sm text-[#736357]">{tr('قبول الاتفاقية لا يعني تنفيذها. المرافقون لا يحسبون تلقائياً ضمن الضيوف المعتمدين.','Agreement acceptance is not execution. Companions are not automatically counted as cleared guests.')}</p>
 <h3 className="flex items-center gap-2 text-xl"><Users aria-hidden="true"/>{tr('عبء عمل المنسقين','Coordinator workload')}</h3>
 <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showInactive} onChange={e=>setShowInactive(e.target.checked)}/>{tr('عرض المنسقين دون ملفات نشطة','Show coordinators with no active dossiers')}</label>
 {!stats.approvedDossiers&&<p>{tr('لا ملفات معتمدة نشطة حالياً.','No active approved dossiers currently.')}</p>}
 <ul className="grid gap-3 sm:grid-cols-2">{stats.workloads.filter(c=>showInactive||c.dossiers>0).map(c=><li key={c.id} className="space-y-2 rounded border bg-[#FFFDF7] ps-4 pe-4 py-3"><h4>{c.name}</h4><p>{c.dossiers} {tr('ملفات','dossiers')} · {c.artworks} {tr('أعمال مسجلة','recorded artworks')}{c.unknownCounts>0&&<> · {c.unknownCounts} {tr('ملفات دون عدد أعمال','dossiers with artwork count unreported')}</>}</p><meter min={0} max={max} value={c.dossiers} className="w-full" aria-label={`${c.name}: ${c.dossiers} dossiers`}/></li>)}</ul>
 {canReassign&&<form className="space-y-3 border-t pt-4" onSubmit={e=>{e.preventDefault();if(allowed&&target&&reason.trim()){onReassign(artist,target,reason);setReason('');}}}>
 <h3 className="font-semibold">{tr('إعادة توزيع ملف معتمد','Reassign approved dossier')}</h3>
 <p>{tr('الملفات ذات الاتفاقيات المرسلة مقفلة؛ يلزم نقل تشغيلي منسق للحفاظ على الصلاحيات والتصاريح.','Dispatched agreements are locked: coordinated operational transfer is required to preserve access and venue clearances.')}</p>
 <label className="block">{tr('الملف','Dossier')}<select required className="block w-full rounded border ps-3 pe-3 py-2" value={artist} onChange={e=>setArtist(e.target.value)}><option value="">{tr('اختر','Select')}</option>{dossiers.filter(d=>d.status==='APPROVED').map(d=><option key={d.id} value={d.id}>{d.artistName}{lockedIds.includes(d.id)?' — LOCKED':''}</option>)}</select></label>
 <label className="block">{tr('المنسق الجديد','New coordinator')}<select required className="block w-full rounded border ps-3 pe-3 py-2" value={target} onChange={e=>setTarget(e.target.value)}><option value="">{tr('اختر','Select')}</option>{COORDINATORS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 <label className="block">{tr('سبب إعادة التوزيع','Reassignment reason')}<textarea required maxLength={1000} className="block w-full rounded border ps-3 pe-3 py-2" value={reason} onChange={e=>setReason(e.target.value)}/></label>
 <button className="rounded border ps-4 pe-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!allowed||!target||target===selected?.assignedCoordinatorId||!reason.trim()}>{tr('تسجيل إعادة التوزيع','Record Reassignment')}</button>
 {selected?.delegationHistory?.slice(-1).map(h=><p key={h.at} role="status">{h.from} → {h.to} · {h.at} · {h.reason??h.region}</p>)}
 </form>}
 </section>;
}
