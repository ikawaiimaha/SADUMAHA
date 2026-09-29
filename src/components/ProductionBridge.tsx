import { useEffect, useRef, useState } from 'react';
import { Download, FileVideo, Image as ImageIcon } from 'lucide-react';
import { useSessionDraft } from '../context/SessionDrafts';
import { completePrototype, ingestMaster, requestPrototype, decidePrototype, validMaster, validTestPhoto, type DigitalAsset, type PrototypeTicket } from '../data/productionBridge';
function LocalAttachment({file, preview=false}: {file: File; preview?: boolean}) {
 const [url,setUrl]=useState('');
 useEffect(()=>{const u=URL.createObjectURL(file);setUrl(u);return()=>URL.revokeObjectURL(u);},[file]);
 return url ? <div>{preview&&<img src={url} alt={file.name} className="my-2 max-h-48 max-w-full rounded object-contain"/>}<a href={url} download={file.name} className="flex items-center gap-2 break-all underline"><Download aria-hidden="true" className="size-4 shrink-0"/><bdi>{file.name}</bdi></a></div>:null;
}
export function ProductionBridge({artistId,isAr,actor,revision=1,blocked=false}: {artistId:string;isAr:boolean;revision?:number;blocked?:boolean;actor:'ARTIST'|'TECHNICAL'}) {
 const [assets,setAssets]=useSessionDraft<DigitalAsset[]>(`digital-assets:${artistId}`,[]);
 const [tickets,setTickets]=useSessionDraft<PrototypeTicket[]>(`prototype-tests:${artistId}`,[]);
 const [error,setError]=useState('');
 const [title,setTitle]=useState('');
 const [photos,setPhotos]=useState<File[]>([]);
 const dialog=useRef<HTMLDialogElement>(null);
 const t=(ar:string,en:string)=>isAr?ar:en;
 const panel='my-5 space-y-4 rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-5 text-start';
 return <>
 <section className={panel}><h2 className="flex items-center gap-2 text-xl font-semibold"><FileVideo aria-hidden="true" className="size-5"/>{actor==='ARTIST'?t('أصول المعرض الرقمية (الفيديو والملفات الأصلية)','Digital Exhibition Assets (Video & Master Files)'):t('التسليمات الرقمية','Digital Deliverables')}</h2>
 <p className="text-sm text-[#736357]">{t('ملفات تجريبية في ذاكرة الجلسة فقط؛ تُفقد عند التحديث. لا رفع لخادم أو إرسال خارجي. لا تُقبل روابط مشاركة خارجية.','Sample files in session memory only; refresh discards them. No server upload or external dispatch. External sharing links are not accepted.')}</p>
 {actor==='ARTIST'&&<label className="block rounded border-2 border-dashed border-[#D9CEBA] bg-white ps-4 pe-4 py-5">{t('اختر ملفات MOV / MP4 / M2V — حتى 2 غيغابايت للملف، 5 ملفات','Choose MOV / MP4 / M2V — up to 2 GB each, 5 files')}<input type="file" accept=".mov,.mp4,.m2v" disabled={blocked||assets.length>=5} className="mt-3 block w-full" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(!file||blocked)return;if(!validMaster(file)||assets.some(r=>r.file.name===file.name&&r.file.size===file.size&&r.file.lastModified===file.lastModified)){setError(t('ملف غير صالح أو مكرر.','Invalid or duplicate file.'));return;}setError('');setAssets(rows=>ingestMaster(rows,{id:crypto.randomUUID(),file,at:new Date().toISOString()},actor));}}/></label>}
 {!assets.length&&<p>{t('لا توجد ملفات رقمية مسجلة.','No digital files recorded.')}</p>}
 <ul className="space-y-3">{assets.map(item=><li key={item.id}><LocalAttachment file={item.file}/><time className="text-sm" dateTime={item.at}>{new Date(item.at).toLocaleString(isAr?'ar-AE':'en-AE')}</time></li>)}</ul>
 </section>
 <section className={panel}><h2 className="flex items-center gap-2 text-xl font-semibold"><ImageIcon aria-hidden="true" className="size-5"/>{t('سجل اختبارات التصنيع والحالة','Prototyping & Condition Ledger')}</h2>
 <p className="text-sm">{t('موافقة الفنان على العينة لا تستبدل الاعتماد الهندسي أو تصريح الموقع.','Artist sample approval does not replace engineering or venue clearance.')}</p>
 {actor==='TECHNICAL'&&<button disabled={blocked} type="button" className="rounded bg-[#8B261E] ps-4 pe-4 py-2 text-white" onClick={()=>{setError('');dialog.current?.showModal();}}>{t('طلب اعتماد الفنان لاختبار التصنيع','Request Artist Prototyping Sign-Off')}</button>}
 {error&&<p role="alert" className="text-red-800">{error}</p>}
 {!tickets.length&&<p>{t('لا توجد طلبات اختبار.','No prototype requests.')}</p>}
 {tickets.map(ticket=><article key={ticket.id} className="space-y-3 rounded border bg-white ps-4 pe-4 py-4"><h3 className="font-semibold">{ticket.title}</h3><p className="break-all" role="status">{ticket.status}</p><p>{t('تاريخ الطلب','Requested')}: <time dateTime={ticket.requestedAt}>{new Date(ticket.requestedAt).toLocaleString(isAr?'ar-AE':'en-AE')}</time></p>{ticket.photos.map((file,index)=><LocalAttachment key={index} file={file} preview/>)}{actor==='ARTIST'&&ticket.status==='PENDING_ARTIST_APPROVAL'&&ticket.revision===revision&&!blocked&&<div className="flex gap-3">{[true,false].map(approve=><button type="button" key={String(approve)} className={`rounded ${approve?'sadu-action-approve':'sadu-action-reject'} ps-4 pe-4 py-2`} onClick={()=>setTickets(rows=>decidePrototype(rows,ticket.id,approve,actor,new Date().toISOString(),revision))}>{approve?t('موافقة','Approve'):t('رفض','Reject')}</button>)}</div>}{ticket.revision!==revision&&<p role="status">{t('اختبار من نسخة اتفاقية سابقة — لا يصرح بالتنفيذ','Prior agreement revision — not valid for current execution')}</p>}{actor==='TECHNICAL'&&<button disabled={blocked||ticket.revision!==revision||ticket.status!=='ARTIST_APPROVED'||Boolean(ticket.completedAt)} type="button" className="rounded sadu-action-approve ps-4 pe-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed" onClick={()=>{if(!blocked)setTickets(rows=>completePrototype(rows,ticket.id,actor,new Date().toISOString(),revision));}}>{t('تسجيل إنجاز العمل المعتمد','Record Approved Test Work Completed')}</button>}{ticket.completedAt&&<p role="status">{t('تم إنجاز العمل المعتمد','Approved test work completed')} · {ticket.completedAt}</p>}{ticket.decidedAt&&<p>{t('وقت قرار الفنان','Artist decision timestamp')}: <bdi>{ticket.decidedAt}</bdi></p>}</article>)}
 </section>
 {actor==='TECHNICAL'&&<dialog ref={dialog} aria-labelledby="prototype-dialog-title" className="m-auto w-full max-w-xl rounded border bg-[#F7F1E6] ps-6 pe-6 py-6 text-start backdrop:bg-black/50" dir={isAr?'rtl':'ltr'}>
 <h2 id="prototype-dialog-title" className="text-xl font-semibold">{t('طلب اعتماد عينة','Request prototype sign-off')}</h2>
 <form className="mt-4 space-y-4" onSubmit={e=>{e.preventDefault();const item:PrototypeTicket={id:crypto.randomUUID(),title,photos,status:'PENDING_ARTIST_APPROVAL',requestedAt:new Date().toISOString(),revision};if(blocked)return;if(requestPrototype(tickets,item,actor)===tickets){setError(t('أدخل عنواناً فريداً وصوراً صالحة.','Enter a unique title and valid photos.'));return;}setTickets(rows=>requestPrototype(rows,item,actor));setTitle('');setPhotos([]);setError('');dialog.current?.close();}}>
 <label className="block">{t('عنوان الاختبار','Test title')}<input required maxLength={500} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Rust Coating Test #1" className="mt-1 block w-full border ps-3 pe-3 py-2"/></label>
 <label className="block">{t('صور الاختبار — حتى 5 صور PNG/JPEG، 10 ميغابايت للصورة','Test photos — up to 5 PNG/JPEG images, 10 MB each')}<input type="file" multiple accept=".png,.jpg,.jpeg" className="mt-2 block w-full" onChange={e=>{const files=Array.from(e.target.files??[]);e.target.value='';if(!files.length||files.length>5||!files.every(validTestPhoto)){setError(t('اختر صوراً صالحة ضمن الحدود.','Choose valid images within the limits.'));return;}setPhotos(files);setError('');}}/></label><p>{photos.map(f=>f.name).join(', ')}</p>
 {error&&<p role="alert" className="text-red-800">{error}</p>}
 <div className="flex gap-3"><button type="submit" disabled={!title.trim()||!photos.length} className="rounded bg-[#8B261E] ps-4 pe-4 py-2 text-white disabled:opacity-50">{t('إرسال الطلب للفنان — محاكاة','Request Artist Approval — simulated')}</button><button type="button" className="rounded border ps-4 pe-4 py-2" onClick={()=>dialog.current?.close()}>{t('إلغاء','Cancel')}</button></div>
 </form></dialog>}
 </>;
}
