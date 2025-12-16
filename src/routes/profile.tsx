import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, BookOpen, Code, Settings, Star, Zap, AlertCircle, LogIn } from 'lucide-react';
import { getXPForLevel } from '@/lib/gamification';

export const Route = createFileRoute('/profile')({
    component: ProfilePage,
});

interface UserProfile {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    xp: number;
    level: number;
    createdAt: string;
    stats: {
        tutorialsCompleted: number;
        challengesCompleted: number;
        totalXp: number;
        currentStreak: number;
    };
    recentAchievements: {
        name: string;
        description: string;
        icon: string;
    }[];
    recentActivity: {
        type: 'challenge' | 'tutorial' | 'achievement';
        title: string;
        xp: number;
        date: string;
    }[];
}

interface ProfileResponse {
    success: boolean;
    data: UserProfile;
    error?: string;
}

function ProfilePage() {
    const { data, isLoading, error } = useQuery<ProfileResponse>({
        queryKey: ['profile'],
        queryFn: async () => {
            const res = await fetch('/api/users/me');
            if (res.status === 401) {
                throw new Error('Not authenticated');
            }
            if (!res.ok) throw new Error('Failed to fetch profile');
            return res.json();
        },
        retry: false,
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

    // Not authenticated state
    if (error?.message === 'Not authenticated') {
        return (
            <div className="min-h-screen p-6 md:p-10 flex items-center justify-center">
                <Card className="glass-card max-w-md w-full">
                    <CardContent className="p-8 text-center">
                        <LogIn className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Sign in to view your profile</h2>
                        <p className="text-muted-foreground mb-6">
                            Track your progress, view achievements, and see your stats.
                        </p>
                        <Link to="/login">
                            <Button>Sign In</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Error state
    if (error || !data?.success) {
        return (
            <div className="min-h-screen p-6 md:p-10 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Failed to load profile</h3>
                    <p className="text-muted-foreground">Please try again later</p>
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

    return (
        <div className="min-h-screen p-6 md:p-10">
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
                                    <h1 className="text-3xl font-bold">{user.name || 'Anonymous'}</h1>
                                    <Badge className="bg-primary/20 text-primary">Level {user.level}</Badge>
                                </div>
                                <p className="text-muted-foreground mb-4">{user.email}</p>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Progress to Level {user.level + 1}</span>
                                        <span className="font-medium">{progressXp} / {neededXp} XP</span>
                                    </div>
                                    <Progress value={levelProgress} className="h-2" />
                                </div>
                            </div>

                            <Button variant="outline">
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="glass-card">
                        <CardContent className="p-6 text-center">
                            <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
                            <div className="text-2xl font-bold">{user.stats?.tutorialsCompleted ?? 0}</div>
                            <div className="text-sm text-muted-foreground">Tutorials</div>
                        </CardContent>
                    </Card>
                    <Card className="glass-card">
                        <CardContent className="p-6 text-center">
                            <Code className="h-8 w-8 text-primary mx-auto mb-2" />
                            <div className="text-2xl font-bold">{user.stats?.challengesCompleted ?? 0}</div>
                            <div className="text-sm text-muted-foreground">Challenges</div>
                        </CardContent>
                    </Card>
                    <Card className="glass-card">
                        <CardContent className="p-6 text-center">
                            <Zap className="h-8 w-8 text-accent mx-auto mb-2" />
                            <div className="text-2xl font-bold">{(user.stats?.totalXp ?? user.xp).toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">Total XP</div>
                        </CardContent>
                    </Card>
                    <Card className="glass-card">
                        <CardContent className="p-6 text-center">
                            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold">{user.stats?.currentStreak ?? 0}</div>
                            <div className="text-sm text-muted-foreground">Day Streak</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="activity">
                    <TabsList>
                        <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                        <TabsTrigger value="achievements">Achievements</TabsTrigger>
                    </TabsList>

                    <TabsContent value="activity" className="mt-6">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>Your latest learning progress</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {(!user.recentActivity || user.recentActivity.length === 0) ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>No recent activity yet. Start learning!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {user.recentActivity.map((activity, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 rounded-lg bg-primary/20">
                                                        {activity.type === 'challenge' && <Code className="h-5 w-5 text-primary" />}
                                                        {activity.type === 'tutorial' && <BookOpen className="h-5 w-5 text-primary" />}
                                                        {activity.type === 'achievement' && <Award className="h-5 w-5 text-accent" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{activity.title}</div>
                                                        <div className="text-sm text-muted-foreground">{activity.date}</div>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="text-accent">
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
                        {(!user.recentAchievements || user.recentAchievements.length === 0) ? (
                            <Card className="glass-card">
                                <CardContent className="p-8 text-center text-muted-foreground">
                                    <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No achievements yet. Complete challenges to earn badges!</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {user.recentAchievements.map((achievement, index) => (
                                    <Card key={index} className="glass-card">
                                        <CardContent className="p-6 text-center">
                                            <div className="text-4xl mb-3">{achievement.icon}</div>
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
