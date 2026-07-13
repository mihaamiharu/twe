import { createFileRoute, getRouteApi, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  Compass,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AnimatedCounter } from '@/components/animated-counter';
import { SelectorDemo } from '@/components/selector-demo';
import { PlaywrightDemo } from '@/components/playwright-demo';
import {
  CTAButton,
  IllustratedPanel,
  PageContainer,
  PaperSurface,
  ProgressTrail,
  QuestCard,
  SectionHeading,
  StatPill,
  TechnicalSurface,
  type ProgressTrailItem,
} from '@/components/cozy-quest';
import { getDashboardStats } from '@/server/dashboard.fn';
import i18n from '@/lib/i18n';
import { createSeoHead, websiteSchema } from '@/lib/seo';

export const Route = createFileRoute('/$locale/')({
  loader: async ({ context }) => {
    if (context?.queryClient) {
      return context.queryClient.ensureQueryData({
        queryKey: ['homepage-stats'],
        queryFn: async () => {
          const result = await getDashboardStats();
          if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to fetch stats');
          }
          return result.data;
        },
        staleTime: 1000 * 60 * 5,
      });
    }
  },
  component: HomePage,
  head: ({ params }) => {
    const locale = params.locale || 'en';
    return createSeoHead({
      title: i18n.t('common:seo.title'),
      description: i18n.t('common:seo.description'),
      path: '/',
      locale,
      jsonLd: [websiteSchema],
    });
  },
});

const routeApi = getRouteApi('/$locale/');

function HomePage() {
  const { locale } = routeApi.useParams();
  const { t } = useTranslation('home');
  const { t: tCommon } = useTranslation('common');
  const initialStats = routeApi.useLoaderData();
  const { data: stats } = useQuery({
    queryKey: ['homepage-stats'],
    queryFn: async () => {
      const result = await getDashboardStats();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch stats');
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
    initialData: initialStats,
  });

  const features = [
    {
      icon: BookOpen,
      title: t('features.interactiveTutorials.title'),
      description: t('features.interactiveTutorials.description'),
    },
    {
      icon: Code2,
      title: t('features.playwrightChallenges.title'),
      description: t('features.playwrightChallenges.description'),
      demo: <PlaywrightDemo />,
    },
    {
      icon: Target,
      title: t('features.selectorChallenges.title'),
      description: t('features.selectorChallenges.description'),
      demo: <SelectorDemo />,
    },
    {
      icon: Trophy,
      title: t('features.gamification.title'),
      description: t('features.gamification.description'),
    },
    {
      icon: Zap,
      title: t('features.instantFeedback.title'),
      description: t('features.instantFeedback.description'),
    },
    {
      icon: Sparkles,
      title: t('features.trackProgress.title'),
      description: t('features.trackProgress.description'),
    },
  ];

  const learningPath: ProgressTrailItem[] = [
    {
      id: 'basic',
      title: t('tiers.basic.title'),
      description: t('tiers.basic.description'),
      skills: t('tiers.basic.skills', { returnObjects: true }) as string[],
      count: stats?.tiers.basic || 0,
    },
    {
      id: 'beginner',
      title: t('tiers.beginner.title'),
      description: t('tiers.beginner.description'),
      skills: t('tiers.beginner.skills', { returnObjects: true }) as string[],
      count: stats?.tiers.beginner || 0,
    },
    {
      id: 'intermediate',
      title: t('tiers.intermediate.title'),
      description: t('tiers.intermediate.description'),
      skills: t('tiers.intermediate.skills', {
        returnObjects: true,
      }) as string[],
      count: stats?.tiers.intermediate || 0,
    },
    {
      id: 'e2e',
      title: t('tiers.e2e.title'),
      description: t('tiers.e2e.description'),
      skills: t('tiers.e2e.skills', { returnObjects: true }) as string[],
      count: stats?.tiers.e2e || 0,
    },
  ];

  const featuredChallenges = [
    {
      title: 'CSS Selector 101',
      difficulty: 'EASY',
      type: 'CSS Selector',
      xp: 15,
      slug: 'css-selector-101-id-class',
    },
    {
      title: 'Variables & Types',
      difficulty: 'EASY',
      type: 'JavaScript',
      xp: 15,
      slug: 'js-variables-types',
    },
    {
      title: 'Click Actions',
      difficulty: 'MEDIUM',
      type: 'Playwright',
      xp: 45,
      slug: 'pw-click-actions',
    },
  ];

  const steps = [
    {
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
    },
    {
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
    },
    {
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description'),
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden">
      <section className="relative pb-16 pt-8 sm:pt-12 lg:pb-24 lg:pt-16">
        <PageContainer width="wide">
          <IllustratedPanel
            imageSrc="/images/cozy-quest/home-hero.webp"
            imageWidth={1662}
            imageHeight={946}
            imageLoading="eager"
            imageFetchPriority="high"
            className="min-h-[42rem] lg:min-h-[39rem]"
            imageClassName="object-[68%_center]"
          >
            <div className="flex min-h-[42rem] max-w-2xl flex-col justify-center px-6 py-12 sm:px-10 lg:min-h-[39rem] lg:px-16">
              <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-card/85 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary shadow-sm backdrop-blur-sm">
                <Compass className="size-4" />
                {t('hero.eyebrow')}
              </div>
              <h1 className="font-display text-4xl font-semibold leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
                <span className="gradient-text">{t('hero.title')}</span>{' '}
                {t('hero.titleSuffix')}
              </h1>
              <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-foreground/80 sm:text-xl">
                {t('hero.tagline')}
              </p>
              <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-primary">
                {t('hero.authorityStatement')}
              </p>
              <p
                className="mt-3 max-w-xl text-base leading-7 text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: t('hero.description') }}
              />

              <div className="mt-6 flex flex-wrap gap-2">
                {['Playwright', 'JavaScript', 'CSS Selectors', 'XPath'].map(
                  (skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="border border-border bg-card/80 px-3 py-1 text-sm backdrop-blur-sm"
                    >
                      {skill}
                    </Badge>
                  ),
                )}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <CTAButton asChild>
                  <Link to="/$locale/challenges" params={{ locale }}>
                    {t('hero.startLearning')}
                    <ArrowRight className="size-5" />
                  </Link>
                </CTAButton>
                <CTAButton variant="outline" asChild>
                  <Link to="/$locale/tutorials" params={{ locale }}>
                    {t('hero.browseTutorials')}
                  </Link>
                </CTAButton>
              </div>
            </div>
          </IllustratedPanel>

          <div className="relative z-20 -mt-8 grid grid-cols-2 gap-3 px-3 sm:grid-cols-4 sm:px-8 lg:mx-auto lg:max-w-4xl">
            <StatPill
              value={
                <AnimatedCounter value={stats?.challenges || 0} suffix="+" />
              }
              label={t('stats.challenges')}
            />
            <StatPill
              value={<AnimatedCounter value={stats?.tutorials || 0} />}
              label={t('stats.tutorials')}
            />
            <StatPill
              value={<AnimatedCounter value={stats?.achievements || 0} />}
              label={t('stats.achievements')}
            />
            <StatPill value="∞" label={t('stats.learning')} />
          </div>
        </PageContainer>
      </section>

      <section className="border-y border-border/70 bg-secondary/45 py-20 lg:py-28">
        <PageContainer width="wide">
          <SectionHeading
            eyebrow={t('careerPath.eyebrow')}
            title={
              <>
                {t('careerPath.title')}{' '}
                <span className="text-primary">
                  {t('careerPath.titleHighlight')}
                </span>
              </>
            }
            description={t('careerPath.subtitle')}
          />
          <div className="mt-14">
            <ProgressTrail
              items={learningPath}
              stageLabel={t('careerPath.tier')}
              countLabel={t('careerPath.challenges')}
              comingSoonLabel={t('careerPath.comingSoon')}
            />
          </div>
        </PageContainer>
      </section>

      <section className="py-20 lg:py-28">
        <PageContainer>
          <SectionHeading
            eyebrow={t('featuredChallenges.eyebrow')}
            title={
              <>
                {t('featuredChallenges.title')}{' '}
                <span className="text-primary">
                  {t('featuredChallenges.titleHighlight')}
                </span>
              </>
            }
            description={t('featuredChallenges.subtitle')}
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {featuredChallenges.map((challenge) => (
              <QuestCard
                key={challenge.slug}
                {...challenge}
                locale={locale}
                questLabel={t('featuredChallenges.questLabel')}
                difficultyLabel={tCommon(
                  `labels.${challenge.difficulty.toLowerCase()}`,
                )}
              />
            ))}
          </div>
          <div className="mt-9 text-center">
            <CTAButton variant="outline" asChild>
              <Link to="/$locale/challenges" params={{ locale }}>
                {t('featuredChallenges.viewAll')}
                <ArrowRight className="size-4" />
              </Link>
            </CTAButton>
          </div>
        </PageContainer>
      </section>

      <section className="border-y border-border/70 bg-secondary/35 py-20 lg:py-28">
        <PageContainer width="wide">
          <SectionHeading
            eyebrow={t('features.eyebrow')}
            title={
              <>
                {t('features.title')}{' '}
                <span className="text-primary">
                  {t('features.titleHighlight')}
                </span>
              </>
            }
            description={t('features.subtitle')}
          />
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <PaperSurface
                  key={feature.title}
                  className="flex h-full flex-col p-6"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="relative mt-5 font-display text-xl font-semibold">
                    {feature.title}
                  </h3>
                  <p
                    className="relative mt-2 leading-7 text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: feature.description }}
                  />
                  {feature.demo && (
                    <TechnicalSurface className="relative mt-auto p-2 pt-0">
                      {feature.demo}
                    </TechnicalSurface>
                  )}
                </PaperSurface>
              );
            })}
          </div>
        </PageContainer>
      </section>

      <section className="py-20 lg:py-28">
        <PageContainer>
          <SectionHeading
            eyebrow={t('howItWorks.eyebrow')}
            title={
              <>
                {t('howItWorks.title')}{' '}
                <span className="text-primary">
                  {t('howItWorks.titleHighlight')}
                </span>
              </>
            }
          />
          <ol className="relative mt-14 grid gap-8 md:grid-cols-3">
            <div
              className="absolute left-[16.666%] right-[16.666%] top-7 hidden border-t-2 border-dashed border-primary/25 md:block"
              aria-hidden="true"
            />
            {steps.map((step, index) => (
              <li key={step.title} className="relative text-center">
                <div className="relative z-10 mx-auto flex size-14 items-center justify-center rounded-full border-4 border-background bg-primary font-display text-xl font-semibold text-primary-foreground shadow-sm">
                  {index + 1}
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold">
                  {step.title}
                </h3>
                <p
                  className="mt-2 leading-7 text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: step.description }}
                />
              </li>
            ))}
          </ol>
        </PageContainer>
      </section>

      <section className="pb-20 lg:pb-28">
        <PageContainer>
          <IllustratedPanel
            imageSrc="/images/cozy-quest/home-cta.webp"
            imageWidth={1823}
            imageHeight={863}
            imageLoading="lazy"
            className="min-h-[30rem]"
            imageClassName="object-[68%_center]"
          >
            <div className="flex min-h-[30rem] max-w-2xl flex-col justify-center px-6 py-12 sm:px-10 lg:px-14">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                {t('cta.eyebrow')}
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                {t('cta.title')}
              </h2>
              <p className="mt-4 max-w-xl text-lg leading-7 text-muted-foreground">
                {t('cta.subtitle')}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <CTAButton asChild>
                  <Link to="/$locale/challenges" params={{ locale }}>
                    {t('cta.getStarted')}
                    <ArrowRight className="size-4" />
                  </Link>
                </CTAButton>
                <CTAButton variant="outline" asChild>
                  <Link to="/$locale/leaderboard" params={{ locale }}>
                    {t('cta.viewLeaderboard')}
                  </Link>
                </CTAButton>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-foreground/75">
                {[
                  t('cta.freeToUse'),
                  t('cta.noCreditCard'),
                  t('cta.learnAtOwnPace'),
                ].map((benefit) => (
                  <span key={benefit} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary" />
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          </IllustratedPanel>
        </PageContainer>
      </section>
    </main>
  );
}

export default HomePage;
