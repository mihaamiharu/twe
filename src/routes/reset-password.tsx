import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { resetPassword } from '@/lib/auth.client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/reset-password')({
    component: ResetPasswordPage,
});

function ResetPasswordPage() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    // Get token from URL query params
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    // Handle error from URL (e.g., INVALID_TOKEN)
    if (errorParam) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <Card className="w-full max-w-md glass-card">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10 w-fit">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <CardTitle className="text-2xl font-bold">
                            Invalid or Expired Link
                        </CardTitle>
                        <CardDescription className="text-base">
                            This password reset link is invalid or has expired. Please request a new one.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex flex-col gap-4">
                        <Link to="/forgot-password" className="w-full">
                            <Button className="w-full">
                                Request New Link
                            </Button>
                        </Link>
                        <Link
                            to="/login"
                            className="text-sm text-primary hover:underline text-center"
                        >
                            Back to Sign In
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // No token in URL
    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <Card className="w-full max-w-md glass-card">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10 w-fit">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <CardTitle className="text-2xl font-bold">
                            Missing Reset Token
                        </CardTitle>
                        <CardDescription className="text-base">
                            No password reset token found. Please use the link from your email.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex flex-col gap-4">
                        <Link to="/forgot-password" className="w-full">
                            <Button className="w-full">
                                Request Password Reset
                            </Button>
                        </Link>
                        <Link
                            to="/login"
                            className="text-sm text-primary hover:underline text-center"
                        >
                            Back to Sign In
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            const result = await resetPassword({
                newPassword: password,
                token,
            });

            if (result.error) {
                setError(result.error.message || 'Failed to reset password');
                return;
            }

            setIsSuccess(true);
            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate({ to: '/login' });
            }, 3000);
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <Card className="w-full max-w-md glass-card">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 p-3 rounded-full bg-green-500/10 w-fit">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold">
                            Password Reset Successful!
                        </CardTitle>
                        <CardDescription className="text-base">
                            Your password has been updated. Redirecting you to sign in...
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Link to="/login" className="w-full">
                            <Button className="w-full">
                                Sign In Now
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <Card className="w-full max-w-md glass-card">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                        <KeyRound className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold gradient-text">
                        Set New Password
                    </CardTitle>
                    <CardDescription>
                        Enter your new password below. Make sure it's at least 8 characters.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                autoComplete="new-password"
                                autoFocus
                                className={cn(password && password.length < 8 && 'border-amber-500')}
                            />
                            {password && password.length < 8 && (
                                <p className="text-xs text-amber-500">
                                    Password must be at least 8 characters
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isLoading}
                                autoComplete="new-password"
                                className={cn(
                                    confirmPassword && password !== confirmPassword && 'border-destructive'
                                )}
                            />
                            {confirmPassword && password !== confirmPassword && (
                                <p className="text-xs text-destructive">
                                    Passwords do not match
                                </p>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                                'Reset Password'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
