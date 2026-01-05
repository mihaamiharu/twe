import { createFileRoute, redirect, useNavigate, useParams } from '@tanstack/react-router';
import { RegisterForm } from '@/components/auth';
import type { RootContext } from '../__root';

export const Route = createFileRoute('/$locale/register')({
    beforeLoad: ({ context, params }) => {
        const { auth } = context as RootContext;
        if (auth.isAuthenticated) {
            throw redirect({
                to: '/$locale/' as any,
                params: { locale: params.locale as any }
            });
        }
    },
    component: RegisterPage,
});

import { useSession } from '@/lib/auth.client';
import { useEffect } from 'react';

function RegisterPage() {
    const { locale } = useParams({ from: '/$locale/register' });
    const navigate = useNavigate();
    const { data: session } = useSession();

    useEffect(() => {
        if (session?.user) {
            void navigate({ to: '/$locale/' as any, params: { locale: locale as any } });
        }
    }, [session, navigate, locale]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="w-full max-w-md space-y-6 animate-fade-in relative z-10">
                <RegisterForm
                    onLoginClick={() => { void navigate({ to: '/$locale/login' as any, params: { locale: locale as any } }) }}
                // No onSuccess needed as RegisterForm handles the "Check Email" state internally
                />
            </div>
        </div>
    );
}
