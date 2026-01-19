import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useParams,
  useLocation,
} from '@tanstack/react-router';
import { Suspense, useEffect, useRef } from 'react';
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
import { Toaster } from 'sonner';
import appCss from '@/styles.css?url';
import i18n from '@/lib/i18n';

// Export context type for child routes
export interface RootContext {
  auth?: AuthSession;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RootContext>()({
  beforeLoad: async ({ context }) => {
    // Optimization: Check cache first to avoid blocking every navigation
    const auth = await context.queryClient.ensureQueryData(authQueryOptions);
    return { auth };
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
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: i18n.t('common:seo.ogTitle'),
      },
      {
        name: 'twitter:description',
        content: i18n.t('common:seo.ogDescription'),
      },
    ],
    links: [
      // Preload critical self-hosted fonts (non-blocking)
      { rel: 'preload', href: '/fonts/outfit-latin-400.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { rel: 'preload', href: '/fonts/outfit-latin-600.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
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

  // Preload the avatar image to prevent flicker
  // This runs once when we have the user's image URL
  useEffect(() => {
    const imageUrl = auth?.user?.image;
    if (imageUrl && imageUrl !== preloadedImageRef.current) {
      preloadedImageRef.current = imageUrl;
      const img = new Image();
      img.src = imageUrl;
    }
  }, [auth?.user?.image]);

  // Check if current route is a challenge detail page
  const isChallengeDetail =
    /\/challenges\/[^/]+$/.test(location.pathname) &&
    !location.pathname.includes('/admin/');

  return (
    <>
      <GoogleAnalytics measurementId={auth?.gaMeasurementId} />
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
