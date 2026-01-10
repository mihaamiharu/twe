import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { isValidLocale, fallbackLng } from '@/lib/i18n/settings';
import type { Locale } from '@/lib/i18n/settings';

interface I18nProviderProps {
  children: React.ReactNode;
  locale?: string;
}

/**
 * I18n Provider that syncs the language with the route locale parameter.
 * Wrap this around your app content to enable translations.
 */
export function I18nProvider({ children, locale }: I18nProviderProps) {
  useEffect(() => {
    const targetLocale: Locale = isValidLocale(locale ?? '')
      ? (locale as Locale)
      : fallbackLng;

    if (i18n.language !== targetLocale) {
      i18n.changeLanguage(targetLocale);
    }
  }, [locale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
