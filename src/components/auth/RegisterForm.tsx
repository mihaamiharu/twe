import { useState } from 'react';
import { signUp } from '@/lib/auth.client';
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
            for (const error of result.error.errors) {
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

            onSuccess?.();
        } catch (err) {
            setFormError('An unexpected error occurred. Please try again.');
            console.error('Registration error:', err);
        } finally {
            setIsLoading(false);
        }
    };

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
