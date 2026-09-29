import {useEffect,useRef,useState} from 'react';
import {BookOpen,Download,Lock} from 'lucide-react';
import {useSessionDraft} from '../context/SessionDrafts';
import {currentPublication,publicationComplete,rosterTransition,type ArtworkRoster} from '../data/artworkRoster';
import {publicationLabelsPdf} from '../utils/publicationLabelsPdf';

function AssetLink({file}:{file:File}){const [url,setUrl]=useState('');useEffect(()=>{const next=URL.createObjectURL(file);setUrl(next);return()=>URL.revokeObjectURL(next);},[file]);return <a className="underline break-all" href={url||undefined} download={file.name}>Inspect image: {file.name}</a>;}
const button='rounded border ps-4 pe-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed';
function PublicationCard({roster,editorial,onApprove}:{roster:ArtworkRoster;editorial:boolean;onApprove:(at:string)=>void}){
 const [inspected,setInspected]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const current=useRef(roster),mounted=useRef(true);current.current=roster;useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const working=useRef(false),latest=roster.history.at(-1),published=currentPublication(roster);
 async function exportProof(approve=false){
  if(working.current||!latest)return;
  working.current=true;setBusy(true);
  try{
   const at=new Date().toISOString();
   const candidate=approve?rosterTransition(roster,{type:'publish',at,revision:latest.revision,inspected},'EDITORIAL'):roster;
   const blob=await publicationLabelsPdf(candidate);
   if(!mounted.current||current.current!==roster)throw new Error('Revision changed during export');
   if(approve)onApprove(at);
   const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`SADU-labels-${roster.artistId}-r${latest.revision}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
   setNotice('Revision proof exported. Recheck the live approval before printing; downloaded copies cannot update themselves.');
  }catch{setNotice('PDF could not be generated. Approval was not changed; retry the export.');}
  finally{working.current=false;setBusy(false);}
 }
 return <article className="space-y-3 rounded border bg-[#FFFDF7] ps-4 pe-4 py-4"><h3>{roster.artistId} · Revision {latest?.revision}</h3>
 <p role="status">{published?'EDITORIAL LOCKED — current design source':roster.status==='LOCKED_PENDING_REVIEW'?'Awaiting Editorial review':'Publication paused — amendment in progress'}</p>
 {latest&&<><p dir="rtl">{latest.exhibitionTitleAr}</p><p>{latest.exhibitionTitleEn}</p>{latest.items.map(item=><div key={item.id} className="border-s-4 ps-3 space-y-2"><p dir="rtl">{item.titleAr} — {item.descriptionAr}</p><p>{item.titleEn} — {item.descriptionEn}</p>{item.image?<AssetLink file={item.image}/>:<p>Image missing</p>}</div>)}</>}
 {editorial&&!published&&<><label className="flex gap-2"><input type="checkbox" disabled={busy||roster.status!=='LOCKED_PENDING_REVIEW'} checked={inspected} onChange={e=>setInspected(e.target.checked)}/>I reviewed both languages and inspected the attached image for print quality.</label><button className={`${button} bg-green-800 text-white`} disabled={busy||!inspected||roster.status!=='LOCKED_PENDING_REVIEW'||!publicationComplete(roster)} onClick={()=>void exportProof(true)}><Lock aria-hidden="true" className="inline size-4"/> Lock text &amp; export bilingual proof</button></>}
 {published&&<button disabled={busy} className={button} onClick={()=>void exportProof()}><Download aria-hidden="true" className="inline size-4"/>Download current bilingual labels PDF</button>}
 <p role="status">{notice}</p></article>;
}
export function PublicationEscrow({editorial=false,assignedArtistIds}:{editorial?:boolean;assignedArtistIds?:string[]}){
 const [all,setAll]=useSessionDraft<Record<string,ArtworkRoster>>('artwork-rosters:v1',{});
 const rows=Object.values(all).filter(r=>r.history.length&&(!assignedArtistIds||assignedArtistIds.includes(r.artistId))&&(editorial||currentPublication(r)));
 return <section className="my-5 space-y-4 rounded-xl border bg-[#F7F1E6] ps-5 pe-5 py-5 text-start"><h2 className="flex gap-2 text-xl"><BookOpen aria-hidden="true"/>Publication Escrow / سجل اعتماد النشر</h2><p>Session rehearsal • files and approvals are lost on refresh. Only the current Editorial-approved revision is available for design. Historical revisions remain in the audit ledger.</p>{!rows.length&&<p>No current publication ready.</p>}{rows.map(roster=><PublicationCard key={`${roster.artistId}:${roster.status}:${roster.history.length}`} roster={roster} editorial={editorial} onApprove={at=>setAll(p=>({...p,[roster.artistId]:rosterTransition(p[roster.artistId],{type:'publish',at,revision:roster.history.length,inspected:true},'EDITORIAL')}))}/>)}</section>;
}
