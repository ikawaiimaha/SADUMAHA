type Config={hostname:string;pathname:string};
type RecordFn=(options:any)=>(()=>void)|undefined;
export const replayAllowed=(c:Config)=>['localhost','127.0.0.1','[::1]'].includes(c.hostname)&&['/','/review','/journey','/rehearsal','/overview'].includes(c.pathname.replace(/\/+$/,'')||'/');
export function createLocalRecorder(maxBytes=8_000_000){
 const events:unknown[]=[];let bytes=0,stop:(()=>void)|undefined,finished=false,exported=false,status='idle';
 const notify=()=>{if(typeof window!=='undefined')window.dispatchEvent(new Event('sadu:replay-status'));};
 const halt=(finish=false)=>{stop?.();stop=undefined;finished ||= finish;status='stopped';notify();};
 const emit=(event:unknown)=>{if(finished)return;const size=new TextEncoder().encode(JSON.stringify(event)).length;if(bytes+size>maxBytes){halt(true);status='limit reached';notify();return;}events.push(event);bytes+=size;exported=false;};
 return {
  start(record:RecordFn){if(stop||finished)return;status='recording';stop=record({emit,maskAllInputs:true,blockSelector:'[data-private], input[type="password"], img, canvas, iframe',recordCanvas:false,inlineImages:false,collectFonts:false,inlineStylesheet:true,sampling:{mousemove:100,scroll:150}});if(finished){stop?.();stop=undefined;}if(!stop&&!finished)status='unavailable';notify();},
  stop:halt,
  custom(tag:string,payload:unknown){if(stop)emit({type:5,data:{tag,payload},timestamp:Date.now()});},
  snapshot:()=>({format:'sadu-rrweb-v1',synthetic:true,events:[...events]}),
  status:()=>({status,count:events.length,unsaved:events.length>0&&!exported}),
  exported(){exported=true;notify();},
 };
}
const recorder=createLocalRecorder();let pending:Promise<void>|undefined;let permitted=false;
export function startDemoReplay(c:Config){permitted=replayAllowed(c);if(!permitted)return Promise.resolve();if(!pending)pending=import('rrweb').then(({record})=>{if(permitted)recorder.start(record);}).catch(()=>{}).finally(()=>{pending=undefined;});return pending;}
export function pauseDemoReplay(){permitted=false;recorder.stop();}
export const replayStatus=()=>recorder.status();
export function exportDemoReplay(){recorder.stop(true);const blob=new Blob([JSON.stringify(recorder.snapshot())],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`sadu-demo-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);recorder.exported();}
const roles=['Artist','Editorial','Director','General_Exhibition_Coordinator','PR','Technical','Logistics','Museum_Operations','Finance'];
const phases=['EDITORIAL_DRAFT','EXECUTIVE_REVIEW','PUBLISHED','ARCHIVED_CLOSED'];
const physical=['Pending_Shipment','In_Transit','Customs_Clearance','On_Site_Sharjah','RETURN_FREIGHT_CLEARED'];
export function replayState(view:any){return {role:roles.includes(view?.role)?view.role:'unselected',phase:phases.includes(view?.artwork?.lifecycleStatus)?view.artwork.lifecycleStatus:phases.includes(view?.revision?.state)?view.revision.state:'unsubmitted',physical:physical.includes(view?.artwork?.physicalStatus)?view.artwork.physicalStatus:'unknown',payments:Math.min(3,view?.payments?.length??0),revision:Number.isSafeInteger(view?.revision?.sequence)?view.revision.sequence:0};}
export function trackDemoState(view:unknown){recorder.custom('SADU workflow state',replayState(view));}
export function trackDemoAction(action:string,outcome:'completed'|'blocked'){if(['initiate','sign','approve','route','workflow'].includes(action))recorder.custom('SADU action',{action,outcome});}
