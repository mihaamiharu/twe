import { useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataLayer: any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gtag: (...args: any[]) => void;
    }
}

export function GoogleAnalytics() {
    const location = useLocation();
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

    // Initialize GA
    useEffect(() => {
        if (!measurementId) return;

        // Ensure dataLayer exists
        window.dataLayer = window.dataLayer || [];

        // Define gtag if it doesn't exist
        if (!window.gtag) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            window.gtag = function (...args: any[]) {
                window.dataLayer.push(args);
            };
        }

        // Load the script if it hasn't been loaded yet
        const scriptId = 'google-analytics-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
            document.head.appendChild(script);

            window.gtag('js', new Date());
            window.gtag('config', measurementId);
        }
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
