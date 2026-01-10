import {
  createFileRoute,
  Link,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
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

export const Route = createFileRoute('/$locale/reset-password')({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { locale } = useParams({ from: '/$locale/reset-password' });
  const { t } = useTranslation(['auth', 'common']);
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
              {t('auth:resetPassword.invalidTitle')}
            </CardTitle>
            <CardDescription className="text-base">
              {t('auth:resetPassword.invalidDescription')}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-4">
            <Link
              to="/$locale/forgot-password"
              params={{ locale }}
              className="w-full"
            >
              <Button className="w-full">
                {t('auth:forgotPassword.requestNew')}
              </Button>
            </Link>
            <Link
              to="/$locale/login"
              params={{ locale }}
              className="text-sm text-primary hover:underline text-center"
            >
              {t('common:actions.backToSignIn')}
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
              {t('auth:resetPassword.missingTitle')}
            </CardTitle>
            <CardDescription className="text-base">
              {t('auth:resetPassword.missingDescription')}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-4">
            <Link
              to="/$locale/forgot-password"
              params={{ locale }}
              className="w-full"
            >
              <Button className="w-full">
                {t('auth:forgotPassword.title')}
              </Button>
            </Link>
            <Link
              to="/$locale/login"
              params={{ locale }}
              className="text-sm text-primary hover:underline text-center"
            >
              {t('common:actions.backToSignIn')}
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
      setError(t('auth:errors.registrationFailed')); // General error for missing fields
      return;
    }

    if (password.length < 8) {
      setError(t('auth:errors.passwordMinLength'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth:errors.passwordMismatch'));
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword({
        newPassword: password,
        token,
      });

      if (result.error) {
        setError(result.error.message || t('common:messages.error'));
        return;
      }

      setIsSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        void navigate({ to: '/$locale/login', params: { locale } });
      }, 3000);
    } catch {
      setError(t('common:messages.error'));
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
              {t('auth:resetPassword.successTitle')}
            </CardTitle>
            <CardDescription className="text-base">
              {t('auth:resetPassword.successDescription')}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link to="/$locale/login" params={{ locale }} className="w-full">
              <Button className="w-full">
                {t('common:actions.signInNow')}
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
            {t('auth:resetPassword.title')}
          </CardTitle>
          <CardDescription>
            {t('auth:resetPassword.description')}
          </CardDescription>
        </CardHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
        >
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">{t('common:labels.newPassword')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('common:placeholders.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
                autoFocus
                className={cn(
                  password && password.length < 8 && 'border-amber-500',
                )}
              />
              {password && password.length < 8 && (
                <p className="text-xs text-amber-500">
                  {t('auth:errors.passwordMinLength')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t('common:labels.confirmNewPassword')}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t('common:placeholders.password')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
                className={cn(
                  confirmPassword &&
                    password !== confirmPassword &&
                    'border-destructive',
                )}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">
                  {t('auth:errors.passwordMismatch')}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                t('common:actions.resetPassword')
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
