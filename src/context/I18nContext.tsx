import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language } from '../types';
import { readPreference, writePreference } from '../utils/preferences';
import { getTranslation, getBilingual as getBilingualHelper, LOCALES } from '../i18n/locales';
import {
  formatNumber as formatNumberUtil,
  formatCurrency as formatCurrencyUtil,
  formatPercent as formatPercentUtil,
  formatRatio as formatRatioUtil,
  formatDate as formatDateUtil,
  localizeDigits as localizeDigitsUtil,
  toEasternArabicNumerals,
  toWesternArabicNumerals,
} from '../i18n/formatters';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  isAr: boolean;
  t: (keyPath: string, fallback?: string) => string;
  getBilingual: <T extends Record<string, any>>(item: T, field: string) => string;
  formatNumber: (value: number | string | null | undefined, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number | string, currency?: 'AED' | 'USD' | string) => string;
  formatPercent: (value: number | string | null | undefined, decimals?: number) => string;
  formatRatio: (numerator: number | string, denominator: number | string) => string;
  formatDate: (dateInput: string | Date) => string;
  localizeDigits: (input: string | number | null | undefined) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode; initialLang?: Language }> = ({
  children,
  initialLang = 'ar',
}) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = readPreference('sadu_lang');
    return (saved === 'en' || saved === 'ar') ? saved : initialLang;
  });

  const isAr = lang === 'ar';

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    writePreference('sadu_lang', newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const toggleLang = () => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  }, [lang, isAr]);

  const t = (keyPath: string, fallback?: string): string => {
    return getTranslation(lang, keyPath, fallback);
  };

  const getBilingual = <T extends Record<string, any>>(item: T, field: string): string => {
    return getBilingualHelper(item, field, lang);
  };

  const formatNumber = useCallback(
    (value: number | string | null | undefined, options?: Intl.NumberFormatOptions) => {
      return formatNumberUtil(value, lang, options);
    },
    [lang]
  );

  const formatCurrency = useCallback(
    (amount: number | string, currency: 'AED' | 'USD' | string = 'AED') => {
      return formatCurrencyUtil(amount, currency, lang);
    },
    [lang]
  );

  const formatPercent = useCallback(
    (value: number | string | null | undefined, decimals: number = 0) => {
      return formatPercentUtil(value, lang, decimals);
    },
    [lang]
  );

  const formatRatio = useCallback(
    (numerator: number | string, denominator: number | string) => {
      return formatRatioUtil(numerator, denominator, lang);
    },
    [lang]
  );

  const formatDate = useCallback(
    (dateInput: string | Date) => {
      return formatDateUtil(dateInput, lang);
    },
    [lang]
  );

  const localizeDigits = useCallback(
    (input: string | number | null | undefined) => {
      return localizeDigitsUtil(input, lang);
    },
    [lang]
  );

  return (
    <I18nContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        isAr,
        t,
        getBilingual,
        formatNumber,
        formatCurrency,
        formatPercent,
        formatRatio,
        formatDate,
        localizeDigits,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

const DEFAULT_I18N: I18nContextType = {
  lang: 'ar',
  setLang: () => {},
  toggleLang: () => {},
  isAr: true,
  t: (keyPath, fallback) => fallback || keyPath,
  getBilingual: (item, field) => item[`${field}Ar`] || item[field] || '',
  formatNumber: (v) => String(v ?? ''),
  formatCurrency: (amount, currency = 'AED') => `${amount} ${currency}`,
  formatPercent: (v) => `${v}%`,
  formatRatio: (num, den) => `${num}/${den}`,
  formatDate: (d) => String(d),
  localizeDigits: (v) => String(v ?? ''),
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  return context || DEFAULT_I18N;
};

export const useTranslation = () => {
  const {
    t,
    getBilingual,
    lang,
    isAr,
    setLang,
    toggleLang,
    formatNumber,
    formatCurrency,
    formatPercent,
    formatRatio,
    formatDate,
    localizeDigits,
  } = useI18n();

  return {
    t,
    getBilingual,
    lang,
    isAr,
    setLang,
    toggleLang,
    formatNumber,
    formatCurrency,
    formatPercent,
    formatRatio,
    formatDate,
    localizeDigits,
  };
};
