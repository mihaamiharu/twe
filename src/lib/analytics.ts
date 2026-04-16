/**
 * Analytics utility for tracking user events
 *
 * Provides type-safe event tracking for Google Analytics
 */

// Event types and their parameters
export type AnalyticsEvent =
  | {
      name: 'challenge_completed';
      params: { slug: string; difficulty: string; xp: number };
    }
  | { name: 'tutorial_completed'; params: { slug: string } }
  | { name: 'level_up'; params: { newLevel: number; totalXP: number } }
  | { name: 'achievement_unlocked'; params: { slug: string; name: string } }
  | { name: 'bug_report_submitted'; params: { title: string } }
  | { name: 'user_registered'; params: Record<string, never> }
  | { name: 'user_logged_in'; params: Record<string, never> };

/**
 * Type definition for Google Analytics gtag function
 */
type GTag = (
  command: 'event',
  eventName: string,
  eventParams?: Record<string, unknown>,
) => void;

declare global {
  interface Window {
    gtag?: GTag;
  }
}

/**
 * Track an analytics event
 *
 * @example
 * trackEvent('challenge_completed', { slug: 'js-basics', difficulty: 'EASY', xp: 20 });
 * trackEvent('level_up', { newLevel: 5, totalXP: 2500 });
 */
export function trackEvent<T extends AnalyticsEvent['name']>(
  eventName: T,
  params: Extract<AnalyticsEvent, { name: T }>['params'],
): void {
  // Check if gtag is available (only in browser with GA loaded)
  if (typeof window === 'undefined') return;

  const gtag = window.gtag;
  if (typeof gtag !== 'function') {
    // GA not loaded, skip tracking
    if (import.meta.env.DEV) {
      console.log(`[Analytics] ${eventName}`, params);
    }
    return;
  }

  gtag('event', eventName, params as Record<string, unknown>);
}

/**
 * Track a page view (typically handled automatically by GoogleAnalytics component)
 */
export function trackPageView(path: string, title: string): void {
  if (typeof window === 'undefined') return;

  const gtag = window.gtag;
  if (typeof gtag !== 'function') return;

  gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
  });
}
