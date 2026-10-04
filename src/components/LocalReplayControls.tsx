import {useEffect,useState} from 'react';
import {exportDemoReplay,replayAllowed,replayStatus} from '../lib/demoReplay';
export default function LocalReplayControls(){
 const [state,setState]=useState(replayStatus);
 useEffect(()=>{const update=()=>setState(replayStatus());const warn=(e:BeforeUnloadEvent)=>{if(replayStatus().unsaved){e.preventDefault();e.returnValue='';}};window.addEventListener('sadu:replay-status',update);window.addEventListener('beforeunload',warn);return()=>{window.removeEventListener('sadu:replay-status',update);window.removeEventListener('beforeunload',warn);};},[]);
 if(!replayAllowed({hostname:location.hostname,pathname:location.pathname}))return null;
 const status=state.status==='recording'?'التسجيل المحلي يعمل':state.status==='stopped'?'التسجيل متوقف':state.status==='limit reached'?'بلغ التسجيل الحد المحلي':'التسجيل غير متاح';
 return <details data-private dir="rtl" lang="ar"><summary className="cursor-pointer py-3">أدوات مقدّم العرض</summary><div className="flex flex-wrap items-center gap-3 py-3"><span>{status}</span><button className="rounded border ps-3 pe-3 py-3" onClick={exportDemoReplay}>إيقاف التسجيل وتنزيله</button></div><p>يبقى التسجيل محلياً. نزّله قبل إغلاق التبويب أو تحديثه. التنقل داخل العرض لا يحتاج إلى إيقافه.</p></details>;
}
