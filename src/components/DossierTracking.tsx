import type { NominatedArtistDossier } from './ArtistNominationForm';
import { COORDINATORS, PARTICIPATION_TRACKS } from '../data/participation2026';
import { readyForDispatch, scopeOf, type DossierScope } from '../data/dossierLedger';
import { useSessionDraft } from '../context/SessionDrafts';

interface Props {
  dossiers: NominatedArtistDossier[]; isAr: boolean; actor: string; publicationReady: boolean;
  onRequest: (id:string,scope:DossierScope,reason:string) => void;
  onReview: (id:string, amendmentId:string, approve:boolean) => void;
  onDispatch: (id:string) => void;
  lockedIds: string[];
}
function DossierRow({d, ...props}: Omit<Props,'dossiers'> & {d:NominatedArtistDossier}) {
  const {isAr,actor,lockedIds,onRequest,onReview,onDispatch,publicationReady}=props;
  const [draft,setDraft]=useSessionDraft(`scope-amendment:${d.id}:${d.approvalRevision ?? 1}`,{...scopeOf(d),reason:''});
  const pending=d.amendments?.find(a=>a.status==='PENDING');
  const label=(ar:string,en:string)=>isAr?ar:en;
  const coordinator=COORDINATORS.find(c=>c.id===d.assignedCoordinatorId);
  const scopeText=(scope:DossierScope)=>`${scope.nationality} · ${scope.medium || '—'} · ${scope.proposedWorkTitle || '—'} · ${scope.artworkCount ?? '—'}`;
  return <article className="rounded border border-[#D9CEBA] bg-white ps-4 pe-4 py-4 space-y-3">
    <h3 className="text-lg font-semibold" dir="auto">{d.artistName}</h3>
    <p>{coordinator?.name ?? label('لم تعيّن منسقة','Coordinator not assigned')} · {PARTICIPATION_TRACKS[d.participationTrack ?? 'GENERAL_COMPETITION'][isAr?'ar':'en']}</p>
    <dl className="grid gap-2 sm:grid-cols-2">{[[label('الجنسية','Nationality'),d.nationality],[label('نوع الأعمال','Artwork medium'),d.medium],[label('النطاق / عنوان العمل','Scope / work title'),d.proposedWorkTitle],[label('عدد الأعمال','Artwork count'),d.artworkCount?.toString()]].map(([key,value])=><div key={key}><dt className="text-sm text-[#736357]">{key}</dt><dd dir="auto">{value || label('غير مسجّل / لا ينطبق','Not recorded / not applicable')}</dd></div>)}</dl>
    <p>{label('حالة التدقيق','Vetting status')}: <bdi>{d.status}</bdi> · {label('مراجعة الاعتماد','Approval revision')}: {d.status==='APPROVED' ? d.approvalRevision ?? 1 : '—'}</p>
    <p>{pending ? label('تعديل قيد المراجعة؛ النطاق المعتمد لم يتغير','Amendment pending; approved scope unchanged') : d.dispatchHistory?.some(r=>r.revision===(d.approvalRevision ?? 1)) ? label('تم تسجيل الإرسال لهذه المراجعة','Dispatch recorded for this revision') : readyForDispatch(d) ? label('بانتظار تسجيل إرسال المنسق','Awaiting assigned Coordinator dispatch record') : label('غير مؤهل للإرسال','Not eligible for dispatch')}</p>
    {actor==='COORDINATOR' && <button type="button" disabled={!publicationReady || !readyForDispatch(d)} className="rounded bg-[#8B261E] ps-4 pe-4 py-2 text-white disabled:opacity-50" onClick={()=>onDispatch(d.id)}>{label('تسجيل إرسال تجريبي','Record simulated dispatch')}</button>}
    {actor==='COORDINATOR' && d.status==='APPROVED' && !pending && <details><summary className="cursor-pointer">{label('طلب تعديل النطاق المعتمد','Request approved-scope amendment')}</summary>
      <form className="mt-3 space-y-3" onSubmit={e=>{e.preventDefault();onRequest(d.id,scopeOf({...d,...draft}),draft.reason);}}>
        {(['nationality','medium','proposedWorkTitle','reason'] as const).map((field,i)=><label className="block" key={field}>{(isAr?['الجنسية المقترحة','نوع الأعمال المقترح','النطاق المقترح','مبرر التعديل']:['Proposed nationality','Proposed medium','Proposed scope','Amendment reason'])[i]}<input required={field==='nationality'||field==='reason'||d.participationTrack!=='HONORED_GUEST'} className="block w-full rounded border ps-3 pe-3 py-2" value={draft[field]} onChange={e=>setDraft(previous=>({...previous,[field]:e.target.value}))}/></label>)}
        {d.participationTrack!=='HONORED_GUEST' && <label className="block">{label('عدد الأعمال المقترح','Proposed artwork count')}<input required type="number" min={d.participationTrack==='SOLO_EXHIBITION'?15:1} max={d.participationTrack==='SOLO_EXHIBITION'?20:undefined} step={1} className="block rounded border ps-3 pe-3 py-2" value={draft.artworkCount ?? ''} onChange={e=>setDraft(previous=>({...previous,artworkCount:Number(e.target.value)}))}/></label>}
        <button className="rounded border ps-4 pe-4 py-2" type="submit">{label('إحالة التعديل للمدير','Submit amendment to Director')}</button>
      </form>
    </details>}
    {pending && <section className="rounded bg-amber-50 ps-3 pe-3 py-3"><p>{pending.reason}</p><p>{label('المعتمد','Approved')}: {scopeText(pending.before)}</p><p>{label('المقترح','Proposed')}: {scopeText(pending.proposed)}</p>
      {actor==='BIENNIAL_DIRECTOR' && <div className="mt-2 flex gap-2"><button disabled={lockedIds.includes(d.id)} className="rounded border ps-3 pe-3 py-2 disabled:opacity-50" onClick={()=>onReview(d.id,pending.id,true)}>{label('اعتماد التعديل بعد التدقيق','Approve amendment after compliance check')}</button><button className="rounded border ps-3 pe-3 py-2" onClick={()=>onReview(d.id,pending.id,false)}>{label('رفض التعديل','Reject amendment')}</button></div>}
      {lockedIds.includes(d.id) && <p>{label('توجد اتفاقية نشطة؛ لا يمكن تغيير نطاقها عبر هذا السجل. يلزم مسار تعديل الاتفاقية.','An active agreement exists; this ledger cannot change its scope. The agreement amendment workflow is required.')}</p>}
    </section>}
    <details><summary className="cursor-pointer">{label('سجل المراجعات والإرسال','Revision and dispatch history')}</summary><ul>{d.amendments?.map(a=><li key={a.id}>{a.status} · {a.reason} · {a.requestedAt}<p>{scopeText(a.before)} → {scopeText(a.proposed)}</p></li>)}{d.dispatchHistory?.map(r=><li key={`${r.revision}:${r.at}`}>{label('إرسال المراجعة','Dispatched revision')} {r.revision} · {r.at}<p>{scopeText(r.scope)}</p></li>)}</ul></details>
  </article>;
}
export function DossierTracking(props: Props) {
  return <section className="my-5 space-y-4 rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-4 pe-4 py-4 text-start"><h2 className="text-xl font-semibold">{props.isAr?'سجل الملفات المشترك وتتبع الإرسال':'Shared dossier and dispatch tracking'}</h2><p>{props.isAr?'بيانات الملفات المسجلة في الجلسة؛ لا يرسل هذا السجل رسائل خارجية.':'Recorded session dossiers; this register sends no external messages.'}</p>{props.actor==='COORDINATOR'&&!props.publicationReady&&<p>{props.isAr?'تسجيل الإرسال يتطلب نشر الثيمة والدليل باللغتين.':'Dispatch recording requires the published theme and bilingual guidelines.'}</p>}{!props.dossiers.length&&<p>{props.isAr?'لا توجد ملفات مسجلة لهذه القائمة. قائمة ضيوف المصدر منفصلة ولا تعني اعتماد ملفاتهم.':'No dossiers recorded for this queue. The source guest roster is separate and does not establish dossier approval.'}</p>}{props.dossiers.map(d=><DossierRow key={d.id} {...props} d={d}/>)}</section>;
}
