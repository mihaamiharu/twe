import { useState, useEffect, useCallback } from 'react';
import { signUp } from '@/lib/auth.client';
import { resendVerification } from '@/lib/auth.fn';
import { signUpSchema, type SignUpInput } from '@/lib/validations';
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
import { cn } from '@/lib/utils';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react';

interface RegisterFormProps {
    onSuccess?: () => void;
    onLoginClick?: () => void;
}

export function RegisterForm({ onSuccess, onLoginClick }: RegisterFormProps) {
    const [formData, setFormData] = useState<SignUpInput>({
        email: '',
        password: '',
        name: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [registrationComplete, setRegistrationComplete] = useState(false);

    // Resend verification state
    const [isResending, setIsResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [resendError, setResendError] = useState('');

    // Cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;

        const timer = setTimeout(() => {
            setResendCooldown((prev) => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [resendCooldown]);

    // Resend verification email handler
    const handleResendEmail = useCallback(async () => {
        if (isResending || resendCooldown > 0) return;

        setIsResending(true);
        setResendStatus('idle');
        setResendError('');

        try {
            const response = await resendVerification({
                data: { email: formData.email }
            });

            if (!response.success) {
                setResendStatus('error');
                setResendError(response.error || 'Failed to resend email');
                if ((response as any).cooldownRemaining) {
                    setResendCooldown((response as any).cooldownRemaining);
                }
            } else {
                setResendStatus('success');
                setResendCooldown(60); // Start 60 second cooldown
            }
        } catch (err) {
            setResendStatus('error');
            setResendError('An error occurred. Please try again.');
        } finally {
            setIsResending(false);
        }
    }, [formData.email, isResending, resendCooldown]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear field error on change
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setErrors({});

        // Validate with Zod
        const result = signUpSchema.safeParse(formData);
        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            for (const error of result.error.issues) {
                const path = error.path.join('.');
                if (!fieldErrors[path]) {
                    fieldErrors[path] = error.message;
                }
            }
            setErrors(fieldErrors);
            return;
        }

        setIsLoading(true);

        try {
            const response = await signUp.email({
                email: formData.email,
                password: formData.password,
                name: formData.name,
            });

            if (response.error) {
                setFormError(response.error.message || 'Registration failed');
                return;
            }

            // Show email verification message
            setRegistrationComplete(true);
            onSuccess?.();
        } catch (err) {
            setFormError('An unexpected error occurred. Please try again.');
            console.error('Registration error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Show success message after registration
    if (registrationComplete) {
        return (
            <Card className="w-full max-w-md glass-card">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold gradient-text">
                        Check Your Email
                    </CardTitle>
                    <CardDescription className="text-base">
                        We've sent a verification link to
                    </CardDescription>
                </CardHeader>

                <CardContent className="text-center space-y-4">
                    <p className="font-medium text-lg break-all">
                        {formData.email}
                    </p>

                    <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>Click the link in the email to verify your account</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>The link expires in 24 hours</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>Check your spam folder if you don't see it</span>
                        </div>
                    </div>

                    {/* Resend Email Section */}
                    <div className="pt-2 border-t border-border">
                        {resendStatus === 'success' ? (
                            <p className="text-sm text-green-500 flex items-center justify-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                Verification email sent!
                            </p>
                        ) : resendStatus === 'error' ? (
                            <p className="text-sm text-destructive">{resendError}</p>
                        ) : null}

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResendEmail}
                            disabled={isResending || resendCooldown > 0}
                            className="mt-2 text-muted-foreground hover:text-foreground"
                        >
                            {isResending ? (
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            {resendCooldown > 0
                                ? `Resend in ${resendCooldown}s`
                                : "Didn't receive it? Resend email"}
                        </Button>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4">
                    {onLoginClick && (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={onLoginClick}
                        >
                            Back to Sign In
                        </Button>
                    )}
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md glass-card">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold gradient-text">
                    Create Account
                </CardTitle>
                <CardDescription>
                    Start your learning journey today
                </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {formError && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {formError}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={isLoading}
                            autoComplete="name"
                            className={cn(errors.name && 'border-destructive')}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isLoading}
                            autoComplete="email"
                            className={cn(errors.email && 'border-destructive')}
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Minimum 8 characters"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isLoading}
                            autoComplete="new-password"
                            className={cn(errors.password && 'border-destructive')}
                        />
                        {errors.password && (
                            <p className="text-sm text-destructive">{errors.password}</p>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                            'Create Account'
                        )}
                    </Button>

                    {onLoginClick && (
                        <p className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <button
                                type="button"
                                className="text-primary hover:underline font-medium"
                                onClick={onLoginClick}
                            >
                                Sign in
                            </button>
                        </p>
                    )}
                </CardFooter>
            </form>
        </Card>
    );
}

export default RegisterForm;

