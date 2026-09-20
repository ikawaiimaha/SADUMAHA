import React, { useId, useState } from 'react';
import { NativeModal } from './common/NativeModal';
import { Language, RoleKey } from '../types';
import { ROLE_PROFILES } from '../data/mockData';
import { AuthoredBand } from './AuthoredBand';
import { ShieldCheck, ArrowRight, CheckCircle2, X } from 'lucide-react';

interface RoleOnboardingProps {
  role: RoleKey;
  lang: Language;
  onDismiss: () => void;
  onSelectAnotherRole: (role: RoleKey) => void;
}

export const RoleOnboarding: React.FC<RoleOnboardingProps> = ({
  role,
  lang,
  onDismiss,
  onSelectAnotherRole,
}) => {
  const titleId = useId();
  const isAr = lang === 'ar';
  const profile = ROLE_PROFILES[role];
  const [taskCompleted, setTaskCompleted] = useState(false);

  return (
    <NativeModal isOpen onClose={onDismiss} labelledBy={titleId} className="max-w-2xl" returnFocusSelector="[data-role-switcher]">
      <div className="bg-sadu-linen border-2 border-sadu-gold rounded-lg max-w-2xl w-full p-6 sm:p-8 shadow-xl text-sadu-charcoal relative">
        <button
          onClick={onDismiss}
          className="absolute top-4 end-4 p-1 text-sadu-muted hover:text-sadu-charcoal hover:bg-sadu-sand/70 rounded-md transition-colors cursor-pointer"
          data-modal-close
          aria-label={isAr ? 'إغلاق ومتابعة' : 'Close and proceed'}
        >
          <X className="w-5 h-5" />
        </button>

        <AuthoredBand compact className="mb-4" />

        <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>{isAr ? 'دور تجريبي · حدود التنقل' : 'Sample role · navigation boundaries'}</span>
        </div>

        <h2 id={titleId} className="text-2xl font-editorial font-bold text-sadu-charcoal">
          {isAr ? profile?.titleAr : profile?.titleEn}
        </h2>
        <p className="text-xs text-sadu-ink font-semibold mt-0.5">
          {isAr ? profile?.nameAr : profile?.nameEn}
        </p>

        <div className="mt-5 space-y-4 text-sm">
          {/* Scope Card */}
          <div className="p-3.5 bg-sadu-sand rounded-md border border-sadu-gold">
            <span className="font-semibold text-xs text-sadu-brick block uppercase tracking-wider mb-1">
              {isAr ? 'نطاق مقترح · ليس تفويضاً:' : 'Proposed scope · not authorization:'}
            </span>
            <p className="text-sadu-charcoal leading-relaxed">
              {isAr ? profile?.scopeAr : profile?.scopeEn}
            </p>
          </div>

          {/* Responsibilities */}
          <div className="p-3.5 bg-sadu-sand rounded-md border border-sadu-gold">
            <span className="font-semibold text-xs text-sadu-ink block uppercase tracking-wider mb-1">
              {isAr ? 'المسؤولية الإجرائية المباشرة:' : 'Operational Responsibilities:'}
            </span>
            <p className="text-sadu-charcoal leading-relaxed">
              {isAr ? profile?.responsibilitySummaryAr : profile?.responsibilitySummaryEn}
            </p>
          </div>

          {/* Interactive Micro-Task dynamically updated for 11 Roles */}
          <div className="border border-sadu-gold rounded-md p-4 bg-sadu-linen shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-sadu-brick">
                {isAr ? 'مهمة التدريب التفاعلية الأولى:' : 'First Guided Interactive Task:'}
              </span>
              {taskCompleted && (
                <span className="flex items-center gap-1 text-xs font-semibold text-sadu-sage">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تمت بنجاح' : 'Completed'}</span>
                </span>
              )}
            </div>

            <p className="text-xs text-sadu-muted mb-3">
              {(role === 'COORDINATOR' || role === 'SDC_COORDINATOR') && (isAr ? 'التحقق من سجل الانتباه الفني لمعرض "خطوط من حبر" وتوجيه متابعة للفريق الهندسي.' : 'Acknowledge Technical load alert for "Lines of Ink" and route follow-up to engineering.')}
              {(role === 'LEADERSHIP' || role === 'DIRECTORATE') && (isAr ? 'مراجعة تقارير المديرين المؤرخة ومخاطر الجداول وتصعيدات البرامج.' : 'Review dated manager reports, schedule risks and portfolio escalations.')}
              {role === 'COMMITTEE' && (isAr ? 'الاطلاع على ملف مقترح الفنان يوسف نبهان وتقييم المسار الفني.' : 'Inspect Youssef Nabhan’s reading dossier and evaluate the designated cultural track.')}
              {role === 'ARTIST' && (isAr ? 'مراجعة النطاق الفني المعتمد وإرسال مخطط صفائح التثبيت إلى المنسق.' : 'Inspect approved scope items and acknowledge mounting bracket submission.')}
              {(role === 'TECHNICAL' || role === 'SAF_TECHNICIAN') && (isAr ? 'مراجعة مخطط تجريبي؛ لا إرسال إلى جهة خارجية ولا اعتماد هندسياً.' : 'Review a sample blueprint; no external transmission or engineering approval.')}
              {(role === 'VENUE_ADMIN' || role === 'SMA_VENUE_ADMIN' || role === 'TECHNICAL_MUSEUM') && (isAr ? 'تسجيل مراجعة موقع تجريبية محلياً؛ لا إصدار لتصريح أو اعتماد هندسي.' : 'Record a local sample venue review; no permit or engineering certification is issued.')}
              {role === 'FINANCE' && (isAr ? "راجع سيناريو مشتريات من ثلاثة عروض. لا يُصدر أمر شراء فعلي." : "Review a three-quote procurement scenario. No purchase order is issued.")}
              {(role === 'PR_VISA' || role === 'PR_PROTOCOL') && (isAr ? "استعرض مرجع السفر التجريبي والقائمة المقترحة من سبعة بنود." : "Explore the sample travel reference and proposed seven-point checklist.")}
              {role === 'EDITORIAL' && (isAr ? 'مراجعة نصوص تجريبية باللغتين. تسجّل مساحة العمل مراجعة للجلسة، ولا تصدر اعتماداً للطباعة.' : 'Review bilingual sample text. The workspace records a session check, not printing authorization.')}
              {role === 'LOGISTICS' && (isAr ? 'معاينة مراسلات وعروض نقل تجريبية؛ لا إصدار أو إرسال.' : 'Preview sample shipping correspondence and RFQs; nothing is issued or sent.')}
              {role === 'ARCHIVE' && (isAr ? 'مراجعة بيان إغلاق تجريبي؛ لا فحص سلامة رقمية أو أرشفة دائمة.' : 'Review a sample closure manifest; no integrity check or durable archive.')}
            </p>

            <button
              onClick={() => setTaskCompleted(true)}
              disabled={taskCompleted}
              className={`w-full py-2 px-3 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                taskCompleted
                  ? 'bg-sadu-sage-light text-sadu-ink border-sadu-sage'
                  : 'bg-sadu-brick text-white border-sadu-brick hover:bg-sadu-brick-dark'
              }`}
            >
              {taskCompleted 
                ? (isAr ? '✓ تم تنفيذ المهمة وتثبيت السجل' : '✓ Micro-task recorded into ledger') 
                : (isAr ? 'تنفيذ المهمة التوضيحية وتأكيد الاستلام' : 'Simulate Action & Confirm Responsibility')}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-sadu-gold flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-sadu-muted">
            {isAr ? 'يمكنك تغيير الدور في أي وقت من الشريط العلوي' : 'You can switch roles anytime from the top bar'}
          </div>

          <button
            onClick={onDismiss}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-sadu-ink hover:bg-sadu-ink-dark rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>{isAr ? "دخول مساحة العمل التجريبية" : "Enter sample workspace"}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </NativeModal>
  );
};
