'use client';

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
import { organizationSchema } from '@/lib/seo';
import { omitUndefined } from '@/lib/omit-undefined';
import { getConsent } from '@/server/consent.fn';

function isLocaleProductPath(pathname: string) {
  return /^\/(en|id)(?:\/|$)/.test(pathname);
}

// Export context type for child routes
export interface RootContext {
  auth?: AuthSession;
  queryClient: QueryClient;
  consent?: 'granted' | 'denied' | null;
  pathname?: string;
}

import { DefaultErrorComponent } from '@/components/default-error-component';

export const Route = createRootRouteWithContext<RootContext>()({
  errorComponent: DefaultErrorComponent,
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
  head: () => {
    const isQa =
      typeof window !== 'undefined'
        ? window.location.hostname.startsWith('qa.')
        : false; // Server-side detection handled by header injection in scripts/server.ts

    const meta = [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        property: 'og:site_name',
        content: 'TestingWithEkki',
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
        name: 'theme-color',
        content: '#F4F0E8', // Warm Canvas
      },
    ];

    if (isQa) {
      meta.push({ name: 'robots', content: 'noindex, nofollow' });
    }

    return {
      meta,
      links: [
        // Preload critical fonts removed to avoid warnings (loaded via CSS)
        // { rel: 'preload', href: '/fonts/outfit-latin-400.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
        // { rel: 'preload', href: '/fonts/outfit-latin-600.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
        // Deferred loading for Lora (reading font - not critical for LCP)
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossOrigin: 'anonymous',
        },
        {
          rel: 'icon',
          href: '/logo-icon-192.png',
          type: 'image/png',
          sizes: '192x192',
        },
        {
          rel: 'apple-touch-icon',
          href: '/logo-icon-192.png',
          sizes: '192x192',
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

// RootComponent owns the interactive app shell so Header/Footer event handlers
// hydrate with the route tree while the document/providers remain stable.
function RootComponent() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

// RootDocument is the document/provider shell that persists during navigation.
function RootDocument({ children }: { children: React.ReactNode }) {
  const context = Route.useRouteContext();
  const queryClient = context?.queryClient;
  const params = useParams({ strict: false });
  const locale = params.locale || 'en';
  const pathname = context?.pathname || '';
  const forcedTheme = isLocaleProductPath(pathname) ? 'light' : undefined;
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

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
                const pathname = window.location.pathname;
                const isLocaleProduct = ${isLocaleProductPath.toString()}(pathname);
                const theme = isLocaleProduct
                    ? 'light'
                    : (localStorage.getItem('twe-theme') || 'system');
                let resolved = theme;
                if (theme === 'system') {
                  resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.classList.add(resolved);
              })();
            `,
          }}
        />
        {/* JSON-LD Organization Schema now managed via head.scripts */}
      </head>
      <body
        className="scrollbar-thin"
        data-app-hydrated={isHydrated ? 'true' : 'false'}
        suppressHydrationWarning
      >
        <QueryClientProvider client={queryClient}>
          <ThemeProvider {...(forcedTheme ? { forcedTheme } : {})}>
            {children}
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
    /\/practice\/[^/]+$/.test(location.pathname) &&
    !location.pathname.includes('/admin/');

  return (
    <>
      {consent === 'granted' && (
        <GoogleAnalytics
          {...omitUndefined({ measurementId: auth?.gaMeasurementId })}
        />
      )}
      <CookieConsent
        onConsentChange={handleConsentChange}
        initialConsent={consent}
      />
      <div className="flex flex-col min-h-screen">
        <Header session={auth || null} />
        <main className="flex-1">
          <Suspense fallback={<div className="min-h-[50vh]" />}>
            {children}
          </Suspense>
        </main>
        {!isChallengeDetail && <Footer />}
        <Toaster position="top-right" theme="system" closeButton />
      </div>
    </>
  );
}
