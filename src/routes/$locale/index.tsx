import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
import { getDashboardStats } from '@/server/dashboard.fn';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/$locale/')({ component: HomePage });

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
    },
    {
      icon: <Target className="w-10 h-10 text-primary" />,
      title: t('features.selectorChallenges.title'),
      description: t('features.selectorChallenges.description'),
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
      count: (stats?.tiers.basic || 0),
    },
    {
      tier: 'beginner',
      emoji: '🟡',
      title: t('tiers.beginner.title'),
      description: t('tiers.beginner.description'),
      skills: t('tiers.beginner.skills', { returnObjects: true }) as string[],
      count: (stats?.tiers.beginner || 0),
    },
    {
      tier: 'intermediate',
      emoji: '🟠',
      title: t('tiers.intermediate.title'),
      description: t('tiers.intermediate.description'),
      skills: t('tiers.intermediate.skills', { returnObjects: true }) as string[],
      count: (stats?.tiers.intermediate || 0),
    },
    {
      tier: 'expert',
      emoji: '🔴',
      title: t('tiers.expert.title'),
      description: t('tiers.expert.description'),
      skills: t('tiers.expert.skills', { returnObjects: true }) as string[],
      count: (stats?.tiers.expert || 0),
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
      title: 'Click Actions',
      difficulty: 'MEDIUM',
      type: 'Playwright',
      xp: 45,
      slug: 'pw-click-actions',
    },
    {
      title: 'Page Object Model',
      difficulty: 'HARD',
      type: 'Expert',
      xp: 80,
      slug: 'pw-first-page-object',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section with animated gradient */}
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent animate-pulse"></div>

        <div className="relative max-w-5xl mx-auto">


          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">{t('hero.title')}</span>
            <br />
            {t('hero.titleSuffix')}
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
            {t('hero.tagline')}
          </p>
          <p
            className="text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-10"
            dangerouslySetInnerHTML={{ __html: t('hero.description') }}
          />

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link to="/$locale/challenges" params={{ locale }}>
              <Button size="lg" className="text-lg px-8 py-6 rounded-xl border-2 border-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                {t('hero.startLearning')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/$locale/tutorials" params={{ locale }}>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-xl border-2 hover:bg-muted">
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
              <div className="text-sm text-muted-foreground font-medium">{t('stats.challenges')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                {statsLoading ? (
                  <Skeleton className="h-10 w-12 mx-auto" />
                ) : (
                  <AnimatedCounter value={stats?.tutorials || 0} />
                )}
              </div>
              <div className="text-sm text-muted-foreground font-medium">{t('stats.tutorials')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                {statsLoading ? (
                  <Skeleton className="h-10 w-12 mx-auto" />
                ) : (
                  <AnimatedCounter value={stats?.achievements || 0} />
                )}
              </div>
              <div className="text-sm text-muted-foreground font-medium">{t('stats.achievements')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">∞</div>
              <div className="text-sm text-muted-foreground font-medium">{t('stats.learning')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Path Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('careerPath.title')} <span className="gradient-text">{t('careerPath.titleHighlight')}</span>
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
                    <span className="text-3xl">{tier.emoji}</span>
                    <div>
                      <div className="text-sm text-muted-foreground font-bold">Tier {index + 1}</div>
                      <h3 className="text-xl font-bold">{tier.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {tier.skills.map(skill => (
                      <Badge key={skill} variant="secondary" className="text-xs font-medium border border-border">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm font-bold text-primary">
                    {tier.count} {t('careerPath.challenges')}
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
              {t('featuredChallenges.title')} <span className="gradient-text">{t('featuredChallenges.titleHighlight')}</span>
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
                    <h3 className="text-xl font-bold mb-2">{challenge.title}</h3>
                    <p className="text-sm text-muted-foreground font-medium">{challenge.type}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/$locale/challenges" params={{ locale }}>
              <Button variant="outline" size="lg" className="rounded-xl border-2">
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
              {t('features.title')} <span className="gradient-text">{t('features.titleHighlight')}</span>
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
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Hall of Fame Section */}
      {stats?.latestAchievements && stats.latestAchievements.length > 0 && (
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('hallOfFame.title')}{' '}
                <span className="gradient-text">{t('hallOfFame.titleHighlight')}</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                {t('hallOfFame.subtitle')}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {stats.latestAchievements.map((achievement, index) => (
                <div key={index} className="flex flex-col items-center text-center">
                  <div className="relative mb-2">
                    <Avatar className="h-16 w-16 mb-2 border-2 border-primary/50">
                      <AvatarImage src={achievement.userAvatar || ''} />
                      <AvatarFallback>
                        {achievement.userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-2xl">
                      {achievement.achievementIcon}
                    </div>
                  </div>
                  <p className="font-semibold text-sm">{achievement.userName}</p>
                  <p className="text-xs text-muted-foreground">
                    Unlocked {achievement.achievementName}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('howItWorks.title')} <span className="gradient-text">{t('howItWorks.titleHighlight')}</span>
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
                  <span className="text-2xl font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

      </section >

      {/* Mission Section */}
      < section className="py-20 px-6 bg-muted/30" >
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('mission.title')} <span className="gradient-text">{t('mission.titleHighlight')}</span>
            </h2>
          </div>

          <Card className="glass-card relative overflow-hidden">
            <CardContent className="p-8 md:p-12 relative z-10">
              {/* Decorative quote mark */}
              <div className="absolute top-4 right-8 text-9xl text-primary/10 font-serif leading-none select-none pointer-events-none">
                &rdquo;
              </div>

              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed font-reading">
                <p>{t('mission.story1')}</p>
                <p>
                  <strong className="text-foreground font-medium">{t('mission.story2')}</strong>
                </p>
                <p>{t('mission.story3')}</p>
              </div>

              <div className="mt-8 pt-8 border-t border-border/50 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-xl shadow-sm border-2 border-primary">
                  E
                </div>
                <div>
                  <div className="font-bold text-foreground">{t('mission.author')}</div>
                  <div className="text-sm text-muted-foreground">{t('mission.authorRole')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section >

      {/* CTA Section */}
      < section className="py-20 px-6" >
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card p-12 rounded-3xl border-2 border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('cta.title')}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login">
                <Button size="lg" className="text-lg px-8 rounded-xl border-2 border-primary shadow-lg shadow-primary/20">
                  {t('cta.getStarted')}
                </Button>
              </Link>
              <Link to="/leaderboard">
                <Button variant="outline" size="lg" className="text-lg px-8 rounded-xl border-2">
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
      </section >
    </div >
  );
}
