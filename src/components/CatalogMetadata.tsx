import { metadataUnlocked } from '../data/artistAdministration';
import { useSessionDraft } from '../context/SessionDrafts';
import { BookOpen, CalendarClock, Upload } from 'lucide-react';
import type { CommissionState } from '../types';
import type { BilateralContract } from '../types/contractStage6';
import type { CommissionAction } from '../data/commissionScenario';
import { acceptedForCatalog, CATALOG_SCHEDULE, photographyStatus, validCatalogFields } from '../data/catalogMetadata';
const panel='my-5 space-y-4 rounded-xl border border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-5 text-start';
const field='mt-2 block w-full rounded border border-[#D9CEBA] bg-white ps-3 pe-3 py-2';
export function CatalogPhotographyStatus({contract,isAr}:{contract:BilateralContract;isAr:boolean}) {
 const labels={PENDING:['بانتظار الرفع','Pending Upload'],REVIEW:['قيد مراجعة العلاقات العامة','Under PR Review'],CLEARED:['معتمد للنشر','Cleared for Publication'],REJECTED:['يلزم رفع بديل','Replacement Upload Required']};
 return <p role="status" className="flex items-center gap-2"><Upload aria-hidden="true" className="size-4"/>{labels[photographyStatus(contract.documents)][isAr?0:1]}</p>;
}
export function ExhibitionMetadata({state,contract,isAr,onSubmit}:{state:CommissionState;contract:BilateralContract;isAr:boolean;onSubmit:(a:CommissionAction)=>void}) {
 const latest=state.catalogSubmissions?.filter(r=>r.contractId===contract.id&&r.agreementRevision===state.agreementRevision).at(-1);
 const [draft,setDraft]=useSessionDraft(`catalog:${contract.artistId}:${contract.id}:${state.agreementRevision}`,{titleAr:latest?.titleAr??'',titleEn:latest?.titleEn??'',statement:latest?.statement??''});
 if(!metadataUnlocked(state))return <section className={panel}><h2>Exhibition &amp; Catalog Metadata</h2><p role="status">LOCKED — awaiting accepted agreement and Finance-recorded advance payment.</p></section>;
 const same=latest&&latest.titleAr===draft.titleAr.trim()&&latest.titleEn===draft.titleEn.trim()&&latest.statement===draft.statement.trim();
 const t=(ar:string,en:string)=>isAr?ar:en;
 const format=(date:string)=>new Date(date+'T12:00:00Z').toLocaleDateString(isAr?'ar-AE':'en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Dubai'});
 return <section className={panel}><h2 className="flex items-center gap-2 text-xl font-semibold"><BookOpen aria-hidden="true"/>بيانات المعرض والكتالوج / Exhibition &amp; Catalog Metadata</h2>
 <p className="text-sm text-[#736357]">{t('تصل البيانات إلى سجل التحرير مباشرة داخل جلسة المحاكاة؛ لا إرسال بريد أو نشر خارجي.','Submissions feed Editorial directly within this rehearsal session; no email or external publication.')}</p>
 <aside className="space-y-3 rounded border border-[#D9CEBA] bg-white ps-4 pe-4 py-4"><h3 className="flex items-center gap-2 font-semibold"><CalendarClock aria-hidden="true"/>Critical Milestones / المواعيد النهائية</h3><p>{t('الموعد النهائي: صور الكتالوج عالية الدقة','Deadline: High-Resolution Catalog Photography')} — <time dateTime={CATALOG_SCHEDULE.photography}>{format(CATALOG_SCHEDULE.photography)}</time></p><CatalogPhotographyStatus contract={contract} isAr={isAr}/><p>{t('الموعد النهائي: تسليم الأعمال إلى الشارقة','Deadline: Physical Artwork Delivery to Sharjah')} — <time dateTime={CATALOG_SCHEDULE.delivery}>{format(CATALOG_SCHEDULE.delivery)}</time></p></aside>
 <form className="space-y-4" onSubmit={e=>{e.preventDefault();if(!validCatalogFields(draft)||same)return;onSubmit({type:'submit-catalog',actor:'ARTIST',contractId:contract.id,...draft,at:new Date().toISOString()});}}><label className="block">عنوان المعرض بالعربية<input required dir="rtl" className={field} maxLength={250} value={draft.titleAr} onChange={e=>setDraft(p=>({...p,titleAr:e.target.value}))}/></label><label className="block">Exhibition Title in English<input required dir="ltr" className={field} maxLength={250} value={draft.titleEn} onChange={e=>setDraft(p=>({...p,titleEn:e.target.value}))}/></label><label className="block">{t('المفهوم التقييمي / بيان الفنان','Curatorial Concept / Artist Statement')}<textarea required rows={6} maxLength={12000} className={field} value={draft.statement} onChange={e=>setDraft(p=>({...p,statement:e.target.value}))}/></label><button disabled={!validCatalogFields(draft)||Boolean(same)} className="rounded bg-[#8B261E] ps-4 pe-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed">{t('إرسال إلى الفريق التقييمي','Submit to Curatorial Team')}</button></form>
 {latest&&<p role="status">{t('آخر إرسال إلى التحرير','Last submission to Editorial')}: {new Date(latest.submittedAt).toLocaleString(isAr?'ar-AE':'en-AE')}</p>}
 </section>;
}
export function LiveCatalogAggregator({state,isAr}:{state:CommissionState;isAr:boolean}) {
 const rows=(state.catalogSubmissions??[]).filter((r,i,all)=>!all.slice(i+1).some(other=>other.contractId===r.contractId));
 return <section className={panel}><h2 className="flex items-center gap-2 text-xl font-semibold"><BookOpen aria-hidden="true"/>{isAr?'السجل المباشر لبيانات الكتالوج':'Live Catalog Aggregator'}</h2>{!rows.length&&<p>{isAr?'لم يرسل الفنانون بيانات المعارض بعد.':'No exhibition metadata submitted yet.'}</p>}{rows.map(r=>{const c=state.contracts.find(c=>c.id===r.contractId);const current=r.agreementRevision===state.agreementRevision&&acceptedForCatalog(c);return <article key={r.contractId} className="space-y-3 rounded border bg-white ps-4 pe-4 py-4"><h3 className="text-lg font-semibold">{c?.artistName??r.artistId}</h3><p className="text-sm">{current?(isAr?'مقدم من الفنان — بانتظار المراجعة التقييمية':'Artist submitted — pending curatorial review'):(isAr?'مرجع سابق — يلزم إعادة الإرسال بعد قبول الاتفاقية الحالية':'Historical reference — resubmission required after current agreement acceptance')}</p><h4 dir="rtl">{r.titleAr}</h4><h4 dir="ltr">{r.titleEn}</h4><p className="whitespace-pre-wrap break-words">{r.statement}</p>{c&&<CatalogPhotographyStatus contract={c} isAr={isAr}/>}<p className="text-xs">{new Date(r.submittedAt).toLocaleString(isAr?'ar-AE':'en-AE')} · Revision {r.agreementRevision}</p></article>})}</section>;
}
