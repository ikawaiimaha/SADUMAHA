import React, { useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { ARTWORKS } from '../../data/mockData';
import { 
  Wrench, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  FileCheck, 
  Lock, 
  Eye, 
  Layers, 
  Send,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export const TechnicalMuseumDashboard: React.FC = () => {
  const { isAr, formatNumber } = useI18n();

  // Venue Clearance Queue State
  const [clearanceQueue, setClearanceQueue] = useState([
    {
      id: 'CLEAR-YN-01',
      artworkCode: 'SCB-2026-YN-02',
      titleEn: 'Kufic Horizon: Architectural Bronze & Black Oxide',
      titleAr: 'أفق كوفي: برونز معماري وأكسيد أسود مصفح',
      artistEn: 'Youssef Nabhan',
      artistAr: 'يوسف نبهان',
      mediumEn: 'Cast bronze, walnut armature',
      mediumAr: 'برونز مصبوب وهيكل خشب الجوز',
      weightKg: 84,
      targetLocationEn: 'Sharjah Art Museum — Central Atrium Plinth 02',
      targetLocationAr: 'متحف الشارقة للفنون — بهو المتحف الرئيسي، القاعدة 02',
      structuralStatus: 'spec_submitted' as 'pending_spec' | 'spec_submitted' | 'venue_approved' | 'rejected',
      mountingSpecs: 'Four 150mm steel discs with high-density neoprene felt dampers. Distributes 84kg load to 0.12 kg/cm².',
      mountingSpecsAr: 'أربعة أقراص فولاذية بقطر 150 ملم مع بطانات لباد نيوبرين عالي الكثافة لتوزيع الثقل (0.12 كجم/سم²).',
      avRequired: false,
      permitIssued: false,
      permitNumber: '',
    },
    {
      id: 'CLEAR-MF-02',
      artworkCode: 'SCB-2026-MF-01',
      titleEn: 'Ghosting (Single-channel 4K Projection)',
      titleAr: 'الاختفاء المفاجئ (عرض فيديو بدقة 4K)',
      artistEn: 'Mounir Fatmi',
      artistAr: 'منير فاطمي',
      mediumEn: 'Video Installation',
      mediumAr: 'تجهيز فيديو وتجهيز صوتي',
      weightKg: 18,
      targetLocationEn: 'Sharjah Art Museum — Black Box Gallery 4',
      targetLocationAr: 'متحف الشارقة للفنون — الصالة المعتمة (Black Box) قاعة 4',
      structuralStatus: 'venue_approved' as 'pending_spec' | 'spec_submitted' | 'venue_approved' | 'rejected',
      mountingSpecs: 'Ceiling bracket load rating 65kg. 8,000 ANSI lumen laser projector with 0.8:1 short-throw lens.',
      mountingSpecsAr: 'حامل سقفي بحمولة 65 كجم. جهاز عرض ليزري 8000 لومن مع عدسة إسقاط قريبة 0.8:1.',
      avRequired: true,
      permitIssued: true,
      permitNumber: 'SAM-PERMIT-2026-044',
    }
  ]);

  // 35-Point Operational Rubric State
  const [rubricScores, setRubricScores] = useState({
    technicalFeasibility: 14, // Max 15
    logisticsHandling: 10,     // Max 10
    budgetFeasibility: 9,      // Max 10
  });

  // Red Flags checklist (caps score at 15 if any is active)
  const [redFlags, setRedFlags] = useState({
    hazardousChemicals: false,
    oversizedThresholdExceeded: false,
    unsupportedStructuralLoad: false,
  });

  const isRedFlagActive = Object.values(redFlags).some(Boolean);
  const rawSum = rubricScores.technicalFeasibility + rubricScores.logisticsHandling + rubricScores.budgetFeasibility;
  const finalOperationalScore = isRedFlagActive ? Math.min(rawSum, 15) : rawSum;

  // Direct 2-Way Venue Permit Loop State
  const [permitActionToast, setPermitActionToast] = useState<string | null>(null);

  const handleIssuePermit = (id: string) => {
    setClearanceQueue(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          structuralStatus: 'venue_approved',
          permitIssued: true,
          permitNumber: `SAM-PERMIT-2026-${Math.floor(100 + Math.random() * 900)}`
        };
      }
      return item;
    }));
    setPermitActionToast(isAr ? 'تم اعتماد المواصفات الهندسية وإصدار تصريح التركيب المتحفي بنجاح' : 'Mounting specs certified & SAM Venue Permit legally issued.');
    setTimeout(() => setPermitActionToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {permitActionToast && (
        <div className="fixed top-20 right-6 rtl:right-auto rtl:left-6 z-50 bg-sadu-brick text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-amber-200" />
          <span>{permitActionToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-1">
              <Wrench className="w-4 h-4" />
              <span>{isAr ? 'بوابة الجدوى الفنية والتخليص المتحفي (The Hard-Hat Workspace)' : 'Technical & Museum Administration Desk'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'مكتب مهندسي مؤسسة الشارقة للفنون وإدارة متحف الشارقة' : 'SAF Technical & SAM Venue Clearance Desk'}
            </h1>
            <p className="text-xs sm:text-sm text-sadu-muted mt-1">
              {isAr
                ? 'فحص الأحمال الهيكلية، سلامة المعروضات، تقييم الجدوى من 35 نقطة، وحلقة التصاريح التفاعلية المباشرة بين الفنيين وإدارة المتحف.'
                : 'Venue clearance queue, 35-point feasibility rubric with red-flag caps, and 2-way SAF-to-SAM venue permit loop.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-sadu-sand border border-sadu-gold text-sadu-charcoal text-xs font-bold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-sadu-brick" />
              <span>{isAr ? 'تصاريح SAM الحصرية' : 'SAM Venue Loop'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2-Way Venue Permit Loop & Clearance Queue */}
      <div className="bg-white border border-sadu-gold rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-sadu-brick" />
            <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'قائمة التخليص الهندسي وتصاريح المعرض (Venue Clearance Queue)' : 'Venue Clearance & Mounting Approval Queue'}
            </h2>
          </div>
          <span className="text-xs text-sadu-muted">
            {isAr ? 'اعتماد متبادل ومباشر دون وسيط' : 'Direct 2-way approval pipeline'}
          </span>
        </div>

        <div className="space-y-4">
          {clearanceQueue.map(item => (
            <div key={item.id} className="p-4 rounded-lg border border-sadu-gold bg-sadu-linen/50 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-sadu-gold/40 pb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sadu-ink text-white">
                      {item.artworkCode}
                    </span>
                    <span className="text-xs font-bold text-sadu-charcoal">
                      {isAr ? item.titleAr : item.titleEn}
                    </span>
                  </div>
                  <span className="text-xs text-sadu-muted">
                    {isAr ? item.artistAr : item.artistEn} · {isAr ? item.targetLocationAr : item.targetLocationEn}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-1 rounded bg-sadu-sand text-sadu-charcoal font-semibold">
                    {item.weightKg} kg
                  </span>
                  {item.permitIssued ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-sadu-sage-light border border-sadu-sage text-sadu-ink flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sadu-sage" />
                      <span>{item.permitNumber}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-50 border border-amber-300 text-amber-900 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      <span>{isAr ? 'بانتظار تصريح المتحف' : 'Pending SAM Permit'}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Mounting Specs & Venue Loop Detail */}
              <div className="p-3 bg-white rounded border border-sadu-gold/60 text-xs space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="font-bold text-sadu-charcoal block mb-0.5">
                      {isAr ? 'مواصفات التثبيت الهندسية المرفوعة من فنيي SAF:' : 'Submitted SAF Mounting Specifications:'}
                    </span>
                    <p className="text-sadu-muted">
                      {isAr ? item.mountingSpecsAr : item.mountingSpecs}
                    </p>
                  </div>

                  {!item.permitIssued && (
                    <button
                      onClick={() => handleIssuePermit(item.id)}
                      className="px-3.5 py-2 rounded bg-sadu-brick hover:bg-sadu-brick-dark text-white text-xs font-bold shrink-0 shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>{isAr ? 'اعتماد وإصدار تصريح SAM' : 'Sign Off & Issue SAM Permit'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 35-Point Operational Rubric & Red Flags */}
      <div className="bg-white border border-sadu-gold rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sadu-brick" />
            <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'مصفوفة التقييم التشغيلي والميداني (35 نقطة)' : 'Gate 2: 35-Point Operational Feasibility Rubric'}
            </h2>
          </div>
          <div className="text-right rtl:text-left">
            <span className="text-[10px] text-sadu-muted uppercase block">
              {isAr ? 'الدرجة التشغيلية المعتمدة' : 'Effective Feasibility Score'}
            </span>
            <span className={`text-xl font-bold font-mono ${isRedFlagActive ? 'text-rose-700' : 'text-sadu-ink'}`}>
              {finalOperationalScore} / 35 Pts
            </span>
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 rounded bg-sadu-linen/50 border border-sadu-gold space-y-2">
            <div className="flex justify-between text-xs font-bold text-sadu-charcoal">
              <span>{isAr ? 'الجدوى الهندسية والتثبيت' : 'Technical Feasibility'}</span>
              <span className="font-mono text-sadu-brick">{rubricScores.technicalFeasibility} / 15</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="15" 
              value={rubricScores.technicalFeasibility} 
              onChange={e => setRubricScores(prev => ({ ...prev, technicalFeasibility: Number(e.target.value) }))}
              className="w-full accent-sadu-brick cursor-pointer"
            />
            <span className="text-[10px] text-sadu-muted block">
              {isAr ? 'أوزان الجدران، سلامة التوصيلات، ومطابقة لوائح المتحف' : 'Structural loads, lux caps, floor stress dampening'}
            </span>
          </div>

          <div className="p-3.5 rounded bg-sadu-linen/50 border border-sadu-gold space-y-2">
            <div className="flex justify-between text-xs font-bold text-sadu-charcoal">
              <span>{isAr ? 'جدوى النقل وصناديق الشحن' : 'Logistics & Crating'}</span>
              <span className="font-mono text-sadu-brick">{rubricScores.logisticsHandling} / 10</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="10" 
              value={rubricScores.logisticsHandling} 
              onChange={e => setRubricScores(prev => ({ ...prev, logisticsHandling: Number(e.target.value) }))}
              className="w-full accent-sadu-brick cursor-pointer"
            />
            <span className="text-[10px] text-sadu-muted block">
              {isAr ? 'مطابقة معايير ISPM-15 والتخليص الجمركي المباشر' : 'ISPM-15 crate telemetry, climate logs, customs ready'}
            </span>
          </div>

          <div className="p-3.5 rounded bg-sadu-linen/50 border border-sadu-gold space-y-2">
            <div className="flex justify-between text-xs font-bold text-sadu-charcoal">
              <span>{isAr ? 'معقولية الميزانية والتكاليف' : 'Budget Feasibility'}</span>
              <span className="font-mono text-sadu-brick">{rubricScores.budgetFeasibility} / 10</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="10" 
              value={rubricScores.budgetFeasibility} 
              onChange={e => setRubricScores(prev => ({ ...prev, budgetFeasibility: Number(e.target.value) }))}
              className="w-full accent-sadu-brick cursor-pointer"
            />
            <span className="text-[10px] text-sadu-muted block">
              {isAr ? 'كفاءة عروض الأسعار ومطابقة الحد المالي المخصص' : 'Allocated budget envelope alignment and material pricing'}
            </span>
          </div>
        </div>

        {/* Red Flags Hard Cap Enforcement */}
        <div className="p-4 rounded bg-rose-50/70 border border-rose-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-700" />
            <span>{isAr ? 'قائمة المحاذير التشغيلية الحمراء (تحدد السقف الأقصى بـ 15 نقطة فوراً)' : 'Operational Red Flags (Caps Score at 15 Max)'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <label className="flex items-center gap-2 p-2 rounded bg-white border border-rose-200 cursor-pointer">
              <input 
                type="checkbox" 
                checked={redFlags.hazardousChemicals} 
                onChange={e => setRedFlags(prev => ({ ...prev, hazardousChemicals: e.target.checked }))}
                className="accent-rose-700"
              />
              <span className="text-sadu-charcoal">{isAr ? 'مواد كيميائية غير مرخصة' : 'Hazardous materials / chemicals'}</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded bg-white border border-rose-200 cursor-pointer">
              <input 
                type="checkbox" 
                checked={redFlags.oversizedThresholdExceeded} 
                onChange={e => setRedFlags(prev => ({ ...prev, oversizedThresholdExceeded: e.target.checked }))}
                className="accent-rose-700"
              />
              <span className="text-sadu-charcoal">{isAr ? 'تجاوز مقاسات الأبواب والمصاعد' : 'Oversized (Exceeds SAM entry limits)'}</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded bg-white border border-rose-200 cursor-pointer">
              <input 
                type="checkbox" 
                checked={redFlags.unsupportedStructuralLoad} 
                onChange={e => setRedFlags(prev => ({ ...prev, unsupportedStructuralLoad: e.target.checked }))}
                className="accent-rose-700"
              />
              <span className="text-sadu-charcoal">{isAr ? 'أحمال ثقيلة تتجاوز 120 كجم/م²' : 'Excess structural load (>120kg/m²)'}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
