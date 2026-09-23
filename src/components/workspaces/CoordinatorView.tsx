import React, { useState } from 'react';
import { Language, ExhibitionProgramme, WorkspaceTab } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Users, FileText, AlertCircle, MessageSquare, ShieldCheck, BellRing, Lock, Send, UserPlus, Clock, Inbox } from 'lucide-react';
import { InboxModal } from './InboxModal';
import { DraftingPool } from '../governance/DraftingPool';
import { ContractBuilder } from '../governance/ContractBuilder';

export interface CoordinatorViewProps {
  lang?: Language;
  selectedProgramme?: ExhibitionProgramme;
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

const TRACKING_QUEUE = [
  { id: 1, deptEn: 'TECHNICAL / MUSEUM', deptAr: 'الهندسة والمتحف', artistEn: 'Youssef Nabhan', artistAr: 'يوسف نبهان', taskEn: 'Floor Load Verification for Kufic Horizon (84 kg Bronze)', taskAr: 'التحقق من تحمل الأرضية لوزن العمل (84 كغ)', due: 'Due in 2d', dueAr: 'خلال يومين', status: 'pending' },
  { id: 2, deptEn: 'DIRECTORATE', deptAr: 'إدارة الشؤون الثقافية', artistEn: 'Youssef Nabhan', artistAr: 'يوسف نبهان', taskEn: 'Artist Contract Countersignature: Directorate Final Approval', taskAr: 'توقيع واعتماد العقد النهائي من الإدارة', due: 'Due in 4d', dueAr: 'خلال 4 أيام', status: 'pending' },
  { id: 3, deptEn: 'TECHNICAL / MUSEUM', deptAr: 'مكتب الترميم', artistEn: 'Youssef Nabhan', artistAr: 'يوسف نبهان', taskEn: 'Patina Discrepancy Reconciliation in Customs Report', taskAr: 'تسوية تقرير تباين حالة الأكسدة بعد التخليص الجمركي', due: 'Due in 5d', dueAr: 'خلال 5 أيام', status: 'pending' },
  { id: 4, deptEn: 'PR / PROTOCOL', deptAr: 'العلاقات العامة', artistEn: 'Nora Al-Mazrouei', artistAr: 'نورة المزروعي', taskEn: 'Visa Clearance Confirmed — Security Token Issue for Flight Booking', taskAr: 'تأكيد الموافقة على التأشيرة — إصدار تصريح حجز الطيران', due: '', dueAr: '', status: 'resolved' },
  { id: 5, deptEn: 'FINANCE', deptAr: 'المالية', artistEn: 'Youssef Nabhan', artistAr: 'يوسف نبهان', taskEn: 'Sample milestone 2: payment details unverified', taskAr: 'الدفعة الثانية: تفاصيل الحساب البنكي غير معتمدة', due: 'Due in 3d', dueAr: 'خلال 3 أيام', status: 'pending' },
];

export const CoordinatorView: React.FC<CoordinatorViewProps> = (props) => {
  const i18n = useI18n();
  const workspace = useWorkspace();
  const lang = props.lang ?? i18n.lang;
  const isAr = lang === 'ar';
  const { formatNumber } = i18n;
  const onNavigateTab = props.onNavigateTab ?? workspace.navigateTab;
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [inboxThreadId, setInboxThreadId] = useState<string | undefined>(undefined);

  const notify = (messageEn: string, messageAr: string) => {
    setSuccessToast(isAr ? messageAr : messageEn);
    window.setTimeout(() => setSuccessToast(null), 3500);
  };

  const openInbox = (threadId?: string) => {
    setInboxThreadId(threadId);
    setIsInboxOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      <InboxModal isOpen={isInboxOpen} onClose={() => setIsInboxOpen(false)} initialThreadId={inboxThreadId} />
      {successToast && <div role="status" aria-live="polite" className="fixed top-20 end-6 z-50 flex items-center gap-2 rounded-lg border border-sadu-sage bg-sadu-sage-light px-4 py-3 text-xs font-semibold text-sadu-ink shadow-xl"><ShieldCheck className="h-4 w-4 text-sadu-sage" /><span>{successToast}</span></div>}

      <section className="rounded-lg border border-sadu-gold bg-sadu-linen p-4 shadow-xs sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="max-w-2xl"><div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sadu-brick"><Users className="h-4 w-4" /><span>{isAr ? 'التنسيق وإدارة المشاركات' : 'Artist Liaison & Intake Control'}</span></div><h1 className="mb-2 text-2xl font-editorial font-bold text-sadu-charcoal sm:text-3xl">{isAr ? 'إدارة الفنانين وتتبع المقترحات' : 'Artist Management & Proposal Tracking'}</h1><p className="text-sm leading-relaxed text-sadu-muted">{isAr ? 'تتبع ترشيحات الفنانين، مراجعة اكتمال المقترحات، ومراقبة جاهزية الأقسام الأخرى. تعمل هذه الصلاحية بنظام التوجيه المخفي للوثائق المالية وجوازات السفر.' : 'Track artist nominations, review proposal completeness, and monitor cross-departmental readiness. This role uses Zero-Knowledge routing for financial and protocol documents.'}</p></div>
          <div className="flex shrink-0 flex-col gap-2"><button onClick={() => openInbox()} className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-sadu-brick px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-sadu-brick-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sadu-brick"><Inbox className="h-4 w-4" />{isAr ? 'صندوق الوارد' : 'Inbox'}</button><button onClick={() => onNavigateTab('dossiers')} className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-sadu-gold bg-white px-4 py-2.5 text-xs font-bold text-sadu-charcoal transition-colors hover:bg-sadu-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sadu-brick"><UserPlus className="h-4 w-4" />{isAr ? 'ترشيح فنان جديد' : 'Nominate Artist'}</button></div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { labelEn: 'Active Artists', labelAr: 'الفنانين النشطين', value: 14, subEn: 'Current programme', subAr: 'البرنامج الحالي', icon: Users, className: 'bg-white border-sadu-gold/50' },
            { labelEn: 'Proposals in Review', labelAr: 'مقترحات قيد التحكيم', value: 3, subEn: 'Awaiting committee decision', subAr: 'بانتظار قرار اللجنة', icon: FileText, className: 'bg-white border-sadu-gold/50' },
            { labelEn: 'Missing Documents', labelAr: 'وثائق فنية ناقصة', value: 2, subEn: 'Requires artist nudge', subAr: 'يتطلب تذكير الفنان', icon: AlertCircle, className: 'bg-amber-50 border-amber-200 text-amber-900' },
            { labelEn: 'Unread Messages', labelAr: 'رسائل غير مقروءة', value: 1, subEn: 'Official communications', subAr: 'المراسلات الرسمية', icon: MessageSquare, className: 'bg-white border-sadu-gold/50' },
          ].map(metric => { const Icon = metric.icon; return <div key={metric.labelEn} className={`flex h-24 flex-col justify-between rounded border p-4 ${metric.className}`}><div className="flex items-start justify-between"><span className="text-xs font-bold">{isAr ? metric.labelAr : metric.labelEn}</span><Icon className="h-4 w-4 text-sadu-brick" /></div><div><span className="text-2xl font-editorial font-bold">{formatNumber(metric.value)}</span><span className="mt-0.5 block text-[10px] opacity-75">{isAr ? metric.subAr : metric.subEn}</span></div></div>; })}
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-sadu-gold bg-sadu-linen p-4 shadow-xs sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-bold text-sadu-charcoal"><ShieldCheck className="h-4 w-4 text-sadu-sage" />{isAr ? 'التوجيه المخفي للوثائق' : 'Zero-Knowledge Document Routing'}</h2><p className="text-xs text-sadu-muted">{isAr ? 'أنت تدير العلاقة مع الفنان. يقوم النظام بتوجيه الوثائق الحساسة للأقسام المختصة لحماية مسؤوليتك.' : 'You manage the artistic relationship. SADU automatically routes sensitive documents to specialized departments to protect your liability.'}</p>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-md border border-sadu-gold/50 bg-white p-4"><div className="mb-2 flex items-center gap-2 text-xs font-bold text-sadu-charcoal"><FileText className="h-4 w-4 text-sadu-muted" />{isAr ? 'السيرة الذاتية والمقترح' : 'CV, Portfolio & Proposal'}</div><p className="mb-3 text-[11px] leading-relaxed text-sadu-muted">{isAr ? 'مرئية بالكامل للمنسق لمراجعة الاكتمال وبناء الملف وإحالته للجنة.' : 'Fully visible to review completeness, prepare curatorial briefs, and route to Committee.'}</p><span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-sadu-sage"><ShieldCheck className="h-3.5 w-3.5" />{isAr ? 'صلاحية وصول كاملة' : 'Full Access Granted'}</span></div>
          <div className="rounded-md border border-sadu-gold/50 bg-sadu-paper p-4 opacity-80"><div className="mb-2 flex items-center gap-2 text-xs font-bold text-sadu-brick"><Lock className="h-4 w-4" />{isAr ? 'الحساب البنكي (IBAN)' : 'Banking & IBAN Details'}</div><p className="mb-3 text-[11px] leading-relaxed text-sadu-muted">{isAr ? 'محجوبة: توجه البيانات مباشرة لقسم المالية للتحقق والصرف.' : 'Shielded: banking details route directly to Finance for verification and disbursement.'}</p><span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-sadu-brick"><Lock className="h-3.5 w-3.5" />{isAr ? 'محجوبة عن المنسق' : 'Data Shielded from Coordinator'}</span></div>
          <div className="rounded-md border border-sadu-gold/50 bg-sadu-paper p-4 opacity-80"><div className="mb-2 flex items-center gap-2 text-xs font-bold text-sadu-brick"><Lock className="h-4 w-4" />{isAr ? 'جواز السفر والتأشيرة' : 'Passport & Visa Docs'}</div><p className="mb-3 text-[11px] leading-relaxed text-sadu-muted">{isAr ? 'محجوبة: توجه وثائق السفر مباشرة لقسم العلاقات العامة والمراسم.' : 'Shielded: sensitive travel documents route directly to PR & Protocol.'}</p><span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-sadu-brick"><Lock className="h-3.5 w-3.5" />{isAr ? 'محجوبة عن المنسق' : 'Data Shielded from Coordinator'}</span></div>
        </div>
      </section>

      <section className="rounded-lg border border-sadu-gold bg-sadu-linen p-4 shadow-xs sm:p-6"><h2 className="mb-1 text-sm font-bold text-sadu-charcoal">{isAr ? 'طابور تتبع الأقسام الأخرى' : 'Cross-Departmental Tracking Queue'}</h2><p className="mb-5 text-xs text-sadu-muted">{isAr ? 'مراقبة متطلبات الفنانين لدى الأقسام الأخرى وإرسال تنبيهات المتابعة.' : 'Monitor artist requirements across departments and send follow-up nudges.'}</p><div className="space-y-3">{TRACKING_QUEUE.map(item => <div key={item.id} className={`flex flex-col justify-between gap-4 rounded-md border p-3 md:flex-row md:items-center ${item.status === 'resolved' ? 'border-sadu-sage/30 bg-sadu-sage-light/30' : 'border-sadu-gold/50 bg-white'}`}><div className="flex items-start gap-3"><div className={`mt-0.5 rounded-full p-1.5 ${item.status === 'resolved' ? 'bg-sadu-sage/20 text-sadu-sage' : 'bg-amber-100 text-amber-700'}`}>{item.status === 'resolved' ? <ShieldCheck className="h-3.5 w-3.5" /> : <BellRing className="h-3.5 w-3.5" />}</div><div><div className="mb-1 flex flex-wrap items-center gap-2"><span className="rounded border border-sadu-gold/50 bg-sadu-sand px-1.5 py-0.5 text-[10px] font-mono text-sadu-muted">{isAr ? `موكل إلى: ${item.deptAr}` : `Assigned to: ${item.deptEn}`}</span><span className="text-[10px] font-bold text-sadu-charcoal">{isAr ? item.artistAr : item.artistEn}</span></div><p className={`text-xs font-bold ${item.status === 'resolved' ? 'text-sadu-muted line-through' : 'text-sadu-charcoal'}`}>{isAr ? item.taskAr : item.taskEn}</p>{item.due && <span className="mt-1 flex items-center gap-1 text-[10px] text-amber-700"><Clock className="h-3 w-3" />{isAr ? item.dueAr : item.due}</span>}</div></div><div className="flex shrink-0 items-center gap-2 self-end md:self-center">{item.status === 'resolved' ? <span className="px-3 py-1.5 text-xs font-bold text-sadu-sage">{isAr ? 'مكتمل' : 'Resolved'}</span> : <><button onClick={() => openInbox(item.artistEn === 'Youssef Nabhan' ? 'youssef-cv' : item.artistEn === 'Nora Al-Mazrouei' ? 'noura-customs' : undefined)} className="flex cursor-pointer items-center gap-1.5 rounded border border-sadu-gold bg-white px-3 py-1.5 text-[10px] font-bold text-sadu-charcoal hover:bg-sadu-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sadu-brick"><MessageSquare className="h-3 w-3" />{isAr ? 'مراسلة الفنان' : 'Message Artist'}</button><button onClick={() => notify(`Follow-up nudge sent to ${isAr ? item.deptAr : item.deptEn}`, `تم إرسال تنبيه إلى ${item.deptAr}`)} className="flex cursor-pointer items-center gap-1.5 rounded bg-sadu-ink px-3 py-1.5 text-[10px] font-bold text-white hover:bg-sadu-ink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sadu-brick"><Send className="h-3 w-3" />{isAr ? 'تنبيه القسم' : 'Nudge Dept'}</button></>}</div></div>)}</div></section>
      <DraftingPool />
      <ContractBuilder />
    </div>
  );
};
