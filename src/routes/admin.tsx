import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AdminLayout } from '@/components/admin/admin-layout';

export const Route = createFileRoute('/admin')({
    loader: ({ context }) => {
        const session = context.auth;
        if (
            !session?.user ||
            (session.user as { role?: string }).role !== 'ADMIN'
        ) {
            throw redirect({
                to: '/',
            });
        }
    },
    component: () => (
        <AdminLayout>
            <Outlet />
        </AdminLayout>
    ),
});
