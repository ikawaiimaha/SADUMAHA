import React, { useState } from 'react';
import { Language } from '../types';
import { AuthoredBand } from './AuthoredBand';
import { useI18n } from '../context/I18nContext';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  Compass, 
  Layers, 
  Building2, 
  AlertTriangle 
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
  const [activeTab, setActiveTab] = useState<'architecture' | 'benchmarks'>('architecture');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-sadu-charcoal/50 backdrop-blur-xs flex justify-end" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-sadu-linen border-s border-sadu-gold w-full max-w-2xl h-full shadow-2xl overflow-y-auto p-6 sm:p-8 flex flex-col justify-between text-sadu-charcoal">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-sadu-gold">
            <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              <span>{isAr ? 'لوحة الشرح المعماري والمواءمة الحكومية' : 'Presenter Architecture & Strategic Alignment'}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-sadu-muted hover:bg-sadu-sand/70 hover:text-sadu-charcoal transition-colors cursor-pointer"
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <AuthoredBand compact className="my-2" />

          {/* Tab Switcher */}
          <div className="flex border-b border-sadu-gold/60 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('architecture')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'architecture'
                  ? 'border-sadu-brick text-sadu-brick'
                  : 'border-transparent text-sadu-muted hover:text-sadu-charcoal'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isAr ? 'المبادئ المعمارية' : 'Architectural Intent'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('benchmarks')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'benchmarks'
                  ? 'border-sadu-brick text-sadu-brick'
                  : 'border-transparent text-sadu-muted hover:text-sadu-charcoal'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'المقارنات الحكومية (UAE / الشارقة)' : 'National Gov Benchmarks'}</span>
            </button>
          </div>

          {/* TAB 1: ARCHITECTURAL PRINCIPLES */}
          {activeTab === 'architecture' && (
            <div className="space-y-4 text-xs animate-in fade-in duration-150">
              <div className="p-3.5 bg-sadu-sand rounded-md border border-sadu-gold">
                <div className="flex items-center gap-1.5 font-bold text-sadu-brick mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isAr ? `${formatNumber(1)}. الفصل بين التواصل والقرار` : '1. Communication vs Decision Authority'}</span>
                </div>
                <p className="text-sadu-charcoal leading-relaxed mt-1">
                  {isAr
                    ? 'المراسلات أدلة تواصل فقط. لا يمكن لرسالة أو محادثة اعتماد ميزانية أو إلزام الإدارة بعقد قانوني دون توقيع نظامي وتثبيت في النطاق المعتمد.'
                    : 'Messages represent communication evidence only. Conversations cannot approve expenditure, execute contracts, or alter approved scope without institutional sign-off.'}
                </p>
              </div>

              <div className="p-3.5 bg-sadu-sand rounded-md border border-sadu-gold">
                <div className="flex items-center gap-1.5 font-bold text-sadu-ink mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isAr ? `${formatNumber(2)}. الصلاحيات الدقيقة والخصوصية` : '2. Least Privilege & Privacy Protection'}</span>
                </div>
                <p className="text-sadu-charcoal leading-relaxed mt-1">
                  {isAr
                    ? 'لا توجد صلاحيات مفتوحة. لا يطلع القيم الفني على البيانات المصرفية، ولا تغير الإدارة الهندسية النصوص التقييمية. كل مستخدم يرى فقط ما تقتضيه مهمته.'
                    : 'No overarching access. Curators cannot view banking data; engineers cannot alter curatorial text. Every role sees only what is required for their specific mandate.'}
                </p>
              </div>

              <div className="p-3.5 bg-sadu-sand rounded-md border border-sadu-gold">
                <div className="flex items-center gap-1.5 font-bold text-sadu-ochre mb-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isAr ? `${formatNumber(3)}. الذاكرة المؤسسية الدائمة` : '3. Sovereign Institutional Memory'}</span>
                </div>
                <p className="text-sadu-charcoal leading-relaxed mt-1">
                  {isAr
                    ? 'تحويل الأفعال الفردية والموافقات إلى سجل حي دائم يحمي حقوق الدائرة وتاريخ إمارة الشارقة الثقافي.'
                    : 'Converting individual actions and approvals into a permanent living record that protects the Department’s rights and Sharjah’s cultural history.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: NATIONAL BENCHMARKS & GOV ALIGNMENT */}
          {activeTab === 'benchmarks' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Intro/Thesis */}
              <p className="text-xs text-sadu-charcoal leading-relaxed bg-white p-4 rounded-md border border-sadu-gold shadow-2xs">
                <strong className="text-sadu-brick block mb-1">{isAr ? 'المسار التشغيلي المتخصص' : 'Vertical Enterprise Operations'}</strong>
                {isAr 
                  ? 'سدو ليس بوابة خدمية عامة للمعاملات الأفقية. إنه نظام تشغيل مؤسسي متخصص للدبلوماسية الثقافية، التدقيق التقييمي، والحفظ السيادي، صُمم ليتوافق مع أعلى المعايير الرقمية الوطنية.'
                  : 'SADU is not a horizontal civic transaction portal. It is a specialized vertical enterprise OS for cultural diplomacy, curatorial vetting, and sovereign preservation, engineered to align with national digital standards.'}
              </p>

              {/* Benchmark Table */}
              <div className="border border-sadu-gold rounded-sm overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-xs text-left rtl:text-right">
                  <thead className="bg-sadu-sand text-sadu-charcoal font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5 border-b border-sadu-gold/50">{isAr ? 'المعيار الوطني' : 'Benchmark Criterion'}</th>
                      <th className="p-2.5 border-b border-sadu-gold/50 border-s border-sadu-gold/30">{isAr ? 'المنصات الحكومية' : 'Live Civic Apps'}</th>
                      <th className="p-2.5 border-b border-sadu-gold/50 border-s border-sadu-gold/30">{isAr ? 'مواءمة وتفوق منصة سدو' : 'SADU Parity & Advantage'}</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] divide-y divide-sadu-gold/30 text-sadu-charcoal">
                    <tr className="hover:bg-sadu-linen/50 transition-colors">
                      <td className="p-2.5 font-bold text-sadu-ink">Zero Bureaucracy</td>
                      <td className="p-2.5 border-s border-sadu-gold/30 text-sadu-muted">Work Bundle<br/>(Baqat Al Amal)</td>
                      <td className="p-2.5 border-s border-sadu-gold/30">Streamlines cross-department handovers into a continuous state machine.</td>
                    </tr>
                    <tr className="hover:bg-sadu-linen/50 transition-colors">
                      <td className="p-2.5 font-bold text-sadu-ink">Separation of Powers<br/>& PDPL</td>
                      <td className="p-2.5 border-s border-sadu-gold/30 text-sadu-muted">Dubai Unified License<br/>(DUL)</td>
                      <td className="p-2.5 border-s border-sadu-gold/30">Strict RBAC across curatorial, financial, and logistics desks.</td>
                    </tr>
                    <tr className="hover:bg-sadu-linen/50 transition-colors">
                      <td className="p-2.5 font-bold text-sadu-ink">Sovereign Residency</td>
                      <td className="p-2.5 border-s border-sadu-gold/30 text-sadu-muted">Sharjah Digital Cloud<br/>(SDD)</td>
                      <td className="p-2.5 border-s border-sadu-gold/30">Containerized architecture ready for on-premise Sahab Smart Solutions deployment.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* The Honest Reality Check */}
              <div className="p-4 bg-amber-50 border-s-4 rtl:border-s-0 rtl:border-e-4 border-amber-500 rounded-sm shadow-2xs mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-amber-900 text-xs uppercase tracking-widest">
                    {isAr ? 'الحدود التقنية: النموذج مقابل إطلاق المرحلة الأولى' : 'Reality Check: Mockup vs. Phase 1 Production'}
                  </span>
                </div>
                <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-1.5 leading-relaxed marker:text-amber-400">
                  <li>
                    <strong>{isAr ? 'البيئة التشغيلية: ' : 'Frontend State: '}</strong>
                    {isAr ? 'يعتمد النموذج على الذاكرة المؤقتة للمتصفح؛ يتطلب المرحلة الأولى للربط بقواعد البيانات السيادية.' : 'Currently runs on React state machines; requires Phase 1 backend provisioning for durability.'}
                  </li>
                  <li>
                    <strong>{isAr ? 'الهوية الرقمية: ' : 'UAE PASS & APIs: '}</strong>
                    {isAr ? 'واجهات التوقيع مصممة بدقة، وتنتظر مفاتيح الربط الفعلية من الشبكة الاتحادية (GSB).' : 'Biometric signing UI is mapped, awaiting actual PKI integration via federal GSB.'}
                  </li>
                  <li>
                    <strong>{isAr ? 'الإرث التاريخي: ' : 'Historical Ingestion: '}</strong>
                    {isAr ? 'يعرض بيانات تجريبية لدورة 2026. ترحيل السجلات السابقة يستلزم خطة إدراج متخصصة.' : 'Demonstrates greenfield operations. Deployment requires a batch ingestion pipeline for past Biennial editions.'}
                  </li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-sadu-gold/50 flex flex-col gap-2 shrink-0">
          <div className="text-[10px] text-sadu-muted flex items-center justify-between font-mono">
            <span>SADU_PRESENTER_MODE_ACTIVE</span>
            <span>v1.2.0</span>
          </div>
          <button 
            onClick={onClose}
            className="w-full py-2.5 bg-sadu-ink hover:bg-sadu-ink-dark text-white rounded text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            {isAr ? 'إغلاق ومتابعة العرض' : 'Close and Resume Presentation'}
          </button>
        </div>
      </div>
    </div>
  );
};
