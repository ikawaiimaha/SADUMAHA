import React, { useState } from 'react';
import { Language } from '../types';
import { AuthoredBand } from './AuthoredBand';
import { useI18n } from '../context/I18nContext';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Info,
  Compass,
  Layers,
  Building2,
  AlertTriangle,
  Award,
} from 'lucide-react';

interface PresenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const PresenterDrawer: React.FC<PresenterDrawerProps> = ({ isOpen, onClose, lang }) => {
  const i18n = useI18n();
  const activeLang = lang ?? i18n.lang;
  const isAr = activeLang === 'ar';
  const { formatNumber } = i18n;
  const [activeTab, setActiveTab] = useState<'architecture' | 'benchmarks' | 'ux'>('architecture');

  if (!isOpen) return null;

  const tabClass = (tab: typeof activeTab) => `pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
    activeTab === tab ? 'border-sadu-brick text-sadu-brick' : 'border-transparent text-sadu-muted hover:text-sadu-charcoal'
  }`;

  return (
    <div className="fixed inset-0 z-50 bg-sadu-charcoal/50 backdrop-blur-xs flex justify-end">
      <div className="bg-sadu-linen border-s border-sadu-gold w-full max-w-2xl h-full shadow-2xl overflow-y-auto p-6 sm:p-8 flex flex-col justify-between text-sadu-charcoal">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-sadu-gold">
            <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              <span>{isAr ? 'لوحة الشرح المعماري والمواءمة الحكومية' : 'Presenter Architecture & Strategic Alignment'}</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-md text-sadu-muted hover:bg-sadu-sand/70 hover:text-sadu-charcoal transition-colors cursor-pointer" aria-label={isAr ? 'إغلاق' : 'Close'}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <AuthoredBand className="my-2" compact />

          <div className="flex border-b border-sadu-gold/60 gap-2 overflow-x-auto scrollbar-none">
            <button type="button" onClick={() => setActiveTab('architecture')} className={tabClass('architecture')}>
              <Layers className="w-3.5 h-3.5" />
              <span>{isAr ? 'المبادئ المعمارية' : 'Architectural Intent'}</span>
            </button>
            <button type="button" onClick={() => setActiveTab('benchmarks')} className={tabClass('benchmarks')}>
              <Building2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'المقارنات الحكومية' : 'National Benchmarks'}</span>
            </button>
            <button type="button" onClick={() => setActiveTab('ux')} className={tabClass('ux')}>
              <Award className="w-3.5 h-3.5" />
              <span>{isAr ? 'الابتكار الحكومي وتجربة المستخدم' : 'GovTech & UX Innovation'}</span>
            </button>
          </div>

          {activeTab === 'architecture' && (
            <div>
              <h3 className="text-xl font-editorial font-bold text-sadu-charcoal mb-2">{isAr ? 'مرجع التصميم المعماري والأصل المؤسسي' : 'SADU Architectural Intent & Institutional Model'}</h3>
              <p className="text-xs text-sadu-muted leading-relaxed mb-6">{isAr ? 'عرض سدو تجريبي لبحث مسارات عمل مقترحة. ليس نظاماً مؤسسياً معتمداً؛ يلزم التحقق من المتطلبات والصلاحيات من مصادرها الأصلية.' : 'SADU demonstrates proposed workflows for review. This is not an approved institutional system; requirements and authority require verification against original sources.'}</p>
              <div className="space-y-4 text-xs">
                {[
                  [CheckCircle2, 'text-sadu-brick', 'Communication vs Decision Authority', 'الفصل الحاسم بين التواصل والسلطة', 'Messages represent Communication Evidence. No conversation can silently approve expenditure, execute a legal contract, or alter Approved Scope without attributable institutional sign-off.', 'أي مراسلة داخل المنصة تُمثّل دليلاً تواصلياً فقط. لا يمكن لمحادثة أن تعتمد إنفاقاً أو تنفذ عقداً أو تغير النطاق المعتمد دون اعتماد مؤسسي قابل للإسناد.'],
                  [ShieldCheck, 'text-sadu-ink', 'Least Privilege & Privacy Protection', 'مبدأ الصلاحيات الدقيقة والخصوصية', 'Sample views illustrate separation of information. No verified authorization, private document vault or connected travel service is demonstrated.', 'توضح المعاينات التجريبية فصل المعلومات. لا يُعرض تفويض موثق أو خزنة مستندات خاصة أو خدمة سفر متصلة.'],
                  [FileText, 'text-sadu-brick', 'Sample scope and contract chain', 'سلسلة نطاق وعقد تجريبية', 'Version labels illustrate a proposed scope snapshot. Legacy workspaces are isolated samples; durable versioning is not established.', 'توضح تسميات الإصدارات لقطة نطاق مقترحة. المساحات القديمة أمثلة مستقلة؛ ولم يُثبت حفظ الإصدارات بصورة دائمة.'],
                  [Info, 'text-sadu-ink', 'Evidence completeness and data notice', 'اكتمال الأدلة وإشعار البيانات', 'Programme states, figures and actions are illustrative. A real name does not establish participation or endorsement.', 'حالات البرامج والأرقام والإجراءات أمثلة تجريبية. ظهور اسم حقيقي لا يثبت المشاركة أو التأييد.'],
                ].map(([Icon, tone, en, ar, bodyEn, bodyAr], index) => {
                  const PrincipleIcon = Icon as React.ElementType;
                  return <div key={en as string} className="p-3.5 bg-sadu-sand rounded-md border border-sadu-gold"><div className={`flex items-center gap-1.5 font-bold ${tone as string} mb-1`}><PrincipleIcon className="w-3.5 h-3.5" /><span>{isAr ? `${formatNumber(index + 1)}. ${ar as string}` : `${index + 1}. ${en as string}`}</span></div><p className="text-sadu-charcoal leading-relaxed">{isAr ? bodyAr as string : bodyEn as string}</p></div>;
                })}
              </div>
            </div>
          )}

          {activeTab === 'benchmarks' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-xl font-editorial font-bold text-sadu-charcoal">{isAr ? 'المقارنات الحكومية والجاهزية' : 'Government Benchmarks & Readiness'}</h3>
              <p className="leading-relaxed text-sadu-muted">{isAr ? 'مؤشرات عرض مقترحة لشرح كيف يمكن مواءمة سدو مع متطلبات الجهات الحكومية المحلية.' : 'Proposed presentation indicators showing how SADU can align with local government requirements.'}</p>
              {[
                ['Data sovereignty', 'السيادة على البيانات', 'Local hosting and retention controls can be applied to the approved sovereign environment.', 'يمكن تطبيق ضوابط الاستضافة المحلية والاحتفاظ داخل البيئة السيادية المعتمدة.'],
                ['Evidence-led decisions', 'قرارات قائمة على الأدلة', 'Each review can remain linked to its source record, responsible role and decision route.', 'يمكن ربط كل مراجعة بمصدرها والدور المسؤول ومسار القرار.'],
                ['Accessible bilingual service', 'خدمة ثنائية اللغة ميسرة', 'Arabic-first labels, RTL support and clear English equivalents reduce interpretation friction.', 'تقلل التسميات العربية ودعم الاتجاه من اليمين إلى اليسار والمقابلات الإنجليزية الواضحة من صعوبة التفسير.'],
              ].map(([en, ar, bodyEn, bodyAr]) => <div key={en} className="p-4 bg-sadu-sand rounded-md border border-sadu-gold"><div className="flex items-center gap-2 font-bold text-sadu-ink"><Building2 className="w-4 h-4" /><span>{isAr ? ar : en}</span></div><p className="mt-2 leading-relaxed">{isAr ? bodyAr : bodyEn}</p></div>)}
            </div>
          )}

          {activeTab === 'ux' && (
            <div className="space-y-5 text-xs">
              <div>
                <div className="flex items-center gap-2 text-sadu-brick"><Award className="w-5 h-5" /><span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em]">GOVTECH_UX_INNOVATION</span></div>
                <h3 className="mt-2 text-xl font-editorial font-bold text-sadu-charcoal">{isAr ? 'الابتكار الحكومي وتجربة المستخدم' : 'GovTech & UX Innovation'}</h3>
                <p className="mt-2 leading-relaxed text-sadu-muted">{isAr ? 'توضح هذه الطبقة كيف تقلل بنية البيانات الموحدة الاحتكاك الإداري دون تجاوز الصلاحيات أو المتطلبات الحكومية.' : 'This layer shows how unified data architecture reduces bureaucratic friction without bypassing authority or government requirements.'}</p>
              </div>
              <div className="space-y-3">
                {[
                  ['Identity Separation', 'فصل الهوية', 'Roles, programme records and personal details remain distinct, so a screen can show the right context without exposing unnecessary information.', 'تبقى الأدوار وسجلات البرامج والبيانات الشخصية منفصلة، فتظهر المعلومات اللازمة دون كشف غير الضروري.'],
                  ['Chain of Representation', 'سلسلة التمثيل', 'Every handover can identify the responsible role, source record and next action instead of relying on informal forwarding.', 'يمكن لكل تسليم تحديد الدور المسؤول ومصدر السجل والإجراء التالي بدلاً من الاعتماد على الإحالات غير الرسمية.'],
                  ['Archival File Constraints', 'ضوابط الملف الأرشيفي', 'Record boundaries, source notes and retention expectations make historical material easier to review and govern.', 'تجعل حدود السجل وملاحظات المصدر ومتطلبات الاحتفاظ مراجعة المواد التاريخية وحوكمتها أكثر وضوحاً.'],
                  ['Zero-Email Handovers', 'تسليمات بلا بريد إلكتروني', 'Structured records keep status, evidence and responsibility together, reducing duplicate requests and lost context across email chains.', 'تحافظ السجلات المنظمة على الحالة والأدلة والمسؤولية معاً، فتقل الطلبات المكررة وضياع السياق بين سلاسل البريد.'],
                ].map(([en, ar, bodyEn, bodyAr], index) => <div key={en} className="p-4 bg-sadu-sand rounded-md border border-sadu-brick/40"><div className="flex items-center gap-2 font-bold text-sadu-brick"><CheckCircle2 className="w-4 h-4" /><span>{isAr ? `${formatNumber(index + 1)}. ${ar}` : `${index + 1}. ${en}`}</span></div><p className="mt-2 leading-relaxed">{isAr ? bodyAr : bodyEn}</p></div>)}
              </div>
              <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{isAr ? 'هذه مبادئ تصميم للعرض والمراجعة، وليست اعتماداً لتفويض أو إجراء حكومي.' : 'These are design principles for presentation and review, not approval of a government delegation or procedure.'}</span></div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-4 border-t border-sadu-gold flex items-center justify-between">
          <span className="text-[11px] text-sadu-muted">{isAr ? `دائرة الثقافة — الشارقة ${formatNumber(2026)}` : 'Sharjah Department of Culture 2026'}</span>
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-white bg-sadu-ink hover:bg-sadu-ink-dark rounded-md transition-colors cursor-pointer">{isAr ? 'فهمت، العودة للمنصة' : 'Close Panel'}</button>
        </div>
      </div>
    </div>
  );
};
