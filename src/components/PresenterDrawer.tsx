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
              <span>{isAr ? 'لوحة الشرح المعماري للمقدم والمقيمين' : 'Presenter & Architectural Evaluation Notes'}</span>
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
              ? `هذه المنصة التفاعلية تجسد "الرؤية النهائية المستهدفة" لنظام سدو وفقاً لتقرير التدقيق المعماري الصادر في ${localizeDigits('12 سبتمبر 2026')}، وتراعي المعايير الدقيقة التي وضعتها دائرة الثقافة بالشارقة.`
              : 'This interactive platform implements the "Ultimate Vision" target state for SADU according to the Architecture & Mockup Audit (12 September 2026), calibrated strictly for Sharjah Department of Culture.'}
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
                  ? 'تم حل ملاحظات التدقيق: الفنان لا يرى تقييمات المحكمين الخاصة، واللجنة لا تطّلع على جوازات السفر أو الحسابات البنكية، ويحصل فريق العلاقات العامة على تصاريح السفر دون تسريب وثائق الجواز الأصلية.'
                  : 'Audit findings M01/M02 corrected: Artist never sees private jury comments; Committee never sees passports or banking; PR/Visa receives secure travel clearance tokens without exposing raw passport scans.'}
              </p>
            </div>

            {/* Principle 3 */}
            <div className="p-3.5 bg-sadu-sand rounded-md border border-sadu-gold">
              <div className="flex items-center gap-1.5 font-bold text-sadu-brick mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>{isAr ? `${formatNumber(3)}. النطاق المعتمد والعقد غير القابل للتعديل` : '3. Immutable Approved Scope & Contract Chain'}</span>
              </div>
              <p className="text-sadu-charcoal leading-relaxed">
                {isAr
                  ? 'النطاق المعتمد يُثبّت بنسخ مرقمة (v1.2) ويُعد المرجع الوحيد لملحقات العقود، وبيانات الشحن، ومحاضر الاستلام، مما يحفظ حق الدائرة في استبعاد أي عمل غير مطابق.'
                  : 'Approved Scope is frozen into immutable revisions (v1.2). All downstream contracts, freight manifests, and installation labels reference this versioned snapshot, protecting the Directorate’s contractual exclusion clause.'}
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
                  ? 'كافة أسماء البرامج (خطوط من حبر، الملح والنخيل، طبقات الذاكرة) والفنانين هي بيانات نموذجية متصلة ومبنية لعرض المنهجية الكاملة دون استخدام بيانات حقيقية غير معتمدة.'
                  : 'All programmes ("Lines of Ink", "Salt and Palm", "Layers of Memory") and artists are synthetic, highly realistic test datasets demonstrating the entire lifecycle with complete auditability.'}
              </p>
            </div>

            {/* Persona Evaluation Highlight */}
            <div className="p-3.5 bg-sadu-sand rounded-md border-2 border-sadu-brick">
              <div className="flex items-center gap-1.5 font-bold text-sadu-brick mb-1">
                <Compass className="w-3.5 h-3.5" />
                <span>{isAr ? `${formatNumber(5)}. منظار القيادة الثلاثي (الراعي، الرئيس، المدير)` : '5. Three Leadership Personas & Master Audit'}</span>
              </div>
              <p className="text-sadu-charcoal leading-relaxed">
                {isAr
                  ? `تمت مراجعة النظام من ${formatNumber(3)} زوايا: سمو الحاكم (كرامة الفنان واللغة العربية والإرث المستدام)، رئيس الدائرة (سلسلة الصلاحيات ومصفوفة التفويض وحظر الالتفاف)، ومدير الشؤون الثقافية (محاكي سلاسل الأثر لمعوقات الأرضية والافتتاح).`
                  : 'Audited across 3 specific leadership tiers: The Visionary Sponsor (artist dignity, Arabic primacy, enduring heritage), The Governance Chairman (statutory authority, bypass prevention), and the Portfolio Director (ripple effect simulation for the 120kg sculpture plinth).'}
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
