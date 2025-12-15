import { useState } from 'react';
import { signUp } from '@/lib/auth.client';
import { signUpSchema, type SignUpInput } from '@/lib/validations';
import './auth.css';

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
        <form className="auth-form" onSubmit={handleSubmit}>
            <h2 className="auth-form-title">Create Account</h2>
            <p className="auth-form-subtitle">Start your learning journey today</p>

            {formError && <div className="form-error">{formError}</div>}

            <div className="form-group">
                <label className="form-label" htmlFor="name">
                    Name
                </label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                    autoComplete="name"
                />
                {errors.name && <p className="field-error">{errors.name}</p>}
            </div>

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
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    autoComplete="new-password"
                />
                {errors.password && <p className="field-error">{errors.password}</p>}
            </div>

            <button type="submit" className="auth-button" disabled={isLoading}>
                {isLoading ? <span className="spinner" /> : 'Create Account'}
            </button>

            {onLoginClick && (
                <p className="auth-link-section">
                    Already have an account?{' '}
                    <button type="button" className="auth-link" onClick={onLoginClick}>
                        Sign in
                    </button>
                </p>
            )}
        </form>
    );
}

export default RegisterForm;
