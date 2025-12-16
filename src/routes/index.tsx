import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

export const Route = createFileRoute('/')({ component: HomePage });

function HomePage() {
  const features = [
    {
      icon: <BookOpen className="w-10 h-10 text-primary" />,
      title: 'Interactive Tutorials',
      description:
        'Learn testing concepts step-by-step with beautifully rendered markdown content and code examples.',
    },
    {
      icon: <Code2 className="w-10 h-10 text-primary" />,
      title: 'Playwright Challenges',
      description:
        'Write real Playwright-style code in our Monaco editor. Get instant feedback on your solutions.',
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
      title: 'Instant Execution',
      description:
        'Your code runs instantly in the browser. No setup required, no waiting for servers.',
    },
    {
      icon: <Sparkles className="w-10 h-10 text-primary" />,
      title: 'Track Progress',
      description:
        'See your progress across tutorials and challenges. Never lose track of where you left off.',
    },
  ];

  const stats = [
    { value: '50+', label: 'Challenges' },
    { value: '20+', label: 'Tutorials' },
    { value: '25+', label: 'Achievements' },
    { value: '∞', label: 'Learning' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>

        <div className="relative max-w-5xl mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <img
              src="/logo.jpg"
              alt="TestingWithEkki Logo"
              className="w-20 h-20 rounded-2xl shadow-lg shadow-primary/30"
            />
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">TestingWithEkki</span>
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
            Master QA testing skills through interactive challenges
          </p>
          <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-10">
            Learn Playwright, CSS selectors, XPath, and more with hands-on coding challenges.
            Earn XP, unlock achievements, and become a testing expert.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link to="/challenges">
              <Button size="lg" className="text-lg px-8 py-6">
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

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
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
      <section className="py-20 px-6 bg-muted/30">
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
                description: 'Use our Monaco editor with syntax highlighting and auto-completion.',
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
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card p-12 rounded-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join TestingWithEkki today and level up your QA testing skills.
              It's free to get started!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login">
                <Button size="lg" className="text-lg px-8">
                  Create Free Account
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
      </section>
    </div>
  );
}
