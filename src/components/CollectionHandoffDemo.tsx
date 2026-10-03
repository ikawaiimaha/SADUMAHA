import { useCallback, useEffect, useState } from 'react';
import ConnectedCollection from './ConnectedCollection';
import type { CollectionView } from '../lib/useCollectionWorkflow';
type Account={id:string;name:string;role:string};
type Snapshot={artwork:{id:string;title:string};collection:CollectionView;nextActions:{id:string;title:string;owner:string;ownerId:string|null;blocker:string;deadline:string|null;timezone:string|null}[]};
async function read(path:string,body?:object){const r=await fetch(path,{cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const result=await r.json();if(!r.ok)throw new Error(result.error);return result;}
export default function CollectionHandoffDemo(){
  const [accounts,setAccounts]=useState<Account[]>([]),[actor,setActor]=useState<Account|null>(null),[data,setData]=useState<Snapshot|null>(null);
  const [dirty,setDirty]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const refresh=useCallback(async()=>{setData(await read('/api/review/pilot'));},[]);
  useEffect(()=>{void read('/api/review/session').then(async s=>{if(s.mode!=='collection-demo')throw new Error('An isolated collection-demo server is required.');setAccounts(s.accounts);setActor(s.actor);if(s.actor)await refresh();}).catch(e=>setError(e.message));},[refresh]);
  useEffect(()=>{if(!actor)return;const update=()=>void refresh().catch(()=>setError('Refresh unavailable; saved information remains visible.'));window.addEventListener('focus',update);const timer=window.setInterval(update,5000);return()=>{window.removeEventListener('focus',update);window.clearInterval(timer);};},[actor,refresh]);
  useEffect(()=>{if(!dirty)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
  const select=async(id:string)=>{setBusy(true);setError('');setData(null);try{const s=await read('/api/review/session',{accountId:id});setActor(s.actor);await refresh();}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  return <><div className="sticky top-0 z-10 bg-[#111817] px-5 py-3 text-center text-sm text-[#F7F1E6]">Local demonstration · No bookings or messages sent.</div>
    <main className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8">
      <header><p className="text-sm tracking-widest">SADU / سدو</p><h1 className="mt-2 text-3xl font-semibold">Collection handoff</h1><p className="mt-2">One shared collection record. A clear next action for each person.</p></header>
      <label className="block">Demonstration account<select className="mt-2 block min-h-12 w-full rounded border border-[#D9CEBA] bg-white p-3" disabled={busy||dirty} value={actor?.id??''} onChange={e=>void select(e.target.value)}><option value="" disabled>Choose an account</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
      {dirty&&<p>Save or discard your draft before switching accounts.</p>}{error&&<p role="alert">{error}</p>}
      {actor&&data&&<><section className="rounded-xl border border-[#D9CEBA] bg-white p-5"><h2 className="text-xl font-semibold">{data.artwork.title}</h2><p className="mt-2">Synthetic collection exercise · Artwork approval and shipment status remain unchanged.</p></section>
      <section aria-label="Your next actions" className="rounded-xl border border-[#D9CEBA] bg-white p-5"><h2 className="text-xl font-semibold">Your next actions</h2>{data.nextActions.length?<ul className="mt-3 space-y-3">{data.nextActions.map(t=><li key={t.id}><a href="#collection-plan" className="font-semibold underline">{t.title}</a><p>Owner: {accounts.find(a=>a.id===t.ownerId)?.name??t.owner}</p><p>{t.blocker}</p>{t.deadline&&<p>Window ends: {t.deadline} · {t.timezone}</p>}</li>)}</ul>:<p className="mt-3">{data.collection.ready?'Ready for collection. No carrier booking or physical handover has been recorded.':'No collection task assigned to this account.'}</p>}</section>
      <ConnectedCollection key={actor.id} view={data.collection} artworkId={data.artwork.id} role={actor.role} actorId={actor.id} locked={false} onChanged={refresh} onDirtyChange={setDirty}/></>}
    </main></>;
}
