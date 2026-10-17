import {UiText} from '../context/I18nContext';
import {IdleWorkspaceLock, LOCK_WORKSPACE_EVENT} from './IdleWorkspaceLock';
import {NominationWorkspace, confirmLeavingCase, leaveCaseQuestion} from './NominationWorkspace';
import SaduIntro from './SaduIntro';
import { normalizePreviewPath } from '../lib/previewRoutes';
import { useEffect, useState, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { pilotSupabase as client } from '../lib/pilotSupabase';
import { I18nProvider, useUiText } from '../context/I18nContext';
import { institutionalRole, institutionalRoleLabels, showsPilotTool } from '../lib/sessionRole';

// The hosted pilot is artist scouting for the Islamic Arts Festival and nothing else. The other
// prototype modules (freight, guest travel, room booking, condition reports…) stay in the practice
// journey and the local workbench; showing them here buried the one workflow the pilot uses.
function PilotPage() {
 const {t,isAr,toggleLang}=useUiText();
 const currentUser = useRef<string | undefined>(undefined);
 const [session,setSession]=useState<Session|null>(null);
 const [email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [busy,setBusy]=useState(false),[signInError,setSignInError]=useState(''),[ready,setReady]=useState(false);
 // Bumped by "Refresh records" so the workspace reloads from the database.
 const [reloadKey,setReloadKey]=useState(0);
 // The intro lives on the proposal site; /intro and "Why SADU" keep a copy here for anyone already in the prototype.
 const [onIntro,setOnIntro]=useState(()=>normalizePreviewPath(window.location.pathname)==='/intro');
 useEffect(()=>{const onBack=()=>{setOnIntro(normalizePreviewPath(window.location.pathname)==='/intro');};window.addEventListener('popstate',onBack);return()=>window.removeEventListener('popstate',onBack);},[]);
 const openIntro=()=>{window.history.pushState(null,'','/intro');setOnIntro(true);window.scrollTo({top:0,behavior:'instant'});};
 const leaveIntro=()=>{if(onIntro)window.history.pushState(null,'','/pilot');setOnIntro(false);window.scrollTo({top:0,behavior:'instant'});};
 useEffect(()=>{if(!client)return; const {data}=client.auth.onAuthStateChange((_event,next)=>{currentUser.current=next?.user.id;setSession(next);setReady(true);});return()=>data.subscription.unsubscribe();},[]);
 const field='mt-1 block w-full rounded-md border border-[#D9CEBA] bg-white ps-3 pe-3 py-2 font-normal';
 const button='rounded-md bg-[#8B261E] ps-4 pe-4 py-2 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed';
 const quiet='rounded-md border border-[#CBB89F] bg-white ps-4 pe-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed';
 const panel='space-y-3 rounded-xl border border-[#E4D8C4] bg-white ps-5 pe-5 py-5';
 const menuItem='block w-full rounded ps-2 pe-2 py-1.5 text-start hover:bg-[#F7F1E6]';
 if(onIntro)return <SaduIntro signedIn={!!session} onContinue={leaveIntro}/>;
 if(!client)return <main className="grid min-h-[70vh] place-items-center ps-4 pe-4"><section className="max-w-md space-y-3 rounded-xl border border-[#E4D8C4] bg-white ps-6 pe-6 py-6 text-start"><p className="font-serif text-2xl text-[#8B261E]">{isAr?'سدو':'SADU'}</p><h1 className="text-xl font-semibold">{t('Nominations is not connected yet','الترشيحات غير متصلة بعد')}</h1><p className="text-[#5E554B]">{t('This copy of SADU has no database connection, so nobody can sign in here yet. The site owner adds it in the hosting settings.','لا يتصل هذا الإصدار من سدو بقاعدة بيانات، لذلك لا يمكن تسجيل الدخول هنا بعد. يضيف صاحب الموقع الاتصال من إعدادات الاستضافة.')}</p><p className="text-sm text-[#6E6259]" dir="ltr">VITE_SUPABASE_URL · VITE_SUPABASE_PUBLISHABLE_KEY</p><a className="inline-block text-[#8B261E] underline" href="/journey">{t('Open the practice demo instead','فتح العرض التدريبي بدلاً من ذلك')}</a></section></main>;
 const access=institutionalRole(session);
 const label=institutionalRoleLabels[access];
 const roleName=label?(isAr?label.ar:label.en):'';
 const closeMenu=(e:{currentTarget:HTMLElement})=>e.currentTarget.closest('details')?.removeAttribute('open');
 return <IdleWorkspaceLock isAr={isAr} enabled={!!session} floatingButton={false} identity={session?.user.id??'signed-out'} reauthenticate={async password=>{if(!session?.user.email)return false;const expected=session.user.id;const {data,error}=await client.auth.signInWithPassword({email:session.user.email,password});return !error&&data.user?.id===expected;}}><main className="mx-auto max-w-6xl space-y-6 ps-4 pe-4 sm:ps-6 sm:pe-6 py-5 sm:py-6 text-start text-[#1A1817]">
  <header className="flex items-center gap-3 border-b border-[#E4D8C4] pb-4">
   <a href="/pilot" className="me-auto flex min-w-0 items-baseline gap-3 no-underline"><span className="font-serif text-3xl text-[#8B261E]">{isAr?'سدو':'SADU'}</span><span className="hidden text-sm text-[#6E6259] sm:inline">{t('Artist scouting','استكشاف الفنانين')}</span></a>
   <a href="/intro" className={`text-sm text-[#6E6259] underline-offset-4 hover:underline ${session?'hidden sm:inline':''}`} onClick={e=>{e.preventDefault();if(confirmLeavingCase(leaveCaseQuestion(t)))openIntro();}}>{t('Why SADU','لماذا السدو')}</a>
   <button type="button" lang={isAr?'en':'ar'} className={quiet+' !ps-3 !pe-3 !py-1.5 text-sm'} onClick={toggleLang}>{isAr?'English':'العربية'}</button>
   {session&&<details className="relative"><summary aria-label={t('Account','الحساب')} className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-[#CBB89F] bg-white ps-1.5 pe-1.5 py-1 text-sm sm:ps-3 sm:pe-3 [&::-webkit-details-marker]:hidden"><span aria-hidden className="grid size-6 place-items-center rounded-full bg-[#8B261E] text-xs font-semibold text-white">{(session.user.email??'?').charAt(0).toUpperCase()}</span><span className="hidden max-w-40 truncate sm:inline">{roleName||t('No institutional role','لا يوجد دور مؤسسي')}</span></summary>
    <div className="absolute end-0 z-20 mt-2 w-64 space-y-1 rounded-xl border border-[#E4D8C4] bg-white ps-3 pe-3 py-3 text-sm shadow-lg"><p className="ps-2 pe-2 pb-2"><strong className="block">{roleName||t('No institutional role','لا يوجد دور مؤسسي')}</strong><bdi dir="ltr" className="block truncate text-[#5E554B]">{session.user.email}</bdi></p>
     <button type="button" className={menuItem} onClick={e=>{closeMenu(e);if(confirmLeavingCase(leaveCaseQuestion(t)))setReloadKey(k=>k+1);}}>{t('Refresh records','تحديث السجلات')}</button>
     <button type="button" className={menuItem+' sm:hidden'} onClick={e=>{closeMenu(e);if(confirmLeavingCase(leaveCaseQuestion(t)))openIntro();}}>{t('Why SADU','لماذا السدو')}</button>
     <button type="button" className={menuItem} onClick={e=>{closeMenu(e);window.dispatchEvent(new Event(LOCK_WORKSPACE_EVENT));}}>{t('Lock workspace','قفل مساحة العمل')}</button>
     <button type="button" className={menuItem+' text-[#8B261E]'} onClick={async()=>{if(confirmLeavingCase(leaveCaseQuestion(t)))await client.auth.signOut();}}>{t('Sign out','تسجيل الخروج')}</button></div></details>}
  </header>
  {!session ? <form className="mx-auto mt-6 max-w-md space-y-4 rounded-xl border border-[#E4D8C4] bg-white ps-6 pe-6 py-6 shadow-sm" onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setSignInError('');const {error}=await client.auth.signInWithPassword({email,password});setPassword('');setSignInError(error?t('Sign-in failed. Check your email and password and try again.','تعذّر تسجيل الدخول. تحقّق من البريد الإلكتروني وكلمة المرور ثم حاول مجدداً.'):'');setBusy(false);}}><div><h1 className="font-serif text-2xl">{t('Sign in','تسجيل الدخول')}</h1><p className="text-sm text-[#6E6259]">{t('Use the SADU account the administrator set up for you.','استخدم حساب سدو الذي أعدّه لك مسؤول النظام.')}</p><a href="/intro" className="mt-2 inline-block text-sm text-[#8B261E] underline-offset-4 hover:underline" onClick={e=>{e.preventDefault();openIntro();}}>{t('New to SADU? See why it exists','جديد على السدو؟ تعرّف إلى سبب وجوده')}</a></div><label className="block text-sm font-medium">{t('Email','البريد الإلكتروني')}<input required type="email" dir="ltr" autoComplete="username" className={field} value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="block text-sm font-medium">{t('Password','كلمة المرور')}<input required type="password" dir="ltr" autoComplete="current-password" className={field} value={password} onChange={e=>setPassword(e.target.value)}/></label><button className={button+' w-full'} disabled={busy||!ready} aria-busy={busy}>{busy?t('Signing in…','جارٍ تسجيل الدخول…'):t('Sign in','تسجيل الدخول')}</button>{signInError&&<p role="alert" className="text-[#8B261E]"><UiText value={signInError}/></p>}</form>
  : showsPilotTool(access,'nominations') ? <NominationWorkspace key={`${session.user.id}:${reloadKey}`} userId={session.user.id}/>
  : showsPilotTool(access,'nominationsRead') ? <NominationWorkspace key={`${session.user.id}:${reloadKey}`} userId={session.user.id} readOnly/>
  : <section className={panel+' max-w-2xl'}>
     <h1 className="font-serif text-2xl">{label?t('Nothing for this role in the pilot yet','لا مهام لهذا الدور في التجربة بعد'):t('No role assigned yet','لم يُسند دور بعد')}</h1>
     <p>{t('The pilot starts with artist scouting for the Islamic Arts Festival: coordinators build each artist’s case in SADU from published sources, without contacting the artist.','تبدأ التجربة باستكشاف الفنانين لمهرجان الفنون الإسلامية: يُعدّ المنسقون ملف كل فنان في سدو من المصادر المنشورة، دون التواصل مع الفنان.')}</p>
     <p>{t('The Committee and the Director receive the Committee deck by email and reply by email, so they do not need to sign in.','تتلقى اللجنة والمدير العرض التقديمي بالبريد الإلكتروني ويردّان بالبريد، لذلك لا يحتاجان إلى تسجيل الدخول.')}</p>
     <p className="text-sm text-[#6E6259]">{label?t(`Signed in as ${label.en}. Coordinator accounts see the scouting workspace.`,`مسجّل بدور ${label.ar}. تظهر مساحة الاستكشاف لحسابات المنسقين.`):t('This account has no institutional role. Ask an administrator to add your role, then sign out and sign in again.','لا يملك هذا الحساب دوراً مؤسسياً. اطلب من مسؤول النظام إضافة دورك، ثم سجّل الخروج وادخل مجدداً.')}</p>
    </section>}
  <footer className="border-t border-[#E4D8C4] pt-4 text-xs text-[#6E6259]"><p>{t('Private pilot. Nothing is sent outside SADU; it does not replace the institutional vetting process.','تجربة خاصة. لا يُرسل شيء خارج سدو، ولا تحلّ محل إجراءات التدقيق المؤسسي.')}</p></footer>
 </main></IdleWorkspaceLock>;
}

// Arabic first, with the language choice shared with the rest of the app (I18nProvider persists it).
export default function AuthenticatedPilot() {
 return <I18nProvider><PilotPage/></I18nProvider>;
}
