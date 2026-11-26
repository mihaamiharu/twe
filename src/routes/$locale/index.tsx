import { createFileRoute, getRouteApi, Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  HeroVerificationStage,
  LabsPipelineSchematic,
  WorkflowSpotlight,
} from '@/components/home-workbench';
import { authQueryOptions } from '@/lib/auth.query';
import { tutorialsListQueryOptions } from '@/lib/tutorials.query';
import { BASE_URL, createSeoHead, createWebsiteSchema } from '@/lib/seo';
import i18n from '@/lib/i18n';
import { getOgImagePath } from '@/lib/og-image';
import { LocaleRoutes, localeParams } from '@/lib/navigation';
import { stagger } from '@/lib/motion';

export const Route = createFileRoute('/$locale/')({
  loader: async ({ context, params }) => {
    const auth = await context.queryClient.ensureQueryData(authQueryOptions);

    return context.queryClient.ensureQueryData(
      tutorialsListQueryOptions({
        locale: params.locale,
        viewerId: auth.user?.id,
      }),
    );
  },
  component: HomePage,
  head: ({ params }) => {
    const locale = params.locale || 'en';
    return createSeoHead({
      title: i18n.t('common:seo.title', { lng: locale }),
      description: i18n.t('common:seo.description', { lng: locale }),
      path: '/',
      locale,
      ogImage: `${BASE_URL}${getOgImagePath({ type: 'Home' })}`,
      jsonLd: [
        createWebsiteSchema({
          locale,
          description: i18n.t('common:seo.description', { lng: locale }),
        }),
      ],
    });
  },
});

const routeApi = getRouteApi('/$locale/');

function HomePage() {
  const { locale } = routeApi.useParams();
  const { t } = useTranslation('home');
  const params = localeParams(locale);
  const lessonsResponse = routeApi.useLoaderData();
  const currentLessons = lessonsResponse.success
    ? lessonsResponse.data.slice(0, 3)
    : [];

  return (
    <div className="overflow-x-clip bg-[var(--paper-surface)] text-[var(--graphite)]">
      {/* 1. Opening Obsidian Verification Stage (bleeds seamlessly to y = 0) */}
      <section className="home-hero-stage surface-dark -mt-[4.5rem] bg-[#111312] pb-16 pt-[6rem] text-[#f4f3ee] sm:pb-20 sm:pt-[6.5rem] lg:pb-24 lg:pt-[6.75rem]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="reveal-solid text-[clamp(2.85rem,6.2vw,5.25rem)] font-semibold leading-[0.95] tracking-[-0.045em] text-[#fbf9f4]">
              {t('hero.title')}
              <span className="text-[#e65f3a]">.</span>
            </h1>
            <p
              className="reveal mx-auto mt-5 max-w-[52ch] text-[1.0625rem] leading-[1.6] text-[#c9c7bf]"
              style={stagger(1)}
            >
              {t('hero.description')}
            </p>
            <div className="reveal mt-6 flex justify-center" style={stagger(2)}>
              <Link
                to={LocaleRoutes.learn}
                params={params}
                className="motion-hover-lift motion-press inline-flex h-12 items-center justify-center gap-2.5 rounded-lg bg-[#e65f3a] px-6 text-[1.0625rem] font-semibold text-[#111312] transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#f0734f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fbf9f4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111312]"
              >
                {t('hero.startWebAutomation')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="reveal mt-9 sm:mt-11" style={stagger(3)}>
            <HeroVerificationStage />
          </div>
        </div>
      </section>

      {/* 2. Curriculum Index on Crisp Gallery Paper */}
      <section className="bg-[var(--paper-surface)] py-20 sm:py-24 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-start gap-12 px-5 sm:px-8 lg:grid-cols-[0.42fr_0.58fr] lg:gap-20 lg:px-10">
          <div className="reveal-scroll lg:sticky lg:top-28">
            <h2 className="text-[clamp(2rem,3.6vw,3rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-[var(--graphite)]">
              {t('learningPath.title')}
            </h2>
            <p className="mt-5 max-w-[46ch] text-[1.0625rem] leading-[1.65] text-[var(--muted-graphite)]">
              {t('learningPath.description')}
            </p>
            <Link
              to={LocaleRoutes.learn}
              params={params}
              className="motion-hover-arrow-group mt-8 inline-flex items-center gap-2 text-[1.0625rem] font-medium text-[var(--brand-orange-text)] transition-[color] duration-200 hover:text-[var(--graphite)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper-surface)]"
            >
              {t('learningPath.cta')}
              <ArrowRight
                className="motion-hover-arrow h-4 w-4"
                aria-hidden="true"
              />
            </Link>
          </div>

          <div
            data-testid="current-lessons"
            className="divide-y divide-[var(--soft-border)] border-y border-[var(--soft-border)]"
          >
            {currentLessons.map((lesson, index) => (
              <Link
                key={lesson.slug}
                to={LocaleRoutes.learnDetail}
                params={{ ...params, slug: lesson.slug }}
                style={stagger(index + 1)}
                className="reveal-scroll motion-hover-arrow-group group flex items-start justify-between gap-6 py-7 transition-[background-color] duration-200 hover:bg-[#f4f0e8]/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper-surface)] sm:px-4"
              >
                <div className="min-w-0">
                  <p className="text-[0.875rem] font-medium tabular-nums text-[var(--brand-orange-text)]">
                    {t('learningPath.lessonNumber', { number: index + 1 })}
                    {lesson.estimatedMinutes > 0 && (
                      <span className="text-[var(--muted-graphite)]">
                        {' · '}
                        {t('learningPath.readingTime', {
                          minutes: lesson.estimatedMinutes,
                        })}
                      </span>
                    )}
                  </p>
                  <h3
                    className="mt-2 text-[1.0625rem] font-semibold leading-[1.4] text-[var(--graphite)] transition-[color] duration-200 group-hover:text-[var(--brand-orange-text)]"
                    style={{ viewTransitionName: `lesson-${lesson.slug}` }}
                  >
                    {lesson.title}
                  </h3>
                  <p className="mt-2 max-w-[54ch] text-[1.0625rem] leading-[1.6] text-[var(--muted-graphite)]">
                    {lesson.description}
                  </p>
                </div>
                <ArrowRight
                  className="motion-hover-arrow mt-7 h-5 w-5 shrink-0 text-[var(--muted-graphite)] transition-[color,transform] duration-200 group-hover:text-[var(--brand-orange-text)]"
                  aria-hidden="true"
                />
              </Link>
            ))}

            {currentLessons.length === 0 && (
              <p className="py-8 text-[1.0625rem] leading-[1.6] text-[var(--muted-graphite)]">
                {t('learningPath.noLessons')}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 3. Interactive Learn + Practice Workflow on Architectural Stone */}
      <section className="border-y border-[#dfd9cc] bg-[#efece4] py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="reveal-scroll flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-[clamp(2rem,3.6vw,3rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-[var(--graphite)]">
                {t('learnPractice.title')}
              </h2>
              <p className="mt-5 max-w-[56ch] text-[1.0625rem] leading-[1.65] text-[var(--muted-graphite)]">
                {t('learnPractice.description')}
              </p>
            </div>

            <Link
              to={LocaleRoutes.practice}
              params={params}
              className="motion-hover-arrow-group inline-flex shrink-0 items-center gap-2 text-[1.0625rem] font-medium text-[var(--brand-orange-text)] transition-[color] duration-200 hover:text-[var(--graphite)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efece4]"
            >
              {t('learnPractice.cta')}
              <ArrowRight
                className="motion-hover-arrow h-4 w-4"
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="reveal-scroll mt-12 sm:mt-14" style={stagger(1)}>
            <WorkflowSpotlight />
          </div>
        </div>
      </section>

      {/* 4. Philosophy & Creator Portrait Feature on Crisp Gallery Paper */}
      <section className="bg-[var(--paper-surface)] py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="reveal-scroll max-w-4xl">
            <h2 className="text-[clamp(2rem,3.6vw,3rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-[var(--graphite)]">
              {t('philosophy.title')}
            </h2>
            <p className="mt-5 max-w-[60ch] text-[1.0625rem] leading-[1.65] text-[var(--muted-graphite)]">
              {t('philosophy.description')}
            </p>
          </div>

          <div className="reveal-scroll mt-14 grid items-center gap-12 border-t border-[var(--soft-border)] pt-14 sm:mt-16 sm:pt-16 lg:grid-cols-[0.4fr_0.6fr] lg:gap-20">
            <div className="mx-auto w-full max-w-[360px] lg:mx-0">
              <div className="overflow-hidden rounded-2xl bg-[#ebe6dc]">
                <img
                  src="/me.jpg"
                  alt={t('creator.portraitAlt')}
                  className="block aspect-[4/5] w-full object-cover object-top"
                  width={1200}
                  height={1500}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>

            <div className="max-w-2xl">
              <h2 className="text-[clamp(2rem,3.6vw,3rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-[var(--graphite)]">
                {t('creator.title')}
              </h2>
              <p className="mt-5 max-w-[54ch] text-[1.0625rem] leading-[1.7] text-[var(--muted-graphite)]">
                {t('creator.description')}
              </p>
              <Link
                to={LocaleRoutes.about}
                params={params}
                className="motion-hover-arrow-group mt-8 inline-flex items-center gap-2 text-[1.0625rem] font-medium text-[var(--brand-orange-text)] transition-[color] duration-200 hover:text-[var(--graphite)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper-surface)]"
              >
                {t('creator.cta')}
                <ArrowRight
                  className="motion-hover-arrow h-4 w-4"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Labs Architecture Band on Deep Pine-Slate */}
      <section className="surface-dark bg-[#13201c] py-20 text-[#f4f3ee] sm:py-24 lg:py-32">
        <div
          data-labs-preview
          className="mx-auto grid max-w-7xl items-start gap-12 px-5 sm:px-8 lg:grid-cols-[0.44fr_0.56fr] lg:gap-20 lg:px-10"
        >
          <div className="reveal-scroll lg:sticky lg:top-28">
            <h2 className="text-[clamp(2rem,3.6vw,3rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-[#f4f3ee]">
              {t('labs.title')}
            </h2>
            <p className="mt-5 max-w-[46ch] text-[1.0625rem] leading-[1.65] text-[#b8c7c1]">
              {t('labs.description')}
            </p>
            <Link
              to={LocaleRoutes.labs}
              params={params}
              className="motion-hover-arrow-group mt-8 inline-flex items-center gap-2 text-[1.0625rem] font-medium text-[#7ce3c1] transition-[color] duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7ce3c1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#13201c]"
            >
              {t('labs.cta')}
              <ArrowRight
                className="motion-hover-arrow h-4 w-4"
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="reveal-scroll" style={stagger(1)}>
            <LabsPipelineSchematic />
          </div>
        </div>
      </section>

      {/* 6. Bold Signature Vermilion Closing Statement */}
      <section className="bg-[#b23f1c] py-20 text-[#fbf9f4] sm:py-24 lg:py-28">
        <div className="reveal-scroll mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="max-w-2xl">
            <h2 className="text-[clamp(2rem,3.6vw,3rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-[#fbf9f4]">
              {t('cta.title')}
            </h2>
            <p className="mt-4 max-w-[54ch] text-[1.0625rem] leading-[1.65] text-[#fce7df]">
              {t('cta.description')}
            </p>
          </div>

          <div className="shrink-0">
            <Link
              to={LocaleRoutes.learn}
              params={params}
              className="motion-hover-lift motion-press inline-flex h-12 items-center justify-center gap-2.5 rounded-lg bg-[#fbf9f4] px-6 text-[1.0625rem] font-semibold text-[#141615] transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#ebe6dc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fbf9f4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#b23f1c]"
            >
              {t('cta.primary')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
