import { useEffect, useState } from 'react';

import { useCollectionWorkflow, type CollectionDetails as Details, type CollectionView as View } from '../lib/useCollectionWorkflow';
type Props = { view:View; artworkId:string; role:string; actorId:string; locked:boolean; onChanged:()=>Promise<void>; onDirtyChange:(dirty:boolean)=>void };
const input='block w-full rounded border border-[#D9CEBA] bg-white p-3 text-start';
const button='min-h-12 rounded border border-[#D9CEBA] px-4 py-2 disabled:opacity-40';
export default function ConnectedCollection({view:initial,artworkId,role,actorId,locked,onChanged,onDirtyChange}:Props) {
  const {view,busy,error,notice,needsRefresh,send:command,refresh}=useCollectionWorkflow(initial,artworkId,onChanged);
  const [baseVersion,setBaseVersion]=useState(initial.version);
  const [draft,setDraft]=useState<Details>(()=>view.record??{address:'',city:'',country:'',contact:'',sourceRef:'',timezone:'',availability:{start:'',end:''},closures:[],conflict:false});
  const [assignment,setAssignment]=useState(view.assignment);
  const [reason,setReason]=useState('');
  const [pickupDate,setPickupDate]=useState(view.record?.plan?.pickupDate??'');
  const [checked,setChecked]=useState(false);
  const [editing,setEditing]=useState(!view.record);
  const [dirty,setDirty]=useState(false);
  const reset=()=>{
    setDraft(view.record??{address:'',city:'',country:'',contact:'',sourceRef:'',timezone:'',availability:{start:'',end:''},closures:[],conflict:false});
    setAssignment(view.assignment);setReason('');setPickupDate(view.record?.plan?.pickupDate??'');setChecked(false);
    setEditing(!view.record);setDirty(false);onDirtyChange(false);setBaseVersion(view.version);
  };
  useEffect(()=>{if(!dirty&&!busy&&!needsRefresh)reset();},[view.version,busy,dirty,needsRefresh]);
  useEffect(()=>{onDirtyChange(dirty||busy);},[dirty,busy,onDirtyChange]);
  const change=()=>{if(!dirty)setBaseVersion(view.version);setDirty(true);onDirtyChange(true);};
  const stale=needsRefresh||(dirty&&baseVersion!==view.version);
  const send=async(action:string,extra:object)=>{
    if(await command(action,extra,dirty?baseVersion:view.version)){setDirty(false);onDirtyChange(false);setEditing(false);setChecked(false);setReason('');}
  };
  const canEdit=role==='Logistics'&&actorId===view.assignment.activeId&&!locked;
  const owner=view.accounts.find(a=>a.id===view.assignment.activeId)?.name??view.assignment.activeId;
  return <section id="collection-plan" className="rounded-xl border border-[#D9CEBA] bg-white p-5 space-y-4" aria-label="Collection and pickup">
    <h2 className="text-xl font-semibold">Collection &amp; pickup</h2>
    <p>Currently responsible: {owner}</p><p role="status">{view.blocker||`Planned for ${view.record?.plan?.pickupDate} (${view.record?.timezone}).`}</p>
    <p className="text-sm">Planning only. No carrier booking, email or payment is sent. Dates use the collection location’s timezone; closure boundaries are inclusive.</p>
    {notice&&<p role="status">{notice}</p>}
    {dirty&&<button type="button" className={button} disabled={busy} onClick={reset}>Discard draft</button>}
    {stale&&<div role="alert"><p>The shared record changed. Your draft is retained. Review the latest record before saving.</p><button className={button} disabled={busy} onClick={()=>void refresh().then(latest=>setBaseVersion(latest.version)).catch(()=>{})}>Review latest record and retain draft</button><p>Latest collection: {view.record?.address??'Not recorded'} · {view.record?.availability.start} — {view.record?.availability.end}. Responsible: {owner}.</p></div>}
    <h3 className="text-lg font-semibold">Collection details</h3>
    {error&&<p role="alert" className="text-[#8B261E]">{error} Your input is retained. Refresh the shared dossier if its version has changed.</p>}
    {view.record&&!editing&&<div className="space-y-2"><p>{view.record.address}, {view.record.city}, {view.record.country}</p><p>Collection contact: {view.record.contact}</p><p>Availability: {view.record.availability.start} — {view.record.availability.end} · {view.record.timezone}</p><p>Closures: {view.record.closures.map(r=>`${r.start} — ${r.end}`).join('; ')||'None recorded'}</p><p>Source: {view.record.sourceRef}</p><p>{view.record.confirmation?'Source confirmed by Logistics':'Not yet confirmed'}{view.record.conflict?' · Conflicting information reported':''}</p>{canEdit&&<button className={button} onClick={()=>setEditing(true)}>Amend collection details</button>}</div>}
    {canEdit&&editing&&<form onSubmit={e=>{e.preventDefault();void send('SAVE',{details:draft});}}><fieldset disabled={busy||stale} className="space-y-3">
      <p className="text-sm">Saving an amendment preserves history and clears the previous confirmation and pickup plan.</p>
      <div className="grid gap-3 sm:grid-cols-2">{([['address','Physical collection address'],['city','Collection city'],['country','Collection country — not nationality'],['contact','Collection contact'],['sourceRef','Source reference — no email body'],['timezone','IANA timezone, e.g. Europe/Paris']] as const).map(([key,label])=><label key={key}>{label}<input required maxLength={key==='timezone'?80:300} className={input} value={draft[key]} onChange={e=>{setDraft({...draft,[key]:e.target.value});change();}}/></label>)}</div>
      <div className="grid gap-3 sm:grid-cols-2">{(['start','end'] as const).map(key=><label key={key}>Availability {key}<input required type="date" className={input} value={draft.availability[key]} onChange={e=>{setDraft({...draft,availability:{...draft.availability,[key]:e.target.value}});change();}}/></label>)}</div>
      <fieldset className="space-y-2"><legend>Gallery closures</legend>{draft.closures.map((period,index)=><div key={index} className="flex flex-wrap items-end gap-3">{(['start','end'] as const).map(key=><label key={key}>Closure {index+1} {key}<input required type="date" className={input} value={period[key]} onChange={e=>{setDraft({...draft,closures:draft.closures.map((r,i)=>i===index?{...r,[key]:e.target.value}:r)});change();}}/></label>)}<button type="button" className={button} onClick={()=>{setDraft({...draft,closures:draft.closures.filter((_,i)=>i!==index)});change();}}>Remove closure {index+1}</button></div>)}<button type="button" className={button} disabled={draft.closures.length>=20} onClick={()=>{setDraft({...draft,closures:[...draft.closures,{start:'',end:''}]});change();}}>Add closure</button></fieldset>
      <label className="flex gap-3 items-center min-h-12"><input type="checkbox" checked={draft.conflict} onChange={e=>{setDraft({...draft,conflict:e.target.checked});change();}}/>The source information conflicts and needs reconciliation</label>
      <button className={button} disabled={busy||stale}>Save collection revision</button>
    </fieldset></form>}
    {canEdit&&!editing&&view.record&&!view.record.confirmation&&<div><label className="flex gap-3 items-center min-h-12"><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/>I checked this address, contact and availability against the recorded source</label><button className={button} disabled={busy||stale||!checked||view.record.conflict} onClick={()=>void send('CONFIRM',{checked})}>Confirm source details</button></div>}
    <h3 className="text-lg font-semibold">Pickup plan</h3><p>{view.record?.plan?`Planned only: ${view.record.plan.pickupDate} · ${view.record.timezone}`:"Awaiting a confirmed source and an available date."}</p>
    {canEdit&&!editing&&view.record?.confirmation&&<form onSubmit={e=>{e.preventDefault();void send('PLAN',{pickupDate});}} className="space-y-3"><label className="block">Proposed pickup date<input required type="date" className={input} min={view.record.availability.start} max={view.record.availability.end} value={pickupDate} onChange={e=>{setPickupDate(e.target.value);change();}}/></label><button className={button} disabled={busy||stale||view.record.conflict}>Save pickup plan — no booking</button></form>}
    <h3 className="text-lg font-semibold">Responsibility</h3>
    <p>Primary: {view.accounts.find(a=>a.id===view.assignment.primaryId)?.name} · Backup: {view.accounts.find(a=>a.id===view.assignment.backupId)?.name??'Not assigned'}</p>
    {!canEdit&&role==='Logistics'&&<p>Read-only. The active Logistics owner handles collection changes.</p>}
    {role==='General_Exhibition_Coordinator'&&!locked&&<form className="space-y-3" onSubmit={e=>{e.preventDefault();void send('ASSIGN',{...assignment,activeId:assignment.primaryId,reason});}}><fieldset disabled={busy||stale} className="space-y-3">
      {(['primaryId','backupId'] as const).map(key=><label className="block" key={key}>{key==='primaryId'?'Primary owner':'Backup owner'}<select aria-label={key==='primaryId'?'Primary owner':'Backup owner'} required className={input} value={assignment[key]??''} onChange={e=>{setAssignment({...assignment,[key]:e.target.value});change();}}><option value="">Select Logistics officer</option>{view.accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>)}
      <label className="block">Handover reason<textarea required maxLength={300} className={input} value={reason} onChange={e=>{setReason(e.target.value);change();}}/></label>
      <p>Activating backup transfers this task to {view.accounts.find(a=>a.id===assignment.backupId)?.name??'the selected backup'}. The previous owner becomes read-only.</p>
      <div className="flex flex-wrap gap-3">
        <button className={button} disabled={!dirty||!reason.trim()}>Save owners and assign primary</button>
        <button type="button" className={button} disabled={!reason.trim()||!assignment.backupId||assignment.backupId===assignment.primaryId||view.assignment.activeId===assignment.backupId} onClick={()=>void send('ASSIGN',{...assignment,activeId:assignment.backupId,reason})}>Activate backup</button>
        <button type="button" className={button} disabled={!reason.trim()||view.assignment.activeId===assignment.primaryId} onClick={()=>void send('ASSIGN',{...assignment,activeId:assignment.primaryId,reason})}>Return to primary</button>
      </div><p className="text-sm">This handover grants no Finance, Director or technical approval powers.</p>
    </fieldset></form>}
  </section>;
}
