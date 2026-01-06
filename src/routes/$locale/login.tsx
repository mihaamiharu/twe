import { createFileRoute, redirect, useNavigate, useParams } from '@tanstack/react-router';
import { LoginForm } from '@/components/auth';
import type { RootContext } from '../__root';
import { localeParams, LocaleRoutes } from '@/lib/navigation';

export const Route = createFileRoute('/$locale/login')({
    beforeLoad: ({ context, params }) => {
        const { auth } = context as RootContext;
        if (auth.isAuthenticated) {
            throw redirect({
                to: LocaleRoutes.home,
                params: localeParams(params.locale)
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
            void navigate({ to: LocaleRoutes.home, params: localeParams(locale) });
        }
    }, [session, navigate, locale]);

    const handleLoginSuccess = () => {
        // Redirect to original path if available, otherwise home
        const searchParams = new URLSearchParams(window.location.search);
        const redirectUrl = searchParams.get('redirect');

        if (redirectUrl) {
            void navigate({ to: redirectUrl as string });
        } else {
            void navigate({ to: LocaleRoutes.home, params: localeParams(locale) });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-6 animate-fade-in">
                <LoginForm
                    onSuccess={handleLoginSuccess}
                    onRegisterClick={() => { void navigate({ to: LocaleRoutes.register, params: localeParams(locale) }) }}
                />
            </div>
        </div>
    );
}

