import { useState } from 'react';

// Presentation only: no provider calls, timers, receipts, or state-changing callback.
export function SignatureJourneyPreview({ isAr, onBack }: { isAr: boolean; onBack: () => void }) {
  const [step, setStep] = useState(0);
  const t = (en: string, ar: string) => isAr ? ar : en;
  const steps = [
    {
      title: t('Review the exact document and authority', 'مراجعة المستند المحدد والصلاحية'),
      text: t('A future service would check the responsible person’s delegated authority and bind the request to a specific document version. The demo manager role is not an authenticated identity.', 'تتحقق الخدمة المستقبلية من صلاحية الشخص المسؤول وفق التفويض، وتربط الطلب بإصدار محدد من المستند. دور المدير التجريبي ليس هوية موثّقة.'),
    },
    {
      title: t('Request provider approval', 'طلب الموافقة عبر مزوّد الخدمة'),
      text: t('After approved integration, an eligible signer would follow the provider’s signing journey. This preview sends no request, contacts no phone, and performs no biometric check. Cancellation, rejection and expiry must leave the handover pending.', 'بعد اعتماد الربط، يتبع الموقّع المؤهل مسار التوقيع لدى مزوّد الخدمة. لا ترسل هذه المعاينة طلباً، ولا تتصل بهاتف، ولا تجري تحققاً بيومترياً. يجب أن يبقى التسليم معلقاً عند الإلغاء أو الرفض أو انتهاء المهلة.'),
    },
    {
      title: t('Validate the result before recording a decision', 'التحقق من النتيجة قبل تسجيل القرار'),
      text: t('The future backend would validate the provider result, document version and applicable authority before recording a decision. No result or signed document exists here. Completing this walkthrough changes no case record.', 'يتحقق النظام الخلفي المستقبلي من نتيجة مزوّد الخدمة وإصدار المستند والصلاحية المنطبقة قبل تسجيل القرار. لا توجد هنا نتيجة أو وثيقة موقّعة. إكمال هذا الشرح لا يغيّر أي سجل للحالة.'),
    },
  ];
  return <section className="lr-signature-preview">
    <p className="lr-signing-label">{t('PROPOSED JOURNEY · UAE PASS NOT CONNECTED', 'مسار مقترح · لا يوجد ربط مع الهوية الرقمية')}</p>
    <p className="lr-small">{t('SADU concept walkthrough. No authentication, digital signature or custody transfer occurs.', 'شرح تصوّري من سدو. لا يحدث تحقق من الهوية أو توقيع رقمي أو نقل للحيازة.')}</p>
    <div className="lr-dossier-evidence" aria-live="polite" aria-atomic="true">
      <p>{t(`Step ${step + 1} of 3`, `الخطوة ${['١', '٢', '٣'][step]} من ٣`)}</p>
      <h3>{steps[step].title}</h3><p>{steps[step].text}</p>
    </div>
    <div className="lr-actions">
      <button onClick={() => setStep(step - 1)} disabled={step === 0}>{t('Previous', 'السابق')}</button>
      {step < 2 && <button onClick={() => setStep(step + 1)}>{t('Next step', 'الخطوة التالية')}</button>}
      <button className="lr-primary" onClick={onBack}>{t('Return to demo review', 'العودة إلى المراجعة التجريبية')}</button>
    </div>
    <p className="lr-small"><a href="https://docs.uaepass.ae/getting-onboarded-with-uae-pass/onboarding-process-for-uae-pass-service-providers/initiation-phase" target="_blank" rel="noreferrer">{t('Official UAE PASS onboarding guidance ↗', 'إرشادات الربط الرسمية للهوية الرقمية ↖')}</a></p>
  </section>;
}
