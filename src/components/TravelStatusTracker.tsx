import { CheckCircle, Clock, MapPin } from 'lucide-react';
import { useSessionDraft } from '../context/SessionDrafts';
import { emptyTravelPacket } from '../data/executionBridges';

export function TravelStatusTracker({ artistId, passportDone, isAr }: {
  artistId: string;
  passportDone: boolean;
  isAr: boolean;
}) {
  const [packet] = useSessionDraft(`travel-vault:${artistId}`, emptyTravelPacket);
  const dispatched = packet.status === 'TRAVEL_DOCUMENTS_DISPATCHED';
  const t = (ar: string, en: string) => isAr ? ar : en;
  const steps = [
    { title: t('بانتظار جواز السفر / البيانات', 'Awaiting Passport/Details'), complete: passportDone, active: !passportDone && !dispatched },
    { title: t('قيد المعالجة لدى التشريفات والعلاقات العامة', 'Processing with PR & Protocol'), complete: dispatched, active: passportDone && !dispatched },
    { title: t('تم إرسال الوثائق', 'Documents Dispatched'), complete: dispatched, active: false },
  ];

  return <section aria-label={t('حالة السفر والإقامة', 'Travel & Accommodation Status')} className="mb-5 space-y-4 rounded-lg border border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-5 text-start">
    <h2 className="text-xl font-semibold">{t('حالة السفر والإقامة', 'Travel & Accommodation Status')}</h2>
    <p className="text-sm text-[#736357]">{t('متابعة بيانات المحاكاة في هذه الجلسة؛ ليست متابعة حية لجهات خارجية.', 'Tracks this session’s rehearsal records; not a live external service.')}</p>
    <ol className="grid gap-4 sm:grid-cols-3" aria-live="polite">
      {steps.map((step, index) => {
        const Icon = step.complete ? CheckCircle : Clock;
        return <li key={index} aria-current={step.active ? 'step' : undefined} className={`rounded border border-s-4 ps-4 pe-4 py-4 ${step.complete ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : step.active ? 'border-amber-300 bg-amber-50 text-amber-950' : 'border-[#D9CEBA] bg-white text-[#736357]'}`}>
          <Icon aria-hidden="true" className="mb-2 size-5" />
          <h3 className="font-semibold">{index + 1}. {step.title}</h3>
          <p className="mt-2 text-sm">{step.complete ? t('مكتمل', 'Completed') : step.active ? t('جارٍ', 'Current') : t('بانتظار', 'Pending')}</p>
          {index === 1 && step.active && <p className="mt-2 text-sm">{t('تتم معالجة وثائقك حالياً لدى فريق العلاقات العامة بدائرة الثقافة بالشارقة. لا يلزم اتخاذ أي إجراء.', 'Your documents are currently being processed by the Sharjah Department of Culture PR team. No action required.')}</p>}
        </li>;
      })}
    </ol>
    <div className="rounded border border-[#D9CEBA] bg-white ps-4 pe-4 py-3">
      <h3 className="flex items-center gap-2 font-semibold"><MapPin aria-hidden="true" className="size-4" />{t('حالة الإقامة', 'Accommodation Status')}</h3>
      <p className="mt-1">{t('المكان: بانتظار تخصيص العلاقات العامة', 'Venue: Pending PR Allocation')}</p>
    </div>
  </section>;
}

