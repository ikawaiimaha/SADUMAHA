import { useContext, useState, type FormEvent, type ReactNode } from 'react';
import { DraftForm, DraftFieldsContext } from './DraftForm';
import type { OperationsView } from './ConnectedOperations';
import type { CollectionView } from '../lib/useCollectionWorkflow';
import { type Language, type WorkspaceTask, accountLabel } from '../lib/operationalWorkspace';

export type WorkspaceCommand = (channel: 'collection' | 'operations', action: string, data: Record<string, unknown>, file?: File) => Promise<boolean>;
type Props = { task: WorkspaceTask; ops: OperationsView; collection?: CollectionView; actor: { id: string; role: string }; language: Language;
  disabled: boolean; mark: () => void; run: WorkspaceCommand; evidenceId: string; onEvidence: (id: string) => void };
function Input({label,name,type='text',value,required=true,min}: {label:string;name:string;type?:string;value?:string|number;required?:boolean;min?:number}) {
  return <label className="work-field">{label}<input name={name} type={type} defaultValue={value} required={required} maxLength={1000} min={min} step={type==='number'?'any':undefined}/></label>;
}
function Check({name,children}: {name:string;children:ReactNode}) {return <label className="work-check"><input type="checkbox" name={name} required/>{children}</label>;}
function Form({label,disabled,mark,submit,children}: {label:string;disabled:boolean;mark:()=>void;submit:(f:FormData)=>Promise<boolean>;children:ReactNode}) {
  return <DraftForm onChange={mark} onInput={mark} onSubmit={async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();mark();const form=e.currentTarget;if(await submit(new FormData(form)))form.reset();}}>
    <fieldset disabled={disabled} className="work-fields"><legend className="sr-only">{label}</legend>{children}<button className="work-primary">{label}</button></fieldset>
  </DraftForm>;
}
export function ResponsibilityForm({task,ops,language,disabled,mark,run}:Pick<Props,'task'|'ops'|'language'|'disabled'|'mark'|'run'>) {
  const t=(ar:string,en:string)=>language==='ar'?ar:en;
  const eligible=task.renewal?ops.accounts.filter(a=>task.renewal!.eligibleOwners.includes(a.id)):ops.accounts.filter(a=>a.role===task.ownerRole);
  return <Form label={t('حفظ المسؤول والموعد','Save owner and deadline')} disabled={disabled} mark={mark} submit={f=>run('operations',task.renewal?'ASSIGN_RENEWAL':'ASSIGN_TASK',{
    ...(task.renewal?{taskId:task.id}:{key:task.legacyKey}),ownerId:f.get('ownerId'),dueAt:new Date(String(f.get('dueAt'))).toISOString(),reason:f.get('reason')})}>
    <label className="work-field">{t('المسؤول المخوّل','Eligible owner')}<select required name="ownerId" defaultValue={task.ownerId??''}><option value="" disabled>{t('اختر المسؤول','Select owner')}</option>{eligible.map(a=><option key={a.id} value={a.id}>{accountLabel(a,language)}</option>)}</select></label>
    <Input name="dueAt" type="datetime-local" label={t('الموعد النهائي بتوقيت جهازك','Deadline in your device timezone')}/>
    <Input name="reason" label={t('سبب التعيين أو تغييره','Reason for assignment or change')}/>
    <p className="work-hint">{t('يجب أن يقبل المسؤول المهمة؛ التعيين وحده ليس اعتماداً.','The owner must accept this task. Assignment is not approval.')}</p>
  </Form>;
}

export function EvidenceUpload({kind,language,disabled,mark,run}: {kind:string;language:Language;disabled:boolean;mark:()=>void;run:WorkspaceCommand}) {
  const t=(ar:string,en:string)=>language==='ar'?ar:en;
  return <Form label={t('حفظ ملف الدليل','Save evidence file')} disabled={disabled} mark={mark} submit={f=>{const file=f.get('file') as File;return run('operations','UPLOAD',{kind,name:file.name,source:f.get('source'),sender:f.get('sender'),receivedAt:f.get('receivedAt')?new Date(String(f.get('receivedAt'))).toISOString():null},file);}}>
    <label className="work-field">{t('الملف','File')}<input name="file" required type="file" accept={kind==='PACKING'?'image/png,image/jpeg,application/pdf':'application/pdf'}/></label>
    <p className="work-hint">{t('ملفات تجريبية فقط. الحد الأقصى 10 ميغابايت.','Synthetic files only. Maximum 10 MB.')}</p>
    <Input name="source" label={t('مرجع المصدر','Source reference')}/><Input name="sender" label={t('المرسل','Sender')}/><Input name="receivedAt" type="datetime-local" required={false} label={t('وقت الاستلام، إن عُرف','Received time, if known')}/>
  </Form>;
}

function CollectionSource({collection,language,disabled,mark,run}:Pick<Props,'collection'|'language'|'disabled'|'mark'|'run'>) {
  const r=collection?.record,t=(ar:string,en:string)=>language==='ar'?ar:en;
  const recovered=useContext(DraftFieldsContext);
  const [closures,setClosures]=useState<Array<{start:string;end:string}>>(()=>{try{const v=JSON.parse(recovered.closures??'null');if(Array.isArray(v)&&v.length<=20&&v.every(c=>typeof c.start==='string'&&typeof c.end==='string'))return v;}catch{/* Retain current record when a draft is invalid. */}return r?.closures??[];});
  return <Form label={t('حفظ بيانات الاستلام','Save collection details')} disabled={disabled} mark={mark} submit={f=>run('collection','SAVE',{details:{
    ...Object.fromEntries(['address','city','country','contact','sourceRef','timezone'].map(k=>[k,String(f.get(k))])),availability:{start:f.get('start'),end:f.get('end')},closures,conflict:f.get('conflict')==='on'}})}>
    <input type="hidden" name="closures" value={JSON.stringify(closures)}/>
    <Input name="address" value={r?.address} label={t('عنوان الاستلام الفعلي','Physical collection address')}/>
    <div className="work-field-pair"><Input name="city" value={r?.city} label={t('المدينة','City')}/><Input name="country" value={r?.country} label={t('بلد الاستلام','Collection country')}/></div>
    <Input name="contact" value={r?.contact} label={t('جهة الاتصال للاستلام','Collection contact')}/><Input name="sourceRef" value={r?.sourceRef} label={t('مرجع تأكيد العنوان','Address source reference')}/>
    <Input name="timezone" value={r?.timezone} label={t('المنطقة الزمنية، مثل Europe/Paris','Timezone, e.g. Europe/Paris')}/>
    <div className="work-field-pair"><Input name="start" type="date" value={r?.availability.start} label={t('الإتاحة من','Available from')}/><Input name="end" type="date" value={r?.availability.end} label={t('إلى','Until')}/></div>
    <details><summary>{t('فترات إغلاق الموقع','Site closure periods')} ({closures.length})</summary>{closures.map((c,i)=><div className="work-field-pair" key={i}>{(['start','end'] as const).map(k=><label className="work-field" key={k}>{k==='start'?t('بداية الإغلاق','Closure starts'):t('نهاية الإغلاق','Closure ends')}<input required type="date" value={c[k]} onInput={e=>{const value=e.currentTarget.value;setClosures(v=>v.map((old,n)=>n===i?{...old,[k]:value}:old));mark();}} onChange={e=>{const value=e.target.value;setClosures(v=>v.map((old,n)=>n===i?{...old,[k]:value}:old));mark();}}/></label>)}<button type="button" className="work-secondary" onClick={()=>{setClosures(v=>v.filter((_,n)=>n!==i));mark();}}>{t('إزالة الفترة','Remove period')}</button></div>)}<button type="button" className="work-secondary" disabled={closures.length>=20} onClick={()=>{setClosures(v=>[...v,{start:'',end:''}]);mark();}}>{t('إضافة فترة إغلاق','Add closure')}</button></details>
    <label className="work-check"><input type="checkbox" name="conflict" defaultChecked={r?.conflict}/>{t('المعلومات متعارضة وتحتاج إلى توضيح','The source information conflicts and needs clarification')}</label>
  </Form>;
}

export default function OperationalForms(p:Props) {
  const {task,ops,collection,language,disabled,mark,run,evidenceId,onEvidence}=p;
  const t=(ar:string,en:string)=>language==='ar'?ar:en;
  const r=collection?.record,job=ops.job,pkg=job?.packages.find(v=>v.revision===job.record.version);
  const common={disabled,mark},print=(action:string,data:Record<string,unknown>={})=>run('operations',action,{...data,revision:pkg?.revision});
  const choice=(kind:string,name='evidenceId')=><label className="work-field">{t('اختر الملف الذي تراجعه','Select the file you are reviewing')}<select name={name} required value={evidenceId} onChange={e=>onEvidence(e.target.value)}><option value="" disabled>{t('اختر الملف','Select a file')}</option>{ops.files.filter(f=>f.kind===kind).map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>;
  if(task.key==='amendSource'||task.key==='source'&&!r) return <CollectionSource {...p}/>;
  if(task.key==='acceptCollection')return <Form {...common} label={t('قبول مسؤولية الاستلام','Accept collection responsibility')} submit={()=>run('collection','ACCEPT',{})}><p>{t('ستصبح مسؤولاً عن متابعة هذا الاستلام.','You will be responsible for following this collection through.')}</p></Form>;
  if(task.key==='source')return <Form {...common} label={t('تأكيد مصدر البيانات','Confirm source details')} submit={f=>run('collection','CONFIRM',{checked:f.get('checked')==='on'})}><Check name="checked">{t('راجعت العنوان وجهة الاتصال وفترة الإتاحة مقابل المصدر المعروض.','I checked this address, contact and availability against the displayed source.')}</Check>{r?.conflict&&<p role="alert">{t('يلزم حل تعارض المصدر قبل التأكيد.','Resolve the source conflict before confirming.')}</p>}</Form>;
  if(['pickup','amendPickup'].includes(task.key))return <Form {...common} label={t('حفظ موعد الاستلام','Save pickup plan')} submit={f=>run('collection','PLAN',{pickupDate:f.get('pickupDate')})}><Input name="pickupDate" type="date" value={r?.plan?.pickupDate} label={t('موعد الاستلام المقترح','Proposed pickup date')}/><p className="work-hint">{t('بتوقيت موقع الاستلام:','Collection timezone:')} {r?.timezone}. {t('هذا تخطيط؛ لا يحجز وسيلة نقل.','This records a plan; it does not book transport.')}</p></Form>;
  if(task.key==='plan')return <Form {...common} label={t('حفظ خطة التغليف','Save packing plan')} submit={f=>run('collection','PACK',{value:f.get('specification'),packingOwner:f.get('packingOwner'),amount:Number(f.get('amount')),requiresTechnical:f.get('technical')==='yes',technicalReason:f.get('technicalReason')})}>
    <Input name="specification" label={t('طريقة التغليف والحماية','Packing and protection specification')}/><Input name="packingOwner" label={t('اسم المسؤول عن التغليف','Named packing owner')}/><Input name="amount" type="number" min={0} label={t('التكلفة المقترحة بالدرهم','Proposed cost in AED')}/>
    <label className="work-field">{t('المراجعة الفنية','Specialist review')}<select name="technical"><option value="yes">{t('مطلوبة','Required')}</option><option value="no">{t('غير مطلوبة، بسبب موثق','Not required, with recorded reason')}</option></select></label><Input name="technicalReason" required={false} label={t('السبب إذا لم تكن المراجعة مطلوبة','Reason if review is not required')}/>
  </Form>;
  if(['technical','cost'].includes(task.key))return <Form {...common} label={t('تسجيل المراجعة','Record review')} submit={f=>run('collection',task.key==='technical'?'TECHNICAL':'COST',{value:f.get('reference')})}><Input name="reference" label={t('مرجع المراجعة والنتيجة','Review reference and result')}/></Form>;
  if(task.key==='reopen')return <Form {...common} label={t('مراجعة أثر تغيير التغليف','Review packing change impact')} submit={f=>run('collection','REOPEN',{value:f.get('reason')})}><Input name="reason" label={t('ما الذي تغيّر؟','What changed?')}/></Form>;
  if(task.key==='packing')return <Form {...common} label={t('تأكيد فحص التغليف','Confirm packing inspection')} submit={f=>run('operations','VERIFY_PACKING',{evidenceId:f.get('evidenceId'),checked:f.get('checked')==='on'})}>{choice('PACKING')}<Check name="checked">{t('فحصت الملف المعروض مقابل خطة التغليف الحالية.','I inspected the displayed file against the current packing plan.')}</Check></Form>;
  if(['package','amendPackage'].includes(task.key))return <Form {...common} label={t('مراجعة وحفظ أمر الطباعة','Review and save print package')} submit={f=>run('operations','SET_PRINT_PACKAGE',{evidenceId:f.get('evidenceId'),spec:Object.fromEntries(['supplier','quantity','size','stock','finishing','profile','deliveryDate'].map(k=>[k,k==='quantity'?Number(f.get(k)):f.get(k)]))})}>{choice('PRINT_PROOF')}
    {([['supplier','المورد','Supplier'],['quantity','الكمية','Quantity'],['size','المقاس والهوامش','Size and bleed'],['stock','الخامة','Stock'],['finishing','التشطيب','Finishing'],['profile','مواصفات الفحص المتفق عليها','Agreed preflight profile'],['deliveryDate','تاريخ التسليم','Delivery date']] as const).map(([name,ar,en])=><Input key={name} name={name} label={t(ar,en)} value={pkg?.spec[name]} type={name==='quantity'?'number':name==='deliveryDate'?'date':'text'} min={name==='quantity'?1:undefined}/>)}
  </Form>;
  if(task.key==='preflight')return <Form {...common} label={t('تسجيل نتيجة الفحص','Record preflight result')} submit={f=>print('PREFLIGHT',{evidenceId:f.get('evidenceId'),passed:f.get('result')==='pass',note:f.get('note')})}>{choice('PREFLIGHT')}<label className="work-field">{t('النتيجة','Result')}<select name="result"><option value="hold">{t('معلّق — يحتاج إلى تصحيح','Hold — correction needed')}</option><option value="pass">{t('مستوفٍ','Pass')}</option></select></label><Input name="note" label={t('نطاق الفحص والملاحظات','Inspection scope and notes')}/></Form>;
  if(task.key==='editorial')return <Form {...common} label={t('إحالة المراجعة للاعتماد','Submit review for authorization')} submit={f=>print('REVIEW_PRINT',{editorialChecked:f.get('bilingual')==='on',rightsChecked:f.get('rights')==='on'})}><Check name="bilingual">{t('راجعت النص العربي والإنجليزي في هذه البروفة.','I reviewed the Arabic and English text in this proof.')}</Check><Check name="rights">{t('راجعت صلاحيات استخدام المحتوى.','I checked the rights to use this content.')}</Check></Form>;
  if(task.key==='executive')return <Form {...common} label={t('اعتماد هذا الإصدار','Authorize this revision')} submit={f=>print('APPROVE_PRINT',{checked:f.get('checked')==='on'})}><Check name="checked">{t('راجعت الملف والمواصفات الحالية وأوافق عليها.','I reviewed and approve the current file and specification.')}</Check></Form>;
  if(task.key==='dispatch'||task.key==='start')return <Form {...common} label={task.title[language]} submit={()=>print(task.key==='dispatch'?'DISPATCH_PRINT':'START_PRINT')}><p className="work-hint">{t('توثيق تجريبي فقط؛ لا يُرسل طلب إلى المورد.','Local rehearsal record only; no request is sent to a supplier.')}</p></Form>;
  if(task.key==='supplier')return <Form {...common} label={task.title[language]} submit={f=>print('ACK_PRINT',{proofId:pkg?.proofId,sender:f.get('sender'),receivedAt:new Date(String(f.get('receivedAt'))).toISOString(),reference:f.get('reference')})}><Input name="sender" label={t('اسم المرسل من المورد','Supplier sender')}/><Input name="receivedAt" type="datetime-local" label={t('وقت استلام التأكيد بتوقيت جهازك','Acknowledgment received in your device timezone')}/><Input name="reference" label={t('مرجع تأكيد هذا الملف والمواصفات','Confirmation reference for this file and specification')}/></Form>;
  if(['production','delivery'].includes(task.key))return <Form {...common} label={task.title[language]} submit={f=>print(task.key==='production'?'COMPLETE_PRINT':'RECORD_DELIVERY',{quantity:Number(f.get('quantity')),reference:f.get('reference')})}><Input name="quantity" type="number" min={1} label={t('الكمية','Quantity')}/><Input name="reference" label={t('مرجع الإثبات','Evidence reference')}/></Form>;
  if(task.key==='acceptance')return <Form {...common} label={task.title[language]} submit={f=>print('ACCEPT_DELIVERY',{deliveryId:f.get('deliveryId'),checked:f.get('checked')==='on',reference:f.get('reference')})}><label className="work-field">{t('الدفعة المستلمة','Received delivery')}<select name="deliveryId" required>{job?.deliveries.filter(d=>d.revision===pkg?.revision&&!d.acceptance).map(d=><option key={d.id} value={d.id}>{d.quantity} · {d.reference}</option>)}</select></label><Input name="reference" label={t('مرجع فحص الاستلام','Acceptance evidence')}/><Check name="checked">{t('فحصت هذه الدفعة وأقبلها.','I inspected and accept this delivery.')}</Check></Form>;
  if(task.key==='correction'||task.key==='stop')return <Form {...common} label={task.title[language]} submit={f=>print(task.key==='stop'?'STOP_PRINT':'CORRECT_PRINT',task.key==='stop'?{reference:f.get('reference')}:{reason:f.get('reference')})}><Input name="reference" label={task.key==='stop'?t('مرجع تأكيد الإيقاف أو التصرف في المطبوع','Supplier stop or stock disposition reference'):t('سبب التصحيح','Correction reason')}/></Form>;
  if(task.key==='owners')return <Form {...common} label={t('حفظ تسليم المسؤولية','Save responsibility handoff')} submit={f=>run('collection','ASSIGN',{primaryId:f.get('primaryId'),backupId:f.get('backupId'),activeId:f.get('active')==='backup'?f.get('backupId'):f.get('primaryId'),reason:f.get('reason')})}>
    {(['primaryId','backupId'] as const).map(k=><label className="work-field" key={k}>{k==='primaryId'?t('المسؤول الأساسي','Primary owner'):t('المسؤول البديل','Backup owner')}<select name={k} required defaultValue={collection?.assignment[k]??''}><option value="" disabled>{t('اختر المسؤول','Select owner')}</option>{collection?.accounts.map(a=><option key={a.id} value={a.id}>{accountLabel({...a,role:'Logistics'},language)}</option>)}</select></label>)}
    <label className="work-field">{t('يتولى المهمة الآن','Active responsibility')}<select name="active" defaultValue={collection?.assignment.activeId===collection?.assignment.backupId?'backup':'primary'}><option value="primary">{t('المسؤول الأساسي','Primary owner')}</option><option value="backup">{t('المسؤول البديل','Backup owner')}</option></select></label><Input name="reason" label={t('سبب تسليم المسؤولية','Handoff reason')}/><p className="work-hint">{t('يلزم قبول جديد. لا تنتقل صلاحيات الاعتماد إلى البديل.','Fresh acceptance is required. Approval authority is not transferred.')}</p>
  </Form>;
  return null;
}
