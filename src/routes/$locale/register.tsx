import { createFileRoute, redirect, useNavigate, useParams } from '@tanstack/react-router';
import { RegisterForm } from '@/components/auth';
import type { RootContext } from '../__root';
import { localeParams, LocaleRoutes } from '@/lib/navigation';

export const Route = createFileRoute('/$locale/register')({
    beforeLoad: ({ context, params }) => {
        const { auth } = context as RootContext;
        if (auth.isAuthenticated) {
            throw redirect({
                to: LocaleRoutes.home,
                params: localeParams(params.locale)
            });
        }
    },
    component: RegisterPage,
});

import { useEffect } from 'react';

function RegisterPage() {
    const { locale } = useParams({ from: '/$locale/register' });
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="w-full max-w-md space-y-6 animate-fade-in relative z-10">
                <RegisterForm
                    onLoginClick={() => { void navigate({ to: LocaleRoutes.login, params: localeParams(locale) }) }}
                // No onSuccess needed as RegisterForm handles the "Check Email" state internally
                />
            </div>
        </div>
    );
}
