import { Plane, Send, ShieldCheck } from 'lucide-react';
import { useSessionDraft } from '../context/SessionDrafts';
import { buildArrivalPackage, EMPTY_ARRIVAL, type ArrivalDraft, type ArrivalDispatch, type ArrivalRecipient } from '../data/arrivalPackage';

export function ArrivalDispatchPanel({recipient,isAr,records,publicationReady,onDispatch}:{recipient:ArrivalRecipient;isAr:boolean;records:ArrivalDispatch[];publicationReady:boolean;onDispatch:(draft:ArrivalDraft)=>void}) {
  const [draft]=useSessionDraft<ArrivalDraft>(`arrival:${recipient.id}`,EMPTY_ARRIVAL);
  const packet=buildArrivalPackage(recipient,draft);
  const history=records.filter(r=>r.recipientId===recipient.id);
  const current=packet&&history.find(r=>r.revision===packet.revision&&r.tag===packet.tag&&r.recipientName===packet.recipientName&&JSON.stringify(r.itinerary)===JSON.stringify(packet.itinerary));
  return <section className="mx-auto my-4 max-w-5xl rounded-lg border border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-5 text-start space-y-3">
    <h2 className="flex items-center gap-2 text-xl"><Plane aria-hidden="true"/>{isAr?'الوصول والإرسال الآلي':'Arrival & Automated Dispatch'}</h2>
    <p>{recipient.artistName} · <bdi>{recipient.arrivalRecipientTag??(isAr?'بانتظار تصنيف معتمد':'Awaiting approved designation')}</bdi></p>
    <p className="text-sm text-[#736357]">{isAr?'محاكاة للجلسة فقط — لا بريد مرسل أو ملفات فعلية مرفقة أو حجز خدمة.':'Session rehearsal only — no email sent, actual files attached, or service booked.'}</p>
    {!packet&&<p role="status">{isAr?'بانتظار اعتماد صفة المستلم ومراجعة بيانات الوصول ودليل الترحيب في مكتب التشريفات.':'Awaiting approved recipient designation and PR review of arrival details and welcome guide.'}</p>}
    {packet&&<article className="space-y-2 rounded border border-[#D9CEBA] bg-[#FFFDF7] ps-4 pe-4 py-4">
      <h3 className="font-semibold">{isAr?'الموضوع: حزمة الوصول — ملتقى الشارقة للخط':'Subject: Arrival Package — Sharjah Calligraphy Biennial'}</h3>
      <p>{isAr?'تحية طيبة إلى':'Dear'} {packet.recipientName}</p>
      <p><bdi>{packet.itinerary.flight} · {packet.itinerary.airport} · {packet.itinerary.terminal} · {packet.itinerary.arrivalLocal.replace('T',' ')} (UTC+04:00)</bdi></p>
      <p>{isAr?`خدمة الاستقبال المقترحة: ${packet.service}. اتبع تعليمات اللقاء التي تؤكدها التشريفات؛ هذه المحاكاة لا تؤكد الحجز أو نقطة اللقاء.`:`Proposed airport assistance: ${packet.service}. Follow the meeting instructions confirmed by PR; this rehearsal does not confirm a booking or meeting point.`}</p>
      <h4 className="flex items-center gap-2 font-semibold"><ShieldCheck aria-hidden="true"/>{isAr?'قائمة المرفقات التدريبية':'Rehearsal attachment manifest'}</h4>
      <ul className="list-disc ps-5">{packet.attachments.map(id=><li key={id}>{({FLIGHT_TICKET:isAr?'تذكرة الطيران':'Flight ticket',VISA:isAr?'التأشيرة':'Visa',WELCOME_GUIDE:isAr?'دليل الترحيب':'Welcome guide',JUDGING_MECHANISM_PDF:isAr?'آلية التحكيم PDF — حصري لأعضاء اللجنة؛ الملف المعتمد غير متاح':'Judging Mechanism PDF — jury only; approved file not supplied'} as Record<string,string>)[id]}</li>)}</ul>
    </article>}
    <button type="button" disabled={!packet||!publicationReady||Boolean(current)} onClick={()=>{if(packet&&publicationReady&&!current)onDispatch(draft);}} className="inline-flex items-center gap-2 rounded bg-[#8B261E] ps-4 pe-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed"><Send aria-hidden="true"/>{isAr?'إرسال حزمة الوصول — محاكاة':'Dispatch Arrival Package — Simulate'}</button>
    {current&&<p role="status">{isAr?'سُجّل الإرسال التدريبي — لم يُرسل بريد':'Rehearsal dispatch recorded — no email sent'} · {new Date(current.at).toLocaleString(isAr?'ar-AE':'en-GB')}</p>}
    {history.length>0&&<details><summary>{isAr?'سجل الإرسال للجلسة':'Session dispatch history'}</summary><ul className="list-disc ps-5">{history.map((row,i)=><li key={`${row.at}:${i}`}><bdi>{row.at} · {row.tag} · {row.itinerary.airport} · {row.service}</bdi> · {row===current?(isAr?'حالي':'Current'):(isAr?'تاريخي — لا يثبت صلاحية البيانات الحالية':'Historical — not evidence of current validity')}</li>)}</ul></details>}
  </section>;
}
