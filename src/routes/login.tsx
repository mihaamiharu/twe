import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { LoginForm, RegisterForm } from '@/components/auth';

export const Route = createFileRoute('/login')({
    component: LoginPage,
});

function LoginPage() {
    const [mode, setMode] = useState<'login' | 'register'>('login');

    const handleLoginSuccess = () => {
        // Redirect to original path if available, otherwise home
        const searchParams = new URLSearchParams(window.location.search);
        const redirectUrl = searchParams.get('redirect');

        if (redirectUrl) {
            window.location.href = redirectUrl;
        } else {
            window.location.href = '/';
        }
    };

    // For registration, we don't redirect - RegisterForm shows "Check Your Email" message
    // The user will be redirected after clicking the verification link

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-6 animate-fade-in">
                {mode === 'login' ? (
                    <LoginForm
                        onSuccess={handleLoginSuccess}
                        onRegisterClick={() => setMode('register')}
                    />
                ) : (
                    <RegisterForm
                        onLoginClick={() => setMode('login')}
                    // No onSuccess - RegisterForm will show "Check Your Email" message
                    />
                )}
            </div>
        </div>
    );
}

