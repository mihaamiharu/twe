import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

import { getQueryClient } from './lib/query-client';

// Challenge workspaces and admin are tools, not pages to animate between.
const isWorkspacePath = (pathname: string) =>
  /\/practice\/[^/]+$/.test(pathname) || pathname.startsWith('/admin');

export const createRouter = () => {
  const queryClient = getQueryClient();
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Cross-fade real page changes only; search-param updates (filters, tabs)
    // and the challenge workspace stay instant.
    defaultViewTransition: {
      types: ({ fromLocation, toLocation, pathChanged }) =>
        !fromLocation ||
        !pathChanged ||
        isWorkspacePath(fromLocation.pathname) ||
        isWorkspacePath(toLocation.pathname)
          ? false
          : ['page'],
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
