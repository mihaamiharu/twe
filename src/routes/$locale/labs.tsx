import { createFileRoute, getRouteApi, Link } from '@tanstack/react-router';
import {
  ArrowDown,
  BookOpen,
  Code2,
  FlaskConical,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createSeoHead } from '@/lib/seo';
import i18n from '@/lib/i18n';
import { LocaleRoutes, localeParams } from '@/lib/navigation';

export const Route = createFileRoute('/$locale/labs')({
  component: LabsPage,
  head: ({ params }) => {
    const locale = params.locale || 'en';
    return createSeoHead({
      title: i18n.t('labs:seo.title', { lng: locale }),
      description: i18n.t('labs:seo.description', { lng: locale }),
      path: '/labs',
      locale,
    });
  },
});

const routeApi = getRouteApi('/$locale/labs');

function LabsPage() {
  const { locale } = routeApi.useParams();
  const { t } = useTranslation('labs');
  const params = localeParams(locale);

  return (
    <div className="overflow-hidden bg-[var(--warm-canvas)] text-[var(--graphite)]">
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-16 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10 lg:px-12 lg:pb-28 lg:pt-20">
        <div className="max-w-xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--brand-orange)]">
            {t('hero.eyebrow')}
          </p>
          <h1 className="mt-5 text-[clamp(2.8rem,6vw,4.4rem)] font-semibold leading-[0.98] tracking-[-0.055em]">
            {t('hero.title')}
            <span className="text-[var(--brand-orange)]">.</span>
          </h1>
          <p className="mt-6 max-w-lg text-xl leading-8 text-[var(--graphite)]">
            {t('hero.description')}
          </p>
          <span className="mt-7 inline-flex items-center rounded bg-[var(--orange-tint)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--brand-orange)]">
            {t('hero.badge')}
          </span>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={LocaleRoutes.practice}
              params={params}
              className="motion-hover-lift inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--brand-orange)] px-5 text-[15px] font-medium text-white hover:bg-[#d9502d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--warm-canvas)]"
            >
              <Code2 className="h-4 w-4" aria-hidden="true" />
              {t('actions.practice')}
            </Link>
            <Link
              to={LocaleRoutes.learn}
              params={params}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[var(--soft-border)] bg-[var(--paper-surface)] px-5 text-[15px] font-medium text-[var(--graphite)] transition-colors hover:border-[var(--graphite)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--warm-canvas)]"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              {t('actions.learn')}
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[460px] lg:justify-self-end">
          <div className="absolute -inset-5 rounded-[2.5rem] border border-[var(--brand-orange)]/20" />
          <div className="relative rounded-2xl border border-[var(--soft-border)] bg-[var(--paper-surface)] p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between border-b border-[var(--soft-border)] pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--orange-tint)]">
                  <FlaskConical className="h-5 w-5 text-[var(--brand-orange)]" aria-hidden="true" />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted-graphite)]">
                  {t('hero.visualLabel')}
                </span>
              </div>
                <span className="font-mono text-[10px] text-[var(--brand-orange)]">
                  01
                </span>
            </div>
            <div className="py-10">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--brand-orange)]">
                {t('note.eyebrow')}
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em]">
                {t('note.title')}
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--muted-graphite)]">
                {t('note.description')}
              </p>
              <div className="mt-7 space-y-2 border-l border-[var(--brand-orange)]/35 pl-4">
                {(
                  [
                    'repository',
                    'testFramework',
                    'apiServices',
                    'ciPipeline',
                    'testDebug',
                  ] as const
                ).map((step, index, steps) => (
                  <div key={step}>
                    <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--graphite)]">
                      {t(`note.steps.${step}`)}
                    </p>
                    {index < steps.length - 1 && (
                      <ArrowDown
                        className="my-1 h-3.5 w-3.5 text-[var(--brand-orange)]"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--soft-border)] pt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted-graphite)]">
                <span>{t('hero.status')}</span>
              <span className="text-[var(--brand-orange)]">{t('hero.badge')}</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
