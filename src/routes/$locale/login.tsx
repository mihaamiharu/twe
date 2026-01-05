import { createFileRoute, redirect, useNavigate, useParams } from '@tanstack/react-router';
import { LoginForm } from '@/components/auth';
import type { RootContext } from '../__root';

export const Route = createFileRoute('/$locale/login')({
    beforeLoad: ({ context, params }) => {
        const { auth } = context as RootContext;
        if (auth.isAuthenticated) {
            throw redirect({
                to: '/$locale/' as any,
                params: { locale: params.locale as any }
            });
        }
    },
    component: LoginPage,
});

import { useSession } from '@/lib/auth.client';
import { useEffect } from 'react';

function LoginPage() {
    const { locale } = useParams({ from: '/$locale/login' });
    const navigate = useNavigate();
    const { data: session } = useSession();

    useEffect(() => {
        if (session?.user) {
            void navigate({ to: '/$locale/' as any, params: { locale: locale as any } });
        }
    }, [session, navigate, locale]);

    const handleLoginSuccess = () => {
        // Redirect to original path if available, otherwise home
        const searchParams = new URLSearchParams(window.location.search);
        const redirectUrl = searchParams.get('redirect');

        if (redirectUrl) {
            void navigate({ to: redirectUrl as any });
        } else {
            void navigate({ to: '/$locale/' as any, params: { locale: locale as any } });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-6 animate-fade-in">
                <LoginForm
                    onSuccess={handleLoginSuccess}
                    onRegisterClick={() => { void navigate({ to: '/$locale/register' as any, params: { locale: locale as any } }) }}
                />
            </div>
        </div>
    );
}

