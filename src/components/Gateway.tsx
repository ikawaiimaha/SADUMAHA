import { InstitutionalProtocolPillars } from './InstitutionalProtocolPillars';

export function Gateway({ isAr, onEnter, onStory, onLanguage }: { isAr: boolean; onEnter: () => void; onStory: () => void; onLanguage: () => void }) {
  return <main dir={isAr ? 'rtl' : 'ltr'} className="min-h-screen bg-[#F7F1E6] text-[#2C2A29] ps-6 pe-6 py-8 text-start">
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap justify-between gap-4 items-center"><strong className="font-serif text-3xl text-[#8B261E]">{isAr ? 'سدو' : 'SADU'}</strong><button onClick={onLanguage} className="rounded border border-[#D9CEBA] ps-4 pe-4 py-2">{isAr ? 'English' : 'العربية'}</button></header>
      <p className="text-sm text-[#736357]">{isAr ? 'عرض تدريبي • سجلات خيالية • لا إجراءات خارجية' : 'Guided rehearsal • fictional records • no external actions'}</p>
      <h1 className="font-serif text-4xl leading-tight">{isAr ? 'من الفكرة إلى المعرض — سجل مؤسسي مترابط' : 'From proposal to exhibition — one connected institutional record'}</h1>
      <p className="max-w-3xl text-lg leading-relaxed">{isAr ? 'تابع القرار، والمكتب المسؤول، وما يلزم لإتمام الخطوة التالية. هذه محاكاة لمسار ملتقى الشارقة للخط؛ تحفظ مسودات التنفيذ أثناء الجلسة ولا تنشئ اعتماداً حقيقياً.' : 'Follow each decision, the responsible desk and the evidence needed next. This Sharjah Calligraphy Biennial rehearsal retains operational drafts during the session and creates no real approvals.'}</p>
      <div className="grid gap-4 md:grid-cols-3">{(isAr ? [['١–٣ · القرار والتوجيه','اللجنة تقترح، والقيادة تعتمد، والتحرير ينشر، والمنسق يصوغ الدليل.'],['٤–٦ · الترشيح والاتفاق','تدقيق الملفات، ومراجعة المدير، ثم اتفاق العمل الواحد: أفق كوفي.'],['٧–٨ · التنفيذ والإغلاق','فحوص مستقلة، ودفعات مرتبطة بالأدلة، ثم الإعادة وتسوية الحالة.']] : [['1–3 · Decide and guide','Committee proposals, executive ratification, bilingual publication and curatorial guidelines.'],['4–6 · Nominate and agree','Dossier vetting, Director review and a single-work agreement for Kufic Horizon.'],['7–8 · Deliver and close','Independent clearances, evidence-based tranches, safe return and condition reconciliation.']]).map(([title, body]) => <section key={title} className="rounded-lg border border-[#D9CEBA] bg-white ps-5 pe-5 py-5"><h2 className="font-semibold text-lg">{title}</h2><p className="mt-3 leading-relaxed">{body}</p></section>)}</div>
      <div className="flex flex-wrap gap-3"><button onClick={onEnter} className="rounded bg-[#8B261E] ps-6 pe-6 py-3 text-white font-semibold">{isAr ? 'الدخول إلى النظام المؤسسي' : 'Enter Institutional System'}</button><button onClick={onStory} className="rounded border border-[#D9CEBA] ps-5 pe-5 py-3">{isAr ? 'السياق المؤسسي — اختياري' : 'Institutional story — optional'}</button></div>
      <InstitutionalProtocolPillars isAr={isAr} />
    </div>
  </main>;
}
