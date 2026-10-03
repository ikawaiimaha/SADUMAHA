import { randomUUID } from 'node:crypto';
import { requireRecordAccess } from './acquisition.mjs';
import { collectionReadiness, packingTransition } from '../src/logistics/collectionRules.mjs';
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const text = (v, max = 300) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const date = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v;
const range = r => r && date(r.start) && date(r.end) && r.start <= r.end;
const current = (s, id) => (s.collectionRevisions ?? []).filter(r => r.artworkId === id).at(-1) ?? null;
export function collectionView(s, artworkId) {
  const record = current(s, artworkId);
  const assignment = s.collectionAssignments?.[artworkId] ?? { primaryId:'pilot-Logistics', backupId:null, activeId:'pilot-Logistics' };
  const readiness = collectionReadiness({ details: !!record, conflict: record?.conflict, confirmed: !!record?.confirmation, planned: !!record?.plan, accepted: assignment.acceptedBy === assignment.activeId, packing: record?.packing });
  return { record, assignment, ...readiness, ready: !readiness.blocker };
}
export function requireCollectionReady(s, id) {
  const view = collectionView(s, id);
  if (!view.ready) fail(409, view.blocker);
  return view.record;
}
export function collectionTasks(s, actor) {
  if (!s.collectionWorkflowEnabled) return [];
  return s.artworks.filter(a=>a.exhibitionId===actor.exhibitionId && !a.acquisition && a.lifecycleStatus!=='ARCHIVED_CLOSED' && a.physicalStatus==='Pending_Shipment').flatMap(a=>{
    try { requireRecordAccess(actor,a); } catch { return []; }
    const view=collectionView(s,a.id);
    if (!view.blocker) return [];
    if (actor.role!=='General_Exhibition_Coordinator' && (actor.role!==view.role || (view.role==='Logistics' && actor.id!==view.assignment.activeId))) return [];
    return [{id:`${a.id}-collection`,taskType:'collection',owner:view.role,ownerId:view.role==='Logistics'?view.assignment.activeId:null,title:view.blocker,blocker:view.blocker,href:'#collection-plan',artworkId:a.id,deadline:view.record?.availability.end??null,timezone:view.record?.timezone??null}];
  });
}
export function createCollectionService(repository, accounts) {
  const scoped=(s,actor,id)=>{
    const artwork=s.artworks.find(a=>a.id===id && a.exhibitionId===actor?.exhibitionId);
    if(!artwork||!['Logistics','Technical','Finance','General_Exhibition_Coordinator'].includes(actor?.role)) fail(403,'Collection access is restricted to the assigned operational roles.');
    requireRecordAccess(actor,artwork);
    return artwork;
  };
  return {
    read(actor,id) { const s=repository.read();scoped(s,actor,id);return {version:s.version,...collectionView(s,id),accounts:accounts.filter(a=>a.role==='Logistics'&&a.exhibitionId===actor.exhibitionId).map(a=>({id:a.id,name:a.name})),paused:true}; },
    mutate(actor,command) { return repository.transaction(s=>{
      const a=scoped(s,actor,command.artworkId);
      if(s.version!==command.version) fail(409,'Shared record changed. Refresh and review before saving.');
      if(a.acquisition||a.lifecycleStatus==='ARCHIVED_CLOSED'||a.physicalStatus!=='Pending_Shipment') fail(409,'This artwork is no longer available for collection planning.');
      const view=collectionView(s,a.id);
      if(command.action==='ASSIGN') {
        if(actor.role!=='General_Exhibition_Coordinator') fail(403,'Only the General Coordinator can assign or activate backup ownership.');
        const valid=id=>accounts.some(x=>x.id===id&&x.role==='Logistics'&&x.exhibitionId===actor.exhibitionId);
        if(!valid(command.primaryId)||!valid(command.backupId)||command.primaryId===command.backupId||![command.primaryId,command.backupId].includes(command.activeId)||!text(command.reason)) fail(422,'Choose distinct Logistics owners, an active owner and a handover reason.');
        s.collectionAssignments??={};s.collectionAssignments[a.id]={primaryId:command.primaryId,backupId:command.backupId,activeId:command.activeId,acceptedBy:null};
      } else if(command.action==='ACCEPT') {
        if(actor.role!=='Logistics'||actor.id!==view.assignment.activeId) fail(403,'Only the named owner may accept the handoff.');
        if(view.assignment.acceptedBy===actor.id) fail(409,'This handoff is already accepted.');
        s.collectionAssignments??={};s.collectionAssignments[a.id]={...view.assignment,acceptedBy:actor.id,acceptedAt:new Date().toISOString()};
      } else {
        const packingAction=['PACK','TECHNICAL','COST','EVIDENCE','REOPEN'].includes(command.action);
        const requiredRole=command.action==='TECHNICAL'?'Technical':command.action==='COST'?'Finance':'Logistics';
        if(actor.role!==requiredRole||(requiredRole==='Logistics'&&actor.id!==view.assignment.activeId)) fail(403,'Only the authorized owner can perform this collection action.');
        if(command.action!=='SAVE' && view.assignment.acceptedBy!==view.assignment.activeId) fail(409,'The named Logistics owner must accept this handoff first.');
        let record;
        if(command.action==='SAVE') {
          const d=command.details;
          if(!d||!text(d.address)||!text(d.city)||!text(d.country)||!text(d.contact)||!text(d.sourceRef)||typeof d.conflict!=='boolean'||!range(d.availability)||!Array.isArray(d.closures)||d.closures.length>20||!d.closures.every(range)) fail(422,'Complete the collection address, contact, source, valid availability and closure dates.');
          try { if(!text(d.timezone,80))throw Error();new Intl.DateTimeFormat('en',{timeZone:d.timezone}).format(); } catch { fail(422,'Enter a valid collection timezone, for example Europe/Paris.'); }
          record={artworkId:a.id,address:d.address.trim(),city:d.city.trim(),country:d.country.trim(),contact:d.contact.trim(),sourceRef:d.sourceRef.trim(),timezone:d.timezone,conflict:d.conflict,availability:{start:d.availability.start,end:d.availability.end},closures:d.closures.map(r=>({start:r.start,end:r.end})),confirmation:null,plan:null,packing:null};
        } else {
          if(!view.record) fail(409,'Save collection information first.');
          record=structuredClone(view.record);
          if(packingAction) {
            if(!record.confirmation||!record.plan||record.conflict) fail(409,'Confirm collection details and a valid pickup plan first.');
            record.packing=packingTransition(record.packing,{...command,type:command.action},actor.role);
          } else if(command.action==='CONFIRM') {
            if(record.conflict||command.checked!==true) fail(409,'Resolve conflicts and explicitly verify the source before confirmation.');
            record.confirmation={actorId:actor.id,at:new Date().toISOString(),sourceRef:record.sourceRef};
          } else if(command.action==='PLAN') {
            if(!record.confirmation||record.conflict) fail(409,'Confirmed, conflict-free collection details are required.');
            const day=command.pickupDate;
            if(!date(day)||day<record.availability.start||day>record.availability.end) fail(422,'Pickup must fall within the confirmed local-date availability window.');
            if(record.closures.some(r=>day>=r.start&&day<=r.end)) fail(409,'Pickup conflicts with a confirmed closure (both boundary dates are closed).');
            record.plan={pickupDate:day,timezone:record.timezone,state:'PLANNED_ONLY',actorId:actor.id,at:new Date().toISOString()};
            record.packing=null;
          } else fail(422,'Unknown collection action.');
        }
        record.id=randomUUID();record.previousId=view.record?.id??null;record.actorId=actor.id;record.at=new Date().toISOString();
        s.collectionRevisions??=[];s.collectionRevisions.push(record);
      }
      // Operational metadata only: addresses, contact details and handover prose stay out of audit payloads.
      s.decisions.push({id:randomUUID(),actorId:actor.id,targetId:a.id,action:`COLLECTION_${command.action}`,recordId:current(s,a.id)?.id??null,at:new Date().toISOString()});
      if(command.action==='ASSIGN') {s.collectionHandovers??=[];s.collectionHandovers.push({artworkId:a.id,...s.collectionAssignments[a.id],enteredBy:actor.id,reason:command.reason,at:new Date().toISOString()});}
      return {saved:true};
    }); }
  };
}
