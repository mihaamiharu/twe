import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AdminLayout } from '@/components/admin/admin-layout';

export const Route = createFileRoute('/admin')({
    loader: ({ context }) => {
        const session = context.auth;
        if (
            !session?.user ||
            session.user.role !== 'ADMIN'
        ) {
            redirect({
                to: '/',
                throw: true,
            });
        }
    },
    component: () => (
        <AdminLayout>
            <Outlet />
        </AdminLayout>
    ),
    head: () => ({
        meta: [
            {
                name: 'robots',
                content: 'noindex, nofollow',
            },
        ],
    }),
});
