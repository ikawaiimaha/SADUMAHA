import { leadershipPeople } from '../data/leadershipMedia';

const strategicSources = {
  sharjah: 'https://ec.shj.ae/news/التنفيذي-يعتمد-إطلاق-استراتيجية-الشا/',
  uae: 'https://u.ae/en/about-the-uae/strategies-initiatives-and-awards/strategies-plans-and-visions/innovation-and-future-shaping/we-the-uae-2031-vision',
};

export function InstitutionalProtocolPillars({ isAr = true }: { isAr?: boolean }) {
  const pillars = isAr ? [
    ['بناء الإنسان والاستثمار الثقافي المستدام', 'يقترح سدو ربط دعم الإبداع بمسؤوليات واضحة ومتابعة الاتفاقيات، لمساندة الفنان وتحسين استمرارية العمل الثقافي.'],
    ['صون الذاكرة المؤسسية', 'تُظهر المحاكاة كيف ترتبط مقترحات اللجنة ومراجعة المدير واعتماد رئيس الدائرة بالأدلة اللاحقة. السجلات الحالية مؤقتة للجلسة؛ الحفظ المؤسسي الدائم هدف للتطوير.'],
    ['الحوكمة ووضوح المسؤوليات', 'المقدّم يتطلب قبول الاتفاقية وأدلة التشريفات والفريق الفني؛ والتسليم يتطلب الاستلام الفعلي. ترتبط دفعة الإكمال بإغلاق المعرض والإعادة وتسوية الحالة. هذه قواعد محاكاة وليست تفويضاً مالياً.'],
  ] : [
    ['Human-Centric Cultural Development', 'SADU proposes connecting creative support with clear responsibilities and agreement tracking to support artists and continuity in cultural work.'],
    ['Institutional Memory', 'The rehearsal links Committee proposals, Director review and Chairman ratification to downstream evidence. Current records are session-bound; durable institutional preservation is a development objective.'],
    ['Governance & Clear Responsibilities', 'Advance requires agreement acceptance and PR/Technical evidence; Delivery requires physical receipt. Completion follows exhibition closure, safe return and condition reconciliation. These are rehearsal rules, not financial delegations.'],
  ];

  return <details dir={isAr ? 'rtl' : 'ltr'} className="mt-5 rounded-xl border border-[#D9D2C5] bg-[#F7F1E6] ps-4 pe-4 py-4 text-start">
    <summary className="cursor-pointer text-base font-semibold text-[#8B4513] focus-visible:outline-2 focus-visible:outline-offset-4">{isAr ? 'الإطار المؤسسي والمحاور الاستراتيجية' : 'Institutional Framework & Strategic Pillars'}</summary>
    <div className="mt-5 space-y-5">
      <header className="border-b border-[#D9D2C5] pb-4">
        <p className="text-sm text-[#736357]">{isAr ? 'دولة الإمارات العربية المتحدة • حكومة الشارقة • دائرة الثقافة' : 'United Arab Emirates • Government of Sharjah • Department of Culture'}</p>
        <h2 className="mt-2 text-lg font-semibold">{isAr ? 'إدارة الشؤون الثقافية — ملتقى الشارقة للخط' : 'Directorate of Cultural Affairs — Sharjah Calligraphy Biennial'}</h2>
        <p className="mt-2 text-sm text-[#8B4513]">{isAr ? 'صياغة مقترحة للعرض التجريبي؛ لا تمثل اعتماداً أو تأييداً مؤسسياً.' : 'Proposed framing for the rehearsal; not institutional approval or endorsement.'}</p>
      </header>
      <ol className="list-decimal space-y-4 ps-5" aria-label={isAr ? 'التسلسل المؤسسي في العرض' : 'Institutional order in the presentation'}>
        {(['ruler', 'chairman', 'director'] as const).map(rank => {
          const person = leadershipPeople[rank];
          return <li key={rank} className="ps-1"><p className="font-semibold">{isAr ? person.nameAr : person.nameEn}</p>
            <p className="text-sm text-[#736357]">{isAr ? person.titleAr : person.titleEn}{rank === 'director' && (isAr ? ' • مدير ملتقى الشارقة للخط' : ' • Director of Sharjah Calligraphy Biennial')}</p></li>;
        })}
      </ol>
      <div className="grid gap-4">
        {pillars.map(([title, body]) => <section key={title} className="rounded-lg border border-[#E3DAC9] bg-white/80 ps-4 pe-4 py-4">
          <h3 className="text-lg font-semibold text-[#8B4513]">{title}</h3><p className="mt-2 text-base leading-relaxed text-[#2C2A29]">{body}</p>
        </section>)}
      </div>
      <footer className="space-y-2 border-t border-[#D9D2C5] pt-4 text-sm">
        <p>{isAr ? 'مراجع استراتيجية للمقارنة والتطوير؛ لم تُقيّم مواءمة سدو رسمياً.' : 'Strategic references for design and evaluation; SADU’s alignment has not been formally assessed.'}</p>
        <ul className="list-disc space-y-2 ps-5">
          <li><a href={strategicSources.sharjah} target="_blank" rel="noreferrer" className="underline text-[#8B4513]">{isAr ? 'المجلس التنفيذي: استراتيجية الشارقة للتحول الرقمي 2026–2028' : 'Executive Council: Sharjah Digital Transformation Strategy 2026–2028'}</a></li>
          <li><a href={strategicSources.uae} target="_blank" rel="noreferrer" className="underline text-[#8B4513]">{isAr ? 'البوابة الرسمية لحكومة الإمارات: نحن الإمارات 2031' : 'Official UAE Government Portal: We the UAE 2031'}</a></li>
        </ul>
      </footer>
    </div>
  </details>;
}
