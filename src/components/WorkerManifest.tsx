import {useState} from 'react';
import {Users,Download} from 'lucide-react';
import {useSessionDraft} from '../context/SessionDrafts';
import type {FabricationTicket} from '../data/deliverableRouting';
import type {TechnicalRequest} from '../data/executionBridges';
export function WorkerManifest({artistId,venueId}:{artistId:string;venueId:string}){
 const [fabrication]=useSessionDraft<FabricationTicket[]>(`fabrication:${artistId}`,[]);
 const [technical]=useSessionDraft<TechnicalRequest[]>(`technical-requests:${artistId}`,[]);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const assignments=[...fabrication.map(r=>({venue:r.venueId,workers:r.workers,employer:r.vendor,work:r.item})),...technical.map(r=>({venue:r.venueClaim?.venueId,workers:r.workers,employer:'Technical / AV team',work:r.equipment}))];
 const current=assignments.filter(r=>r.venue===venueId),incomplete=assignments.some(r=>!r.venue||r.venue===venueId&&!r.workers?.length);
 const entries=[...new Set(current.flatMap(r=>(r.workers??[]).map(name=>`${name} · ${r.employer} · ${r.work}`)))];
 async function download(){if(busy||!entries.length||incomplete)return;setBusy(true);try{
  const {jsPDF}=await import('jspdf');await document.fonts.ready;const pdf=new jsPDF({compress:true}),canvas=document.createElement('canvas');canvas.width=1240;canvas.height=1754;const ctx=canvas.getContext('2d');if(!ctx)throw new Error();let y=80;
  const reset=()=>{ctx.fillStyle='#FFFDF7';ctx.fillRect(0,0,1240,1754);ctx.fillStyle='#111817';ctx.font='28px sans-serif';y=80;};const flush=()=>pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,0,210,297);reset();
  for(const row of ['SADU · Worker Manifest / قائمة العاملين',`Artwork: ${artistId} · Venue: ${venueId}`,`Generated: ${new Date().toISOString()}`,'REHEARSAL · Recorded assignments only · NOT SENT / NOT APPROVED',...entries,'Source: IMG-20260824-WA0002 (1).jpg, SMA installation instructions.', 'Rule 7: prior personnel list, visible identification and coordination with museum staff.']){let line='';for(const c of row){if(ctx.measureText(line+c).width>1100){ctx.fillText(line,60,y);y+=42;line='';if(y>1640){flush();pdf.addPage();reset();}}line+=c;}ctx.fillText(line,60,y);y+=65;if(y>1640){flush();pdf.addPage();reset();}}
  flush();const url=URL.createObjectURL(pdf.output('blob')),a=document.createElement('a');a.href=url;a.download=`SADU-workers-${artistId}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
 }catch{setNotice('Could not generate the manifest. Please retry.');}finally{setBusy(false);}}
 return <section className="my-3 min-w-0 space-y-2 break-words rounded border bg-[#F7F1E6] ps-4 pe-4 py-4 text-start"><h4 className="flex gap-2"><Users aria-hidden="true"/>Rule 7 · Worker Manifest</h4><p>{artistId} · {venueId||'Venue not assigned'}</p><p>Automatically compiled from recorded assignments. Visible in the matching Museum Operations rehearsal view; no email sent or museum approval implied.</p>{incomplete&&<p role="status" className="text-amber-900">Incomplete assignment: personnel names or venue missing. Resolve the assignment before exporting.</p>}<ul>{entries.map(e=><li key={e}>{e}</li>)}</ul>{!entries.length&&<p>No named personnel recorded for this venue.</p>}<button disabled={busy||incomplete||!venueId||!entries.length} className="rounded border ps-3 pe-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed" onClick={()=>void download()}><Download aria-hidden="true" className="inline size-4"/>Generate Worker Manifest PDF</button><p role="status">{notice}</p><p className="text-sm">Artwork-scoped rehearsal list, not certification that the entire exhibition workforce is complete. Refresh loses session assignments.</p></section>;
}
