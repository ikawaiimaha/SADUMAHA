import { useI18n } from '../context/I18nContext';

export function DemoNotice() {
  const { isAr } = useI18n();
  return <p className="bg-amber-50 text-amber-950 border-b border-amber-200 px-4 py-2 text-xs text-center" role="note">
    {isAr
      ? 'نموذج توضيحي ببيانات تجريبية. الأدوار والسياسات مقترحة؛ لا تسجيل دخول فعلي ولا تفويض أو إرسال أو دفع. استخدم بيانات تجريبية فقط.'
      : 'Demonstration with sample data. Roles and policies are proposed; no verified identity, authorization, dispatch, or payment. Use sample data only.'}
  </p>;
}
