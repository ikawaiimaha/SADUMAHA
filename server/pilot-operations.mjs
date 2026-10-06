import express from 'express';
import { createHash, randomUUID } from 'node:crypto';
import { hashUploadStream } from './file-integrity.mjs';
import { requireRecordAccess } from './acquisition.mjs';
import { collectionView } from './pilot-collection.mjs';
import { dispatchView } from './pilot-dispatch.mjs';
import { amendmentImpact, requireImpactConfirmation, recordImpactReview } from './amendment-impact.mjs';
import { startRenewal, finishRenewal, requireRenewalAcceptance, changeRenewal, renewalView, hasRenewal } from './renewal-tasks.mjs';
import { packingTransition } from '../src/logistics/collectionRules.mjs';
import { createPublishingRecord, reducePublishingRecord, selectPublishingRecord, PRINT_ROUTE_ID } from '../src/data/publishingRecord.ts';

const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const text = (v, max = 1000) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const shippingRoles = ['Logistics', 'Technical', 'Finance', 'General_Exhibition_Coordinator'];
const printRoles = ['Exhibition_Coordinator', 'Editorial', 'Technical', 'Chairman', 'General_Exhibition_Coordinator'];
const roles = [...new Set([...shippingRoles, ...printRoles])];
const taskRoles = { 'packing-technical': 'Technical', 'packing-cost': 'Finance', 'print-review': 'Editorial' };
const stamp = (actor, at) => ({ actorId: actor.id, at });
const printJob = (s, id) => s.printJobs?.[id] ?? { record: createPublishingRecord(), packages: [], deliveries: [] };
const latestCollection = (s, id) => (s.collectionRevisions ?? []).filter(r => r.artworkId === id).at(-1);
const packingScope = r => r ? digest({ address: r.address, city: r.city, country: r.country, source: r.sourceRef, availability: r.availability, closures: r.closures, timezone: r.timezone, plan: r.plan, packing: r.packing && { specification: r.packing.specification, owner: r.packing.owner, amount: r.packing.amount, requiresTechnical: r.packing.requiresTechnical, technicalReason: r.packing.technicalReason, technicalReference: r.packing.technicalReference, costReference: r.packing.costReference } }) : '';
const currentPackage = job => job.packages.find(p => p.revision === job.record.version);
export function localDay(now, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  return ['year','month','day'].map(k => parts.find(p => p.type === k).value).join('-');
}
export function assertTaskAcceptance(s, actor, artworkId, key) {
  const task = s.operationTasks?.[`${artworkId}:${key}`];
  if (task && (task.ownerId !== actor.id || task.acceptedBy !== actor.id)) fail(409, 'The named task owner must accept this handoff first.');
}

export function createPilotOperations({ repository, storage, readObject, accounts, now = () => new Date() }) {
  const scope = (s, actor, id, allowed = roles) => {
    const a = s.artworks.find(x => x.id === id && x.exhibitionId === actor?.exhibitionId);
    if (!a || !allowed.includes(actor?.role)) fail(403, 'This account cannot access this workflow.');
    requireRecordAccess(actor, a); return a;
  };
  const writable = (s, actor, id, version) => {
    const a = scope(s, actor, id);
    if (a.lifecycleStatus === 'ARCHIVED_CLOSED' || a.acquisition) fail(409, 'This record is frozen.');
    if (version !== s.version) fail(409, 'The shared record changed. Refresh and review before retrying.');
    return a;
  };
  const evidence = (s, actor, id, evidenceId, kind) => {
    scope(s, actor, id);
    const e = (s.operationalEvidence ?? []).find(x => x.id === evidenceId && x.artworkId === id);
    if (!e || (kind && e.kind !== kind)) fail(422, 'Select evidence belonging to this record and purpose.');
    if (!(e.kind === 'PACKING' ? shippingRoles : printRoles).includes(actor.role)) fail(403, 'Evidence access is restricted to its workflow.');
    return e;
  };
  const bytesFor = async e => {
    let bytes; try { bytes = await readObject(e.objectId); } catch { fail(409, 'Evidence file is unavailable. Restore it before proceeding.'); }
    if (createHash('sha256').update(bytes).digest('hex') !== e.file_hash) fail(409, 'Evidence integrity check failed. Restore the recorded file version.');
    return bytes;
  };
  const good = async e => { if (!e) return false; try { await bytesFor(e); return true; } catch { return false; } };
  const receipt = (s, actor, id, command, fingerprint) => {
    if (!text(command.operationId, 100)) fail(422, 'A unique operation identifier is required.');
    const prior = (s.operationReceipts ?? []).find(r => r.id === command.operationId && r.actorId === actor.id);
    if (prior && (prior.artworkId !== id || prior.fingerprint !== fingerprint)) fail(409, 'This operation identifier was already used for different data.');
    return prior;
  };
  const complete = (s, actor, id, command, fingerprint, result) => {
    const at = now().toISOString();
    (s.operationReceipts ??= []).push({ id: command.operationId, artworkId: id, fingerprint, ...stamp(actor, at), result });
    const pkg=currentPackage(printJob(s,id));
    const printAction=['SET_PRINT_PACKAGE','PREFLIGHT','REVIEW_PRINT','APPROVE_PRINT','DISPATCH_PRINT','ACK_PRINT','START_PRINT','COMPLETE_PRINT','RECORD_DELIVERY','ACCEPT_DELIVERY','CORRECT_PRINT','STOP_PRINT'].includes(command.action);
    const event={ id: randomUUID(), targetId: id, action: command.action ?? `UPLOAD_${command.kind}`, ...stamp(actor, at), ...(printAction&&pkg?{printRevision:pkg.revision,proofId:pkg.proofId,proofHash:pkg.proofHash,specificationHash:digest(pkg.spec)}:{}), ...(command.action==='VERIFY_PACKING'?{evidenceId:command.evidenceId,packingScope:packingScope(latestCollection(s,id))}:{}) };
    s.decisions.push(event);
    if(printAction&&pkg)(pkg.decisions??=[]).push(event);
    return result;
  };
  const authorizeUpload = (s, actor, id, kind) => {
    scope(s, actor, id, kind === 'PACKING' ? ['Logistics'] : kind === 'PRINT_PROOF' ? ['Exhibition_Coordinator','General_Exhibition_Coordinator'] : kind === 'PREFLIGHT' ? ['Technical','Editorial'] : []);
    if (kind === 'PACKING') {
      const view = collectionView(s, id);
      if (view.assignment.activeId !== actor.id || view.assignment.acceptedBy !== actor.id || !view.record?.packing) fail(409, 'Accept the collection handoff and record a packing plan first.');
    }
  };
  const tasksFor = (s, id, readiness, job, actor) => {
    const result = [];
    const coordinator = actor.role === 'General_Exhibition_Coordinator';
    const collection = collectionView(s, id), pkg = currentPackage(job);
    const add = task => { if (coordinator || task.ownerId === actor.id || (!task.ownerId && task.owner === actor.role)) result.push(task); };
    if (shippingRoles.includes(actor.role)) {
      if (collection.assignment.acceptedBy !== collection.assignment.activeId) add({ id: `${id}:collection-acceptance`, owner: 'Logistics', ownerId: collection.assignment.activeId, title: 'Accept collection responsibility', blocker: 'Assignment is not acceptance.', href: '#collection-plan' });
      if (readiness.expired) add({ id: `${id}:pickup-expired`, owner: 'Logistics', ownerId: collection.assignment.activeId, title: 'Reconfirm the expired pickup plan', blocker: 'The local pickup date or availability window has elapsed. No collection is inferred.', href: '#collection-plan', overdue: true });
    }
    for (const [key, role] of Object.entries(taskRoles)) {
      if(hasRenewal(s,id,{'packing-technical':'technical','packing-cost':'cost','print-review':'editorial'}[key]))continue;
      const needed = key === 'packing-technical' ? collection.state === 'TECHNICAL_REVIEW_REQUIRED' : key === 'packing-cost' ? collection.state === 'COST_REVIEW_REQUIRED' : !!pkg && selectPublishingRecord(job.record).stage === 'manager-review';
      if (!needed) continue;
      const task = s.operationTasks?.[`${id}:${key}`];
      add({ id: `${id}:${key}`, key, owner: role, ownerId: task?.ownerId ?? null, title: key === 'print-review' ? 'Review this print package' : key === 'packing-cost' ? 'Review packing cost' : 'Review packing specification', blocker: !task ? 'No named task owner recorded.' : task.acceptedBy !== task.ownerId ? 'The assigned owner has not accepted.' : 'Review the current evidence.', dueAt: task?.dueAt ?? null, overdue: !!task && now().getTime() > Date.parse(task.dueAt), accepted: !!task?.acceptedBy, href: '#shared-operations' });
    }
    return result;
  };
  const readinessFor = async (s, id) => {
    const collection = collectionView(s, id), r = collection.record, a = s.artworks.find(x => x.id === id);
    const e = (s.operationalEvidence ?? []).find(e => e.id === r?.packing?.evidenceFileId);
    const verified = !!e && r.packing.evidenceScope === packingScope(r) && await good(e);
    const today = r ? localDay(now(), r.timezone) : null;
    const expired = !!r && (today > r.availability.end || !!r.plan && today > r.plan.pickupDate);
    const dispatch = s.artworks[0]?.id === id ? dispatchView(s) : { ready: false, blocker: 'No condition workflow linked to this artwork.' };
    const blockers = [collection.blocker, !verified && 'Inspect and verify the packing photograph or PDF for the current plan.', expired && 'Pickup window has elapsed; confirm new availability and a new plan.', !dispatch.ready && dispatch.blocker, a?.physicalStatus !== 'Pending_Shipment' && 'This is no longer a pending collection.'].filter(Boolean);
    return { preparationComplete: collection.ready, packingVerified: verified, conditionAndAgreementCleared: dispatch.ready, expired, today, departureReady: blockers.length === 0, blockers, transportBooked: false, handoverRecorded: false };
  };
  return {
    async read(actor, id) {
      const s = repository.read(); scope(s, actor, id);
      const job = printJob(s, id), readiness = await readinessFor(s, id);
      const files = (s.operationalEvidence ?? []).filter(e => e.artworkId === id && (e.kind === 'PACKING' ? shippingRoles : printRoles).includes(actor.role)).map(({objectId, ...e}) => ({...e, url: `/api/review/pilot/operations/${id}/evidence/${e.id}`}));
      const renewals=renewalView(s,id,actor,accounts,now().toISOString(),files);
      const renewalActions=renewals.filter(c=>!c.supersededAt).flatMap(c=>c.tasks.filter(t=>!['COMPLETE','NOT_REQUIRED'].includes(t.status)&&(actor.role==='General_Exhibition_Coordinator'||t.ownerId===actor.id)).map(t=>({id:t.id,owner:t.ownerId?accounts.find(a=>a.id===t.ownerId)?.role:'General_Exhibition_Coordinator',ownerId:t.ownerId,title:t.title,blocker:t.blocker,dueAt:t.dueAt,overdue:t.overdue,href:'#renewal-queue',renewal:true})));
      return { version: s.version, serverTime: now().toISOString(), mode: 'local-simulation', readiness: shippingRoles.includes(actor.role) ? readiness : null, job: printRoles.includes(actor.role) ? job : null, files, renewals, tasks: [...tasksFor(s,id,readiness,job,actor),...renewalActions], accounts: accounts.filter(a => a.exhibitionId === actor.exhibitionId).map(({id,name,role}) => ({id,name,role})), paused: true };
    },
    async requireDeparture(id) {
      const s = repository.read(), readiness = await readinessFor(s, id);
      if (!readiness.departureReady) fail(409, readiness.blockers[0]);
      if (repository.read().version !== s.version) fail(409, 'Record changed during evidence verification. Refresh.');
      return readiness;
    },
    async file(actor, id, evidenceId) { const e = evidence(repository.read(), actor, id, evidenceId); return { evidence: e, bytes: await bytesFor(e) }; },
    async upload(actor, id, command, stream) {
      const initial = repository.read(); authorizeUpload(initial,actor,id,command.kind);
      if (!text(command.name,160) || !text(command.source,500) || !text(command.sender,160)) fail(422, 'Filename, source reference and sender are required.');
      if (command.receivedAt && (!Number.isFinite(Date.parse(command.receivedAt)) || Date.parse(command.receivedAt) > now().getTime())) fail(422, 'Received time must be valid and cannot be in the future.');
      // Failed/interrupted staging objects are retained; only complete verified uploads get a document row.
      const staged = await storage.openStaging();
      let integrity; try { integrity = await hashUploadStream(stream, staged.stream, { maxBytes: 10 * 1024 * 1024 }); } catch { fail(422, 'Upload interrupted, empty or larger than 10 MB. No evidence was committed.'); }
      const bytes = await readObject(staged.objectId);
      const mime = bytes.subarray(0,5).toString() === '%PDF-' && bytes.subarray(-1024).includes(Buffer.from('%%EOF')) ? 'application/pdf' : bytes.subarray(0,8).toString('hex') === '89504e470d0a1a0a' ? 'image/png' : bytes.subarray(0,3).toString('hex') === 'ffd8ff' ? 'image/jpeg' : null;
      if (!mime || (command.kind !== 'PACKING' && mime !== 'application/pdf')) fail(422, 'Use a PDF, or a PNG/JPEG packing photograph. File content must match its format.');
      const fingerprint = digest({ ...command, version: undefined, ...integrity });
      return repository.transaction(s => {
        scope(s,actor,id); const prior = receipt(s,actor,id,command,fingerprint); if (prior) return prior.result;
        writable(s,actor,id,command.version); authorizeUpload(s,actor,id,command.kind);
        const entry = { id: randomUUID(), artworkId:id, objectId:staged.objectId, kind:command.kind, name:command.name.trim(), mime, source:command.source.trim(), sender:command.sender.trim(), receivedAt:command.receivedAt ?? null, ...integrity, ...stamp(actor,now().toISOString()), scope:command.kind==='PACKING'?packingScope(latestCollection(s,id)):null };
        (s.operationalEvidence ??= []).push(entry);
        return complete(s,actor,id,command,fingerprint,{ evidenceId:entry.id });
      });
    },
    async preview(actor, id, command) {
      if(command.action!=='SET_PRINT_PACKAGE')fail(422,'This action has no amendment preview.');
      return this.mutate(actor,id,command,true);
    },
    async mutate(actor, id, command, previewOnly=false) {
      const fingerprint = digest({...command,version:undefined});
      const work=async s => {
        const before=structuredClone(s);
        scope(s,actor,id); const prior=receipt(s,actor,id,command,fingerprint); if(prior&&!previewOnly)return prior.result;
        writable(s,actor,id,command.version);
        const at=now().toISOString(), allowed=(list)=>scope(s,actor,id,list);
        requireRenewalAcceptance(s,actor,id,command.action);
        if(['ASSIGN_RENEWAL','ACCEPT_RENEWAL','RETURN_RENEWAL'].includes(command.action)) {
          changeRenewal(s,actor,id,command,accounts,at);
        } else if(command.action==='VERIFY_PACKING') {
          allowed(['Logistics']); const view=collectionView(s,id), r=view.record;
          if(view.assignment.activeId!==actor.id||view.assignment.acceptedBy!==actor.id||!r?.packing)fail(409,'The accepted collection owner must review the packing evidence.');
          const e=evidence(s,actor,id,command.evidenceId,'PACKING'); await bytesFor(e);
          if(e.scope!==packingScope(r)||command.checked!==true)fail(409,'Inspect evidence for the current packing plan; older evidence cannot clear this hold.');
          if(!['PACKING_EVIDENCE_REQUIRED','READY_FOR_COLLECTION'].includes(view.state))fail(409,'Complete the technical and cost reviews before verifying packing completion.');
          const next=structuredClone(r);
          if(!next.packing.evidence)next.packing=packingTransition(next.packing,{type:'EVIDENCE',value:e.id},actor.role);
          next.packing={...next.packing,evidence:e.id,evidenceFileId:e.id,evidenceScope:e.scope,verifiedBy:actor.id,verifiedAt:at};
          next.id=randomUUID();next.previousId=r.id;next.actorId=actor.id;next.at=at;s.collectionRevisions.push(next);
        } else if(command.action==='ASSIGN_TASK') {
          allowed(['General_Exhibition_Coordinator']);const role=taskRoles[command.key];
          if(hasRenewal(s,id,{'packing-technical':'technical','packing-cost':'cost','print-review':'editorial'}[command.key]))fail(409,'Assign the revision-specific renewal task instead.');
          if(!role||!accounts.some(a=>a.id===command.ownerId&&a.role===role&&a.exhibitionId===actor.exhibitionId)||!text(command.reason)||!Number.isFinite(Date.parse(command.dueAt)))fail(422,'Choose the correct role, a due time and a handover reason.');
          s.operationTasks??={};const key=`${id}:${command.key}`;const old=s.operationTasks[key];
          s.operationTasks[key]={key:command.key,ownerId:command.ownerId,dueAt:new Date(command.dueAt).toISOString(),acceptedBy:null,reason:command.reason,...stamp(actor,at),previous:old??null};
        } else if(command.action==='ACCEPT_TASK') {
          const task=s.operationTasks?.[`${id}:${command.key}`];if(!task||task.ownerId!==actor.id||task.acceptedBy)fail(409,'Only the named pending owner can accept this task.');task.acceptedBy=actor.id;task.acceptedAt=at;
        } else {
          s.printJobs??={}; const job=s.printJobs[id]??={record:createPublishingRecord(),packages:[],deliveries:[]};
          const pkg=currentPackage(job);
          const mapped=actor.role==='Chairman'?'CHAIRMAN':actor.role==='Editorial'?'PUBLISHING_MANAGER':['Exhibition_Coordinator','General_Exhibition_Coordinator'].includes(actor.role)?'COORDINATOR':null;
          const transition=(type,extra={})=>{const next=reducePublishingRecord(job.record,{type,actor:mapped,at,version:job.record.version,...extra});if(next===job.record)fail(409,'This print action is not permitted at the current step.');job.record=next;};
          if(command.action==='SET_PRINT_PACKAGE') {
            allowed(['Exhibition_Coordinator','General_Exhibition_Coordinator']);
            const e=evidence(s,actor,id,command.evidenceId,'PRINT_PROOF');await bytesFor(e);const spec=command.spec;
            if(!spec||!['supplier','stock','size','finishing','profile','deliveryDate'].every(k=>text(spec[k],300))||!Number.isSafeInteger(spec.quantity)||spec.quantity<1||spec.quantity>1000000||!/^\d{4}-\d{2}-\d{2}$/.test(spec.deliveryDate)||!Number.isFinite(Date.parse(spec.deliveryDate))||new Date(spec.deliveryDate).toISOString().slice(0,10)!==spec.deliveryDate)fail(422,'Complete the print specification and a positive whole quantity.');
            transition('ATTACH_PRINT_PROOF');job.packages.push({revision:job.record.version,proofId:e.id,proofHash:e.file_hash,spec:Object.fromEntries(['supplier','quantity','size','stock','finishing','profile','deliveryDate'].map(k=>[k,spec[k]])),preflight:null,...stamp(actor,at)});
          } else {
            if(!pkg||command.revision!==pkg.revision)fail(409,'Select the current print package revision.');
            const proof=evidence(s,actor,id,pkg.proofId,'PRINT_PROOF');await bytesFor(proof);
            if(command.action==='PREFLIGHT') {
              allowed(['Technical','Editorial']);if(job.record.review||job.record.correction)fail(409,'Open a correction before changing reviewed preflight results.');
              const e=evidence(s,actor,id,command.evidenceId,'PREFLIGHT');await bytesFor(e);
              if(typeof command.passed!=='boolean'||!text(command.note))fail(422,'Record the technical result and its scope.');
              (pkg.preflightHistory??=[]).push(pkg.preflight);pkg.preflight={evidenceId:e.id,proofId:pkg.proofId,profile:pkg.spec.profile,passed:command.passed,note:command.note,...stamp(actor,at)};
            } else if(command.action==='REVIEW_PRINT') {
              allowed(['Editorial']);if(!hasRenewal(s,id,'editorial'))assertTaskAcceptance(s,actor,id,'print-review');
              if(!pkg.preflight?.passed)fail(409,'A passing preflight report for this file and profile is required.');await bytesFor(evidence(s,actor,id,pkg.preflight.evidenceId,'PREFLIGHT'));
              transition('ROUTE_PRINT_PROOF',{editorialChecked:command.editorialChecked===true,rightsChecked:command.rightsChecked===true,route:PRINT_ROUTE_ID});
            } else if(command.action==='APPROVE_PRINT') {allowed(['Chairman']);transition('DECIDE_PRINT_PROOF',{acknowledged:command.checked===true,outcome:'release'});
            } else if(command.action==='DISPATCH_PRINT') {allowed(['Editorial']);transition('RECORD_PRINT_DISPATCH');
            } else if(command.action==='ACK_PRINT') {
              allowed(['Editorial']);if(command.proofId!==pkg.proofId||!text(command.sender)||!text(command.reference)||!Number.isFinite(Date.parse(command.receivedAt)))fail(422,'Record the supplier, received time and acknowledgment of this exact file.');
              transition('ACKNOWLEDGE_PRINT_PROOF',{reference:command.reference,evidence:{source:'Portal',sender:command.sender,receivedAt:command.receivedAt}});
            } else if(command.action==='START_PRINT') {allowed(['Editorial']);await bytesFor(evidence(s,actor,id,pkg.preflight?.evidenceId,'PREFLIGHT'));transition('START_PRINT');
            } else if(command.action==='COMPLETE_PRINT') {
              allowed(['Editorial']);if(!Number.isSafeInteger(command.quantity)||command.quantity<1||command.quantity>pkg.spec.quantity||!text(command.reference))fail(422,'Record the actual completed quantity and source.');
              transition('COMPLETE_PRINT',{reference:command.reference});pkg.completedQuantity=command.quantity;
            } else if(command.action==='RECORD_DELIVERY') {
              allowed(['Editorial']);if(!job.record.production?.completedAt||job.record.correction||!Number.isSafeInteger(command.quantity)||command.quantity<1||!text(command.reference))fail(409,'Complete production and record a positive delivered quantity and source.');
              const total=job.deliveries.filter(d=>d.revision===pkg.revision).reduce((n,d)=>n+d.quantity,0);
              if(total+command.quantity>pkg.completedQuantity)fail(422,'Delivery exceeds the reported completed quantity.');
              job.deliveries.push({id:randomUUID(),revision:pkg.revision,quantity:command.quantity,reference:command.reference,acceptance:null,...stamp(actor,at)});
            } else if(command.action==='ACCEPT_DELIVERY') {
              allowed(['General_Exhibition_Coordinator']);const d=job.deliveries.find(d=>d.id===command.deliveryId&&d.revision===pkg.revision);
              if(!d||d.acceptance||job.record.correction||command.checked!==true||!text(command.reference))fail(409,'Inspect this pending delivery and record acceptance evidence.');
              d.acceptance={reference:command.reference,...stamp(actor,at)};
            } else if(command.action==='CORRECT_PRINT') {if(!text(command.reason))fail(422,'A correction reason is required.');transition('REQUEST_PRINT_CORRECTION',{reason:command.reason});
            } else if(command.action==='STOP_PRINT') {allowed(['Editorial']);if(!text(command.reference))fail(422,'Record supplier stop acknowledgment or stock disposition.');transition('CONFIRM_PRINT_STOP',{reference:command.reference});
            } else fail(422,'Unknown operational action.');
          }
        }
        const result=complete(s,actor,id,command,fingerprint,{saved:true});
        const impact=amendmentImpact(before,s,actor,id,command,accounts);
        if(previewOnly)return {...impact,taskAssignmentRequired:impact.required};
        requireImpactConfirmation(impact,command);recordImpactReview(s,actor,id,command,impact);
        startRenewal(s,actor,id,command,impact,at);finishRenewal(s,actor,id,command,at);
        return result;
      };
      return previewOnly?work(repository.read()):repository.transaction(work);
    }
  };
}

export function operationsRouter(service) {
  const router=express.Router();
  router.get('/:id',async(req,res,next)=>{try{res.json(await service.read(res.locals.actor,req.params.id));}catch(e){next(e);}});
  router.post('/:id/impact',async(req,res,next)=>{try{res.json(await service.preview(res.locals.actor,req.params.id,req.body));}catch(e){next(e);}});
  router.post('/:id',async(req,res,next)=>{try{res.json(await service.mutate(res.locals.actor,req.params.id,req.body));}catch(e){next(e);}});
  router.post('/:id/evidence',async(req,res,next)=>{try{const raw=req.get('x-sadu-metadata')??'';if(raw.length>8000)fail(422,'Evidence metadata is too large.');let command;try{command=JSON.parse(decodeURIComponent(raw));}catch{fail(422,'Valid evidence metadata required.');}res.json(await service.upload(res.locals.actor,req.params.id,command,req));}catch(e){next(e);}});
  router.get('/:id/evidence/:evidenceId',async(req,res,next)=>{try{const {evidence:e,bytes}=await service.file(res.locals.actor,req.params.id,req.params.evidenceId);res.set({'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Content-SHA256':e.file_hash,'Content-Security-Policy':"sandbox; default-src 'none'",'Content-Disposition':`${req.query.download==='1'?'attachment':'inline'}; filename*=UTF-8''${encodeURIComponent(e.name)}`}).type(e.mime).send(bytes);}catch(e){next(e);}});
  return router;
}
