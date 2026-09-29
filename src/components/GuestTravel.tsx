import {useEffect,useRef,useState} from 'react';
import {Plane,FileCheck,RefreshCw,ShieldAlert} from 'lucide-react';
import {pilotSupabase as client} from '../lib/pilotSupabase';
import {validatePassport,validatePersonalPhoto} from '../data/prFileValidation';
import {validTravelDates,latestGuestRows,guestFilesComplete,type GuestTravelRow} from '../data/guestTravel';
const field='block w-full rounded border bg-[#FFFDF7] ps-3 pe-3 py-2';
const button='rounded border ps-3 pe-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed';
type Contract={id:string;artist_name:string};
/** The authenticated owner/PR policies apply independently of the rehearsal role selector. */
export function GuestTravel({review=false}:{review?:boolean}){
 const [contracts,setContracts]=useState<Contract[]>([]),[rows,setRows]=useState<GuestTravelRow[]>([]);
 const [contract,setContract]=useState(''),[arrival,setArrival]=useState(''),[departure,setDeparture]=useState(''),[airport,setAirport]=useState('SHJ');
 const [companion,setCompanion]=useState(''),[ack,setAck]=useState(false),[files,setFiles]=useState<Record<string,File>>({});
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[locked,setLocked]=useState(false),[sort,setSort]=useState('arrival'),[search,setSearch]=useState('');
 const [refreshed,setRefreshed]=useState(''),[formKey,setFormKey]=useState(0);
 const readSequence=useRef(0);
 const epoch=useRef(0),running=useRef(false),pending=useRef<{id:string;owner:string;uploaded:Set<string>}|null>(null);
 async function load(expected=epoch.current){
  const sequence=++readSequence.current;
  if(!client){setMessage('Authenticated guest intake is not configured.');return;}
  try{
   const {data:{user}}=await client.auth.getUser();if(expected!==epoch.current)return;
   if(!user){setMessage('Sign in at /pilot. No passport has been uploaded.');setRows([]);setContracts([]);return;}
   const [c,r]=await Promise.all([review?client.rpc('sadu_pr_guest_roster'):client.from('bilateral_contracts').select('id,artist_name').eq('artist_id',user.id).in('status',['ARTIST_APPROVED','LOCKED']),client.from('sadu_guest_queue').select('*').order('created_at',{ascending:false})]);
   if(expected!==epoch.current||sequence!==readSequence.current)return;
   if(c.error||r.error)throw new Error('Guest queue unavailable. Apply the reviewed local guest-travel schema before using this module.');
   setContracts(c.data??[]);setRows(latestGuestRows(r.data??[]));setRefreshed(new Date().toLocaleTimeString());
  }catch(e){if(expected===epoch.current&&sequence===readSequence.current){setRows([]);setContracts([]);setMessage(e instanceof Error?e.message:'Queue unavailable. Retry.');}}
 }
 useEffect(()=>{
  void load();const timer=setInterval(()=>{if(!running.current)void load();},15000);
  const sub=client?.auth.onAuthStateChange(event=>{if(event==='SIGNED_IN'||event==='SIGNED_OUT'){
   epoch.current++;pending.current=null;setRows([]);setContracts([]);setFiles({});setContract('');setArrival('');setDeparture('');setCompanion('');setAck(false);setLocked(false);setFormKey(k=>k+1);setMessage('');setRefreshed('');
   // Avoid awaiting another auth call inside Supabase's auth event callback.
   setTimeout(()=>void load(),0);
  }});
  return()=>{epoch.current++;clearInterval(timer);sub?.data.subscription.unsubscribe();};
 },[review]);
 async function submit(){
  if(!client||running.current||!contract||!validTravelDates(arrival,departure)||!files.passport||!files.photo||(companion.trim()&&(!ack||!files.companion)))return;
  const expected=epoch.current;running.current=true;setBusy(true);setMessage('Validating and uploading…');
  try{
   await Promise.all([validatePassport(files.passport),validatePersonalPhoto(files.photo),...(companion.trim()?[validatePassport(files.companion)]:[])]);
   const {data:{user}}=await client.auth.getUser();if(!user||expected!==epoch.current)return;
   if(!pending.current){
    const id=crypto.randomUUID();const result=await client.from('sadu_guest_intakes').insert({id,contract_id:contract,artist_id:user.id,arrival,departure,airport,companion_name:companion.trim()||null,companion_ack:ack,photo_extension:files.photo.type==='image/png'?'png':'jpg'});
    if(result.error)throw new Error('Registration failed. An owned accepted database agreement is required.');
    if(expected!==epoch.current)return;pending.current={id,owner:user.id,uploaded:new Set()};setLocked(true);
   }
   const record=pending.current;if(record.owner!==user.id)return;
   const uploads:[string,File][]=[['passport.pdf',files.passport],[`photo.${files.photo.type==='image/png'?'png':'jpg'}`,files.photo],...(companion.trim()?[['companion.pdf',files.companion] as [string,File]]:[])];
   for(const [name,file] of uploads){
    if(expected!==epoch.current)return;if(record.uploaded.has(name))continue;
    const path=`${user.id}/guest-intake/${record.id}/${name}`;
    // A lost response may follow a successful upload. Verify an existing object before retrying; never overwrite.
    const existing=await client.storage.from('logistics-secure').list(`${user.id}/guest-intake/${record.id}`,{search:name});
    if(!existing.data?.some(o=>o.name===name&&Number(o.metadata?.size)===file.size)){
     const result=await client.storage.from('logistics-secure').upload(path,file,{contentType:file.type,upsert:false});if(result.error)throw new Error('Upload interrupted. Retry uploads below; existing files are preserved.');
    }
    record.uploaded.add(name);
   }
   if(expected!==epoch.current)return;
   setMessage('Files uploaded — awaiting PR inspection. No booking or visa approval is implied.');pending.current=null;setFiles({});setFormKey(k=>k+1);setLocked(false);setContract('');setCompanion('');setAck(false);await load(expected);
  }catch(e){if(expected===epoch.current)setMessage(e instanceof Error?e.message:'Upload failed. Retry.');}
  finally{running.current=false;setBusy(false);}
 }
 async function download(row:GuestTravelRow,name:string){
  const expected=epoch.current,popup=window.open('about:blank','_blank');if(popup)popup.opener=null;
  try{const result=await client?.storage.from('logistics-secure').createSignedUrl(`${row.artist_id}/guest-intake/${row.id}/${name}`,60);
   if(expected===epoch.current&&result?.data?.signedUrl&&popup)popup.location.href=result.data.signedUrl;
   else{popup?.close();if(expected===epoch.current)setMessage('Private document unavailable or pop-up blocked.');}
  }catch{popup?.close();if(expected===epoch.current)setMessage('Private document unavailable.');}
 }
 const visible=rows.filter(r=>`${r.artist_name} ${r.airport} ${r.companion_name??''}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>sort==='name'?a.artist_name.localeCompare(b.artist_name):sort==='missing'?Number(guestFilesComplete(a))-Number(guestFilesComplete(b)):a.arrival.localeCompare(b.arrival));
 return <section className="min-w-0 space-y-4 rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-4 pe-4 py-4 text-start">
  <h2 className="flex gap-2 text-xl"><Plane aria-hidden="true"/>{review?'PR Control Room / لوحة الضيوف':'Guest Self-Service / بيانات سفر الضيف'}</h2>
  <p>Authenticated intake for accepted database agreements. Stage 5/VIP login provisioning and automatic invitation email are not configured. / التسجيل للحسابات المرتبطة باتفاقيات معتمدة.</p>
  <p>Pending approved entitlement / بانتظار اعتماد مخصصات الاستضافة</p>
  {!review&&<form key={formKey} onSubmit={e=>{e.preventDefault();void submit();}} className="space-y-3"><fieldset disabled={busy||locked} className="space-y-3">
   <label className="block">Agreement / الاتفاقية<select required className={field} value={contract} onChange={e=>setContract(e.target.value)}><option value="">Select owned agreement</option>{contracts.map(c=><option key={c.id} value={c.id}>{c.artist_name} · {c.id}</option>)}</select></label>
   <div className="grid gap-3 sm:grid-cols-2"><label>Arrival / الوصول<input required type="date" className={field} value={arrival} onChange={e=>setArrival(e.target.value)}/></label><label>Departure / المغادرة<input required type="date" min={arrival||undefined} className={field} value={departure} onChange={e=>setDeparture(e.target.value)}/></label></div>
   <label className="block">Airport preference / المطار المفضل<select className={field} value={airport} onChange={e=>setAirport(e.target.value)}><option value="SHJ">SHJ · Sharjah</option><option value="DXB">DXB · Dubai</option><option value="OTHER">Other — PR review required</option></select></label>
   <p className="flex gap-2 rounded border border-red-200 bg-red-50 ps-3 pe-3 py-3 text-red-900"><ShieldAlert aria-hidden="true" className="shrink-0"/>Upload a clear, flat passport PDF and a high-resolution JPEG/PNG portrait. Blurry phone snapshots will be returned by PR. File format cannot certify clarity or capture source. / ارفع نسخة جواز واضحة بصيغة PDF وصورة شخصية عالية الدقة؛ الوضوح يخضع لمراجعة التشريفات.</p>
   <label className="block">Companion name (optional, self-funded) / اسم المرافق<input maxLength={200} className={field} value={companion} onChange={e=>{setCompanion(e.target.value);setAck(false);}}/></label>
   {companion.trim()&&<label className="flex gap-2"><input type="checkbox" required checked={ack} onChange={e=>setAck(e.target.checked)}/>I accept all companion expenses. No booking is guaranteed. / أتحمل نفقات المرافق.</label>}
   {(['passport','photo',...(companion.trim()?['companion']:[])]).map(kind=><label key={kind} className="block rounded border-2 border-dashed ps-3 pe-3 py-3">{kind==='photo'?'Personal photo / الصورة الشخصية — JPEG/PNG, 1200 × 1200 minimum':kind==='passport'?'Passport / الجواز — PDF':'Companion passport / جواز المرافق — PDF'}<input required className="block max-w-full" type="file" accept={kind==='photo'?'.jpg,.jpeg,.png':'.pdf'} onChange={e=>{const file=e.target.files?.[0];setFiles(p=>{const n={...p};delete n[kind];if(file)n[kind]=file;return n;});}}/></label>)}
  </fieldset><button className={button} disabled={busy||!client||!contract||!validTravelDates(arrival,departure)||!files.passport||!files.photo||Boolean(companion.trim()&&(!ack||!files.companion))}>{busy?'Uploading…':locked?'Retry uploads':'Submit to PR / إرسال للتشريفات'}</button>{locked&&<p>Submitted data is locked. Retry the remaining uploads using the selected files.</p>}</form>}
  <p role="status" aria-live="polite">{message}</p><div className="flex flex-wrap gap-3"><button className={button} disabled={busy} onClick={()=>void load()}><RefreshCw aria-hidden="true" className="inline size-4"/>Refresh</button><span>Updates every 15 seconds · Last refreshed: {refreshed||'Not loaded'}</span></div>
  <label className="block">Search guests / بحث<input className={field} value={search} onChange={e=>setSearch(e.target.value)}/></label><label className="block">Sort / ترتيب<select className={field} value={sort} onChange={e=>setSort(e.target.value)}><option value="arrival">Arrival date</option><option value="name">Guest name</option><option value="missing">Missing files first</option></select></label>
  {!rows.length&&<p>No guest submissions visible to this account. Empty records are not clearance.</p>}
  <div className="grid gap-3 lg:grid-cols-2">{contracts.filter(c=>!rows.some(r=>r.contract_id===c.id)&&c.artist_name.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>a.artist_name.localeCompare(b.artist_name)).map(c=><article key={c.id} className="rounded border bg-[#FFFDF7] ps-3 pe-3 py-3"><h3>{c.artist_name}</h3><p className="text-amber-900">Awaiting guest submission / بانتظار بيانات الضيف</p><p>No uploaded passport or travel preferences recorded.</p></article>)}{visible.map(row=><article key={row.id} className="min-w-0 space-y-2 break-words rounded border bg-[#FFFDF7] ps-3 pe-3 py-3"><h3 className="font-semibold">{row.artist_name}</h3><p>{row.arrival} → {row.departure} · {row.airport}</p><p>{row.companion_name?`Companion: ${row.companion_name} · Self-funding acknowledged`:'No companion requested'}</p><p className={row.passport_uploaded?'text-green-800':'text-amber-900'}><FileCheck aria-hidden="true" className="inline size-4"/>{row.passport_uploaded?'Passport uploaded — PR inspection pending':'Passport missing / upload incomplete'}</p><p>{guestFilesComplete(row)?'All declared files present — not PR clearance':'Incomplete document packet'}</p><p>Agreement at submission: {row.contract_status}</p>{[['passport.pdf',row.passport_uploaded,'Passport PDF'],[`photo.${row.photo_extension}`,row.photo_uploaded,'Personal photo'],['companion.pdf',row.companion_uploaded,'Companion PDF']].map(([name,ready,label])=>ready&&<button type="button" className={`${button} me-2`} key={String(name)} onClick={()=>void download(row,String(name))}>{String(label)}</button>)}<p className="text-xs">Latest immutable submission: {new Date(row.created_at).toLocaleString()}. A replacement requires a new submission and fresh PR review.</p></article>)}</div>
 </section>;
}
