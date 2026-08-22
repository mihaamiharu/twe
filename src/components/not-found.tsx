import { Link, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { localeParams, LocaleRoutes } from '@/lib/navigation';

const terminalLogs = [
  '> GET /page-content ... 200 OK',
  '> Render ... Done',
  '> Visibility ... Hidden',
  '> Assertion passed: element is present',
  '> Moving to next step...',
  '> waitForSelector(".content") ... timeout',
  '> Retrying with { visible: true } ...',
  '> ERROR: Element not visible in headless mode',
  '> Checking viewport: { width: 0, height: 0 }',
  '> Screenshot saved: blank.png',
  '> Test passed (ironically)',
  '> GET /definitely-real-page ... 404',
  '> But trust us, it exists',
  '> Playwright.headless = true',
  '> User.confusion = true',
  '> Solution: Switch to headed mode',
];

export function NotFound() {
  const { t } = useTranslation('common');
  const params = useParams({ strict: false });
  const locale = params.locale || 'en';
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);

  useEffect(() => {
    let logIndex = 0;
    const interval = setInterval(() => {
      setVisibleLogs((prev) => {
        const nextLog = terminalLogs[logIndex % terminalLogs.length];
        if (nextLog === undefined) return prev;
        const newLogs = [...prev, nextLog];
        // Keep only last 8 logs for scrolling effect
        if (newLogs.length > 8) {
          return newLogs.slice(-8);
        }
        return newLogs;
      });
      logIndex++;
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden bg-[var(--warm-canvas)] p-4 text-[var(--graphite)]">
      {/* Circuit pattern background */}
      <div className="pointer-events-none absolute inset-0 text-[var(--soft-border)] opacity-40">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="circuit"
              x="0"
              y="0"
              width="100"
              height="100"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M10 10h80v80h-80z"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
              <circle cx="10" cy="10" r="3" fill="currentColor" />
              <circle cx="90" cy="10" r="3" fill="currentColor" />
              <circle cx="10" cy="90" r="3" fill="currentColor" />
              <circle cx="90" cy="90" r="3" fill="currentColor" />
              <path
                d="M10 50h30M60 50h30M50 10v30M50 60v30"
                stroke="currentColor"
                strokeWidth="0.5"
              />
              <circle
                cx="50"
                cy="50"
                r="5"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-2xl text-center">
        {/* Status code badge */}
        <div className="mb-6 inline-flex items-center gap-2 border border-[var(--brand-error)]/30 bg-[var(--brand-error)]/10 px-3 py-1 font-mono text-xs text-[var(--brand-error)]">
          <span className="h-2 w-2 rounded-full bg-[var(--brand-error)]" />
          ERROR 404
        </div>

        {/* Headline */}
        <h1 className="mb-4 text-4xl font-semibold tracking-tight text-[var(--graphite)] md:text-5xl">
          {t('notFound.title')}
        </h1>

        {/* Sub-headline */}
        <p className="mx-auto mb-8 max-w-xl text-lg leading-8 text-[var(--muted-graphite)]">
          {t('notFound.description').split('headless: true')[0]}
          <code className="border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-2 py-0.5 font-mono text-sm text-[var(--workspace-text)]">
            headless: true
          </code>
          {t('notFound.description').split('headless: true')[1]}
        </p>

        {/* Terminal window */}
        <div className="mx-auto mb-8 max-w-lg text-left">
          {/* Terminal header */}
          <div className="technical-surface flex items-center gap-2 rounded-t-md border border-[var(--workspace-border)] border-b-0 px-4 py-3">
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--brand-error)]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--brand-warning)]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--brand-success)]" />
            <span className="ml-2 font-mono text-xs text-[var(--workspace-muted)]">
              playwright-test
            </span>
          </div>

          {/* Terminal body */}
          <div className="technical-surface relative h-48 overflow-hidden rounded-b-md border border-[var(--workspace-border)] border-t-0 p-4 font-mono text-sm">
            {/* Scrolling logs */}
            <div className="space-y-1">
              {visibleLogs.map((log, index) => (
                <div
                  key={`${log}-${index}`}
                  className={`text-[var(--workspace-text)] transition-opacity duration-300 ${
                    index === visibleLogs.length - 1
                      ? 'opacity-100'
                      : 'opacity-70'
                  }`}
                >
                  {log}
                  {index === visibleLogs.length - 1 && (
                    <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-[var(--brand-orange)]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Return CTA */}
        <Link
          to={LocaleRoutes.home}
          params={localeParams(locale)}
          className="inline-flex min-h-11 items-center gap-3 rounded-md bg-[var(--brand-orange)] px-5 py-3 font-medium text-[var(--paper-surface)] transition-colors hover:bg-[var(--brand-orange)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--warm-canvas)]"
        >
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-[var(--paper-surface)]"
          />
          <span>{t('notFound.backHome')}</span>
        </Link>

        {/* Fun footer note */}
        <p className="mt-8 font-mono text-xs text-[var(--muted-graphite)]">
          {t('notFound.tip').split('--headed')[0]}
          <code className="text-[var(--graphite)]">--headed</code>
          {t('notFound.tip').split('--headed')[1]}
        </p>
      </div>

      {/* Decorative star/cursor in corner */}
      <div className="absolute bottom-8 right-8 text-[var(--brand-orange)]/40">
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z" />
        </svg>
      </div>
    </div>
  );
}
