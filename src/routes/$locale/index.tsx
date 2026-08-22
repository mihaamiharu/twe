import { createFileRoute, getRouteApi, Link } from '@tanstack/react-router';
import {
  ArrowRight,
  BookOpen,
  Check,
  Code2,
  Lightbulb,
  Play,
  Wrench,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { HomeHeroVisual, PracticePreview } from '@/components/rebrand-visuals';
import { BASE_URL, createSeoHead, websiteSchema } from '@/lib/seo';
import i18n from '@/lib/i18n';
import { LocaleRoutes, localeParams } from '@/lib/navigation';

export const Route = createFileRoute('/$locale/')({
  component: HomePage,
  head: ({ params }) => {
    const locale = params.locale || 'en';
    return createSeoHead({
      title: i18n.t('common:seo.title', { lng: locale }),
      description: i18n.t('common:seo.description', { lng: locale }),
      path: '/',
      locale,
      ogImage: `${BASE_URL}/api/og?type=Home`,
      jsonLd: [websiteSchema],
    });
  },
});

const routeApi = getRouteApi('/$locale/');

function HomePage() {
  const { locale } = routeApi.useParams();
  const { t } = useTranslation('home');
  const params = localeParams(locale);

  const learningSteps = [
    { number: '01', title: t('learningPath.steps.foundations.title'), description: t('learningPath.steps.foundations.description') },
    { number: '02', title: t('learningPath.steps.programming.title'), description: t('learningPath.steps.programming.description') },
    { number: '03', title: t('learningPath.steps.playwright.title'), description: t('learningPath.steps.playwright.description') },
    { number: '04', title: t('learningPath.steps.design.title'), description: t('learningPath.steps.design.description') },
    { number: '05', title: t('learningPath.steps.e2e.title'), description: t('learningPath.steps.e2e.description') },
  ];

  const methodSteps = [
    { number: '01', label: t('learnPractice.steps.learn.label'), title: t('learnPractice.steps.learn.title'), description: t('learnPractice.steps.learn.description'), icon: BookOpen },
    { number: '02', label: t('learnPractice.steps.practice.label'), title: t('learnPractice.steps.practice.title'), description: t('learnPractice.steps.practice.description'), icon: Code2 },
    { number: '03', label: t('learnPractice.steps.review.label'), title: t('learnPractice.steps.review.title'), description: t('learnPractice.steps.review.description'), icon: Check },
  ];

  return (
    <div className="overflow-hidden bg-[var(--warm-canvas)] text-[var(--graphite)]">
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-16 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-4 lg:px-12 lg:pb-28 lg:pt-20">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-6 font-mono text-xs font-medium uppercase tracking-[0.18em] text-[var(--brand-orange)]">
            {t('hero.eyebrow')}
          </p>
          <h1 className="max-w-[680px] text-[clamp(3rem,6vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.055em]">
            {t('hero.title')}
            <span className="text-[var(--brand-orange)]">.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted-graphite)] sm:text-[1.125rem]">
            {t('hero.description')}
          </p>
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
            <Link
              to={LocaleRoutes.tutorials}
              params={params}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--brand-orange)] px-5 text-[15px] font-medium text-white transition-transform hover:-translate-y-px hover:bg-[#d9502d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--warm-canvas)]"
            >
              {t('hero.startWebAutomation')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to={LocaleRoutes.challenges}
              params={params}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[var(--soft-border)] bg-[var(--paper-surface)] px-5 text-[15px] font-medium text-[var(--graphite)] transition-colors hover:border-[var(--graphite)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--warm-canvas)]"
            >
              {t('hero.explorePractice')}
            </Link>
          </div>
          <div className="mt-9 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted-graphite)]">
            <span className="flex -space-x-2" aria-hidden="true">
              <span className="h-7 w-7 rounded-full border-2 border-[var(--warm-canvas)] bg-[#d8b5a7]" />
              <span className="h-7 w-7 rounded-full border-2 border-[var(--warm-canvas)] bg-[#b9c4c8]" />
              <span className="h-7 w-7 rounded-full border-2 border-[var(--warm-canvas)] bg-[#d4c8a7]" />
            </span>
            <span>{t('hero.creatorNote')}</span>
          </div>
        </div>
        <HomeHeroVisual />
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-12 lg:pb-28">
        <div className="grid gap-10 rounded-xl border border-[var(--soft-border)] bg-[var(--paper-surface)] p-6 sm:p-9 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16 lg:p-12">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--brand-orange)]">{t('learningPath.eyebrow')}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{t('learningPath.title')}</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[var(--muted-graphite)]">{t('learningPath.description')}</p>
            <Link
              to={LocaleRoutes.tutorials}
              params={params}
              className="mt-7 inline-flex items-center gap-2 text-[15px] font-medium text-[var(--brand-orange)] transition-colors hover:text-[var(--graphite)]"
            >
              {t('learningPath.cta')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <ol className="relative grid gap-0 sm:grid-cols-5 sm:gap-3">
            {learningSteps.map((step, index) => (
              <li key={step.number} className="relative flex gap-4 border-l border-[var(--soft-border)] pb-6 pl-5 last:pb-0 sm:border-l-0 sm:pb-0 sm:pl-0">
                {index < learningSteps.length - 1 && <span className="absolute left-[-1px] top-3 hidden h-px w-[calc(100%+0.75rem)] bg-[var(--soft-border)] sm:block" />}
                <div className="relative z-10 flex min-w-7 items-center justify-center sm:block">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--brand-orange)] bg-[var(--paper-surface)] font-mono text-[10px] text-[var(--brand-orange)]">{step.number}</span>
                </div>
                <div className="relative z-10 sm:pt-11">
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-graphite)]">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-12 lg:pb-28">
        <div className="grid items-start gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--brand-orange)]">{t('learnPractice.eyebrow')}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{t('learnPractice.title')}</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[var(--muted-graphite)]">{t('learnPractice.description')}</p>
          </div>
          <div className="grid gap-7 lg:grid-cols-[0.85fr_1.15fr]">
            <ol className="space-y-5">
              {methodSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <li key={step.number} className="flex gap-4 border-b border-[var(--soft-border)] pb-5 last:border-b-0">
                    <span className="font-mono text-xs text-[var(--brand-orange)]">{step.number}</span>
                    <div>
                      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted-graphite)]">
                        <Icon className="h-3.5 w-3.5 text-[var(--brand-orange)]" aria-hidden="true" />
                        {step.label}
                      </div>
                      <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted-graphite)]">{step.description}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="lg:pt-4">
              <PracticePreview />
              <Link to={LocaleRoutes.challenges} params={params} className="mt-4 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-[var(--brand-orange)] hover:text-[var(--graphite)]">
                {t('learnPractice.cta')}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-12 lg:pb-28">
        <div className="grid items-center gap-10 rounded-xl bg-[var(--orange-tint)]/55 p-7 sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:p-14">
          <div className="relative mx-auto w-full max-w-[300px]">
            <div className="absolute inset-4 rounded-[42%] border border-[var(--brand-orange)]/35" />
            <img src="/me.small.jpg" alt="Ekki" className="relative mx-auto aspect-square w-[72%] rounded-[42%] object-cover object-top" width={400} height={400} loading="lazy" />
            <div className="absolute bottom-2 left-0 rounded-md bg-[var(--paper-surface)] px-3 py-2 font-mono text-[10px] text-[var(--brand-orange)] shadow-sm">WHY / HOW / TOOLS</div>
          </div>
          <div>
            <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">{t('philosophy.title')}</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted-graphite)]">{t('philosophy.description')}</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              <div><Lightbulb className="h-5 w-5 text-[var(--brand-orange)]" aria-hidden="true" /><p className="mt-2 font-semibold">{t('philosophy.why')}</p></div>
              <div><Wrench className="h-5 w-5 text-[var(--brand-orange)]" aria-hidden="true" /><p className="mt-2 font-semibold">{t('philosophy.how')}</p></div>
              <div><Code2 className="h-5 w-5 text-[var(--brand-orange)]" aria-hidden="true" /><p className="mt-2 font-semibold">{t('philosophy.tools')}</p></div>
            </div>
            <div className="mt-8 border-t border-[var(--brand-orange)]/25 pt-6">
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--brand-orange)]">{t('creator.eyebrow')}</p>
              <h3 className="mt-2 text-2xl font-semibold">{t('creator.title')}</h3>
              <p className="mt-3 max-w-xl text-base leading-7 text-[var(--muted-graphite)]">{t('creator.description')}</p>
              <Link to={LocaleRoutes.about} params={params} className="mt-5 inline-flex items-center gap-2 text-[15px] font-medium text-[var(--brand-orange)] hover:text-[var(--graphite)]">
                {t('creator.cta')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-12 lg:pb-28">
        <div className="border-y border-[var(--soft-border)]">
          <EmptyState
            size="default"
            className="py-8 sm:py-10"
            eyebrow={t('labs.eyebrow')}
            title={t('labs.title')}
            description={t('labs.description')}
            action={
              <Link
                to={LocaleRoutes.challenges}
                params={params}
                className="inline-flex items-center gap-2 text-[15px] font-medium text-[var(--brand-orange)]"
              >
                {t('labs.cta')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 sm:px-8 lg:px-12 lg:pb-32">
        <div className="rounded-xl bg-[var(--graphite)] px-7 py-12 text-[var(--paper-surface)] sm:px-12 sm:py-14 lg:flex lg:items-center lg:justify-between lg:gap-12">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--orange-tint)]">{t('cta.eyebrow')}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{t('cta.title')}</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#d2d0c9]">{t('cta.description')}</p>
          </div>
          <div className="mt-8 flex shrink-0 flex-col items-start gap-4 sm:flex-row lg:mt-0 lg:flex-col lg:items-start">
            <Link to={LocaleRoutes.tutorials} params={params} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--brand-orange)] px-5 text-[15px] font-medium text-white hover:bg-[#f06f4b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--graphite)]">
              {t('cta.primary')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link to={LocaleRoutes.challenges} params={params} className="inline-flex items-center gap-2 text-[15px] font-medium text-[var(--orange-tint)] hover:text-white">
              {t('cta.secondary')} <Play className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
