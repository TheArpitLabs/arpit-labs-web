/**
 * i18n Translator
 * Handles translation and localization
 */

import { Translation, DEFAULT_LOCALE, FALLBACK_LOCALE } from './config';

class Translator {
  private currentLocale = DEFAULT_LOCALE;
  private translations = new Map<string, Translation>();
  private listeners = new Set<(locale: string) => void>();

  /**
   * Sets the current locale
   */
  setLocale(locale: string): void {
    if (this.currentLocale !== locale) {
      this.currentLocale = locale;
      this.notifyListeners();
    }
  }

  /**
   * Gets the current locale
   */
  getLocale(): string {
    return this.currentLocale;
  }

  /**
   * Registers translations for a locale
   */
  registerTranslations(locale: string, translations: Translation): void {
    this.translations.set(locale, translations);
  }

  /**
   * Translates a key
   */
  t(key: string, params?: Record<string, string | number>): string {
    const translation = this.getTranslation(key, this.currentLocale);
    
    if (!translation) {
      // Try fallback locale
      const fallbackTranslation = this.getTranslation(key, FALLBACK_LOCALE);
      if (fallbackTranslation) {
        return this.interpolate(fallbackTranslation, params);
      }
      return key;
    }

    return this.interpolate(translation, params);
  }

  /**
   * Gets a translation for a key and locale
   */
  private getTranslation(key: string, locale: string): string | null {
    const translations = this.translations.get(locale);
    if (!translations) return null;

    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }

    return typeof value === 'string' ? value : null;
  }

  /**
   * Interpolates parameters into a translation string
   */
  private interpolate(
    template: string,
    params?: Record<string, string | number>
  ): string {
    if (!params) return template;

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key]?.toString() || match;
    });
  }

  /**
   * Formats a date according to the current locale
   */
  formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(this.currentLocale, options).format(dateObj);
  }

  /**
   * Formats a number according to the current locale
   */
  formatNumber(
    number: number,
    options?: Intl.NumberFormatOptions
  ): string {
    return new Intl.NumberFormat(this.currentLocale, options).format(number);
  }

  /**
   * Formats a currency amount
   */
  formatCurrency(
    amount: number,
    currency: string = 'USD',
    options?: Intl.NumberFormatOptions
  ): string {
    return this.formatNumber(amount, {
      style: 'currency',
      currency,
      ...options,
    });
  }

  /**
   * Formats a relative time (e.g., "2 hours ago")
   */
  formatRelativeTime(
    value: number,
    unit: Intl.RelativeTimeFormatUnit
  ): string {
    const rtf = new Intl.RelativeTimeFormat(this.currentLocale, {
      numeric: 'auto',
    });
    return rtf.format(value, unit);
  }

  /**
   * Checks if the current locale is RTL
   */
  isRTL(): boolean {
    const rtlLocales = ['ar', 'he', 'fa', 'ur'];
    return rtlLocales.includes(this.currentLocale);
  }

  /**
   * Subscribes to locale changes
   */
  subscribe(listener: (locale: string) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notifies all listeners of locale change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.currentLocale));
  }

  /**
   * Gets the direction for the current locale
   */
  getDirection(): 'ltr' | 'rtl' {
    return this.isRTL() ? 'rtl' : 'ltr';
  }

  /**
   * Pluralizes a word based on count
   */
  pluralize(
    count: number,
    singular: string,
    plural: string
  ): string {
    return count === 1 ? singular : plural;
  }
}

// Create singleton instance
const translator = new Translator();

/**
 * Sets the current locale
 */
export function setLocale(locale: string): void {
  translator.setLocale(locale);
}

/**
 * Gets the current locale
 */
export function getLocale(): string {
  return translator.getLocale();
}

/**
 * Translates a key
 */
export function t(key: string, params?: Record<string, string | number>): string {
  return translator.t(key, params);
}

/**
 * Registers translations
 */
export function registerTranslations(locale: string, translations: Translation): void {
  translator.registerTranslations(locale, translations);
}

/**
 * Formats a date
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  return translator.formatDate(date, options);
}

/**
 * Formats a number
 */
export function formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
  return translator.formatNumber(number, options);
}

/**
 * Formats currency
 */
export function formatCurrency(
  amount: number,
  currency?: string,
  options?: Intl.NumberFormatOptions
): string {
  return translator.formatCurrency(amount, currency, options);
}

/**
 * Formats relative time
 */
export function formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit): string {
  return translator.formatRelativeTime(value, unit);
}

/**
 * Checks if current locale is RTL
 */
export function isRTL(): boolean {
  return translator.isRTL();
}

/**
 * Gets text direction
 */
export function getDirection(): 'ltr' | 'rtl' {
  return translator.getDirection();
}

/**
 * Subscribes to locale changes
 */
export function subscribeToLocale(listener: (locale: string) => void): () => void {
  return translator.subscribe(listener);
}

/**
 * Pluralizes a word
 */
export function pluralize(count: number, singular: string, plural: string): string {
  return translator.pluralize(count, singular, plural);
}

export default translator;
