import {History} from 'lucide-react';
import type {NominatedArtistDossier} from './ArtistNominationForm';
import type {BilateralContract} from '../types/contractStage6';
import {dossierEvents} from '../data/dossierTimeline';
export function DossierTimeline({dossier,isAr,contracts=[]}:{dossier:NominatedArtistDossier;isAr:boolean;contracts?:BilateralContract[]}){
 const events=dossierEvents(dossier,contracts);
 const roles:Record<string,string>={ARTIST:'الفنان',COORDINATOR:'المنسق',Coordinator:'المنسق',PREP_COMMITTEE:'اللجنة التحضيرية','Preparatory Committee':'اللجنة التحضيرية',BIENNIAL_DIRECTOR:'مدير الملتقى'};
 return <details className="my-4 rounded border border-sadu-gold bg-sadu-linen ps-4 pe-4 py-3 text-start" dir={isAr?'rtl':'ltr'}><summary className="cursor-pointer font-semibold"><History aria-hidden="true" className="me-2 inline size-4"/>{isAr?'سجل إجراءات الملف':'Dossier activity timeline'}</summary><p className="my-3 text-sm text-sadu-muted">{isAr?'أحداث مسجلة في المحاكاة؛ ليست سجلاً قانونياً غير قابل للتعديل. التواريخ غير المسجلة لا تُستنتج.':'Recorded rehearsal evidence, not an immutable legal ledger. Missing timestamps are not inferred.'}</p>{!events.length?<p>{isAr?'لا توجد أحداث مؤرخة مسجلة.':'No timestamped events recorded.'}</p>:<ol className="space-y-4 border-s border-sadu-gold ps-4">{events.map(e=><li key={e.id}><p className="font-semibold">{isAr?e.ar:e.en}</p><p className="text-sm">{isAr?(roles[e.actor]??e.actor):e.actor}{e.revision!==undefined&&` · ${isAr?'المراجعة':'Revision'} ${e.revision}`}</p><time dateTime={e.at} className="text-sm text-sadu-muted">{new Date(e.at).toLocaleString(isAr?'ar-AE':'en-GB')}</time></li>)}</ol>}</details>;
}
