import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { LoginForm } from '@/components/auth';

export const Route = createFileRoute('/login')({
    beforeLoad: ({ context }) => {
        if (context.auth.isAuthenticated) {
            throw redirect({
                to: '/',
            });
        }
    },
    component: LoginPage,
});

import { useSession } from '@/lib/auth.client';
import { useEffect } from 'react';

function LoginPage() {
    const navigate = useNavigate();
    const { data: session } = useSession();

    useEffect(() => {
        if (session?.user) {
            void navigate({ to: '/' });
        }
    }, [session, navigate]);

    const handleLoginSuccess = () => {
        // Redirect to original path if available, otherwise home
        const searchParams = new URLSearchParams(window.location.search);
        const redirectUrl = searchParams.get('redirect');

        if (redirectUrl) {
            void navigate({ to: redirectUrl });
        } else {
            void navigate({ to: '/' });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-6 animate-fade-in">
                <LoginForm
                    onSuccess={handleLoginSuccess}
                    onRegisterClick={() => { void navigate({ to: '/register' }) }}
                />
            </div>
        </div>
    );
}

