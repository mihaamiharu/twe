import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useParams,
  useLocation,
} from '@tanstack/react-router';
import { Suspense, useEffect, useRef, useState } from 'react';
import { type AuthSession } from '@/server/auth.fn';
import { authQueryOptions } from '@/lib/auth.query';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotFound } from '@/components/not-found';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ThemeProvider } from '@/components/theme-provider';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import { CookieConsent } from '@/components/cookie-consent';
import { Toaster } from 'sonner';
import appCss from '@/styles.css?url';
import i18n from '@/lib/i18n';
import {
  organizationSchema,
  getCanonicalUrl,
  getAlternateLinks,
} from '@/lib/seo';
import { getConsent } from '@/server/consent.fn';

// Export context type for child routes
export interface RootContext {
  auth?: AuthSession;
  queryClient: QueryClient;
  consent?: 'granted' | 'denied' | null;
  pathname?: string;
}

import { DefaultErrorComponent } from '@/components/default-error-component';

export const Route = createRootRouteWithContext<RootContext>()({
  defaultErrorComponent: DefaultErrorComponent,
  beforeLoad: async ({ context, location }) => {
    // Optimization: Check cache first to avoid blocking every navigation
    const auth = await context.queryClient.ensureQueryData(authQueryOptions);

    let consent: 'granted' | 'denied' | null = null;

    if (typeof document !== 'undefined') {
      // Client-side: read from cookie
      const cookieValue = document.cookie
        .split('; ')
        .find((row) => row.startsWith('twe-consent='))
        ?.split('=')[1];

      if (cookieValue === 'granted' || cookieValue === 'denied') {
        consent = cookieValue;
      }
    } else {
      // Server-side: read via Server Function
      consent = await getConsent();
    }

    return { auth, consent, pathname: location.pathname };
  },
  head: ({ context }: any) => {
    const isQa =
      typeof window !== 'undefined'
        ? window.location.hostname.startsWith('qa.')
        : false; // Server-side detection handled by header injection in scripts/server.ts

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const pathname = (context?.pathname as string) || '/';
    const canonicalUrl = getCanonicalUrl(pathname);
    const alternateLinks = getAlternateLinks(pathname);

    const meta: any[] = [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        name: 'keywords',
        content: i18n.t('common:seo.keywords'),
      },
      {
        property: 'og:title',
        content: i18n.t('common:seo.ogTitle'),
      },
      {
        property: 'og:description',
        content: i18n.t('common:seo.ogDescription'),
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:site_name',
        content: 'TestingWithEkki',
      },
      {
        property: 'og:image',
        content: 'https://testingwithekki.com/twe-banner.png',
      },
      {
        property: 'og:image:width',
        content: '1200',
      },
      {
        property: 'og:image:height',
        content: '630',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:site',
        content: '@ekkisyam2310',
      },
      {
        name: 'twitter:creator',
        content: '@ekkisyam2310',
      },
      {
        name: 'twitter:title',
        content: i18n.t('common:seo.ogTitle'),
      },
      {
        name: 'twitter:description',
        content: i18n.t('common:seo.ogDescription'),
      },
      {
        name: 'twitter:image',
        content: 'https://testingwithekki.com/twe-banner.png',
      },
      {
        name: 'theme-color',
        content: '#F7F2E7',
      },
    ];

    if (isQa) {
      meta.push({ name: 'robots', content: 'noindex, nofollow' });
    }

    return {
      meta,
      links: [
        { rel: 'canonical', href: canonicalUrl },
        ...alternateLinks.map((link) => ({
          rel: link.rel,
          hrefLang: link.hrefLang,
          href: link.href,
        })),
        // Preload critical fonts removed to avoid warnings (loaded via CSS)
        // { rel: 'preload', href: '/fonts/outfit-latin-400.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
        // { rel: 'preload', href: '/fonts/outfit-latin-600.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
        {
          rel: 'icon',
          href: '/logo-icon.svg',
          type: 'image/svg+xml',
        },
        {
          rel: 'apple-touch-icon',
          href: '/logo-icon.svg',
        },
        {
          rel: 'manifest',
          href: '/manifest.json',
        },
        {
          rel: 'stylesheet',
          href: appCss,
        },
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(organizationSchema),
        },
      ],
    };
  },

  component: RootComponent,
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

// RootComponent now just renders the Outlet
// The layout (Header, Footer) is in RootDocument which is stable
function RootComponent() {
  return <Outlet />;
}

// RootDocument is the "shell" that persists during SPA navigation
// Header, Footer, and layout go here to prevent flicker
function RootDocument({ children }: { children: React.ReactNode }) {
  const context = Route.useRouteContext();
  const queryClient = context?.queryClient;
  const params = useParams({ strict: false });
  const locale = params.locale || 'en';

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <HeadContent />
        {context?.auth?.user?.image && (
          <link
            rel="preload"
            as="image"
            href={context.auth.user.image}
            referrerPolicy="no-referrer"
          />
        )}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
              })();
            `,
          }}
        />
        {/* JSON-LD Organization Schema now managed via head.scripts */}
      </head>
      <body className="scrollbar-thin" suppressHydrationWarning>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AppLayout>{children}</AppLayout>
          </ThemeProvider>
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}

// AppLayout handles the Header, Footer, and main content area
// Uses route context (populated by beforeLoad) for auth data - always available
function AppLayout({ children }: { children: React.ReactNode }) {
  const context = Route.useRouteContext();
  const auth = context?.auth;
  const location = useLocation();
  const preloadedImageRef = useRef<string | null>(null);
  const [consent, setConsent] = useState<'granted' | 'denied' | null>(
    context?.consent || null,
  );

  // Sync consent state if it changes via CookieConsent component
  const handleConsentChange = (newConsent: 'granted' | 'denied' | null) => {
    setConsent(newConsent);
  };

  // Preload the avatar image to prevent flicker
  // This runs once when we have the user's image URL
  useEffect(() => {
    const imageUrl = auth?.user?.image;
    if (imageUrl && imageUrl !== preloadedImageRef.current) {
      preloadedImageRef.current = imageUrl;
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.src = imageUrl;
    }
  }, [auth?.user?.image]);

  // Check if current route is a challenge detail page
  const isChallengeDetail =
    /\/challenges\/[^/]+$/.test(location.pathname) &&
    !location.pathname.includes('/admin/');

  return (
    <>
      {consent === 'granted' && (
        <GoogleAnalytics measurementId={auth?.gaMeasurementId} />
      )}
      <CookieConsent
        onConsentChange={handleConsentChange}
        initialConsent={consent}
      />
      <div className="flex flex-col min-h-screen">
        <Header session={auth || null} />
        <a
          href="#main-content"
          className="sr-only fixed left-4 top-4 z-[60] rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg focus:not-sr-only focus:outline-none focus:ring-4 focus:ring-ring/40"
        >
          {i18n.t('common:actions.skipToContent')}
        </a>
        <div
          id="main-content"
          tabIndex={-1}
          className="flex-1 focus:outline-none"
        >
          <Suspense fallback={<div className="min-h-[50vh]" />}>
            {children}
          </Suspense>
        </div>
        {!isChallengeDetail && <Footer />}
        <Toaster position="top-right" theme="system" closeButton />
      </div>
    </>
  );
}
