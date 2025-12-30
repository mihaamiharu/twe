import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
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
  Award,
} from 'lucide-react';
import { AnimatedCounter } from '@/components/AnimatedCounter';

export const Route = createFileRoute('/')({ component: HomePage });

interface StatsResponse {
  success: boolean;
  data: {
    challenges: number;
    tutorials: number;
    achievements: number;
    tiers: {
      basic: number;
      beginner: number;
      intermediate: number;
      expert: number;
    };
  };
}

function HomePage() {
  // Fetch real stats from API
  const { data: statsData, isLoading: statsLoading } = useQuery<StatsResponse>({
    queryKey: ['homepage-stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const stats = statsData?.data;

  const features = [
    {
      icon: <BookOpen className="w-10 h-10 text-primary" />,
      title: 'Interactive Tutorials',
      description:
        'Learn testing concepts step-by-step. I\'ve broken down the tricky parts so you don\'t have to struggle.',
    },
    {
      icon: <Code2 className="w-10 h-10 text-primary" />,
      title: 'Playwright Challenges',
      description:
        'Practice with real scenarios. It\'s like having a sandbox to try things without breaking production.',
    },
    {
      icon: <Target className="w-10 h-10 text-primary" />,
      title: 'Selector Challenges',
      description:
        'Master CSS and XPath selectors with visual feedback. See elements highlight as you type.',
    },
    {
      icon: <Trophy className="w-10 h-10 text-primary" />,
      title: 'Gamification',
      description:
        'Earn XP, level up, unlock achievements, and compete on the leaderboard. Learning made fun!',
    },
    {
      icon: <Zap className="w-10 h-10 text-primary" />,
      title: 'Instant Feedback',
      description:
        'Get results immediately. Like a friend sitting next to you pointing out what needs fixing.',
    },
    {
      icon: <Sparkles className="w-10 h-10 text-primary" />,
      title: 'Track Progress',
      description:
        'See your progress across tutorials and challenges. Never lose track of where you left off.',
    },
  ];

  const learningPath = [
    {
      tier: 'Basic',
      emoji: '🟢',
      title: 'Selectors',
      description: 'Master CSS and XPath selectors - the foundation of web testing',
      skills: ['CSS Selectors', 'XPath Queries', 'Element Targeting'],
      count: stats?.tiers.basic || 23,
    },
    {
      tier: 'Beginner',
      emoji: '🟡',
      title: 'JavaScript',
      description: 'Learn JavaScript fundamentals for test automation',
      skills: ['Variables & Types', 'DOM Manipulation', 'Async/Await'],
      count: stats?.tiers.beginner || 23,
    },
    {
      tier: 'Intermediate',
      emoji: '🟠',
      title: 'Playwright',
      description: 'Build real automated tests with Playwright',
      skills: ['Navigation', 'Locators', 'Assertions', 'Waits'],
      count: stats?.tiers.intermediate || 32,
    },
    {
      tier: 'Expert',
      emoji: '🔴',
      title: 'Advanced',
      description: 'Professional patterns for production testing',
      skills: ['Page Objects', 'Data-Driven', 'CI/CD'],
      count: stats?.tiers.expert || 18,
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
          {/* Logo */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {/* Dark Mode Logo */}
            <img
              src="/logo-dark.png"
              alt="TestingWithEkki Logo"
              className="w-20 h-20 rounded-2xl shadow-lg shadow-primary/30 hover:scale-105 transition-transform hidden dark:block"
            />
            {/* Light Mode Logo */}
            <img
              src="/logo-light.png"
              alt="TestingWithEkki Logo"
              className="w-20 h-20 rounded-2xl shadow-lg shadow-primary/30 hover:scale-105 transition-transform block dark:hidden"
            />
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">Learn QA Automation</span>
            <br />
            with Practical Challenges
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
            Build real-world skills, not just theory.
          </p>
          <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-10">
            I'm sharing the <strong>practical skills I accumulated from supportive mentors and real-world problem solving</strong>,
            helping you build confidence step-by-step.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link to="/challenges">
              <Button size="lg" className="text-lg px-8 py-6 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                Start Learning
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/tutorials">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Browse Tutorials
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
              <div className="text-sm text-muted-foreground">Challenges</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                {statsLoading ? (
                  <Skeleton className="h-10 w-12 mx-auto" />
                ) : (
                  <AnimatedCounter value={stats?.tutorials || 0} />
                )}
              </div>
              <div className="text-sm text-muted-foreground">Tutorials</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                {statsLoading ? (
                  <Skeleton className="h-10 w-12 mx-auto" />
                ) : (
                  <AnimatedCounter value={stats?.achievements || 0} />
                )}
              </div>
              <div className="text-sm text-muted-foreground">Achievements</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">∞</div>
              <div className="text-sm text-muted-foreground">Learning</div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Path Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Your <span className="gradient-text">Career Path</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From selector basics to advanced automation architectures.
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
                      <div className="text-sm text-muted-foreground">Tier {index + 1}</div>
                      <h3 className="text-xl font-semibold">{tier.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {tier.skills.map(skill => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {tier.count} challenges
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
              Solve a <span className="gradient-text">Real Problem</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Start coding immediately. No setup required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredChallenges.map((challenge) => (
              <Link
                key={challenge.slug}
                to="/challenges/$slug"
                params={{ slug: challenge.slug }}
              >
                <Card className="glass-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge
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
                      <span className="text-sm text-primary font-medium">
                        +{challenge.xp} XP
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{challenge.title}</h3>
                    <p className="text-sm text-muted-foreground">{challenge.type}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/challenges">
              <Button variant="outline" size="lg">
                View All Challenges
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
              Everything You Need to <span className="gradient-text">Learn Testing</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete platform designed to take you from beginner to expert
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="glass-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
              >
                <CardContent className="p-6">
                  <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
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
              How It <span className="gradient-text">Works</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Choose a Challenge',
                description: 'Pick from Playwright, CSS selectors, or JavaScript challenges.',
              },
              {
                step: '2',
                title: 'Write Your Code',
                description: 'Use our embedded code editor to write and test your automation scripts.',
              },
              {
                step: '3',
                title: 'Get Instant Feedback',
                description: 'Run your code and see results immediately. Earn XP when you pass!',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
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
              Why I <span className="gradient-text">Built This</span>
            </h2>
          </div>

          <Card className="relative overflow-hidden border-2 border-border shadow-md bg-card">
            <CardContent className="p-8 md:p-12 relative z-10">
              {/* Decorative quote mark */}
              <div className="absolute top-4 right-8 text-9xl text-primary/10 font-serif leading-none select-none pointer-events-none">
                &rdquo;
              </div>

              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed font-reading">
                <p>
                  When I started my career, I had zero QA experience. I was fortunate to have seniors who patiently guided me, explaining concepts I struggled with and showing me the ropes.
                </p>
                <p>
                  <strong className="text-foreground font-medium">But I know not everyone has that senior who patiently guides them.</strong>
                </p>
                <p>
                  I created this platform to try and be that one for you, passing knowledge forward and breaking down complex concepts into hands-on lessons.
                </p>
                <p className="italic text-foreground font-medium">
                  It's the kind of guidance I wish I knew when I started.
                </p>
              </div>

              <div className="mt-8 pt-8 border-t border-border/50 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-xl shadow-sm">
                  E
                </div>
                <div>
                  <div className="font-bold text-foreground">Ekki</div>
                  <div className="text-sm text-muted-foreground">Creator of TestingWithEkki</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section >

      {/* CTA Section */}
      < section className="py-20 px-6" >
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card p-12 rounded-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Your Quality Engineering Career
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of testers mastering standard industry tools.
              Free forever for individuals.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login">
                <Button size="lg" className="text-lg px-8">
                  Get Started for Free
                </Button>
              </Link>
              <Link to="/leaderboard">
                <Button variant="outline" size="lg" className="text-lg px-8">
                  View Leaderboard
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Free to use
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Learn at your own pace
              </span>
            </div>
          </div>
        </div>
      </section >
    </div >
  );
}
