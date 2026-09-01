export const BASE_URL = 'https://testingwithekki.com';

export const ORGANIZATION_ID = `${BASE_URL}/#organization`;
export const WEBSITE_ID = `${BASE_URL}/#website`;
export const PERSON_ID = `${BASE_URL}/en/about#person`;

export const PERSON_NAME = 'Ekki Syam Sugiardi';
export const SOCIAL_PROFILE_URLS = [
  'https://github.com/mihaamiharu',
  'https://www.youtube.com/@TestingWithEkki',
  'https://www.linkedin.com/in/ekkisyamsugiardi/',
  'https://x.com/ekkisyam2310',
] as const;

/**
 * Parameters for generating SEO head metadata.
 */
interface SeoParams {
  /** Localized page title, including the site name when useful. */
  title: string;
  /** Page description for meta and OG */
  description: string;
  /** Path without locale prefix, e.g. '/practice' or '/practice/my-slug' */
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

  const ogLocale =
    locale === 'id'
      ? { current: 'id_ID', alternate: 'en_US' }
      : { current: 'en_US', alternate: 'id_ID' };
  const meta: Record<string, string>[] = [
    { title },
    { name: 'description', content: description },
    // Open Graph
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: ogImage },
    { property: 'og:type', content: ogType },
    { property: 'og:site_name', content: 'TestingWithEkki' },
    { property: 'og:locale', content: ogLocale.current },
    { property: 'og:locale:alternate', content: ogLocale.alternate },
    // Twitter
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: '@ekkisyam2310' },
    { name: 'twitter:creator', content: '@ekkisyam2310' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: ogImage },
  ];

  if (noIndex) {
    meta.push({ name: 'robots', content: 'noindex, nofollow' });
  }

  const links: Record<string, string>[] = [
    { rel: 'canonical', href: url },
    {
      rel: 'alternate',
      hrefLang: 'en',
      href: `${BASE_URL}/en${normalizedPath}`,
    },
    {
      rel: 'alternate',
      hrefLang: 'id',
      href: `${BASE_URL}/id${normalizedPath}`,
    },
    {
      rel: 'alternate',
      hrefLang: 'x-default',
      href: `${BASE_URL}/en${normalizedPath}`,
    },
  ];

  const scripts =
    jsonLd?.map((data) => ({
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
  if (
    cleanPath.startsWith('en/') ||
    cleanPath.startsWith('id/') ||
    cleanPath === 'en' ||
    cleanPath === 'id'
  ) {
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
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORGANIZATION_ID,
  name: 'TestingWithEkki',
  url: 'https://testingwithekki.com',
  logo: 'https://testingwithekki.com/logo-icon-512.png',
  sameAs: [...SOCIAL_PROFILE_URLS],
  description:
    'Interactive platform for learning test automation with Playwright, JavaScript, and CSS selectors.',
};

export function createWebsiteSchema({
  locale,
  description,
}: {
  locale: string;
  description: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: 'TestingWithEkki',
    url: 'https://testingwithekki.com',
    description: description,
    inLanguage: locale,
    publisher: { '@id': ORGANIZATION_ID },
  };
}

/** English compatibility export for consumers that do not have a locale. */
export const websiteSchema = createWebsiteSchema({
  locale: 'en',
  description:
    'Grow beyond test execution through Web Automation lessons and hands-on challenges in Practice.',
});

export function createPersonSchema({ description }: { description: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': PERSON_ID,
    name: PERSON_NAME,
    jobTitle: 'QA/SDET',
    url: `${BASE_URL}/en/about`,
    description: description,
    sameAs: [...SOCIAL_PROFILE_URLS],
  };
}

export function createProfilePageSchema({
  locale,
  title,
  description,
}: {
  locale: string;
  title: string;
  description: string;
}) {
  const url = `${BASE_URL}/${locale}/about`;

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${url}#profilepage`,
    url: url,
    name: title,
    description: description,
    inLanguage: locale,
    isPartOf: { '@id': WEBSITE_ID },
    mainEntity: { '@id': PERSON_ID },
  };
}
