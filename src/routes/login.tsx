import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { LoginForm, RegisterForm, GoogleOAuthButton } from '@/components/auth';
import { Separator } from '@/components/ui/separator';

export const Route = createFileRoute('/login')({
    component: LoginPage,
});

function LoginPage() {
    const [mode, setMode] = useState<'login' | 'register'>('login');

    const handleSuccess = () => {
        // Redirect to home or intended destination
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-6 animate-fade-in">
                {mode === 'login' ? (
                    <LoginForm
                        onSuccess={handleSuccess}
                        onRegisterClick={() => setMode('register')}
                    />
                ) : (
                    <RegisterForm
                        onSuccess={handleSuccess}
                        onLoginClick={() => setMode('login')}
                    />
                )}

                <div className="relative">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-sm text-muted-foreground">
                        Or continue with
                    </span>
                </div>

                <GoogleOAuthButton callbackURL="/" />
            </div>
        </div>
    );
}
