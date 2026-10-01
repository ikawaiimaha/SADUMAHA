import { useState } from 'react';

type Logistics = {origin:string;destination:string;carrier:string;handling:string;gross_weight_kg:number};
type Report = {logistics:Logistics;id:string;damaged:boolean;notes:string;actorId:string;at:string;photo:{file_hash:string}};
type View = {collectionReady?:boolean;collectionOrigin?:string|null;report:Report|null;decision:{action:string;reason:string}|null;ready:boolean;blocker:string;cancelled:boolean};
type Props = {view:View;role:string;version:number;versionHash:string;locked:boolean;onChanged:()=>Promise<void>;onDirtyChange:(dirty:boolean)=>void};

export default function ConnectedDispatch({view,role,version,versionHash,locked,onChanged,onDirtyChange}:Props) {
  const [photo,setPhoto]=useState<File>();
  const [damage,setDamage]=useState('');
  const [notes,setNotes]=useState('');
  const [reason,setReason]=useState('');
  const [logistics,setLogistics]=useState(()=>({origin:view.report?.logistics.origin??'',destination:view.report?.logistics.destination??'',carrier:view.report?.logistics.carrier??'',handling:view.report?.logistics.handling??'',gross_weight_kg:view.report?String(view.report.logistics.gross_weight_kg):''}));
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [success,setSuccess]=useState('');
  const changed=()=>{onDirtyChange(true);setSuccess('');};
  const send=async(body:unknown,upload?:File)=>{
    if(busy)return;
    setBusy(true);setError('');setSuccess('');
    try {
      const response=await fetch(`/api/review/pilot/pre-dispatch${upload?'':'/review'}`,{method:'POST',headers:upload?{'Content-Type':'application/octet-stream','x-sadu-metadata':encodeURIComponent(JSON.stringify(body))}:{'Content-Type':'application/json'},body:upload??JSON.stringify(body)});
      const result=await response.json();
      if(response.status===409)await onChanged();
      if(!response.ok)throw new Error(result.error??'Could not save the condition report.');
      onDirtyChange(false);setReason('');await onChanged();setSuccess('Saved to the shared dossier.');
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  };
  const canUpload=role==='Artist'&&!view.cancelled&&(!view.report||view.decision?.action==='REPAIR');
  return <section className="rounded-xl border border-[#D9CEBA] bg-white p-5 space-y-3" aria-label="Pre-dispatch condition">
    <h2 className="text-xl font-semibold">Before shipping</h2>
    <p>{view.ready?'Condition reviewed. The draft manifest is available.':view.blocker}</p>
    <p role="alert">{error}</p><p role="status">{success}</p>
    {view.report&&<details><summary>Current condition evidence</summary><p>{view.report.notes}</p><p>Existing damage: {view.report.damaged?'Yes':'No'} · Recorded by {view.report.actorId}</p><a className="underline" href="/api/review/pilot/pre-dispatch/photo" target="_blank" rel="noreferrer">Open condition photograph</a><p className="text-xs break-all">SHA-256: {view.report.photo.file_hash}</p>{view.decision&&<p>Review: {view.decision.action} — {view.decision.reason}</p>}</details>}
    {canUpload&&!locked&&<form className="space-y-3" onSubmit={e=>{e.preventDefault();if(photo)void send({version,versionHash,damaged:damage==='yes',notes,logistics:{...logistics,gross_weight_kg:Number(logistics.gross_weight_kg)}},photo);}}><fieldset disabled={busy} className="space-y-3">
      <label className="block">Existing damage or structural weakness?<select required value={damage} onChange={e=>{setDamage(e.target.value);changed();}} className="block border rounded p-2"><option value="">Choose an answer</option><option value="no">No</option><option value="yes">Yes</option></select></label>
      <label className="block">Condition and packing observations<textarea required maxLength={1000} value={notes} onChange={e=>{setNotes(e.target.value);changed();}} className="block w-full border rounded p-2"/></label>
      <label className="block">Current condition photograph (PNG, up to 20 MB)<input required type="file" accept="image/png" onChange={e=>{setPhoto(e.target.files?.[0]);changed();}} className="block"/></label>
      <p>Collection point: {view.collectionOrigin??'Await Logistics confirmation and pickup planning.'}</p><details open><summary>Collection and packing details — required for the draft manifest</summary><div className="grid gap-3 sm:grid-cols-2">{([['destination','Delivery point'],['carrier','Carrier / booking reference'],['handling','Handling instructions'],['gross_weight_kg','Gross packed weight (kg)']] as const).map(([key,label])=><label key={key}>{label}<input required maxLength={300} type={key==='gross_weight_kg'?'number':'text'} min={key==='gross_weight_kg'?0.01:undefined} max={key==='gross_weight_kg'?100000:undefined} step={key==='gross_weight_kg'?'any':undefined} value={logistics[key]} onChange={e=>{setLogistics({...logistics,[key]:e.target.value});changed();}} className="block w-full border rounded p-2"/></label>)}</div></details>
      <button disabled={busy||!photo||!damage||view.collectionReady===false} className="rounded bg-[#8B261E] text-white px-4 py-2 disabled:opacity-40">{busy?'Saving…':'Submit condition report'}</button>
    </fieldset></form>}
    {role==='General_Exhibition_Coordinator'&&view.report&&!view.decision&&!locked&&<div className="space-y-3"><label className="block">Review reason<textarea maxLength={1000} value={reason} onChange={e=>{setReason(e.target.value);changed();}} className="block w-full border rounded p-2"/></label><div className="flex flex-wrap gap-2">{([['CLEAR','Clear for draft manifest'],['REPAIR','Request studio repair'],['CANCEL','Cancel dispatch']] as const).map(([action,label])=><button key={action} disabled={busy||!reason.trim()||(action==='CLEAR'&&view.report!.damaged)} className="rounded border border-[#D9CEBA] px-3 py-2 disabled:opacity-40" onClick={()=>void send({version,versionHash,reportId:view.report!.id,action,reason})}>{label}</button>)}</div><p className="text-sm">Damage requires a new post-repair report. This review does not authorize payment or establish insurance coverage.</p></div>}
    {view.ready&&<a className="underline" href="/api/review/pilot/manifest.pdf">Download draft shipping manifest</a>}
  </section>;
}
