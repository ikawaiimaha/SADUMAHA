import { useI18n } from '../context/I18nContext';
import { MOCKUP_ARABIC } from './mockupArabic';

/** Translate presentation copy only; preserve unknown/user-authored content. */
export function useMockupText(arabic?: boolean) {
  const { isAr } = useI18n();
  const useArabic = arabic ?? isAr;
  return (text: string | null | undefined) => {
    const value = text ?? '';
    return useArabic ? (MOCKUP_ARABIC[value] ?? value) : value;
  };
}
