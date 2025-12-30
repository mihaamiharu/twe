import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { RegisterForm } from '@/components/auth';

export const Route = createFileRoute('/register')({
    beforeLoad: ({ context }) => {
        if (context.auth.isAuthenticated) {
            throw redirect({
                to: '/',
            });
        }
    },
    component: RegisterPage,
});

function RegisterPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="w-full max-w-md space-y-6 animate-fade-in relative z-10">
                <RegisterForm
                    onLoginClick={() => navigate({ to: '/login' })}
                // No onSuccess needed as RegisterForm handles the "Check Email" state internally
                />
            </div>
        </div>
    );
}
