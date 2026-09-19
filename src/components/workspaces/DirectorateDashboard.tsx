import type { Language } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { DirectorateOversight } from '../DirectorateOversight';
import { leadershipPeople } from '../../data/leadershipMedia';
import '../LivingRecordWorkspace.css';

export interface DirectorateDashboardProps { lang?: Language }

export function DirectorateDashboard(_props: DirectorateDashboardProps) {
  const { isAr } = useI18n();
  const person = leadershipPeople.director;
  return <section className="space-y-6">
    <header className="rounded-lg border border-sadu-gold bg-sadu-linen p-6">
      <p className="text-xs text-sadu-brick">{isAr ? 'نظرة إشرافية مقترحة · ليست تقرير أداء فعلياً' : 'Proposed oversight view · not a live performance report'}</p>
      <h1 className="mt-2 text-2xl font-bold">{isAr ? person.nameAr : person.nameEn}</h1>
      <p>{isAr ? person.titleAr : person.titleEn}</p>
      <p className="mt-3 text-sm">{isAr
        ? 'بانتظار تقارير مؤرخة للبرامج الفعلية. يعرض المثال المترابط بيانات سيناريو فقط؛ لا يُستنتج إنجاز أو اعتماد من أسماء البرامج.'
        : 'Awaiting dated reports for actual programmes. The connected example uses sample scenario data only; programme names do not establish completion or approval.'}</p>
    </header>
    <div className="living-record" dir={isAr ? 'rtl' : 'ltr'} style={{ minHeight: 0, background: 'transparent' }}>
      <DirectorateOversight />
    </div>
  </section>;
}
