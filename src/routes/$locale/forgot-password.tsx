import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { forgetPassword } from '@/lib/auth.client';
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
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/$locale/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { locale } = useParams({ from: '/$locale/forgot-password' });
  const { t } = useTranslation(['auth', 'common']);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(t('auth:errors.emailRequired'));
      return;
    }

    setIsLoading(true);

    try {
      await forgetPassword({
        email,
        redirectTo: `${window.location.origin}/${locale}/reset-password`,
      });
      setIsSubmitted(true);
    } catch {
      // Don't reveal if email exists or not for security
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md glass-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-green-500/10 w-fit">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {t('auth:verification.title')}
            </CardTitle>
            <CardDescription className="text-base">
              {t('auth:forgotPassword.successDescription', { email })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {t('auth:forgotPassword.successNote')}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsSubmitted(false)}
            >
              {t('auth:forgotPassword.tryAnother')}
            </Button>
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold gradient-text">
            {t('auth:forgotPassword.title')}
          </CardTitle>
          <CardDescription>
            {t('auth:forgotPassword.description')}
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
              <Label htmlFor="email">{t('common:labels.emailAddress')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('common:placeholders.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                t('auth:forgotPassword.sendButton')
              )}
            </Button>

            <Link
              to="/$locale/login"
              params={{ locale }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common:actions.backToSignIn')}
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
