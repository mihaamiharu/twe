import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  Compass,
  Flame,
  Map,
  RotateCcw,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CTAButton,
  PageContainer,
  PaperSurface,
  SectionHeading,
  StatPill,
} from '@/components/cozy-quest';
import { AchievementBadge } from '@/components/gamification/achievement-badge';
import { XPProgressBar } from '@/components/gamification/xp-progress-bar';
import { getLevelTitle } from '@/lib/gamification';
import { getUserSettings, type UserData } from '@/server/user.fn';

export const Route = createFileRoute('/$locale/_authenticated/profile')({
  component: ProfilePage,
});

type ProfileResponse =
  | { success: true; data: UserData }
  | { success: false; error?: string };

const tierKeys = ['basic', 'beginner', 'intermediate', 'e2e'] as const;
const topicConfig = [
  { key: 'CSS_SELECTOR', label: 'css_selector' },
  { key: 'XPATH_SELECTOR', label: 'xpath_selector' },
  { key: 'JAVASCRIPT', label: 'javascript' },
  { key: 'TYPESCRIPT', label: 'typescript' },
  { key: 'PLAYWRIGHT', label: 'playwright' },
] as const;

function ProfilePage() {
  const { locale } = useParams({ from: '/$locale/_authenticated/profile' });
  const { t } = useTranslation([
    'profile',
    'leaderboard',
    'common',
    'challenges',
  ]);
  const { data, isLoading, error, refetch } = useQuery<ProfileResponse, Error>({
    queryKey: ['profile'],
    queryFn: async () => {
      const result = await getUserSettings({ data: { locale } });
      if (!result.success || !result.data) {
        return { success: false, error: result.error };
      }
      return { success: true, data: result.data };
    },
  });

  if (isLoading) return <JournalLoading />;

  if (error || !data?.success) {
    const responseError = data && !data.success ? data.error : undefined;
    return (
      <main className="min-h-screen py-10 sm:py-14">
        <PageContainer width="narrow">
          <PaperSurface className="px-6 py-14 text-center" texture={false}>
            <AlertCircle
              className="mx-auto size-10 text-destructive"
              aria-hidden="true"
            />
            <h1 className="mt-4 font-display text-3xl font-semibold">
              {t('profile:states.errorTitle')}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              {responseError ||
                error?.message ||
                t('profile:states.errorDescription')}
            </p>
            <Button className="mt-6" onClick={() => void refetch()}>
              <RotateCcw className="mr-2 size-4" aria-hidden="true" />
              {t('profile:states.retry')}
            </Button>
          </PaperSurface>
        </PageContainer>
      </main>
    );
  }

  const user = data.data;
  const levelTitle = t(`common:levelTitles.${getLevelTitle(user.level)}`);
  const recentAchievements = user.earnedAchievements.slice(0, 3);

  return (
    <main className="min-h-screen py-8 sm:py-10 lg:py-12">
      <PageContainer width="wide">
        <PaperSurface className="relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10">
          <div
            aria-hidden="true"
            className="absolute -right-14 -top-16 size-56 rounded-full border-[18px] border-accent/25"
          />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)] lg:items-end">
            <div>
              <SectionHeading
                as="h1"
                align="left"
                eyebrow={t('profile:journal.eyebrow')}
                title={t('profile:journal.title')}
                description={t('profile:journal.description')}
              />
              <div className="mt-7 flex items-center gap-4">
                <Avatar className="size-16 border-2 border-primary/20 sm:size-20">
                  <AvatarImage
                    src={user.image}
                    alt={user.name || user.email}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    {t('profile:journal.testerProfile')}
                  </p>
                  <h2 className="truncate text-2xl font-bold sm:text-3xl">
                    {user.name || t('leaderboard:table.anonymous')}
                  </h2>
                  <p className="truncate text-sm text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Badge
                  variant="secondary"
                  className="gap-1.5 px-3 py-1 text-sm"
                >
                  <Trophy className="size-4" aria-hidden="true" />
                  {t('profile:header.level', { level: user.level })}
                </Badge>
                <span className="text-sm font-semibold text-muted-foreground">
                  {levelTitle}
                </span>
              </div>
              <XPProgressBar totalXP={user.xp} size="lg" />
            </div>
          </div>
        </PaperSurface>

        <section
          className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4"
          aria-label={t('profile:journal.summary')}
        >
          <StatPill
            value={user.stats.completedTutorials}
            label={t('profile:stats.tutorials')}
          />
          <StatPill
            value={user.stats.completedChallenges}
            label={t('profile:stats.challenges')}
          />
          <StatPill
            value={user.xp.toLocaleString()}
            label={t('profile:stats.totalXp')}
          />
          <StatPill
            value={user.stats.achievementsCount}
            label={t('profile:stats.achievements')}
          />
        </section>

        <div className="mt-7 grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <RecommendationCard user={user} locale={locale} />
            <AdventurePaths user={user} />
            <TopicProgress user={user} />
            <RecentActivity user={user} />
          </div>
          <aside className="space-y-6 lg:col-span-4">
            <StreakCard user={user} />
            <ContinueLearningCard user={user} locale={locale} />
            <RecentAchievements achievements={recentAchievements} />
          </aside>
        </div>

        <BadgeCollection achievements={user.earnedAchievements} />
        <XpMilestones xp={user.xp} />

        <PaperSurface
          className="mt-8 border-destructive/30 bg-destructive/5"
          texture={false}
        >
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-semibold text-destructive">
                <AlertCircle className="size-5" aria-hidden="true" />
                {t('profile:account.title')}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('profile:account.description')}
              </p>
            </div>
            <Button variant="destructive" asChild>
              <a
                href={`mailto:admin@testingwithekki.com?subject=Request Account Deletion&body=I would like to request the deletion of my account associated with this email: ${user.email}`}
              >
                {t('profile:account.delete')}
              </a>
            </Button>
          </div>
        </PaperSurface>
      </PageContainer>
    </main>
  );
}

function RecommendationCard({
  user,
  locale,
}: {
  user: UserData;
  locale: string;
}) {
  const { t } = useTranslation(['profile', 'common', 'challenges']);
  const challenge = user.journal.recommendedChallenge;
  return (
    <PaperSurface className="p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {t('profile:recommendation.eyebrow')}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold">
            {t('profile:recommendation.title')}
          </h2>
        </div>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Target className="size-5" aria-hidden="true" />
        </span>
      </div>
      {challenge ? (
        <div className="mt-5 flex flex-col gap-4 rounded-xl border border-border bg-background/65 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold">{challenge.title}</h3>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">
                {t(`challenges:types.${challenge.type.toLowerCase()}`)}
              </Badge>
              <Badge variant="outline">
                {t(`common:labels.${challenge.difficulty.toLowerCase()}`)}
              </Badge>
              <span className="inline-flex items-center gap-1 font-semibold text-primary">
                <Zap className="size-3.5" aria-hidden="true" />
                {challenge.xpReward} XP
              </span>
            </div>
          </div>
          <CTAButton asChild className="shrink-0">
            <Link
              to="/$locale/challenges/$slug"
              params={{ locale, slug: challenge.slug }}
            >
              {t('profile:recommendation.open')}
              <ArrowRight className="size-4" />
            </Link>
          </CTAButton>
        </div>
      ) : (
        <JournalEmpty
          icon={CheckCircle2}
          title={t('profile:recommendation.completeTitle')}
          description={t('profile:recommendation.completeDescription')}
          action={
            <Button variant="outline" asChild>
              <Link to="/$locale/challenges" params={{ locale }}>
                {t('common:actions.viewAll')}
              </Link>
            </Button>
          }
        />
      )}
    </PaperSurface>
  );
}

function AdventurePaths({ user }: { user: UserData }) {
  const { t } = useTranslation('profile');
  return (
    <PaperSurface className="p-6" texture={false}>
      <div className="flex items-start gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Map className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {t('paths.eyebrow')}
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            {t('paths.title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('paths.description')}
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {tierKeys.map((tier) => {
          const completed = user.stats.challengesByTier[tier] || 0;
          const total = user.stats.tierTotalCounts[tier] || 0;
          const percent = total ? Math.round((completed / total) * 100) : 0;
          const status =
            completed === total && total > 0
              ? 'completed'
              : completed > 0
                ? 'inProgress'
                : 'notStarted';
          return (
            <div
              key={tier}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{t(`tierProgress.${tier}`)}</h3>
                <Badge variant="outline">{t(`paths.status.${status}`)}</Badge>
              </div>
              <Progress
                value={percent}
                className="mt-4"
                aria-label={t(`tierProgress.${tier}`)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-valuetext={t('paths.progressValue', {
                  completed,
                  total,
                  percent,
                })}
              />
              <p className="mt-2 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                {t('paths.progressValue', { completed, total, percent })}
              </p>
            </div>
          );
        })}
      </div>
    </PaperSurface>
  );
}

function TopicProgress({ user }: { user: UserData }) {
  const { t } = useTranslation(['profile', 'challenges']);
  return (
    <PaperSurface className="p-6" texture={false}>
      <div className="flex items-start gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Compass className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {t('profile:topics.eyebrow')}
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            {t('profile:topics.title')}
          </h2>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {topicConfig.map((topic) => {
          const completed = user.stats.challengesByType[topic.key] || 0;
          const total = user.journal.challengeTypeTotalCounts[topic.key] || 0;
          const percent = total ? Math.round((completed / total) * 100) : 0;
          return (
            <div key={topic.key}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold">
                  {t(`challenges:types.${topic.label}`)}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {t('profile:topics.progressValue', {
                    completed,
                    total,
                    percent,
                  })}
                </span>
              </div>
              <Progress
                value={percent}
                className="mt-2"
                aria-label={t(`challenges:types.${topic.label}`)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
              />
            </div>
          );
        })}
      </div>
    </PaperSurface>
  );
}

function StreakCard({ user }: { user: UserData }) {
  const { t } = useTranslation('profile');
  return (
    <PaperSurface className="p-6">
      <span className="flex size-10 items-center justify-center rounded-xl bg-[color:var(--quest-clay)]/15 text-[color:var(--quest-clay)]">
        <Flame className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primary">
        {t('streak.eyebrow')}
      </p>
      <h2 className="mt-1 font-display text-2xl font-semibold">
        {t('streak.title')}
      </h2>
      <p className="mt-4 text-4xl font-bold tabular-nums text-primary">
        {t('streak.current', { count: user.journal.currentStreak })}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {t('streak.description')}
      </p>
      <div className="mt-5 border-t border-border pt-4 text-sm">
        <span className="text-muted-foreground">{t('streak.longest')}</span>
        <span className="float-right font-semibold tabular-nums">
          {t('streak.days', { count: user.journal.longestStreak })}
        </span>
      </div>
    </PaperSurface>
  );
}

function ContinueLearningCard({
  user,
  locale,
}: {
  user: UserData;
  locale: string;
}) {
  const { t } = useTranslation(['profile', 'common']);
  const tutorial = user.journal.continueTutorial;
  return (
    <PaperSurface className="p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BookOpen className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {t('profile:continue.eyebrow')}
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            {t('profile:continue.title')}
          </h2>
        </div>
      </div>
      {tutorial ? (
        <>
          <h3 className="mt-5 font-semibold">{tutorial.title}</h3>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden="true" />
              {t('profile:continue.minutes', {
                count: tutorial.estimatedMinutes,
              })}
            </span>
            {tutorial.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          <CTAButton variant="outline" asChild className="mt-5 w-full">
            <Link
              to="/$locale/tutorials/$slug"
              params={{ locale, slug: tutorial.slug }}
            >
              {t('profile:continue.open')}
              <ArrowRight className="size-4" />
            </Link>
          </CTAButton>
        </>
      ) : (
        <JournalEmpty
          icon={CheckCircle2}
          title={t('profile:continue.completeTitle')}
          description={t('profile:continue.completeDescription')}
          action={
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link to="/$locale/tutorials" params={{ locale }}>
                {t('common:actions.browseTutorials')}
              </Link>
            </Button>
          }
        />
      )}
    </PaperSurface>
  );
}

function RecentAchievements({
  achievements,
}: {
  achievements: UserData['earnedAchievements'];
}) {
  const { t } = useTranslation('profile');
  return (
    <PaperSurface className="p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-[color:var(--quest-gold)]/15 text-foreground">
          <Award className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {t('achievements.recentEyebrow')}
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            {t('achievements.recentTitle')}
          </h2>
        </div>
      </div>
      {achievements.length ? (
        <div className="mt-5 space-y-3">
          {achievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              earned
              earnedAt={new Date(achievement.unlockedAt)}
              size="sm"
              showProgress={false}
            />
          ))}
        </div>
      ) : (
        <JournalEmpty
          icon={Award}
          title={t('achievements.emptyTitle')}
          description={t('achievements.emptyDescription')}
        />
      )}
    </PaperSurface>
  );
}

function RecentActivity({ user }: { user: UserData }) {
  const { t } = useTranslation('profile');
  return (
    <PaperSurface className="p-6" texture={false}>
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Code2 className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {t('activity.eyebrow')}
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            {t('activity.title')}
          </h2>
        </div>
      </div>
      {user.recentActivity.length ? (
        <ol className="mt-6 space-y-3">
          {user.recentActivity.map((activity, index) => (
            <li
              key={`${activity.title}-${index}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <p className="font-semibold">{activity.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activity.type === 'challenge'
                    ? t('activity.challenge')
                    : t('activity.achievement')}{' '}
                  · {activity.date}
                </p>
              </div>
              <Badge variant="secondary" className="font-mono">
                +{activity.xp} XP
              </Badge>
            </li>
          ))}
        </ol>
      ) : (
        <JournalEmpty
          icon={Code2}
          title={t('activity.emptyTitle')}
          description={t('activity.empty')}
        />
      )}
    </PaperSurface>
  );
}

function BadgeCollection({
  achievements,
}: {
  achievements: UserData['earnedAchievements'];
}) {
  const { t } = useTranslation('profile');
  return (
    <section className="mt-8" aria-labelledby="badge-collection">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {t('achievements.collectionEyebrow')}
          </p>
          <h2
            id="badge-collection"
            className="mt-1 font-display text-3xl font-semibold"
          >
            {t('achievements.collectionTitle')}
          </h2>
        </div>
        <Badge variant="secondary">
          {t('achievements.collectionCount', { count: achievements.length })}
        </Badge>
      </div>
      {achievements.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {achievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              earned
              earnedAt={new Date(achievement.unlockedAt)}
              showProgress={false}
            />
          ))}
        </div>
      ) : (
        <PaperSurface className="px-6 py-12" texture={false}>
          <JournalEmpty
            icon={Award}
            title={t('achievements.emptyTitle')}
            description={t('achievements.emptyDescription')}
          />
        </PaperSurface>
      )}
    </section>
  );
}

function XpMilestones({ xp }: { xp: number }) {
  const { t } = useTranslation('profile');
  const milestones = [100, 500, 1000, 2500, 5000];
  return (
    <PaperSurface className="mt-8 p-6" texture={false}>
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Zap className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {t('milestones.eyebrow')}
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            {t('milestones.title')}
          </h2>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {milestones.map((milestone) => {
          const reached = xp >= milestone;
          return (
            <Badge
              key={milestone}
              variant={reached ? 'default' : 'outline'}
              className="gap-1.5 px-3 py-1.5"
            >
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              {milestone.toLocaleString()} XP ·{' '}
              {t(reached ? 'milestones.reached' : 'milestones.notReached')}
            </Badge>
          );
        })}
      </div>
    </PaperSurface>
  );
}

function JournalEmpty({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mt-5 text-center">
      <Icon
        className="mx-auto size-8 text-muted-foreground/70"
        aria-hidden="true"
      />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action}
    </div>
  );
}

function JournalLoading() {
  return (
    <main className="min-h-screen py-8 sm:py-10" aria-busy="true">
      <PageContainer width="wide">
        <span className="sr-only">Loading profile</span>
        <Skeleton className="h-72 rounded-[1.25rem]" />
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="mt-7 grid gap-6 lg:grid-cols-12">
          <Skeleton className="h-[38rem] rounded-[1.25rem] lg:col-span-8" />
          <Skeleton className="h-[38rem] rounded-[1.25rem] lg:col-span-4" />
        </div>
      </PageContainer>
    </main>
  );
}

export default ProfilePage;
