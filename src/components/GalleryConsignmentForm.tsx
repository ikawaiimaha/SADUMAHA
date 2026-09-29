import {FreightCompleteness} from './FreightCompleteness';
import {useRef,useState} from 'react';
import {Building2,FileSpreadsheet} from 'lucide-react';
import {pilotSupabase as client} from '../lib/pilotSupabase';
import {consignmentFields,numericFields,validConsignment,type ConsignmentDetails} from '../data/consignment';
import {operationalPanel as panel,operationalInput as field,operationalButton as button} from './ArtworkMetadataLedger';

export default function GalleryConsignmentForm(){
 // Fragment is not sent in HTTP requests or Referer headers. Keep only in memory.
 const [token]=useState(()=>new URLSearchParams(window.location.hash.slice(1)).get('token')??'');
 const [data,setData]=useState<Partial<ConsignmentDetails>>({currency:'AED'});
 const [busy,setBusy]=useState(false),[done,setDone]=useState(false),[message,setMessage]=useState('');
 const submitting=useRef(false);
 async function submit(){
  if(!client||submitting.current||done||!validConsignment(data))return;
  submitting.current=true;setBusy(true);setMessage('');
  try{
   const payload=Object.fromEntries(Object.entries(data).map(([k,v])=>[k,numericFields.includes(k)?Number(v):String(v).trim()]));
   const result=await client.rpc('sadu_receive_consignment',{t:token,d:payload});
   if(result.error)throw result.error;
   setDone(true);setMessage('CONSIGNMENT_DATA_RECEIVED — Submitted and locked for Logistics / تم الإرسال والقفل');
   window.history.replaceState(null,'',window.location.pathname);
  }catch{setMessage('Submission not confirmed. Check your entries or request a fresh link from the artist. Expired and previously used links cannot be submitted again.');}
  finally{submitting.current=false;setBusy(false);}
 }
 return <main className="mx-auto max-w-3xl ps-4 pe-4 py-8 text-[#111817]"><section className={panel}><h1 className="flex gap-2 text-2xl"><Building2 aria-hidden="true"/>Gallery Consignment / تنسيق الشحن من الجاليري</h1><p>One-time logistics intake. Verify the artwork with the inviting artist. Submit one consolidated consignment with its exact packed dimensions and gross weight. For multiple differently sized crates, contact Logistics before submitting.</p>{!client?<p role="alert">Database connection is not configured.</p>:!/^[a-f0-9]{64}$/.test(token)?<p role="alert">A valid invitation link is required.</p>:<form onSubmit={e=>{e.preventDefault();void submit();}}><fieldset disabled={busy||done} className="grid gap-4 sm:grid-cols-2"><legend>Required freight information / بيانات الشحن الإلزامية</legend>{Object.entries(consignmentFields).map(([k,label])=><label key={k}>{label}<input required className={field} type={numericFields.includes(k)?'number':k==='map_url'?'url':k==='phone'?'tel':'text'} min={numericFields.includes(k)?0.01:undefined} max={numericFields.includes(k)?100000000:undefined} step={numericFields.includes(k)?'any':undefined} maxLength={500} value={data[k]??''} onChange={e=>setData({...data,[k]:e.target.value})}/></label>)}<label>Currency / العملة<select className={field} value={data.currency} onChange={e=>setData({...data,currency:e.target.value})}>{['AED','USD','EUR'].map(c=><option key={c}>{c}</option>)}</select></label><button className={button} disabled={!validConsignment(data)||busy||done}><FileSpreadsheet aria-hidden="true" size={18}/>Submit & lock consignment / إرسال وقفل البيانات</button></fieldset></form>}<FreightCompleteness data={data} draft={!done}/><p role="status">{message}</p><p className="text-sm">Local pilot. Submission records shipping information; it does not book a courier or approve insurance coverage.</p></section></main>;
}
