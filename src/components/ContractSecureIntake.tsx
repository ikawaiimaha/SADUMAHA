import {useEffect,useRef,useState} from 'react';
import {UploadCloud,ShieldCheck} from 'lucide-react';
import {pilotSupabase as client} from '../lib/pilotSupabase';
import {mediaContentType} from '../data/exhibitionScenario';
import {createMediaTransfer,MEDIA_LIMIT} from '../lib/resumableMedia';

type Kind='PASSPORT'|'ARTWORK_IMAGE';
type Entry={id:string;kind:Kind;object_name:string;file_name:string};
const box='rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-4 pe-4 py-4 text-start space-y-3';
/** Real account/contract ownership is separate from the session role-switching rehearsal. */
export function ContractSecureIntake(){
 const [contracts,setContracts]=useState<{id:string;proposed_work_title:string}[]>([]);
 const [contract,setContract]=useState(''),[entries,setEntries]=useState<Entry[]>([]),[message,setMessage]=useState('Sign in at /pilot with your Artist account to upload.');
 const [busy,setBusy]=useState(false),[percent,setPercent]=useState(0);
 const pending=useRef(false),epoch=useRef(0),transfer=useRef<ReturnType<typeof createMediaTransfer>|null>(null);
 useEffect(()=>{
  let live=true;
  const reload=async()=>{const version=++epoch.current;transfer.current?.cancel();setContracts([]);setContract('');setEntries([]);if(!client)return;
   const user=await client.auth.getUser();if(!live||version!==epoch.current||!user.data.user)return;
   const result=await client.from('bilateral_contracts').select('id,proposed_work_title').eq('artist_id',user.data.user.id).in('status',['ARTIST_APPROVED','LOCKED']);
   if(!live||version!==epoch.current)return;setContracts(result.data??[]);setMessage(result.error?'Unable to load owned agreements.':result.data?.length?'Select your accepted database agreement.':'No accepted database agreement is mapped to this account. Rehearsal acceptance does not create one.');
  };
  void reload();const sub=client?.auth.onAuthStateChange(()=>{void reload();});
  return()=>{live=false;epoch.current++;transfer.current?.cancel();sub?.data.subscription.unsubscribe();};
 },[]);
 async function load(id:string){
  const version=++epoch.current;setContract(id);setEntries([]);if(!client||!id)return;
  const result=await client.from('sadu_contract_intake').select('id,kind,object_name,file_name').eq('contract_id',id);
  if(result.error){if(version===epoch.current)setMessage('Upload registry unavailable. Apply the reviewed local contract-intake schema.');return;}
  const confirmed:Entry[]=[];
  for(const row of result.data??[]){const folder=row.object_name.slice(0,row.object_name.lastIndexOf('/'));const files=await client.storage.from('logistics-secure').list(folder,{search:row.file_name});if(files.data?.some(f=>f.name===row.file_name&&Number(f.metadata?.size)>0))confirmed.push(row as Entry);}
  if(version===epoch.current){setEntries(confirmed);setMessage('Passport PDF and high-resolution artwork are required. Uploads do not grant PR clearance.');return true;}
 }
 async function upload(kind:Kind,file:File){
  if(!client||!contract||pending.current)return;
  const allowed=kind==='PASSPORT'?/\.pdf$/i:/\.(png|tif|tiff)$/i;
  const limit=kind==='PASSPORT'?10*1024*1024:MEDIA_LIMIT;
  if(!allowed.test(file.name)||file.size<=0||file.size>limit){setMessage(kind==='PASSPORT'?'Choose a nonempty PDF up to 10 MB.':'Choose a TIFF/PNG up to 2 GiB.');return;}
  pending.current=true;setBusy(true);setPercent(0);const version=epoch.current;
  try{
   const user=await client.auth.getUser();if(!user.data.user)throw new Error('Sign in again.');
   if(version!==epoch.current)return;
   const type=kind==='PASSPORT'?(await file.slice(0,5).text())==='%PDF-'?'application/pdf':null:await mediaContentType(file,'PRINT');
   if(!type)throw new Error('File signature does not match the required format.');
   if(version!==epoch.current)return;
   const id=crypto.randomUUID(),file_name=file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-180);
   const object_name=`${user.data.user.id}/contract-intake/${id}/${file_name}`;
   const registration=await client.from('sadu_contract_intake').insert({id,contract_id:contract,artist_id:user.data.user.id,kind,file_name,object_name});if(registration.error)throw registration.error;
   if(version!==epoch.current)return;
   const task=createMediaTransfer(file,object_name,type,user.data.user.id,p=>{if(version===epoch.current)setPercent(p);});transfer.current=task;
   await task.start();if(version!==epoch.current)return;
   if(await load(contract))setMessage('Successfully uploaded to private Supabase storage. Department verification remains pending.');
  }catch{if(version===epoch.current)setMessage('Upload failed. Select the file again to retry; incomplete records do not count as uploaded.');}
  finally{pending.current=false;setBusy(false);transfer.current=null;}
 }
 return <section className={box}>
  <h2 className="flex gap-2 text-xl"><ShieldCheck aria-hidden="true"/>Mandatory Secure Documents · المستندات الإلزامية</h2>
  <p>Authenticated uploads to logistics-secure. Passport and artwork have separate departmental access. This does not send an email or certify a legal signature.</p>
  <label className="block">Accepted database agreement<select disabled={busy} className="block w-full rounded border ps-3 pe-3 py-2" value={contract} onChange={e=>void load(e.target.value)}><option value="">Select agreement</option>{contracts.map(c=><option key={c.id} value={c.id}>{c.proposed_work_title} · {c.id}</option>)}</select></label>
  {(['PASSPORT','ARTWORK_IMAGE'] as const).map(kind=><label key={kind} className="block rounded border-2 border-dashed ps-4 pe-4 py-4"><UploadCloud aria-hidden="true"/>{kind==='PASSPORT'?'Passport PDF (required, up to 10 MB)':'High-Res Artwork TIFF/PNG (required, up to 2 GiB)'}<input className="block max-w-full" type="file" disabled={!contract||busy} accept={kind==='PASSPORT'?'.pdf':'.png,.tif,.tiff'} onChange={e=>{const f=e.target.files?.[0];if(f)void upload(kind,f);e.target.value='';}}/><span>{entries.some(e=>e.kind===kind)?'Uploaded — verification pending':'Required — awaiting upload'}</span></label>)}
  {busy&&<div role="status"><progress className="w-full" max={100} value={percent}/>{Math.round(percent)}%</div>}
  <p role="status">{message}</p>
  <ul>{entries.map(e=><li key={e.id}>{e.kind}: <bdi>{e.file_name}</bdi></li>)}</ul>
 </section>;
}
