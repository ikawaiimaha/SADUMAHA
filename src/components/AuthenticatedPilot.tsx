import {UiText} from '../context/I18nContext';
import {FreightChangeControl} from './FreightChangeControl';
import {LogisticsActionQueue} from './LogisticsActionQueue';
import {FreightClosureLedger} from './FreightClosureLedger';
import {PublicationHandoff,ExhibitionTitleHeader} from './PublicationHandoff';
import {ExhibitionTitleGate} from './ExhibitionTitleGate';
import {ArrivalFeed} from './ArrivalFeed';
import {PendingAssetTracker} from './PendingAssetTracker';
import {OperationalGuestCalendar} from './OperationalGuestCalendar';
import {GuestTravel} from './GuestTravel';
import {DigitalConditionReports} from './DigitalConditionReports';
import {FreightPickupScheduler} from './FreightPickupScheduler';
import {IdleWorkspaceLock} from './IdleWorkspaceLock';
import {ExhibitionScenario,ExhibitionChecklistQueue} from './ExhibitionScenario';
import {NominationWorkspace} from './NominationWorkspace';
import SaduIntro from './SaduIntro';
import { normalizePreviewPath } from '../lib/previewRoutes';
import { useEffect, useState, useRef, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { pilotSupabase as client } from '../lib/pilotSupabase';
import { I18nProvider, useUiText } from '../context/I18nContext';
import { institutionalRole, institutionalRoleLabels, showsPilotTool, spatialPilotRoles, type PilotTool } from '../lib/sessionRole';
type Dossier = { id: string; artist_name: string; nationality: string; medium: string; status: string };
type Space = { id: string; venue: string; room: string; curator: string };
type Claim = { id: string; space_id: string; dossier_id: string; claimed_by: string };
type Request = { id: string; claim_id: string; equipment: string; mounting: string; phase: string };
function PilotPage() {
 const {t,isAr,toggleLang}=useUiText();
 const currentUser = useRef<string | undefined>(undefined);
 const [session,setSession]=useState<Session|null>(null), [role,setRole]=useState('');
 const [email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [dossiers,setDossiers]=useState<Dossier[]>([]),[spaces,setSpaces]=useState<Space[]>([]),[claims,setClaims]=useState<Claim[]>([]),[requests,setRequests]=useState<Request[]>([]);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[signInError,setSignInError]=useState(''),[ready,setReady]=useState(false);
 // The intro lives on the proposal site; /intro and "Why SADU" keep a copy here for anyone already in the prototype.
 const [onIntro,setOnIntro]=useState(()=>normalizePreviewPath(window.location.pathname)==='/intro');
 useEffect(()=>{const onBack=()=>{setOnIntro(normalizePreviewPath(window.location.pathname)==='/intro');};window.addEventListener('popstate',onBack);return()=>window.removeEventListener('popstate',onBack);},[]);
 const openIntro=()=>{window.history.pushState(null,'','/intro');setOnIntro(true);window.scrollTo({top:0,behavior:'instant'});};
 const leaveIntro=()=>{if(onIntro)window.history.pushState(null,'','/pilot');setOnIntro(false);window.scrollTo({top:0,behavior:'instant'});};
 const [artist,setArtist]=useState(''),[nationality,setNationality]=useState(''),[medium,setMedium]=useState('');
 const [selected,setSelected]=useState(''),[claimId,setClaimId]=useState(''),[equipment,setEquipment]=useState('AV Projectors'),[mounting,setMounting]=useState('Floor Freestanding'),[phase,setPhase]=useState('FINAL_INSTALLATION');
 useEffect(()=>{if(!client)return; const {data}=client.auth.onAuthStateChange((_event,next)=>{const changed=currentUser.current!==next?.user.id;currentUser.current=next?.user.id;setSession(next);setReady(true);if(changed){setRole('');setDossiers([]);setClaims([]);setRequests([]);setMessage('');}});return()=>data.subscription.unsubscribe();},[]);
 async function refresh() {
  if(!client)return;
  const userAtStart=currentUser.current;
  // maybeSingle: an account without spatial-pilot membership is a normal state, not a failure.
  const result=await Promise.all([client.from('sadu_pilot_members').select('role').maybeSingle(),client.from('sadu_pilot_dossiers').select('*'),client.from('sadu_pilot_spaces').select('*'),client.from('sadu_pilot_claims').select('*'),client.from('sadu_pilot_requests').select('*')]);
  if(userAtStart!==currentUser.current)return;
  const failed=result.find(r=>r.error);if(failed?.error)throw new Error(failed.error.message);
  setRole(result[0].data?.role??'');setDossiers(result[1].data as Dossier[]);setSpaces(result[2].data as Space[]);setClaims(result[3].data as Claim[]);setRequests(result[4].data as Request[]);
 }
 useEffect(()=>{if(!session)return;let active=true;refresh().catch(()=>{if(active)setMessage(t('Pilot records could not be loaded. Use Refresh records, or ask an administrator to check your access.','تعذّر تحميل سجلات التجربة. استخدم «تحديث السجلات»، أو اطلب من مسؤول النظام التحقق من صلاحياتك.'));});return()=>{active=false;};},[session]);
 async function run(work:()=>PromiseLike<{error: {message:string;code?:string}|null}>,success:string) {
  if(busy)return;setBusy(true);setMessage('');
  try {const result=await work();if(result.error)throw new Error(result.error.code==='23505'?t('This room or request is already claimed/recorded. Refresh the board.','هذه القاعة أو هذا الطلب محجوز أو مسجّل مسبقاً. حدّث اللوحة.'):result.error.message);await refresh();setMessage(success);}catch(error){setMessage(error instanceof Error?error.message:t('Operation failed','تعذّر تنفيذ العملية'));}finally{setBusy(false);}
 }
 const field='mt-1 block w-full rounded-md border border-[#D9CEBA] bg-white ps-3 pe-3 py-2 font-normal';
 const button='rounded-md bg-[#8B261E] ps-4 pe-4 py-2 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed';
 const quiet='rounded-md border border-[#CBB89F] bg-white ps-4 pe-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed';
 const panel='space-y-4 rounded-xl border border-[#E4D8C4] bg-white ps-5 pe-5 py-5';
 if(onIntro)return <SaduIntro signedIn={!!session} onContinue={leaveIntro}/>;
 if(!client)return <main className="grid min-h-[70vh] place-items-center ps-4 pe-4"><section className="max-w-md space-y-3 rounded-xl border border-[#E4D8C4] bg-white ps-6 pe-6 py-6 text-start"><p className="font-serif text-2xl text-[#8B261E]">{isAr?'سدو':'SADU'}</p><h1 className="text-xl font-semibold">{t('Nominations is not connected yet','الترشيحات غير متصلة بعد')}</h1><p className="text-[#5E554B]">{t('This copy of SADU has no database connection, so nobody can sign in here yet. The site owner adds it in the hosting settings.','لا يتصل هذا الإصدار من سدو بقاعدة بيانات، لذلك لا يمكن تسجيل الدخول هنا بعد. يضيف صاحب الموقع الاتصال من إعدادات الاستضافة.')}</p><p className="text-sm text-[#6E6259]" dir="ltr">VITE_SUPABASE_URL · VITE_SUPABASE_PUBLISHABLE_KEY</p><a className="inline-block text-[#8B261E] underline" href="/journey">{t('Open the practice demo instead','فتح العرض التدريبي بدلاً من ذلك')}</a></section></main>;
 const access=institutionalRole(session);
 const label=institutionalRoleLabels[access];
 const roleName=label?(isAr?label.ar:label.en):'';
 const shows=(tool:PilotTool)=>showsPilotTool(access,tool);
 const inSpatialPilot=!!role;
 const hasTools=(['nominations','titleHeader','titleGate','pendingAssets','guestCalendar','guestTravel','conditionReports','finalDeliverables','freightPickup','checklistQueue','arrivalFeed','freightChange','logisticsQueue','freightClosure','publicationHandoff'] as PilotTool[]).some(shows);
 // Stored values stay in English; only their display is translated.
 const optionLabels:Record<string,string>={'AV Projectors':t('AV Projectors','أجهزة العرض المرئي والصوتي'),'Lighting Rig':t('Lighting Rig','منظومة الإضاءة'),'Pedestal':t('Pedestal','قاعدة عرض'),'Floor Freestanding':t('Floor Freestanding','قائم على الأرض'),'Ceiling Mount':t('Ceiling Mount','تثبيت في السقف'),'Wall Anchor':t('Wall Anchor','تثبيت على الجدار'),'PROTOTYPING':t('PROTOTYPING','النموذج الأولي'),'FINAL_INSTALLATION':t('FINAL_INSTALLATION','التركيب النهائي'),'DRAFT':t('DRAFT','مسودة'),'APPROVED':t('APPROVED','معتمد')};
 const shown=(value:string)=>optionLabels[value]??value;
 // During the nomination trial the Coordinator's other tools stay available but out of the way.
 const otherTools=(children:ReactNode)=>shows('nominations')?<details className="rounded-xl border border-dashed border-[#D9CEBA] ps-5 pe-5 py-3 text-sm"><summary className="cursor-pointer text-[#6E6259]">{t('Other pilot tools (not part of the nomination trial)','أدوات تجريبية أخرى (خارج تجربة الترشيحات)')}</summary><div className="space-y-6 pt-4">{children}</div></details>:children;
 return <IdleWorkspaceLock isAr={isAr} enabled={!!session} identity={session?.user.id??'signed-out'} reauthenticate={async password=>{if(!session?.user.email)return false;const expected=session.user.id;const {data,error}=await client.auth.signInWithPassword({email:session.user.email,password});return !error&&data.user?.id===expected;}}><main className="mx-auto max-w-6xl space-y-6 ps-4 pe-4 sm:ps-6 sm:pe-6 py-6 text-start text-[#1A1817]">
  <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-[#E4D8C4] pb-4">
   <a href="/pilot" className="me-auto flex items-baseline gap-3 no-underline"><span className="font-serif text-3xl text-[#8B261E]">{isAr?'سدو':'SADU'}</span><span className="text-sm text-[#6E6259]">{t('Exhibition coordination','تنسيق المعارض')}</span></a>
   <a href="/intro" className="text-sm text-[#6E6259] underline-offset-4 hover:underline" onClick={e=>{e.preventDefault();openIntro();}}>{t('Why SADU','لماذا السدو')}</a>
   <button type="button" lang={isAr?'en':'ar'} className={quiet+' !py-1.5 text-sm'} onClick={toggleLang}>{isAr?'English':'العربية'}</button>
   {session&&<details className="relative"><summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-[#CBB89F] bg-white ps-3 pe-3 py-1.5 text-sm [&::-webkit-details-marker]:hidden"><span aria-hidden className="grid size-6 place-items-center rounded-full bg-[#8B261E] text-xs font-semibold text-white">{(session.user.email??'?').charAt(0).toUpperCase()}</span><span className="max-w-40 truncate">{roleName||t('No institutional role','لا يوجد دور مؤسسي')}</span></summary>
    <div className="absolute end-0 z-20 mt-2 w-64 space-y-2 rounded-xl border border-[#E4D8C4] bg-white ps-4 pe-4 py-4 text-sm shadow-lg"><p><strong className="block">{roleName||t('No institutional role','لا يوجد دور مؤسسي')}</strong><bdi dir="ltr" className="block truncate text-[#5E554B]">{session.user.email}</bdi></p>
     <button type="button" className="block w-full text-start underline-offset-4 hover:underline" disabled={busy} onClick={()=>void run(async()=>{await refresh();return {error:null};},t('Records refreshed','تم تحديث السجلات'))}>{t('Refresh records','تحديث السجلات')}</button>
     <button type="button" className="block w-full text-start text-[#8B261E] underline-offset-4 hover:underline" disabled={busy} onClick={async()=>{await client.auth.signOut();setMessage('');}}>{t('Sign out','تسجيل الخروج')}</button></div></details>}
  </header>
  {!session ? <form className="mx-auto mt-6 max-w-md space-y-4 rounded-xl border border-[#E4D8C4] bg-white ps-6 pe-6 py-6 shadow-sm" onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setSignInError('');const {error}=await client.auth.signInWithPassword({email,password});setPassword('');setSignInError(error?t('Sign-in failed. Check your email and password and try again.','تعذّر تسجيل الدخول. تحقّق من البريد الإلكتروني وكلمة المرور ثم حاول مجدداً.'):'');setBusy(false);}}><div><h1 className="font-serif text-2xl">{t('Sign in','تسجيل الدخول')}</h1><p className="text-sm text-[#6E6259]">{t('Use the SADU account the administrator set up for you.','استخدم حساب سدو الذي أعدّه لك مسؤول النظام.')}</p><a href="/intro" className="mt-2 inline-block text-sm text-[#8B261E] underline-offset-4 hover:underline" onClick={e=>{e.preventDefault();openIntro();}}>{t('New to SADU? See why it exists','جديد على السدو؟ تعرّف إلى سبب وجوده')}</a></div><label className="block text-sm font-medium">{t('Email','البريد الإلكتروني')}<input required type="email" dir="ltr" autoComplete="username" className={field} value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="block text-sm font-medium">{t('Password','كلمة المرور')}<input required type="password" dir="ltr" autoComplete="current-password" className={field} value={password} onChange={e=>setPassword(e.target.value)}/></label><button className={button+' w-full'} disabled={busy||!ready} aria-busy={busy}>{busy?t('Signing in…','جارٍ تسجيل الدخول…'):t('Sign in','تسجيل الدخول')}</button>{signInError&&<p role="alert" className="text-[#8B261E]"><UiText value={signInError}/></p>}</form> : <>
   <p role="status" aria-live="polite" className="empty:hidden"><UiText value={message}/></p>
   {!label&&<section className={panel}><h2 className="text-xl">{t('No role assigned yet','لم يُسند دور بعد')}</h2><p>{t('This account has no institutional role, so no pilot tools are shown. Ask an administrator to add your role, then sign out and sign in again.','لا يملك هذا الحساب دوراً مؤسسياً، لذلك لا تظهر أدوات التجربة. اطلب من مسؤول النظام إضافة دورك، ثم سجّل الخروج وادخل مجدداً.')}</p></section>}
   {shows('nominations')&&<NominationWorkspace userId={session.user.id}/>}
   {shows('titleHeader')&&!shows('nominations')&&<ExhibitionTitleHeader/>}
   {shows('titleGate')&&<ExhibitionTitleGate curator/>}
   {inSpatialPilot?<details className={shows('nominations')?'rounded-xl border border-dashed border-[#D9CEBA] ps-5 pe-5 py-3 text-sm':panel} open={!shows('nominations')}><summary className={shows('nominations')?'cursor-pointer text-[#6E6259]':'cursor-pointer text-xl'}>{t('Room-booking trial (separate pilot)','تجربة حجز القاعات (تجربة منفصلة)')}</summary><div className="space-y-6 pt-4">
    {role==='COORDINATOR'&&<form className={panel} onSubmit={e=>{e.preventDefault();void run(()=>client.from('sadu_pilot_dossiers').insert({artist_name:artist.trim(),nationality:nationality.trim(),medium:medium.trim()}),t('Dossier saved for Director review','حُفظ الملف لمراجعة المدير'));}}><h2 className="text-xl">{t('Create pilot dossier','إنشاء ملف تجريبي')}</h2>{([[t('Artist name','اسم الفنان'),artist,setArtist],[t('Nationality','الجنسية'),nationality,setNationality],[t('Medium','الوسيط الفني'),medium,setMedium]] as [string,string,(v:string)=>void][]).map(([fieldLabel,value,setter])=><label key={fieldLabel} className="block">{fieldLabel}<input required maxLength={100} className={field} value={value} onChange={e=>setter(e.target.value)}/></label>)}<button className={button} disabled={busy}>{t('Save dossier','حفظ الملف')}</button></form>}
    <section className={panel}><h2 className="text-xl">{t('Dossier queue','قائمة الملفات')}</h2>{!dossiers.length&&<p>{t('No visible dossiers.','لا توجد ملفات ظاهرة.')}</p>}{dossiers.map(d=><article key={d.id} className="border-b py-3"><p>{d.artist_name} · {d.nationality} · {d.medium} · {shown(d.status)}</p>{role==='BIENNIAL_DIRECTOR'&&d.status==='DRAFT'&&<button className={button} disabled={busy} onClick={()=>void run(()=>client.from('sadu_pilot_dossiers').update({status:'APPROVED'}).eq('id',d.id).select().single(),t('Pilot dossier approved','اعتُمد الملف التجريبي'))}>{t('Approve pilot scope','اعتماد نطاق التجربة')}</button>}</article>)}</section>
    <section className={panel}><h2 className="text-xl">{t('Shared venue ledger','سجل القاعات المشترك')}</h2>{role==='COORDINATOR'&&<label className="block">{t('Approved dossier','الملف المعتمد')}<select className={field} value={selected} onChange={e=>setSelected(e.target.value)}><option value="">{t('Select dossier','اختر الملف')}</option>{dossiers.filter(d=>d.status==='APPROVED'&&!claims.some(c=>c.dossier_id===d.id)).map(d=><option key={d.id} value={d.id}>{d.artist_name}</option>)}</select></label>}{spaces.map(s=>{const claim=claims.find(c=>c.space_id===s.id);return <article key={s.id} className="space-y-2 border-b py-3"><h3>{s.venue} · {s.room}</h3><p>{t('Authority','الجهة المختصة')}: {s.curator}</p><p>{claim?t('CLAIMED','محجوزة')+' · '+(dossiers.find(d=>d.id===claim.dossier_id)?.artist_name??t('Another coordinator’s dossier','ملف منسق آخر')):t('AVAILABLE','متاحة')}</p>{!claim&&role==='COORDINATOR'&&<button className={button} disabled={busy||!selected} onClick={()=>void run(()=>client.from('sadu_pilot_claims').insert({space_id:s.id,dossier_id:selected}),t('Room claimed; venue approval still required','حُجزت القاعة، وما زالت موافقة جهة العرض مطلوبة'))}>{t('Claim room','حجز القاعة')}</button>}</article>})}</section>
    {['COORDINATOR','TECHNICAL'].includes(role)&&<form className={panel} onSubmit={e=>{e.preventDefault();void run(()=>client.from('sadu_pilot_requests').insert({claim_id:claimId,equipment,mounting,phase}),t('Technical request saved','حُفظ الطلب الفني'));}}><h2 className="text-xl">{t('Technical request','طلب فني')}</h2><label className="block">{t('Claimed room','القاعة المحجوزة')}<select required className={field} value={claimId} onChange={e=>setClaimId(e.target.value)}><option value="">{t('Select claimed room','اختر القاعة المحجوزة')}</option>{claims.filter(c=>role==='TECHNICAL'||c.claimed_by===session.user.id).map(c=><option key={c.id} value={c.id}>{spaces.find(s=>s.id===c.space_id)?.venue} · {c.space_id}</option>)}</select></label>{[{label:t('Equipment','المعدات'),value:equipment,set:setEquipment,options:['AV Projectors','Lighting Rig','Pedestal']},{label:t('Mounting','طريقة التثبيت'),value:mounting,set:setMounting,options:['Floor Freestanding','Ceiling Mount','Wall Anchor']},{label:t('Phase','المرحلة'),value:phase,set:setPhase,options:['PROTOTYPING','FINAL_INSTALLATION']}].map(f=><label className="block" key={f.label}>{f.label}<select className={field} value={f.value} onChange={e=>f.set(e.target.value)}>{f.options.map(o=><option key={o} value={o}>{shown(o)}</option>)}</select></label>)}<button className={button} disabled={busy||!claimId}>{t('Record request','تسجيل الطلب')}</button></form>}
    <section className={panel}><h2 className="text-xl">{t('Execution ledger','سجل التنفيذ')}</h2>{!requests.length&&<p>{t('No requests recorded.','لا توجد طلبات مسجّلة.')}</p>}{requests.map(r=>{const claim=claims.find(c=>c.id===r.claim_id),space=spaces.find(s=>s.id===claim?.space_id);return <article key={r.id} className="border-b py-3"><p>{shown(r.equipment)} · {shown(r.mounting)} · {shown(r.phase)}</p><p>{t('Equipment: Technical & AV','المعدات: الفريق الفني والمرئي والصوتي')} · PENDING_INVENTORY_CHECK</p>{(r.mounting!=='Floor Freestanding'||r.equipment==='Lighting Rig')&&<p>{t('Structural','الإنشائي')}: {space?.curator} · {space?.room} · PENDING_VENUE_APPROVAL</p>}</article>})}</section>
   </div></details>:spatialPilotRoles.includes(access)&&!shows('nominations')&&<section className={panel}><h2 className="text-xl">{t('Dossier queue','قائمة الملفات')}</h2><p>{t('Your account is not enrolled in the spatial pilot yet, so dossiers, rooms and technical requests are hidden. Ask an administrator to add you to the pilot.','حسابك غير مسجّل في تجربة القاعات بعد، لذلك تُخفى الملفات والقاعات والطلبات الفنية. اطلب من مسؤول النظام إضافتك إلى التجربة.')}</p></section>}
   {otherTools(<>
   {shows('titleHeader')&&shows('nominations')&&<ExhibitionTitleHeader/>}
   {shows('pendingAssets')&&<PendingAssetTracker/>}
   {shows('guestCalendar')&&<OperationalGuestCalendar key={session.user.id}/>}
   {shows('guestTravel')&&<GuestTravel key={session.user.id} review={access==='PR_PROTOCOL'}/>}
   {shows('conditionReports')&&<DigitalConditionReports actor={access==='LOGISTICS'?'LOGISTICS':access==='TECHNICAL'?'TECHNICAL':'ARTIST'}/>}
   {shows('finalDeliverables')&&<ExhibitionScenario/>}
   {shows('checklistQueue')&&<ExhibitionChecklistQueue/>}
   {shows('freightPickup')&&<FreightPickupScheduler key={session.user.id} logistics={access==='LOGISTICS'}/>}
   {shows('arrivalFeed')&&<ArrivalFeed/>}
   {shows('freightChange')&&<FreightChangeControl actor={access}/>}
   {shows('logisticsQueue')&&<LogisticsActionQueue key={'logistics:'+session.user.id} artist={access==='ARTIST'} officer={access==='LOGISTICS'}/>}
   {shows('freightClosure')&&<FreightClosureLedger key={session.user.id} logistics={access==='LOGISTICS'} vendor={access==='EXTERNAL_VENDOR'}/>}
   {shows('publicationHandoff')&&<PublicationHandoff editorial={access==='EDITORIAL'}/>}
   </>)}
   {label&&!hasTools&&!inSpatialPilot&&<section className={panel}><h2 className="text-xl">{t('Nothing to do here yet','لا توجد مهام هنا بعد')}</h2><p>{t(`The pilot has no live tools for the ${label.en} role yet. Your work continues in the session rehearsal.`,`لا تتوفر بعد في التجربة أدوات مباشرة لدور ${label.ar}. يستمر عملك في تمرين الجلسة.`)}</p><a className="underline" href="/journey">{t('Open the session rehearsal','فتح تمرين الجلسة')}</a></section>}
  </>}
  <footer className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[#E4D8C4] pt-4 text-xs text-[#6E6259]"><p className="me-auto">{t('Private pilot. Nothing is sent outside SADU; it does not replace the institutional vetting process.','تجربة خاصة. لا يُرسل شيء خارج سدو، ولا تحلّ محل إجراءات التدقيق المؤسسي.')}</p><a className="underline" href="/journey">{t('Practice demo','العرض التدريبي')}</a></footer>
 </main></IdleWorkspaceLock>;
}

// Arabic first, with the language choice shared with the rest of the app (I18nProvider persists it).
export default function AuthenticatedPilot() {
 return <I18nProvider><PilotPage/></I18nProvider>;
}
