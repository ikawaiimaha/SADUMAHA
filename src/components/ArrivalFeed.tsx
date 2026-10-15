import {UiText} from '../context/I18nContext';
import {useEffect,useRef,useState} from 'react';
import {PackageCheck} from 'lucide-react';
import {pilotSupabase as client} from '../lib/pilotSupabase';
import {useOperationalRows} from '../lib/useOperationalRows';
import {useUiText} from '../context/I18nContext';
type Receipt={booking_id:string;artist_name:string;artwork_title:string;artwork_id:string;facility:string;recorded_at:string};
export function ArrivalRecorder({bookingId}:{bookingId:string}){
 const {t,pair}=useUiText();
 const [facility,setFacility]=useState(''),[checked,setChecked]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');const running=useRef(false);const epoch=useRef(0);useEffect(()=>{const auth=client?.auth.onAuthStateChange(()=>{epoch.current++;setMessage('');setBusy(false);setFacility('');setChecked(false);});return()=>{epoch.current++;auth?.data.subscription.unsubscribe();};},[]);
 async function record(){if(!client||running.current||!checked||facility.trim().length<3)return;running.current=true;setBusy(true);const version=epoch.current;
 try{const r=await client.from('sadu_arrival_receipts').insert({booking_id:bookingId,facility:facility.trim(),all_crates_received:true});if(r.error)throw new Error();if(version!==epoch.current)return;setMessage(t('Arrival recorded in the shared feed. Condition inspection remains separate.','سُجّل الوصول في السجل المشترك. يبقى فحص الحالة إجراءً منفصلًا.'));}catch{if(version===epoch.current)setMessage(t('Not recorded: check Logistics authority, shipment status or an existing receipt.','لم يُسجَّل: تحقق من صلاحية الشؤون اللوجستية أو حالة الشحن أو وجود إيصال سابق.'));}finally{running.current=false;if(version===epoch.current)setBusy(false);}}
 const recorded=message.startsWith('Arrival recorded')||message.startsWith('سُجّل الوصول');
 return <section className="space-y-2 border-s-4 ps-3"><label className="block">{pair('Actual receiving facility','موقع الاستلام')}<input maxLength={200} value={facility} disabled={busy||recorded} onChange={e=>setFacility(e.target.value)} className="block w-full border ps-3 pe-3 py-2"/></label><label className="flex gap-2"><input type="checkbox" disabled={busy||recorded} checked={checked} onChange={e=>setChecked(e.target.checked)}/>{pair('All crates for this artwork physically received','تم استلام جميع صناديق العمل')}</label><button disabled={busy||!checked||facility.trim().length<3||recorded} onClick={()=>void record()} className="rounded border ps-3 pe-3 py-2 disabled:opacity-50">{pair('Record physical arrival','تسجيل الوصول')}</button><p aria-live="polite"><UiText value={message}/></p></section>;
}
export function ArrivalFeed(){
 const {t,pair}=useUiText();
 const queue=useOperationalRows<Receipt>('sadu_arrival_receipts');
 return <section className="space-y-3 rounded border bg-[#F7F1E6] ps-4 pe-4 py-4 text-start"><h2 className="flex gap-2 text-xl"><PackageCheck aria-hidden="true"/>{pair('Unified Receiving Dashboard','سجل وصول الأعمال')}</h2><p>{queue.live?t('Live arrival feed connected','سجل الوصول المباشر متصل'):t('Refresh fallback every 15 seconds','تحديث احتياطي كل 15 ثانية')}{t('. Arrival is not condition clearance or permission to release payment.','. الوصول لا يعني اجتياز فحص الحالة، ولا يُعد إذنًا بصرف الدفعات.')}</p><div aria-live="polite">{queue.rows.slice().sort((a,b)=>b.recorded_at.localeCompare(a.recorded_at)).map(r=><article key={r.booking_id} className="my-2 rounded border bg-[#FFFDF7] ps-3 pe-3 py-3"><strong>{r.artist_name} — {pair('Artworks arrived at facility','وصلت الأعمال')}</strong><p>{r.artwork_title} · {r.artwork_id}</p><p>{r.facility} · {new Date(r.recorded_at).toLocaleString()}</p></article>)}</div><p>{queue.notice}</p></section>;
}
