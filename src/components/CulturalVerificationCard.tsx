import { AlertTriangle } from 'lucide-react';
import type { NominatedArtistDossier } from './ArtistNominationForm';
import { culturalCleared } from '../data/culturalDeclaration';
export function CulturalVerificationCard({dossier: d, isAr}: {dossier: NominatedArtistDossier; isAr: boolean}) {
 const t=(ar:string,en:string)=>isAr?ar:en;
 return <section className="my-3 space-y-3 rounded border-2 border-red-300 bg-[#F7F1E6] ps-4 pe-4 py-4 text-start">
 <h3 className="flex items-center gap-2 font-semibold"><AlertTriangle aria-hidden="true" className="size-5 text-red-800"/>{t('تنبيه التحقق الثقافي','Cultural Verification Alert')}</h3><p>{d.artistName}</p>
 <p>{t('نصوص دينية أو آيات قرآنية أو أحاديث أو عبارات سياسية؟','Religious texts, Qur’anic verses, Hadiths, or political statements?')} <strong>{d.culturalDeclaration ? d.culturalDeclaration.containsText ? t('نعم','Yes') : t('لا','No') : t('لم يُقدّم الإقرار','Declaration missing')}</strong></p>
 {d.culturalDeclaration?.containsText && <p className="whitespace-pre-wrap break-words">{d.culturalDeclaration.explanation}</p>}
 <p>{culturalCleared(d) ? `${t('سجلت اللجنة اعتماد الترشيح — محاكاة','Committee endorsement recorded — simulated')} · ${d.committeeReview?.at}` : t('تراجع اللجنة الإقرار ضمن قرار الترشيح.','Declaration reviewed as part of the Committee nomination decision.')}</p>

 </section>;
}
