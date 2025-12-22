/**
 * Pathless layout route for protected pages
 * Redirects unauthenticated users to login page
 */
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import type { RootContext } from './__root';

export const Route = createFileRoute('/_authenticated')({
    beforeLoad: ({ context, location }) => {
        const { auth } = context as RootContext;
        if (!auth.isAuthenticated) {
            throw redirect({
                to: '/login',
                search: { redirect: location.pathname },
            });
        }
    },
    component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
    return <Outlet />;
}
