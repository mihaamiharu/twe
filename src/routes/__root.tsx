import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
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
        title: 'TestingWithEkki - Learn Testing Skills',
      },
      {
        name: 'description',
        content: 'Learn testing skills through interactive tutorials and coding challenges',
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
  return (
    <html lang="en" suppressHydrationWarning>
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
