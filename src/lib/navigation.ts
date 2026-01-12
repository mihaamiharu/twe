/**
 * Navigation utilities for locale-aware routing
 *
 * These helpers provide type-safe navigation while working around
 * TanStack Router's strict typing for dynamic locale parameters.
 */

import type { Locale } from '@/lib/i18n/settings';

/**
 * Helper type for locale-aware route parameters
 */
export interface LocaleParams {
  locale: Locale;
}

/**
 * Helper type for routes with slug parameter
 */
export interface LocaleSlugParams extends LocaleParams {
  slug: string;
}

/**
 * Creates typed navigation params for locale-aware routes
 * This encapsulates the type casting needed for dynamic locale parameters
 */
export function localeParams(locale: string): LocaleParams {
  return { locale: locale as Locale };
}

/**
 * Creates typed navigation params for routes with slug
 */
export function localeSlugParams(
  locale: string,
  slug: string,
): LocaleSlugParams {
  return { locale: locale as Locale, slug };
}

/**
 * Route paths that require locale parameter
 */
export const LocaleRoutes = {
  home: '/$locale/',
  login: '/$locale/login',
  register: '/$locale/register',
  forgotPassword: '/$locale/forgot-password',
  resetPassword: '/$locale/reset-password',
  tutorials: '/$locale/tutorials/',
  tutorialDetail: '/$locale/tutorials/$slug',
  challenges: '/$locale/challenges/',
  challengeDetail: '/$locale/challenges/$slug',
  leaderboard: '/$locale/leaderboard',
  profile: '/$locale/profile',
  settings: '/$locale/settings',
  privacy: '/$locale/privacy',
  terms: '/$locale/terms',
} as const;

export type LocaleRoutePath = (typeof LocaleRoutes)[keyof typeof LocaleRoutes];
