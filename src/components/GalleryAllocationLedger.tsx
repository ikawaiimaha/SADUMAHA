import {Ruler, AlertTriangle} from 'lucide-react';
import {useSessionDraft} from '../context/SessionDrafts';
import {VENUE_SPACES, activeSpatialClaim, type SpatialClaim} from '../data/spatialClaims';
import type {ArtworkRoster} from '../data/artworkRoster';
import {requiredWallMeters} from '../data/logisticsExpansion';

export function GalleryAllocationLedger({artistId}:{artistId?:string}) {
 const [capacities,setCapacities]=useSessionDraft<Record<string,string>>('gallery-capacity:v1',{});
 const [claims]=useSessionDraft<SpatialClaim[]>('spatial-claims:biennial-2026',[]);
 const [rosters]=useSessionDraft<Record<string,ArtworkRoster>>('artwork-rosters:v1',{});
 const spaces=artistId?VENUE_SPACES.filter(s=>activeSpatialClaim(claims,artistId)?.spaceId===s.id):VENUE_SPACES;
 return <section className="rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-4 pe-4 py-4 text-start space-y-3">
  <h2 className="flex gap-2 text-xl"><Ruler aria-hidden="true"/>Gallery Allocation Ledger / توزيع المساحات</h2>
  <p>Session planning estimate: artwork width + 40 cm per artwork. This does not replace venue safety clearance.</p>
  {!spaces.length&&<p>No approved spatial claim. Ask the Coordinator to allocate a gallery.</p>}
  <div className="grid gap-3 md:grid-cols-2">{spaces.map(space=>{
   const claim=claims.find(c=>c.spaceId===space.id);
   const roster=claim?rosters[claim.artistId]:undefined;
   const required=requiredWallMeters(roster?.items??[]),capacity=Number(capacities[space.id]);
   const valid=Number.isFinite(capacity)&&capacity>0;
   return <article key={space.id} className="rounded border bg-[#FFFDF7] ps-3 pe-3 py-3 space-y-2"><h3>{space.en} / {space.ar}</h3>
    {artistId?<p>Allocated capacity: {valid?`${capacity} m`:'Pending Logistics measurement'}</p>:<label className="block">Measured running wall meters<input type="number" min="0.01" step="0.01" className="block w-full rounded border ps-3 pe-3 py-2" value={capacities[space.id]??''} onChange={e=>setCapacities(previous=>({...previous,[space.id]:e.target.value}))}/></label>}
    <p>{claim?.artistName??'Unclaimed'} · Required: {required===null?'Awaiting complete artwork widths':`${required.toFixed(2)} m`} {roster?.status==='DRAFT'?'(draft estimate)':''}</p>
    {valid&&required!==null&&required>capacity&&<p role="alert" className="flex gap-2 text-red-800"><AlertTriangle aria-hidden="true"/>Spatial capacity exceeded. Please revise artwork dimensions or request additional wall space.</p>}
   </article>;
  })}</div>
 </section>;
}
