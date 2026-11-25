import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { dehydrate, hydrate } from '@tanstack/react-query';
import { routeTree } from './routeTree.gen';

import i18n from './lib/i18n';
import { isValidLocale } from './lib/i18n/settings';
import { getQueryClient } from './lib/query-client';
import {
  parseDehydratedQueryState,
  resolveViewTransitionTypes,
  serializeDehydratedQueryState,
} from './lib/router-navigation';

export const createRouter = () => {
  const queryClient = getQueryClient();
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    dehydrate: () =>
      serializeDehydratedQueryState(
        dehydrate(queryClient, {
          shouldDehydrateQuery: (query) => query.state.status === 'success',
          shouldDehydrateMutation: () => false,
        }),
      ),
    hydrate: (dehydrated) => {
      // A custom hydrate hook runs before route `$locale`'s beforeLoad can switch the
      // language, so align i18n with the SSR-rendered locale first. Otherwise the
      // shared header hydrates in English on localized pages (hydration mismatch).
      const routeLocale = window.location.pathname.split('/')[1] ?? '';
      if (isValidLocale(routeLocale) && i18n.language !== routeLocale) {
        void i18n.changeLanguage(routeLocale);
      }
      const state = parseDehydratedQueryState(dehydrated);
      if (state) {
        hydrate(queryClient, state);
      }
    },
    // Cross-fade real page changes only; search-param updates (filters, tabs),
    // background tabs, reduced-motion mode, and the challenge workspace stay instant.
    defaultViewTransition: {
      types: ({ fromLocation, toLocation, pathChanged }) =>
        resolveViewTransitionTypes({
          fromPathname: fromLocation?.pathname,
          toPathname: toLocation.pathname,
          pathChanged,
          visibilityState:
            typeof document === 'undefined' ? undefined : document.visibilityState,
          prefersReducedMotion:
            typeof window !== 'undefined' &&
            typeof window.matchMedia === 'function'
              ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
              : false,
        }),
    },
    context: {
      queryClient,
    },
  });

  return router;
};

export const getRouter = createRouter;

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}

export default createRouter;
