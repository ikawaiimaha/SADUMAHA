import React, { useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { PROGRAMMES, INSTITUTIONAL_INFO } from '../../data/mockData';
import { 
  Building2, 
  FileSignature, 
  ShieldCheck, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  ArrowUpRight, 
  Lock, 
  Scale, 
  Sparkles,
  Send,
  UserCheck
} from 'lucide-react';

interface PendingSignOff {
  id: string;
  type: 'direct_invite' | 'lpo_financial' | 'final_contract';
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  artistOrVendorEn: string;
  artistOrVendorAr: string;
  amountAed?: number;
  recommendationEn: string;
  recommendationAr: string;
  committeeScore?: number;
  operationalScore?: number;
  totalScore?: number;
  priorityTier?: 'Tier A' | 'Tier B' | 'Tier C';
  status: 'pending' | 'signed';
  signedBy?: string;
  signedDate?: string;
}

export const DirectorateDashboard: React.FC = () => {
  const { lang, isAr, formatNumber, formatCurrency, formatPercent } = useI18n();
  const { setSelectedProgramme } = useWorkspace();

  const [authorizations, setAuthorizations] = useState<PendingSignOff[]>([
    {
      id: 'AUTH-DIR-01',
      type: 'direct_invite',
      titleEn: 'Direct Curatorial Invitation & Solo Pavilion Award',
      titleAr: 'دعوة تقييمية مباشرة واعتماد جناح تكريم منفرد',
      subtitleEn: 'Sharjah Calligraphy Biennial 11th Edition — Guest of Honor',
      subtitleAr: 'بينالي الشارقة للخط الدورة 11 — فنان شرف (تكريم)',
      artistOrVendorEn: 'Mounir Fatmi (Guest of Honor)',
      artistOrVendorAr: 'منير فاطمي (فنان الشرف)',
      amountAed: 110000,
      recommendationEn: 'Unanimous Curatorial Committee endorsement (94/100 Pts). Commission 3 pivotal kinetic & video installations.',
      recommendationAr: 'توصية جماعية من لجنة الاختيار الفني (94/100 نقطة). تكليف بـ 3 أعمال مفصلية حركية وفيديو.',
      committeeScore: 61,
      operationalScore: 33,
      totalScore: 94,
      priorityTier: 'Tier A',
      status: 'pending',
    },
    {
      id: 'AUTH-LPO-02',
      type: 'lpo_financial',
      titleEn: 'Final LPO Financial Sign-off (Sharjah Finance Law Compliant)',
      titleAr: 'اعتماد أمر الشراء النهائي (LPO) طبقاً لقانون مالية الشارقة',
      subtitleEn: 'Package: Fine Art Climate Crating & Telemetry Freight',
      subtitleAr: 'حزمة: صناديق الشحن المتحفي المكيف والمراقبة الحرارية',
      artistOrVendorEn: 'Hasenkamp Fine Art Logistics (Rank 1 of 3 Bids)',
      artistOrVendorAr: 'هازنكامب للشحن الفني (الفائز من 3 عروض منافسة)',
      amountAed: 28400,
      recommendationEn: 'Lowest compliant bid among 3 registered suppliers. Full ISO and museum-grade telemetry satisfied.',
      recommendationAr: 'العرض الأقل سعراً والمطابق للمواصفات من بين 3 موردين مسجلين. مستوفٍ لكافة الاشتراطات الفنية.',
      status: 'pending',
    },
    {
      id: 'AUTH-CTR-03',
      type: 'final_contract',
      titleEn: 'Executive Contract Execution (30% Advance / 70% Opening)',
      titleAr: 'توقيع العقد المؤسسي المعتمد (30% مقدم / 70% عند الافتتاح)',
      subtitleEn: 'Master Artist Commission Agreement — Ref: SHJ-SCB-2026-CTR-088',
      subtitleAr: 'اتفاقية تكليف فنان رئيسية — مرجع: SHJ-SCB-2026-CTR-088',
      artistOrVendorEn: 'Youssef Nabhan (Participating Artist)',
      artistOrVendorAr: 'يوسف نبهان (فنان مشارك)',
      amountAed: 45000,
      recommendationEn: 'Composite 100-Point Evaluation: 96/100 (Tier A). Technical load dampers approved by SAM Museum Eng.',
      recommendationAr: 'التقييم المركب الشامل: 96/100 (الفئة أ). تم اعتماد عوازل الحمولة من مهندس متحف الشارقة.',
      committeeScore: 63,
      operationalScore: 33,
      totalScore: 96,
      priorityTier: 'Tier A',
      status: 'pending',
    }
  ]);

  const [signatureModalItem, setSignatureModalItem] = useState<PendingSignOff | null>(null);
  const [signatureName, setSignatureName] = useState('Mohammed Ibrahim Al Qaseer');
  const [signatureNotes, setSignatureNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Macro Budget Calculation
  const totalPlanned = 2400000;
  const totalCommitted = 1820000;
  const remainingBudget = totalPlanned - totalCommitted;

  const handleExecuteSign = (item: PendingSignOff) => {
    setAuthorizations(prev => prev.map(a => {
      if (a.id === item.id) {
        return {
          ...a,
          status: 'signed',
          signedBy: signatureName,
          signedDate: new Date().toISOString().split('T')[0]
        };
      }
      return a;
    }));
    setSignatureModalItem(null);
    setToastMessage(isAr ? `تم التوقيع والاعتماد الرقمي بنجاح: ${item.id}` : `Digital signature legally applied to ${item.id}`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 end-6 rtl:end-auto rtl:start-6 z-50 bg-sadu-brick text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-amber-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Directorate Executive Header */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>{isAr ? 'بوابة القيادة التنفيذية والاعتمادات العليا' : 'Executive Directorate & Decision Gate'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'منظور سعادة مدير إدارة الشؤون الثقافية' : 'Executive Directorate Desk'}
            </h1>
            <p className="text-xs sm:text-sm text-sadu-muted mt-1">
              {isAr
                ? 'لوحة مدمجة عالية الأثر: اعتمادات فورية، توقيع رقمي نهائي، ورادار الميزانية الكلية دون الخوض في التفاصيل الفنية والرسائل الروتينية.'
                : 'Minimalist, high-stakes interface: Pending digital authorizations, LPO financial sign-offs, and macro budget commitments.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>{isAr ? 'مبدأ الحد الأدنى للبيانات (Anti-Noise)' : 'Data Minimization Enforced'}</span>
            </span>
          </div>
        </div>

        {/* Macro Budget Overview Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-sadu-gold/50">
          <div className="p-4 bg-white/80 rounded-md border border-sadu-gold">
            <div className="flex items-center justify-between text-xs text-sadu-muted mb-1">
              <span>{isAr ? 'ميزانية البينالي الكلية المعتمدة' : 'Total Approved Biennial Budget'}</span>
              <DollarSign className="w-4 h-4 text-sadu-brick" />
            </div>
            <div className="text-2xl font-bold font-mono text-sadu-charcoal">
              {isAr ? `${formatNumber(2400000)} درهم` : 'AED 2,400,000'}
            </div>
            <span className="text-[11px] text-sadu-muted">
              {isAr ? 'معتمدة من دائرة المالية المركزية' : 'Sanctioned by Central Finance Dept'}
            </span>
          </div>

          <div className="p-4 bg-white/80 rounded-md border border-sadu-gold">
            <div className="flex items-center justify-between text-xs text-sadu-muted mb-1">
              <span>{isAr ? 'الالتزامات المصروفة والمحجوزة (LPO)' : 'Committed Funds (Contracts & LPOs)'}</span>
              <ShieldCheck className="w-4 h-4 text-sadu-sage" />
            </div>
            <div className="text-2xl font-bold font-mono text-sadu-brick">
              {isAr ? `${formatNumber(1820000)} درهم` : 'AED 1,820,000'}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-full bg-sadu-sand rounded-full h-1.5 overflow-hidden">
                <div className="bg-sadu-brick h-full" style={{ width: '75.8%' }} />
              </div>
              <span className="text-[10px] font-mono text-sadu-muted">76%</span>
            </div>
          </div>

          <div className="p-4 bg-sadu-sage-light/50 rounded-md border border-sadu-sage">
            <div className="flex items-center justify-between text-xs text-sadu-muted mb-1">
              <span>{isAr ? 'السيولة المتبقية للاعتمادات الطارئة' : 'Remaining Uncommitted Reserves'}</span>
              <CheckCircle2 className="w-4 h-4 text-sadu-sage" />
            </div>
            <div className="text-2xl font-bold font-mono text-sadu-ink">
              {isAr ? `${formatNumber(580000)} درهم` : 'AED 580,000'}
            </div>
            <span className="text-[11px] text-sadu-sage font-medium">
              {isAr ? 'جاهزة للتخصيص دون عجز مالي' : 'Healthy liquidity buffer (24%)'}
            </span>
          </div>
        </div>
      </div>

      {/* Pending Authorizations & Digital Signature Queue */}
      <div className="bg-white border border-sadu-gold rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-sadu-brick" />
            <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'سجل التوقيعات والاعتمادات السيادية العاجلة' : 'Pending Executive Authorizations & Digital Sign-Offs'}
            </h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-amber-50 border border-amber-300 text-amber-900 font-bold">
            {isAr ? `${formatNumber(authorizations.filter(a => a.status === 'pending').length)} بانتظار التوقيع` : `${authorizations.filter(a => a.status === 'pending').length} Pending Execution`}
          </span>
        </div>

        <div className="space-y-3">
          {authorizations.map(item => {
            const isSigned = item.status === 'signed';
            return (
              <div 
                key={item.id}
                className={`p-4 rounded-lg border transition-all ${
                  isSigned 
                    ? 'bg-sadu-sage-light/40 border-sadu-sage' 
                    : 'bg-sadu-linen/60 border-sadu-gold hover:border-sadu-brick'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-sadu-ink text-white">
                        {item.id}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sadu-gold/30 text-sadu-charcoal">
                        {item.type === 'direct_invite' && (isAr ? 'دعوة مباشرة / تكريم' : 'Direct Invite')}
                        {item.type === 'lpo_financial' && (isAr ? 'أمر شراء مالي LPO' : 'LPO Sign-Off')}
                        {item.type === 'final_contract' && (isAr ? 'عقد نظامي ملزم' : 'Contract Execution')}
                      </span>
                      {item.priorityTier && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {item.priorityTier} ({item.totalScore}/100 Pts)
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sadu-charcoal text-base">
                      {isAr ? item.titleAr : item.titleEn}
                    </h3>
                    <p className="text-xs text-sadu-muted">
                      {isAr ? item.subtitleAr : item.subtitleEn} · <strong className="text-sadu-charcoal">{isAr ? item.artistOrVendorAr : item.artistOrVendorEn}</strong>
                    </p>

                    {/* Synthesized Institutional Recommendation (Data Minimization) */}
                    <div className="mt-2 p-2.5 rounded bg-white/90 border border-sadu-gold/60 text-xs text-sadu-charcoal">
                      <span className="font-bold text-sadu-brick block mb-0.5">
                        {isAr ? 'خلاصة التوصية المؤسسية المرفوعة:' : 'Synthesized Executive Recommendation:'}
                      </span>
                      {isAr ? item.recommendationAr : item.recommendationEn}
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0">
                    {item.amountAed && (
                      <div className="text-end rtl:text-start">
                        <span className="text-[10px] text-sadu-muted uppercase block">
                          {isAr ? 'القيمة المالية' : 'Financial Impact'}
                        </span>
                        <span className="text-base font-bold font-mono text-sadu-charcoal">
                          {isAr ? `${formatNumber(item.amountAed)} درهم` : `AED ${item.amountAed.toLocaleString()}`}
                        </span>
                      </div>
                    )}

                    {isSigned ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-sadu-ink bg-sadu-sage-light px-3 py-1.5 rounded border border-sadu-sage">
                        <CheckCircle2 className="w-4 h-4 text-sadu-sage" />
                        <span>{isAr ? `معتمد بواسطة: ${item.signedBy}` : `Signed: ${item.signedBy}`}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSignatureModalItem(item)}
                        className="px-4 py-2 bg-sadu-brick hover:bg-sadu-brick-dark text-white rounded-md text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileSignature className="w-4 h-4" />
                        <span>{isAr ? 'اعتماد وتوقيع رقمي' : 'Sign & Authorize'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Digital Signature Confirmation Modal */}
      {signatureModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-sadu-linen border-2 border-sadu-brick rounded-lg max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-sadu-gold/60 pb-3">
              <div>
                <span className="text-[11px] font-mono text-sadu-brick font-bold">
                  {signatureModalItem.id}
                </span>
                <h3 className="text-lg font-bold text-sadu-charcoal font-editorial">
                  {isAr ? 'التوقيع والاعتماد المؤسسي الملزم' : 'Executive Authority Sign-Off'}
                </h3>
              </div>
              <button 
                onClick={() => setSignatureModalItem(null)}
                className="text-sadu-muted hover:text-sadu-charcoal text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-white rounded border border-sadu-gold text-xs space-y-2">
              <div className="font-bold text-sadu-charcoal">
                {isAr ? signatureModalItem.titleAr : signatureModalItem.titleEn}
              </div>
              <p className="text-sadu-muted">
                {isAr ? signatureModalItem.recommendationAr : signatureModalItem.recommendationEn}
              </p>
              {signatureModalItem.amountAed && (
                <div className="text-xs font-mono font-bold text-sadu-brick pt-1 border-t border-sadu-sand">
                  {isAr ? `الالتزام المالي: ${formatNumber(signatureModalItem.amountAed)} درهم` : `Committed Amount: AED ${signatureModalItem.amountAed.toLocaleString()}`}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-sadu-charcoal block">
                {isAr ? 'الاسم والصفة الرسمية للتوقيع:' : 'Authorized Signatory:'}
              </label>
              <input dir="auto" 
                type="text" 
                value={signatureName}
                onChange={e => setSignatureName(e.target.value)}
                className="w-full text-xs p-2.5 rounded border border-sadu-gold bg-white font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-sadu-charcoal block">
                {isAr ? 'توجيهات أو ملاحظات إضافية (اختياري):' : 'Executive Directives (Optional):'}
              </label>
              <textarea dir="auto"
                rows={2}
                value={signatureNotes}
                onChange={e => setSignatureNotes(e.target.value)}
                placeholder={isAr ? 'مثال: يُعتمد الصرف وفق جداول الإنجاز النظامية...' : 'e.g., Authorized strictly per verified milestone delivery...'}
                className="w-full text-xs p-2 rounded border border-sadu-gold bg-white"
              />
            </div>

            <div className="p-3 bg-amber-50 rounded border border-amber-300 text-[11px] text-amber-900 flex items-start gap-2">
              <Lock className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
              <span>
                {isAr 
                  ? 'هذا التوقيع الإلكتروني يُعد ملزماً نظامياً ويصدر بموجبه الرمز المشفر المباشر للجهات المعنية.' 
                  : 'This electronic authorization constitutes formal administrative consent under Sharjah cultural governance laws.'}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-sadu-gold/50">
              <button
                onClick={() => setSignatureModalItem(null)}
                className="px-4 py-2 rounded text-xs font-semibold text-sadu-muted hover:bg-sadu-sand cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => handleExecuteSign(signatureModalItem)}
                className="px-5 py-2 rounded bg-sadu-brick hover:bg-sadu-brick-dark text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-200" />
                <span>{isAr ? 'تأكيد التوقيع والاعتماد' : 'Apply Legal Signature'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
