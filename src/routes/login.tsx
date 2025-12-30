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

function LoginPage() {
    const navigate = useNavigate();

    const handleLoginSuccess = () => {
        // Redirect to original path if available, otherwise home
        const searchParams = new URLSearchParams(window.location.search);
        const redirectUrl = searchParams.get('redirect');

        if (redirectUrl) {
            navigate({ to: redirectUrl });
        } else {
            navigate({ to: '/' });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-6 animate-fade-in">
                <LoginForm
                    onSuccess={handleLoginSuccess}
                    onRegisterClick={() => navigate({ to: '/register' })}
                />
            </div>
        </div>
    );
}

