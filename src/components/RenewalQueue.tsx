import { useState, type FormEvent } from 'react';

type Account={id:string;name:string;role:string};
type Event={type:string;actorId:string;at:string;reason?:string;reference?:string};
export type RenewalTask={id:string;key:string;title:string;status:string;ownerId:string|null;dueAt:string|null;blocker:string;overdue:boolean;canAct:boolean;roles:string[];eligibleOwners:string[];evidenceIds:string[];href:string;events:Event[]};
export type RenewalCycle={id:string;kind:string;revision:string|number;createdAt:string;supersededAt?:string;completed:number;total:number;tasks:RenewalTask[]};
type Props={cycles:RenewalCycle[];accounts:Account[];actorId:string;role:string;disabled:boolean;dirty:boolean;mark:()=>void;run:(action:string,data:Record<string,unknown>)=>Promise<boolean>;openEvidence:(id:string)=>void};
const button='min-h-12 rounded border border-[#8B4513] px-4 py-2 disabled:opacity-40';
const field='mt-1 block w-full min-h-12 rounded border border-[#D9CEBA] bg-white p-3 text-start';
const closed=(t:RenewalTask)=>['COMPLETE','NOT_REQUIRED'].includes(t.status);
const roleNames:Record<string,string>={Logistics:'الشؤون اللوجستية',Technical:'الفريق الفني',Finance:'المالية',Editorial:'قسم التحرير',Chairman:'رئيس الدائرة',General_Exhibition_Coordinator:'المنسقة',Exhibition_Coordinator:'منسقة المعرض'};
const labels:Record<string,string>={UNASSIGNED:'لم يُعيّن مسؤول / Unassigned',ASSIGNED:'بانتظار القبول / Awaiting acceptance',ACCEPTED:'المسؤول قبل المهمة / Accepted',RETURNED:'أعيدت للمنسقة / Returned to coordinator',COMPLETE:'مكتمل / Completed',NOT_REQUIRED:'غير مطلوب بسبب موثق / Not required — reason recorded'};
const when=(value:string)=>new Date(value).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});

export default function RenewalQueue({cycles,accounts,actorId,role,disabled,dirty,mark,run,openEvidence}:Props) {
  const [filter,setFilter]=useState('outstanding');
  if(!cycles.length)return null;
  const coordinator=role==='General_Exhibition_Coordinator',active=cycles.filter(c=>!c.supersededAt),past=cycles.filter(c=>c.supersededAt);
  const name=(id:string|null)=>{const account=accounts.find(a=>a.id===id);return account?`${roleNames[account.role]??account.role} · ${account.name}`:'لم يُعيّن / Unassigned';};
  const submit=(action:string,id:string)=>async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const form=e.currentTarget,data=new FormData(form);const due=data.get('dueAt');if(await run(action,{taskId:id,reason:data.get('reason'),...(due?{dueAt:new Date(String(due)).toISOString(),ownerId:data.get('ownerId')}:{})}))form.reset();};
  const shown=(t:RenewalTask)=>filter==='all'||filter==='mine'&&t.ownerId===actorId&&!closed(t)||filter==='overdue'&&t.overdue||filter==='unassigned'&&!t.ownerId&&!closed(t)||filter==='outstanding'&&!closed(t);
  return <section id="renewal-queue" aria-label="مهام تجديد الاعتماد / Renewal tasks" className="space-y-4 border-t border-[#D9CEBA] pt-5" dir="rtl">
    <header><h3 className="text-xl font-semibold">من يتولى تجديد الاعتماد؟</h3><p lang="en" className="text-sm">Who renews each check?</p><p className="mt-2">كل مهمة تخص الإصدار الحالي. يكتمل السجل عند تنفيذ المراجعة الفعلية.</p><p lang="en" className="text-sm">Tasks belong to this revision and close through the actual review.</p></header>
    <label className="block max-w-sm">عرض المهام / Show tasks<select className={field} value={filter} onChange={e=>setFilter(e.target.value)}><option value="outstanding">المتبقي / Outstanding</option><option value="mine">المسند إليّ / Mine</option><option value="unassigned">دون مسؤول / Unassigned</option><option value="overdue">المتأخر / Overdue</option><option value="all">الجميع والسجل المكتمل / All, including completed</option></select></label>
    {active.map(c=><div key={c.id} className="space-y-3">
      <h4 className="font-semibold">{c.kind==='print'?`الطباعة / Print v${c.revision}`:'الاستلام / Collection'} · {c.completed} / {c.total} مكتمل / complete</h4>
      <p className="text-sm">بدء التجديد / Renewal opened: {when(c.createdAt)} · {c.kind==='collection'?`مرجع / Ref: ${String(c.revision).slice(0,8)}`:''}</p>
      {c.completed===c.total&&<p role="status">✓ اكتملت مراجعات هذا التعديل؛ جاهزية الخروج أو بدء الطباعة تخضع لباقي الشروط. / Amendment checks complete; departure and production retain their other gates.</p>}
      {!c.tasks.some(shown)&&<p>لا توجد مهام مطابقة لهذا العرض. / No tasks match this view.</p>}
      {c.tasks.filter(shown).map(t=><article key={t.id} className="rounded-lg border border-[#D9CEBA] p-4 space-y-3" aria-label={t.title}>
        <h5 className="text-lg font-semibold">{t.title.split(' / ')[0]}</h5><p className="text-sm" lang="en">{t.title.split(' / ')[1]}</p>
        <p>{labels[t.status]}{t.overdue?' · ⚠ تجاوز الموعد / Overdue':''}{t.ownerId?' · '+name(t.ownerId):''}</p>
        {t.dueAt&&<p className="text-sm">الموعد بتوقيت جهازك / Due in your device timezone: {when(t.dueAt)}</p>}
        {t.blocker&&<p>{t.blocker}</p>}
        {t.events.at(-1)?.type==='RETURNED'&&<p className="border-s-2 border-[#8B4513] ps-3">سبب الإعادة / Return reason: {t.events.at(-1)?.reason}</p>}
        <div className="flex flex-wrap gap-3">{t.evidenceIds.map((id,i)=><button type="button" key={id} className={button} onClick={()=>openEvidence(id)}>فتح الدليل {i+1} / Open evidence {i+1}</button>)}
          {t.canAct&&<a className={button} href={t.href} onClick={()=>{const target=document.querySelector(t.href);if(target instanceof HTMLElement){target.closest('details')?.setAttribute('open','');requestAnimationFrame(()=>target.focus());}}}>متابعة الإجراء / Continue to action</a>}
          {t.ownerId===actorId&&t.status==='ASSIGNED'&&<button className={button} disabled={disabled||dirty} onClick={()=>void run('ACCEPT_RENEWAL',{taskId:t.id})}>قبول المهمة / Accept renewal</button>}
        </div>
        {coordinator&&!closed(t)&&<details><summary className="min-h-12 cursor-pointer py-3">{t.ownerId?'تعديل المسؤول أو الموعد / Reassign or change deadline':'تعيين المسؤول والموعد / Assign owner and deadline'}</summary><form className="space-y-3" onChange={mark} onSubmit={submit('ASSIGN_RENEWAL',t.id)}><fieldset disabled={disabled} className="space-y-3"><label className="block">المسؤول المخوّل / Eligible owner<select name="ownerId" required className={field} defaultValue={t.ownerId??''}><option value="" disabled>اختر المسؤول / Select owner</option>{t.eligibleOwners.map(id=><option key={id} value={id}>{name(id)}</option>)}</select></label><label className="block">الموعد بتوقيت جهازك / Due in your device timezone<input className={field} name="dueAt" type="datetime-local" required/></label><label className="block">سبب التعيين / Assignment reason<textarea className={field} name="reason" required maxLength={1000}/></label><p className="text-sm">تغيير التعيين يتطلب قبولاً جديداً. / Reassignment requires a fresh acceptance.</p><button className={button}>حفظ التعيين / Save assignment</button></fieldset></form></details>}
        {t.ownerId===actorId&&!closed(t)&&<details><summary className="min-h-12 cursor-pointer py-3">إعادة للمنسقة مع السبب / Return to coordinator with a reason</summary><form className="space-y-3" onChange={mark} onSubmit={submit('RETURN_RENEWAL',t.id)}><fieldset disabled={disabled}><label>سبب الإعادة / Return reason<textarea name="reason" className={field} maxLength={1000} required/></label><button className={`${button} mt-3`}>إعادة المهمة / Return task</button></fieldset></form></details>}
        {!!t.events.length&&<details><summary className="min-h-12 cursor-pointer py-3">سجل المسؤولية / Responsibility history ({t.events.length})</summary><ol className="space-y-2">{t.events.map((e,i)=><li key={i}>{({ASSIGNED:'تعيين / Assigned',ACCEPTED:'قبول / Accepted',RETURNED:'إعادة / Returned',COMPLETE:'اكتمل / Completed',NOT_REQUIRED:'غير مطلوب / Not required',OWNER_CHANGED:'تغير المسؤول / Owner changed'} as Record<string,string>)[e.type]??e.type} · {name(e.actorId)} · {when(e.at)}{e.reason&&<p>{e.reason}</p>}{e.reference&&<p>{e.reference}</p>}</li>)}</ol></details>}
      </article>)}
    </div>)}
    {!!past.length&&<details><summary className="min-h-12 cursor-pointer py-3">دورات التجديد السابقة / Earlier renewal cycles ({past.length})</summary><ul>{past.map(c=><li key={c.id} className="py-2">{c.kind==='print'?`Print v${c.revision}`:'الاستلام / Collection'} · {c.completed}/{c.total} · استُبدل / Superseded {when(c.supersededAt!)}<ul className="ps-5">{c.tasks.map(t=><li key={t.id}>{t.title} · {labels[t.status]} · {name(t.ownerId)}</li>)}</ul></li>)}</ul></details>}
  </section>;
}
