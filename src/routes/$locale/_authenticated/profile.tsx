import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, BookOpen, Code, Settings, Zap, AlertCircle } from 'lucide-react';
import { getXPForLevel } from '@/lib/gamification';
import { getUserSettings } from '@/lib/user.fn';
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
    };
    recentAchievements: {
        name: string;
        description: string;
        icon: string;
        unlockedAt: Date;
    }[];
    recentActivity: {
        type: 'challenge' | 'achievement';
        title: string;
        xp: number;
        date: string;
    }[];
    heatmapData: {
        date: string;
        count: number;
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
    // Auth is guaranteed by _authenticated parent route
    const { data, isLoading, error } = useQuery<ProfileResponse, Error>({
        queryKey: ['profile'],
        queryFn: async (): Promise<ProfileResponse> => {
            const result = await getUserSettings({ data: { locale } });
            if (!result.success || !result.data) {
                return {
                    success: false,
                    error: result.error || 'Failed to fetch profile'
                };
            }
            // Cast the result.data to UserProfile
            return {
                success: true,
                data: result.data as UserProfile
            };
        },
    });

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen p-6 md:p-10">
                <div className="max-w-6xl mx-auto">
                    <Card className="glass-card mb-8">
                        <CardContent className="p-8">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                <Skeleton className="h-24 w-24 rounded-full" />
                                <div className="flex-1 space-y-3">
                                    <Skeleton className="h-8 w-48" />
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-2 w-full max-w-md" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i} className="glass-card">
                                <CardContent className="p-6 text-center">
                                    <Skeleton className="h-8 w-8 mx-auto mb-2" />
                                    <Skeleton className="h-6 w-12 mx-auto mb-1" />
                                    <Skeleton className="h-4 w-20 mx-auto" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !data?.success || !data?.data) {
        return (
            <div className="min-h-screen p-6 md:p-10 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{t('common:messages.error')}</h3>
                    <p className="text-muted-foreground">{t('common:messages.retry')}</p>
                </div>
            </div>
        );
    }

    const user = data.data;
    const xpToNext = getXPForLevel(user.level + 1);
    const currentLevelXp = getXPForLevel(user.level);
    const progressXp = user.xp - currentLevelXp;
    const neededXp = xpToNext - currentLevelXp;
    const levelProgress = neededXp > 0 ? (progressXp / neededXp) * 100 : 100;

    // Counts for tiers
    const selectorCount = (user.stats.challengesByType?.['CSS_SELECTOR'] ?? 0) + (user.stats.challengesByType?.['XPATH_SELECTOR'] ?? 0);
    const jsCount = user.stats.challengesByType?.['JAVASCRIPT'] ?? 0;
    const playwrightCount = user.stats.challengesByType?.['PLAYWRIGHT'] ?? 0;

    return (
        <div className="min-h-screen p-6 md:p-10 page-transition">
            <div className="max-w-6xl mx-auto">
                {/* Profile Header */}
                <Card className="glass-card mb-8">
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={user.image || undefined} />
                                <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                                    {(user.name || user.email).charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-bold">{user.name || t('leaderboard:table.anonymous')}</h1>
                                    <Badge className="bg-primary/20 text-primary">{t('profile:header.level', { level: user.level })}</Badge>
                                </div>
                                <p className="text-muted-foreground mb-4">{user.email}</p>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{t('profile:header.progressTo', { level: user.level + 1 })}</span>
                                        <span className="font-medium">{progressXp} / {neededXp} XP</span>
                                    </div>
                                    <Progress value={levelProgress} className="h-2" />
                                </div>
                            </div>

                            <Link to={LocaleRoutes.settings} params={localeParams(locale)}>
                                <Button variant="outline">
                                    <Settings className="h-4 w-4 mr-2" />
                                    {t('profile:header.settings')}
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="glass-card card-hover">
                        <CardContent className="p-6 text-center">
                            <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
                            <div className="text-2xl font-bold">{user.stats.completedTutorials}</div>
                            <div className="text-sm text-muted-foreground">{t('profile:stats.tutorials')}</div>
                        </CardContent>
                    </Card>
                    <Card className="glass-card card-hover">
                        <CardContent className="p-6 text-center">
                            <Code className="h-8 w-8 text-primary mx-auto mb-2" />
                            <div className="text-2xl font-bold">{user.stats.completedChallenges}</div>
                            <div className="text-sm text-muted-foreground">{t('profile:stats.challenges')}</div>
                        </CardContent>
                    </Card>
                    <Card className="glass-card card-hover">
                        <CardContent className="p-6 text-center">
                            <Zap className="h-8 w-8 text-accent mx-auto mb-2" />
                            <div className="text-2xl font-bold">{user.xp.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">{t('profile:stats.totalXp')}</div>
                        </CardContent>
                    </Card>
                    <Card className="glass-card card-hover">
                        <CardContent className="p-6 text-center">
                            <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold">{user.stats.achievementsCount}</div>
                            <div className="text-sm text-muted-foreground">{t('profile:stats.achievements')}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="progress">
                    <TabsList>
                        <TabsTrigger value="progress">{t('profile:tabs.progress')}</TabsTrigger>
                        <TabsTrigger value="activity">{t('profile:tabs.activity')}</TabsTrigger>
                        <TabsTrigger value="achievements">{t('profile:tabs.achievements')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="progress" className="mt-6">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>{t('profile:tierProgress.title')}</CardTitle>
                                <CardDescription>{t('profile:tierProgress.description')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Tier: Basic */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">🟢</span>
                                            <span className="font-medium">{t('profile:tierProgress.basic')}</span>
                                        </div>
                                        <Badge variant="secondary">{t('profile:tierProgress.challengeCount', { count: 36 })}</Badge>
                                    </div>
                                    <Progress value={Math.min(selectorCount / 36 * 100, 100)} className="h-2" />
                                </div>

                                {/* Tier: Beginner */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">🟡</span>
                                            <span className="font-medium">{t('profile:tierProgress.beginner')}</span>
                                        </div>
                                        <Badge variant="secondary">{t('profile:tierProgress.challengeCount', { count: 26 })}</Badge>
                                    </div>
                                    <Progress value={Math.min(jsCount / 26 * 100, 100)} className="h-2" />
                                </div>

                                {/* Tier: Intermediate */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">🟠</span>
                                            <span className="font-medium">{t('profile:tierProgress.intermediate')}</span>
                                        </div>
                                        <Badge variant="secondary">{t('profile:tierProgress.challengeCount', { count: 37 })}</Badge>
                                    </div>
                                    <Progress value={Math.min(playwrightCount / 37 * 100, 100)} className="h-2" />
                                </div>

                                {/* Tier: Expert */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">🔴</span>
                                            <span className="font-medium">{t('profile:tierProgress.expert')}</span>
                                        </div>
                                        <Badge variant="secondary">{t('profile:tierProgress.challengeCount', { count: 23 })}</Badge>
                                    </div>
                                    <Progress value={Math.min(Math.max(playwrightCount - 37, 0) / 23 * 100, 100)} className="h-2" />
                                </div>

                                {/* XP Milestones */}
                                <div className="mt-8 pt-6 border-t border-border">
                                    <h4 className="font-medium mb-4 flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-accent" />
                                        {t('profile:milestones.title')}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {[100, 500, 1000, 2500, 5000].map(milestone => (
                                            <Badge
                                                key={milestone}
                                                variant={(user.xp ?? 0) >= milestone ? "default" : "outline"}
                                                className={(user.xp ?? 0) >= milestone ? "bg-accent text-accent-foreground" : "opacity-50"}
                                            >
                                                {(user.xp ?? 0) >= milestone ? "✓" : ""} {milestone.toLocaleString()} XP
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="activity" className="mt-6">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>{t('profile:activity.title')}</CardTitle>
                                <CardDescription>{t('profile:activity.description')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="mt-6 ml-[18px]">
                                    {(!user.recentActivity || user.recentActivity.length === 0) ? (
                                        <div className="text-center py-12 text-muted-foreground ml-[-18px]">
                                            <Code className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                            <p>{t('profile:activity.empty')}</p>
                                        </div>
                                    ) : (
                                        <div className="border-l-2 border-primary/20 space-y-8 pl-8 pb-2">
                                            {user.recentActivity.map((activity, index) => (
                                                <div key={index} className="relative group">
                                                    {/* Timeline Node */}
                                                    <div className={
                                                        "absolute -left-[41px] top-0 h-6 w-6 rounded-full border-4 border-background flex items-center justify-center " +
                                                        (activity.type === 'challenge' ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground")
                                                    }>
                                                        {activity.type === 'challenge' ? (
                                                            <Code className="h-3 w-3" />
                                                        ) : (
                                                            <Award className="h-3 w-3" />
                                                        )}
                                                    </div>

                                                    {/* Content Card */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-lg bg-card/50 border border-border/50 hover:bg-muted/30 transition-colors">
                                                        <div className="space-y-1">
                                                            <h4 className="font-semibold text-sm leading-none">{activity.title}</h4>
                                                            <p className="text-xs text-muted-foreground">{activity.date}</p>
                                                        </div>
                                                        <Badge variant="secondary" className="w-fit font-mono text-xs">
                                                            +{activity.xp} XP
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="achievements" className="mt-6">
                        {(!user.recentAchievements || user.recentAchievements.length === 0) ? (
                            <Card className="glass-card">
                                <CardContent className="p-8 text-center text-muted-foreground">
                                    <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>{t('profile:achievements.empty')}</p>
                                    <p className="text-sm mt-2">{t('profile:achievements.available', { count: 30 })}</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {user.recentAchievements.map((achievement, index) => (
                                    <Card key={index} className="glass-card card-hover">
                                        <CardContent className="p-6 text-center">
                                            <div className="text-4xl mb-3 animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>{achievement.icon}</div>
                                            <h3 className="font-semibold mb-1">{achievement.name}</h3>
                                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
