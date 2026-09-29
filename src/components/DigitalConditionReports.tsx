import {useEffect,useRef,useState,type ReactNode} from 'react';
import {AlertTriangle,FileCheck,UploadCloud} from 'lucide-react';
import {pilotSupabase as client} from '../lib/pilotSupabase';
import {useOperationalRows} from '../lib/useOperationalRows';
import {validDamagePhoto} from '../data/conditionReporting';
const panel='space-y-3 rounded border bg-[#F7F1E6] ps-5 pe-5 py-5 text-start';
const field='block w-full rounded border bg-[#FFFDF7] ps-3 pe-3 py-2';
const button='rounded border border-[#8B261E] ps-4 pe-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed';
type Report={id:string;contract_id:string;description:string;photos:string[];status:string;decision_at:string|null};
function Evidence({path}:{path:string}){
 const [url,setUrl]=useState('');
 async function view(){const result=await client?.storage.from('logistics-secure').createSignedUrl(path,60);setUrl(result?.data?.signedUrl??'');}
 useEffect(()=>{const timer=window.setTimeout(()=>setUrl(''),60000);return()=>clearTimeout(timer);},[url]);
 return <div><button className="underline" onClick={()=>void view()}>View private damage photo / عرض أدلة الضرر</button>{url&&<img className="max-h-80 max-w-full object-contain" src={url} alt="Registrar damage evidence / صورة الضرر"/>}</div>;
}
export function DigitalConditionReports({actor,children}:{actor:'ARTIST'|'LOGISTICS'|'TECHNICAL';children?:ReactNode}){
 const queue=useOperationalRows<Report>('sadu_condition_reports');
 const [contracts,setContracts]=useState<{id:string;artist_id:string;artist_name:string}[]>([]),[contract,setContract]=useState(''),[description,setDescription]=useState(''),[photos,setPhotos]=useState<File[]>([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[reviewed,setReviewed]=useState<Record<string,boolean>>({});
 const running=useRef(false);
 useEffect(()=>{let active=true;async function load(){if(!client||actor!=='LOGISTICS')return;const r=await client.rpc('sadu_condition_contracts');if(active)setContracts(r.data??[]);}void load();const sub=client?.auth.onAuthStateChange(()=>{setContracts([]);setContract('');setPhotos([]);setReviewed({});window.setTimeout(()=>{if(active)void load();},0);});return()=>{active=false;sub?.data.subscription.unsubscribe();};},[actor]);
 async function submit(){
  const c=contracts.find(c=>c.id===contract);if(!client||!c||running.current||description.trim().length<3||!photos.length)return;
  running.current=true;setBusy(true);setMessage('');
  try{
   if(photos.length>5||!photos.every(validDamagePhoto))throw new Error('Invalid photos');
   for(const f of photos){const bitmap=await createImageBitmap(f);bitmap.close();}
   const id=crypto.randomUUID(),paths=photos.map(f=>`${c.artist_id}/condition-reports/${id}/${crypto.randomUUID()}.${f.type==='image/png'?'png':'jpg'}`);
   const registration=await client.from('sadu_condition_reports').insert({id,contract_id:c.id,artist_id:c.artist_id,description:description.trim(),photos:paths});if(registration.error)throw registration.error;
   for(let i=0;i<photos.length;i++){const r=await client.storage.from('logistics-secure').upload(paths[i],photos[i],{contentType:photos[i].type,upsert:false});if(r.error)throw r.error;}
   const r=await client.from('sadu_condition_reports').update({status:'DAMAGED_PENDING_ARTIST_APPROVAL'}).eq('id',id).select('id').single();if(r.error)throw r.error;
   setPhotos([]);setDescription('');setMessage('Damage evidence saved. Artist review required.');await queue.refresh();
  }catch{setMessage('Report not dispatched. Check account permissions, photos and database setup. Any incomplete draft remains on hold; retry with the evidence.');}
  finally{running.current=false;setBusy(false);}
 }
 async function decide(row:Report,status:string){if(!client||running.current||!reviewed[row.id])return;running.current=true;setBusy(true);try{const r=await client.from('sadu_condition_reports').update({status}).eq('id',row.id).eq('status','DAMAGED_PENDING_ARTIST_APPROVAL').select('id').single();if(r.error)throw r.error;await queue.refresh();setMessage('Choice recorded. Repair completion and reinspection are still required.');}catch{setMessage('Decision not saved. Refresh and verify ownership.');}finally{running.current=false;setBusy(false);}}
 const pending=actor==='ARTIST'&&queue.rows.some(r=>r.status==='DAMAGED_PENDING_ARTIST_APPROVAL');
 return <><section className={panel}><h2 className="flex gap-2 text-xl"><FileCheck aria-hidden="true"/>Digital Condition Reports / تقارير الحالة الرقمية</h2><p>Authenticated local pilot. Recorded repair instructions are not a certified legal signature or exhibition clearance.</p>{actor==='LOGISTICS'&&<fieldset disabled={busy} className="space-y-3"><label>Accepted agreement<select className={field} value={contract} onChange={e=>setContract(e.target.value)}><option value="">Select artist</option>{contracts.map(c=><option key={c.id} value={c.id}>{c.artist_name} · {c.id}</option>)}</select></label><label>Damage description / وصف الضرر<textarea className={field} maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Varnish removed; loose screws"/></label><label className="block rounded border-2 border-dashed ps-4 pe-4 py-4"><UploadCloud aria-hidden="true"/>Damage Evidence / أدلة الضرر — 1–5 JPEG/PNG files, 10 MB each<input type="file" multiple accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={e=>{const files=Array.from(e.target.files??[]);setPhotos([]);if(files.length>5||!files.every(validDamagePhoto)){setMessage('Select 1–5 valid JPEG/PNG photos up to 10 MB each.');return;}setPhotos(files);setMessage('');}}/></label><button className={button} disabled={!contract||description.trim().length<3||!photos.length} onClick={()=>void submit()}>Upload evidence & request Artist review</button></fieldset>}{pending&&<p role="alert" className="flex gap-2 border border-red-600 bg-red-50 ps-4 pe-4 py-4 text-red-900"><AlertTriangle aria-hidden="true"/>High priority: review the damage evidence and choose repair responsibility. Other portal modules are paused.</p>}<p role="status">{message||queue.notice}</p>{queue.rows.map(row=><article key={row.id} className="space-y-3 rounded border border-red-300 bg-[#FFFDF7] ps-4 pe-4 py-4"><h3>{row.contract_id} · {row.status}</h3><p>{row.description}</p>{row.photos.map(path=><Evidence key={path} path={path}/>)}{actor==='ARTIST'&&row.status==='DAMAGED_PENDING_ARTIST_APPROVAL'&&<><label className="flex gap-2"><input type="checkbox" checked={reviewed[row.id]??false} onChange={e=>setReviewed({...reviewed,[row.id]:e.target.checked})}/>I have reviewed the condition report and photos.</label><div className="flex flex-wrap gap-2"><button className={button} disabled={busy||!reviewed[row.id]} onClick={()=>void decide(row,'REPAIR_AUTHORIZED')}>أفوض إدارة الملتقى بإجراء الترميم / I authorize the Biennial to execute repairs</button><button className={button} disabled={busy||!reviewed[row.id]} onClick={()=>void decide(row,'ARTIST_REPAIR_PLANNED')}>سأقوم بالترميم شخصياً / I will repair the artwork on-site</button></div></>}{row.decision_at&&<p>Decision recorded: {new Date(row.decision_at).toLocaleString()} · Reinspection pending</p>}</article>)}</section>{!pending&&children}</>;
}
