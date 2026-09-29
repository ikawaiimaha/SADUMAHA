import {useState} from 'react';
import {Hammer} from 'lucide-react';
import type {CommissionState} from '../types';
import type {CommissionAction} from '../data/commissionScenario';
import {LOCAL_VENDORS} from '../data/logisticsExpansion';
export function LocalProductionLedger({state,onRecord}:{state:CommissionState;onRecord:(action:CommissionAction)=>void}) {
 const [reference,setReference]=useState('');
 const c=state.contracts[0];
 if(c?.productionOrigin!=='LOCAL_FABRICATION')return null;
 const rows=state.localProductionEvents??[];
 const current=rows.filter(r=>r.contractId===c.id&&r.revision===state.agreementRevision);
 const stage=current.some(r=>r.stage==='PROOF_RECORDED')?'DELIVERED':'PROOF_RECORDED';
 const locked=!['ARTIST_APPROVED','LOCKED'].includes(c.status)||state.installationStatus==='EXECUTIVE_IMPOUND'||state.installationStatus==='ARCHIVED_CLOSED'||current.some(r=>r.stage==='DELIVERED');
 return <section className="rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-4 pe-4 py-4 text-start space-y-3"><h2 className="flex gap-2 text-xl"><Hammer aria-hidden="true"/>Local Production Ledger / سجل الإنتاج المحلي</h2><p>{c.proposedWorkTitle} · {LOCAL_VENDORS.find(v=>v.id===c.localVendorId)?.name}</p><p>Session rehearsal. Vendor delivery alone does not release payment; Logistics must inspect condition.</p><label className="block">{stage==='PROOF_RECORDED'?'Vendor proof / approval reference':'Vendor delivery reference'}<input className="block w-full rounded border ps-3 pe-3 py-2" disabled={locked} maxLength={200} value={reference} onChange={e=>setReference(e.target.value)}/></label><button className="rounded bg-[#8B261E] text-white ps-4 pe-4 py-2 disabled:opacity-50" disabled={locked||!reference.trim()} onClick={()=>{onRecord({type:'local-production',actor:'COORDINATOR',stage,reference,at:new Date().toISOString()});setReference('');}}>{stage==='PROOF_RECORDED'?'Record vendor proof approval':'Record local delivery'}</button><ul>{rows.map((r,i)=><li key={i}>{r.stage} · {r.reference} · {r.at} · Revision {r.revision}{r.revision!==state.agreementRevision?' — superseded':''}</li>)}</ul></section>;
}
