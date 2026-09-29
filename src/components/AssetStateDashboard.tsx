import {CheckCircle,Clock} from 'lucide-react';
import {useSessionDraft} from '../context/SessionDrafts';
import {currentPublication,type ArtworkRoster} from '../data/artworkRoster';

export function AssetStateDashboard({artists}:{artists:{id:string;artistName:string}[]}){
 const [rosters]=useSessionDraft<Record<string,ArtworkRoster>>('artwork-rosters:v1',{});
 const ids=[...new Set([...artists.map(a=>a.id),...Object.keys(rosters)])];
 return <section className="space-y-3 rounded border bg-[#F7F1E6] ps-4 pe-4 py-4 text-start">
  <h2 className="text-xl">Asset State Dashboard / حالة أصول النشر</h2>
  <p>Session rehearsal · readiness follows the current Editorial-approved revision. Uploading alone does not authorize printing. / الجاهزية مرتبطة باعتماد التحرير للنسخة الحالية.</p>
  <div className="grid gap-3 md:grid-cols-2" aria-live="polite">{ids.map(id=>{const roster=rosters[id],publication=roster&&currentPublication(roster),receipt=roster?.publications?.find(p=>p.revision===publication?.revision);return <article key={id} className="rounded border bg-[#FFFDF7] ps-3 pe-3 py-3">
   <h3>{artists.find(a=>a.id===id)?.artistName??id}</h3>
   <p className={publication?'text-green-800':'text-amber-900'}>{publication?<CheckCircle className="inline size-4" aria-hidden="true"/>:<Clock className="inline size-4" aria-hidden="true"/>} {publication?'LABELS_READY_FOR_PRINT / الملصقات جاهزة للطباعة':roster?.status==='AMENDMENT_REQUESTED'?'Amendment requested — print readiness withdrawn / طلب تعديل':roster?.status==='LOCKED_PENDING_REVIEW'?'Awaiting Editorial approval / بانتظار التحرير':'Awaiting complete label submission / بانتظار بيانات الملصقات'}</p>
   {receipt&&<p>Revision {receipt.revision} · Editorial receipt: <time dateTime={receipt.at}>{new Date(receipt.at).toLocaleString()}</time></p>}
  </article>})}</div>{!ids.length&&<p>No artist label records yet / لا توجد سجلات بعد</p>}
 </section>;
}
