import { useEffect, useRef, useState } from 'react';
import { UserCheck, ShieldAlert, FileSignature, Download } from 'lucide-react';
import { validLegalName, type PortalInvitation } from '../data/portalInvitation';
import type { BilateralContract } from '../types/contractStage6';

export function LegalIdentityGate({invitation,isAr,ready,onConfirm,onBack}:{invitation:PortalInvitation;isAr:boolean;ready:boolean;onConfirm?:(name:string)=>void;onBack?:()=>void}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name,setName] = useState(invitation.originalName);
  const [acknowledged,setAcknowledged] = useState(false);
  useEffect(() => { const element=dialog.current; element?.showModal(); return () => element?.close(); }, []);
  return <dialog ref={dialog} onCancel={event=>event.preventDefault()} aria-labelledby="legal-identity-title" dir={isAr?'rtl':'ltr'} className="m-auto w-[min(94vw,40rem)] rounded-xl border border-[#D9CEBA] bg-[#F7F1E6] text-[#1A1817] ps-6 pe-6 py-6 text-start backdrop:bg-black/50">
    <form onSubmit={event=>{event.preventDefault();if(ready&&acknowledged&&validLegalName(name))onConfirm?.(name);}} className="space-y-5">
      <UserCheck aria-hidden="true" className="text-[#8B261E]"/>
      <h1 id="legal-identity-title" className="text-2xl font-semibold">{isAr?'تأكيد البيانات القانونية':'Legal Identity Verification'}</h1>
      <p>{isAr?'الاسم الوارد من اللجنة:':'Committee-provided name:'} <strong>{invitation.originalName}</strong></p>
      <p className="rounded border-s-4 border-amber-500 bg-amber-50 ps-4 pe-4 py-3"><ShieldAlert aria-hidden="true" className="mb-2"/>{isAr?'يرجى تأكيد اسمك القانوني كما يظهر في جواز السفر. سيستخدم لتوليد نموذج الاتفاقية. هذه محاكاة وليست تحققاً رسمياً للهوية.':'Please verify your full legal name exactly as it appears on your passport. It will be used to generate your rehearsal agreement. This is not official identity verification.'}</p>
      <label className="block">{isAr?'الاسم القانوني الكامل (كما في جواز السفر)':'Full legal name (as on passport)'}
        <input autoFocus required maxLength={150} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded border border-[#736357] bg-white ps-3 pe-3 py-3 text-start"/>
      </label>
      <label className="flex items-start gap-3"><input type="checkbox" checked={acknowledged} onChange={e=>setAcknowledged(e.target.checked)} className="mt-1"/>{isAr?'أؤكد صحة الاسم. سيقفل في سجل هذه الجلسة.':'I confirm this name is correct. It will be locked in this session record.'}</label>
      {!ready&&<p role="status">{isAr?'بانتظار نشر الثيمة والإرشادات المؤسسية.':'Awaiting official theme and guideline publication.'}</p>}
      <p className="text-sm text-[#736357]">{isAr?'محاكاة جلسة فقط — لا تحديث لقاعدة بيانات ولا رسائل خارجية.':'Session rehearsal only — no permanent database update or external email.'}</p>
      <div className="flex flex-wrap gap-3">
        <button disabled={!ready||!acknowledged||!validLegalName(name)} className="rounded bg-[#8B261E] text-white ps-4 pe-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed">{isAr?'تأكيد الهوية القانونية':'Confirm Legal Identity'}</button>
        <button type="button" onClick={onBack} className="rounded border border-[#736357] ps-4 pe-4 py-3">{isAr?'العودة إلى المنسق':'Return to Coordinator'}</button>
      </div>
    </form>
  </dialog>;
}

export function ConfirmedAgreementDocument({contract,invitation,isAr}:{contract:BilateralContract;invitation:PortalInvitation;isAr:boolean}) {
  const [pdf,setPdf] = useState<{url:string;key:string}>();
  const [failed,setFailed] = useState(false);
  const [retry,setRetry] = useState(0);
  const key=JSON.stringify([contract,isAr]);
  useEffect(()=>{
    let cancelled=false;
    let url:string|undefined;
    setFailed(false);
    import('../utils/rehearsalAgreementPdf').then(module=>module.buildRehearsalAgreement(contract,isAr)).then(blob=>{
      if(cancelled)return;
      url=URL.createObjectURL(blob);setPdf({url,key});
    }).catch(()=>{if(!cancelled)setFailed(true);});
    return ()=>{cancelled=true;if(url)URL.revokeObjectURL(url);};
  },[key,retry]);
  return <section role="status" className="mb-6 rounded-lg border border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-5 text-start space-y-3">
    <h2 className="flex items-center gap-2 text-xl font-semibold"><FileSignature aria-hidden="true"/>{isAr?'تم تأكيد الاسم وإنشاء نموذج الاتفاقية':'Identity confirmed · rehearsal agreement generated'}</h2>
    <p><bdi>{contract.artistName}</bdi> · <bdi>{new Date(invitation.confirmedAt!).toLocaleString(isAr?'ar-AE':'en-GB')}</bdi></p>
    <p className="text-sm">{isAr?'نسخة تدريبية غير ملزمة — محفوظة في الجلسة فقط.':'Non-binding rehearsal copy — session record only.'}</p>
    {pdf?.key===key?<a href={pdf.url} download="SADU_Rehearsal_Agreement.pdf" className="inline-flex items-center gap-2 rounded border border-[#8B261E] ps-4 pe-4 py-2"><Download aria-hidden="true" size={18}/>{isAr?'تنزيل نموذج الاتفاقية PDF':'Download Rehearsal Agreement PDF'}</a>:failed?<button onClick={()=>setRetry(v=>v+1)}>{isAr?'تعذر إنشاء PDF — إعادة المحاولة':'PDF generation failed — retry'}</button>:<p>{isAr?'جارٍ إعداد PDF…':'Preparing PDF…'}</p>}
  </section>;
}
