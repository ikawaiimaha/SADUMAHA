import {useCallback,useEffect,useRef,useState} from 'react';
import {DraftWriter,type WorkspaceDraft,type DraftEnvelope,type DraftComparison} from './workspaceDraft';

/** Treatment-only roles must name the treatment workflow; the server refuses them on the default draft service. */
export function useWorkspaceDraft(artworkId:string,actorId:string,workflow?:'treatment') {
  const path=`/api/review/pilot/drafts/${encodeURIComponent(artworkId)}`;
  const readPath=workflow?`${path}?workflow=${workflow}`:path;
  const [status,setStatus]=useState<'loading'|'ready'|'saving'|'saved'|'error'|'conflict'>('loading');
  const [candidate,setCandidate]=useState<WorkspaceDraft|null>(null);
  const [savedAt,setSavedAt]=useState<string|null>(null);
  const [comparison,setComparison]=useState<DraftComparison|null>(null);
  const writer=useRef<DraftWriter|null>(null),latest=useRef<WorkspaceDraft|null>(null);
  const generation=useRef(0);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null),mounted=useRef(true);
  const cancel=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;};
  const load=useCallback(async()=>{
    cancel();generation.current++;setStatus('loading');await writer.current?.settled();
    try{
      const response=await fetch(readPath,{headers:{'x-sadu-draft-owner':actorId}}),result=await response.json();
      if(!response.ok)throw Error(result.error);
      if(!mounted.current)return;
      writer.current=new DraftWriter(result.revision,async(revision,draft)=>{
        const r=await fetch(path,{method:'PUT',headers:{'Content-Type':'application/json','x-sadu-draft-owner':actorId},body:JSON.stringify({expectedRevision:revision,draft})});
        const value=await r.json();if(!r.ok)throw Object.assign(Error(value.error),{status:r.status});return value as DraftEnvelope;
      });
      latest.current=null;setCandidate(result.draft);setComparison(result.comparison??null);setSavedAt(result.draft?.savedAt??null);setStatus('ready');
    }catch{if(mounted.current)setStatus('error');}
  },[path,readPath,actorId]);
  useEffect(()=>{mounted.current=true;void load();return()=>{mounted.current=false;cancel();};},[load]);
  const persist=async(draft:WorkspaceDraft|null,ownGeneration=generation.current)=>{
    if(!writer.current||writer.current.blocked)return false;
    setStatus('saving');
    try{const result=await writer.current.write(draft);if(mounted.current&&ownGeneration===generation.current){setSavedAt(result.draft?.savedAt??null);setStatus(draft?'saved':'ready');}return true;}
    catch(e){if(mounted.current)setStatus((e as {status?:number}).status===409?'conflict':'error');return false;}
  };
  const stage=(draft:WorkspaceDraft)=>{
    latest.current=draft;cancel();const ownGeneration=++generation.current;setStatus(writer.current?.blocked?'error':'saving');
    timer.current=setTimeout(()=>{timer.current=null;void persist(draft,ownGeneration);},650);
  };
  const flush=async(attempted?:boolean)=>{
    cancel();if(!latest.current)return true;
    if(attempted!==undefined)latest.current={...latest.current,attempted};
    return persist(latest.current);
  };
  const clear=async()=>{cancel();generation.current++;const ok=await persist(null);if(ok){latest.current=null;setCandidate(null);}return ok;};
  return {status,candidate,comparison,savedAt,stage,flush,clear,load,setCandidate,blocked:status==='loading'||status==='error'||status==='conflict'};
}
