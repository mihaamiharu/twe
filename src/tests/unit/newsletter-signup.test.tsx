import { afterEach, describe, expect, it, mock } from 'bun:test';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import labsEn from '@/lib/i18n/resources/en/labs.json';
import labsId from '@/lib/i18n/resources/id/labs.json';
import tutorialsEn from '@/lib/i18n/resources/en/tutorials.json';
import tutorialsId from '@/lib/i18n/resources/id/tutorials.json';
import {
  LessonCreatorFooter,
  NewsletterSignup,
  type NewsletterSubscribeFn,
} from '@/components/newsletter-signup';
import { LabsPage } from '@/routes/$locale/labs';

function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj)
    .flatMap(([key, value]) => {
      const nextKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return collectKeys(value as Record<string, unknown>, nextKey);
      }
      return [nextKey];
    })
    .sort();
}

describe('NewsletterSignup & Labs / Lesson CTAs (Issue #266)', () => {
  afterEach(() => {
    cleanup();
  });

  describe('NewsletterSignup component states', () => {
    it('shows loading state and double-opt-in success confirmation for a valid email', async () => {
      let resolveRequest:
        | ((value: { success: true; message: string }) => void)
        | undefined;
      const subscribeFn = mock<NewsletterSubscribeFn>(
        () =>
          new Promise((resolvePromise) => {
            resolveRequest = resolvePromise;
          }),
      );

      render(
        <NewsletterSignup
          variant="editorial"
          subscribeFn={subscribeFn}
          copy={{
            eyebrow: 'EARLY ACCESS',
            title: 'Join Lab 001 waitlist',
            emailLabel: 'Email address',
            emailPlaceholder: 'you@example.com',
            submit: 'Join waitlist',
            submitting: 'Joining...',
            successTitle: 'Check your inbox to confirm',
            successMessage: 'Click the confirmation link we just sent.',
            reset: 'Use another email',
          }}
        />,
      );

      const input = screen.getByLabelText<HTMLInputElement>('Email address');
      const submitButton = screen.getByRole<HTMLButtonElement>('button', {
        name: 'Join waitlist',
      });

      fireEvent.change(input, { target: { value: '  qa.learner@example.com  ' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(submitButton.disabled).toBe(true);
        expect(input.disabled).toBe(true);
        expect(submitButton.textContent).toContain('Joining...');
      });

      expect(subscribeFn).toHaveBeenCalledTimes(1);
      expect(subscribeFn).toHaveBeenCalledWith({
        data: { email: 'qa.learner@example.com' },
      });

      resolveRequest?.({
        success: true,
        message:
          'Confirmation email sent! Please check your inbox to confirm your subscription.',
      });

      const statusRegion = await screen.findByRole('status');
      expect(statusRegion.textContent).toContain('Check your inbox to confirm');
      expect(statusRegion.textContent).toContain(
        'Click the confirmation link we just sent.',
      );

      fireEvent.click(screen.getByRole('button', { name: 'Use another email' }));
      expect(
        screen.getByLabelText<HTMLInputElement>('Email address').value,
      ).toBe('');
    });

    it('renders already-subscribed copy when backend reports an existing confirmed subscriber', async () => {
      const subscribeFn = mock<NewsletterSubscribeFn>(() =>
        Promise.resolve({
          success: true,
          message: 'You are already subscribed to our newsletter!',
        }),
      );

      render(
        <NewsletterSignup
          variant="compact"
          subscribeFn={subscribeFn}
          copy={{
            alreadySubscribedTitle: "You're already on the list",
            alreadySubscribedMessage: 'This email is already confirmed.',
          }}
        />,
      );

      const input = screen.getByLabelText('Email address');
      fireEvent.change(input, { target: { value: 'confirmed@example.com' } });
      fireEvent.submit(input.closest('form')!);

      const statusRegion = await screen.findByRole('status');
      expect(statusRegion.textContent).toContain("You're already on the list");
      expect(statusRegion.textContent).toContain(
        'This email is already confirmed.',
      );
    });

    it('validates invalid email client-side without calling the server and clears error on edit', () => {
      const subscribeFn = mock<NewsletterSubscribeFn>(() =>
        Promise.resolve({ success: true, message: 'ok' }),
      );

      render(
        <NewsletterSignup
          subscribeFn={subscribeFn}
          copy={{ invalidEmail: 'Please enter a valid email address.' }}
        />,
      );

      const input = screen.getByLabelText('Email address');
      fireEvent.change(input, { target: { value: 'not-an-email' } });
      fireEvent.submit(input.closest('form')!);

      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Please enter a valid email address.');
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(subscribeFn).toHaveBeenCalledTimes(0);

      fireEvent.change(input, { target: { value: 'valid@example.com' } });
      expect(screen.queryByRole('alert')).toBeNull();
      expect(input.getAttribute('aria-invalid')).toBe('false');
    });

    it('shows graceful rate-limit message when server middleware rejects with rate limit error', async () => {
      const subscribeFn = mock<NewsletterSubscribeFn>(() =>
        Promise.reject(
          new Error('Rate limit exceeded. Please try again in 45 minutes.'),
        ),
      );

      render(
        <NewsletterSignup
          subscribeFn={subscribeFn}
          copy={{
            rateLimitError: 'Too many signup attempts. Please wait a bit.',
          }}
        />,
      );

      const input = screen.getByLabelText('Email address');
      fireEvent.change(input, { target: { value: 'qa@example.com' } });
      fireEvent.submit(input.closest('form')!);

      const alert = await screen.findByRole('alert');
      expect(alert.textContent).toContain(
        'Too many signup attempts. Please wait a bit.',
      );
    });

    it('shows graceful error message on unsuccessful server response', async () => {
      const subscribeFn = mock<NewsletterSubscribeFn>(() =>
        Promise.resolve({
          success: false,
          error: 'Failed to subscribe. Please try again later.',
        }),
      );

      render(
        <NewsletterSignup
          subscribeFn={subscribeFn}
          copy={{
            errorMessage: 'Unable to save signup right now.',
          }}
        />,
      );

      const input = screen.getByLabelText('Email address');
      fireEvent.change(input, { target: { value: 'qa@example.com' } });
      fireEvent.submit(input.closest('form')!);

      const alert = await screen.findByRole('alert');
      expect(alert.textContent).toContain('Unable to save signup right now.');
    });
  });

  describe('Labs waitlist & Lesson creator footer integration', () => {
    it('renders the editorial waitlist signup form on /$locale/labs alongside Practice and Learn links', () => {
      render(<LabsPage />);

      const waitlist = screen.getByTestId('labs-waitlist-signup');
      expect(waitlist.getAttribute('data-variant')).toBe('editorial');
      expect(screen.getByText('waitlist.title')).toBeTruthy();
      expect(screen.getByLabelText('waitlist.emailLabel')).toBeTruthy();
      expect(
        screen.getByRole('button', { name: 'waitlist.submit' }),
      ).toBeTruthy();
      expect(screen.getByText('actions.practice')).toBeTruthy();
      expect(screen.getByText('actions.learn')).toBeTruthy();
    });

    it('renders the compact newsletter signup and 1:1 mentoring link in LessonCreatorFooter', () => {
      const { container } = render(<LessonCreatorFooter locale="id" />);

      const footer = screen.getByTestId('lesson-creator-footer');
      expect(footer).toBeTruthy();

      const signup = screen.getByTestId('lesson-newsletter-signup');
      expect(signup.getAttribute('data-variant')).toBe('compact');
      expect(
        screen.getByLabelText('detail.creatorFooter.emailLabel'),
      ).toBeTruthy();

      const mentoringLink = container.querySelector('a[href="/$locale/contact"]');
      expect(mentoringLink).toBeTruthy();
      expect(mentoringLink?.getAttribute('data-params')).toBe(
        JSON.stringify({ locale: 'id' }),
      );
      expect(mentoringLink?.textContent).toContain(
        'detail.creatorFooter.mentoringCta',
      );
    });

    it('mounts LessonCreatorFooter immediately after LessonNavigation inside learn/$slug.tsx', () => {
      const slugSource = readFileSync(
        resolve(process.cwd(), 'src/routes/$locale/learn/$slug.tsx'),
        'utf-8',
      );
      expect(slugSource).toContain('<LessonCreatorFooter locale={locale} />');
      expect(slugSource.indexOf('<LessonNavigation')).toBeLessThan(
        slugSource.indexOf('<LessonCreatorFooter locale={locale} />'),
      );
    });
  });

  describe('Bilingual i18n parity', () => {
    it('maintains exact key parity between en and id for labs.json and tutorials.json', () => {
      expect(collectKeys(labsEn)).toEqual(collectKeys(labsId));
      expect(collectKeys(tutorialsEn)).toEqual(collectKeys(tutorialsId));

      expect(labsEn.waitlist.submit.length).toBeGreaterThan(0);
      expect(labsId.waitlist.submit.length).toBeGreaterThan(0);
      expect(tutorialsEn.detail.creatorFooter.mentoringCta).toContain(
        'Mentoring',
      );
      expect(tutorialsId.detail.creatorFooter.mentoringCta).toContain(
        'Mentoring',
      );
    });
  });
});
