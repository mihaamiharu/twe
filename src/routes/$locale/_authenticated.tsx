/**
 * Pathless layout route for protected pages
 * Redirects unauthenticated users to login page
 */
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import type { RootContext } from '../__root';

export const Route = createFileRoute('/$locale/_authenticated')({
  beforeLoad: ({ context, location, params }) => {
    const { auth } = context as RootContext;
    if (!auth.isAuthenticated) {
      throw redirect({
        to: '/$locale/login',
        params: { locale: params.locale },
        search: { redirect: location.pathname },
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <Outlet />;
}
