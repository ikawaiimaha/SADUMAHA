import {useEffect,useRef,useState} from 'react';
import {CalendarDays,Plane} from 'lucide-react';
import {pilotSupabase as client} from '../lib/pilotSupabase';
type WindowRow={contract_id:string;artist_name:string;arrival:string;departure:string;arrival_airport:string;departure_airport:string;approved_at:string};
const box='space-y-3 rounded border bg-[#F7F1E6] ps-4 pe-4 py-4 text-start';
export function OperationalGuestCalendar(){
 const [rows,setRows]=useState<WindowRow[]>([]),[message,setMessage]=useState('Sign in with an authorized institutional account / يلزم حساب مخول');
 useEffect(()=>{
  if(!client)return;let active=true,sequence=0;
  async function refresh(){const request=++sequence;try{const result=await client!.rpc('sadu_operational_guest_calendar');if(!active||request!==sequence)return;setRows(result.error?[]:(result.data??[]));setMessage(result.error?'Calendar unavailable — schema or account access requires verification. / التقويم غير متاح':'Approved itineraries only · refreshes every 15 seconds / المواعيد المعتمدة فقط');}catch{if(active&&request===sequence){setRows([]);setMessage('Calendar unavailable / التقويم غير متاح');}}}
  void refresh();const timer=setInterval(()=>void refresh(),15000);
  const {data}=client.auth.onAuthStateChange(()=>{sequence++;setRows([]);setMessage('Checking account access…');setTimeout(()=>{if(active)void refresh();},0);});
  return()=>{active=false;sequence++;clearInterval(timer);data.subscription.unsubscribe();};
 },[]);
 return <section className={box}><h2 className="flex gap-2 text-xl"><CalendarDays aria-hidden="true"/>Unified Operational Calendar / التقويم التشغيلي الموحد</h2><p role="status">{message}</p><p>PR-reviewed arrival/departure windows for installation planning; rehearsal appointments must still be agreed with the artist. / مواعيد السفر المعتمدة لتخطيط التركيب.</p><div className="grid gap-3 sm:grid-cols-2">{[...rows].sort((a,b)=>a.arrival.localeCompare(b.arrival)).map(r=><article key={r.contract_id} className="rounded border bg-[#FFFDF7] ps-3 pe-3 py-3"><h3>{r.artist_name}</h3><p><Plane className="inline size-4" aria-hidden="true"/> <bdi dir="ltr">{r.arrival} ({r.arrival_airport}) → {r.departure} ({r.departure_airport})</bdi></p><p>PR approved / اعتماد التشريفات: {new Date(r.approved_at).toLocaleString()}</p></article>)}</div>{!rows.length&&<p>No current approved itinerary visible. Preferences and superseded packets are excluded. / لا توجد مواعيد معتمدة متاحة.</p>}</section>;
}

export function GuestItineraryApproval({intakeId}:{intakeId:string}){
 const [reference,setReference]=useState(''),[checked,setChecked]=useState(false),[at,setAt]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const running=useRef(false),epoch=useRef(0);
 useEffect(()=>{let active=true;const version=++epoch.current;setAt('');setReference('');setChecked(false);
  void client?.from('sadu_guest_itinerary_approvals').select('approved_at').eq('intake_id',intakeId).maybeSingle().then(r=>{if(active&&version===epoch.current)setAt(r.data?.approved_at??'');},()=>{if(active&&version===epoch.current)setMessage('Approval history unavailable — refresh before recording.');});
  const listener=client?.auth.onAuthStateChange(()=>{epoch.current++;setBusy(false);setAt('');setReference('');setChecked(false);setMessage('Account changed — refresh guest records.');});
  return()=>{active=false;epoch.current++;listener?.data.subscription.unsubscribe();};
 },[intakeId]);
 async function approve(){if(!client||running.current||at||!checked||!reference.trim())return;running.current=true;setBusy(true);const version=epoch.current;
  try{const r=await client.from('sadu_guest_itinerary_approvals').insert({intake_id:intakeId,ticket_reference:reference.trim()}).select('approved_at').single();if(version!==epoch.current)return;if(r.error)setMessage('Approval blocked. Refresh: this packet may be superseded, already approved, or your account is not PR.');else{setAt(r.data.approved_at);setMessage('Approved window available to Technical within 15 seconds.');}}
  catch{if(version===epoch.current)setMessage('Could not confirm approval. Refresh before retrying.');}finally{running.current=false;if(version===epoch.current)setBusy(false);}
 }
 return <section className="space-y-2 border-s-4 border-green-800 ps-3 pe-3 py-2"><h4>Itinerary approval / اعتماد مواعيد السفر</h4>{at?<p>PR approval recorded: {new Date(at).toLocaleString()}. Only the current packet appears in the operational calendar.</p>:<><label className="block">Reviewed ticket reference / مرجع التذكرة<input maxLength={200} value={reference} disabled={busy} onChange={e=>setReference(e.target.value)} className="block w-full rounded border ps-3 pe-3 py-2"/></label><label className="flex gap-2"><input type="checkbox" checked={checked} disabled={busy} onChange={e=>setChecked(e.target.checked)}/>I checked the ticket against these dates and airports / تحققت من التذكرة والمواعيد والمطارات</label><button type="button" disabled={busy||!checked||!reference.trim()} onClick={()=>void approve()} className="rounded bg-green-800 ps-3 pe-3 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed">Record itinerary approval / تسجيل الاعتماد</button></>}<p>This records PR review; it does not book flights or clear visas.</p><p role="status">{message}</p></section>;
}
