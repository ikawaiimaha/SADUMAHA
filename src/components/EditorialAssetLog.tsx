import {useEffect,useRef,useState} from 'react';
import {UploadCloud,FileCheck,Eye} from 'lucide-react';
import {useSessionDraft} from '../context/SessionDrafts';
import {ASSET_LIMIT,assetFileError,updateIdentityAssets,type IdentityAsset,type AssetAction} from '../data/identityAssets';
const button='inline-flex items-center gap-2 rounded border border-[#C8BBA6] bg-white ps-3 pe-3 py-2 text-sm text-[#594F47] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#8B261E]';
function AssetPreview({asset,isAr,onReviewed,onClose}:{asset:IdentityAsset;isAr:boolean;onReviewed:()=>void;onClose:()=>void}) {
 const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{heading.current?.focus();},[]);
 const [url,setUrl]=useState('');
 const [loaded,setLoaded]=useState(false);
 useEffect(()=>{const next=URL.createObjectURL(asset.file);setUrl(next);setLoaded(false);return()=>URL.revokeObjectURL(next);},[asset.file]);
 return <section aria-label={isAr?'معاينة المرفق':'Asset preview'} className="my-3 rounded border bg-white ps-4 pe-4 py-4 space-y-3"><h4 ref={heading} tabIndex={-1} className="font-semibold"><bdi>{asset.file.name}</bdi></h4>
 {url&&(asset.file.name.toLowerCase().endsWith('.pdf')?<><iframe title={isAr?'معاينة PDF':'PDF preview'} src={url} sandbox="" className="h-80 w-full border"/><p>{isAr?'إذا لم يظهر الملف، نزّل النسخة وافحصها قبل تأكيد المراجعة.':'If the PDF does not render, download and inspect it before confirming review.'}</p><a href={url} download={asset.file.name} className={button}>{isAr?'تنزيل للفحص':'Download for inspection'}</a></>:<img src={url} alt={isAr?'معاينة الهوية البصرية':'Visual identity preview'} className="max-h-80 w-full object-contain" onLoad={()=>setLoaded(true)} onError={()=>setLoaded(false)}/>)}
 <div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={Boolean(asset.reviewedAt)||(!loaded&&!asset.file.name.toLowerCase().endsWith('.pdf'))} onClick={onReviewed}>{isAr?'فحصت هذا الملف — تسجيل المراجعة':'I inspected this file — record review'}</button><button type="button" className={button} onClick={onClose}>{isAr?'إغلاق المعاينة':'Close preview'}</button></div></section>;
}
export function EditorialAssetLog({scope,isAr,unlocked}:{scope:string;isAr:boolean;unlocked:boolean}) {
 const [rows,setRows]=useSessionDraft<IdentityAsset[]>(`identity-assets:v2:${scope}`,[]);
 const [message,setMessage]=useState(''); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
 const [preview,setPreview]=useState<string|null>(null); const [replacement,setReplacement]=useState<string|undefined>();
 const picker=useRef<HTMLInputElement>(null); const busyRef=useRef(false);
 const t=(ar:string,en:string)=>isAr?ar:en;
 const apply=(action:AssetAction)=>setRows(current=>updateIdentityAssets(current,action,unlocked));
 async function attach(files:File[]) {
  if(!unlocked||busyRef.current||!files.length)return;
  setError('');setMessage('');
  if(rows.length+files.length>ASSET_LIMIT||(replacement&&files.length!==1)){setError(t('الحد 20 نسخة في الجلسة؛ اختر ملفاً واحداً للاستبدال.','Maximum 20 versions per session; choose one file for replacement.'));return;}
  const invalid=files.find(f=>assetFileError(f));
  if(invalid){setError(`${invalid.name}: ${t('اختر SVG أو PNG أو JPG أو PDF غير فارغ، بحد أقصى 10 ميغابايت.','Choose a nonempty SVG, PNG, JPG or PDF, no larger than 10 MB.')}`);return;}
  busyRef.current=true;setBusy(true);
  try {
   const assets:IdentityAsset[]=[];
   for(const file of files){const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))).map(n=>n.toString(16).padStart(2,'0')).join('');
    if(rows.some(r=>r.digest===digest)||assets.some(r=>r.digest===digest)){setError(t('هذا الملف مرفق بالفعل (قد يكون في السجل أو المحذوفات). لم تُضف المجموعة.','This file is already attached (including history or removed drafts). No files in this batch were added.'));return;}
    const id=crypto.randomUUID();assets.push({id,groupId:id,version:1,file,digest,attachedAt:new Date().toISOString()});}
   setRows(current=>assets.reduce((next,asset)=>updateIdentityAssets(next,{type:'attach',asset,replaceId:replacement},unlocked),current));
   setMessage(t(`أُرفق ${assets.length} ملف محلياً بنجاح.`,`Attached ${assets.length} file(s) locally.`));setReplacement(undefined);
  }catch{setError(t('تعذر قراءة الملفات؛ حاول اختيارها مجدداً.','Could not read files; choose them again.'));}
  finally{busyRef.current=false;setBusy(false);}
 }
 if(!unlocked)return null;
 const visible=rows.filter(r=>!r.removed);const selected=visible.find(r=>r.id===preview);
 return <section aria-labelledby="identity-assets-heading" className="rounded-lg border border-[#D9D2C5] border-s-4 border-s-[#8C7A6B] bg-[#F7F1E6] ps-4 pe-4 py-5 text-start">
 <h3 id="identity-assets-heading" className="flex items-center gap-2 text-lg font-bold"><FileCheck aria-hidden="true" className="size-5"/>{t('سجل المرفقات والهوية البصرية','Visual Identity & Asset Log')}</h3>
 <p className="mt-2 text-sm text-[#594F47]">{t('مستقل عن نشر نص الثيمة. الملفات والمراجعات محلية لهذه الجلسة وتُفقد عند تحديث الصفحة؛ لا رفع خارجي أو اعتماد مؤسسي حقيقي.','Independent of theme-text publication. Files and reviews stay in this session and are lost on refresh; no server upload or actual institutional approval.')}</p>
 <div className="my-4 rounded border-2 border-dashed border-[#C8BBA6] bg-[#EDE4D3] ps-4 pe-4 py-4">
 <button type="button" className={button} disabled={busy||rows.length>=ASSET_LIMIT} onClick={()=>{setReplacement(undefined);if(picker.current){picker.current.multiple=true;picker.current.click();}}}><UploadCloud aria-hidden="true" className="size-5"/>{busy?t('جارٍ فحص الملفات…','Checking files…'):t('إرفاق الشعار الرسمي وملفات الهوية','Attach logo (Shi’aar) and identity files')}</button>
 <input ref={picker} type="file" hidden accept=".svg,.png,.jpg,.jpeg,.pdf" multiple={!replacement} onChange={e=>{void attach(Array.from(e.target.files??[]));e.target.value='';}}/>
 <p className="mt-2 text-sm">{t('SVG · PNG · JPG · PDF — حتى 10 ميغابايت للملف، 20 نسخة للجلسة.','SVG · PNG · JPG · PDF — up to 10 MB per file, 20 versions per session.')}</p></div>
 {error&&<p role="alert" className="my-2 text-[#8B261E]">{error}</p>}<p role="status" aria-live="polite">{message}</p>
 <h4 className="mt-4 font-semibold">{t('سجل المرفقات','Live attachment log')}</h4>{!visible.length&&<p className="my-2">{t('لا توجد مرفقات حتى الآن','No attachments yet')}</p>}
 <ul className="divide-y divide-[#D9D2C5]">{visible.map(r=>{const superseded=Boolean(r.approvedAt&&rows.some(n=>n.groupId===r.groupId&&n.approvedAt&&n.version>r.version));return <li key={r.id} className="py-4 space-y-2"><p className="break-all font-medium"><bdi>{r.file.name}</bdi> · {t('النسخة','Version')} {r.version}</p><p className="text-sm">{superseded?t('نسخة معتمدة سابقة — محفوظة','Previous approved version — retained'):r.approvedAt?t('معتمد للجلسة','Approved for session'):r.reviewedAt?t('تمت المراجعة — بانتظار الاعتماد','Reviewed — awaiting approval'):t('مرفق محلياً — لم يُراجع','Attached locally — not reviewed')} · {(r.file.size/1024).toFixed(1)} KB</p>
 <p className="text-sm text-[#594F47]">{t('أُرفق','Attached')}: <time dateTime={r.attachedAt}><bdi>{new Date(r.attachedAt).toLocaleString(isAr?'ar-AE':'en-AE')}</bdi></time>{r.approvedAt&&<> · {t('اعتماد قسم التحرير','Editorial approval')}: <bdi>{new Date(r.approvedAt).toLocaleString(isAr?'ar-AE':'en-AE')}</bdi></>}</p>
 <div className="flex flex-wrap gap-2"><button type="button" className={button} onClick={()=>setPreview(r.id)}><Eye aria-hidden="true" className="size-4"/>{t('معاينة وفحص','Preview and inspect')}</button>
 {!r.approvedAt&&<><button type="button" className={button} disabled={!r.reviewedAt||rows.some(n=>n.groupId===r.groupId&&n.version>r.version&&n.approvedAt)} onClick={()=>{apply({type:'approve',id:r.id,at:new Date().toISOString()});setMessage(t('سُجّل اعتماد قسم التحرير لهذه النسخة في الجلسة.','Editorial approval recorded for this version in the session.'));}}>{t('اعتماد النسخة للجلسة','Approve version for session')}</button><button type="button" className={button} onClick={()=>{apply({type:'remove',id:r.id,at:new Date().toISOString()});setPreview(null);setMessage(t('أُزيلت المسودة؛ يمكنك استعادتها من المحذوفات.','Draft removed; you can restore it from removed drafts.'));}}>{t('إزالة المسودة','Remove draft')}</button></>}
 <button type="button" className={button} disabled={busy||rows.length>=ASSET_LIMIT} onClick={()=>setReplacement(r.id)}>{t('إضافة نسخة بديلة','Add replacement version')}</button></div>
 {replacement===r.id&&<div className="rounded bg-[#EDE4D3] ps-3 pe-3 py-3"><p>{t('ستُحفظ النسخة السابقة؛ البديلة تحتاج مراجعة واعتماداً جديدين.','The previous version remains; the replacement needs a new review and approval.')}</p><button type="button" className={button} disabled={busy} onClick={()=>picker.current?.click()}>{t('اختيار ملف بديل','Choose replacement file')}</button><button type="button" className={button} onClick={()=>setReplacement(undefined)}>{t('إلغاء','Cancel')}</button></div>}
 </li>;})}</ul>
 {selected&&<AssetPreview key={selected.id} asset={selected} isAr={isAr} onClose={()=>setPreview(null)} onReviewed={()=>{apply({type:'review',id:selected.id,at:new Date().toISOString()});setMessage(t('سُجّلت مراجعة الملف. يمكنك اعتماد النسخة.','Review recorded. You can now approve this version.'));}}/>}
 {rows.some(r=>r.removed)&&<details className="mt-4"><summary>{t('المسودات المحذوفة — قابلة للاستعادة','Removed drafts — recoverable')}</summary>{rows.filter(r=>r.removed).map(r=><p key={r.id}><bdi>{r.file.name}</bdi> <button type="button" className={button} onClick={()=>apply({type:'restore',id:r.id,at:new Date().toISOString()})}>{t('استعادة','Restore')}</button></p>)}</details>}
 <details className="mt-5 rounded border bg-[#EDE4D3] ps-3 pe-3 py-3"><summary className="cursor-pointer">{t('أمثلة استرشادية — ليست مرفقات','Reference examples — not attachments')}</summary><ul className="mt-3 space-y-2">{['SADU_12th_Logo_Primary.svg','Theme_Typography_Guidelines.pdf'].map(name=><li key={name}><bdi className="break-all">{name}</bdi> · {t('نموذج فقط','Example only')}</li>)}</ul></details>
 </section>;
}
