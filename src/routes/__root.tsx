import { HeadContent, Outlet, Scripts, createRootRoute, useParams } from '@tanstack/react-router';
import { type AuthSession } from '@/lib/auth.fn';
import { authQueryOptions } from '@/lib/auth.query';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

import { NotFound } from '@/components/NotFound';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ThemeProvider } from '@/components/theme-provider';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { Toaster } from 'sonner';
import appCss from '@/styles.css?url';
import i18n from '@/lib/i18n';
import { useTranslation } from 'react-i18next';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      logger.error(`Query Error: ${JSON.stringify(query.queryKey)}`, error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      logger.error(`Mutation Error:`, error);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Export context type for child routes
export interface RootContext {
  auth: AuthSession;
}

export const Route = createRootRoute({
  beforeLoad: async () => {
    // Optimization: Check cache first to avoid blocking every navigation
    const auth = await queryClient.ensureQueryData(authQueryOptions);
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
      {
        rel: 'icon',
        href: '/logo.jpg',
        type: 'image/jpeg',
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

function RootComponent() {
  return (
    <ThemeProvider>
      <GoogleAnalytics />
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <Toaster position="bottom-right" theme="system" />
      </div>
    </ThemeProvider>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const params = useParams({ strict: false }) as { locale?: string };
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
          {children}
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
