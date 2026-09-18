import React, { useState } from 'react';
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
  const isAr = lang === 'ar';
  const profile = ROLE_PROFILES[role];
  const [taskCompleted, setTaskCompleted] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-sadu-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-sadu-linen border-2 border-sadu-gold rounded-lg max-w-2xl w-full p-6 sm:p-8 shadow-xl text-sadu-charcoal relative">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-1 text-sadu-muted hover:text-sadu-charcoal hover:bg-sadu-sand/70 rounded-md transition-colors cursor-pointer"
          title={isAr ? 'إغلاق ومتابعة' : 'Close and proceed'}
        >
          <X className="w-5 h-5" />
        </button>

        <AuthoredBand compact className="mb-4" />

        <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>{isAr ? 'بطاقة الدور المؤسسي والحوكمة' : 'Institutional Role & Access Governance'}</span>
        </div>

        <h2 className="text-2xl font-editorial font-bold text-sadu-charcoal">
          {isAr ? profile?.titleAr : profile?.titleEn}
        </h2>
        <p className="text-xs text-sadu-ink font-semibold mt-0.5">
          {isAr ? profile?.nameAr : profile?.nameEn}
        </p>

        <div className="mt-5 space-y-4 text-sm">
          {/* Scope Card */}
          <div className="p-3.5 bg-sadu-sand rounded-md border border-sadu-gold">
            <span className="font-semibold text-xs text-sadu-brick block uppercase tracking-wider mb-1">
              {isAr ? 'نطاق الصلاحية والبيانات المسموحة:' : 'Permitted Scope & Boundary:'}
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
              {(role === 'LEADERSHIP' || role === 'DIRECTORATE') && (isAr ? 'مراجعة رادار الاستثناءات ومؤشرات انتشار المهرجانات العالمية.' : 'Review executive exception radar and monitor global festival deployment.')}
              {role === 'COMMITTEE' && (isAr ? 'الاطلاع على ملف مقترح الفنان يوسف نبهان وتقييم المسار الفني.' : 'Inspect Youssef Nabhan’s reading dossier and evaluate the designated cultural track.')}
              {role === 'ARTIST' && (isAr ? 'مراجعة النطاق الفني المعتمد وإرسال مخطط صفائح التثبيت إلى المنسق.' : 'Inspect approved scope items and acknowledge mounting bracket submission.')}
              {(role === 'TECHNICAL' || role === 'SAF_TECHNICIAN') && (isAr ? 'إنشاء المخطط التنفيذي للعمل البرونزي وإرساله لهيئة المتاحف.' : 'Generate execution blueprint for the bronze artwork and route to SMA.')}
              {(role === 'VENUE_ADMIN' || role === 'SMA_VENUE_ADMIN' || role === 'TECHNICAL_MUSEUM') && (isAr ? 'اعتماد المخططات الهندسية وإصدار تصاريح التثبيت بمتحف الشارقة للفنون.' : 'Approve engineering blueprints and issue installation permits for Sharjah Art Museum.')}
              {role === 'FINANCE' && (isAr ? 'إصدار أمر الشراء (LPO) وتوثيق استدراج العروض التنافسية الثلاثة.' : 'Issue LPO and verify completion of the mandatory 3-bid procurement rule.')}
              {(role === 'PR_VISA' || role === 'PR_PROTOCOL') && (isAr ? 'توليد رمز التحقق الأمني لتأشيرة السفر واستيفاء البنود السبعة.' : 'Generate secure travel clearance token and fulfill the 7-point PR checklist.')}
              {role === 'EDITORIAL' && (isAr ? 'اعتماد وتجميد النصوص العربية والإنجليزية الخاصة بكتالوج المعرض.' : 'Proof and lock bilingual texts for the official exhibition catalogue.')}
              {role === 'LOGISTICS' && (isAr ? 'مراسلة الفنانين لتنسيق الشحن وإصدار طلبات عروض الأسعار (RFQ).' : 'Coordinate shipping with artists and issue formal Freight RFQs.')}
              {role === 'ARCHIVE' && (isAr ? 'تدقيق محضر الإغلاق النهائي والتحقق من سلامة البصمة الرقمية للوثائق.' : 'Audit final closure manifest and verify zero unresolved return items.')}
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
            <span>{isAr ? 'دخول المنصة التشغيلية' : 'Enter Live Workspace'}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
