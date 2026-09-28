import {useState,useEffect} from 'react';
import type {NominatedArtistDossier} from './ArtistNominationForm';
import {type SupplierDelivery,type SupplierAction,type PackingEvidence,validPhoto} from '../data/operationalRegisters';
const input='block w-full rounded border border-[#D9CEBA] ps-3 pe-3 py-2 bg-white';
const button='rounded border border-[#8B261E] ps-4 pe-4 py-2 text-[#8B261E] disabled:opacity-50 disabled:cursor-not-allowed';
const panel='my-5 rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-4 pe-4 py-4 space-y-3 text-start';
export function SupplierRegister({rows,dossiers,actor,coordinatorId,isAr,onAction}:{rows:SupplierDelivery[];dossiers:NominatedArtistDossier[];actor:string;coordinatorId:string;isAr:boolean;onAction:(action:SupplierAction)=>void}) {
  const t=(ar:string,en:string)=>isAr?ar:en;
  const [draft,setDraft]=useState({dossierId:'',vendorName:'',vendorId:'',deliverable:'',invoiceReference:'',evidenceReference:''});
  const assigned=dossiers.find(d=>d.id===draft.dossierId);
  const visible=rows.filter(r=>actor==='COORDINATOR'?r.coordinatorId===coordinatorId:actor==='FINANCE'?Boolean(r.signedOffAt):true);
  return <section className={panel}><h2 className="text-xl font-semibold">{t('سجل الموردين واعتماد التسليم','Supplier deliveries and sign-off')}</h2><p>{t('محاكاة للجلسة فقط؛ رقم المورد ومرجع الدليل مدخلات غير متحققة. لا دفع أو إرسال خارجي.','Session rehearsal only; vendor IDs and evidence references are unverified entries. No payment or external dispatch.')}</p>
    {actor==='TECHNICAL'&&<form className="grid gap-3 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();if(!assigned?.assignedCoordinatorId)return;onAction({type:'record',actor,record:{...draft,id:crypto.randomUUID(),coordinatorId:assigned.assignedCoordinatorId,recordedAt:new Date().toISOString()}});}}>
      <label>{t('ملف الفنان المعتمد','Approved artist dossier')}<select required className={input} value={draft.dossierId} onChange={e=>setDraft({...draft,dossierId:e.target.value})}><option value="">{t('اختر الملف','Choose dossier')}</option>{dossiers.filter(d=>d.status==='APPROVED'&&d.assignedCoordinatorId).map(d=><option key={d.id} value={d.id}>{d.artistName}</option>)}</select></label>
      {(['vendorName','vendorId','deliverable','invoiceReference','evidenceReference'] as const).map((field,i)=><label key={field}>{(isAr?['اسم الفني / المورد','رقم المورد في المالية المركزية','وصف العمل المسلّم','مرجع الفاتورة','مرجع دليل التسليم']:['Technician / vendor name','Central Finance Vendor ID','Delivered work description','Invoice reference','Delivery evidence reference'])[i]}<input required className={input} value={draft[field]} onChange={e=>setDraft({...draft,[field]:e.target.value})}/></label>)}
      <button className={button} disabled={!assigned||Object.values(draft).some(v=>!v.trim())||rows.some(r=>r.vendorId===draft.vendorId.trim()&&r.invoiceReference===draft.invoiceReference.trim())}>{t('تسجيل التسليم لمراجعة المنسقة','Record delivery for Coordinator review')}</button>
    </form>}
    {!visible.length&&<p>{t('لا توجد سجلات مؤهلة في هذه القائمة.','No eligible records in this queue.')}</p>}
    {visible.map(r=><article key={r.id} className="rounded border bg-white ps-3 pe-3 py-3 space-y-2"><h3 className="font-semibold">{r.vendorName} · <bdi>{r.vendorId}</bdi></h3><p>{dossiers.find(d=>d.id===r.dossierId)?.artistName} · {r.deliverable}</p><p>{t('الفاتورة والدليل','Invoice and evidence')}: {r.invoiceReference} · {r.evidenceReference}</p><p>{r.signedOffAt?t('اعتمدت المنسقة التسليم؛ أحيل للمالية','Coordinator signed off; routed to Finance'):t('بانتظار اعتماد المنسقة؛ الفاتورة محجوبة عن المالية','Waiting for Coordinator sign-off; invoice withheld from Finance')} <bdi>{r.signedOffAt}</bdi></p>
      {actor==='COORDINATOR'&&<button className={button} disabled={Boolean(r.signedOffAt)||dossiers.find(d=>d.id===r.dossierId)?.amendments?.some(a=>a.status==='PENDING')} onClick={()=>onAction({type:'sign-off',actor,id:r.id,coordinatorId,at:new Date().toISOString()})}>{t('اعتماد التسليم وإحالة الفاتورة','Sign off delivery and route invoice')}</button>}
      {actor==='FINANCE'&&<button className={button} disabled={!r.signedOffAt||Boolean(r.receivedByFinanceAt)} onClick={()=>onAction({type:'finance-receipt',actor,id:r.id,coordinatorId,at:new Date().toISOString()})}>{t('تسجيل استلام الفاتورة — دون دفع','Record invoice receipt — no payment')}</button>}
      {r.receivedByFinanceAt&&<p role="status">{t('سُجل استلام المالية','Finance receipt recorded')} · <bdi>{r.receivedByFinanceAt}</bdi></p>}
    </article>)}
  </section>;
}
export function PackingRegister({record,isAr,onRecord}:{record?:PackingEvidence;isAr:boolean;onRecord:(record:PackingEvidence)=>void}) {
  const t=(ar:string,en:string)=>isAr?ar:en;
  const [containerType,setType]=useState<PackingEvidence['containerType']>('CRATE');
  const [reference,setReference]=useState(''); const [files,setFiles]=useState<File[]>([]); const [error,setError]=useState('');
  const [urls,setUrls]=useState<string[]>([]);
  useEffect(()=>{const next=record?.files.map(f=>URL.createObjectURL(f))??[];setUrls(next);return()=>next.forEach(url=>URL.revokeObjectURL(url));},[record]);
  return <section className={panel}><h2 className="text-xl font-semibold">{t('سجل الحاويات وصور فتحها','Container and unboxing evidence')}</h2><p>{t('صور محلية للجلسة فقط؛ لا تُرفع إلى خادم ولا تؤكد الاستلام أو سلامة العمل تلقائياً.','Photos remain local to this session; no server upload or automatic receipt/condition certification.')}</p>
    {!record?<form className="space-y-3" onSubmit={e=>{e.preventDefault();onRecord({containerType,carrierReference:reference.trim(),files,recordedAt:new Date().toISOString()});}}>
      <label className="block">{t('نوع الحاوية','Container type')}<select className={input} value={containerType} onChange={e=>setType(e.target.value as PackingEvidence['containerType'])}><option value="CRATE">{t('صندوق خشبي','Wooden crate')}</option><option value="PLASTIC_CYLINDER">{t('أسطوانة بلاستيكية','Plastic cylinder')}</option></select></label>
      <label className="block">{t('مرجع شركة الشحن / الفحص','Carrier / inspection reference')}<input required className={input} value={reference} onChange={e=>setReference(e.target.value)}/></label>
      <label className="block">{t('صور فتح الصناديق — حتى 10 صور، 10 ميغابايت للصورة','Unboxing photos — up to 10 images, 10 MB each')}<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>{const next=Array.from(e.target.files??[]);if(next.length>10||next.some(f=>!validPhoto(f))){setFiles([]);setError(t('اختر صور JPEG أو PNG أو WebP ضمن الحدود الموضحة.','Choose JPEG, PNG or WebP images within the stated limits.'));return;}setFiles(next);setError('');}}/></label>
      {files.map((f,i)=><p key={i}>{f.name}</p>)}{error&&<p role="alert">{error}</p>}<button className={button} disabled={!reference.trim()||!files.length||Boolean(error)}>{t('حفظ دليل الفحص للجلسة','Save inspection evidence for session')}</button>
    </form>:<><p role="status"><bdi>{record.containerType}</bdi> · {record.carrierReference} · <bdi>{record.recordedAt}</bdi></p><div className="grid gap-3 sm:grid-cols-3">{record.files.map((f,i)=><figure key={i}>{urls[i]&&<img src={urls[i]} alt={t('صورة فتح الحاوية','Container unboxing photo')} className="max-h-48 w-full object-contain"/>}<figcaption className="break-all">{f.name}</figcaption></figure>)}</div></>}
  </section>;
}
