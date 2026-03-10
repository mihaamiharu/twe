import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { WaveSeparator } from '@/components/ui/wave-separator';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Zap,
  BookOpen,
  Code2,
  Trophy,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { SelectorDemo } from '@/components/SelectorDemo';
import { PlaywrightDemo } from '@/components/PlaywrightDemo';
import { getDashboardStats } from '@/server/dashboard.fn';
import { useTranslation } from 'react-i18next';

import i18n from '@/lib/i18n';
import { createSeoHead, websiteSchema } from '@/lib/seo';

export const Route = createFileRoute('/$locale/')({
  loader: async ({ context }) => {
    // Prefetch stats for SSR
    if (context?.queryClient) {
      await context.queryClient.ensureQueryData({
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

function HomePage() {
  const { locale } = Route.useParams();
  const { t } = useTranslation('home');
  // Fetch real stats from Server Function
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['homepage-stats'],
    queryFn: async () => {
      const result = await getDashboardStats();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch stats');
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const stats = statsData;

  const features = [
    {
      icon: <BookOpen className="w-10 h-10 text-primary" />,
      title: t('features.interactiveTutorials.title'),
      description: t('features.interactiveTutorials.description'),
    },
    {
      icon: <Code2 className="w-10 h-10 text-primary" />,
      title: t('features.playwrightChallenges.title'),
      description: t('features.playwrightChallenges.description'),
      demo: <PlaywrightDemo />,
    },
    {
      icon: <Target className="w-10 h-10 text-primary" />,
      title: t('features.selectorChallenges.title'),
      description: t('features.selectorChallenges.description'),
      demo: <SelectorDemo />,
    },
    {
      icon: <Trophy className="w-10 h-10 text-primary" />,
      title: t('features.gamification.title'),
      description: t('features.gamification.description'),
    },
    {
      icon: <Zap className="w-10 h-10 text-primary" />,
      title: t('features.instantFeedback.title'),
      description: t('features.instantFeedback.description'),
    },
    {
      icon: <Sparkles className="w-10 h-10 text-primary" />,
      title: t('features.trackProgress.title'),
      description: t('features.trackProgress.description'),
    },
  ];

  const learningPath = [
    {
      tier: 'basic',
      emoji: '🟢',
      title: t('tiers.basic.title'),
      description: t('tiers.basic.description'),
      skills: t('tiers.basic.skills', { returnObjects: true }) as string[],
      count: stats?.tiers.basic || 0,
    },
    {
      tier: 'beginner',
      emoji: '🟡',
      title: t('tiers.beginner.title'),
      description: t('tiers.beginner.description'),
      skills: t('tiers.beginner.skills', { returnObjects: true }) as string[],
      count: stats?.tiers.beginner || 0,
    },
    {
      tier: 'intermediate',
      emoji: '🟠',
      title: t('tiers.intermediate.title'),
      description: t('tiers.intermediate.description'),
      skills: t('tiers.intermediate.skills', {
        returnObjects: true,
      }) as string[],
      count: stats?.tiers.intermediate || 0,
    },
    {
      tier: 'e2e',
      emoji: '🟣',
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

  return (
    <div className="min-h-screen">
      {/* Hero Section with Technical Grid */}
      <section className="relative py-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-grid-small [mask-image:linear-gradient(to_bottom,black_40%,transparent)]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background"></div>

        <div className="relative max-w-5xl mx-auto">
          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">{t('hero.title')}</span>
            <br />
            {t('hero.titleSuffix')}
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-2 max-w-3xl mx-auto">
            {t('hero.tagline')}
          </p>

          {/* Authority Statement */}
          <p className="text-base md:text-lg text-primary/80 font-medium mb-4 max-w-2xl mx-auto">
            {t('hero.authorityStatement')}
          </p>

          <p
            className="text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-6"
            dangerouslySetInnerHTML={{ __html: t('hero.description') }}
          />

          {/* Trust Bar - Skills/Tools */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <Badge variant="outline" className="px-4 py-1.5 text-sm font-semibold border-2 hover:bg-primary/5 transition-colors">
              🎭 Playwright
            </Badge>
            <Badge variant="outline" className="px-4 py-1.5 text-sm font-semibold border-2 hover:bg-primary/5 transition-colors">
              ⚡ JavaScript
            </Badge>
            <Badge variant="outline" className="px-4 py-1.5 text-sm font-semibold border-2 hover:bg-primary/5 transition-colors">
              🎯 CSS Selectors
            </Badge>
            <Badge variant="outline" className="px-4 py-1.5 text-sm font-semibold border-2 hover:bg-primary/5 transition-colors">
              🔍 XPath
            </Badge>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link to="/$locale/challenges" params={{ locale }}>
              <Button
                size="lg"
                className="text-lg px-8 py-6 rounded-xl border-2 border-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
              >
                {t('hero.startLearning')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/$locale/tutorials" params={{ locale }}>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 rounded-xl border-2 hover:bg-muted"
              >
                {t('hero.browseTutorials')}
              </Button>
            </Link>
          </div>

          {/* Dynamic Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                {statsLoading ? (
                  <Skeleton className="h-10 w-16 mx-auto" />
                ) : (
                  <AnimatedCounter value={stats?.challenges || 0} suffix="+" />
                )}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {t('stats.challenges')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                {statsLoading ? (
                  <Skeleton className="h-10 w-12 mx-auto" />
                ) : (
                  <AnimatedCounter value={stats?.tutorials || 0} />
                )}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {t('stats.tutorials')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                {statsLoading ? (
                  <Skeleton className="h-10 w-12 mx-auto" />
                ) : (
                  <AnimatedCounter value={stats?.achievements || 0} />
                )}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {t('stats.achievements')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                ∞
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {t('stats.learning')}
              </div>
            </div>
          </div>
        </div>



        {/* Animated Wave Separator */}
        <WaveSeparator />
      </section>

      {/* Learning Path Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('careerPath.title')}{' '}
              <span className="gradient-text">
                {t('careerPath.titleHighlight')}
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('careerPath.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {learningPath.map((tier, index) => (
              <Card
                key={tier.tier}
                className="glass-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl grayscale-[0.5]">{tier.emoji}</span>
                    <div>
                      <div className="text-sm text-muted-foreground font-bold">
                        Phase {index + 1}
                      </div>
                      <h3 className="text-xl font-bold">{tier.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {tier.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {tier.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-xs font-medium border border-border"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm font-bold text-primary">
                    {tier.count > 0 ? (
                      `${tier.count} ${t('careerPath.challenges')}`
                    ) : (
                      <Badge variant="outline" className="text-xs border-dashed border-muted-foreground text-muted-foreground">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Challenges */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('featuredChallenges.title')}{' '}
              <span className="gradient-text">
                {t('featuredChallenges.titleHighlight')}
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('featuredChallenges.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredChallenges.map((challenge) => (
              <Link
                key={challenge.slug}
                to="/$locale/challenges/$slug"
                params={{ locale, slug: challenge.slug }}
              >
                <Card className="glass-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge
                        className="font-bold border-2"
                        variant={
                          challenge.difficulty === 'EASY'
                            ? 'secondary'
                            : challenge.difficulty === 'MEDIUM'
                              ? 'default'
                              : 'destructive'
                        }
                      >
                        {challenge.difficulty}
                      </Badge>
                      <span className="text-sm text-primary font-bold">
                        +{challenge.xp} XP
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      {challenge.title}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium">
                      {challenge.type}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/$locale/challenges" params={{ locale }}>
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl border-2"
              >
                {t('featuredChallenges.viewAll')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('features.title')}{' '}
              <span className="gradient-text">
                {t('features.titleHighlight')}
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="glass-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
              >
                <CardContent className="p-6">
                  <div className="mb-4 p-3 bg-primary/10 rounded-xl w-fit border-2 border-primary/20">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: feature.description }} />
                  {feature.demo && feature.demo}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>



      {/* How It Works Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('howItWorks.title')}{' '}
              <span className="gradient-text">
                {t('howItWorks.titleHighlight')}
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: t('howItWorks.step1.title'),
                description: t('howItWorks.step1.description'),
              },
              {
                step: '2',
                title: t('howItWorks.step2.title'),
                description: t('howItWorks.step2.description'),
              },
              {
                step: '3',
                title: t('howItWorks.step3.title'),
                description: t('howItWorks.step3.description'),
              },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-primary">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: item.description }} />
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card p-12 rounded-3xl border-2 border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('cta.title')}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/$locale/challenges" params={{ locale }}>
                <Button
                  size="lg"
                  className="text-lg px-8 rounded-xl border-2 border-primary shadow-lg shadow-primary/20"
                >
                  {t('cta.getStarted')}
                </Button>
              </Link>
              <Link to="/$locale/leaderboard" params={{ locale }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 rounded-xl border-2"
                >
                  {t('cta.viewLeaderboard')}
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground font-medium">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {t('cta.freeToUse')}
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {t('cta.noCreditCard')}
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {t('cta.learnAtOwnPace')}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
