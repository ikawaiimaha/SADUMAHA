import { AlertTriangle } from 'lucide-react';
import type { NominatedArtistDossier } from './ArtistNominationForm';
import { culturalCleared, textualCleared, validDeclaration } from '../data/culturalDeclaration';
export function CulturalVerificationCard({dossier: d, isAr}: {dossier: NominatedArtistDossier; isAr: boolean}) {
 const t=(ar:string,en:string)=>isAr?ar:en;
 return <section className="my-3 space-y-3 rounded border-2 border-red-300 bg-[#F7F1E6] ps-4 pe-4 py-4 text-start">
 <h3 className="flex items-center gap-2 font-semibold"><AlertTriangle aria-hidden="true" className="size-5 text-red-800"/>{t('تنبيه التحقق الثقافي','Cultural Verification Alert')}</h3><p>{d.artistName}</p>
 <p>{t('نصوص دينية أو آيات قرآنية أو أحاديث أو عبارات سياسية؟','Religious texts, Qur’anic verses, Hadiths, or political statements?')} <strong>{d.culturalDeclaration ? d.culturalDeclaration.containsText ? t('نعم','Yes') : t('لا','No') : t('لم يُقدّم الإقرار','Declaration missing')}</strong></p>
 {d.culturalDeclaration?.containsText && <p className="whitespace-pre-wrap break-words">{d.culturalDeclaration.exactText}</p>}
 {d.culturalDeclaration?.containsText && <p className="whitespace-pre-wrap break-words">{d.culturalDeclaration.explanation}</p>}
 <p role="status">{textualCleared(d) ? (d.culturalDeclaration?.containsText ? `${t('تم التحقق النصي بواسطة HIP','HIP textual verification recorded')} · ${d.textualVerification?.at}` : t('لا نصوص معلنة للتحقق','No declared text requiring verification')) : t('بانتظار التحقق النصي بواسطة HIP — الإحالة إلى المدير مقفلة','Awaiting HIP textual verification — Director handoff locked')}</p>
 <p>{culturalCleared(d) ? `${t('سجلت اللجنة اعتماد الترشيح — محاكاة','Committee endorsement recorded — simulated')} · ${d.committeeReview?.at}` : t('تراجع اللجنة الإقرار ضمن قرار الترشيح.','Declaration reviewed as part of the Committee nomination decision.')}</p>

 </section>;
}

export function TextualVerificationLedger({dossiers,isAr,onVerify}:{dossiers:NominatedArtistDossier[];isAr:boolean;onVerify:(id:string)=>void}) {
 const rows=dossiers.filter(d=>d.status==='PENDING_COMMITTEE_REVIEW'&&d.culturalDeclaration?.containsText);
 return <section className="mx-auto my-5 max-w-5xl space-y-4 rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-5 text-start" dir={isAr?'rtl':'ltr'}>
 <h2 className="text-2xl font-semibold">{isAr?'التحقق الثقافي والنصي':'Cultural & Textual Verification'}</h2>
 <p>{isAr?'تحقق من النصوص المعلنة فقط؛ قرار الترشيح من اختصاص اللجنة. سجل محاكاة للجلسة.':'Verification of declared content only; nomination decisions remain with the Committee. Session rehearsal record.'}</p>
 {!rows.length&&<p>{isAr?'لا نصوص بانتظار المراجعة.':'No declared text awaiting review.'}</p>}
 {rows.map(d=><article key={d.id}><CulturalVerificationCard dossier={d} isAr={isAr}/><button type="button" disabled={!validDeclaration(d.culturalDeclaration)||textualCleared(d)} onClick={()=>onVerify(d.id)} className="rounded sadu-action-approve ps-4 pe-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">{isAr?'تأكيد التحقق النصي — محاكاة':'Record Textual Verification — rehearsal'}</button></article>)}
 </section>;
}
