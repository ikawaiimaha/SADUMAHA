import React, { useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  Plane, 
  Lock, 
  Key, 
  Sparkles, 
  UserCheck, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export const PrProtocolDashboard: React.FC = () => {
  const { isAr, formatNumber } = useI18n();

  // 7-Point Clearance Checklist
  const [checklist, setChecklist] = useState({
    certificateNameVerified: true,
    exhibitionTitleLocked: true,
    bioApproved: true,
    portraitReceived: false,      // Pending!
    nationalityConfirmed: true,
    socialMediaLogged: true,
    guestListSubmitted: false,     // Pending!
  });

  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const isFullyCleared = checkedCount === 7;

  // Sample travel-reference preview state
  const [isTokenGenerated, setIsTokenGenerated] = useState(false);
  const [travelClearanceToken, setTravelClearanceToken] = useState('SHJ-VISA-SEC-99214-TOK');
  const [showPassportVault, setShowPassportVault] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleGenerateToken = () => {
    if (!checklist.nationalityConfirmed || !checklist.certificateNameVerified) {
      setToastMessage(isAr ? 'يرجى التحقق من الاسم الرسمي والجنسية أولاً' : 'Must verify legal name and nationality first.');
      return;
    }
    setIsTokenGenerated(true);
    setToastMessage(isAr ? "أُنشئ مرجع سفر تجريبي. لم يحدث تخليص أو إرسال." : "Sample travel reference created. No clearance or transmission occurred.");
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 end-6 z-50 bg-sadu-brick text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-amber-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-1">
              <Users className="w-4 h-4" />
              <span>{isAr ? 'بوابة المراسم والتشريفات والصورة المؤسسية' : 'Public Image & Protocol Gate'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'مكتب العلاقات العامة والمراسم والتأشيرات' : 'PR & Protocol Operational Desk'}
            </h1>
            <p className="text-xs sm:text-sm text-sadu-muted mt-1">
              {isAr
                ? "تنسيق ضيوف تجريبي وقائمة مقترحة من سبعة بنود ومراجع سفر محاكاة؛ لا توجد خدمة تأشيرات أو تخليص متصلة."
                : "Sample guest handling, a proposed seven-point checklist and simulated travel references; no visa or clearance service is connected."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              isFullyCleared ? 'bg-sadu-sage-light border border-sadu-sage text-sadu-ink' : 'bg-amber-100 border border-amber-300 text-amber-900'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isFullyCleared ? (isAr ? 'جاهزية كاملة (7/7)' : '7/7 Cleared') : (isAr ? `قيد التدقيق (${formatNumber(checkedCount)}/7)` : `${checkedCount}/7 Verified`)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Production Hold Notice when not 7/7 */}
      {!isFullyCleared && (
        <div className="p-4 rounded-lg bg-rose-50 border-s-4 border-rose-700 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-rose-900 text-sm">
              {isAr ? 'حظر التصنيع الوقائي نشط (Production Hold Engaged)' : 'Production Hold & Fabrication Lock Active'}
            </h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              {isAr
                ? 'طبقاً لقواعد الحوكمة المؤسسية للبينالي، يُمنع إصدار أي أمر شراء (LPO) أو بدء التصنيع الخارجي للأعمال حتى تستوفي إدارة المراسم كافة البنود السبعة (الصورة الرسمية وقائمة كبار الشخصيات معلقة).'
                : 'Under Biennale governance policy, no outsourced fabrication LPO can be generated until all 7 institutional checklist requirements are verified.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* The 7-Point Clearance Checklist */}
        <div className="bg-white border border-sadu-gold rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-sadu-brick" />
              <h2 className="text-base font-editorial font-bold text-sadu-charcoal">
                {isAr ? "قائمة السيناريو · سبعة بنود تجريبية" : "Scenario checklist · seven sample items"}
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-sadu-brick">
              {checkedCount} / 7
            </span>
          </div>

          <div className="space-y-2.5">
            {[
              { key: 'certificateNameVerified', labelEn: '1. Official Name on Certificate & Catalog Verified', labelAr: '1. الاسم الرسمي المعتمد لشهادة التكريم والكتالوج' },
              { key: 'exhibitionTitleLocked', labelEn: '2. Arabic & English Artwork Titles Locked', labelAr: '2. العناوين الفنية الثنائية معتمدة ومجمدة' },
              { key: 'bioApproved', labelEn: '3. Institutional Biography Proofed & Approved', labelAr: '3. السيرة الذاتية الرسمية مدققة ومعتمدة' },
              { key: 'portraitReceived', labelEn: '4. High-Res Official Artist Portrait Received', labelAr: '4. الصورة الشخصية الرسمية عالية الدقة مستلمة' },
              { key: 'nationalityConfirmed', labelEn: '5. Legal Nationality & Residence Status Confirmed', labelAr: '5. الجنسية القانونية ومقر الإقامة مؤكدان' },
              { key: 'socialMediaLogged', labelEn: '6. Official Handles & Public Tagging Protocol Logged', labelAr: '6. حسابات التواصل المعتمدة وبروتوكول النشر' },
              { key: 'guestListSubmitted', labelEn: '7. Opening Ceremony VIP Guest List Submitted', labelAr: '7. قائمة كبار الشخصيات المدعوين لحفل الافتتاح' },
            ].map(item => {
              const checked = checklist[item.key as keyof typeof checklist];
              return (
                <div 
                  key={item.key}
                  onClick={() => toggleCheck(item.key as keyof typeof checklist)}
                  className={`p-3 rounded-md border flex items-center justify-between cursor-pointer transition-all ${
                    checked 
                      ? 'bg-sadu-sage-light/40 border-sadu-sage text-sadu-ink' 
                      : 'bg-white border-sadu-gold/70 text-sadu-charcoal hover:border-sadu-brick'
                  }`}
                >
                  <span className="text-xs font-medium">
                    {isAr ? item.labelAr : item.labelEn}
                  </span>
                  <input 
                    type="checkbox" 
                    checked={checked} 
                    onChange={() => {}} // handled by parent onClick
                    className="accent-sadu-brick w-4 h-4 cursor-pointer"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Simulated travel workspace */}
        <div className="bg-white border border-sadu-gold rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-sadu-brick" />
              <h2 className="text-base font-editorial font-bold text-sadu-charcoal">
                {isAr ? "معاينة مرجع سفر تجريبي · دون تشفير" : "Sample travel reference preview · no encryption"}
              </h2>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-sadu-sand text-sadu-charcoal font-mono">
              ROLE: PR_PROTOCOL
            </span>
          </div>

          <div className="p-4 rounded-lg bg-sadu-linen/60 border border-sadu-gold space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-sadu-charcoal">
                {isAr ? 'ملف الفنان: يوسف نبهان' : 'Artist File: Youssef Nabhan'}
              </span>
              <span className="text-sadu-muted font-mono">SCB-PASSPORT-YN</span>
            </div>

            <div className="p-3 bg-white rounded border border-sadu-gold/70 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sadu-muted">{isAr ? 'وثيقة جواز السفر المرفوعة:' : 'Uploaded Passport Document:'}</span>
                <button
                  onClick={() => setShowPassportVault(!showPassportVault)}
                  className="text-xs font-bold text-sadu-brick hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  <span>{showPassportVault ? (isAr ? "إخفاء المثال" : "Hide sample") : (isAr ? "عرض المثال" : "View sample")}</span>
                </button>
              </div>

              {showPassportVault && (
                <div className="p-3 bg-sadu-sand/50 rounded border border-sadu-gold text-[11px] font-mono space-y-1 animate-in fade-in">
                  <div>DOC_NO: N***48210 · EXPIRES: 2031-11-14</div>
                  <div>SURNAME: NABHAN · GIVEN_NAMES: YOUSSEF</div>
                  <div>SECURITY_HASH: SHA-256 (3c81a...99b2)</div>
                  <div className="text-emerald-700 font-sans font-bold pt-1">
                    {isAr ? '✓ فحص أمني مؤكد — مطابقة بيانات الدخول' : '✓ Security Check Passed — Identity Verified'}
                  </div>
                </div>
              )}
            </div>

            {/* Token Generation */}
            <div className="pt-2 border-t border-sadu-gold/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sadu-charcoal">
                  {isAr ? 'رمز تصريح السفر المؤسسي:' : 'Institutional Travel Token:'}
                </span>
                {isTokenGenerated ? (
                  <span className="text-xs font-mono font-bold text-sadu-brick px-2 py-0.5 rounded bg-sadu-sand">
                    {travelClearanceToken}
                  </span>
                ) : (
                  <span className="text-xs text-sadu-muted">
                    {isAr ? 'بانتظار الإصدار' : 'Not generated'}
                  </span>
                )}
              </div>

              <button
                onClick={handleGenerateToken}
                className="w-full py-2 bg-sadu-brick hover:bg-sadu-brick-dark text-white rounded-md text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>{isTokenGenerated ? (isAr ? "تحديث المرجع التجريبي" : "Refresh sample reference") : (isAr ? "إنشاء مرجع سفر تجريبي" : "Create sample travel reference")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
