import { useState } from 'react';
import { FileText, Plane } from 'lucide-react';
import { airportService, arrivalPreviewReady, type ArrivalDraft } from '../data/arrivalPackage';

export function ArrivalPackagePreview({ isAr, artistName }: { isAr: boolean; artistName: string }) {
  const [draft, setDraft] = useState<ArrivalDraft>({ airport: '', flight: '', terminal: '', arrivalLocal: '', identityReviewed: false, itineraryReviewed: false, juryGuideIncluded: false });
  const [prepared, setPrepared] = useState<ArrivalDraft | null>(null);
  const service = airportService(draft.airport);
  const ready = arrivalPreviewReady(draft);
  const inputClass = 'mt-1 block w-full rounded-md border border-[#D9CEBA] bg-[#F7F1E6] ps-3 pe-3 py-2 text-start';

  function updateItinerary(patch: Partial<ArrivalDraft>) {
    setDraft(current => ({ ...current, ...patch, itineraryReviewed: false }));
    setPrepared(null);
  }

  return <section className="rounded-lg border border-[#D9CEBA] bg-white ps-5 pe-5 py-5 space-y-4 text-start" aria-label={isAr ? 'حزمة الوصول التدريبية' : 'Rehearsal arrival package'}>
    <h2 className="flex items-center gap-2 text-xl font-semibold"><Plane className="size-5" aria-hidden="true" />{isAr ? 'حزمة الوصول — معاينة محلية' : 'Arrival package — local preview'}</h2>
    <p className="rounded bg-[#EDE4D3] ps-3 pe-3 py-3 text-sm">{isAr ? 'بيانات نموذجية / غير موثقة. لا إرسال أو رفع ملفات أو حجز خدمة. تُمسح هذه المسودة عند مغادرة مساحة العمل.' : 'Sample data / Unverified. No sending, file uploads or service booking. This draft resets when you leave the workspace.'}</p>
    <p>{isAr ? 'المستلم التجريبي' : 'Fictional recipient'}: <bdi>{artistName}</bdi></p>
    <div className="grid gap-4 sm:grid-cols-2">
      <label>{isAr ? 'مطار الوصول' : 'Arrival airport'}<select className={inputClass} value={draft.airport} onChange={event => updateItinerary({ airport: event.target.value, terminal: '' })}>
        <option value="">{isAr ? 'اختر المطار' : 'Select airport'}</option>
        <option value="DXB">DXB — Dubai International</option><option value="SHJ">SHJ — Sharjah International</option>
        <option value="OTHER">{isAr ? 'مطار آخر — مراجعة يدوية' : 'Other airport — manual review'}</option>
      </select></label>
      <label>{isAr ? 'رقم الرحلة النموذجي' : 'Sample flight number'}<input className={inputClass} value={draft.flight} onChange={event => updateItinerary({ flight: event.target.value })} placeholder="DEMO 101" /></label>
      <label>{isAr ? 'مبنى الوصول' : 'Arrival terminal'}<input className={inputClass} value={draft.terminal} onChange={event => updateItinerary({ terminal: event.target.value })} /></label>
      <label>{isAr ? 'توقيت الوصول المحلي — الإمارات (UTC+04:00)' : 'Arrival time — UAE local (UTC+04:00)'}<input type="datetime-local" className={inputClass} value={draft.arrivalLocal} onChange={event => updateItinerary({ arrivalLocal: event.target.value })} /></label>
    </div>
    <p role="status" className="text-sm text-[#736357]">{service
      ? (isAr ? `الخدمة المقترحة: ${service} — يلزم تأكيد الحجز والتعليمات من التشريفات.` : `Suggested service: ${service} — PR must confirm the booking and instructions.`)
      : (isAr ? 'لا توجد تعليمات معتمدة لهذا المطار؛ اختر DXB أو SHJ، وإلا تلزم مراجعة يدوية.' : 'No mapped instructions for this airport. Select DXB or SHJ; other airports require manual review.')}</p>
    <fieldset className="space-y-3 border-t border-[#D9CEBA] pt-4">
      <legend className="font-semibold">{isAr ? 'مراجعة بشرية — محاكاة فقط' : 'Human review — simulation only'}</legend>
      {([
        ['identityReviewed', isAr ? 'راجعت تطابق اسم صاحب التذكرة والتأشيرة مع المستلم النموذجي.' : 'I checked the sample ticket and visa belong to this fictional recipient.'],
        ['itineraryReviewed', isAr ? 'راجعت المطار والمبنى والرحلة والتوقيت المحلي.' : 'I reviewed the airport, terminal, flight and local arrival time.'],
        ['juryGuideIncluded', isAr ? 'أدرجت دليل التحكيم النموذجي في قائمة الحزمة.' : 'I included the sample jury guide in the package checklist.'],
      ] as const).map(([field, label]) => <label key={field} className="flex items-start gap-3"><input type="checkbox" checked={draft[field]} onChange={event => { setDraft(current => ({ ...current, [field]: event.target.checked })); setPrepared(null); }} className="mt-1 size-5 shrink-0" /><span>{label}</span></label>)}
    </fieldset>
    <button type="button" disabled={!ready} onClick={() => { if (arrivalPreviewReady(draft)) setPrepared({ ...draft }); }} className="rounded-md bg-[#8B261E] ps-5 pe-5 py-3 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed">{isAr ? 'تجهيز معاينة حزمة الوصول' : 'Prepare arrival package preview'}</button>
    {prepared && <div className="space-y-4 border-s-4 border-[#8B261E] bg-[#F7F1E6] ps-4 pe-4 py-4" aria-live="polite">
      <p className="font-bold text-[#8B261E]">{isAr ? 'نسخة تدريبية — لم تُرسل' : 'REHEARSAL PREVIEW — NOT SENT'}</p>
      <p className="text-sm">Guided rehearsal • fictional records • no external actions</p>
      <article lang="en" dir="ltr" className="space-y-2 text-start">
        <h3 className="font-semibold">Subject: Travel & Welcome Guide — Sharjah Calligraphy Biennial</h3>
        <p>Dear {artistName},</p><p>Warm greetings from the Department of Culture, Sharjah. This is a fictional preview of your arrival information.</p>
        <p>Flight: {prepared.flight} · Airport: {prepared.airport} · Terminal: {prepared.terminal}<br />Arrival: {prepared.arrivalLocal.replace('T', ' ')} (UAE local time, UTC+04:00).</p>
        <p>Proposed airport assistance: {airportService(prepared.airport)}. Please follow the meeting instructions confirmed by PR & Protocol. Service booking, meeting point and transfer arrangements are not confirmed in this preview.</p>
        <p>PR contact and guest-group link: awaiting verified details.</p>
      </article>
      <article lang="ar" dir="rtl" className="space-y-2 text-start">
        <h3 className="font-semibold">الموضوع: دليل السفر والترحيب — ملتقى الشارقة للخط</h3>
        <p>تحية طيبة إلى <bdi>{artistName}</bdi>، هذه معاينة خيالية لمعلومات الوصول.</p>
        <p>الرحلة: <bdi>{prepared.flight}</bdi> · المطار: <bdi>{prepared.airport}</bdi> · المبنى: <bdi>{prepared.terminal}</bdi><br />الوصول: <bdi>{prepared.arrivalLocal.replace('T', ' ')} (UTC+04:00)</bdi> — توقيت الإمارات.</p>
        <p>خدمة الاستقبال المقترحة: <bdi>{airportService(prepared.airport)}</bdi>. يرجى اتباع تعليمات اللقاء بعد تأكيدها من التشريفات. الحجز ونقطة اللقاء والنقل غير مؤكدة في هذه المعاينة.</p>
        <p>بيانات اتصال التشريفات ورابط مجموعة الضيوف: بانتظار التوثيق.</p>
      </article>
      <h3 className="flex items-center gap-2 font-semibold"><FileText className="size-4" aria-hidden="true" />{isAr ? 'قائمة الحزمة — لا ملفات مرفقة' : 'Package checklist — no files attached'}</h3>
      <ul className="list-disc ps-5 text-sm"><li>{isAr ? 'تذكرة نموذجية' : 'Sample flight ticket'}</li><li>{isAr ? 'تأشيرة نموذجية — لا أرقام هوية شخصية' : 'Sample visa — no personal identifiers'}</li><li>{isAr ? 'دليل تحكيم نموذجي' : 'Sample jury guidelines'}</li></ul>
      <p className="text-sm">{isAr ? 'تجهيز المعاينة لا يسجل وصول الضيف ولا يمنح اعتماد التشريفات.' : 'Preparing this preview does not record guest arrival or clear the PR evidence gate.'}</p>
    </div>}
  </section>;
}
