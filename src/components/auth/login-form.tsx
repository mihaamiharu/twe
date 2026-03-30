import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { signIn } from '@/lib/auth.client';
import { signInSchema, type SignInInput } from '@/lib/validations';
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
import { localeParams, LocaleRoutes } from '@/lib/navigation';
import { GoogleOAuthButton } from '@/components/auth/google-oauth-button';

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
}

export function LoginForm({ onSuccess, onRegisterClick }: LoginFormProps) {
  const { t } = useTranslation(['auth', 'common']);
  const { locale } = useParams({ strict: false });
  const queryClient = useQueryClient();
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
    // eslint-disable-next-line security/detect-object-injection
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        // eslint-disable-next-line security/detect-object-injection
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
      for (const error of result.error.issues) {
        const path = error.path.join('.');
        // eslint-disable-next-line security/detect-object-injection
        if (!fieldErrors[path]) {
          // eslint-disable-next-line security/detect-object-injection
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
        setFormError(
          response.error.message || t('auth:errors.invalidCredentials'),
        );
        return;
      }

      // Invalidate auth query to trigger router re-check
      await queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });

      onSuccess?.();
    } catch (err) {
      setFormError(t('common:messages.error'));
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md glass-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold gradient-text">
          {t('auth:login.title')}
        </CardTitle>
        <CardDescription>{t('auth:login.description')}</CardDescription>
      </CardHeader>

      <form onSubmit={(e) => void handleSubmit(e)} method="post">
        <CardContent className="space-y-6">
          {formError && (
            <div
              role="alert"
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              {formError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{t('common:labels.email')}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t('common:placeholders.email')}
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('common:labels.password')}</Label>
              <Link
                to={LocaleRoutes.forgotPassword}
                params={localeParams(locale || 'en')}
                className="text-xs text-primary hover:underline"
              >
                {t('auth:login.forgotPassword')}
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={t('common:placeholders.password')}
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="current-password"
              className={cn(errors.password && 'border-destructive')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              t('common:actions.signIn')
            )}
          </Button>

          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {t('auth:login.orContinueWith')}
              </span>
            </div>
          </div>

          <GoogleOAuthButton
            callbackURL={`/${locale}`}
            label={t('auth:login.googleButton')}
          />

          {onRegisterClick && (
            <p className="text-center text-sm text-muted-foreground">
              {t('auth:login.noAccount')}{' '}
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={onRegisterClick}
              >
                {t('common:actions.signUp')}
              </button>
            </p>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

export default LoginForm;
