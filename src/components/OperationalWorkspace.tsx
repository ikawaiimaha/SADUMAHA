import { useEffect, useRef, useState } from 'react';
import { Check, Clock3, FileText, FlaskConical, Package, ArrowUpRight, ShieldCheck } from 'lucide-react';
import TreatmentSummary from './TreatmentSummary';
import { treatmentBlocker } from '../lib/treatment';
import type { OperationsView } from './ConnectedOperations';
import type { CollectionView } from '../lib/useCollectionWorkflow';
import { localized, accountLabel, roleLabels, taskTitles, workspaceTasks, retainTaskSelection, readinessExplanation, waitingExplanation, type Language, type WorkspaceTask } from '../lib/operationalWorkspace';
import OperationalForms, { EvidenceUpload, ResponsibilityForm, type WorkspaceCommand } from './OperationalForms';
import EvidencePreview from './EvidencePreview';
import { useAmendmentReview } from './AmendmentImpact';
import './OperationalWorkspace.css';
import {useWorkspaceDraft} from '../lib/useWorkspaceDraft';
import {captureDraftFields,type DraftFields,type WorkspaceDraft} from '../lib/workspaceDraft';
import {DraftForm,DraftFieldsContext} from './DraftForm';
import DraftRecovery from './DraftRecovery';

type Props = { operations: OperationsView; collection?: CollectionView; artworkId: string; artworkTitle?: { ar?: string; en?: string };
  actor: { id: string; role: string }; language: Language; locked: boolean; collectionLocked?: boolean; onChanged: () => Promise<void>; onDirtyChange: (value: boolean) => void; onRecoverySafetyChange:(value:boolean)=>void };
type Snapshot = {version:number;collection?:CollectionView;operations:OperationsView};
const snapshotChanges = (before: Snapshot, after: Snapshot, language: Language) => {
  const oldPackage=before.operations.job?.packages.at(-1),newPackage=after.operations.job?.packages.at(-1);
  const pairs = [
    ['عنوان الاستلام','Collection address',before.collection?.record?.address,after.collection?.record?.address],
    ['موعد الاستلام','Pickup date',before.collection?.record?.plan?.pickupDate,after.collection?.record?.plan?.pickupDate],
    ['خطة التغليف','Packing plan',before.collection?.record?.packing?.specification,after.collection?.record?.packing?.specification],
    ['أمر الطباعة','Print revision',oldPackage?.revision,newPackage?.revision],
    ['المسؤول الحالي','Active owner',before.collection?.assignment.activeId,after.collection?.assignment.activeId],
  ];
  const result=pairs.filter(p=>p[2]!==p[3]).map(p=>`${p[language==='ar'?0:1]}: ${p[2]??'—'} → ${p[3]??'—'}`);
  const oldTasks=before.operations.renewals?.flatMap(c=>c.tasks)??[];
  for(const task of after.operations.renewals?.flatMap(c=>c.tasks)??[]) {
    const old=oldTasks.find(t=>t.id===task.id);
    if(old&&(old.ownerId!==task.ownerId||old.dueAt!==task.dueAt||old.status!==task.status)) result.push(`${taskTitles[task.key]?.[language]??task.key}: ${language==='ar'?'تغيّر المسؤول أو الموعد أو حالة القبول':'owner, deadline or acceptance changed'}`);
  }
  return result;
};

export default function OperationalWorkspace({operations:ops,collection,artworkId,artworkTitle,actor,language,locked,collectionLocked=false,onChanged,onDirtyChange,onRecoverySafetyChange}:Props) {
  const t=(ar:string,en:string)=>language==='ar'?ar:en;
  const tasks=workspaceTasks(ops,collection,actor);
  const [selectedId,setSelectedId]=useState<string|null>(()=>retainTaskSelection(null,tasks));
  const [management,setManagement]=useState<WorkspaceTask|null>(null);
  const [mobilePane,setMobilePane]=useState<'action'|'evidence'>('action');
  const [panel,setPanel]=useState<'decision'|'upload'|'assign'|'return'>('decision');
  const [filter,setFilter]=useState<'now'|'waiting'|'complete'>(tasks[0]?.status??'now');
  const [dirty,setDirty]=useState(false),[busy,setBusy]=useState(false),[uncertain,setUncertain]=useState(false);
  const [draftTask,setDraftTask]=useState<WorkspaceTask|null>(null);
  const [base,setBase]=useState<Snapshot>({version:ops.version,operations:ops,collection});
  const [message,setMessage]=useState(''),[error,setError]=useState('');
  const [fileChoice,setFileChoice]=useState(''),[viewedId,setViewedId]=useState(''),[fullScreen,setFullScreen]=useState(false),[formReset,setFormReset]=useState(0);
  const pending=useRef(false),retry=useRef<{key:string;id:string;version:number;impact?:{impactToken?:string}}|null>(null);
  const titleRef=useRef<HTMLHeadingElement>(null),decisionRef=useRef<HTMLElement>(null);
  const draft=useWorkspaceDraft(artworkId,actor.id,actor.role==='Artist'||actor.role==='Museum_Operations'?'treatment':undefined);
  const [restoredFields,setRestoredFields]=useState<DraftFields>({});
  const [editSequence,setEditSequence]=useState(0);
  const [restoredFile,setRestoredFile]=useState<string|null>(null);
  const amendment=useAmendmentReview(ops.version,language);
  const coordinator=actor.role==='General_Exhibition_Coordinator';
  const currentTask=tasks.find(task=>task.id===selectedId);
  const selected=dirty?draftTask:management??currentTask;
  // Match the existing assignment gate; do not offer a form the server will reject.
  const canAssignSelected=coordinator&&!!(selected?.renewal||selected?.legacyKey)&&(selected?.kind!=='treatment'||!!ops.treatment?.current&&ops.treatment.authorizations.some(a=>a.revision===ops.treatment!.current!.revision)&&!ops.treatment.completions.length);
  const replaced=dirty&&!management&&!currentTask;
  const stale=dirty&&base.version!==ops.version;
  // A saved draft's comparison refreshes when the shared record changes. Never
  // replace live unsaved input or retry a failed draft write in the background.
  useEffect(()=>{if((stale&&draft.status==='saved')||(draft.candidate&&draft.status==='ready'&&(draft.comparison?.currentVersion??-1)<ops.version))void draft.load();},[stale,ops.version,draft.status,draft.candidate,draft.comparison?.currentVersion,draft.load]);
  const disabled=draft.blocked||!!draft.candidate||locked||busy||stale||uncertain||replaced||(collectionLocked&&selected?.kind==='collection');
  const formOps=dirty?base.operations:ops,formCollection=dirty?base.collection:collection;
  const pkg=ops.job?.packages.find(p=>p.revision===ops.job!.record.version);
  const selectedKind=selected?.kind??(ops.readiness?'collection':'print');
  const isTreatmentFile=(kind:string)=>kind.startsWith('TREATMENT_');
  const files=ops.files.filter(f=>selectedKind==='treatment'?isTreatmentFile(f.kind):selectedKind==='collection'?f.kind==='PACKING':f.kind!=='PACKING'&&!isTreatmentFile(f.kind));
  const technician=actor.role==='Technical';
  const uploadKind=selected?.key==='packing'&&actor.role==='Logistics'?'PACKING':['package','amendPackage'].includes(selected?.key??'')?'PRINT_PROOF':selected?.key==='preflight'&&['Technical','Editorial'].includes(actor.role)?'PREFLIGHT'
    :selected?.key==='tAuthorize'&&coordinator?'TREATMENT_SOURCE':selected?.key==='tSample'&&technician?'TREATMENT_SAMPLE':selected?.key==='tComplete'&&technician?'TREATMENT_COMPLETION':null;
  // Earlier-scope files and photographs already submitted can never be selected again.
  const availableEvidence=files.filter(f=>f.kind===uploadKind&&f.currentScope!==false&&!ops.treatment?.trials.some(x=>x.evidenceId===f.id));
  const treatmentEvidence=selected?.kind==='treatment'?selected.evidenceIds[0]??'':'';
  const useUploaded=!!uploadKind&&(selected?.kind!=='treatment'||selected.canAct);
  const selectedEvidenceId=fileChoice||(useUploaded?availableEvidence.at(-1)?.id:treatmentEvidence)||'';
  const effectivePanel=panel==='decision'&&uploadKind&&!selectedEvidenceId?'upload':panel;
  const [previewReadyId,setPreviewReadyId]=useState<string|null>(null);
  const suggestedId=selectedKind==='treatment'||uploadKind?selectedEvidenceId:selectedKind==='print'?pkg?.proofId:files.filter(f=>f.currentScope===true).at(-1)?.id;
  const evidence=files.find(f=>f.id===(viewedId||suggestedId));
  const primaryIds=new Set([suggestedId,pkg?.preflight?.evidenceId??files.filter(f=>f.kind==='PREFLIGHT').at(-1)?.id,viewedId].filter(Boolean));
  const primaryFiles=files.filter(f=>primaryIds.has(f.id)),otherFiles=files.filter(f=>!primaryIds.has(f.id));
  const mark=()=>{if(!dirty){setBase({version:ops.version,operations:ops,collection});setDraftTask(selected??null);}setDirty(true);setEditSequence(n=>n+1);};
  const workingDraft=():WorkspaceDraft|null=>{const form=decisionRef.current?.querySelector('form');if(!form||!selected)return null;const captured=captureDraftFields(form);return {taskId:selected.id,key:selected.key,kind:selected.kind,panel:effectivePanel,baseVersion:dirty?base.version:ops.version,...captured,fileName:captured.fileName??(effectivePanel==='upload'?restoredFile:null),attempted:false};};
  useEffect(()=>{if(!editSequence||!dirty||!selected)return;const value=workingDraft();if(value)draft.stage(value);},[editSequence]);
  useEffect(()=>{onRecoverySafetyChange(draft.status==='saved'&&!busy&&!uncertain);},[draft.status,busy,uncertain,onRecoverySafetyChange]);
  useEffect(()=>{onDirtyChange(dirty||busy||uncertain);},[dirty,busy,uncertain,onDirtyChange]);
  useEffect(()=>{if(!selectedId&&tasks.length)setSelectedId(retainTaskSelection(null,tasks));},[selectedId,tasks]);
  const choose=(task:WorkspaceTask)=>{
    if(dirty||busy||uncertain||draft.candidate)return;
    setRestoredFields({});setRestoredFile(null);setSelectedId(task.id);setManagement(null);setPanel('decision');setMobilePane('action');setFileChoice('');setViewedId('');setMessage('');setError('');
    setBase({version:ops.version,operations:ops,collection});
    requestAnimationFrame(()=>{titleRef.current?.focus({preventScroll:true});if(window.matchMedia('(max-width:1150px)').matches)titleRef.current?.closest('.work-selected')?.scrollIntoView({block:'start'});});
  };
  const manage=(key:string,kind:WorkspaceTask['kind'])=>{
    if(dirty||busy||uncertain||draft.candidate)return;
    const task:WorkspaceTask={id:`manage:${key}`,key,kind,title:taskTitles[key],status:'now',ownerId:actor.id,ownerRole:actor.role,blocker:'',canAct:true,evidenceIds:[]};
    choose(task);setManagement(task);
  };
  const discard=async()=>{setBusy(true);const cleared=await draft.clear();setBusy(false);if(!cleared)return;setRestoredFields({});setRestoredFile(null);setDirty(false);setDraftTask(null);setBase({version:ops.version,operations:ops,collection});setFileChoice('');setFormReset(n=>n+1);setError('');setPanel('decision');retry.current=null;};
  const run:WorkspaceCommand=async(channel,action,data,file)=>{
    if(disabled||pending.current)return false;
    pending.current=true;setBusy(true);setError('');setMessage('');
    const key=JSON.stringify({channel,action,data,file:file?{name:file.name,size:file.size,modified:file.lastModified}:null});
    const operation=retry.current?.key===key?retry.current:{key,id:crypto.randomUUID(),version:dirty?base.version:ops.version};
    retry.current=operation;
    const path=`/api/review/pilot/${channel}/${encodeURIComponent(artworkId)}`;
    const command={...data,action,version:operation.version,...(channel==='operations'?{operationId:operation.id}:{})};
    let saved=false;
    try {
      if(action==='SET_PRINT_PACKAGE'||channel==='collection'&&['SAVE','PLAN','REOPEN'].includes(action)){
        const impact=operation.impact??await amendment.review(path,command);
        if(impact===null){retry.current=null;return false;}
        operation.impact=impact;Object.assign(command,impact);
      }
      const working=workingDraft();if(working)draft.stage(working);
      if(!await draft.flush(true))return false;
      const response=await fetch(file?`${path}/evidence`:path,{method:'POST',headers:file?{'Content-Type':'application/octet-stream','x-sadu-metadata':encodeURIComponent(JSON.stringify(command))}:{'Content-Type':'application/json'},body:file??JSON.stringify(command)});
      const result=await response.json();
      if(!response.ok){retry.current=null;await draft.flush(false);throw Object.assign(Error(result.error??'Save failed'),{status:response.status});}
      saved=true;await draft.clear();setRestoredFields({});setRestoredFile(null);retry.current=null;setDirty(false);setDraftTask(null);setPanel('decision');setFormReset(n=>n+1);onDirtyChange(false);
      if(file&&typeof result.evidenceId==='string'){setFileChoice(result.evidenceId);setViewedId(result.evidenceId);setPreviewReadyId(null);}
      await onChanged();setUncertain(false);
      setMessage(file?t('تم رفع الملف.','File uploaded.'):t('تم الحفظ.','Saved.'));
      return true;
    } catch(e){
      const failure=e as Error&{status?:number};
      if(saved){setUncertain(true);setMessage(t('تم الحفظ؛ تعذر تحديث العرض. حدّث الحالة قبل أي تغيير آخر.','Saved, but refresh failed. Refresh the state before another change.'));return true;}
      setError(failure.message);
      if(failure.status===409||failure.status===403){await onChanged().catch(()=>setUncertain(true));}
      if(failure.status===401)setUncertain(true);
      if(!failure.status){setUncertain(true);setMessage(t('انقطع الاتصال. تحقّق من السجل قبل إعادة المحاولة؛ لم يُحذف إدخالك.','Connection interrupted. Check the record before retrying; your input is retained.'));}
      return false;
    } finally {pending.current=false;setBusy(false);}
  };
  const owner=(task:WorkspaceTask)=>{
    if(!task.ownerId)return roleLabels[task.ownerRole]?.[language]??task.ownerRole;
    const account=ops.accounts.find(a=>a.id===task.ownerId);
    return account?accountLabel(account,language):task.ownerId;
  };
  const treatmentBlockerText=(task:WorkspaceTask)=>{
    const step=task.kind==='treatment'?ops.treatment?.steps.find(s=>s.key===task.key):undefined;
    return step&&ops.treatment&&step.state!=='done'?treatmentBlocker(ops.treatment,step,ops.accounts,language):'';
  };
  const counts=(status:WorkspaceTask['status'])=>tasks.filter(task=>task.status===status).length;
  const shown=tasks.filter(task=>task.status===filter);

  const canChangePrint=['Exhibition_Coordinator','General_Exhibition_Coordinator'].includes(actor.role);
  const canChangeCollection=!collectionLocked&&!!collection&&actor.role==='Logistics'&&collection.assignment.activeId===actor.id;
  const candidate=draft.candidate;
  const managementTask=(value:WorkspaceDraft):WorkspaceTask|null=>{
    const allowed=value.kind==='treatment'?coordinator&&value.key==='amendTreatment'&&!!ops.treatment?.current:value.kind==='collection'?(value.key==='owners'?coordinator:canChangeCollection&&['amendSource','amendPickup','reopen'].includes(value.key)):canChangePrint&&['amendPackage','correction'].includes(value.key)||actor.role==='Editorial'&&value.key==='correction';
    return allowed&&value.taskId===`manage:${value.key}`?{id:value.taskId,key:value.key,kind:value.kind,title:taskTitles[value.key],status:'now',ownerId:actor.id,ownerRole:actor.role,blocker:'',canAct:true,evidenceIds:[]}:null;
  };
  const recoveryTask=candidate?(tasks.find(t=>t.id===candidate.taskId)??managementTask(candidate)):null;
  const canResume=!!candidate&&!candidate.attempted&&candidate.baseVersion===ops.version&&!locked&&!(collectionLocked&&candidate.kind==='collection')&&!!recoveryTask&&(recoveryTask.canAct||coordinator&&candidate.panel==='assign'||candidate.panel==='return'&&recoveryTask.ownerId===actor.id);
  const restore=()=>{
    if(!canResume||!candidate||!recoveryTask)return;
    setSelectedId(recoveryTask.id);setManagement(recoveryTask.id.startsWith('manage:')?recoveryTask:null);setDraftTask(recoveryTask);
    setBase({version:candidate.baseVersion,operations:ops,collection});setPanel(candidate.panel);setRestoredFields(candidate.fields);setRestoredFile(candidate.fileName);
    const fileId=ops.files.some(f=>f.id===candidate.fields.evidenceId)?candidate.fields.evidenceId:'';
    setFileChoice(fileId);setViewedId(fileId);setFormReset(n=>n+1);setDirty(true);setUncertain(false);setError('');draft.setCandidate(null);
    setMessage(t('استُعيد النص فقط. افحص الدليل وأعد تحديد نتيجة المراجعة والتأكيدات.','Working text restored. Inspect the evidence and select review results and confirmations again.'));
    setEditSequence(n=>n+1);
    requestAnimationFrame(()=>{titleRef.current?.focus({preventScroll:true});if(window.matchMedia('(max-width:1150px)').matches)titleRef.current?.closest('.work-selected')?.scrollIntoView({block:'start'});});
  };
  return <section className="workbench" aria-label={t('مساحة العمل','Task workspace')} dir={language==='ar'?'rtl':'ltr'} lang={language}>
    <header className="work-context"><div><span className="work-eyebrow">{t('ملف العمل','Work record')}</span><h2 dir="auto">{artworkTitle?.[language]||ops.treatment?.current?.workTitle||t('ملف الاستلام والطباعة التجريبي','Collection and print rehearsal')}</h2></div><span className="work-badge"><ShieldCheck size={16}/>{t('سجل محلي مشترك','Shared local record')}</span></header>
    {ops.readiness&&<div className="work-readiness" aria-label={t('جاهزية الاستلام','Collection readiness')}>
      {[[!!collection?.record?.confirmation,t('العنوان','Address')],[!!collection?.record?.plan&&!ops.readiness.expired,t('الموعد','Pickup')],[ops.readiness.packingVerified,t('التغليف','Packing')],[!!collection&&collection.assignment.acceptedBy===collection.assignment.activeId,t('قبول المسؤول','Owner accepted')]].map(([done,label])=><span key={String(label)} data-complete={done}><span aria-hidden="true">{done?<Check size={15}/>:<Clock3 size={15}/>}</span>{label}<span className="sr-only">{done?t('مكتمل','Complete'):t('غير مكتمل','Incomplete')}</span></span>)}
      <strong className={ops.readiness.departureReady?'work-cleared':'work-hold'}>{ops.readiness.departureReady?t('متطلبات الخروج مستوفاة','Departure prerequisites cleared'):t('الخروج معلّق','Departure on hold')}</strong>
      <details><summary>{t('تفاصيل الجاهزية','Readiness details')}{ops.readiness.blockers.length>0&&` (${new Set(ops.readiness.blockers).size})`}</summary><ul>{[...new Set(ops.readiness.blockers)].map(b=><li key={b}>{readinessExplanation(b,language)}</li>)}</ul><p>{t('اكتمال التحضير لا يسجّل حجزاً للنقل أو استلاماً فعلياً للعمل.','Completing preparation does not book transport or record that the artwork was collected.')}</p></details>
    </div>}
    <div className="work-layout">
      <aside className="work-inbox" aria-label={t('قائمة المهام','Task list')}>
        <label className="work-task-picker">{t('المهمة','Task')}<select value={selectedId??''} disabled={dirty||busy||uncertain||!!candidate} onChange={e=>{const task=tasks.find(item=>item.id===e.target.value);if(task)choose(task);}}>{!tasks.some(task=>task.id===selectedId)&&<option value="">{t('اختر مهمة','Choose a task')}</option>}{(['now','waiting','complete'] as const).map(status=><optgroup key={status} label={status==='now'?t('لك الآن','For you'):status==='waiting'?t('انتظار','Waiting'):t('مكتمل','Done')}>{tasks.filter(task=>task.status===status).map(task=><option key={task.id} value={task.id}>{task.title[language]} · {owner(task)}</option>)}</optgroup>)}</select></label>
        <div className="work-inbox-title"><h3>{t('مهام هذا الملف','Tasks for this work')}</h3></div>
        <nav className="work-filters" aria-label={t('تصفية المهام','Task filters')}>{(['now','waiting','complete'] as const).map(f=><button key={f} type="button" aria-pressed={filter===f} onClick={()=>setFilter(f)}>{({now:t('لك الآن','For you'),waiting:t('انتظار','Waiting'),complete:t('مكتمل','Done')})[f]} <span>{counts(f)}</span></button>)}</nav>

        <div className="work-task-list">{shown.map(task=><button type="button" key={task.id} className="work-task" aria-pressed={selected?.id===task.id} disabled={dirty||busy||uncertain||!!candidate} onClick={()=>choose(task)}>
          <span className="work-task-kind">{task.kind==='print'?<FileText size={16}/>:task.kind==='treatment'?<FlaskConical size={16}/>:<Package size={16}/>} {task.kind==='print'?t('الطباعة','Print'):task.kind==='treatment'?t('معالجة مشروطة','Conditional treatment'):t('الاستلام','Collection')}</span><strong>{task.title[language]}</strong><span>{owner(task)}{task.overdue&&<b className="work-overdue"> · {t('متأخر','Overdue')}</b>}</span>
        </button>)}{!shown.length&&<p className="work-empty">{filter==='now'?t('لا يوجد إجراء متاح لك الآن. افتح الانتظار لمعرفة المسؤول عن الخطوة التالية.','No action is available to you now. Open Waiting to see who owns the next step.'):t('لا توجد مهام في هذا العرض.','No tasks in this view.')}</p>}</div>
        <details className="work-manage"><summary>{t('تعديل أو تسليم مسؤولية','Amend or hand over')}</summary>
          {coordinator&&collection&&<button disabled={dirty||busy||locked||!!candidate} onClick={()=>manage('owners','collection')}>{taskTitles.owners[language]}</button>}
          {canChangeCollection&&<><button disabled={dirty||busy||locked||!!candidate} onClick={()=>manage('amendSource','collection')}>{taskTitles.amendSource[language]}</button>{collection.record?.confirmation&&<button disabled={dirty||busy||locked||!!candidate} onClick={()=>manage('amendPickup','collection')}>{taskTitles.amendPickup[language]}</button>}{collection.record?.packing&&<button disabled={dirty||busy||locked||!!candidate} onClick={()=>manage('reopen','collection')}>{taskTitles.reopen[language]}</button>}</>}
          {canChangePrint&&(!ops.job?.record.dispatch||!!ops.job.record.correction?.stopReference)&&<button disabled={dirty||busy||locked||!!candidate} onClick={()=>manage('amendPackage','print')}>{taskTitles.amendPackage[language]}</button>}
          {coordinator&&!!ops.treatment?.current&&!ops.treatment.completions.length&&<button disabled={dirty||busy||locked||!!candidate} onClick={()=>manage('amendTreatment','treatment')}>{taskTitles.amendTreatment[language]}</button>}
          {pkg&&!ops.job?.record.correction&&(canChangePrint||actor.role==='Editorial')&&<button disabled={dirty||busy||locked||!!candidate} onClick={()=>manage('correction','print')}>{taskTitles.correction[language]}</button>}
        </details>
      </aside>
      <div className="work-selected">
        {message&&<p role="status" className="work-notice">{message}</p>}
        {error&&<div role="alert" className="work-alert"><strong>{t('تعذر حفظ التغيير. إدخالك محفوظ في النموذج.','The change could not be saved. Your input remains in the form.')}</strong><p dir="auto">{localized(error,language)}</p></div>}
        {(stale||uncertain)&&!candidate&&<div className="work-alert" role="alert"><strong>{t('راجع السجل المحدّث قبل الحفظ','Review the updated record before saving')}</strong><p>{replaced?t('استُبدلت هذه المهمة بإصدار جديد. إدخالك باقٍ للمراجعة؛ تجاهله قبل اختيار المهمة الجديدة.','This task was replaced by a new revision. Your input remains for reference; discard it before selecting the new task.'):t('بقيت مسودتك للمراجعة. تجاهلها وأعد فتح المهمة قبل الحفظ على سجل تغيّر.','Your draft is retained for reference. Discard it and reopen the task before saving against a changed record.')}</p><ul>{snapshotChanges(base,{version:ops.version,operations:ops,collection},language).map(s=><li key={s} dir="auto">{s}</li>)}</ul><button className="work-secondary" disabled={busy} onClick={()=>void onChanged().then(()=>{setUncertain(false);setError('');}).catch(()=>setUncertain(true))}>{t('تحديث حالة الاتصال والسجل','Refresh connection and record')}</button></div>}
        <DraftRecovery comparison={draft.comparison} version={ops.version} tasks={tasks} references={Object.fromEntries([...ops.files.map(f=>[f.id,f.name]),...ops.accounts.map(a=>[a.id,accountLabel(a,language)]),...(ops.job?.deliveries??[]).map(d=>[d.id,d.reference])])} language={language} status={draft.status} candidate={candidate} canResume={canResume} onResume={restore} onDiscard={()=>void discard()} onReload={()=>void draft.load()} busy={busy} dirty={dirty} />
        {dirty&&!candidate&&<div className="work-draft"><span role="status">{draft.status==='saved'?t('حُفظت مسودتك الخاصة محلياً — لم تُعتمد','Private draft saved locally — not submitted'):draft.status==='saving'?t('جارٍ حفظ المسودة…','Saving draft…'):t('إدخالك باقٍ في هذه الصفحة','Your input remains on this page')}</span><button className="work-link" disabled={busy||uncertain||draft.blocked||!!candidate} onClick={()=>void discard()}>{t('تجاهل الإدخال','Discard input')}</button></div>}
        <div hidden={!!candidate}>{!selected?<div className="work-empty">{tasks.length===0?<p>{t('لا توجد مهام لحسابك في هذا الملف الآن.','There are no tasks for your account on this work right now.')}</p>:<><h3>{t('تحدّثت المهمة','The task has changed')}</h3><p>{t('اختر المهمة التالية من القائمة. لم ينتقل العرض تلقائياً.','Choose the next task from the list. Your view was not switched automatically.')}</p></>}</div>:<>
          <header className="work-task-header"><div><span className="work-eyebrow">{selected.kind==='print'?`${t('الطباعة · الإصدار','Print · revision')} ${pkg?.revision??'—'}`:selected.kind==='treatment'?`${t('معالجة مشروطة — سيناريو تجريبي · الإصدار','Conditional treatment — synthetic scenario · revision')} ${ops.treatment?.current?.revision??'—'}`:t('الاستلام والتغليف','Collection and packing')}</span><h3 ref={titleRef} tabIndex={-1}>{selected.title[language]}</h3></div><span className="work-badge">{stale||uncertain||draft.status==='error'||draft.status==='conflict'?t('يلزم مراجعة التغيير','Changed record — review required'):selected.status==='complete'?t('مكتمل','Complete'):selected.canAct?t('جاهز للمراجعة','Ready for review'):t('يتطلب متابعة','Needs attention')}</span></header>
          <div className="work-owner"><span>{t('المسؤول:','Owner:')} <strong>{owner(selected)}</strong></span>{selected.dueAt&&<span className={selected.overdue?'work-overdue':''}>{t('الموعد:','Due:')} {new Date(selected.dueAt).toLocaleString(language==='ar'?'ar-AE':'en-GB',{dateStyle:'medium',timeStyle:'short'})}</span>}</div>
          <nav className="work-mobile-panes" aria-label={t('الإجراء والدليل','Action and evidence')}><button type="button" aria-pressed={mobilePane==='action'} onClick={()=>setMobilePane('action')}>{t('الإجراء','Action')}</button><button type="button" aria-pressed={mobilePane==='evidence'} onClick={()=>setMobilePane('evidence')}>{t('عرض الدليل','View evidence')}</button></nav>
          <div className="work-review" data-mobile-pane={mobilePane}>
            <section className="work-evidence" aria-label={t('الدليل والمواصفات','Evidence and specification')}>
              {files.length>0&&<nav className="work-files" aria-label={t('ملفات المراجعة','Review files')}>{primaryFiles.map(file=><button type="button" key={file.id} aria-pressed={evidence?.id===file.id} onClick={()=>setViewedId(file.id)}>{file.name}{file.id===pkg?.proofId?` · ${t('البروفة الحالية','Current proof')}`:''}</button>)}</nav>}
              {!!otherFiles.length&&<details className="work-older-files"><summary>{t('ملفات أخرى وسابقة','Other and earlier files')} ({otherFiles.length})</summary><div className="work-files">{otherFiles.map(file=><button type="button" key={file.id} onClick={()=>setViewedId(file.id)}>{file.name}</button>)}</div></details>}
              {evidence?<><EvidencePreview key={evidence.id} file={evidence} onReady={setPreviewReadyId} inline language={language} onClose={()=>{}}/><button className="work-link" onClick={()=>setFullScreen(true)}><ArrowUpRight size={15}/>{t('فتح بحجم أكبر','Open larger preview')}</button></>:<div className="work-evidence-empty"><Package size={36}/><strong>{selected.kind==='collection'?t('مصدر الاستلام وخطة التغليف','Collection source and packing plan'):selected.kind==='treatment'?t('لا ملف لهذه الخطوة بعد','No file for this step yet'):t('لم تُرفق البروفة بعد','No proof attached yet')}</strong></div>}
              {selected.kind==='treatment'&&ops.treatment&&<TreatmentSummary treatment={ops.treatment} accounts={ops.accounts} language={language} open={false}/>}
              {selected.kind==='collection'&&collection?.record&&<details className="work-spec" open={['source','amendSource','pickup','amendPickup','plan','technical','cost','packing'].includes(selected.key)}><summary>{t('البيانات قيد المراجعة','Details under review')}</summary><p dir="auto">{collection.record.address} · {collection.record.city} · {collection.record.country}</p><p>{t('المصدر:','Source:')} <bdi>{collection.record.sourceRef}</bdi></p><p>{t('الإتاحة:','Availability:')} <bdi>{collection.record.availability.start} — {collection.record.availability.end}</bdi> · <bdi>{collection.record.timezone}</bdi></p><p>{t('الاستلام المخطط:','Planned pickup:')} <bdi>{collection.record.plan?.pickupDate??'—'}</bdi></p>{collection.record.packing&&<><p dir="auto">{collection.record.packing.specification}</p><p>{t('مسؤول التغليف:','Packing owner:')} <bdi>{collection.record.packing.owner}</bdi></p><p>{t('التكلفة المقترحة:','Proposed cost:')} {collection.record.packing.amount} AED</p></>}</details>}
              {selected.kind==='print'&&pkg&&<details className="work-spec"><summary>{t('المواصفات المرتبطة بهذا الإصدار','Specification bound to this revision')} · {pkg.spec.quantity} {t('نسخة','copies')}</summary><dl>{Object.entries(pkg.spec).map(([key,value])=><div key={key}><dt>{({supplier:t('المورد','Supplier'),quantity:t('الكمية','Quantity'),size:t('المقاس','Size'),stock:t('الخامة','Stock'),finishing:t('التشطيب','Finishing'),profile:t('الفحص','Preflight profile'),deliveryDate:t('التسليم','Delivery')})[key]}</dt><dd dir="auto">{value}</dd></div>)}</dl></details>}
            </section>
            <DraftFieldsContext.Provider value={restoredFields}><section ref={decisionRef} className="work-decision" aria-label={t('القرار والخطوة التالية','Decision and next action')}>
              {restoredFile&&<p className="work-blocker">{t('أعد إرفاق الملف قبل الإرسال:','Reattach the file before submitting:')} <bdi>{restoredFile}</bdi></p>}
              {collectionLocked&&selected.kind==='collection'&&<p className="work-blocker">{t('انتهت مرحلة انتظار الاستلام؛ هذا العرض للمراجعة فقط.','The record is no longer awaiting collection; this view is read only.')}</p>}
              {selected.status==='complete'?<p className="work-completed"><Check/>{t('اكتملت هذه المراجعة. تبقى بقية شروط الخروج أو الطباعة مستقلة.','This review is complete. Other departure or print prerequisites remain independent.')}</p>:<>
                {!selected.canAct&&(selected.blocker||selected.status==='waiting')&&<p className="work-blocker" data-testid="task-blocker">{treatmentBlockerText(selected)||(selected.status==='waiting'?waitingExplanation(selected,owner(selected),language):localized(selected.blocker,language))}</p>}
                {selected.acceptance&&<button className="work-primary" disabled={disabled||dirty} onClick={()=>void run('operations',selected.acceptance==='renewal'?'ACCEPT_RENEWAL':'ACCEPT_TASK',selected.acceptance==='renewal'?{taskId:selected.id}:{key:selected.legacyKey})}>{t('قبول المهمة','Accept task')}</button>}
                <nav className="work-editor-tabs" aria-label={t('أدوات المهمة','Task tools')}>
                  {selected.canAct&&!uploadKind&&<button type="button" aria-pressed={panel==='decision'} disabled={dirty||busy||!!candidate} onClick={()=>setPanel('decision')}>{t('الإجراء','Action')}</button>}
                  {uploadKind&&selected.canAct&&selectedEvidenceId&&<button type="button" aria-pressed={effectivePanel==='upload'} disabled={dirty||busy||!!candidate} onClick={()=>setPanel(effectivePanel==='upload'?'decision':'upload')}>{effectivePanel==='upload'?t('العودة للمراجعة','Back to review'):t('رفع ملف آخر','Upload another file')}</button>}
                  {canAssignSelected&&<button type="button" aria-pressed={panel==='assign'} disabled={dirty||busy||!!candidate} onClick={()=>setPanel('assign')}>{t('المسؤول والموعد','Owner and deadline')}</button>}
                  {selected.renewal&&selected.ownerId===actor.id&&<button type="button" aria-pressed={panel==='return'} disabled={dirty||busy||!!candidate} onClick={()=>setPanel('return')}>{t('إعادة مع السبب','Return with reason')}</button>}
                </nav>
                {canAssignSelected&&(panel==='assign'||!selected.ownerId&&panel==='decision')&&<ResponsibilityForm key={`${selected.id}:${formReset}`} task={selected} ops={formOps} language={language} disabled={disabled} mark={mark} run={run}/>}
                {selected.canAct&&effectivePanel==='decision'&&<OperationalForms key={`${selected.id}:${formReset}`} task={selected} ops={formOps} collection={formCollection} actor={actor} language={language} disabled={disabled} mark={mark} run={run} evidenceId={selectedEvidenceId} evidenceReady={!!selectedEvidenceId&&previewReadyId===selectedEvidenceId&&evidence?.id===selectedEvidenceId} onEvidence={id=>{setFileChoice(id);setViewedId(id);mark();}}/>}
                {uploadKind&&selected.canAct&&effectivePanel==='upload'&&<EvidenceUpload key={`${uploadKind}:${formReset}`} kind={uploadKind} language={language} disabled={disabled} mark={mark} run={run}/>}

              </>}
              {selected.renewal&&selected.ownerId===actor.id&&selected.status!=='complete'&&panel==='return'&&<div><DraftForm onChange={mark} onInput={mark} onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;if(await run('operations','RETURN_RENEWAL',{taskId:selected.id,reason:new FormData(form).get('reason')}))form.reset();}}><fieldset disabled={disabled}><label className="work-field">{t('سبب الإعادة','Return reason')}<textarea name="reason" required maxLength={1000}/></label><button className="work-secondary">{t('إعادة للمنسقة','Return to coordinator')}</button></fieldset></DraftForm></div>}
              {!!selected.renewal?.events.length&&<details><summary>{t('سجل المسؤولية','Responsibility history')} ({selected.renewal.events.length})</summary><ol className="work-history">{selected.renewal.events.map((event,i)=><li key={i}><bdi>{event.at}</bdi> · {({ASSIGNED:t('تعيين','Assigned'),ACCEPTED:t('قبول','Accepted'),RETURNED:t('إعادة','Returned'),COMPLETE:t('اكتمل','Complete'),NOT_REQUIRED:t('غير مطلوب بسبب موثق','Not required, with reason'),OWNER_CHANGED:t('تغيّر المسؤول','Owner changed')})[event.type]??event.type}<p dir="auto">{event.actorId} {event.reason??''}</p></li>)}</ol></details>}
            </section></DraftFieldsContext.Provider>
          </div>
        </>}</div>
      </div>
    </div>
    {fullScreen&&evidence&&<EvidencePreview file={evidence} language={language} onClose={()=>setFullScreen(false)}/>}
    {amendment.dialog}
  </section>;
}
