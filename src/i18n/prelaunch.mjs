// Shared copy for the server gate and its React fallback. No credentials or access rules.
export const prelaunchCopy = {
  ar: {
    title: 'سدو — عرض تجريبي خاص', institution: 'دائرة الثقافة بالشارقة',
    introduction: 'عرض تجريبي خاص · الدخول للمخوّلين', password: 'كلمة المرور', submit: 'دخول العرض',
    checking: 'جارٍ التحقق من الدخول…', disclaimer: 'نموذج للمناقشة · بيانات تجريبية',
    rateLimit: 'محاولات كثيرة. يُرجى الانتظار ثم المحاولة مجدداً.', unconfigured: 'لم يُجهّز الدخول بعد. تواصلي مع مسؤول العرض.',
    unlockError: 'تعذّر الدخول. تحققي من كلمة المرور أو تواصلي مع مسؤول العرض.',
    connectionError: 'تعذّر الاتصال. تحققي من الاتصال ثم حاولي مجدداً.',
    verifyError: 'تعذّر التحقق من الدخول. تحققي من الاتصال ثم حاولي مجدداً.',
    lockError: 'تعذّر قفل العرض. تحققي من الاتصال ثم حاولي مجدداً.',
    lockConfirm: 'قفل العرض؟ يمكنك متابعة الخطوات التجريبية المحفوظة في هذا التبويب. قد تُفقد الحقول التي لم تُحفظ والأعمال الأخرى المؤقتة.',
  },
  en: {
    title: 'SADU — Private demonstration', institution: 'Sharjah Department of Culture',
    introduction: 'Private demonstration · Authorized access', password: 'Password', submit: 'Enter demonstration',
    checking: 'Checking access…', disclaimer: 'Discussion prototype · Synthetic data',
    rateLimit: 'Too many attempts. Wait and try again.', unconfigured: 'Preview access is not configured. Contact the preview owner.',
    unlockError: 'Unable to unlock. Check your password or contact the preview owner.',
    connectionError: 'Unable to connect. Check your connection and retry.',
    verifyError: 'Unable to verify access. Check your connection and retry.',
    lockError: 'Unable to lock the preview. Check your connection and retry.',
    lockConfirm: 'Lock this preview? Saved synthetic presentation steps can resume in this tab. Unsaved form entries and other session-only work may be lost.',
  },
};
