import { afterEach, describe, expect, it, mock } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ReactNode } from 'react';
import contactEn from '@/lib/i18n/resources/en/contact.json';
import contactId from '@/lib/i18n/resources/id/contact.json';
import { CONTACT_TOPICS, ContactSchema } from '@/server/contact.fn';

void mock.module('@/components/bug-report-dialog', () => ({
  BugReportDialog: ({ trigger }: { trigger?: ReactNode }) => (
    <div data-testid="bug-report-dialog">{trigger}</div>
  ),
}));

const { Footer } = await import('@/components/footer');
const { ContactPage } = await import('@/routes/$locale/contact');

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

describe('Creator-Led Education positioning (Issue #265)', () => {
  afterEach(() => {
    cleanup();
  });

  describe('ContactSchema & CONTACT_TOPICS', () => {
    it('supports creator-led topics and excludes job opportunity', () => {
      expect(CONTACT_TOPICS).toEqual([
        'general',
        'mentoring',
        'partnership',
        'other',
      ]);

      for (const topic of CONTACT_TOPICS) {
        const parsed = ContactSchema.safeParse({
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          topic,
          message: 'Looking forward to discussing a QA workshop together.',
        });
        expect(parsed.success).toBe(true);
      }

      const legacyOpportunity = ContactSchema.safeParse({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        topic: 'opportunity',
        message: 'Checking if legacy opportunity topic is rejected on submit.',
      });
      expect(legacyOpportunity.success).toBe(false);
    });

    it('defaults topic to general and keeps field validation intact', () => {
      const parsed = ContactSchema.parse({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        message: 'General question about Playwright tutorials.',
      });
      expect(parsed.topic).toBe('general');

      const shortMessage = ContactSchema.safeParse({
        name: 'Ada',
        email: 'ada@example.com',
        topic: 'general',
        message: 'Too short',
      });
      expect(shortMessage.success).toBe(false);
    });
  });

  describe('Bilingual contact i18n parity', () => {
    it('maintains matching keys and removes job-seeker portfolio cues in en and id', () => {
      expect(collectKeys(contactEn)).toEqual(collectKeys(contactId));

      expect('opportunityNote' in contactEn.partnerships).toBe(false);
      expect('cvCta' in contactEn.partnerships).toBe(false);
      expect('opportunity' in contactEn.form.topics).toBe(false);

      expect('opportunityNote' in contactId.partnerships).toBe(false);
      expect('cvCta' in contactId.partnerships).toBe(false);
      expect('opportunity' in contactId.form.topics).toBe(false);

      expect(contactEn.partnerships.title).toContain('Collaborations');
      expect(contactId.partnerships.title).toContain('Kolaborasi');
      expect(contactEn.seo.description.toLowerCase()).not.toContain('career');
      expect(contactId.seo.description.toLowerCase()).not.toContain('karier');
    });
  });

  describe('ContactPage rendering', () => {
    it('renders mentoring and collaborations without CV link or job opportunity topic', () => {
      const { container } = render(<ContactPage />);

      expect(screen.getByText('mentoring.title')).toBeTruthy();
      expect(screen.getByText('partnerships.title')).toBeTruthy();
      expect(container.querySelector('a[href="/Ekki_Syam_CV.pdf"]')).toBeNull();
      expect(screen.queryByText('partnerships.opportunityNote')).toBeNull();
      expect(screen.queryByText('partnerships.cvCta')).toBeNull();

      const topicSelect = container.querySelector('select#contact-topic');
      expect(topicSelect).toBeTruthy();

      const optionValues = Array.from(
        topicSelect instanceof HTMLSelectElement ? topicSelect.options : [],
      )
        .map((option) => option.value)
        .filter((value) => value.length > 0);
      expect(optionValues).toEqual([
        'general',
        'mentoring',
        'partnership',
        'other',
      ]);
      expect(optionValues).not.toContain('opportunity');
    });
  });

  describe('Header navigation consistency', () => {
    it('removes isContactPage overrides and routes primary CTA to /$locale/learn on desktop and mobile', () => {
      const headerSource = readFileSync(
        resolve(process.cwd(), 'src/components/header.tsx'),
        'utf-8',
      );

      expect(headerSource).not.toContain('isContactPage');
      expect(headerSource).not.toContain('h-[5.5rem]');
      expect(headerSource).not.toContain('LocaleRoutes.register');
      expect(headerSource).toContain('to: LocaleRoutes.learn');
      expect(headerSource).toContain('to={primaryCta.to}');
      expect(headerSource).toContain('to={LocaleRoutes.login}');
      expect(headerSource).toContain("t('common:actions.startWebAutomation')");
    });
  });

  describe('Footer consistency', () => {
    it('renders the full 3-column footer including YouTube and Report a Bug without contact overrides', () => {
      const footerSource = readFileSync(
        resolve(process.cwd(), 'src/components/footer.tsx'),
        'utf-8',
      );
      expect(footerSource).not.toContain("endsWith('/contact')");

      render(<Footer />);

      expect(screen.getByText('common:footer.explore')).toBeTruthy();
      expect(screen.getByText('common:footer.connect')).toBeTruthy();
      expect(screen.getByText('common:footer.legal')).toBeTruthy();
      expect(
        screen.getByText('YouTube').closest('a')?.getAttribute('href'),
      ).toBe('https://www.youtube.com/@TestingWithEkki');
      expect(screen.getByText('common:footer.reportBug')).toBeTruthy();
    });
  });
});
