import React, { useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { ProcurementBiddingGate } from './ProcurementBiddingGate';
import { 
  Building2, 
  DollarSign, 
  Lock, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  FileSignature, 
  ShieldCheck, 
  CreditCard,
  Eye,
  EyeOff
} from 'lucide-react';

export const FinanceDashboard: React.FC = () => {
  const { isAr, formatNumber } = useI18n();

  // Milestone tracking state (30% advance, 70% final)
  const [milestones, setMilestones] = useState([
    {
      id: 'MS-01',
      artistEn: 'Youssef Nabhan',
      artistAr: 'يوسف نبهان',
      contractRef: 'SHJ-SCB-2026-CTR-088',
      totalHonorariumAed: 45000,
      advancePaidAed: 13500, // 30%
      advanceStatus: 'paid' as 'paid' | 'pending',
      advanceDate: '2026-08-14',
      finalDueAed: 31500,    // 70%
      finalStatus: 'gated_opening' as 'gated_opening' | 'eligible' | 'released',
      finalGateEn: 'Gated strictly by VIP Opening Ceremony Verification',
      finalGateAr: 'مشروط حصراً بإثبات الافتتاح الرسمي للبينالي',
    },
    {
      id: 'MS-02',
      artistEn: 'Mounir Fatmi (Guest of Honor)',
      artistAr: 'منير فاطمي (فنان الشرف)',
      contractRef: 'SHJ-SCB-2026-CTR-092',
      totalHonorariumAed: 110000,
      advancePaidAed: 33000, // 30%
      advanceStatus: 'paid' as 'paid' | 'pending',
      advanceDate: '2026-08-20',
      finalDueAed: 77000,    // 70%
      finalStatus: 'gated_opening' as 'gated_opening' | 'eligible' | 'released',
      finalGateEn: 'Gated strictly by VIP Opening Ceremony Verification',
      finalGateAr: 'مشروط حصراً بإثبات الافتتاح الرسمي للبينالي',
    }
  ]);

  // Decryption Key Vault for Artist Bank Details
  const [decryptedArtistId, setDecryptedArtistId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-1">
              <DollarSign className="w-4 h-4" />
              <span>{isAr ? 'بوابة الامتثال والرقابة المالية (The Compliance Gate)' : 'Finance Compliance & Procurement Gate'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'مكتب الشؤون المالية والرقابة على المشتريات' : 'Finance & Procurement Executive Desk'}
            </h1>
            <p className="text-xs sm:text-sm text-sadu-muted mt-1">
              {isAr
                ? 'مسار مالي مقترح لمقارنة العروض ومراجعة الدفعات وملف دفع تجريبي. يتطلب اعتماد القواعد المؤسسية.'
                : 'Proposed finance workflow: quotation comparison, milestone review, and a sample payment profile. Institutional rules require validation.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-sadu-sage-light border border-sadu-sage text-sadu-ink text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-sadu-sage" />
              <span>{isAr ? 'سيناريو تجريبي غير معتمد' : 'Unapproved demo scenario'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Part 1: Statutory Procurement Bidding Gate (3 Bids Mandate) */}
      <div className="bg-white border border-sadu-gold rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-sadu-gold/50 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sadu-brick" />
            <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'بوابة مشتريات تجريبية (سيناريو ثلاثة عروض)' : 'Sample Procurement Gate (Three-Quote Scenario)'}
            </h2>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-rose-100 text-rose-800 font-bold">
            {isAr ? 'قاعدة تجريبية — تتطلب اعتماداً' : 'Demo rule — validation required'}
          </span>
        </div>

        <ProcurementBiddingGate lang={isAr ? 'ar' : 'en'} />
      </div>

      {/* Part 2: Contract Milestones Tracking (30% Advance & 70% Final) */}
      <div className="bg-white border border-sadu-gold rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-sadu-gold/50 pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-sadu-brick" />
            <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'جدول صرف دفعات العقود النظامية (30% مواد / 70% افتتاح المعرض)' : 'Contract Milestones & Honoraria Disbursement'}
            </h2>
          </div>
          <span className="text-xs text-sadu-muted">
            {isAr ? 'ربط آلي مع بوابات التشغيل' : 'Automated gate linkage'}
          </span>
        </div>

        <div className="space-y-3">
          {milestones.map(item => (
            <div key={item.id} className="p-4 rounded-lg border border-sadu-gold bg-sadu-linen/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sadu-ink text-white">
                      {item.contractRef}
                    </span>
                    <span className="text-sm font-bold text-sadu-charcoal">
                      {isAr ? item.artistAr : item.artistEn}
                    </span>
                  </div>
                  <span className="text-xs text-sadu-muted">
                    {isAr ? `إجمالي المكافأة: ${formatNumber(item.totalHonorariumAed)} درهم` : `Total Commission: AED ${item.totalHonorariumAed.toLocaleString()}`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {/* 30% Advance */}
                <div className="p-3 bg-white rounded border border-sadu-gold/60 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-sadu-charcoal">
                      {isAr ? 'الدفعة الأولى 30% (شراء المواد والتجهيز):' : 'Milestone 1: 30% Advance (Materials):'}
                    </span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isAr ? 'صُرفت' : 'Disbursed'}
                    </span>
                  </div>
                  <div className="text-sm font-mono font-bold text-sadu-charcoal">
                    {isAr ? `${formatNumber(item.advancePaidAed)} درهم` : `AED ${item.advancePaidAed.toLocaleString()}`}
                  </div>
                  <span className="text-[10px] text-sadu-muted block">
                    {isAr ? `تاريخ الصرف: ${item.advanceDate}` : `Paid on ${item.advanceDate}`}
                  </span>
                </div>

                {/* 70% Final */}
                <div className="p-3 bg-amber-50/60 rounded border border-amber-200 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-900">
                      {isAr ? 'الدفعة النهائية 70% (افتتاح المعرض):' : 'Milestone 2: 70% Final (Opening):'}
                    </span>
                    <span className="text-amber-800 font-bold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      {isAr ? 'معلقة بالافتتاح' : 'Gated'}
                    </span>
                  </div>
                  <div className="text-sm font-mono font-bold text-amber-950">
                    {isAr ? `${formatNumber(item.finalDueAed)} درهم` : `AED ${item.finalDueAed.toLocaleString()}`}
                  </div>
                  <span className="text-[10px] text-amber-800 block">
                    {isAr ? item.finalGateAr : item.finalGateEn}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Part 3: Secure Banking Vault (Role Isolated Decryption) */}
      <div className="bg-white border border-sadu-gold rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-sadu-gold/50 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-sadu-brick" />
            <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'ملف دفع تجريبي' : 'Sample payment profile'}
            </h2>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
            DEMO — NO ACCESS SECURITY
          </span>
        </div>

        <p className="text-xs text-sadu-muted">
          {isAr
            ? 'عرض تجريبي للإظهار والإخفاء فقط. لا يوجد تشفير أو تحقق فعلي من صلاحيات المالية؛ لا تُدخل بيانات مصرفية حقيقية.'
            : 'Visibility demonstration only. No encryption or authenticated Finance access is implemented; never enter real banking details.'}
        </p>

        <div className="p-4 rounded-lg bg-sadu-linen/50 border border-sadu-gold space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-sadu-charcoal block">
                {isAr ? 'الحساب المصرفي المعتمد للفنان: يوسف نبهان' : 'Beneficiary Account: Youssef Nabhan'}
              </span>
              <span className="text-[11px] text-sadu-muted font-mono">
                BANK: Sharjah Islamic Bank (SIB)
              </span>
            </div>

            <button
              onClick={() => setDecryptedArtistId(decryptedArtistId ? null : 'yn')}
              className="px-3 py-1.5 rounded bg-sadu-sand hover:bg-sadu-sand-dark border border-sadu-gold text-xs font-bold text-sadu-charcoal flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {decryptedArtistId ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{decryptedArtistId ? (isAr ? 'إخفاء الحساب' : 'Conceal IBAN') : (isAr ? 'إظهار المثال' : 'Show sample')}</span>
            </button>
          </div>

          <div className="p-3 bg-white rounded border border-sadu-gold font-mono text-xs">
            {decryptedArtistId ? (
              <div className="space-y-1 animate-in fade-in">
                <div className="text-sadu-brick font-bold">IBAN: SAMPLE-NOT-A-BANK-ACCOUNT</div>
                <div className="text-sadu-muted text-[11px]">SWIFT / BIC: SIBKAEADXXX · BENEFICIARY: YOUSSEF NABHAN</div>
                <div className="text-emerald-700 text-[10px] font-sans font-semibold pt-1">
                  {isAr ? 'مثال فقط؛ لم يُتحقق من حساب مصرفي.' : 'Sample only; no bank account has been verified.'}
                </div>
              </div>
            ) : (
              <div className="text-sadu-muted">
                SAMPLE HIDDEN — NO ENCRYPTION
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
