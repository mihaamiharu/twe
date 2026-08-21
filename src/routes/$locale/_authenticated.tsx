/**
 * Pathless layout route for protected pages
 * Redirects unauthenticated users to login page
 */
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/$locale/_authenticated')({
  beforeLoad: ({ context, location, params }) => {
    const { auth } = context;
    if (!auth?.isAuthenticated) {
      redirect({
        to: '/$locale/login',
        params: { locale: params.locale },
        search: { redirect: location.pathname },
        throw: true,
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <Outlet />;
}
