import type {NominatedArtistDossier} from './ArtistNominationForm';
import type {BilateralContract} from '../types/contractStage6';
import {COORDINATORS,PARTICIPATION_TRACKS} from '../data/participation2026';
export function ExecutiveContractSummary({dossiers,contracts,isAr}:{dossiers:NominatedArtistDossier[];contracts:BilateralContract[];isAr:boolean}) {
 const t=(ar:string,en:string)=>isAr?ar:en;
 const eligible=dossiers.filter(d=>['PENDING_DIRECTOR_REVIEW','APPROVED'].includes(d.status));
 return <section className="my-5 rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-4 pe-4 py-4 space-y-3 text-start"><h2 className="text-xl font-semibold">{t('بطاقة الملخص التنفيذي للاتفاقيات','Executive agreement summary')}</h2><p>{t('تُستخرج آلياً من ملف الترشيح وبنود الاتفاقية المسجلة. فتح البطاقة لا يُعد توقيعاً أو اعتماداً قانونياً.','Generated from the nomination dossier and recorded agreement terms. Opening this card is not a signature or legal approval.')}</p>
 {!eligible.length&&<p>{t('لا توجد ملفات مؤهلة للمراجعة.','No dossiers eligible for review.')}</p>}
 {eligible.map(d=>{const c=contracts.find(c=>c.artistId===d.id);return <details key={d.id} className="rounded border bg-white ps-3 pe-3 py-3"><summary className="cursor-pointer font-semibold">{t('عرض الملخص التنفيذي','View executive summary')} · {d.artistName}</summary><dl className="mt-3 grid gap-3 sm:grid-cols-2">{[
 [t('الجنسية','Nationality'),d.nationality],[t('المنسقة المسؤولة','Assigned coordinator'),COORDINATORS.find(row=>row.id===d.assignedCoordinatorId)?.name],
 [t('مسار المشاركة','Participation track'),PARTICIPATION_TRACKS[d.participationTrack??'GENERAL_COMPETITION'][isAr?'ar':'en']],
 [t('نطاق العمل','Artwork scope'),d.proposedWorkTitle],[t('نوع الأعمال','Medium'),d.medium],[t('عدد الأعمال','Artwork count'),d.artworkCount],
 [t('حالة التدقيق','Vetting status'),d.status],[t('مراجعة الاعتماد','Approval revision'),d.approvalRevision],
 [t('منحة الإنتاج (درهم)','Production grant (AED)'),c?.productionCost],[t('شروط الشحن','Shipping terms'),c?.shippingTerms],
 [t('المكان ومرجع التصريح','Venue and clearance reference'),c?`${c.venue??'—'} · ${c.venueClearanceReference??'—'}`:undefined],
 [t('حالة الاتفاقية','Agreement status'),c?.status]
 ].map(([label,value])=><div key={label}><dt className="text-sm text-[#736357]">{label}</dt><dd className="text-lg" dir="auto">{value??t('غير مسجّل','Not recorded')}</dd></div>)}</dl>
 {c&&<p className="mt-3">{t('دفعات الاتفاقية: مقدماً / تسليم / إكمال','Agreement tranches: advance / delivery / completion')}: <bdi>{c.tranches.advancePercentage}% / {c.tranches.deliveryPercentage}% / {c.tranches.installationPercentage}%</bdi></p>}
 {d.amendments?.some(a=>a.status==='PENDING')&&<p role="status">{t('يوجد تعديل معلق؛ المعروض هو النطاق المعتمد الحالي.','An amendment is pending; this is the current approved scope.')}</p>}
 </details>;})}</section>;
}
