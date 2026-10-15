import {useEffect,useRef,useState} from 'react';
import {CalendarDays,Plane} from 'lucide-react';
import {pilotSupabase as client} from '../lib/pilotSupabase';
import {useUiText} from '../context/I18nContext';
type WindowRow={contract_id:string;artist_name:string;arrival:string;departure:string;arrival_airport:string;departure_airport:string;approved_at:string};
const box='space-y-3 rounded border bg-[#F7F1E6] ps-4 pe-4 py-4 text-start';
export function OperationalGuestCalendar(){
 const ui=useUiText(),{pair}=ui,text=useRef(ui);text.current=ui;
 const [rows,setRows]=useState<WindowRow[]>([]),[message,setMessage]=useState(()=>pair('Sign in with an authorized institutional account','يلزم حساب مخول'));
 useEffect(()=>{
  if(!client)return;let active=true,sequence=0;
  async function refresh(){const request=++sequence;try{const result=await client!.rpc('sadu_operational_guest_calendar');if(!active||request!==sequence)return;setRows(result.error?[]:(result.data??[]));setMessage(result.error?text.current.pair('Calendar unavailable — schema or account access requires verification.','التقويم غير متاح'):text.current.pair('Approved itineraries only · refreshes every 15 seconds','المواعيد المعتمدة فقط'));}catch{if(active&&request===sequence){setRows([]);setMessage(text.current.pair('Calendar unavailable','التقويم غير متاح'));}}}
  void refresh();const timer=setInterval(()=>void refresh(),15000);
  const {data}=client.auth.onAuthStateChange(()=>{sequence++;setRows([]);setMessage(text.current.t('Checking account access…','جارٍ التحقق من صلاحية الحساب…'));setTimeout(()=>{if(active)void refresh();},0);});
  return()=>{active=false;sequence++;clearInterval(timer);data.subscription.unsubscribe();};
 },[ui.lang]);// re-run on language change so the status line follows the toggle
 return <section className={box}><h2 className="flex gap-2 text-xl"><CalendarDays aria-hidden="true"/>{pair('Unified Operational Calendar','التقويم التشغيلي الموحد')}</h2><p role="status">{message}</p><p>{pair('PR-reviewed arrival/departure windows for installation planning; rehearsal appointments must still be agreed with the artist.','مواعيد السفر المعتمدة لتخطيط التركيب.')}</p><div className="grid gap-3 sm:grid-cols-2">{[...rows].sort((a,b)=>a.arrival.localeCompare(b.arrival)).map(r=><article key={r.contract_id} className="rounded border bg-[#FFFDF7] ps-3 pe-3 py-3"><h3>{r.artist_name}</h3><p><Plane className="inline size-4" aria-hidden="true"/> <bdi dir="ltr">{r.arrival} ({r.arrival_airport}) → {r.departure} ({r.departure_airport})</bdi></p><p>{pair('PR approved','اعتماد التشريفات')}: {new Date(r.approved_at).toLocaleString()}</p></article>)}</div>{!rows.length&&<p>{pair('No current approved itinerary visible. Preferences and superseded packets are excluded.','لا توجد مواعيد معتمدة متاحة.')}</p>}</section>;
}

export function GuestItineraryApproval({intakeId}:{intakeId:string}){
 const ui=useUiText(),{t,pair}=ui,text=useRef(ui);text.current=ui;
 const [reference,setReference]=useState(''),[checked,setChecked]=useState(false),[at,setAt]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const running=useRef(false),epoch=useRef(0);
 useEffect(()=>{let active=true;const version=++epoch.current;setAt('');setReference('');setChecked(false);
  void client?.from('sadu_guest_itinerary_approvals').select('approved_at').eq('intake_id',intakeId).maybeSingle().then(r=>{if(active&&version===epoch.current)setAt(r.data?.approved_at??'');},()=>{if(active&&version===epoch.current)setMessage(text.current.t('Approval history unavailable — refresh before recording.','سجل الاعتماد غير متاح — حدّث الصفحة قبل التسجيل.'));});
  const listener=client?.auth.onAuthStateChange(()=>{epoch.current++;setBusy(false);setAt('');setReference('');setChecked(false);setMessage(text.current.t('Account changed — refresh guest records.','تغيّر الحساب — حدّث سجلات الضيوف.'));});
  return()=>{active=false;epoch.current++;listener?.data.subscription.unsubscribe();};
 },[intakeId]);
 async function approve(){if(!client||running.current||at||!checked||!reference.trim())return;running.current=true;setBusy(true);const version=epoch.current;
  try{const r=await client.from('sadu_guest_itinerary_approvals').insert({intake_id:intakeId,ticket_reference:reference.trim()}).select('approved_at').single();if(version!==epoch.current)return;if(r.error)setMessage(t('Approval blocked. Refresh: this packet may be superseded, already approved, or your account is not PR.','تم حظر الاعتماد. حدّث الصفحة: قد تكون هذه الحزمة مستبدلة أو معتمدة مسبقًا، أو أن حسابك لا يتبع التشريفات.'));else{setAt(r.data.approved_at);setMessage(t('Approved window available to Technical within 15 seconds.','ستتاح المواعيد المعتمدة للفريق الفني خلال 15 ثانية.'));}}
  catch{if(version===epoch.current)setMessage(t('Could not confirm approval. Refresh before retrying.','تعذّر تأكيد الاعتماد. حدّث الصفحة قبل إعادة المحاولة.'));}finally{running.current=false;if(version===epoch.current)setBusy(false);}
 }
 return <section className="space-y-2 border-s-4 border-green-800 ps-3 pe-3 py-2"><h4>{pair('Itinerary approval','اعتماد مواعيد السفر')}</h4>{at?<p>{t('PR approval recorded: ','سُجّل اعتماد التشريفات: ')}{new Date(at).toLocaleString()}{t('. Only the current packet appears in the operational calendar.','. تظهر الحزمة الحالية فقط في التقويم التشغيلي.')}</p>:<><label className="block">{pair('Reviewed ticket reference','مرجع التذكرة')}<input maxLength={200} value={reference} disabled={busy} onChange={e=>setReference(e.target.value)} className="block w-full rounded border ps-3 pe-3 py-2"/></label><label className="flex gap-2"><input type="checkbox" checked={checked} disabled={busy} onChange={e=>setChecked(e.target.checked)}/>{pair('I checked the ticket against these dates and airports','تحققت من التذكرة والمواعيد والمطارات')}</label><button type="button" disabled={busy||!checked||!reference.trim()} onClick={()=>void approve()} className="rounded bg-green-800 ps-3 pe-3 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed">{pair('Record itinerary approval','تسجيل الاعتماد')}</button></>}<p>{t('This records PR review; it does not book flights or clear visas.','يسجّل هذا مراجعة التشريفات فقط؛ ولا يحجز الرحلات ولا يُنهي إجراءات التأشيرات.')}</p><p role="status">{message}</p></section>;
}
