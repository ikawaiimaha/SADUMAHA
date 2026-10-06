import { randomUUID } from 'node:crypto';

// Operational sub-workflow only. Never grants an institutional role or changes artist status.
const definitions = {
  source: ['تأكيد مصدر الاستلام', 'Confirm collection source', ['Logistics'], '#collection-plan'],
  pickup: ['تأكيد موعد الاستلام', 'Confirm pickup date', ['Logistics'], '#collection-plan'],
  plan: ['تحديد خطة التغليف', 'Record packing plan', ['Logistics'], '#collection-plan'],
  technical: ['مراجعة خطة التغليف فنياً', 'Review packing specification', ['Technical'], '#collection-plan'],
  cost: ['اعتماد تكلفة التغليف', 'Review packing cost', ['Finance'], '#collection-plan'],
  packing: ['فحص دليل اكتمال التغليف', 'Inspect completed packing evidence', ['Logistics'], '#packing-verification'],
  preflight: ['فحص ملف الطباعة', 'Inspect print preflight', ['Technical', 'Editorial'], '#print-preflight'],
  editorial: ['مراجعة قسم التحرير', 'Review bilingual proof and rights', ['Editorial'], '#print-editorial'],
  executive: ['اعتماد رئيس الدائرة', 'Authorize print package', ['Chairman'], '#print-authorization'],
  dispatch: ['تسجيل تسليم البروفة للمورد', 'Record proof dispatch', ['Editorial'], '#print-dispatch'],
  supplier: ['توثيق تأكيد المورد', 'Record supplier acknowledgment', ['Editorial'], '#print-supplier'],
};
const collection = (s,id) => (s.collectionRevisions??[]).filter(r=>r.artworkId===id).at(-1);
const active = (s,id,kind) => (s.renewalCycles??[]).findLast(c=>c.artworkId===id&&c.kind===kind&&!c.supersededAt);
const done = t => ['COMPLETE','NOT_REQUIRED'].includes(t.status);
const fail = (status,message) => { throw Object.assign(new Error(message),{status}); };
const event = (task,type,actor,at,extra={}) => task.events.push({type,actorId:actor.id,at,...extra});
const actionKeys = {CONFIRM:'source',PLAN:'pickup',PACK:'plan',TECHNICAL:'technical',COST:'cost',EVIDENCE:'packing',VERIFY_PACKING:'packing',PREFLIGHT:'preflight',REVIEW_PRINT:'editorial',APPROVE_PRINT:'executive',DISPATCH_PRINT:'dispatch',ACK_PRINT:'supplier'};
const shipping = new Set(['source','pickup','plan','technical','cost','packing']);
export const hasRenewal = (s,id,key) => !!active(s,id,shipping.has(key)?'collection':'print')?.tasks.find(t=>t.key===key);

export function startRenewal(s, actor, id, command, impact, at) {
  if(!impact.required)return;
  const kind=command.action==='SET_PRINT_PACKAGE'?'print':'collection', previous=active(s,id,kind);
  if(previous){previous.supersededAt=at;previous.supersededBy=actor.id;}
  const r=collection(s,id),job=s.printJobs?.[id];
  const keys=kind==='print'?['preflight','editorial','executive','dispatch','supplier']:[...(!r.confirmation?['source']:[]),...(!r.plan?['pickup']:[]),'plan','technical','cost','packing'];
  (s.renewalCycles??=[]).push({id:randomUUID(),artworkId:id,kind,revision:kind==='print'?job.record.version:r.id,createdAt:at,createdBy:actor.id,impactToken:impact.token,decisionId:s.decisions.at(-1)?.id,tasks:keys.map(key=>({id:randomUUID(),key,status:'UNASSIGNED',ownerId:null,dueAt:null,acceptedBy:null,events:[]}))});
}

export function requireRenewalAcceptance(s,actor,id,action) {
  const key=actionKeys[action];if(!key)return;
  const c=active(s,id,shipping.has(key)?'collection':'print'),t=c?.tasks.find(t=>t.key===key);if(!t)return;
  if(!definitions[key][2].includes(actor.role))fail(403,'This role cannot perform the required review.');
  // An amendment to an already-confirmed date is separately governed by the impact preview.
  if(action==='PLAN'&&collection(s,id)?.plan)return;
  if(t.ownerId!==actor.id||t.acceptedBy!==actor.id||t.status!=='ACCEPTED')fail(409,'Accept the named renewal task for this revision before performing this action.');
  const prior=c.tasks.slice(0,c.tasks.indexOf(t)).find(p=>!done(p));
  if(prior)fail(409,`Complete the preceding renewal: ${definitions[prior.key][1]}.`);
}

export function changeRenewal(s,actor,id,cmd,accounts,at) {
  const c=(s.renewalCycles??[]).find(c=>c.artworkId===id&&c.tasks.some(t=>t.id===cmd.taskId));
  if(!c||c.supersededAt)fail(409,'This task belongs to an earlier revision. Refresh the current renewal queue.');
  const t=c.tasks.find(t=>t.id===cmd.taskId);
  if(done(t))fail(409,'A completed check cannot be reassigned. Amend the underlying record if it needs renewal.');
  if(cmd.action==='ASSIGN_RENEWAL') {
    if(actor.role!=='General_Exhibition_Coordinator')fail(403,'Only the General Exhibition Coordinator assigns renewal responsibility.');
    const owner=accounts.find(a=>a.id===cmd.ownerId&&a.exhibitionId===actor.exhibitionId&&definitions[t.key][2].includes(a.role));
    const activeOwner=s.collectionAssignments?.[id]?.activeId??'pilot-Logistics';
    if(!owner||(owner.role==='Logistics'&&owner.id!==activeOwner))fail(422,'Select an eligible owner; Logistics tasks must use the active collection owner.');
    if(typeof cmd.reason!=='string'||!cmd.reason.trim()||cmd.reason.length>1000||!Number.isFinite(Date.parse(cmd.dueAt))||Date.parse(cmd.dueAt)<=Date.parse(at))fail(422,'Provide a reason and a future deadline.');
    Object.assign(t,{ownerId:owner.id,dueAt:new Date(cmd.dueAt).toISOString(),status:'ASSIGNED',acceptedBy:null});
    event(t,'ASSIGNED',actor,at,{ownerId:owner.id,dueAt:t.dueAt,reason:cmd.reason.trim()});
  } else {
    if(t.ownerId!==actor.id)fail(403,'Only the named owner may accept or return this task.');
    if(cmd.action==='ACCEPT_RENEWAL') {
      if(t.status!=='ASSIGNED')fail(409,'This task is not awaiting acceptance.');
      t.status='ACCEPTED';t.acceptedBy=actor.id;event(t,'ACCEPTED',actor,at);
    } else if(cmd.action==='RETURN_RENEWAL') {
      if(typeof cmd.reason!=='string'||!cmd.reason.trim()||cmd.reason.length>1000)fail(422,'Explain why the coordinator needs to reassign or clarify this task.');
      event(t,'RETURNED',actor,at,{reason:cmd.reason.trim(),previousOwnerId:t.ownerId});
      t.status='RETURNED';t.ownerId=null;t.acceptedBy=null;
    } else fail(422,'Unknown renewal action.');
  }
}

export function finishRenewal(s,actor,id,cmd,at) {
  if(cmd.action==='ASSIGN') {
    const c=active(s,id,'collection'),owner=s.collectionAssignments?.[id]?.activeId;
    for(const t of c?.tasks??[])if(!done(t)&&definitions[t.key][2].includes('Logistics')&&t.ownerId&&t.ownerId!==owner){event(t,'OWNER_CHANGED',actor,at,{previousOwnerId:t.ownerId});Object.assign(t,{ownerId:null,acceptedBy:null,status:'UNASSIGNED'});}
    return;
  }
  const key=actionKeys[cmd.action];if(!key||cmd.action==='EVIDENCE')return;
  const c=active(s,id,shipping.has(key)?'collection':'print'),t=c?.tasks.find(t=>t.key===key);
  if(!t||done(t)||cmd.action==='PREFLIGHT'&&!cmd.passed)return;
  const r=collection(s,id),job=s.printJobs?.[id],pkg=job?.packages.find(p=>p.revision===c.revision);
  const evidenceIds=shipping.has(key)?[r?.packing?.evidenceFileId].filter(Boolean):[pkg?.proofId,pkg?.preflight?.evidenceId].filter(Boolean);
  t.status='COMPLETE';event(t,'COMPLETE',actor,at,{recordId:shipping.has(key)?r?.id:pkg?.revision,evidenceIds,reference:cmd.reference??cmd.value??r?.sourceRef??null});
  if(cmd.action==='PACK'&&r.packing.requiresTechnical===false){const tech=c.tasks.find(t=>t.key==='technical');tech.status='NOT_REQUIRED';event(tech,'NOT_REQUIRED',actor,at,{reason:r.packing.technicalReason});}
}

export function renewalView(s,id,actor,accounts,at,files=[]) {
  return (s.renewalCycles??[]).filter(c=>c.artworkId===id).flatMap(c=>{
    const coordinator=actor.role==='General_Exhibition_Coordinator';
    const allowed=c.kind==='collection'?['Logistics','Technical','Finance']:['Exhibition_Coordinator','Editorial','Technical','Chairman'];
    if(!coordinator&&!allowed.includes(actor.role))return [];
    const r=collection(s,id),job=s.printJobs?.[id],pkg=job?.packages.find(p=>p.revision===c.revision);
    const held=c.kind==='print'&&!!job?.record.correction&&!c.supersededAt;
    const tasks=c.tasks.map((t,index)=>{
      const [ar,en,roles,href]=definitions[t.key],prior=c.tasks.slice(0,index).find(t=>!done(t));
      const stateReason=t.status==='UNASSIGNED'||t.status==='RETURNED'?'المنسقة تحدد المسؤول والموعد / Coordinator must assign an owner and deadline.':t.status==='ASSIGNED'?'بانتظار قبول المسؤول / Awaiting the named owner’s acceptance.':'';
      const blocker=done(t)?'':held?'الطباعة معلّقة للتصحيح / Print revision is on correction hold.':prior?`بانتظار: ${definitions[prior.key][0]} / Waiting for: ${definitions[prior.key][1]}`:stateReason||'راجع الدليل ونفّذ الإجراء أدناه / Inspect the evidence and complete the action below.';
      const ids=c.kind==='print'?[pkg?.proofId,pkg?.preflight?.evidenceId]:c.supersededAt?[]:[r?.packing?.evidenceFileId];
      const evidenceIds=[...new Set([...ids,...t.events.flatMap(e=>e.evidenceIds??[])])].filter(id=>files.some(f=>f.id===id));
      return {...t,title:`${ar} / ${en}`,roles,href,blocker,evidenceIds,overdue:!done(t)&&!!t.dueAt&&Date.parse(at)>Date.parse(t.dueAt),canAct:!c.supersededAt&&!held&&!prior&&t.status==='ACCEPTED'&&t.ownerId===actor.id,eligibleOwners:accounts.filter(a=>a.exhibitionId===actor.exhibitionId&&roles.includes(a.role)&&(a.role!=='Logistics'||a.id===(s.collectionAssignments?.[id]?.activeId??'pilot-Logistics'))).map(a=>a.id)};
    });
    return [{...c,tasks,completed:tasks.filter(done).length,total:tasks.length}];
  });
}
