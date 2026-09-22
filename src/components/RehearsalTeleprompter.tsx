import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Mic, MousePointerClick, X, EyeOff } from 'lucide-react';

const REHEARSAL_STEPS = [
  {
    id: 1,
    title: 'Phase 1: The Visionary Mandate',
    action: 'Start the app (Story Mode). Stay on Chapter 1.',
    sayEn: 'SADU connects cultural programme delivery with institutional memory. We are building enduring institutions that outlast individuals, ensuring every cultural milestone is cryptographically sealed for future generations.',
    sayAr: 'يربط سدو تنفيذ البرامج الثقافية بالذاكرة المؤسسية. نحن نبني مؤسسات خالدة تبقى بعد الأفراد، لضمان حفظ كل إنجاز ثقافي بأمان للأجيال القادمة.',
  },
  {
    id: 2,
    title: 'Phase 1: The Governance Mandate',
    action: 'Click "Next Chapter" to H.E. Abdullah Al Owais.',
    sayEn: 'To achieve this, SADU enforces strict statutory delegation and absolute financial accountability. It acts as an institutional gatekeeper against bureaucratic friction.',
    sayAr: 'لتحقيق ذلك، يفرض سدو تفويضاً قانونياً صارماً ومساءلة مالية مطلقة. ويعمل كحارس مؤسسي يمنع أي تداخل أو احتكاك إداري.',
  },
  {
    id: 3,
    title: 'Phase 1: The Operational Mandate',
    action: 'Click "Next Chapter" to Mr. Mohammed Ibrahim Al Qaseer.',
    sayEn: 'This connects the curatorial vision with operational reality. The Director oversees outcomes, schedules, and cross-department priorities, while the teams execute the daily work.',
    sayAr: 'هذا يربط الرؤية الفنية بالواقع التشغيلي. يشرف مدير الإدارة على النتائج والجداول والأولويات، بينما تتولى الفرق التنفيذ اليومي.',
  },
  {
    id: 4,
    title: 'Phase 1: One Living Record',
    action: 'Click "Next Chapter" to One Case, One Living Record.',
    sayEn: "Here is how it works in practice. SADU connects Identity, Context, and Responsibility into a single thread. Let's step into the live platform to see a real handover.",
    sayAr: 'إليكم كيف يعمل النظام عملياً. يربط سدو الهوية والسياق والمسؤولية في مسار واحد. دعونا ندخل المنصة الحية لنرى عملية تسليم حقيقية.',
  },
  {
    id: 5,
    title: 'Phase 2: Logistics Handover',
    action: 'Click "Enter Interactive Platform". Use top-right dropdown to switch role to "Logistics". Type "DEMO-MF-04" in Crate Identity. Check the seal box. Click "Record arrival".',
    sayEn: 'We begin at the loading bay. Logistics records the arrival after checking the crate reference and seal. But arrival alone does not authorize the exhibition.',
    sayAr: 'نبدأ من منطقة الاستلام. يسجل فريق اللوجستيات الوصول بعد مطابقة مرجع الصندوق والختم. لكن الوصول وحده لا يمنح تصريحاً بالعرض.',
  },
  {
    id: 6,
    title: 'Phase 2: Technical Evidence',
    action: 'Switch role to "Technical". Leave dropdown on "No discrepancy". Click "Attach sample condition report".',
    sayEn: "Next, the Technical team attaches the condition evidence. No emails are sent. The system automatically routes the verified record for the manager's review.",
    sayAr: 'بعد ذلك، يرفق الفريق الفني أدلة الحالة. لا تُرسل أي رسائل بريد إلكتروني. يقوم النظام تلقائياً بتوجيه السجل الموثق لمراجعة المدير.',
  },
  {
    id: 7,
    title: 'Phase 2: Manager Acknowledgement',
    action: 'Switch role to "Exhibition manager". Click the blue "Review Handover" button. Check the acknowledgement box. Click "Confirm demo handover".',
    sayEn: 'The Exhibition Manager reviews the exact evidence version. Upon confirmation, the handover is cryptographically locked as a read-only institutional record.',
    sayAr: 'يراجع مدير المعرض نسخة الأدلة المحددة. بمجرد التأكيد، يتم قفل عملية التسليم وتشفيرها كسجل مؤسسي للقراءة فقط.',
  },
  {
    id: 8,
    title: 'Phase 3: Directorate Oversight',
    action: 'Switch role to "Directorate" (Al Qaseer). Point to the "Readiness Gates Cleared" KPI card.',
    sayEn: "Because of that single action, the delivery dependency instantly clears on the Director's executive dashboard. Complete operational transparency in real-time.",
    sayAr: 'بفضل هذا الإجراء الواحد، يكتمل متطلب التسليم فوراً على لوحة القيادة التنفيذية للمدير. شفافية تشغيلية كاملة في الوقت الفعلي.',
  },
  {
    id: 9,
    title: 'Phase 3: UX & Architecture',
    action: 'Click the "Sparkles" icon (top right). Click the "GovTech & UX Innovation" tab.',
    sayEn: 'SADU achieves this "Zero Bureaucracy" mandate through pure architectural design: separating legal identity, dynamic routing, and completely eliminating email handovers.',
    sayAr: 'يحقق سدو مبدأ "صفر بيروقراطية" من خلال التصميم المعماري الذكي: فصل الهوية القانونية، التوجيه التلقائي، وإلغاء الاعتماد على البريد الإلكتروني تماماً.',
  },
];

export const RehearsalTeleprompter: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // e.code uses the physical key, bypassing the Mac '®' symbol issue.
      // Ctrl+Space provides a universal fallback.
      if ((e.altKey && e.code === 'KeyR') || (e.ctrlKey && e.code === 'Space')) {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSecretTap = () => {
    setTapCount(previous => {
      const nextCount = previous + 1;
      if (nextCount >= 3) {
        setIsVisible(previousVisible => !previousVisible);
        return 0;
      }
      return nextCount;
    });

    if (tapTimeoutRef.current) window.clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = window.setTimeout(() => setTapCount(0), 1000);
  };

  return (
    <>
      <div
        className="fixed bottom-40 left-0 w-20 h-40 z-[9999] cursor-default"
        onClick={handleSecretTap}
        title="Secret Trigger: Triple-Tap here"
      />

      {isVisible && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl z-[9999] shadow-2xl rounded-t-xl overflow-y-auto max-h-[85vh] border-t-2 border-indigo-500 bg-slate-900 text-white font-sans animate-in slide-in-from-bottom-10">
          <div className="bg-indigo-600 px-4 py-2 sm:py-3 flex items-center justify-between sticky top-0 z-10 cursor-move">
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
              <EyeOff className="w-4 h-4 text-indigo-200 shrink-0" />
              <span className="truncate">SECRET REHEARSAL MODE</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <span className="text-[10px] sm:text-xs font-mono bg-indigo-800 px-2 py-1 rounded">Step {currentStep + 1} / {REHEARSAL_STEPS.length}</span>
              <button onClick={() => setIsVisible(false)} className="hover:text-indigo-200 p-1 cursor-pointer" aria-label="Close rehearsal guide">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-indigo-300 border-b border-slate-700 pb-2">{REHEARSAL_STEPS[currentStep].title}</h2>
            <div className="bg-slate-800 rounded p-3 border-l-4 border-amber-400 flex items-start gap-3">
              <MousePointerClick className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block mb-1">What to do (Action)</span>
                <p className="text-xs sm:text-sm text-slate-200">{REHEARSAL_STEPS[currentStep].action}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded p-3 border-l-4 border-emerald-400 flex items-start gap-3">
                <Mic className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block mb-1">What to say (English)</span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{REHEARSAL_STEPS[currentStep].sayEn}</p>
                </div>
              </div>
              <div className="bg-slate-800 rounded p-3 border-r-4 border-sky-400 flex items-start gap-3 text-right" dir="rtl">
                <Mic className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider block mb-1">ماذا تقول (العربية)</span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-arabic">{REHEARSAL_STEPS[currentStep].sayAr}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 px-4 py-3 flex items-center justify-between sticky bottom-0 z-10 border-t border-slate-800">
            <button disabled={currentStep === 0} onClick={() => setCurrentStep(prev => prev - 1)} className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-xs font-bold flex items-center gap-1 sm:gap-2 cursor-pointer transition-colors">
              <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Previous Step</span><span className="sm:hidden">Prev</span>
            </button>
            <button disabled={currentStep === REHEARSAL_STEPS.length - 1} onClick={() => setCurrentStep(prev => prev + 1)} className="px-3 sm:px-4 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 rounded text-xs font-bold flex items-center gap-1 sm:gap-2 cursor-pointer shadow-md transition-colors">
              <span className="hidden sm:inline">Next Step</span><span className="sm:hidden">Next</span> <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
