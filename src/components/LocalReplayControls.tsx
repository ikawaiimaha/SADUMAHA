import {useEffect,useState} from 'react';
import {exportDemoReplay,replayAllowed,replayStatus} from '../lib/demoReplay';
import type {prelaunchCopy} from '../i18n/prelaunch.mjs';
/** Inherits lang/dir from the surrounding preview bar. */
export default function LocalReplayControls({copy}:{copy:typeof prelaunchCopy['en']}){
 const [state,setState]=useState(replayStatus);
 useEffect(()=>{const update=()=>setState(replayStatus());const warn=(e:BeforeUnloadEvent)=>{if(replayStatus().unsaved){e.preventDefault();e.returnValue='';}};window.addEventListener('sadu:replay-status',update);window.addEventListener('beforeunload',warn);return()=>{window.removeEventListener('sadu:replay-status',update);window.removeEventListener('beforeunload',warn);};},[]);
 if(!replayAllowed({hostname:location.hostname,pathname:location.pathname}))return null;
 const status=state.status==='recording'?copy.recording:state.status==='stopped'?copy.stopped:state.status==='limit reached'?copy.limitReached:copy.unavailable;
 return <details data-private><summary className="cursor-pointer py-3">{copy.presenterTools}</summary><div className="flex flex-wrap items-center gap-3 py-3"><span>{status}</span><button className="rounded border ps-3 pe-3 py-3" onClick={exportDemoReplay}>{copy.exportReplay}</button></div><p>{copy.replayNote}</p></details>;
}
