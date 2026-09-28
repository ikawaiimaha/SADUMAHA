import { useEffect, useState } from 'react';
import { Building2, ShieldCheck, UserRound as UserRoundForward } from 'lucide-react';
import { useSessionDraft } from '../context/SessionDrafts';
import { assignee, clearVenue, emptyGovernance, setDelegation, type Governance, type VenueApproval } from '../data/venueGovernance';
import { VENUE_SPACES } from '../data/spatialClaims';
const key='venue-governance:v1';
const panel='my-4 space-y-3 rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-4 pe-4 py-4 text-start';
export function VenueClearanceStep({ticket}:{ticket:Omit<VenueApproval,'status'>}){
 const [state,setState]=useSessionDraft<Governance>(key,emptyGovernance);
 const serialized=JSON.stringify(ticket);
 useEffect(()=>{const incoming=JSON.parse(serialized) as typeof ticket;setState(p=>{const old=p.tickets[incoming.id];if(old&&old.blocked===incoming.blocked&&old.venueId===incoming.venueId)return p;return {...p,tickets:{...p.tickets,[incoming.id]:old&&old.venueId===incoming.venueId?{...old,blocked:incoming.blocked}:{...incoming,status:'PENDING_VENUE_APPROVAL'}}};});},[serialized]);
 const record=state.tickets[ticket.id],role=`VENUE:${ticket.venueId}`,delegated=state.delegations[role]?.onLeave;
 return <section className={panel}><h5 className="flex items-center gap-2 font-semibold"><ShieldCheck aria-hidden="true"/>تصريح إدارة المتحف / Venue &amp; Safety Clearance</h5><p>{ticket.authority||'Awaiting a claimed venue'}</p><ul className="list-inside list-disc">{ticket.constraints.map(c=><li key={c}>{c}</li>)}</ul><p className="text-xs">Proposed safety conditions — host must confirm suitability.</p><p role="status">{ticket.blocked?'LOCKED':record?.status??'PENDING_VENUE_APPROVAL'}</p>{delegated&&<p>Routed to Delegate (Original Assignee On Leave): {state.delegations[role].backupName}</p>}{record?.clearedAt&&<p>{record.clearedBy} · {record.clearedAt}</p>}{record?.notifications?.map(n=><p key={n.recipient}>In-app notification recorded for {n.recipient} · {n.at}</p>)}</section>;
}
function DelegateEditor({role}:{role:string}){
 const [s,set]=useSessionDraft<Governance>(key,emptyGovernance),d=s.delegations[role];const [name,setName]=useState(d?.backupName??'');
 return <div className="space-y-2 border-t py-3"><p>{role}</p><label className="block">Designated backup (same role)<input maxLength={100} className="ms-2 rounded border ps-3 pe-3 py-2" value={name} onChange={e=>setName(e.target.value)}/></label><button className="rounded border ps-3 pe-3 py-2 disabled:opacity-50" disabled={!name.trim()&&!d?.onLeave} onClick={()=>set(p=>setDelegation(p,role,!p.delegations[role]?.onLeave,name))}>{d?.onLeave?'Return from leave':'Set ON_LEAVE & route pending approvals'}</button><p>{d?.onLeave?`Routed to Delegate (Original Assignee On Leave): ${d.backupName}`:'Primary assignee active'}</p></div>;
}
export function GovernanceDesk({role,pending,blockedArtistIds=[]}:{role:string;pending:string[];blockedArtistIds?:string[]}){
 const [acting,setActing]=useSessionDraft<Record<string,string>>('acting-delegates:v1',{});
 const [s,set]=useSessionDraft<Governance>(key,emptyGovernance);const [host,setHost]=useState<string>(VENUE_SPACES[0].venueId),[identity,setIdentity]=useState<'primary'|'backup'>('primary');
 const hostRole=`VENUE:${host}`,current=`${hostRole}:${identity}`;
 return <details className={panel}><summary className="cursor-pointer font-semibold"><UserRoundForward className="inline size-5" aria-hidden="true"/> Active Delegate / تفويض المهام &amp; Venue Host</summary><p className="text-sm">Rehearsal identity selector — not authenticated access. In-app notices only; no external messages.</p><DelegateEditor key={role} role={role}/><label>Active role reviewer<select className="ms-2 rounded border ps-3 pe-3 py-2" value={acting[role]??'primary'} onChange={e=>setActing(p=>({...p,[role]:e.target.value}))}><option value="primary">Primary assignee</option><option value="backup">Designated backup</option></select></label><h3>Pending approval routing · {assignee(role,s.delegations)??'BLOCKED — no backup'}</h3>{pending.map(p=><p key={p}>{p} · {s.delegations[role]?.onLeave?'Routed to Delegate (Original Assignee On Leave)':'Primary queue'}</p>)}
 <h3 className="flex items-center gap-2 font-semibold"><Building2 aria-hidden="true"/>Venue Host — read-only ticket details</h3><label>Venue authority<select className="ms-2 rounded border ps-3 pe-3 py-2" value={host} onChange={e=>{setHost(e.target.value);setIdentity('primary');}}>{VENUE_SPACES.map(v=><option key={v.venueId} value={v.venueId}>{v.curator}</option>)}</select></label><DelegateEditor key={hostRole} role={hostRole}/><label>Rehearsal reviewer<select className="ms-2 rounded border ps-3 pe-3 py-2" value={identity} onChange={e=>setIdentity(e.target.value as 'primary'|'backup')}><option value="primary">Designated venue authority</option><option value="backup">Designated same-role backup</option></select></label>
 {Object.values(s.tickets).filter(t=>t.venueId===host).map(t=><article key={t.id} className="space-y-2 rounded border bg-white ps-4 pe-4 py-4"><h4>{t.title} · {t.artistId}</h4><p>{t.authority}</p>{t.constraints.map(c=><p key={c}>{c}</p>)}<p>{t.status}</p><p>Assigned to: {assignee(hostRole,s.delegations)??'Unassigned'}</p><button disabled={t.blocked||blockedArtistIds.includes(t.artistId)||t.status!=='PENDING_VENUE_APPROVAL'||current!==assignee(hostRole,s.delegations)} className="rounded bg-[#8B261E] ps-4 pe-4 py-2 text-white disabled:opacity-50" onClick={()=>set(p=>blockedArtistIds.includes(t.artistId)?p:clearVenue(p,t.id,current,new Date().toISOString()))}>Clear for Venue — rehearsal</button>{t.notifications?.map(n=><p key={n.recipient}>Notified in session: {n.recipient} · {n.at}</p>)}</article>)}
 </details>;
}

export function DelegatedRoleGate({role,children}:{role:string;children:React.ReactNode}){
 const [s]=useSessionDraft<Governance>(key,emptyGovernance),[acting]=useSessionDraft<Record<string,string>>('acting-delegates:v1',{});
 const blocked=`${role}:${acting[role]??'primary'}`!==assignee(role,s.delegations);
 return <>{blocked&&<p role="status" className="bg-amber-50 ps-5 pe-5 py-4">Approval queue rerouted. Select the designated reviewer in Active Delegate to continue this rehearsal.</p>}<div inert={blocked} className={blocked?'opacity-50':''}>{children}</div></>;
}

