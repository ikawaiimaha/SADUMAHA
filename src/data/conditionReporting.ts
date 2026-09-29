import type { CommissionState } from '../types';
export interface ConditionReport {id:string;artistId:string;contractId:string;revision:number;receiptReference:string;condition:'INTACT'|'DAMAGED';liability:'ARTIST'|'DEPARTMENT';photos:File[];at:string;artistDispatchedAt?:string;repairChoice?:'DEPARTMENT'|'ARTIST';repairAuthorizedAt?:string;insuranceStatus?:'INSURANCE_CLAIM_PENDING'}
export interface EmergencyRequest {id:string;reportId:string;grant:number;flight:string;reason:string;at:string;directorDecision?:'APPROVED'|'REJECTED';directorAt?:string;financeDecision?:'APPROVED'|'REJECTED';financeAt?:string}
export type ConditionAction =
 | {type:'authorize-repair';actor:string;reportId:string;choice:'DEPARTMENT'|'ARTIST';at:string}
 | {type:'record-condition';actor:string;id:string;condition:'INTACT'|'DAMAGED';photos:File[];at:string}
 | {type:'dispatch-damage';actor:string;reportId:string;at:string}
 | {type:'request-plan-b';actor:string;id:string;reportId:string;grant:number;flight:string;reason:string;at:string}
 | {type:'review-plan-b';actor:string;requestId:string;approve:boolean;at:string};
export const validDamagePhoto=(f:File)=>['image/jpeg','image/png'].includes(f.type)&&/\.(png|jpe?g)$/i.test(f.name)&&f.size>0&&f.size<=10*1024*1024;
export const damageHold=(state:CommissionState)=>Boolean(state.conditionReports?.some(r=>r.condition==='DAMAGED'));
export function conditionTransition(state:CommissionState,a:ConditionAction):CommissionState {
 const c=state.contracts[0],receipt=state.logistics;
 if(!c||!Number.isFinite(Date.parse(a.at)))return state;
 if(a.type==='authorize-repair'){
  const report=state.conditionReports?.find(r=>r.id===a.reportId);
  if(a.actor!=='ARTIST'||!report||report.contractId!==c.id||report.artistId!==c.artistId||report.condition!=='DAMAGED'||report.repairChoice||!['DEPARTMENT','ARTIST'].includes(a.choice)||Date.parse(a.at)<Date.parse(report.at))return state;
  return {...state,installationStatus:state.installationStatus==='EXECUTIVE_IMPOUND'?state.installationStatus:state.conditionReports!.some(r=>r.id!==report.id&&r.condition==='DAMAGED'&&!r.repairChoice)?'DAMAGED_PENDING_ARTIST_APPROVAL':a.choice==='DEPARTMENT'?'REPAIR_AUTHORIZED':'ARTIST_REPAIR_PLANNED',conditionReports:state.conditionReports!.map(r=>r.id===report.id?{...r,repairChoice:a.choice,repairAuthorizedAt:a.at}:r)};
 }
 if(a.type==='record-condition'){
  if(a.actor!=='LOGISTICS'||!['ARTIST_APPROVED','LOCKED'].includes(c.status)||!receipt||receipt.closedAt||Date.parse(a.at)<Date.parse(receipt.receivedAt)||!['ARTIST','DEPARTMENT'].includes(c.shippingLiability??'')||!['INTACT','DAMAGED'].includes(a.condition)||!a.id||state.conditionReports?.some(r=>r.id===a.id||r.revision===state.agreementRevision&&r.receiptReference===receipt.reference)||a.photos.length>5||!a.photos.every(validDamagePhoto)||a.condition==='DAMAGED'&&!a.photos.length)return state;
  const report:ConditionReport={id:a.id,artistId:c.artistId,contractId:c.id,revision:state.agreementRevision,receiptReference:receipt.reference,condition:a.condition,liability:c.shippingLiability!,photos:a.condition==='DAMAGED'?[...a.photos]:[],at:a.at,...(a.condition==='DAMAGED'&&c.shippingLiability==='DEPARTMENT'?{insuranceStatus:'INSURANCE_CLAIM_PENDING' as const}:{})};
  return {...state,installationStatus:a.condition==='DAMAGED'&&state.installationStatus!=='EXECUTIVE_IMPOUND'?'DAMAGED_PENDING_ARTIST_APPROVAL':state.installationStatus,conditionReports:[...(state.conditionReports??[]),report],evidence:a.condition==='DAMAGED'?{...state.evidence,floorLoadVerified:false,mountingVerified:false,technicalEvidenceGate:false,technicalRecordedAt:undefined}:state.evidence};
 }
 if(a.type==='dispatch-damage'){
  const r=state.conditionReports?.find(r=>r.id===a.reportId);
  if(a.actor!=='LOGISTICS'||!r||r.condition!=='DAMAGED'||r.liability!=='ARTIST'||r.artistDispatchedAt||Date.parse(a.at)<Date.parse(r.at))return state;
  return {...state,conditionReports:state.conditionReports!.map(r=>r.id===a.reportId?{...r,artistDispatchedAt:a.at}:r)};
 }
 if(a.type==='request-plan-b'){
  const r=state.conditionReports?.find(r=>r.id===a.reportId);
  if(a.actor!=='LOGISTICS'||!r||r.condition!=='DAMAGED'||!a.id||state.emergencyRequests?.some(x=>x.id===a.id||x.reportId===a.reportId)||!Number.isFinite(a.grant)||a.grant<=0||a.grant>10000000||!a.flight.trim()||!a.reason.trim()||Date.parse(a.at)<Date.parse(r.at))return state;
  return {...state,emergencyRequests:[...(state.emergencyRequests??[]),{id:a.id,reportId:r.id,grant:a.grant,flight:a.flight.trim(),reason:a.reason.trim(),at:a.at}]};
 }
 const request=state.emergencyRequests?.find(r=>r.id===a.requestId);
 if(!request||Date.parse(a.at)<Date.parse(request.at))return state;
 if(a.actor==='BIENNIAL_DIRECTOR'&&!request.directorDecision)return {...state,emergencyRequests:state.emergencyRequests!.map(r=>r.id===request.id?{...r,directorDecision:a.approve?'APPROVED':'REJECTED',directorAt:a.at}:r)};
 if(a.actor==='FINANCE'&&request.directorDecision==='APPROVED'&&!request.financeDecision&&Date.parse(a.at)>=Date.parse(request.directorAt!))return {...state,emergencyRequests:state.emergencyRequests!.map(r=>r.id===request.id?{...r,financeDecision:a.approve?'APPROVED':'REJECTED',financeAt:a.at}:r)};
 return state;
}
