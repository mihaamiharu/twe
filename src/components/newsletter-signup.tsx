import { useId, useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocaleRoutes, localeParams } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { subscribeToNewsletter } from '@/server/newsletter.fn';

export const NewsletterEmailSchema = z.object({
  email: z.string().trim().email(),
});

export type NewsletterSubscribeResponse =
  | { success: true; message: string }
  | { success: false; error: string };

export type NewsletterSubscribeFn = (input: {
  data: { email: string };
}) => Promise<NewsletterSubscribeResponse>;

export interface NewsletterSignupCopy {
  eyebrow?: string;
  title?: string;
  description?: string;
  emailLabel: string;
  emailPlaceholder: string;
  submit: string;
  submitting: string;
  helper?: string;
  invalidEmail: string;
  successTitle: string;
  successMessage: string;
  alreadySubscribedTitle?: string;
  alreadySubscribedMessage?: string;
  rateLimitError: string;
  errorMessage: string;
  reset?: string;
}

const DEFAULT_COPY: NewsletterSignupCopy = {
  emailLabel: 'Email address',
  emailPlaceholder: 'you@example.com',
  submit: 'Subscribe',
  submitting: 'Subscribing...',
  helper: "Double opt-in · We'll send a confirmation link to your inbox. No spam.",
  invalidEmail: 'Please enter a valid email address.',
  successTitle: 'Check your inbox to confirm',
  successMessage:
    'We sent a confirmation link to your email. Click it to finish subscribing.',
  alreadySubscribedTitle: "You're already subscribed",
  alreadySubscribedMessage:
    'This email is already confirmed for TestingWithEkki updates.',
  rateLimitError:
    'Too many signup attempts. Please wait a few minutes before trying again.',
  errorMessage:
    "We couldn't complete your signup right now. Please try again in a moment.",
  reset: 'Use another email',
};

export interface NewsletterSignupProps {
  variant?: 'editorial' | 'compact' | undefined;
  copy?: Partial<NewsletterSignupCopy> | undefined;
  className?: string | undefined;
  testId?: string | undefined;
  subscribeFn?: NewsletterSubscribeFn | undefined;
}

type SubmissionState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; alreadySubscribed: boolean }
  | { status: 'error'; kind: 'validation' | 'rate-limit' | 'server' };

function isRateLimitError(message: string): boolean {
  return /rate limit|too many requests|429/i.test(message);
}

function isAlreadySubscribedMessage(message: string): boolean {
  return /already subscribed/i.test(message);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '';
}

export function NewsletterSignup({
  variant = 'editorial',
  copy,
  className,
  testId = 'newsletter-signup',
  subscribeFn = subscribeToNewsletter,
}: NewsletterSignupProps) {
  const mergedCopy: NewsletterSignupCopy = { ...DEFAULT_COPY, ...copy };
  const inputId = useId();
  const errorId = useId();
  const helperId = useId();

  const [email, setEmail] = useState('');
  const [state, setState] = useState<SubmissionState>({ status: 'idle' });

  const isSubmitting = state.status === 'submitting';
  const isError = state.status === 'error';
  const isSuccess = state.status === 'success';

  const activeErrorText =
    state.status === 'error'
      ? state.kind === 'validation'
        ? mergedCopy.invalidEmail
        : state.kind === 'rate-limit'
          ? mergedCopy.rateLimitError
          : mergedCopy.errorMessage
      : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const parsed = NewsletterEmailSchema.safeParse({ email });
    if (!parsed.success) {
      setState({ status: 'error', kind: 'validation' });
      return;
    }

    setState({ status: 'submitting' });

    try {
      const response = await subscribeFn({
        data: { email: parsed.data.email },
      });

      if (response.success) {
        setEmail('');
        setState({
          status: 'success',
          alreadySubscribed: isAlreadySubscribedMessage(response.message),
        });
        return;
      }

      setState({
        status: 'error',
        kind: isRateLimitError(response.error) ? 'rate-limit' : 'server',
      });
    } catch (error) {
      const rawMessage = getErrorMessage(error);
      setState({
        status: 'error',
        kind: isRateLimitError(rawMessage) ? 'rate-limit' : 'server',
      });
    }
  }

  const describedBy = [
    mergedCopy.helper ? helperId : null,
    isError ? errorId : null,
  ]
    .filter(Boolean)
    .join(' ');

  const isEditorial = variant === 'editorial';

  return (
    <div
      data-testid={testId}
      data-variant={variant}
      className={cn(
        isEditorial
          ? 'rounded-2xl border border-[var(--soft-border)] bg-[var(--paper-surface)] p-5 shadow-sm sm:p-6'
          : 'w-full',
        className,
      )}
    >
      {isEditorial && (mergedCopy.eyebrow || mergedCopy.title || mergedCopy.description) && (
        <div className="mb-4">
          {mergedCopy.eyebrow && (
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--brand-orange-text)]">
              {mergedCopy.eyebrow}
            </p>
          )}
          {mergedCopy.title && (
            <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.03em] text-[var(--graphite)]">
              {mergedCopy.title}
            </h2>
          )}
          {mergedCopy.description && (
            <p className="mt-1.5 text-sm leading-6 text-[var(--muted-graphite)]">
              {mergedCopy.description}
            </p>
          )}
        </div>
      )}

      {isSuccess ? (
        <div
          role="status"
          aria-live="polite"
          data-testid={`${testId}-success`}
          className={cn(
            'rounded-xl border border-brand-success/30 bg-brand-success/10 p-4 text-[var(--graphite)]',
            !isEditorial && 'p-3.5',
          )}
        >
          <div className="flex items-start gap-3">
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-success)]"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--graphite)]">
                {state.alreadySubscribed && mergedCopy.alreadySubscribedTitle
                  ? mergedCopy.alreadySubscribedTitle
                  : mergedCopy.successTitle}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted-graphite)]">
                {state.alreadySubscribed && mergedCopy.alreadySubscribedMessage
                  ? mergedCopy.alreadySubscribedMessage
                  : mergedCopy.successMessage}
              </p>
              {mergedCopy.reset && (
                <button
                  type="button"
                  onClick={() => setState({ status: 'idle' })}
                  className="mt-2.5 inline-flex items-center text-xs font-medium text-[var(--brand-orange-text)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper-surface)]"
                >
                  {mergedCopy.reset}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          noValidate
          aria-busy={isSubmitting}
          className="space-y-2.5"
        >
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label
                htmlFor={inputId}
                className={cn(
                  isEditorial
                    ? 'text-xs font-medium text-[var(--graphite)]'
                    : 'sr-only',
                )}
              >
                {mergedCopy.emailLabel}
              </Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-graphite)]"
                  aria-hidden="true"
                />
                <Input
                  id={inputId}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (state.status === 'error') {
                      setState({ status: 'idle' });
                    }
                  }}
                  placeholder={mergedCopy.emailPlaceholder}
                  disabled={isSubmitting}
                  aria-invalid={isError}
                  aria-describedby={describedBy || undefined}
                  className={cn(
                    'border-[var(--soft-border)] bg-[var(--warm-canvas)] pl-9 text-[var(--graphite)] placeholder:text-[var(--muted-graphite)]/75 focus-visible:border-[var(--brand-orange)] focus-visible:ring-[var(--brand-orange)]/25',
                    isEditorial ? 'h-11' : 'h-10',
                  )}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'shrink-0 bg-[var(--brand-orange-deep)] text-white hover:bg-[#9c3618] active:bg-[#852d14] focus-visible:ring-[var(--brand-orange)]',
                isEditorial ? 'h-11 px-5' : 'h-10 px-4',
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  {mergedCopy.submitting}
                </>
              ) : (
                <>
                  {mergedCopy.submit}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </div>

          {activeErrorText && (
            <div
              id={errorId}
              role="alert"
              aria-live="assertive"
              data-testid={`${testId}-error`}
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive"
            >
              <AlertCircle
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>{activeErrorText}</span>
            </div>
          )}

          {mergedCopy.helper && (
            <p
              id={helperId}
              className="text-xs leading-5 text-[var(--muted-graphite)]"
            >
              {mergedCopy.helper}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

export function LessonCreatorFooter({
  locale,
  subscribeFn,
}: {
  locale: string;
  subscribeFn?: NewsletterSubscribeFn | undefined;
}) {
  const { t } = useTranslation('tutorials');

  return (
    <section
      aria-labelledby="lesson-creator-footer-title"
      data-testid="lesson-creator-footer"
      className="mt-10 rounded-xl border border-[var(--soft-border)] bg-[var(--paper-surface)] p-5 sm:p-6"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--brand-orange-text)]">
        {t('detail.creatorFooter.eyebrow')}
      </p>
      <h2
        id="lesson-creator-footer-title"
        className="mt-2 text-lg font-semibold tracking-[-0.025em] text-[var(--graphite)]"
      >
        {t('detail.creatorFooter.title')}
      </h2>
      <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--muted-graphite)]">
        {t('detail.creatorFooter.description')}
      </p>

      <NewsletterSignup
        variant="compact"
        testId="lesson-newsletter-signup"
        className="mt-4"
        subscribeFn={subscribeFn}
        copy={{
          emailLabel: t('detail.creatorFooter.emailLabel'),
          emailPlaceholder: t('detail.creatorFooter.emailPlaceholder'),
          submit: t('detail.creatorFooter.submit'),
          submitting: t('detail.creatorFooter.submitting'),
          helper: t('detail.creatorFooter.helper'),
          invalidEmail: t('detail.creatorFooter.invalidEmail'),
          successTitle: t('detail.creatorFooter.successTitle'),
          successMessage: t('detail.creatorFooter.successMessage'),
          alreadySubscribedTitle: t(
            'detail.creatorFooter.alreadySubscribedTitle',
          ),
          alreadySubscribedMessage: t(
            'detail.creatorFooter.alreadySubscribedMessage',
          ),
          rateLimitError: t('detail.creatorFooter.rateLimitError'),
          errorMessage: t('detail.creatorFooter.errorMessage'),
          reset: t('detail.creatorFooter.reset'),
        }}
      />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--soft-border)] pt-4 text-sm">
        <p className="text-[var(--muted-graphite)]">
          {t('detail.creatorFooter.mentoringPrompt')}
        </p>
        <Link
          to={LocaleRoutes.contact}
          params={localeParams(locale)}
          className="inline-flex items-center gap-1.5 font-medium text-[var(--brand-orange-text)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper-surface)]"
        >
          {t('detail.creatorFooter.mentoringCta')}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
