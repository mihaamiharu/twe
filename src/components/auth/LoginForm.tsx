import { useState } from 'react';
import { signIn } from '@/lib/auth.client';
import { signInSchema, type SignInInput } from '@/lib/validations';
import './auth.css';

interface LoginFormProps {
    onSuccess?: () => void;
    onRegisterClick?: () => void;
}

export function LoginForm({ onSuccess, onRegisterClick }: LoginFormProps) {
    const [formData, setFormData] = useState<SignInInput>({
        email: '',
        password: '',
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
        const result = signInSchema.safeParse(formData);
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
            const response = await signIn.email({
                email: formData.email,
                password: formData.password,
            });

            if (response.error) {
                setFormError(response.error.message || 'Invalid email or password');
                return;
            }

            onSuccess?.();
        } catch (err) {
            setFormError('An unexpected error occurred. Please try again.');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            <h2 className="auth-form-title">Welcome Back</h2>
            <p className="auth-form-subtitle">Sign in to continue your learning journey</p>

            {formError && <div className="form-error">{formError}</div>}

            <div className="form-group">
                <label className="form-label" htmlFor="email">
                    Email
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    autoComplete="email"
                />
                {errors.email && <p className="field-error">{errors.email}</p>}
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="password">
                    Password
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    autoComplete="current-password"
                />
                {errors.password && <p className="field-error">{errors.password}</p>}
            </div>

            <button type="submit" className="auth-button" disabled={isLoading}>
                {isLoading ? <span className="spinner" /> : 'Sign In'}
            </button>

            {onRegisterClick && (
                <p className="auth-link-section">
                    Don&apos;t have an account?{' '}
                    <button type="button" className="auth-link" onClick={onRegisterClick}>
                        Sign up
                    </button>
                </p>
            )}
        </form>
    );
}

export default LoginForm;
