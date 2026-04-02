import { useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (command: string, ...args: unknown[]) => void;
  }
}

export function GoogleAnalytics({ measurementId }: { measurementId?: string }) {
  const location = useLocation();

  // Initialize GA
  useEffect(() => {
    if (!measurementId) return;

    // Ensure dataLayer exists
    window.dataLayer = window.dataLayer || [];

    // Define gtag if it doesn't exist
    if (!window.gtag) {
       
      window.gtag = function () {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer.push(arguments);
      };
    }

    // Load the script if it hasn't been loaded yet
    const scriptId = 'google-analytics-script';

    // delay initialization to minimalize TBT
    const timeoutId = setTimeout(() => {
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        document.head.appendChild(script);

        window.gtag('js', new Date());
        window.gtag('config', measurementId);
      }
    }, 2000); // 2 seconds delay

    return () => clearTimeout(timeoutId);
  }, [measurementId]);

  // Track page views
  useEffect(() => {
    if (!measurementId || !window.gtag) return;

    window.gtag('event', 'page_view', {
      page_path: location.href,
      page_title: document.title,
    });
  }, [location.href, measurementId]);

  return null;
}

// Re-export trackEvent for convenience
export { trackEvent, type AnalyticsEvent } from '@/lib/analytics';
