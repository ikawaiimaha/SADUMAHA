import { useEffect, useRef, useState } from 'react';

type Copy = { ar:string; en:string };
type Step = { key:string; label:Copy; reason:Copy; owner:{ label:Copy; name:string|null; id:string|null } };
export type AmendmentImpact = {
  required:boolean; version:number; token:string|null; taskAssignmentRequired?:boolean;
  changes:{label:Copy;before:unknown;after:unknown}[];
  renewals:Step[]; retained:Copy[]; next:Step|null;
};
const words = (copy:Copy) => `${copy.ar} / ${copy.en}`;
const value = (v:unknown):string => v == null ? 'غير مسجل / Not recorded'
  : typeof v === 'boolean' ? v ? 'نعم / Yes' : 'لا / No'
  : typeof v === 'object' ? Array.isArray(v) ? v.map(value).join(' · ') || 'لا يوجد / None'
  : 'start' in v && 'end' in v ? `${v.start} — ${v.end}` : JSON.stringify(v) : String(v);
const control = 'min-h-12 rounded border border-[#8B4513] px-4 py-2 disabled:opacity-40';

function ImpactDialog({impact,stale,onResolve,returnFocus,language}:{impact:AmendmentImpact;stale:boolean;onResolve:(accepted:boolean)=>void;returnFocus:HTMLElement|null;language?:'ar'|'en'}) {
  const text=(ar:string,en:string)=>language==='ar'?ar:language==='en'?en:`${ar} / ${en}`;
  const words=(copy:Copy)=>text(copy.ar,copy.en);
  const display=(v:unknown)=>v==null?text('غير مسجل','Not recorded'):typeof v==='boolean'?v?text('نعم','Yes'):text('لا','No'):value(v);
  const owner=(step:Step)=>`${words(step.owner.label)}${step.owner.id?.startsWith('pilot-')?'':` · ${step.owner.name??text('لم يُسمَّ موظف','No named owner')}`}`;
  const ref=useRef<HTMLDialogElement>(null);
  const cancel=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    const modal=ref.current;
    modal?.showModal();cancel.current?.focus({preventScroll:true});
    return()=>{modal?.close();window.requestAnimationFrame(()=>{if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});};
  },[]);
  return <dialog ref={ref} dir={language==='ar'?'rtl':language==='en'?'ltr':undefined} aria-labelledby="amendment-impact-title" onCancel={e=>{e.preventDefault();onResolve(false);}}
    className="m-auto max-h-[90vh] w-[min(94vw,760px)] overflow-y-auto rounded-xl border border-[#D9CEBA] bg-[#F7F1E6] p-5 text-[#1A1817] backdrop:bg-black/40">
    <div className="space-y-5 text-start">
      <header><h2 id="amendment-impact-title" className="text-xl font-semibold">{text('قبل حفظ التعديل','Before saving this change')}</h2>
        <p>{text('لم يتغير السجل بعد. راجع ما يحتاج إلى تأكيد جديد.','Nothing has changed yet. Review what needs fresh confirmation.')}</p></header>
      {stale&&<p role="alert" className="font-semibold text-[#8B261E]">{text('تغيّر السجل أثناء المراجعة. عد إلى المسودة وحدّث المعاينة.','The record changed during review. Return to your draft and refresh this preview.')}</p>}
      <section aria-label={text('التعديلات المقترحة','Proposed changes')}><h3 className="font-semibold">{text('التعديل المقترح','Proposed change')}</h3>
        <ul className="space-y-3">{impact.changes.map((c,i)=><li key={i} className="break-words"><p className="font-medium">{words(c.label)}</p><p>{text('الحالي: ','Current: ')}<bdi>{display(c.before)}</bdi></p><p>{text('الجديد: ','New: ')}<bdi>{display(c.after)}</bdi></p></li>)}</ul>
        {!impact.changes.length&&<p>{text('إنشاء إصدار جديد بالقيم نفسها؛ ستُطلب مراجعات جديدة.','A new revision with the same values still requires fresh reviews.')}</p>}
      </section>
      <section aria-label={text('مراجعات تحتاج إلى تجديد','Checks needing renewal')}><h3 className="font-semibold">{text('ما يحتاج إلى تجديد','Checks needing renewal')} ({impact.renewals.length})</h3>
        {impact.taskAssignmentRequired&&<p className="text-sm">{text('بعد الحفظ، تعيّن المنسقة المسؤولين والمواعيد للمهام الجديدة؛ يلزم قبول جديد.','After saving, the coordinator assigns owners and deadlines; previous acceptance does not carry forward.')}</p>}
        {impact.renewals.length?<ul className="space-y-3">{impact.renewals.map(step=><li key={step.key}><p className="font-medium">{words(step.label)}</p><p>{owner(step)}</p><p className="text-sm">{words(step.reason)}</p></li>)}</ul>:<p>{text('لا توجد اعتمادات مكتملة تحتاج إلى تجديد.','No completed approvals need renewal.')}</p>}
      </section>
      {impact.next&&<section className="rounded border border-[#D9CEBA] bg-white p-4" aria-label={text('الخطوة التالية بعد التعديل','Next action after change')}><h3 className="font-semibold">{text('الخطوة التالية','Next action')}</h3><p>{words(impact.next.label)}</p><p>{owner(impact.next)}</p><p className="text-sm">{words(impact.next.reason)}</p></section>}
      <details><summary className="min-h-12 cursor-pointer">{text('ما يبقى محفوظاً','What remains in place')}</summary><ul className="list-disc space-y-2 ps-5">{impact.retained.map((text,i)=><li key={i}>{words(text)}</li>)}</ul></details>
      <p className="text-sm">{text('تبقى القرارات السابقة في السجل؛ لا يُرسل أي طلب خارجي.','Earlier decisions stay in history; no external request is sent.')}</p>
      <footer className="flex flex-wrap gap-3"><button ref={cancel} type="button" className={control} onClick={()=>onResolve(false)}>{text('العودة إلى المسودة','Back to draft')}</button><button type="button" className={control} style={{backgroundColor:'#1D2A39',color:'#FFFFFF'}} disabled={stale} onClick={()=>onResolve(true)}>{text('حفظ التعديل بعد المراجعة','Confirm change and save')}</button></footer>
    </div>
  </dialog>;
}

/** One reusable review step. The server validates the proposed command without committing it. */
export function useAmendmentReview(currentVersion:number,language?:'ar'|'en') {
  const [impact,setImpact]=useState<AmendmentImpact|null>(null),[pending,setPending]=useState(false);
  const resolver=useRef<((result:{impactToken?:string}|null)=>void)|null>(null);
  const controller=useRef<AbortController|null>(null);
  const trigger=useRef<HTMLElement|null>(null);
  const inFlight=useRef(false);
  const finish=(accepted:boolean)=>{const resolve=resolver.current;resolver.current=null;inFlight.current=false;setImpact(null);setPending(false);resolve?.(accepted&&impact?.token?{impactToken:impact.token}:null);};
  useEffect(()=>()=>{controller.current?.abort();resolver.current?.(null);resolver.current=null;},[]);
  const review=async(path:string,command:Record<string,unknown>)=>{
    if(inFlight.current)return null;
    inFlight.current=true;
    trigger.current=document.activeElement as HTMLElement|null;
    setPending(true);controller.current=new AbortController();
    try {
      const response=await fetch(`${path}/impact`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(command),signal:controller.current.signal,cache:'no-store'});
      const result=await response.json();if(!response.ok)throw Object.assign(Error(result.error??'Could not review this change. Your draft has not been saved.'),{status:response.status});
      if(!result.required){inFlight.current=false;setPending(false);return {};}
      setImpact(result as AmendmentImpact);
      return await new Promise<{impactToken?:string}|null>(resolve=>{resolver.current=resolve;});
    }catch(error){inFlight.current=false;setPending(false);throw error;}
  };
  return {review,pending,dialog:impact?<ImpactDialog language={language} impact={impact} stale={currentVersion!==impact.version} onResolve={finish} returnFocus={trigger.current}/>:null};
}
