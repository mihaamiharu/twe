// i18n configuration settings
export const fallbackLng = 'en';
export const supportedLngs = ['en', 'id'] as const;
export type Locale = (typeof supportedLngs)[number];

export const defaultNS = 'common';
export const namespaces = ['common', 'home', 'challenges', 'tutorials'] as const;
export type Namespace = (typeof namespaces)[number];

/**
 * Check if a string is a valid locale
 */
export function isValidLocale(locale: string): locale is Locale {
    return supportedLngs.includes(locale as Locale);
}
