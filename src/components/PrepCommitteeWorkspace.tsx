import {TechnicalRiderReference} from './TechnicalRider';
import {textualCleared} from '../data/culturalDeclaration';
import {DossierTimeline} from './DossierTimeline';
import { useEffect, useState } from 'react';
import { Users, Vote, FileX2, ShieldCheck } from 'lucide-react';
import type { NominatedArtistDossier } from './ArtistNominationForm';
import { matchedRestriction, validDossier, safePortfolioUrl, committeeRecommended, MIN_COMMITTEE_MINUTE } from '../data/vetting';
import { CulturalVerificationCard } from './CulturalVerificationCard';
import CommitteeThemeWorkspace from './CommitteeThemeWorkspace';
export * from './CommitteeThemeWorkspace';
export default CommitteeThemeWorkspace;

function PortfolioFile({file}:{file:File}) {
  const [url,setUrl]=useState('');
  useEffect(()=>{const next=URL.createObjectURL(file);setUrl(next);return()=>URL.revokeObjectURL(next);},[file]);
  return <a className="block break-all underline" href={url||undefined} download={file.name}>{file.name}</a>;
}
function Candidate({d,isAr,tags,onReview}:{d:NominatedArtistDossier;isAr:boolean;tags:string[];onReview:(id:string,endorse:boolean,minutes:string)=>void}) {
  const [minutes,setMinutes]=useState('');
  const pending=d.status==='PENDING_COMMITTEE_REVIEW';
  const blocked=Boolean(matchedRestriction(d,tags));
  const t=(ar:string,en:string)=>isAr?ar:en;
  const url=safePortfolioUrl(d.portfolioUrl);
  return <article className="space-y-4 rounded-lg border border-[#D9CEBA] bg-white ps-5 pe-5 py-5 text-start">
    <h3 className="text-xl font-semibold" dir="auto">{d.artistName}</h3>
    {!!d.technicalRequirements?.length&&<section><h4 className="font-semibold">{t('المتطلبات التقنية','Technical Requirements')}</h4><ul className="list-disc ps-5">{d.technicalRequirements.map(r=><li key={r.id}>{r.equipment} · {r.specifications} · {r.mounting}</li>)}</ul></section>}
    <p>{d.nationality} · {d.medium||t('لا ينطبق','Not applicable')}</p><p dir="auto">{d.proposedWorkTitle}</p>
    <span className={`inline-flex items-center gap-2 rounded ps-3 pe-3 py-2 ${blocked?'bg-red-50 text-red-800':'bg-emerald-50 text-emerald-800'}`}><ShieldCheck aria-hidden="true" size={18}/>{blocked?t('مطابقة لقيد امتثال نشط — التوصية محظورة','Active compliance restriction matched — recommendation blocked'):t('لا تطابق مع القيود النشطة حالياً','No match against current active restrictions')}</span>
    <p className="text-sm text-[#736357]">{t('فحص آلي لقواعد المحاكاة؛ ليس اعتماداً أمنياً. لا تعرض معايير القائمة السرية.','Automated rehearsal rule check, not security certification. Confidential rule details are not displayed.')}</p>
    <div><h4 className="font-semibold">{t('الملف الفني الكامل','Full portfolio')}</h4>
      {url&&<a href={url} target="_blank" rel="noopener noreferrer" className="underline">{t('فتح رابط الملف الفني','Open full portfolio')}</a>}
      {d.portfolioFiles?.map((file,i)=><PortfolioFile key={`${i}:${file.name}`} file={file}/>)}
      {!url&&!d.portfolioFiles?.length&&<p>{t('لم يسجل رابط أو مرفق قابل للعرض في هذا الملف.','No viewable portfolio link or attachment recorded for this dossier.')}</p>}
    </div>
    <DossierTimeline dossier={d} isAr={isAr}/>
    <TechnicalRiderReference dossier={d}/><CulturalVerificationCard dossier={d} isAr={isAr}/>
    {pending?<><label className="block">{t(`محضر توصية اللجنة — إلزامي (${MIN_COMMITTEE_MINUTE} أحرف على الأقل)`,`Committee recommendation minute — required (at least ${MIN_COMMITTEE_MINUTE} characters)`)}<textarea maxLength={4000} rows={3} value={minutes} onChange={e=>setMinutes(e.target.value)} className="mt-2 w-full rounded border border-[#736357] bg-[#F7F1E6] ps-3 pe-3 py-2 text-start"/></label>
      <p className="text-sm text-[#736357]">{t('تحال التوصيتان كلتاهما إلى مدير الملتقى صاحب القرار التنفيذي؛ اللجنة لا تعتمد ولا ترفض.','Both outcomes go to the Biennial Director, who makes the executive decision; the Committee neither approves nor rejects.')}</p>
      <div className="flex flex-wrap gap-3"><button disabled={blocked||!validDossier(d)||!textualCleared(d)||minutes.trim().length<MIN_COMMITTEE_MINUTE} onClick={()=>onReview(d.id,true,minutes)} className="inline-flex items-center gap-2 rounded sadu-action-approve ps-4 pe-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"><Vote aria-hidden="true" size={18}/>{t('التوصية للمدير','Recommend to Director')}</button>
      <button disabled={minutes.trim().length<MIN_COMMITTEE_MINUTE} onClick={()=>onReview(d.id,false,minutes)} className="inline-flex items-center gap-2 rounded sadu-action-reject ps-4 pe-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"><FileX2 aria-hidden="true" size={18}/>{t('إحالة دون توصية','Forward without recommendation')}</button></div></>:<div role="status"><p>{d.status==='COMMITTEE_REJECTED'?t('مرفوض بقرار سابق للجنة (سجل قديم)','Rejected under the earlier Committee approval model (historical record)'):committeeRecommended(d)?t('أحيل إلى المدير مع توصية اللجنة','Forwarded to the Director with a Committee recommendation'):t('أحيل إلى المدير دون توصية من اللجنة','Forwarded to the Director without a Committee recommendation')}</p><p className="whitespace-pre-wrap">{d.committeeReview?.minutes}</p><time>{d.committeeReview?.at&&new Date(d.committeeReview.at).toLocaleString(isAr?'ar-AE':'en-GB')}</time></div>}
  </article>;
}
export function CommitteeNominationLedger({dossiers,tags,isAr,onReview}:{dossiers:NominatedArtistDossier[];tags:string[];isAr:boolean;onReview:(id:string,endorse:boolean,minutes:string)=>void}) {
  const rows=dossiers.filter(d=>d.status==='PENDING_COMMITTEE_REVIEW'||d.committeeReview);
  return <section className="rounded-xl border border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-5 space-y-4 text-start" dir={isAr?'rtl':'ltr'}>
    <h2 className="flex items-center gap-2 text-2xl font-semibold"><Users aria-hidden="true"/>{isAr?'جدول مداولات وفرز الترشيحات':'Committee Nomination Review Ledger'}</h2>
    <p>{isAr?'توصيات جماعية مسجلة في جلسة المحاكاة مع محضر إلزامي؛ القرار التنفيذي لمدير الملتقى.':'Collective recommendations recorded in this rehearsal session with a required minute; the executive decision belongs to the Biennial Director.'}</p>
    {!rows.length&&<p>{isAr?'لا توجد ترشيحات للمداولة بعد.':'No nominations awaiting deliberation yet.'}</p>}
    {rows.map(d=><Candidate key={d.id} d={d} tags={tags} isAr={isAr} onReview={onReview}/>)}
  </section>;
}
