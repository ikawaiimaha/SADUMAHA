import {useEffect, useRef, useState} from 'react';
import {Plane, FileCheck, RefreshCw} from 'lucide-react';
import {pilotSupabase as client} from '../lib/pilotSupabase';

type Request = {id:string; contract_id:string; companion_name:string; object_name:string; file_name:string; created_at:string};
const panel = 'rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-4 pe-4 py-4 text-start space-y-3';
const input = 'block w-full rounded border bg-[#FFFDF7] ps-3 pe-3 py-2';
/** Database authentication determines access; the rehearsal role selector grants no privileges. */
export function HospitalityTravel({review=false}:{review?:boolean}) {
 const [contracts,setContracts]=useState<{id:string;proposed_work_title:string}[]>([]);
 const [contract,setContract]=useState(''),[name,setName]=useState(''),[agreed,setAgreed]=useState(false);
 const [file,setFile]=useState<File|null>(null),[requests,setRequests]=useState<Request[]>([]);
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const running=useRef(false),generation=useRef(0);
 async function reload() {
  const epoch=++generation.current;
  setRequests([]);setContracts([]);setContract('');setFile(null);setName('');setAgreed(false);
  if(!client){setMessage('Authenticated storage is not configured. No passport has been uploaded.');return;}
  const {data:{user}}=await client.auth.getUser();
  if(epoch!==generation.current)return;
  if(!user){setMessage('Sign in at /pilot with your Artist or PR account.');return;}
  if(!review){
   const result=await client.from('bilateral_contracts').select('id,proposed_work_title').eq('artist_id',user.id).in('status',['ARTIST_APPROVED','LOCKED']);
   if(epoch!==generation.current)return;
   setContracts(result.data??[]);
  }
  const result=await client.from('sadu_companion_requests').select('id,contract_id,companion_name,object_name,file_name,created_at').order('created_at',{ascending:false});
  if(epoch!==generation.current)return;
  if(result.error){setMessage('Companion queue unavailable. The reviewed local hospitality schema must be applied first.');return;}
  const confirmed:Request[]=[];
  for(const row of result.data??[]){
   const folder=row.object_name.slice(0,row.object_name.lastIndexOf('/'));
   const objects=await client.storage.from('logistics-secure').list(folder,{search:row.file_name});
   if(objects.data?.some(o=>o.name===row.file_name&&Number(o.metadata?.size)>0))confirmed.push(row);
  }
  if(epoch===generation.current){setRequests(confirmed);setMessage(confirmed.length?'Uploaded requests — PR review pending.':'No successfully uploaded companion requests.');}
 }
 useEffect(()=>{
  void reload();
  const sub=client?.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'||event==='SIGNED_IN')void reload();});
  return()=>{generation.current++;sub?.data.subscription.unsubscribe();};
 },[review]);
 async function submit() {
  if(!client||running.current||!contract||!name.trim()||!agreed||!file)return;
  running.current=true;setBusy(true);const epoch=generation.current;
  try{
   if(!/\.pdf$/i.test(file.name)||file.size<=0||file.size>10*1024*1024||(await file.slice(0,5).text())!=='%PDF-')throw new Error('Choose a valid PDF scan, up to 10 MB.');
   const {data:{user}}=await client.auth.getUser();
   if(!user||epoch!==generation.current)return;
   const id=crypto.randomUUID(),file_name=file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-180);
   const object_name=`${user.id}/companion-intake/${id}/${file_name}`;
   const registration=await client.from('sadu_companion_requests').insert({id,artist_id:user.id,contract_id:contract,companion_name:name.trim(),self_funded_ack:true,file_name,object_name});
   if(registration.error)throw new Error('Unable to register request. Confirm the local schema and accepted agreement.');
   if(epoch!==generation.current)return;
   const upload=await client.storage.from('logistics-secure').upload(object_name,file,{contentType:'application/pdf',upsert:false});
   if(upload.error)throw new Error('PDF upload failed. Retry your request; incomplete uploads are excluded from PR’s queue.');
   if(epoch!==generation.current)return;
   await reload();
  }catch(error){if(epoch===generation.current)setMessage(error instanceof Error?error.message:'Request failed. Retry.');}
  finally{running.current=false;setBusy(false);}
 }
 async function openDocument(row:Request) {
  const popup=window.open('about:blank','_blank');
  if(popup)popup.opener=null;
  const result=await client?.storage.from('logistics-secure').createSignedUrl(row.object_name,60);
  if(result?.data?.signedUrl&&popup)popup.location.href=result.data.signedUrl;
  else {popup?.close();setMessage('Document access unavailable or pop-up blocked. Sign in with an authorized account and allow this document window.');}
 }
 return <section className={panel}>
  <h2 className="flex gap-2 text-xl"><Plane aria-hidden="true"/>تفاصيل الاستضافة والسفر / Hospitality & Travel</h2>
  <p className="rounded border border-amber-300 ps-3 pe-3 py-3">Pending approved entitlement / بانتظار اعتماد مخصصات الاستضافة</p>
  <p>No flight or hotel allowance has been approved in this record. / لم تُعتمد مخصصات الطيران أو الإقامة في هذا السجل.</p>
  {!review&&<fieldset disabled={busy} className="space-y-3">
   <legend className="font-semibold">Request Companion Visa (Self-Funded) / طلب تأشيرة مرافق (على النفقة الخاصة)</legend>
   <label className="block">Accepted database agreement<select className={input} value={contract} onChange={e=>setContract(e.target.value)}><option value="">Select agreement</option>{contracts.map(c=><option key={c.id} value={c.id}>{c.proposed_work_title}</option>)}</select></label>
   <label className="block">Companion’s full name<input className={input} maxLength={200} value={name} onChange={e=>setName(e.target.value)}/></label>
   <label className="block rounded border-2 border-dashed ps-4 pe-4 py-4">Companion passport — PDF scan, maximum 10 MB<input key={generation.current} className="block max-w-full" type="file" accept=".pdf,application/pdf" onChange={e=>setFile(e.target.files?.[0]??null)}/></label>
   <label className="flex gap-2"><input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)}/>I accept financial responsibility for all companion expenses. This request does not approve travel or guarantee a visa.</label>
   <button type="button" className="rounded bg-[#8B261E] text-white ps-4 pe-4 py-2 disabled:opacity-50" disabled={!client||!contract||!name.trim()||!agreed||!file||busy} onClick={()=>void submit()}>{busy?'Uploading…':'Upload & route to PR / إرسال إلى التشريفات'}</button>
  </fieldset>}
  <button type="button" className="flex gap-2 underline" disabled={busy} onClick={()=>void reload()}><RefreshCw aria-hidden="true" size={16}/>Refresh authenticated queue</button>
  <p role="status">{message}</p>
  <ul className="space-y-3">{requests.map(row=><li key={row.id} className="rounded border bg-[#FFFDF7] ps-3 pe-3 py-3"><p>{row.companion_name} · Agreement <bdi>{row.contract_id}</bdi></p><p className="flex gap-2 text-green-800"><FileCheck aria-hidden="true"/>Self-funding acknowledged by artist · Pending PR review</p><time>{new Date(row.created_at).toLocaleString()}</time><button type="button" className="block underline" onClick={()=>void openDocument(row)}>View private PDF · {row.file_name}</button></li>)}</ul>
 </section>;
}
