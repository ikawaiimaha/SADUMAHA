import {useEffect,useState} from 'react';
import {exportDemoReplay,replayAllowed,replayStatus} from '../lib/demoReplay';
export default function LocalReplayControls(){
 const [state,setState]=useState(replayStatus);
 useEffect(()=>{const update=()=>setState(replayStatus());const warn=(e:BeforeUnloadEvent)=>{if(replayStatus().unsaved){e.preventDefault();e.returnValue='';}};window.addEventListener('sadu:replay-status',update);window.addEventListener('beforeunload',warn);return()=>{window.removeEventListener('sadu:replay-status',update);window.removeEventListener('beforeunload',warn);};},[]);
 if(!replayAllowed({hostname:location.hostname,pathname:location.pathname}))return null;
 return <span data-private className="flex items-center gap-2"><span>Local replay: {state.status}</span><button className="rounded border ps-3 pe-3 py-1" onClick={exportDemoReplay}>Stop &amp; export recording</button></span>;
}
