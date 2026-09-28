import { assignedTo, COORDINATORS, HONORED_EVENT, HONORED_GUESTS, ROSTER_SOURCE } from '../data/participation2026';

export function HonoredGuestRoster({ coordinatorId, isAr }: { coordinatorId?: string; isAr: boolean }) {
  const guests = coordinatorId ? assignedTo(HONORED_GUESTS, coordinatorId) : HONORED_GUESTS;
  return <section className="my-5 space-y-4 rounded-xl border border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-5 text-start">
    <h2 className="text-xl font-semibold">{isAr ? 'سجل ضيوف التكريم' : 'Honored guest register'} · {guests.length}</h2>
    <p>{isAr ? 'مرجع وثائقي · 53 اسماً في المصدر؛ الحضور غير مؤكد' : 'Source reference · 53 names in the document; attendance not confirmed'}</p>
    <p className="text-sm text-[#736357]">{ROSTER_SOURCE}</p>
    <p>{isAr ? 'السبت 10 أكتوبر 2026 · بيت الحكمة · الاستضافة 6–11 أكتوبر' : 'Saturday, 10 October 2026 · House of Wisdom · Hosting 6–11 October'}</p>
    <p role="status" className="rounded border-s-4 border-amber-600 bg-amber-50 ps-4 pe-4 py-3">{isAr ? 'تصريح الموقع الخارجي (شروق): لم يُسجّل. ورود الموقع في القائمة لا يعني اعتماد التصريح.' : 'External venue clearance (Shurooq): not recorded. A listed venue does not establish authorization.'}</p>
    <details><summary className="cursor-pointer">{isAr ? 'عرض الضيوف والمنسقات' : 'View guests and assigned coordinators'}</summary>
      <ul className="mt-3 space-y-2">{guests.map(guest => <li key={guest.id} className="rounded border border-[#D9CEBA] bg-white ps-3 pe-3 py-3">
        <strong dir="auto">{guest.name}</strong><p>{COORDINATORS.find(c => c.id === guest.assignedCoordinatorId)?.name}</p>
        <p className="text-sm">{HONORED_EVENT.date} · {isAr ? HONORED_EVENT.venueAr : HONORED_EVENT.venueEn}</p>
      </li>)}</ul>
      {!guests.length && <p>{isAr ? 'لا توجد أسماء مخصصة لهذه المنسقة في المصدر.' : 'No source guests assigned to this coordinator.'}</p>}
    </details>
  </section>;
}
