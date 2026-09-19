import { Language } from '../types';

/**
 * Display formatting functions for the SADU demonstration.
 * Numeral choices are design conventions, not a statement of official standards.
 * Supporting both Western Arabic (1, 2, 3...) and Eastern Arabic (١، ٢، ٣...)
 * numerals based on the current lang setting.
 */

const WESTERN_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const EASTERN_ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * Detect the effective language if not explicitly provided
 */
export function getEffectiveLang(lang?: Language): Language {
  if (lang === 'ar' || lang === 'en') return lang;
  if (typeof document !== 'undefined' && document.documentElement) {
    const docLang = document.documentElement.lang as Language;
    if (docLang === 'ar' || docLang === 'en') return docLang;
  }
  return 'ar';
}

/**
 * Converts Western Arabic digits (0-9) to Eastern Arabic digits (٠-٩)
 */
export function toEasternArabicNumerals(input: string | number): string {
  if (input === null || input === undefined) return '';
  return String(input).replace(/[0-9]/g, (digit) => EASTERN_ARABIC_DIGITS[parseInt(digit, 10)] || digit);
}

/**
 * Converts Eastern Arabic digits (٠-٩) to Western Arabic digits (0-9)
 */
export function toWesternArabicNumerals(input: string | number): string {
  if (input === null || input === undefined) return '';
  return String(input).replace(/[٠-٩]/g, (digit) => {
    const idx = EASTERN_ARABIC_DIGITS.indexOf(digit);
    return idx !== -1 ? String(idx) : digit;
  });
}

/**
 * Standardizes any string containing numerals to match the target language:
 * - When lang === 'ar', converts 0-9 to Eastern Arabic numerals (٠-٩) and % to ٪
 * - When lang === 'en', converts ٠-٩ to Western Arabic numerals (0-9) and ٪ to %
 */
export function localizeDigits(input: string | number | null | undefined, lang?: Language): string {
  if (input === null || input === undefined) return '';
  const currentLang = getEffectiveLang(lang);
  const str = String(input);

  if (currentLang === 'ar') {
    return toEasternArabicNumerals(str).replace(/%/g, '٪');
  } else {
    return toWesternArabicNumerals(str).replace(/٪/g, '%');
  }
}

/**
 * Format a number using appropriate numeral system and thousands separators:
 * - In Arabic ('ar'): Eastern Arabic numerals with Arabic thousand separator (e.g., ٤٥٬٠٠٠)
 * - In English ('en'): Western Arabic numerals with comma thousand separator (e.g., 45,000)
 * 
 * If a formatted or compound string is passed (such as "49 / 64" or "14 / 14 Active"),
 * it localizes all numerals within the string to the active numeral system.
 */
export function formatNumber(
  value: number | string | null | undefined,
  lang?: Language,
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined || value === '') return '';
  const currentLang = getEffectiveLang(lang);

  // If already a string, check if it's purely a parseable numeric string or a compound string
  if (typeof value === 'string') {
    // Strip common Western or Eastern thousand separators to check if purely numeric
    const cleanStr = toWesternArabicNumerals(value)
      .replace(/,/g, '')
      .replace(/٬/g, '')
      .trim();

    // If compound or containing non-numeric words (e.g. "49 / 64", "1 Critical"), localize digits directly
    if (isNaN(Number(cleanStr)) || cleanStr === '') {
      return localizeDigits(value, currentLang);
    }
  }

  const num = typeof value === 'number' 
    ? value 
    : parseFloat(toWesternArabicNumerals(String(value)).replace(/,/g, '').replace(/٬/g, ''));

  if (isNaN(num)) {
    return localizeDigits(value, currentLang);
  }

  try {
    const locale = currentLang === 'ar' ? 'ar-AE-u-nu-arab' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(num);
  } catch {
    // Fallback if Intl fails
    const westernFormatted = new Intl.NumberFormat('en-US', options).format(num);
    return localizeDigits(westernFormatted, currentLang);
  }
}

/**
 * Format a percentage value with numeral localization and localized percent symbol:
 * e.g., 94.2, 'ar' -> "٩٤٫٢٪"
 * e.g., 94.2, 'en' -> "94.2%"
 * e.g., "76%", 'ar' -> "٧٦٪"
 */
export function formatPercent(
  value: number | string | null | undefined,
  lang?: Language,
  decimals: number = 0
): string {
  if (value === null || value === undefined || value === '') return '';
  const currentLang = getEffectiveLang(lang);

  if (typeof value === 'string' && (value.includes('%') || value.includes('٪'))) {
    return localizeDigits(value, currentLang);
  }

  const num = typeof value === 'string' 
    ? parseFloat(toWesternArabicNumerals(value)) 
    : value;

  if (isNaN(num)) return localizeDigits(value, currentLang);

  if (currentLang === 'ar') {
    const formatted = new Intl.NumberFormat('ar-AE-u-nu-arab', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
    return `${formatted}٪`;
  }

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
  return `${formatted}%`;
}

/**
 * Format ratio or fraction with localized numerals:
 * e.g., formatRatio(49, 64, 'ar') -> "٤٩ / ٦٤"
 * e.g., formatRatio(49, 64, 'en') -> "49 / 64"
 */
export function formatRatio(
  numerator: number | string,
  denominator: number | string,
  lang?: Language
): string {
  const currentLang = getEffectiveLang(lang);
  const numStr = formatNumber(numerator, currentLang);
  const denStr = formatNumber(denominator, currentLang);
  return `${numStr} / ${denStr}`;
}

/**
 * Format monetary amount with currency code and localized numerals
 * e.g., formatCurrency(540000, 'AED', 'ar') -> "٥٤٠٬٠٠٠ درهم"
 * e.g., formatCurrency(540000, 'AED', 'en') -> "AED 540,000"
 * e.g., formatCurrency(45000, 'USD', 'ar')  -> "٤٥٬٠٠٠ دولار أمريكي"
 * e.g., formatCurrency(45000, 'USD', 'en')  -> "USD 45,000"
 */
export function formatCurrency(
  amount: number | string,
  currency: 'AED' | 'USD' | string = 'AED',
  lang?: Language
): string {
  const currentLang = getEffectiveLang(lang);
  const formattedNum = formatNumber(amount, currentLang);

  if (currentLang === 'ar') {
    if (currency === 'AED' || currency === 'د.إ') return `${formattedNum} درهم`;
    if (currency === 'USD' || currency === '$') return `${formattedNum} دولار أمريكي`;
    return `${formattedNum} ${currency}`;
  }

  if (currency === '$') return `$${formattedNum}`;
  return `${currency} ${formattedNum}`;
}

/**
 * Format a date for the demonstration with localized numerals:
 * e.g. "12 September 2026" / "١٢ سبتمبر ٢٠٢٦"
 */
export function formatDate(dateInput: string | Date, lang?: Language): string {
  const currentLang = getEffectiveLang(lang);
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return localizeDigits(String(dateInput), currentLang);

    if (currentLang === 'ar') {
      const arabicMonths = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];
      const day = toEasternArabicNumerals(d.getDate());
      const month = arabicMonths[d.getMonth()];
      const year = toEasternArabicNumerals(d.getFullYear());
      return `${day} ${month} ${year}`;
    }

    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return localizeDigits(String(dateInput), currentLang);
  }
}
