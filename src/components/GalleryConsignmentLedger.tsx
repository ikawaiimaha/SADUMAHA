import {useEffect,useRef,useState} from 'react';
import {Building2,Link,FileSpreadsheet} from 'lucide-react';
import {pilotSupabase as client} from '../lib/pilotSupabase';
import {useOperationalRows} from '../lib/useOperationalRows';
import {consignmentFields,type Consignment} from '../data/consignment';
import type {CatalogArtwork} from '../data/catalogFreight';
import {operationalPanel as panel,operationalInput as field,operationalButton as button} from './ArtworkMetadataLedger';

async function manifest(row:Consignment,title:string){
 const {jsPDF}=await import('jspdf');
 await document.fonts.ready;
 // Canvas uses the loaded Arabic/Latin fonts, avoiding jsPDF's Latin-only default.
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1680;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
 const pdf=new jsPDF();let y=70;
 function background(){ctx!.fillStyle='#FFFDF7';ctx!.fillRect(0,0,1200,1680);ctx!.fillStyle='#111817';ctx!.font='24px "Noto Naskh Arabic", Arial';y=70;}
 function page(){pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,0,210,294);}
 function line(text:string){
  // Text-only drawing: user values never become markup or script.
  let part='';for(const char of text){if(ctx!.measureText(part+char).width>1060){draw(part);part='';}part+=char;}draw(part);
 }
 function draw(text:string){if(y>1570){page();pdf.addPage();background();}ctx!.fillText(text,60,y);y+=38;}
 background();line('SADU — Freight Manifest / بيان الشحن');line('LOCAL PILOT — Not a carrier booking or insurance certificate');line(`Record: ${row.id}`);line(`Artwork: ${title}`);line(`Received: ${row.received_at}`);line(`Gallery contact: ${row.contact_name} / ${row.contact_email}`);
 for(const [key,label] of Object.entries(consignmentFields))line(`${label}: ${row.details?.[key]??''}${key==='insurance_value'?` ${row.details?.currency}`:''}`);
 line('Verify declared values and pickup arrangements before dispatch.');page();pdf.save(`SADU-consignment-${row.id}.pdf`);
}

export function GalleryConsignmentLedger({logistics=false}:{logistics?:boolean}){
 const records=useOperationalRows<Consignment>('sadu_consignments'),artworks=useOperationalRows<CatalogArtwork>('sadu_artwork_checklist');
 const [artwork,setArtwork]=useState(''),[origin,setOrigin]=useState(''),[name,setName]=useState(''),[email,setEmail]=useState('');
 const [url,setUrl]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);const pending=useRef(false);
 useEffect(()=>{if(!client)return;const {data}=client.auth.onAuthStateChange(()=>{setUrl('');setArtwork('');setName('');setEmail('');});return()=>data.subscription.unsubscribe();},[]);
 async function issue(){
  if(!client||pending.current||!artwork||!origin)return;pending.current=true;setBusy(true);setUrl('');
  try{const result=await client.rpc('sadu_issue_consignment',{a:artwork,o:origin,n:name,e:email});if(result.error)throw result.error;
   if(result.data)setUrl(`${window.location.origin}/gallery-consignment#token=${result.data}`);
   setMessage(result.data?'Link prepared, not emailed. Valid for 7 days and one submission. Regenerating invalidates the previous link.':'Studio origin saved. Complete the pickup scheduler below.');await records.refresh();
  }catch{setMessage('Origin not saved. Verify account ownership, accepted agreement and whether this artwork is already booked or submitted.');}finally{pending.current=false;setBusy(false);}
 }
 async function download(row:Consignment){if(pending.current)return;pending.current=true;setBusy(true);try{await manifest(row,artworks.rows.find(a=>a.id===row.artwork_id)?.source.title??row.artwork_id);}catch{setMessage('Manifest generation failed. Please retry.');}finally{pending.current=false;setBusy(false);}}
 return <section className={panel}><h2 className="flex gap-2 text-xl"><Building2 aria-hidden="true"/>Third-Party Consignment & Gallery Handoff / تنسيق الشحن من جهة العرض</h2>{!logistics&&<p className="text-sm">This pilot prepares a private link for you to share; no email is sent automatically.</p>}{!logistics&&<form onSubmit={e=>{e.preventDefault();void issue();}}><fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2"><legend>Dispatch origin is required for each artwork / مصدر الشحن لكل عمل</legend><label>Artwork<select required className={field} value={artwork} onChange={e=>{setArtwork(e.target.value);setOrigin('');setUrl('');setName('');setEmail('');}}><option value="">Select artwork</option>{artworks.rows.filter(a=>!records.rows.some(r=>r.artwork_id===a.id&&r.status==='CONSIGNMENT_DATA_RECEIVED')).map(a=><option key={a.id} value={a.id}>{a.source.title}</option>)}</select></label><label>Dispatch Origin<select required className={field} value={origin} onChange={e=>{setOrigin(e.target.value);setUrl('');}}><option value="">Choose origin</option><option value="ARTIST_STUDIO">Artist Studio / الاستوديو الخاص</option><option value="THIRD_PARTY_GALLERY">Third-Party Gallery/Institution / جهة العرض</option></select></label>{origin==='THIRD_PARTY_GALLERY'&&<><label>Gallery Contact Name<input required maxLength={200} className={field} value={name} onChange={e=>setName(e.target.value)}/></label><label>Gallery Email<input required type="email" maxLength={254} className={field} value={email} onChange={e=>setEmail(e.target.value)}/></label></>}<button className={button} disabled={!artwork||!origin||busy}><Link aria-hidden="true" size={18}/>{origin==='THIRD_PARTY_GALLERY'?'Send Secure Logistics Form to Gallery / إرسال رابط التنسيق للجاليري':'Save studio origin / حفظ مصدر الشحن'}</button></fieldset></form>}{url&&<label className="block">Private one-time link — share only with your gallery<input readOnly className={field} value={url} onFocus={e=>e.target.select()}/></label>}<p role="status">{message||records.notice}</p>{records.rows.map(row=><article key={row.id} className="space-y-2 rounded border bg-[#FFFDF7] ps-4 pe-4 py-3"><h3>{artworks.rows.find(a=>a.id===row.artwork_id)?.source.title??row.artwork_id}</h3><p>{row.origin} · {row.status}</p>{row.contact_name&&<p>{row.contact_name} · {row.contact_email}</p>}{row.details&&<><dl className="grid gap-2 sm:grid-cols-2">{Object.entries(consignmentFields).map(([k,label])=><div key={k}><dt className="text-sm">{label}</dt><dd className="break-words">{row.details![k]}{k==='insurance_value'?` ${row.details!.currency}`:''}</dd></div>)}</dl><p>Locked receipt: {row.received_at}</p>{logistics&&<button className={button} disabled={busy} onClick={()=>void download(row)}><FileSpreadsheet aria-hidden="true" size={18}/>Generate Freight Manifest / توليد بيان الشحن PDF</button>}</>}</article>)}</section>;
}
