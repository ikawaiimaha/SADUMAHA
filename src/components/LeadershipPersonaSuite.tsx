import type { Language, ExhibitionProgramme, WorkspaceTab } from '../types';
import { useI18n } from '../context/I18nContext';

export interface LeadershipPersonaSuiteProps {
  lang?: Language;
  selectedProgramme?: ExhibitionProgramme;
  onNavigateTab?: (tab: WorkspaceTab) => void;
}
export function LeadershipPersonaSuite({ lang }: LeadershipPersonaSuiteProps) {
  const i18n = useI18n();
  const isAr = (lang ?? i18n.lang) === 'ar';
  const lenses = [
    { en: 'Cultural continuity', ar: 'الاستمرارية الثقافية', bodyEn: 'Review artist attribution, context and the accessibility of the cultural record.', bodyAr: 'مراجعة نسبة العمل للفنان وسياقه وإتاحة السجل الثقافي.' },
    { en: 'Accountability', ar: 'المساءلة', bodyEn: 'Identify the applicable evidence and delegated decision route. No authority is inferred from a title.', bodyAr: 'تحديد الأدلة المنطبقة ومسار القرار المفوض. لا تُستنتج الصلاحية من المسمى الوظيفي.' },
    { en: 'Portfolio oversight', ar: 'الإشراف على البرامج', bodyEn: 'Review dated manager reports, schedule risks and escalations. Routine execution stays with responsible managers.', bodyAr: 'مراجعة تقارير المديرين المؤرخة ومخاطر الجداول والتصعيدات. يبقى التنفيذ اليومي لدى المديرين المسؤولين.' },
  ];
  return <section className="space-y-4">
    <h2 className="text-xl font-bold">{isAr ? 'محاور مراجعة مقترحة' : 'Proposed review lenses'}</h2>
    <p role="note">{isAr
      ? 'ملاحظات تصميمية من إعداد سدو؛ ليست أقوالاً أو مراجعة أو تأييداً من أي مسؤول. لم يُثبت امتثال مؤسسي أو أداء فعلي هنا.'
      : 'SADU-authored design prompts, not quotations, reviews or endorsements by officials. No institutional compliance or actual performance is established here.'}</p>
    <div className="grid gap-4 md:grid-cols-3">{lenses.map(lens => <article key={lens.en} className="rounded-lg border border-sadu-gold bg-sadu-linen p-5">
      <h3 className="font-bold">{isAr ? lens.ar : lens.en}</h3><p className="mt-2 text-sm">{isAr ? lens.bodyAr : lens.bodyEn}</p>
    </article>)}</div>
  </section>;
}
