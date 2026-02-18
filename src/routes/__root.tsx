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
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { NotFound } from '@/components/NotFound';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ThemeProvider } from '@/components/theme-provider';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { CookieConsent } from '@/components/CookieConsent';
import { Toaster } from 'sonner';
import appCss from '@/styles.css?url';
import i18n from '@/lib/i18n';
import { organizationSchema } from '@/lib/seo';
import { getConsent } from '@/server/consent.fn';

// Export context type for child routes
export interface RootContext {
  auth?: AuthSession;
  queryClient: QueryClient;
  consent?: 'granted' | 'denied' | null;
}

import { DefaultErrorComponent } from "@/components/DefaultErrorComponent";

export const Route = createRootRouteWithContext<RootContext>()({
  defaultErrorComponent: DefaultErrorComponent,
  beforeLoad: async ({ context }) => {
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
        consent = cookieValue as 'granted' | 'denied';
      }
    } else {
      // Server-side: read via Server Function
      consent = await getConsent();
    }

    return { auth, consent };
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: i18n.t('common:seo.title'),
      },
      {
        name: 'description',
        content: i18n.t('common:seo.description'),
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
        content: '#09090b', // Zinc-950 (background color)
      },
    ],
    links: [
      // Preload critical fonts removed to avoid warnings (loaded via CSS)
      // { rel: 'preload', href: '/fonts/outfit-latin-400.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      // { rel: 'preload', href: '/fonts/outfit-latin-600.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      // Deferred loading for Lora (reading font - not critical for LCP)
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
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
  }),

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
                const theme = localStorage.getItem('twe-theme') || 'system';
                let resolved = theme;
                if (theme === 'system') {
                  resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.classList.add(resolved);
              })();
            `,
          }}
        />
        {/* JSON-LD Organization Schema for SEO */}
        {/* JSON-LD Organization Schema for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema)
          }}
        />
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
  const [consent, setConsent] = useState<'granted' | 'denied' | null>(context?.consent || null);

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
      {consent === 'granted' && <GoogleAnalytics measurementId={auth?.gaMeasurementId} />}
      <CookieConsent onConsentChange={handleConsentChange} initialConsent={consent} />
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
