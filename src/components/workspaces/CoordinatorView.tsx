import React, { useState } from 'react';
import { Language, ExhibitionProgramme, WorkspaceTab } from '../../types';
import { ATTENTION_ITEMS } from '../../data/mockData';
import { useI18n } from '../../context/I18nContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { KpiCard } from '../common/KpiCard';
import { StatusProgressIndicator } from '../common/StatusProgressIndicator';
import {
  Users,
  MessageSquare,
  ShieldCheck,
  Lock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Send,
  EyeOff,
  UserCheck,
  Building2,
} from 'lucide-react';

export interface CoordinatorViewProps {
  lang?: Language;
  selectedProgramme?: ExhibitionProgramme;
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

export const CoordinatorView: React.FC<CoordinatorViewProps> = (props) => {
  const i18n = useI18n();
  const workspace = useWorkspace();
  const lang = props.lang ?? i18n.lang;
  const isAr = lang === 'ar';
  const { formatNumber } = i18n;
  const onNavigateTab = props.onNavigateTab ?? workspace.navigateTab;
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const activeArtistsCount = 14;
  const proposalsInReviewCount = 3;
  const missingDocsCount = 2;
  const unreadMessagesCount = 1;

  const handleNudge = (department: string) => {
    setSuccessToast(isAr ? `تم إرسال إشعار تذكير إلى قسم ${department}` : `Follow-up nudge sent to ${department}`);
    window.setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleMessageArtist = (_artist: string) => onNavigateTab('communications');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {successToast && (
        <div className="fixed top-20 end-6 z-50 flex items-center gap-2 rounded-lg border border-sadu-sage bg-sadu-sage-light px-4 py-3 text-xs font-semibold text-sadu-ink shadow-xl" role="status" aria-live="polite">
          <CheckCircle2 className="h-4 w-4 text-sadu-sage" />
          <span>{successToast}</span>
        </div>
      )}

      <section className="rounded-lg border border-sadu-gold bg-sadu-linen p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sadu-brick"><Users className="h-4 w-4" /><span>{isAr ? 'مكتب الارتباط والتنسيق الفني' : 'Artist Liaison & Intake Control'}</span></div>
            <h1 className="text-2xl font-editorial font-bold text-sadu-charcoal sm:text-3xl">{isAr ? 'إدارة شؤون الفنانين والمقترحات' : 'Artist Management & Proposal Tracking'}</h1>
            <p className="mt-1 max-w-2xl text-xs text-sadu-muted sm:text-sm">{isAr ? 'متابعة ترشيحات الفنانين، مراجعة اكتمال المقترحات الفنية، وتتبع الجاهزية عبر الأقسام. لا يتضمن هذا الدور صلاحية وصول للبيانات المالية أو وثائق السفر الشخصية.' : 'Track artist nominations, review proposal completeness, and monitor cross-departmental readiness. This role operates with Zero-Knowledge routing for financial and protocol documents.'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigateTab('communications')} className="flex cursor-pointer items-center gap-1.5 rounded-md bg-sadu-brick px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sadu-brick-dark"><MessageSquare className="h-4 w-4" /><span>{isAr ? 'مراسلة الفنانين' : 'Message Artists'}</span></button>
            <button onClick={() => onNavigateTab('dossiers')} className="flex cursor-pointer items-center gap-1.5 rounded-md border border-sadu-gold bg-sadu-sand px-4 py-2 text-xs font-semibold text-sadu-ink transition-colors hover:bg-sadu-sand-dark"><UserCheck className="h-4 w-4" /><span>{isAr ? 'ترشيح فنان جديد' : 'Nominate Artist'}</span></button>
          </div>
        </div>

        <div className="mt-6 border-t border-sadu-gold/40 pt-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard titleEn="Active Artists" titleAr="الفنانين ضمن المعرض" value={formatNumber(activeArtistsCount)} subtitle={isAr ? 'ضمن المعرض النشط' : 'Current programme'} icon={Users} lang={lang} />
            <KpiCard titleEn="Proposals In Review" titleAr="مقترحات قيد المراجعة" value={formatNumber(proposalsInReviewCount)} subtitle={isAr ? 'بانتظار قرار اللجنة' : 'Awaiting committee decision'} icon={FileText} lang={lang} />
            <KpiCard titleEn="Missing Documents" titleAr="مستندات ناقصة" value={formatNumber(missingDocsCount)} subtitle={isAr ? 'تتطلب تذكير الفنان' : 'Requires artist nudge'} icon={AlertCircle} lang={lang} alert />
            <KpiCard titleEn="Unread Messages" titleAr="رسائل غير مقروءة" value={formatNumber(unreadMessagesCount)} subtitle={isAr ? 'بوابة المراسلات الرسمية' : 'Official communications'} icon={MessageSquare} lang={lang} />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-sadu-gold bg-white p-6 shadow-xs">
        <div className="border-b border-sadu-gold/40 pb-3">
          <h2 className="flex items-center gap-2 text-lg font-editorial font-bold text-sadu-charcoal"><ShieldCheck className="h-5 w-5 text-sadu-sage" />{isAr ? 'هندسة الخصوصية والمسار الموجه' : 'Zero-Knowledge Document Routing'}</h2>
          <p className="mt-0.5 text-xs text-sadu-muted">{isAr ? 'أنت تدير العلاقة الفنية. النظام يوجه المستندات الحساسة تلقائياً لجهات الاختصاص لحمايتك قانونياً.' : 'You manage the artistic relationship. SADU automatically routes sensitive documents to specialized departments to protect your liability.'}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-3 rounded-lg border border-sadu-gold bg-sadu-sand p-4"><div className="flex items-center gap-2 text-xs font-bold text-sadu-ink"><FileText className="h-4 w-4" />{isAr ? 'الملف الفني والمقترح' : 'CV, Portfolio & Proposal'}</div><p className="text-[11px] text-sadu-charcoal">{isAr ? 'متاح للمنسق: مراجعة الاكتمال، مطابقة الثيمة، والرفع للجنة التحكيم.' : 'Fully visible to Coordinator: review completeness, prepare curatorial briefs, and route to Committee.'}</p><div className="flex items-center gap-1 border-t border-sadu-gold/40 pt-2 text-[10px] font-bold text-sadu-sage"><CheckCircle2 className="h-3 w-3" />{isAr ? 'صلاحية وصول كاملة' : 'Full Access Granted'}</div></div>
          <div className="space-y-3 rounded-lg border border-sadu-gold bg-sadu-paper p-4 opacity-80"><div className="flex items-center gap-2 text-xs font-bold text-sadu-brick"><Building2 className="h-4 w-4" />{isAr ? 'البيانات البنكية (IBAN)' : 'Banking & IBAN Details'}</div><p className="text-[11px] text-sadu-charcoal">{isAr ? 'محجوب: يتم توجيه معلومات حساب الفنان مباشرة إلى إدارة الشؤون المالية للتدقيق والصرف.' : 'Shielded: banking details route directly to Finance for verification and disbursement.'}</p><div className="flex items-center gap-1 border-t border-sadu-gold/40 pt-2 text-[10px] font-bold text-sadu-brick"><Lock className="h-3 w-3" />{isAr ? 'البيانات محجوبة تلقائياً' : 'Data Shielded from Coordinator'}</div></div>
          <div className="space-y-3 rounded-lg border border-sadu-gold bg-sadu-paper p-4 opacity-80"><div className="flex items-center gap-2 text-xs font-bold text-sadu-brick"><EyeOff className="h-4 w-4" />{isAr ? 'جواز السفر والتأشيرة' : 'Passport & Visa Docs'}</div><p className="text-[11px] text-sadu-charcoal">{isAr ? 'محجوب: تُرسل وثائق السفر الحساسة آلياً إلى مكتب التشريفات والعلاقات العامة.' : 'Shielded: sensitive travel documents route directly to PR & Protocol.'}</p><div className="flex items-center gap-1 border-t border-sadu-gold/40 pt-2 text-[10px] font-bold text-sadu-brick"><Lock className="h-3 w-3" />{isAr ? 'البيانات محجوبة تلقائياً' : 'Data Shielded from Coordinator'}</div></div>
        </div>
      </section>

      <section className="rounded-lg border border-sadu-gold bg-sadu-linen p-6 shadow-xs">
        <div className="mb-4"><h2 className="text-lg font-editorial font-bold text-sadu-charcoal">{isAr ? 'طابور تتبع الإنجاز عبر الأقسام' : 'Cross-Departmental Tracking Queue'}</h2><p className="text-xs text-sadu-muted">{isAr ? 'مراقبة حالة متطلبات الفنانين لدى الأقسام الأخرى وإرسال تذكيرات.' : 'Monitor artist requirements across departments and send follow-up nudges.'}</p></div>
        <div className="space-y-3">
          {ATTENTION_ITEMS.map(item => <div key={item.id} className={`flex flex-col justify-between gap-4 rounded-md border p-4 transition-all sm:flex-row sm:items-center ${item.status === 'resolved' ? 'border-sadu-gold/40 bg-sadu-sand/40 opacity-75' : item.priority === 'critical' ? 'border-sadu-brick bg-sadu-paper' : 'border-sadu-gold bg-white'}`}>
            <div className="max-w-xl space-y-1"><div className="flex flex-wrap items-center gap-2 text-[11px]"><span className="rounded bg-sadu-sand-dark px-2 py-0.5 font-semibold text-sadu-ink">{isAr ? 'مسند إلى:' : 'Assigned to:'} {item.assignedRole}</span><span className="flex flex-wrap items-center gap-1.5 text-sadu-muted">{isAr ? 'الفنان:' : 'Artist:'} <strong className="text-sadu-charcoal">{isAr ? item.artistAr : item.artistEn}</strong></span></div><h3 className={`mt-1 text-sm font-bold ${item.status === 'resolved' ? 'text-sadu-muted line-through' : 'text-sadu-charcoal'}`}>{isAr ? item.titleAr : item.titleEn}</h3></div>
            <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
              {item.status !== 'resolved' ? <><button onClick={() => handleMessageArtist(item.artistEn)} className="flex cursor-pointer items-center gap-1.5 rounded border border-sadu-gold bg-sadu-linen px-3 py-1.5 text-xs font-semibold text-sadu-charcoal transition-colors hover:bg-sadu-sand"><MessageSquare className="h-3.5 w-3.5" />{isAr ? 'مراسلة الفنان' : 'Message Artist'}</button><button onClick={() => handleNudge(item.assignedRole)} className="flex cursor-pointer items-center gap-1.5 rounded bg-sadu-ink px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sadu-ink-dark"><Send className="h-3.5 w-3.5" />{isAr ? 'تذكير القسم' : 'Nudge Dept'}</button></> : <span className="flex items-center gap-1 text-xs font-bold text-sadu-sage"><CheckCircle2 className="h-4 w-4" />{isAr ? 'مكتملة لدى القسم' : 'Resolved by Dept'}</span>}
            </div>
          </div>)}
        </div>
      </section>
    </div>
  );
};
