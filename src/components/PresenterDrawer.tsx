import React from 'react';
import { Language } from '../types';
import { AuthoredBand } from './AuthoredBand';
import { useI18n } from '../context/I18nContext';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, FileText, Info, Compass } from 'lucide-react';

interface PresenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const PresenterDrawer: React.FC<PresenterDrawerProps> = ({ isOpen, onClose, lang }) => {
  const i18n = useI18n();
  const activeLang = lang ?? i18n.lang;
  const isAr = activeLang === 'ar';
  const { formatNumber, localizeDigits } = i18n;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-sadu-charcoal/50 backdrop-blur-xs flex justify-end">
      <div className="bg-sadu-linen border-s border-sadu-gold w-full max-w-xl h-full shadow-2xl overflow-y-auto p-6 sm:p-8 flex flex-col justify-between text-sadu-charcoal">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-sadu-gold">
            <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              <span>{isAr ? 'ملاحظات العرض والتقييم' : 'Presentation and evaluation notes'}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-sadu-muted hover:bg-sadu-sand/70 hover:text-sadu-charcoal transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <AuthoredBand compact className="my-4" />

          <h3 className="text-xl font-editorial font-bold text-sadu-charcoal mb-2">
            {isAr ? 'مرجع التصميم المعماري والأصل المؤسسي' : 'SADU Architectural Intent & Institutional Model'}
          </h3>
          <p className="text-xs text-sadu-muted leading-relaxed mb-6">
            {isAr
              ? 'عرض سدو تجريبي لبحث مسارات عمل مقترحة. ليس نظاماً مؤسسياً معتمداً؛ يلزم التحقق من المتطلبات والصلاحيات من مصادرها الأصلية.'
              : 'SADU demonstrates proposed workflows for review. This is not an approved institutional system; requirements and authority require verification against original sources.'}
          </p>

          <div className="space-y-4 text-xs">
            {/* Principle 1 */}
            <div className="p-3.5 bg-sadu-sand rounded-md border border-sadu-gold">
              <div className="flex items-center gap-1.5 font-bold text-sadu-brick mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAr ? `${formatNumber(1)}. الفصل الحاسم بين التواصل والسلطة` : '1. Communication vs Decision Authority'}</span>
              </div>
              <p className="text-sadu-charcoal leading-relaxed">
                {isAr
                  ? 'أي مراسلة داخل المنصة تُمثّل "دليلاً تواصلياً" فقط. لا يمكن لرسالة أو محادثة أن تعتمد ميزانية أو تُلزم الإدارة بعقد قانوني دون توقيع نظامي وتثبيت في النطاق المعتمد.'
                  : 'Messages represent "Communication Evidence". No conversation can silently approve expenditure, execute a legal contract, or alter Approved Scope without attributable institutional sign-off.'}
              </p>
            </div>

            {/* Principle 2 */}
            <div className="p-3.5 bg-sadu-sand rounded-md border border-sadu-gold">
              <div className="flex items-center gap-1.5 font-bold text-sadu-ink mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isAr ? `${formatNumber(2)}. مبدأ الصلاحيات الدقيقة والخصوصية (M01 / M02)` : '2. Least Privilege & Privacy Protection (M01 / M02)'}</span>
              </div>
              <p className="text-sadu-charcoal leading-relaxed">
                {isAr
                  ? "توضح المعاينات التجريبية فصل المعلومات. لا يُعرض تفويض موثق أو خزنة مستندات خاصة أو خدمة سفر متصلة."
                  : "Sample views illustrate separation of information. No verified authorization, private document vault or connected travel service is demonstrated."}
              </p>
            </div>

            {/* Principle 3 */}
            <div className="p-3.5 bg-sadu-sand rounded-md border border-sadu-gold">
              <div className="flex items-center gap-1.5 font-bold text-sadu-brick mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>{isAr ? `${formatNumber(3)}. سلسلة نطاق وعقد تجريبية` : "3. Sample scope and contract chain"}</span>
              </div>
              <p className="text-sadu-charcoal leading-relaxed">
                {isAr
                  ? "توضح تسميات الإصدارات لقطة نطاق مقترحة. المساحات القديمة أمثلة مستقلة؛ لم يُثبت حفظ الإصدارات أو الاتساق بين السجلات."
                  : "Version labels illustrate a proposed scope snapshot. Legacy workspaces are isolated samples; durable versioning and cross-record consistency are not established."}
              </p>
            </div>

            {/* Principle 4 */}
            <div className="p-3.5 bg-sadu-sand rounded-md border border-sadu-gold">
              <div className="flex items-center gap-1.5 font-bold text-sadu-ink mb-1">
                <Info className="w-3.5 h-3.5" />
                <span>{isAr ? `${formatNumber(4)}. مؤشر اكتمال الأدلة M01 وبيانات التجربة` : '4. M01 Evidence Completeness KPI & Data Notice'}</span>
              </div>
              <p className="text-sadu-charcoal leading-relaxed">
                {isAr
                  ? 'حالات البرامج والأرقام والإجراءات أمثلة تجريبية. ظهور اسم حقيقي لا يثبت المشاركة أو التأييد. السجلات في المساحات القديمة مستقلة ولا تُحفظ بصورة دائمة.'
                  : 'Programme states, figures and actions are illustrative. A real name does not establish participation or endorsement. Legacy workspace records are isolated and not durably stored.'}
              </p>
            </div>

            {/* Persona Evaluation Highlight */}
            <div className="p-3.5 bg-sadu-sand rounded-md border-2 border-sadu-brick">
              <div className="flex items-center gap-1.5 font-bold text-sadu-brick mb-1">
                <Compass className="w-3.5 h-3.5" />
                <span>{isAr ? `${formatNumber(5)}. محاور مراجعة مقترحة` : '5. Proposed review lenses'}</span>
              </div>
              <p className="text-sadu-charcoal leading-relaxed">
                {isAr
                  ? 'ثلاثة محاور من إعداد سدو تشمل السياق الثقافي والمساءلة والإشراف على البرامج. ليست مراجعات أو تأييداً من أي مسؤول.'
                  : "Three SADU-authored review lenses cover cultural context, accountability and portfolio oversight. They are not reviews or endorsements by officials."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-sadu-gold flex items-center justify-between">
          <span className="text-[11px] text-sadu-muted">
            {isAr ? `دائرة الثقافة — الشارقة ${formatNumber(2026)}` : 'Sharjah Department of Culture 2026'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-sadu-ink hover:bg-sadu-ink-dark rounded-md transition-colors cursor-pointer"
          >
            {isAr ? 'فهمت، العودة للمنصة' : 'Close Panel'}
          </button>
        </div>
      </div>
    </div>
  );
};
