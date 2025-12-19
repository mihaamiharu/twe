import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Leaderboard, type LeaderboardUser } from '@/components/gamification';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Calendar, AlertCircle, Users } from 'lucide-react';

export const Route = createFileRoute('/leaderboard')({
    component: LeaderboardPage,
});

// Define API user shape matching what backend returns
interface APIUser {
    id: string;
    name: string | null;
    image: string | null;
    xp: number;
    level: number;
    createdAt: string;
    challengesCompleted: number;
}

interface LeaderboardResponse {
    success: boolean;
    data: APIUser[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

function LeaderboardPage() {
    const { data, isLoading, error } = useQuery<LeaderboardResponse>({
        queryKey: ['leaderboard'],
        queryFn: async () => {
            const res = await fetch('/api/leaderboard');
            if (!res.ok) throw new Error('Failed to fetch leaderboard');
            return res.json();
        },
    });

    const users = data?.data ?? [];

    // Transform API data to match LeaderboardUser interface
    const transformedUsers: LeaderboardUser[] = users.map((user, index) => ({
        id: user.id,
        rank: index + 1,
        username: user.name || 'Anonymous',
        displayName: user.name || 'Anonymous',
        level: user.level,
        totalXP: user.xp,
        challengesCompleted: user.challengesCompleted || 0,
    }));

    return (
        <div className="min-h-screen p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-bold gradient-text mb-3">Leaderboard</h1>
                    <p className="text-muted-foreground text-lg">
                        See how you stack up against other testers
                    </p>
                </div>

                <Tabs defaultValue="all-time" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="all-time" className="flex items-center gap-2">
                            <Trophy className="h-4 w-4" />
                            All Time
                        </TabsTrigger>
                        <TabsTrigger value="monthly" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            This Month
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all-time">
                        {/* Loading State */}
                        {isLoading && (
                            <Card className="glass-card">
                                <CardContent className="p-6 space-y-4">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                            <Skeleton className="h-6 w-20" />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Error State */}
                        {error && (
                            <div className="text-center py-12">
                                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Failed to load leaderboard</h3>
                                <p className="text-muted-foreground">Please try again later</p>
                            </div>
                        )}

                        {/* Empty State */}
                        {!isLoading && !error && transformedUsers.length === 0 && (
                            <Card className="glass-card">
                                <CardContent className="p-8 text-center">
                                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No rankings yet</h3>
                                    <p className="text-muted-foreground">
                                        Complete challenges to appear on the leaderboard!
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Leaderboard */}
                        {!isLoading && !error && transformedUsers.length > 0 && (
                            <Leaderboard
                                users={transformedUsers}
                                title="All-Time Leaderboard"
                                maxDisplay={10}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="monthly">
                        {/* For now, show same data - monthly would need separate API endpoint */}
                        {!isLoading && !error && transformedUsers.length === 0 && (
                            <Card className="glass-card">
                                <CardContent className="p-8 text-center">
                                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No monthly rankings yet</h3>
                                    <p className="text-muted-foreground">
                                        Be the first to earn XP this month!
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {!isLoading && !error && transformedUsers.length > 0 && (
                            <Leaderboard
                                users={transformedUsers}
                                title="Monthly Leaderboard"
                                maxDisplay={10}
                            />
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
