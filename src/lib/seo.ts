import { type Meta } from '@tanstack/react-router';

export const BASE_URL = 'https://testingwithekki.com';

/**
 * Generates a canonical URL for a given path and locale.
 * Handles the logic of removing/adding locale prefixes and ensuring consistent trailing slashes.
 */
export function getCanonicalUrl(path: string, locale: string = 'en'): string {
    // Remove leading slash for consistency
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // If path already allows for locale (e.g. starts with 'en' or 'id'), use it as is
    // Otherwise, prepend the locale
    if (cleanPath.startsWith('en/') || cleanPath.startsWith('id/') || cleanPath === 'en' || cleanPath === 'id') {
        return `${BASE_URL}/${cleanPath}`;
    }

    return `${BASE_URL}/${locale}/${cleanPath}`.replace(/\/$/, '');
}

/**
 * Generates alternate language links for SEO.
 */
export function getAlternateLinks(path: string) {
    // Remove locale prefix if present to get the "route" path
    const routePath = path.replace(/^\/(en|id)/, '') || '';

    return [
        {
            rel: 'alternate',
            hrefLang: 'en',
            href: `${BASE_URL}/en${routePath}`,
        },
        {
            rel: 'alternate',
            hrefLang: 'id',
            href: `${BASE_URL}/id${routePath}`,
        },
        {
            rel: 'alternate',
            hrefLang: 'x-default',
            href: `${BASE_URL}/en${routePath}`,
        },
    ];
}

/**
 * Common Organization Structured Data
 */
export const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TestingWithEkki",
    "url": "https://testingwithekki.com",
    "logo": "https://testingwithekki.com/logo-dark-new.png",
    "sameAs": [
        "https://x.com/ekkisyam2310",
        "https://www.linkedin.com/in/ekkisyamsugiardi"
    ],
    "description": "Interactive platform for learning test automation with Playwright, JavaScript, and CSS selectors."
};
