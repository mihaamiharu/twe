export const BASE_URL = 'https://testingwithekki.com';

/**
 * Parameters for generating SEO head metadata.
 */
interface SeoParams {
    /** Page title (will be appended with " | TestingWithEkki" if not already) */
    title: string;
    /** Page description for meta and OG */
    description: string;
    /** Path without locale prefix, e.g. '/challenges' or '/challenges/my-slug' */
    path: string;
    /** Current locale, defaults to 'en' */
    locale?: string;
    /** OG image URL, defaults to the site banner */
    ogImage?: string;
    /** OG type, defaults to 'website' */
    ogType?: string;
    /** JSON-LD structured data objects */
    jsonLd?: object[];
    /** If true, adds noindex/nofollow meta */
    noIndex?: boolean;
}

/**
 * Generates a complete `head` return object for TanStack Start routes.
 * Includes meta tags (title, description, OG, Twitter), canonical/alternate links, and JSON-LD scripts.
 */
export function createSeoHead(params: SeoParams) {
    const {
        title,
        description,
        path,
        locale = 'en',
        ogImage = `${BASE_URL}/twe-banner.png`,
        ogType = 'website',
        jsonLd,
        noIndex = false,
    } = params;

    // Ensure path starts with / and remove trailing slashes
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const normalizedPath = cleanPath === '/' ? '' : cleanPath.replace(/\/$/, '');

    const url = `${BASE_URL}/${locale}${normalizedPath}`;

    const meta: Record<string, string>[] = [
        { title },
        { name: 'description', content: description },
        // Open Graph
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: url },
        { property: 'og:image', content: ogImage },
        { property: 'og:type', content: ogType },
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: ogImage },
    ];

    if (noIndex) {
        meta.push({ name: 'robots', content: 'noindex, nofollow' });
    }

    const links: Record<string, string>[] = [
        { rel: 'canonical', href: url },
        { rel: 'alternate', hrefLang: 'en', href: `${BASE_URL}/en${normalizedPath}` },
        { rel: 'alternate', hrefLang: 'id', href: `${BASE_URL}/id${normalizedPath}` },
        { rel: 'alternate', hrefLang: 'x-default', href: `${BASE_URL}/en${normalizedPath}` },
    ];

    const scripts = jsonLd?.map((data) => ({
        type: 'application/ld+json',
        children: JSON.stringify(data),
    })) ?? [];

    return { meta, links, scripts };
}

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

/**
 * WebSite structured data for the homepage
 */
export const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "TestingWithEkki",
    "url": "https://testingwithekki.com",
    "description": "Interactive platform for learning test automation with Playwright, JavaScript, and CSS selectors.",
    "potentialAction": {
        "@type": "SearchAction",
        "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://testingwithekki.com/en/challenges?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
    }
};
