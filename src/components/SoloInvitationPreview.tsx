import { SOLO_INVITATION_2026 as letter } from '../data/soloInvitation2026';

export function SoloInvitationPreview({ artistName, artworkCount }: { artistName: string; artworkCount: number }) {
  return <section dir="rtl" lang="ar" aria-label="معاينة دعوة المعرض الشخصي" className="space-y-4 rounded-lg border border-[#D9CEBA] bg-[#F7F1E6] ps-6 pe-6 py-6 text-start break-words">
    <p className="border-y border-[#8B261E] py-3 text-lg font-bold text-[#8B261E]">نسخة تدريبية — غير صالحة للإرسال أو التوقيع</p>
    <p className="text-sm">Guided rehearsal • fictional records • no external actions<br />سجل مؤقت للجلسة؛ لا يمثل اتفاقية قانونية.</p>
    <header className="font-semibold">دولة الإمارات العربية المتحدة<br />حكومة الشارقة<br />دائرة الثقافة</header>
    <p className="text-sm">مرجع المصدر: <bdi>{letter.reference}</bdi> · تاريخ المصدر: <bdi>{letter.letterDate}</bdi><br />مرجع المسودة: ش.ث/خ.س/[رقم] — لم يُخصص رقم صادر.</p>
    <h3 className="text-lg font-bold">دعوة تدريبية للمشاركة في معرض شخصي — {artistName}</h3>
    <p>تنظم إدارة الشؤون الثقافية ملتقى الشارقة للخط، الدورة الثانية عشرة، تحت شعار ({letter.theme})، من <bdi>{letter.eventStart}</bdi> إلى <bdi>{letter.eventEnd}</bdi>.</p>
    <p>عدد الأعمال المقترح: <bdi>{Number.isFinite(artworkCount) ? artworkCount : '—'}</bdi>. يتطلب المعرض الشخصي من 15 إلى 20 عملاً.</p>
    <p>{letter.coverage}</p>
    <p>فترة الاستضافة والإقامة: <bdi>{letter.hostingStart}</bdi> إلى <bdi>{letter.hostingEnd}</bdi>.</p>
    <p>منسقة هذه الدعوة النموذجية: الأستاذة {letter.coordinator.name}<br /><bdi>{letter.coordinator.email}</bdi> · <bdi>{letter.coordinator.phone}</bdi></p>
    <p>{letter.signatory}<br />مدير ملتقى الشارقة للخط<br />مدير إدارة الشؤون الثقافية<br /><span className="text-sm">اسم مطبوع من المصدر — لا توقيع أو ختم.</span></p>
    <div><h4 className="font-semibold">المرفقات المطلوبة — قائمة مرجعية، وليست ملفات مرفوعة</h4><ul className="list-disc ps-5">{letter.attachments.map(name => <li key={name}>{name}</li>)}</ul></div>
    <p className="text-xs text-[#736357]">معاينة مقتبسة بتصرف من النسخ النصي الذي قدمه المستخدم للمصدر 6؛ لم تتم مطابقة المسح الأصلي. تسمية Form 100 ربط مقترح وليست واردة في الخطاب.</p>
  </section>;
}
