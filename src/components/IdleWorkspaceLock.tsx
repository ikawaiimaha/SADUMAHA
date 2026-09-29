import {useEffect,useRef,useState,type ReactNode} from 'react';
import {LockKeyhole} from 'lucide-react';
import {NativeModal} from './common/NativeModal';
import {idlePhase,IDLE_LOCK_MS,type IdlePhase} from '../data/idleLock';
interface Props {children:ReactNode;isAr?:boolean;enabled?:boolean;identity?:string;reauthenticate?:(password:string)=>Promise<boolean>}
export function IdleWorkspaceLock({children,isAr=false,enabled=true,identity='rehearsal',reauthenticate}:Props){
 const key=`sadu-idle:${identity}`;
 const read=()=>{try{const n=Number(sessionStorage.getItem(key));return n>0&&n<=Date.now()?n:Date.now();}catch{return Date.now();}};
 const last=useRef(read()),locked=useRef(false),pending=useRef(false);
 const [phase,setPhase]=useState<IdlePhase>(()=>enabled?idlePhase(last.current,Date.now()):'active');
 const [seconds,setSeconds]=useState(60),[password,setPassword]=useState(''),[error,setError]=useState(false),[busy,setBusy]=useState(false);
 const reset=()=>{last.current=Date.now();locked.current=false;setPhase('active');setError(false);try{sessionStorage.setItem(key,String(last.current));}catch{/* In-memory fallback. */}};
 useEffect(()=>{
  last.current=read();locked.current=false;setPhase(enabled?idlePhase(last.current,Date.now()):'active');
  if(!enabled)return;
  try{sessionStorage.setItem(key,String(last.current));}catch{/* In-memory fallback. */}
  const check=()=>{const next=idlePhase(last.current,Date.now(),locked.current);locked.current=next==='locked';setPhase(next);setSeconds(Math.max(0,Math.ceil((IDLE_LOCK_MS-(Date.now()-last.current))/1000)));};
  const activity=()=>{if(idlePhase(last.current,Date.now(),locked.current)==='locked'){check();return;}last.current=Date.now();setPhase('active');try{sessionStorage.setItem(key,String(last.current));}catch{/* In-memory fallback. */}};
  const events=['keydown','pointerdown','pointermove','wheel','touchstart'];
  events.forEach(e=>window.addEventListener(e,activity,{passive:true}));document.addEventListener('visibilitychange',check);window.addEventListener('focus',check);
  const timer=window.setInterval(check,1000);check();
  return()=>{clearInterval(timer);events.forEach(e=>window.removeEventListener(e,activity));document.removeEventListener('visibilitychange',check);window.removeEventListener('focus',check);};
 },[enabled,identity]);
 const isLocked=enabled&&phase==='locked';
 const t=(ar:string,en:string)=>isAr?ar:en;
 async function unlock(){if(pending.current)return;pending.current=true;setBusy(true);setError(false);try{if(!reauthenticate||await reauthenticate(password))reset();else setError(true);}catch{setError(true);}finally{setPassword('');pending.current=false;setBusy(false);}}
 return <><div inert={isLocked} aria-hidden={isLocked||undefined} style={isLocked?{visibility:'hidden'}:undefined}>{children}</div>
 {enabled&&phase==='active'&&<button type="button" className="fixed bottom-3 end-3 z-40 rounded border border-sadu-gold bg-sadu-linen ps-3 pe-3 py-2 text-sm text-sadu-ink" onClick={()=>{locked.current=true;last.current=Date.now()-IDLE_LOCK_MS;try{sessionStorage.setItem(key,String(last.current));}catch{/* In-memory fallback. */}setPhase('locked');}}><LockKeyhole aria-hidden="true" className="me-2 inline size-4"/>{t('قفل الآن','Lock now')}</button>}
 {enabled&&phase==='warning'&&<aside role="alert" className="fixed bottom-4 start-4 end-4 z-50 rounded border border-sadu-ochre bg-sadu-linen ps-4 pe-4 py-3 text-sadu-ink"><p>{t('سيتم قفل مساحة العمل خلال','Workspace locks in')} {seconds} {t('ثانية.','seconds.')}</p><button type="button" onClick={()=>{if(idlePhase(last.current,Date.now(),locked.current)!=='locked')reset();}} className="mt-2 rounded bg-sadu-brick ps-4 pe-4 py-2 text-white">{t('متابعة العمل','Stay active')}</button></aside>}
 <NativeModal isOpen={isLocked} onClose={()=>{}} labelledBy="idle-lock-title" className="max-w-md"><section dir={isAr?'rtl':'ltr'} className="space-y-4 rounded bg-sadu-linen ps-6 pe-6 py-6 text-start text-sadu-ink"><LockKeyhole aria-hidden="true"/><h2 id="idle-lock-title">{reauthenticate?t('مساحة العمل مقفلة','Workspace locked'):t('قفل الخصوصية — محاكاة','Privacy lock — rehearsal')}</h2><p>{reauthenticate?t('أدخل كلمة مرور الحساب نفسه للمتابعة.','Enter the same account password to continue.'):t('هذا قفل خصوصية للعرض التجريبي، وليس تحققاً من الهوية.','This rehearsal privacy lock is not authentication.')}</p><p>{t('تبقى المسودات وعمليات الرفع قيد التشغيل.','Drafts remain mounted and uploads continue in the background.')}</p><form onSubmit={e=>{e.preventDefault();void unlock();}} className="space-y-3">{reauthenticate&&<label className="block">{t('كلمة المرور','Password')}<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded border ps-3 pe-3 py-2"/></label>}{error&&<p role="alert">{t('تعذر التحقق. حاول مرة أخرى عند الاتصال.','Verification failed. Check your connection and try again.')}</p>}<button disabled={busy||(!!reauthenticate&&!password)} className="rounded bg-sadu-brick ps-4 pe-4 py-2 text-white disabled:opacity-50">{busy?t('جارٍ التحقق','Verifying'):reauthenticate?t('تحقق وافتح','Verify and unlock'):t('استئناف العرض','Resume rehearsal')}</button></form></section></NativeModal></>;
}
