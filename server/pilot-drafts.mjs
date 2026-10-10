import express from 'express';
import { join } from 'node:path';
import { openEcosystemRepository } from './unified-ecosystem.mjs';
import { requireRecordAccess } from './acquisition.mjs';
import { draftContext, compareDraftContext, draftWorkflowRoles } from './draft-comparison.mjs';

// Without an explicit workflow the draft service serves only collection and print roles. Treatment-only
// roles (Artist, Museum_Operations) must name the treatment workflow, so it never widens the others.
const defaultWorkflows = ['collection','print'];
const rolesFor = workflows => [...new Set(workflows.flatMap(kind => draftWorkflowRoles[kind] ?? []))];
const keys = ['tRecord','tAuthorize','tVenue','tEngineering','tFinancial','tOther','tSample','tArtist','tComplete','amendTreatment','acceptCollection','source','amendSource','pickup','amendPickup','plan','technical','cost','reopen','packing','package','amendPackage','preflight','editorial','executive','dispatch','start','supplier','production','delivery','acceptance','correction','stop','owners'];
const fields = new Set('address city country contact sourceRef timezone start end closures conflict pickupDate specification packingOwner amount technical technicalReason reference evidenceId supplier quantity size stock finishing profile deliveryDate note source sender receivedAt deliveryId primaryId backupId active reason ownerId dueAt workTitle method decisionMakerName decisionMakerCapacity decisionMakerAccountId conditions lettersTreated'.split(' '));
const fail = (status,message) => { throw Object.assign(new Error(message),{status}); };

/** Private working input only. This store never writes to authoritative workflow state. */
export async function createPilotDrafts({directory,repository,now=()=>new Date()}) {
  const store=await openEcosystemRepository(join(directory,'private-drafts.json'),{format:1,version:0,entries:[]});
  function scope(actor,id,write=false,workflows=defaultWorkflows) {
    const state=repository.read(),artwork=state.artworks.find(a=>a.id===id);
    if(!actor||!artwork||actor.exhibitionId!==artwork.exhibitionId||!rolesFor(workflows).includes(actor.role))fail(403,'Draft access is not available for this account.');
    requireRecordAccess(actor,artwork);
    if(write&&(artwork.acquisition||artwork.lifecycleStatus==='ARCHIVED_CLOSED'))fail(409,'This record is read only. Your earlier draft remains available for reference.');
    return state;
  }
  const entryFor=(state,actor,id)=>state.entries.find(e=>e.actorId===actor.id&&e.role===actor.role&&e.artworkId===id&&e.exhibitionId===actor.exhibitionId);
  function clean(value,version) {
    if(!value||!keys.includes(value.key)||!['collection','print','treatment'].includes(value.kind)||!['decision','upload','assign','return'].includes(value.panel)||typeof value.taskId!=='string'||value.taskId.length>200||!Number.isInteger(value.baseVersion)||value.baseVersion<0||value.baseVersion>version)fail(422,'Invalid draft task or record revision.');
    if(!value.fields||Array.isArray(value.fields)||typeof value.fields!=='object'||Object.keys(value.fields).length>45)fail(422,'Invalid draft fields.');
    const safe={};
    for(const [key,text] of Object.entries(value.fields)) {
      if(!fields.has(key)||typeof text!=='string'||text.length>2000)fail(422,'Drafts contain working text only; approval checks and file bytes cannot be stored.');
      safe[key]=text;
    }
    if(JSON.stringify(safe).length>18000)fail(422,'Draft is too large.');
    return {taskId:value.taskId,key:value.key,kind:value.kind,panel:value.panel,baseVersion:value.baseVersion,fields:safe,
      fileName:typeof value.fileName==='string'?value.fileName.slice(0,180):null,attempted:value.attempted===true};
  }
  const read=(actor,id,workflow)=>{
    if(workflow!==undefined&&!Object.hasOwn(draftWorkflowRoles,workflow))fail(422,'Unknown draft workflow.');
    const state=scope(actor,id,false,workflow?[workflow]:defaultWorkflows),entry=entryFor(store.read(),actor,id);
    if(entry?.draft && !draftWorkflowRoles[entry.draft.kind]?.includes(actor.role))fail(403,'This account cannot access this workflow.');
    return {revision:entry?.revision??0,draft:entry?.draft??null,currentVersion:state.version,
      comparison:entry?.draft?compareDraftContext(entry.baseline,draftContext(state,id,entry.draft.kind),state.version):null};
  };
  const write=async(actor,id,command)=>{
    if(!Number.isInteger(command?.expectedRevision)||command.expectedRevision<0)fail(422,'Draft revision is required.');
    // Serialize CAS independently of business writes. Recheck access inside the queue.
    return store.transaction(state=>{
      let entry=entryFor(state,actor,id);
      const kind=command.draft?.kind??entry?.draft?.kind;
      const business=scope(actor,id,command.draft!==null,Object.hasOwn(draftWorkflowRoles,kind)?[kind]:defaultWorkflows);
      if((entry?.revision??0)!==command.expectedRevision)fail(409,'This draft changed in another tab. Reload the saved draft before replacing it.');
      const draft=command.draft===null?null:{...clean(command.draft,business.version),savedAt:now().toISOString()};
      if(draft && !draftWorkflowRoles[draft.kind]?.includes(actor.role))fail(403,'This account cannot access this workflow.');
      // Keep the original context across autosaves and restarts. A late first save
      // cannot manufacture the state of an earlier version that we did not see.
      const sameDraft=draft && entry?.draft && ['taskId','kind','key','panel','baseVersion'].every(key=>draft[key]===entry.draft[key]);
      const baseline=draft ? sameDraft ? entry.baseline??null : draft.baseVersion===business.version ? draftContext(business,id,draft.kind) : null : null;
      if(!entry){entry={actorId:actor.id,role:actor.role,artworkId:id,exhibitionId:actor.exhibitionId,revision:0,draft:null};state.entries.push(entry);}
      entry.revision++;entry.draft=draft;entry.baseline=baseline;
      // Keep the revision tombstone: delayed writes cannot recreate a cleared draft.
      return {revision:entry.revision,draft,currentVersion:business.version};
    });
  };
  return {read,write};
}

export function draftsRouter(service) {
  const router=express.Router();
  router.use((req,res,next)=>{if(req.get('x-sadu-draft-owner')!==res.locals.actor.id)return res.status(403).json({error:'The signed-in account changed. Restore your account before opening this draft.'});next();});
  router.get('/:id',(req,res,next)=>{try{res.json(service.read(res.locals.actor,req.params.id,typeof req.query.workflow==='string'?req.query.workflow:undefined));}catch(e){next(e);}});
  router.put('/:id',async(req,res,next)=>{try{res.json(await service.write(res.locals.actor,req.params.id,req.body));}catch(e){next(e);}});
  return router;
}
