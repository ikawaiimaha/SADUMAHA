import {VisaAuthorityPanel} from './VisaAuthorityPanel';
import {GuestItineraryApproval} from './OperationalGuestCalendar';
import {GuestIdentityFields,GuestIdentityReview} from './GuestIdentityFields';
import {validGuestIdentity,guestDeadline,passportMinimumExpiry,requiresNationalId,type GuestDocumentPolicy} from '../data/guestIdentity';
import {useEffect,useRef,useState} from 'react';
import {Plane,FileCheck,RefreshCw,ShieldAlert} from 'lucide-react';
import {pilotSupabase as client} from '../lib/pilotSupabase';
import {validatePassport,validatePersonalPhoto} from '../data/prFileValidation';
import {validTravelDates,latestGuestRows,guestFilesComplete,type GuestTravelRow} from '../data/guestTravel';
import {useUiText} from '../context/I18nContext';
const field='block w-full rounded border bg-[#FFFDF7] ps-3 pe-3 py-2';
const button='rounded border ps-3 pe-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed';
type Contract={id:string;artist_name:string};
/** The authenticated owner/PR policies apply independently of the rehearsal role selector. */
export function GuestTravel({review=false}:{review?:boolean}){
 const {t,pair,isAr}=useUiText();
 const [policy,setPolicy]=useState<GuestDocumentPolicy|null>(null);
 const [contracts,setContracts]=useState<Contract[]>([]),[rows,setRows]=useState<GuestTravelRow[]>([]);
 const [contract,setContract]=useState(''),[arrival,setArrival]=useState(''),[departure,setDeparture]=useState(''),[airport,setAirport]=useState('');
 const [plans,setPlans]=useState<{id:string;contract_id:string;arrival:string;departure:string;created_at:string}[]>([]);
 const [identity,setIdentity]=useState<Record<string,string>>({}),[departureAirport,setDepartureAirport]=useState(''),[leadDays,setLeadDays]=useState<number|null>(null);
 const needId=requiresNationalId(identity.nationality,policy);
 const [reminders,setReminders]=useState<{id:string;contract_id:string;stage:string;status:string;deadline:string}[]>([]);
 const [companion,setCompanion]=useState(''),[ack,setAck]=useState(false),[files,setFiles]=useState<Record<string,File>>({});
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[locked,setLocked]=useState(false),[sort,setSort]=useState('arrival'),[search,setSearch]=useState('');
 const [refreshed,setRefreshed]=useState(''),[formKey,setFormKey]=useState(0);
 const readSequence=useRef(0);
 const epoch=useRef(0),running=useRef(false),pending=useRef<{id:string;owner:string;uploaded:Set<string>}|null>(null);
 async function load(expected=epoch.current){
  const sequence=++readSequence.current;
  if(!client){setMessage(t('Authenticated guest intake is not configured.','تسجيل الضيوف الموثّق غير مُعدّ.'));return;}
  try{
   const {data:{user}}=await client.auth.getUser();if(expected!==epoch.current)return;
   if(!user){setMessage(t('Sign in at /pilot. No passport has been uploaded.','سجّل الدخول عبر /pilot. لم يتم رفع أي جواز.'));setRows([]);setContracts([]);setReminders([]);setPlans([]);setLeadDays(null);setPolicy(null);return;}
   const [c,r,p,m,tp,dp]=await Promise.all([review?client.rpc('sadu_pr_guest_roster'):client.from('bilateral_contracts').select('id,artist_name').eq('artist_id',user.id).in('status',['ARTIST_APPROVED','LOCKED']),client.from('sadu_guest_submission_queue').select('*').order('created_at',{ascending:false}),client.from('sadu_guest_deadline_policy').select('lead_days').single(),client.from('sadu_guest_reminder_outbox').select('id,contract_id,stage,status,deadline').eq('status','PENDING_DELIVERY'),client.from('sadu_guest_travel_plans').select('id,contract_id,arrival,departure,created_at').order('created_at',{ascending:false}),client.from('sadu_guest_document_policy').select('version,national_id_countries,reference').single()]);
   if(expected!==epoch.current||sequence!==readSequence.current)return;
   if(c.error||r.error||p.error||m.error||tp.error||dp.error)throw new Error(t('Guest queue unavailable. Apply the reviewed local guest-travel schema before using this module.','قائمة الضيوف غير متاحة. طبّق مخطط سفر الضيوف المحلي المعتمد قبل استخدام هذه الوحدة.'));
   setPolicy(dp.data);setPlans(tp.data??[]);setLeadDays(p.data?.lead_days??null);setReminders(m.data??[]);setContracts(c.data??[]);setRows(latestGuestRows(r.data??[]));setRefreshed(new Date().toLocaleTimeString());
  }catch(e){if(expected===epoch.current&&sequence===readSequence.current){setRows([]);setContracts([]);setReminders([]);setPlans([]);setLeadDays(null);setPolicy(null);setMessage(e instanceof Error?e.message:t('Queue unavailable. Retry.','القائمة غير متاحة. أعد المحاولة.'));}}
 }
 useEffect(()=>{
  void load();const timer=setInterval(()=>{if(!running.current)void load();},15000);
  const sub=client?.auth.onAuthStateChange(event=>{if(event==='SIGNED_IN'||event==='SIGNED_OUT'){
   epoch.current++;pending.current=null;setRows([]);setContracts([]);setReminders([]);setPlans([]);setLeadDays(null);setPolicy(null);setFiles({});setContract('');setIdentity({});setAirport('');setDepartureAirport('');setArrival('');setDeparture('');setCompanion('');setAck(false);setLocked(false);setFormKey(k=>k+1);setMessage('');setRefreshed('');
   // Avoid awaiting another auth call inside Supabase's auth event callback.
   setTimeout(()=>void load(),0);
  }});
  return()=>{epoch.current++;clearInterval(timer);sub?.data.subscription.unsubscribe();};
 },[review]);
 function chooseContract(id:string){
  const previous=rows.find(r=>r.contract_id===id),plan=plans.find(p=>p.contract_id===id);
  setContract(id);setIdentity(previous?.identity??{});setArrival(plan?.arrival??previous?.arrival??'');setDeparture(plan?.departure??previous?.departure??'');setAirport(previous?.airport??'');setDepartureAirport(previous?.departure_airport??'');setCompanion(previous?.companion_name??'');setAck(false);setFiles({});setFormKey(k=>k+1);
 }
 async function saveTravelDates(){
  if(!client||running.current||!contract||!validTravelDates(arrival,departure))return;
  running.current=true;setBusy(true);const expected=epoch.current;
  try{const {data:{user}}=await client.auth.getUser();if(!user||expected!==epoch.current)return;
   if(!(plans.find(p=>p.contract_id===contract)?.arrival===arrival&&plans.find(p=>p.contract_id===contract)?.departure===departure)){
    const result=await client.from('sadu_guest_travel_plans').insert({contract_id:contract,artist_id:user.id,arrival,departure});if(result.error)throw new Error(t('Could not save travel dates. Retry.','تعذّر حفظ مواعيد السفر. أعد المحاولة.'));
   }
   if(expected!==epoch.current)return;await load(expected);setMessage(t('Travel dates saved. Document deadline calculated; this is not a finalized PR submission or a booking.','تم حفظ مواعيد السفر. تم احتساب موعد تسليم المستندات؛ هذا ليس إرسالًا نهائيًا للتشريفات ولا حجزًا.'));
  }catch(e){if(expected===epoch.current)setMessage(e instanceof Error?e.message:t('Could not save travel dates.','تعذّر حفظ مواعيد السفر.'));}finally{running.current=false;setBusy(false);}
 }
 async function submit(){
  if(!client||running.current||!contract||!airport||!departureAirport||!policy||(needId&&!files.nationalId)||!validGuestIdentity(identity,arrival)||!validTravelDates(arrival,departure)||!files.passport||!files.photo||(companion.trim()&&(!ack||!files.companion)))return;
  const expected=epoch.current;running.current=true;setBusy(true);setMessage(t('Validating and uploading…','جارٍ التحقق والرفع…'));
  try{
   await Promise.all([validatePassport(files.passport),validatePersonalPhoto(files.photo),...(needId?[validatePassport(files.nationalId)]:[]),...(companion.trim()?[validatePassport(files.companion)]:[])]);
   const {data:{user}}=await client.auth.getUser();if(!user||expected!==epoch.current)return;
   if(!(plans.find(p=>p.contract_id===contract)?.arrival===arrival&&plans.find(p=>p.contract_id===contract)?.departure===departure)){const plan=await client.from('sadu_guest_travel_plans').insert({contract_id:contract,artist_id:user.id,arrival,departure});if(plan.error)throw new Error(t('Could not record travel dates.','تعذّر تسجيل مواعيد السفر.'));}
   if(!pending.current){
    const id=crypto.randomUUID();const result=await client.from('sadu_guest_intakes').insert({id,contract_id:contract,artist_id:user.id,arrival,departure,airport,departure_airport:departureAirport,identity,companion_name:companion.trim()||null,companion_ack:ack,photo_extension:files.photo.type==='image/png'?'png':'jpg'});
    if(result.error)throw new Error(t('Registration failed. An owned accepted database agreement is required.','فشل التسجيل. يلزم وجود اتفاقية معتمدة مملوكة لحسابك في قاعدة البيانات.'));
    if(expected!==epoch.current)return;pending.current={id,owner:user.id,uploaded:new Set()};setLocked(true);
   }
   const record=pending.current;if(record.owner!==user.id)return;
   const uploads:[string,File][]=[['passport.pdf',files.passport],...(needId?[['national-id.pdf',files.nationalId] as [string,File]]:[]),[`photo.${files.photo.type==='image/png'?'png':'jpg'}`,files.photo],...(companion.trim()?[['companion.pdf',files.companion] as [string,File]]:[])];
   for(const [name,file] of uploads){
    if(expected!==epoch.current)return;if(record.uploaded.has(name))continue;
    const path=`${user.id}/guest-intake/${record.id}/${name}`;
    // A lost response may follow a successful upload. Verify an existing object before retrying; never overwrite.
    const existing=await client.storage.from('logistics-secure').list(`${user.id}/guest-intake/${record.id}`,{search:name});
    if(!existing.data?.some(o=>o.name===name&&Number(o.metadata?.size)===file.size)){
     const result=await client.storage.from('logistics-secure').upload(path,file,{contentType:file.type,upsert:false});if(result.error)throw new Error(t('Upload interrupted. Retry uploads below; existing files are preserved.','انقطع الرفع. أعد محاولة الرفع أدناه؛ الملفات الموجودة محفوظة.'));
    }
    record.uploaded.add(name);
   }
   if(expected!==epoch.current)return;
   const final=await client.rpc('sadu_finalize_guest',{p_id:record.id});if(final.error)throw new Error(t('Final submission blocked: check all required fields and uploaded documents, then retry.','تم منع الإرسال النهائي: تحقق من جميع الحقول المطلوبة والمستندات المرفوعة، ثم أعد المحاولة.'));if(expected!==epoch.current)return;
   setMessage(t('Finalized — awaiting PR inspection. No booking or visa approval is implied.','تم الإرسال النهائي — بانتظار تدقيق التشريفات. لا يعني ذلك أي حجز أو موافقة على التأشيرة.'));pending.current=null;setFiles({});setFormKey(k=>k+1);setLocked(false);setContract('');setCompanion('');setAck(false);await load(expected);
  }catch(e){if(expected===epoch.current)setMessage(e instanceof Error?e.message:t('Upload failed. Retry.','فشل الرفع. أعد المحاولة.'));}
  finally{running.current=false;setBusy(false);}
 }
 async function download(row:GuestTravelRow,name:string){
  const expected=epoch.current,popup=window.open('about:blank','_blank');if(popup)popup.opener=null;
  try{const result=await client?.storage.from('logistics-secure').createSignedUrl(`${row.artist_id}/guest-intake/${row.id}/${name}`,60);
   if(expected===epoch.current&&result?.data?.signedUrl&&popup)popup.location.href=result.data.signedUrl;
   else{popup?.close();if(expected===epoch.current)setMessage(t('Private document unavailable or pop-up blocked.','المستند الخاص غير متاح أو تم حظر النافذة المنبثقة.'));}
  }catch{popup?.close();if(expected===epoch.current)setMessage(t('Private document unavailable.','المستند الخاص غير متاح.'));}
 }
 const visible=rows.filter(r=>`${r.artist_name} ${r.airport} ${r.companion_name??''}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>sort==='name'?a.artist_name.localeCompare(b.artist_name):sort==='missing'?Number(guestFilesComplete(a))-Number(guestFilesComplete(b)):a.arrival.localeCompare(b.arrival));
 return <section className="min-w-0 space-y-4 rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-4 pe-4 py-4 text-start">
  <h2 className="flex gap-2 text-xl"><Plane aria-hidden="true"/>{review?pair('PR Control Room','لوحة الضيوف'):pair('Guest Self-Service','بيانات سفر الضيف')}</h2>
  <p>{isAr?'التسجيل للحسابات المرتبطة باتفاقيات معتمدة في قاعدة البيانات. لم يتم إعداد تسجيل دخول المرحلة 5 / كبار الشخصيات ولا البريد الإلكتروني التلقائي للدعوات.':pair('Authenticated intake for accepted database agreements. Stage 5/VIP login provisioning and automatic invitation email are not configured.','التسجيل للحسابات المرتبطة باتفاقيات معتمدة.')}</p>
  <p>{pair('Pending approved entitlement','بانتظار اعتماد مخصصات الاستضافة')}</p>
  {!review&&<form key={formKey} onSubmit={e=>{e.preventDefault();void submit();}} className="space-y-3"><fieldset disabled={busy||locked} className="space-y-3">
   <label className="block">{pair('Agreement','الاتفاقية')}<select required className={field} value={contract} onChange={e=>chooseContract(e.target.value)}><option value="">{t('Select owned agreement','اختر الاتفاقية الخاصة بك')}</option>{contracts.map(c=><option key={c.id} value={c.id}>{c.artist_name} · {c.id}</option>)}</select></label>
   <div className="grid gap-3 sm:grid-cols-2"><label>{pair('Arrival','الوصول')}<input required type="date" className={field} value={arrival} onChange={e=>setArrival(e.target.value)}/></label><label>{pair('Departure','المغادرة')}<input required type="date" min={arrival||undefined} className={field} value={departure} onChange={e=>setDeparture(e.target.value)}/></label></div>
   <button type="button" className={button} disabled={busy||!contract||!validTravelDates(arrival,departure)} onClick={()=>void saveTravelDates()}>{pair('Save travel dates','حفظ مواعيد السفر')}</button><label className="block">{pair('Airport preference','المطار المفضل')}<select className={field} value={airport} onChange={e=>setAirport(e.target.value)}><option value="">{t('Select airport','اختر المطار')}</option><option value="SHJ">{t('SHJ · Sharjah','SHJ · الشارقة')}</option><option value="DXB">{t('DXB · Dubai','DXB · دبي')}</option><option value="OTHER">{t('Other — PR review required','أخرى — تتطلب مراجعة التشريفات')}</option></select></label>
   <label className="block">{pair('Departure airport','مطار المغادرة')}<select required className={field} value={departureAirport} onChange={e=>setDepartureAirport(e.target.value)}><option value="">{t('Select airport','اختر المطار')}</option><option value="SHJ">{t('SHJ · Sharjah','SHJ · الشارقة')}</option><option value="DXB">{t('DXB · Dubai','DXB · دبي')}</option><option value="OTHER">{t('Other — PR review required','أخرى — تتطلب مراجعة التشريفات')}</option></select></label><GuestIdentityFields value={identity} onChange={v=>{if(v.nationality!==identity.nationality)setFiles(f=>{const next={...f};delete next.nationalId;return next;});setIdentity(v);}}/>
   <p>{t('Document rule:','قاعدة المستندات:')} {policy?.reference??t('Loading policy — submission locked','جارٍ تحميل السياسة — الإرسال مقفل')}</p>
   {arrival&&identity.passportExpiry&&(!passportMinimumExpiry(arrival)||identity.passportExpiry<passportMinimumExpiry(arrival)!)&&<p role="alert" className="rounded border border-red-300 bg-red-50 ps-3 pe-3 py-3 text-red-900">{isAr?`يجب أن يظل الجواز ساريًا حتى ${passportMinimumExpiry(arrival)??'تاريخ وصول صالح مضافًا إليه ستة أشهر'} (ستة أشهر تقويمية بعد الوصول). يجب تجديد الجواز قبل الإرسال.`:pair(`Passport must remain valid until ${passportMinimumExpiry(arrival)??'a valid arrival date plus six months'} (six calendar months after arrival). Renew before submission.`,'يجب تجديد الجواز قبل الإرسال.')}</p>}
   {needId&&<p className="text-red-900">{pair('National ID PDF required by the configured institutional intake rule','الهوية الوطنية مطلوبة.')}</p>}<p>{t('Document deadline:','موعد تسليم المستندات:')} {leadDays!==null&&guestDeadline(arrival,leadDays)?t(`${guestDeadline(arrival,leadDays)} · 23:59 UAE (${leadDays} days before arrival)`,`${guestDeadline(arrival,leadDays)} · 23:59 بتوقيت الإمارات (قبل الوصول بـ ${leadDays} ${Number(leadDays)>=3&&Number(leadDays)<=10?'أيام':'يومًا'})`):t('Awaiting arrival date and configured lead time','بانتظار تاريخ الوصول والمهلة المحددة')}{t('. Travel preferences are not confirmed bookings.','. تفضيلات السفر ليست حجوزات مؤكدة.')}</p>
   <p className="flex gap-2 rounded border border-red-200 bg-red-50 ps-3 pe-3 py-3 text-red-900"><ShieldAlert aria-hidden="true" className="shrink-0"/>{pair('Upload a clear, flat passport PDF and a high-resolution JPEG/PNG portrait. Blurry phone snapshots will be returned by PR. File format cannot certify clarity or capture source.','ارفع نسخة جواز واضحة بصيغة PDF وصورة شخصية عالية الدقة؛ الوضوح يخضع لمراجعة التشريفات.')}</p>
   <label className="block">{isAr?'اسم المرافق (اختياري، على نفقته الخاصة)':pair('Companion name (optional, self-funded)','اسم المرافق')}<input maxLength={200} className={field} value={companion} onChange={e=>{setCompanion(e.target.value);setAck(false);}}/></label>
   {companion.trim()&&<label className="flex gap-2"><input type="checkbox" required checked={ack} onChange={e=>setAck(e.target.checked)}/>{isAr?'أتحمل جميع نفقات المرافق. لا يوجد ضمان لأي حجز.':pair('I accept all companion expenses. No booking is guaranteed.','أتحمل نفقات المرافق.')}</label>}
   {(['passport','photo',...(needId?['nationalId']:[]),...(companion.trim()?['companion']:[])]).map(kind=><label key={kind} className="block rounded border-2 border-dashed ps-3 pe-3 py-3">{kind==='photo'?`${pair('Personal photo','الصورة الشخصية')} — ${t('JPEG/PNG, 1200 × 1200 minimum','JPEG/PNG، بحد أدنى 1200 × 1200')}`:kind==='nationalId'?`${pair('National ID','الهوية الوطنية')} — PDF`:kind==='passport'?`${pair('Passport','الجواز')} — PDF`:`${pair('Companion passport','جواز المرافق')} — PDF`}<input required className="block max-w-full" type="file" accept={kind==='photo'?'.jpg,.jpeg,.png':'.pdf'} onChange={e=>{const file=e.target.files?.[0];setFiles(p=>{const n={...p};delete n[kind];if(file)n[kind]=file;return n;});}}/></label>)}
  </fieldset><button className={button} disabled={busy||!client||!contract||!airport||!departureAirport||!policy||(needId&&!files.nationalId)||!validGuestIdentity(identity,arrival)||!validTravelDates(arrival,departure)||!files.passport||!files.photo||Boolean(companion.trim()&&(!ack||!files.companion))}>{busy?t('Uploading…','جارٍ الرفع…'):locked?t('Retry uploads','إعادة محاولة الرفع'):pair('Submit to PR','إرسال للتشريفات')}</button>{locked&&<p>{t('Submitted data is locked. Retry the remaining uploads using the selected files.','البيانات المرسلة مقفلة. أعد محاولة رفع الملفات المتبقية باستخدام الملفات المحددة.')}</p>}</form>}
  <VisaAuthorityPanel guests={rows} review={review}/>
  <p role="status" aria-live="polite">{message}</p><div className="flex flex-wrap gap-3"><button className={button} disabled={busy} onClick={()=>void load()}><RefreshCw aria-hidden="true" className="inline size-4"/>{t('Refresh','تحديث')}</button><span>{t('Updates every 15 seconds · Last refreshed:','يتم التحديث كل 15 ثانية · آخر تحديث:')} {refreshed||t('Not loaded','لم يتم التحميل')}</span></div>
  <p>{t('Reminders are queued automatically at 14 days, 7 days and the deadline. Email delivery is not configured; queued does not mean sent.','تُجدول التذكيرات تلقائيًا قبل 14 يومًا و7 أيام وفي الموعد النهائي. إرسال البريد الإلكتروني غير مُعدّ؛ الجدولة لا تعني الإرسال.')}</p>{reminders.map(r=><p key={r.id} className="rounded border border-amber-300 ps-3 pe-3 py-2">{contracts.find(c=>c.id===r.contract_id)?.artist_name??r.contract_id} · {r.stage} · PENDING DELIVERY · {new Date(r.deadline).toLocaleString()}</p>)}<label className="block">{pair('Search guests','بحث')}<input className={field} value={search} onChange={e=>setSearch(e.target.value)}/></label><label className="block">{pair('Sort','ترتيب')}<select className={field} value={sort} onChange={e=>setSort(e.target.value)}><option value="arrival">{t('Arrival date','تاريخ الوصول')}</option><option value="name">{t('Guest name','اسم الضيف')}</option><option value="missing">{t('Missing files first','الملفات الناقصة أولًا')}</option></select></label>
  {!rows.length&&<p>{t('No guest submissions visible to this account. Empty records are not clearance.','لا توجد بيانات ضيوف ظاهرة لهذا الحساب. خلو السجلات لا يُعد تصريحاً.')}</p>}
  <div className="grid gap-3 lg:grid-cols-2">{contracts.filter(c=>!rows.some(r=>r.contract_id===c.id)&&c.artist_name.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>a.artist_name.localeCompare(b.artist_name)).map(c=><article key={c.id} className="rounded border bg-[#FFFDF7] ps-3 pe-3 py-3"><h3>{c.artist_name}</h3><p className="text-amber-900">{pair('Awaiting guest submission','بانتظار بيانات الضيف')}</p><p>{plans.find(p=>p.contract_id===c.id)?t(`Travel dates saved · Document deadline: ${leadDays!==null?guestDeadline(plans.find(p=>p.contract_id===c.id)!.arrival,leadDays):'Not configured'} · Awaiting finalized documents`,`تم حفظ مواعيد السفر · موعد تسليم المستندات: ${leadDays!==null?guestDeadline(plans.find(p=>p.contract_id===c.id)!.arrival,leadDays):'غير مُعدّ'} · بانتظار المستندات النهائية`):t('Arrival missing — document deadline unavailable.','تاريخ الوصول غير متوفر — موعد تسليم المستندات غير متاح.')}</p></article>)}{visible.map(row=><article key={row.id} className="min-w-0 space-y-2 break-words rounded border bg-[#FFFDF7] ps-3 pe-3 py-3"><h3 className="font-semibold">{row.artist_name}</h3>{plans.find(p=>p.contract_id===row.contract_id)&&((plans.find(p=>p.contract_id===row.contract_id)!.arrival!==row.arrival)||(plans.find(p=>p.contract_id===row.contract_id)!.departure!==row.departure))&&<p className="text-amber-900">{t('Travel dates changed — this packet is historical; a new finalized packet is required.','تغيّرت مواعيد السفر — هذه الحزمة سجل سابق؛ يلزم إرسال حزمة نهائية جديدة.')}</p>}<p>{row.arrival} → {row.departure} · {row.airport}</p><p>{row.companion_name?t(`Companion: ${row.companion_name} · Self-funding acknowledged`,`المرافق: ${row.companion_name} · تم الإقرار بالتمويل الذاتي`):t('No companion requested','لم يُطلب مرافق')}</p><p className={row.passport_uploaded?'text-green-800':'text-amber-900'}><FileCheck aria-hidden="true" className="inline size-4"/>{row.passport_uploaded?t('Passport uploaded — PR inspection pending','تم رفع الجواز — بانتظار تدقيق التشريفات'):t('Passport missing / upload incomplete','الجواز غير متوفر / الرفع غير مكتمل')}</p>{row.national_id_required==null&&<p className="text-amber-900">{t('Historical packet — current document policy not recorded. Submit a new packet before new itinerary approval.','حزمة سابقة — سياسة المستندات الحالية غير مسجّلة. أرسل حزمة جديدة قبل اعتماد خط سير جديد.')}</p>}<p>{guestFilesComplete(row)?t('All declared files present — not PR clearance','جميع الملفات المُعلنة موجودة — هذا ليس تصريحاً من التشريفات'):t('Draft — incomplete document packet','مسودة — حزمة مستندات غير مكتملة')}</p>{row.identity&&<GuestIdentityReview value={row.identity}/>}<p>{row.finalized_at?t('Finalized for PR review','نهائية لمراجعة التشريفات'):t('Draft — not submitted to PR','مسودة — لم تُرسل إلى التشريفات')}</p><p>{t('Agreement at submission:','حالة الاتفاقية عند الإرسال:')} {row.contract_status}</p>{[['passport.pdf',row.passport_uploaded,t('Passport PDF','ملف الجواز PDF')],['national-id.pdf',row.national_id_uploaded,t('National ID PDF','ملف الهوية الوطنية PDF')],[`photo.${row.photo_extension}`,row.photo_uploaded,t('Personal photo','الصورة الشخصية')],['companion.pdf',row.companion_uploaded,t('Companion PDF','ملف المرافق PDF')]].map(([name,ready,label])=>ready&&<button type="button" className={`${button} me-2`} key={String(name)} onClick={()=>void download(row,String(name))}>{String(label)}</button>)}{review&&row.finalized_at&&<GuestItineraryApproval intakeId={row.id}/>}<p className="text-xs">{t('Latest immutable submission:','آخر إرسال غير قابل للتعديل:')} {new Date(row.created_at).toLocaleString()}{t('. A replacement requires a new submission and fresh PR review.','. يتطلب الاستبدال إرسالًا جديدًا ومراجعة جديدة من التشريفات.')}</p></article>)}</div>
 </section>;
}
