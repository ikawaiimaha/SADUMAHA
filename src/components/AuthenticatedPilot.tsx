import {FreightChangeControl} from './FreightChangeControl';
import {LogisticsActionQueue} from './LogisticsActionQueue';
import {FreightClosureLedger} from './FreightClosureLedger';
import {PublicationHandoff,ExhibitionTitleHeader} from './PublicationHandoff';
import {ExhibitionTitleGate} from './ExhibitionTitleGate';
import {ArrivalFeed} from './ArrivalFeed';
import {PendingAssetTracker} from './PendingAssetTracker';
import {OperationalGuestCalendar} from './OperationalGuestCalendar';
import {GuestTravel} from './GuestTravel';
import {DigitalConditionReports} from './DigitalConditionReports';
import {FreightPickupScheduler} from './FreightPickupScheduler';
import {IdleWorkspaceLock} from './IdleWorkspaceLock';
import {ExhibitionScenario,ExhibitionChecklistQueue} from './ExhibitionScenario';
import { useEffect, useState, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { pilotSupabase as client } from '../lib/pilotSupabase';
import { institutionalRole, institutionalRoleLabels, showsPilotTool, spatialPilotRoles, type PilotTool } from '../lib/sessionRole';
type Dossier = { id: string; artist_name: string; nationality: string; medium: string; status: string };
type Space = { id: string; venue: string; room: string; curator: string };
type Claim = { id: string; space_id: string; dossier_id: string; claimed_by: string };
type Request = { id: string; claim_id: string; equipment: string; mounting: string; phase: string };
export default function AuthenticatedPilot() {
 const currentUser = useRef<string | undefined>(undefined);
 const [session,setSession]=useState<Session|null>(null), [role,setRole]=useState('');
 const [email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [dossiers,setDossiers]=useState<Dossier[]>([]),[spaces,setSpaces]=useState<Space[]>([]),[claims,setClaims]=useState<Claim[]>([]),[requests,setRequests]=useState<Request[]>([]);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[signInError,setSignInError]=useState(''),[ready,setReady]=useState(false);
 const [artist,setArtist]=useState(''),[nationality,setNationality]=useState(''),[medium,setMedium]=useState('');
 const [selected,setSelected]=useState(''),[claimId,setClaimId]=useState(''),[equipment,setEquipment]=useState('AV Projectors'),[mounting,setMounting]=useState('Floor Freestanding'),[phase,setPhase]=useState('FINAL_INSTALLATION');
 useEffect(()=>{if(!client)return; const {data}=client.auth.onAuthStateChange((_event,next)=>{const changed=currentUser.current!==next?.user.id;currentUser.current=next?.user.id;setSession(next);setReady(true);if(changed){setRole('');setDossiers([]);setClaims([]);setRequests([]);setMessage('');}});return()=>data.subscription.unsubscribe();},[]);
 async function refresh() {
  if(!client)return;
  const userAtStart=currentUser.current;
  // maybeSingle: an account without spatial-pilot membership is a normal state, not a failure.
  const result=await Promise.all([client.from('sadu_pilot_members').select('role').maybeSingle(),client.from('sadu_pilot_dossiers').select('*'),client.from('sadu_pilot_spaces').select('*'),client.from('sadu_pilot_claims').select('*'),client.from('sadu_pilot_requests').select('*')]);
  if(userAtStart!==currentUser.current)return;
  const failed=result.find(r=>r.error);if(failed?.error)throw new Error(failed.error.message);
  setRole(result[0].data?.role??'');setDossiers(result[1].data as Dossier[]);setSpaces(result[2].data as Space[]);setClaims(result[3].data as Claim[]);setRequests(result[4].data as Request[]);
 }
 useEffect(()=>{if(!session)return;let active=true;refresh().catch(()=>{if(active)setMessage('Pilot records could not be loaded. Use Refresh records, or ask an administrator to check your access.');});return()=>{active=false;};},[session]);
 async function run(work:()=>PromiseLike<{error: {message:string;code?:string}|null}>,success:string) {
  if(busy)return;setBusy(true);setMessage('');
  try {const result=await work();if(result.error)throw new Error(result.error.code==='23505'?'This room or request is already claimed/recorded. Refresh the board.':result.error.message);await refresh();setMessage(success);}catch(error){setMessage(error instanceof Error?error.message:'Operation failed');}finally{setBusy(false);}
 }
 const field='block w-full rounded border border-[#D9CEBA] bg-white ps-3 pe-3 py-2';
 const button='rounded bg-[#8B261E] ps-4 pe-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed';
 const quiet='rounded border border-[#8C8173] bg-white ps-4 pe-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed';
 const panel='space-y-4 rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-5';
 if(!client)return <main className={panel}><h1>Authenticated pilot is not configured</h1><p>Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then restart Vite.</p><a href="/">Return to rehearsal</a></main>;
 const access=institutionalRole(session);
 const label=institutionalRoleLabels[access];
 const shows=(tool:PilotTool)=>showsPilotTool(access,tool);
 const inSpatialPilot=!!role;
 const hasTools=(['titleHeader','titleGate','pendingAssets','guestCalendar','guestTravel','conditionReports','finalDeliverables','freightPickup','checklistQueue','arrivalFeed','freightChange','logisticsQueue','freightClosure','publicationHandoff'] as PilotTool[]).some(shows);
 return <IdleWorkspaceLock enabled={!!session} identity={session?.user.id??'signed-out'} reauthenticate={async password=>{if(!session?.user.email)return false;const expected=session.user.id;const {data,error}=await client.auth.signInWithPassword({email:session.user.email,password});return !error&&data.user?.id===expected;}}><main className="mx-auto max-w-5xl space-y-6 ps-4 pe-4 sm:ps-5 sm:pe-5 py-8 text-start text-[#1A1817]">
  <header className="space-y-2"><h1 className="text-3xl font-semibold">SADU · Authenticated pilot</h1><p>Real accounts and persistent pilot records. Nothing is sent outside SADU; this pilot does not replace the full institutional vetting process.</p><a className="underline" href="/">Return to session rehearsal</a></header>
  {!session ? <form className={panel+' max-w-md'} onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setSignInError('');const {error}=await client.auth.signInWithPassword({email,password});setPassword('');setSignInError(error?'Sign-in failed. Check your email and password and try again.':'');setBusy(false);}}><h2 className="text-xl">Sign in</h2><label className="block">Email<input required type="email" autoComplete="username" className={field} value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="block">Password<input required type="password" autoComplete="current-password" className={field} value={password} onChange={e=>setPassword(e.target.value)}/></label><button className={button} disabled={busy||!ready} aria-busy={busy}>{busy?'Signing in…':'Sign in'}</button>{signInError&&<p role="alert" className="text-[#8B261E]">{signInError}</p>}</form> : <>
   <section aria-label="Signed-in account" className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded border border-[#D9CEBA] bg-white ps-4 pe-4 py-3 shadow-sm">
    <p className="me-auto min-w-0"><strong>{label?.en??'No institutional role'}</strong>{label&&<> · <bdi lang="ar">{label.ar}</bdi></>}<span className="block truncate text-sm text-[#5E554B]">{session.user.email}</span></p>
    <button className={quiet} disabled={busy} onClick={()=>void run(async()=>{await refresh();return {error:null};},'Records refreshed')}>Refresh records</button><button className={quiet} disabled={busy} onClick={async()=>{await client.auth.signOut();setMessage('');}}>Sign out</button>
   </section>
   <p role="status" aria-live="polite" className="empty:hidden">{message}</p>
   {!label&&<section className={panel}><h2 className="text-xl">No role assigned yet</h2><p>This account has no institutional role, so no pilot tools are shown. Ask an administrator to add your role, then sign out and sign in again.</p></section>}
   {shows('titleHeader')&&<ExhibitionTitleHeader/>}
   {shows('titleGate')&&<ExhibitionTitleGate curator/>}
   {inSpatialPilot?<>
    {role==='COORDINATOR'&&<form className={panel} onSubmit={e=>{e.preventDefault();void run(()=>client.from('sadu_pilot_dossiers').insert({artist_name:artist.trim(),nationality:nationality.trim(),medium:medium.trim()}),'Dossier saved for Director review');}}><h2 className="text-xl">Create pilot dossier</h2>{[['Artist name',artist,setArtist],['Nationality',nationality,setNationality],['Medium',medium,setMedium]].map(([label,value,setter])=><label key={String(label)} className="block">{String(label)}<input required maxLength={100} className={field} value={String(value)} onChange={e=>(setter as (v:string)=>void)(e.target.value)}/></label>)}<button className={button} disabled={busy}>Save dossier</button></form>}
    <section className={panel}><h2 className="text-xl">Dossier queue</h2>{!dossiers.length&&<p>No visible dossiers.</p>}{dossiers.map(d=><article key={d.id} className="border-b py-3"><p>{d.artist_name} · {d.nationality} · {d.medium} · {d.status}</p>{role==='BIENNIAL_DIRECTOR'&&d.status==='DRAFT'&&<button className={button} disabled={busy} onClick={()=>void run(()=>client.from('sadu_pilot_dossiers').update({status:'APPROVED'}).eq('id',d.id).select().single(),'Pilot dossier approved')}>Approve pilot scope</button>}</article>)}</section>
    <section className={panel}><h2 className="text-xl">Shared venue ledger</h2>{role==='COORDINATOR'&&<label className="block">Approved dossier<select className={field} value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select dossier</option>{dossiers.filter(d=>d.status==='APPROVED'&&!claims.some(c=>c.dossier_id===d.id)).map(d=><option key={d.id} value={d.id}>{d.artist_name}</option>)}</select></label>}{spaces.map(s=>{const claim=claims.find(c=>c.space_id===s.id);return <article key={s.id} className="space-y-2 border-b py-3"><h3>{s.venue} · {s.room}</h3><p>Authority: {s.curator}</p><p>{claim?'CLAIMED · '+(dossiers.find(d=>d.id===claim.dossier_id)?.artist_name??'Another coordinator’s dossier'):'AVAILABLE'}</p>{!claim&&role==='COORDINATOR'&&<button className={button} disabled={busy||!selected} onClick={()=>void run(()=>client.from('sadu_pilot_claims').insert({space_id:s.id,dossier_id:selected}),'Room claimed; venue approval still required')}>Claim room</button>}</article>})}</section>
    {['COORDINATOR','TECHNICAL'].includes(role)&&<form className={panel} onSubmit={e=>{e.preventDefault();void run(()=>client.from('sadu_pilot_requests').insert({claim_id:claimId,equipment,mounting,phase}),'Technical request saved');}}><h2 className="text-xl">Technical request</h2><label className="block">Claimed room<select required className={field} value={claimId} onChange={e=>setClaimId(e.target.value)}><option value="">Select claimed room</option>{claims.filter(c=>role==='TECHNICAL'||c.claimed_by===session.user.id).map(c=><option key={c.id} value={c.id}>{spaces.find(s=>s.id===c.space_id)?.venue} · {c.space_id}</option>)}</select></label>{[{label:'Equipment',value:equipment,set:setEquipment,options:['AV Projectors','Lighting Rig','Pedestal']},{label:'Mounting',value:mounting,set:setMounting,options:['Floor Freestanding','Ceiling Mount','Wall Anchor']},{label:'Phase',value:phase,set:setPhase,options:['PROTOTYPING','FINAL_INSTALLATION']}].map(f=><label className="block" key={f.label}>{f.label}<select className={field} value={f.value} onChange={e=>f.set(e.target.value)}>{f.options.map(o=><option key={o}>{o}</option>)}</select></label>)}<button className={button} disabled={busy||!claimId}>Record request</button></form>}
    <section className={panel}><h2 className="text-xl">Execution ledger</h2>{!requests.length&&<p>No requests recorded.</p>}{requests.map(r=>{const claim=claims.find(c=>c.id===r.claim_id),space=spaces.find(s=>s.id===claim?.space_id);return <article key={r.id} className="border-b py-3"><p>{r.equipment} · {r.mounting} · {r.phase}</p><p>Equipment: Technical & AV · PENDING_INVENTORY_CHECK</p>{(r.mounting!=='Floor Freestanding'||r.equipment==='Lighting Rig')&&<p>Structural: {space?.curator} · {space?.room} · PENDING_VENUE_APPROVAL</p>}</article>})}</section>
   </>:spatialPilotRoles.includes(access)&&<section className={panel}><h2 className="text-xl">Dossier queue</h2><p>Your account is not enrolled in the spatial pilot yet, so dossiers, rooms and technical requests are hidden. Ask an administrator to add you to the pilot.</p></section>}
   {shows('pendingAssets')&&<PendingAssetTracker/>}
   {shows('guestCalendar')&&<OperationalGuestCalendar key={session.user.id}/>}
   {shows('guestTravel')&&<GuestTravel key={session.user.id} review={access==='PR_PROTOCOL'}/>}
   {shows('conditionReports')&&<DigitalConditionReports actor={access==='LOGISTICS'?'LOGISTICS':access==='TECHNICAL'?'TECHNICAL':'ARTIST'}/>}
   {shows('finalDeliverables')&&<ExhibitionScenario/>}
   {shows('checklistQueue')&&<ExhibitionChecklistQueue/>}
   {shows('freightPickup')&&<FreightPickupScheduler key={session.user.id} logistics={access==='LOGISTICS'}/>}
   {shows('arrivalFeed')&&<ArrivalFeed/>}
   {shows('freightChange')&&<FreightChangeControl actor={access}/>}
   {shows('logisticsQueue')&&<LogisticsActionQueue key={'logistics:'+session.user.id} artist={access==='ARTIST'} officer={access==='LOGISTICS'}/>}
   {shows('freightClosure')&&<FreightClosureLedger key={session.user.id} logistics={access==='LOGISTICS'} vendor={access==='EXTERNAL_VENDOR'}/>}
   {shows('publicationHandoff')&&<PublicationHandoff editorial={access==='EDITORIAL'}/>}
   {label&&!hasTools&&!inSpatialPilot&&<section className={panel}><h2 className="text-xl">Nothing to do here yet</h2><p>The pilot has no live tools for the {label.en} role yet. Your work continues in the session rehearsal.</p><a className="underline" href="/">Open the session rehearsal</a></section>}
  </>}
 </main></IdleWorkspaceLock>;
}
