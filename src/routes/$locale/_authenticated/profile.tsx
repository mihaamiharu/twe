import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  Award,
  BookOpen,
  Code,
  ExternalLink,
  Trophy,
  Zap,
} from 'lucide-react';
import { getUserSettings } from '@/server/user.fn';
import { localeParams, LocaleRoutes } from '@/lib/navigation';

export const Route = createFileRoute('/$locale/_authenticated/profile')({
  component: ProfilePage,
});

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image?: string;
  createdAt: Date;
  xp: number;
  level: number;
  xpProgress: number;
  xpNeeded: number;
  xpProgressPercentage: number;
  profileVisibility: 'PUBLIC' | 'PRIVATE';
  showOnLeaderboard: boolean;
  stats: {
    completedChallenges: number;
    completedTutorials: number;
    achievementsCount: number;
    challengesByType: Record<string, number>;
    challengesByTier: Record<string, number>;
    tierTotalCounts: Record<string, number>;
  };
  earnedAchievements: {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: Date;
    xpReward: number;
    category: string;
  }[];
  recentActivity: {
    type: 'challenge' | 'achievement';
    title: string;
    xp: number;
    date: string;
  }[];
}

interface ProfileResponse {
  success: boolean;
  data?: UserProfile;
  error?: string;
}

function ProfilePage() {
  const { locale } = useParams({ from: '/$locale/_authenticated/profile' });
  const { t } = useTranslation(['profile', 'leaderboard', 'common']);
  const { data, isLoading, error } = useQuery<ProfileResponse, Error>({
    queryKey: ['profile'],
    queryFn: async (): Promise<ProfileResponse> => {
      const result = await getUserSettings({ data: { locale } });
      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || 'Failed to fetch profile',
        };
      }
      return {
        success: true,
        data: result.data as UserProfile,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-10">
        <div className="mx-auto max-w-5xl">
          <Card className="glass-card mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-2 w-full max-w-md" />
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="glass-card">
                <CardContent className="p-6">
                  <Skeleton className="mb-2 h-8 w-8" />
                  <Skeleton className="mb-1 h-6 w-12" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.success || !data?.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h3 className="mb-2 text-lg font-semibold">
            {t('common:messages.error')}
          </h3>
          <p className="text-muted-foreground">{t('common:messages.retry')}</p>
        </div>
      </div>
    );
  }

  const user = data.data;
  const getTierStats = (tier: string) => {
    const completed = user.stats.challengesByTier?.[tier] || 0;
    const total = user.stats.tierTotalCounts?.[tier] || 0;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    return { completed, total, progress };
  };

  const tiers = [
    { key: 'basic', label: t('profile:tierProgress.basic') },
    { key: 'beginner', label: t('profile:tierProgress.beginner') },
    { key: 'intermediate', label: t('profile:tierProgress.intermediate') },
    { key: 'e2e', label: t('profile:tierProgress.e2e') },
  ].map((tier) => ({ ...tier, stats: getTierStats(tier.key) }));

  const displayName = user.name || t('leaderboard:table.anonymous');

  return (
    <div className="min-h-screen bg-background p-4 page-transition sm:p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <Card className="glass-card mb-8">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
              <Avatar className="h-24 w-24 shrink-0">
                <AvatarImage
                  src={user.image || undefined}
                  alt={displayName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-accent text-2xl text-accent-foreground">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="truncate text-3xl font-semibold tracking-tight">
                    {displayName}
                  </h1>
                  <Badge className="bg-accent text-accent-foreground">
                    {t('profile:header.level', { level: user.level })}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {user.email}
                </p>

                <div className="mt-5 max-w-xl space-y-2">
                  <div className="flex flex-wrap justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {t('profile:header.progressTo', {
                        level: user.level + 1,
                      })}
                    </span>
                    <span className="font-mono text-xs">
                      {user.xpProgress} / {user.xpNeeded} XP
                    </span>
                  </div>
                  <Progress value={user.xpProgressPercentage} className="h-2" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                    {t('profile:header.xpEarned', {
                      xp: user.xp.toLocaleString(),
                    })}
                  </div>
                </div>
              </div>

              <Button variant="outline" asChild className="shrink-0">
                <Link
                  to={LocaleRoutes.leaderboard}
                  params={localeParams(locale)}
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  {t('common:navigation.leaderboard')}
                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="glass-card card-hover">
            <CardContent className="p-5">
              <BookOpen className="mb-3 h-5 w-5 text-primary" />
              <div className="text-2xl font-semibold">
                {user.stats.completedTutorials}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('profile:stats.tutorials')}
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card card-hover">
            <CardContent className="p-5">
              <Code className="mb-3 h-5 w-5 text-primary" />
              <div className="text-2xl font-semibold">
                {user.stats.completedChallenges}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('profile:stats.challenges')}
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card card-hover">
            <CardContent className="p-5">
              <Award className="mb-3 h-5 w-5 text-primary" />
              <div className="text-2xl font-semibold">
                {user.stats.achievementsCount}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('profile:stats.achievements')}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="progress">
          <TabsList className="w-full justify-start overflow-x-auto bg-transparent p-0">
            <TabsTrigger
              value="progress"
              className="min-h-11 rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary"
            >
              {t('profile:tabs.progress')}
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="min-h-11 rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary"
            >
              {t('profile:tabs.activity')}
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="min-h-11 rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary"
            >
              {t('profile:tabs.achievements')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>{t('profile:tierProgress.title')}</CardTitle>
                <CardDescription>
                  {t('profile:tierProgress.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {tiers.map(({ key, label, stats }) => (
                  <div key={key} className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{label}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {stats.completed} / {stats.total}
                      </span>
                    </div>
                    <Progress value={stats.progress} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>{t('profile:activity.title')}</CardTitle>
                <CardDescription>
                  {t('profile:activity.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!user.recentActivity || user.recentActivity.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Code className="mx-auto mb-3 h-10 w-10 opacity-30" />
                    <p>{t('profile:activity.empty')}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {user.recentActivity.map((activity, index) => (
                      <div
                        key={`${activity.type}-${activity.title}-${index}`}
                        className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-md bg-accent p-2 text-accent-foreground">
                            {activity.type === 'challenge' ? (
                              <Code className="h-4 w-4" />
                            ) : (
                              <Award className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{activity.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {activity.date}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="w-fit font-mono text-xs"
                        >
                          +{activity.xp} XP
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            {!user.earnedAchievements ||
            user.earnedAchievements.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Award className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p>{t('profile:achievements.empty')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {user.earnedAchievements.map((achievement) => (
                  <Card key={achievement.id} className="glass-card">
                    <CardContent className="flex gap-3 p-5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-xl">
                        {achievement.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">{achievement.name}</h3>
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase"
                          >
                            {achievement.category.toLowerCase()}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {t('profile:achievements.earned', {
                            date: new Date(
                              achievement.unlockedAt,
                            ).toLocaleDateString(),
                            xp: achievement.xpReward,
                          })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Card className="mt-8 border-brand-error/30 bg-brand-error/5">
          <CardHeader>
            <CardTitle className="text-brand-error">
              {t('profile:danger.title')}
            </CardTitle>
            <CardDescription>{t('profile:danger.description')}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-end border-t border-brand-error/20 bg-brand-error/5">
            <Button variant="destructive" asChild>
              <a
                href={`mailto:admin@testingwithekki.com?subject=Request Account Deletion&body=I would like to request the deletion of my account associated with this email: ${user.email}`}
              >
                {t('profile:danger.requestDeletion')}
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
