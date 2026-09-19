import { useI18n } from '../context/I18nContext';

export function LegacyScenarioNotice() {
  const { isAr } = useI18n();
  return <aside role="note" className="mb-5 border-s-4 border-sadu-ink bg-sadu-sand p-4 text-sm text-sadu-charcoal">
    <strong className="block">{isAr ? 'بيانات سيناريو تجريبي · مساحة مستقلة' : 'Sample scenario data · isolated workspace'}</strong>
    <p className="mt-1">{isAr
      ? 'الأرقام والتواريخ والحالات توضيحية. الإجراءات مؤقتة داخل المتصفح؛ لا تفويض مؤسسي أو تحقق فعلي أو إرسال أو دفع أو حفظ دائم.'
      : 'Figures, dates and statuses are illustrative. Actions are temporary in this browser; no institutional authorization, actual verification, transmission, payment or durable storage.'}</p>
  </aside>;
}
