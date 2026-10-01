import { useEffect, useState } from 'react';
import { ThemeEditor } from './ThemeWorkspace';
import type { ThemeEvent, ThemeState } from '../lib/themeWorkflow';
import type { SandboxRole } from '../lib/executiveSandbox';

type View={decisions:{id:string;actorId:string;action:string;revision:number;at:string}[];theme:ThemeState;owner:string;planningAlerts:{id:string;message:string;revision:number}[];publications:{id:string;revision:number;hash:string}[];invitationReadiness:{blockers:string[]}};
const endpoint='/api/review/spatial-ledger/theme';
export default function ConnectedTheme({role,onDirtyChange}:{role:SandboxRole;onDirtyChange:(dirty:boolean)=>void}) {
  const [view,setView]=useState<View>();
  const [error,setError]=useState('');
  const [generation,setGeneration]=useState(0);
  useEffect(()=>{let active=true;void fetch(endpoint,{cache:'no-store'}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error);if(active)setView(data);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[generation]);
  const save=async(event:ThemeEvent)=>{
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(event)});
    const theme=await response.json();
    if(!response.ok)throw new Error(`${theme.error} Your edits remain here. Reload the shared theme to review competing changes.`);
    const updated=await fetch(endpoint,{cache:'no-store'});
    if(updated.ok)setView(await updated.json());
    return theme as ThemeState;
  };
  return <div className="space-y-5">
    <p role="alert">{error}</p>
    <button className="underline" onClick={()=>{if(window.confirm('Reload the shared theme? Unsaved edits in this theme will be discarded.')){setView(undefined);setError('');setGeneration(n=>n+1);}}}>Reload shared theme</button>
    {view?<><p className="text-sm">Assigned next owner: {view.owner.replaceAll('_',' ')}</p>
      {view.planningAlerts.slice(-1).map(a=><p key={a.id} role="status" className="border-s-2 border-[#8B261E] ps-4">{a.message} · decision revision {a.revision}</p>)}
      <ThemeEditor key={generation} role={role} onDirtyChange={onDirtyChange} remote={{initial:view.theme,save}}/>
      <details><summary>Attributed decision history</summary><ol>{view.decisions.map(d=><li key={d.id}>{d.action} · {d.actorId} · revision {d.revision} · {new Date(d.at).toLocaleString()}</li>)}</ol></details>
      <details className="rounded-xl border border-[#DED5C4] p-4"><summary>Invitation handoff readiness</summary><p>External dispatch remains paused. Theme publication alone does not authorize invitations.</p>{view.invitationReadiness.blockers.length?<ul>{view.invitationReadiness.blockers.map(b=><li key={b}>{b}</li>)}</ul>:<p>Theme, template, roster and deadline gates are present. Recipient-specific preparation remains on the invitations desk.</p>}{view.publications.map(p=><p key={p.id} className="text-xs break-all">Preserved publication revision {p.revision} · SHA-256 {p.hash}</p>)}</details>
    </>:<p role="status">Loading shared theme…</p>}
  </div>;
}
