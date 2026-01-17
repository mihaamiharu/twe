import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { signUp } from '@/lib/auth.client';
import { resendVerification } from '@/server/auth.fn';
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
  const { t } = useTranslation(['auth', 'common']);
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
  const [resendStatus, setResendStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
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
        data: { email: formData.email },
      });

      if (!response.success) {
        setResendStatus('error');
        setResendError(response.error || t('auth:errors.failedToResend'));
        if ((response as { cooldownRemaining?: number }).cooldownRemaining) {
          setResendCooldown(
            (response as { cooldownRemaining?: number }).cooldownRemaining!,
          );
        }
      } else {
        setResendStatus('success');
        setResendCooldown(60); // Start 60 second cooldown
      }
    } catch {
      setResendStatus('error');
      setResendError(t('common:messages.error'));
    } finally {
      setIsResending(false);
    }
  }, [formData.email, isResending, resendCooldown]);

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
    const result = signUpSchema.safeParse(formData);
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
      const response = await signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      if (response.error) {
        setFormError(
          response.error.message || t('auth:errors.registrationFailed'),
        );
        return;
      }

      // Show email verification message
      setRegistrationComplete(true);
      onSuccess?.();
    } catch (err) {
      setFormError(t('common:messages.error'));
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
            {t('auth:verification.title')}
          </CardTitle>
          <CardDescription className="text-base">
            {t('auth:verification.description')}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <p className="font-medium text-lg break-all">{formData.email}</p>

          <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>{t('auth:verification.instruction1')}</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>{t('auth:verification.instruction2')}</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>{t('auth:verification.instruction3')}</span>
            </div>
          </div>

          {/* Resend Email Section */}
          <div className="pt-2 border-t border-border">
            {resendStatus === 'success' ? (
              <p className="text-sm text-green-500 flex items-center justify-center gap-1">
                <CheckCircle className="h-4 w-4" />
                {t('auth:verification.resentSuccess')}
              </p>
            ) : resendStatus === 'error' ? (
              <p className="text-sm text-destructive">{resendError}</p>
            ) : null}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleResendEmail()}
              disabled={isResending || resendCooldown > 0}
              className="mt-2 text-muted-foreground hover:text-foreground"
            >
              {isResending ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {resendCooldown > 0
                ? t('auth:verification.resendCooldown', {
                  seconds: resendCooldown,
                })
                : t('auth:verification.resendButton')}
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          {onLoginClick && (
            <Button variant="outline" className="w-full" onClick={onLoginClick}>
              {t('common:actions.backToSignIn')}
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
          {t('auth:register.title')}
        </CardTitle>
        <CardDescription>{t('auth:register.description')}</CardDescription>
      </CardHeader>

      <form onSubmit={(e) => void handleSubmit(e)}>
        <CardContent className="space-y-4">
          {formError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">{t('common:labels.name')}</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder={t('common:placeholders.name')}
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
            <Label htmlFor="password">{t('common:labels.password')}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={t('common:placeholders.passwordMin')}
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

        <CardFooter className="flex flex-col gap-4 pt-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              t('common:actions.signUp')
            )}
          </Button>

          {onLoginClick && (
            <p className="text-center text-sm text-muted-foreground">
              {t('auth:register.alreadyHaveAccount')}{' '}
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={onLoginClick}
              >
                {t('common:actions.signIn')}
              </button>
            </p>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

export default RegisterForm;
