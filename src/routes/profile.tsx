import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Award, BookOpen, Code, Settings, Star, Trophy, Zap } from 'lucide-react';

export const Route = createFileRoute('/profile')({
    component: ProfilePage,
    // TODO: Add beforeLoad for protected route when auth is connected
});

// Mock user data - will be replaced with actual session data
const mockUser = {
    name: 'Test User',
    email: 'test@example.com',
    image: null,
    level: 5,
    xp: 750,
    xpToNextLevel: 1000,
    joinedAt: '2024-01-15',
    stats: {
        tutorialsCompleted: 8,
        challengesSolved: 23,
        totalXp: 2750,
        currentStreak: 5,
    },
    recentAchievements: [
        { name: 'First Steps', description: 'Complete your first tutorial', icon: '🎯' },
        { name: 'Quick Learner', description: 'Complete 5 tutorials', icon: '📚' },
        { name: 'Problem Solver', description: 'Solve 10 challenges', icon: '💡' },
    ],
    recentActivity: [
        { type: 'challenge', title: 'Click the Button', xp: 50, date: '2 hours ago' },
        { type: 'tutorial', title: 'CSS Selectors Mastery', xp: 150, date: '1 day ago' },
        { type: 'achievement', title: 'Problem Solver unlocked', xp: 100, date: '1 day ago' },
    ],
};

function ProfilePage() {
    const user = mockUser;
    const levelProgress = (user.xp / user.xpToNextLevel) * 100;

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
                                    {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-bold">{user.name}</h1>
                                    <Badge className="bg-primary/20 text-primary">Level {user.level}</Badge>
                                </div>
                                <p className="text-muted-foreground mb-4">{user.email}</p>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Progress to Level {user.level + 1}</span>
                                        <span className="font-medium">{user.xp} / {user.xpToNextLevel} XP</span>
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
                            <div className="text-2xl font-bold">{user.stats.tutorialsCompleted}</div>
                            <div className="text-sm text-muted-foreground">Tutorials</div>
                        </CardContent>
                    </Card>
                    <Card className="glass-card">
                        <CardContent className="p-6 text-center">
                            <Code className="h-8 w-8 text-primary mx-auto mb-2" />
                            <div className="text-2xl font-bold">{user.stats.challengesSolved}</div>
                            <div className="text-sm text-muted-foreground">Challenges</div>
                        </CardContent>
                    </Card>
                    <Card className="glass-card">
                        <CardContent className="p-6 text-center">
                            <Zap className="h-8 w-8 text-accent mx-auto mb-2" />
                            <div className="text-2xl font-bold">{user.stats.totalXp.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">Total XP</div>
                        </CardContent>
                    </Card>
                    <Card className="glass-card">
                        <CardContent className="p-6 text-center">
                            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold">{user.stats.currentStreak}</div>
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
                            <CardContent className="space-y-4">
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
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="achievements" className="mt-6">
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
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
