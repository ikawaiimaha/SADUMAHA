import { useCallback, useEffect, useRef, useState } from 'react';

export type Period = { start:string; end:string };
export type CollectionDetails = { address:string; city:string; country:string; contact:string; sourceRef:string; timezone:string; availability:Period; closures:Period[]; conflict:boolean };
export type PackingPlan = { specification:string;owner:string;amount:number;requiresTechnical:boolean;technicalReference:string;costReference:string;evidence:string };
export type CollectionView = { version:number; state?:string; role?:string; blocker:string; ready:boolean; accounts:{id:string;name:string}[]; assignment:{primaryId:string;backupId:string|null;activeId:string;acceptedBy?:string|null}; record:(CollectionDetails & {confirmation:{actorId:string}|null;plan:{pickupDate:string;state:string}|null;packing?:PackingPlan|null})|null };

export function useCollectionWorkflow(initial:CollectionView, artworkId:string, onChanged:()=>Promise<void>) {
  const [view,setView]=useState(initial),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [needsRefresh,setNeedsRefresh]=useState(false);
  const pending=useRef(false),callback=useRef(onChanged),request=useRef(0);
  callback.current=onChanged;
  const path=`/api/review/pilot/collection/${encodeURIComponent(artworkId)}`;
  useEffect(()=>{setView(v=>initial.version>=v.version?initial:v);},[initial]);
  const refresh=useCallback(async()=>{
    const ticket=++request.current;
    const r=await fetch(path,{cache:'no-store'});const body=await r.json();
    if(!r.ok)throw new Error(body.error??'Refresh unavailable.');
    if(ticket===request.current){setView(v=>body.version>=v.version?body:v);setNeedsRefresh(false);setNotice(previous=>previous.startsWith('Saved;')?'Saved locally.':previous.startsWith('Refresh unavailable')?'':previous);}
    return body as CollectionView;
  },[path]);
  useEffect(()=>{
    const update=()=>{if(!pending.current)void refresh().catch(()=>setNotice('Refresh unavailable. Saved information remains visible.'));};
    window.addEventListener('focus',update);
    const timer=window.setInterval(update,5000);
    return()=>{window.removeEventListener('focus',update);window.clearInterval(timer);request.current++;};
  },[refresh]);
  const send=async(action:string,extra:object,version:number)=>{
    if(pending.current||needsRefresh)return false;
    pending.current=true;setBusy(true);setError('');setNotice('');
    try {
      const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...extra,version})});
      const body=await r.json();
      if(!r.ok){setError(body.error??'Collection update failed.');if(r.status===409||r.status===403)await refresh().catch(()=>{});return false;}
      // A committed command must never be presented as a failed save if its refresh fails.
      try {await refresh();await callback.current();setNotice('Saved locally.');}
      catch {setNeedsRefresh(true);setNotice('Saved; refresh unavailable. Refresh before making another change.');}
      return true;
    } catch {setNeedsRefresh(true);setError('Connection interrupted. Refresh to check whether the change was saved before retrying.');return false;}
    finally {pending.current=false;setBusy(false);}
  };
  return {view,busy,error,notice,needsRefresh,send,refresh};
}
