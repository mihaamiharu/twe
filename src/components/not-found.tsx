import { Link, useParams } from '@tanstack/react-router';
import {
  ArrowRight,
  BookOpen,
  FileQuestion,
  Search,
  XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { localeParams, LocaleRoutes } from '@/lib/navigation';

function MissingPageCard() {
  const { t } = useTranslation('common');

  return (
    <div
      className="w-full rounded-[18px] border border-[var(--soft-border)] bg-[var(--paper-surface)] p-4 text-left shadow-[0_18px_45px_rgba(29,29,27,0.08)] sm:p-5"
      data-not-found-card="missing-page"
    >
      <div className="flex items-center gap-2 border-b border-[var(--soft-border)] pb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted-graphite)]">
        <span className="h-2 w-2 rounded-full bg-[var(--brand-orange)]" />
        {t('notFound.browserLabel')}
      </div>

      <div className="flex items-center gap-3 py-6 sm:py-7">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--orange-tint)] text-[var(--brand-orange)]">
          <FileQuestion className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold text-[var(--graphite)]">
            {t('notFound.browserTitle')}
          </p>
          <p className="mt-1 font-mono text-[10px] text-[var(--muted-graphite)]">
            {t('notFound.browserCode')}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--soft-border)] pt-3 font-mono text-[10px] text-[var(--muted-graphite)]">
        <span>GET /page</span>
        <span className="text-[var(--brand-error)]">404</span>
      </div>
    </div>
  );
}

function AssertionResultCard() {
  const { t } = useTranslation('common');

  return (
    <div
      className="w-full rounded-[18px] border border-[#393c38] bg-[#202321] p-4 text-left text-[#f2f1ec] shadow-[0_18px_45px_rgba(29,29,27,0.14)] sm:p-5"
      data-not-found-card="assertion-result"
    >
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#393c38] pb-3 font-mono text-[10px] uppercase tracking-[0.12em]">
        <span className="text-[var(--brand-orange)]">
          {t('notFound.assertionLabel')}
        </span>
        <Search className="h-3.5 w-3.5 text-[#a5a69f]" aria-hidden="true" />
      </div>

      <div className="space-y-2 font-mono text-[11px]">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#a5a69f]">{t('notFound.expected')}</span>
          <span className="text-right text-[#f2f1ec]">page</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#a5a69f]">{t('notFound.actual')}</span>
          <span className="text-right text-[#f2f1ec]">not found</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-[#393c38] pt-3 font-mono text-[10px] font-medium tracking-[0.08em] text-[var(--brand-error)]">
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
        {t('notFound.failed')}
      </div>
    </div>
  );
}

export function NotFound() {
  const { t } = useTranslation('common');
  const params = useParams({ strict: false });
  const locale = params.locale || 'en';

  return (
    <section
      className="relative isolate overflow-hidden bg-[var(--warm-canvas)] px-4 pb-20 pt-12 text-[var(--graphite)] sm:px-6 sm:pt-16 lg:min-h-[calc(100svh-4.5rem)] lg:px-8 lg:pb-24 lg:pt-20"
      data-not-found-page
    >
      <div
        className="pointer-events-none absolute -right-20 top-20 h-48 w-48 rounded-full border border-[var(--brand-orange)]/20 sm:-right-12 sm:h-64 sm:w-64"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-[8%] top-[44%] hidden h-px w-24 bg-[var(--brand-orange)]/45 sm:block"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--brand-orange)]">
            <span>{t('notFound.eyebrow')}</span>
            <span className="h-px w-8 bg-[var(--brand-orange)]" />
            <span className="text-[var(--muted-graphite)]">
              {t('notFound.label')}
            </span>
          </div>

          <div className="mt-5 text-[clamp(5.5rem,18vw,10rem)] font-semibold leading-[0.78] tracking-[-0.1em] text-[var(--brand-orange)]">
            404
          </div>

          <h1 className="mx-auto mt-7 max-w-2xl text-4xl font-semibold tracking-[-0.055em] text-[var(--graphite)] sm:text-5xl lg:text-6xl">
            {t('notFound.headline')}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[var(--muted-graphite)] sm:text-lg sm:leading-8">
            {t('notFound.description')}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="rounded-md bg-[var(--brand-orange)] px-5 text-[var(--paper-surface)] shadow-none hover:bg-[var(--brand-orange)]/90"
            >
              <Link
                to={LocaleRoutes.home}
                params={localeParams(locale)}
                data-not-found-home
              >
                {t('notFound.backHome')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-md border-[var(--soft-border)] bg-transparent px-5 text-[var(--graphite)] shadow-none hover:bg-[var(--paper-surface)]"
            >
              <Link
                to={LocaleRoutes.tutorials}
                params={localeParams(locale)}
                data-not-found-learning
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                {t('notFound.exploreLearning')}
              </Link>
            </Button>
          </div>
        </div>

        <div
          className="mx-auto mt-14 grid max-w-6xl items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)_minmax(0,1fr)] lg:mt-16 lg:gap-8"
          data-not-found-visual
        >
          <MissingPageCard />

          <div className="order-first flex justify-center md:order-none">
            <div className="relative h-[22rem] w-full max-w-[18rem] sm:h-[30rem] sm:max-w-[23rem] lg:h-[35rem] lg:max-w-[24rem]">
              <div
                className="absolute bottom-3 left-1/2 h-8 w-[72%] -translate-x-1/2 rounded-[50%] bg-[var(--orange-tint)]/70 blur-[1px]"
                aria-hidden="true"
              />
              <img
                src="/illustrations/twe-inspector-female-404.png"
                alt={t('notFound.characterAlt')}
                className="relative z-10 h-full w-full object-contain object-bottom"
                width={1122}
                height={1402}
                loading="eager"
                draggable={false}
              />
            </div>
          </div>

          <AssertionResultCard />
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted-graphite)] sm:mt-10">
          <Search
            className="h-3.5 w-3.5 text-[var(--brand-orange)]"
            aria-hidden="true"
          />
          {t('notFound.inspectorNote')}
        </p>
      </div>
    </section>
  );
}
