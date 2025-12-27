import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Leaderboard, type LeaderboardUser } from '@/components/gamification';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, AlertCircle, Users, Lock, Crown, Shield } from 'lucide-react';
import { useSession } from '@/lib/auth.client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
    badges: Array<{ name: string; icon: string; slug: string }>;
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
    const { data: session } = useSession();
    const isAuthenticated = !!session;

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
        // Helper to render custom badge elements if needed, but Leaderboard component might need update if it doesn't support custom content
        // For now, we'll pass it and might need to update the Leaderboard component itself or render it here if we replace the component
    }));

    // Function to render custom row content (Badges) if the Leaderboard component supports it
    // Since we are using a pre-built Leaderboard component, let's verify if we need to update IT as well.
    // Assuming we want to replace the usage of the imported Leaderboard component with a custom one or update the existing one.
    // For this task, I'll inline a more polished table here to support the specific features (Badges + Gating) or check if I can modify the component.
    // Given the task is "Polish UI", creating a local polished version is safer than modifying shared components blindly.

    const TopThree = users.slice(0, 3);
    const RestUsers = users.slice(3);

    return (
        <div className="min-h-screen p-6 md:p-10 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />

            <div className="max-w-5xl mx-auto">
                <div className="mb-12 text-center">
                    <h1 className="text-5xl font-black mb-4 tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-teal-400 to-accent animate-gradient">
                            Hall of Fame
                        </span>
                    </h1>
                    <p className="text-muted-foreground text-xl max-w-2xl mx-auto flex items-center justify-center gap-2">
                        The elite testers mastering the art of automation.
                    </p>
                </div>

                <Tabs defaultValue="all-time" className="space-y-8">
                    <div className="flex justify-center">
                        <TabsList className="bg-muted/50 p-1 h-12">
                            <TabsTrigger value="all-time" className="px-6 h-10 text-base">
                                <Trophy className="h-4 w-4 mr-2" />
                                All Time
                            </TabsTrigger>
                            <TabsTrigger value="monthly" className="px-6 h-10 text-base">
                                <Calendar className="h-4 w-4 mr-2" />
                                This Month
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="all-time" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {isLoading ? (
                            <LeaderboardSkeleton />
                        ) : error ? (
                            <LeaderboardError />
                        ) : (
                            <>
                                {/* Top 3 Podium */}
                                {/* Top 3 Podium - Centering logic */}
                                {TopThree.length > 0 && (
                                    <div className={cn(
                                        "grid gap-6 mb-12 items-end",
                                        TopThree.length === 1 ? "grid-cols-1 max-w-sm mx-auto" :
                                            TopThree.length === 2 ? "grid-cols-2 max-w-2xl mx-auto" :
                                                "grid-cols-1 md:grid-cols-3"
                                    )}>
                                        {/* Logic for 2 users: Show Rank 2 then Rank 1. Logic for 3: Rank 2, Rank 1, Rank 3 */}
                                        {TopThree.length === 2 ? (
                                            <>
                                                <PodiumCard user={TopThree[1]} rank={2} isAuthenticated={isAuthenticated} />
                                                <PodiumCard user={TopThree[0]} rank={1} isCenter isAuthenticated={isAuthenticated} />
                                            </>
                                        ) : TopThree.length === 1 ? (
                                            <PodiumCard user={TopThree[0]} rank={1} isCenter isAuthenticated={isAuthenticated} />
                                        ) : (
                                            <>
                                                {/* Standard 3-column Layout: 2nd, 1st, 3rd */}
                                                <div className="order-2 md:order-1">{TopThree[1] && <PodiumCard user={TopThree[1]} rank={2} isAuthenticated={isAuthenticated} />}</div>
                                                <div className="order-1 md:order-2">{TopThree[0] && <PodiumCard user={TopThree[0]} rank={1} isCenter isAuthenticated={isAuthenticated} />}</div>
                                                <div className="order-3 md:order-3">{TopThree[2] && <PodiumCard user={TopThree[2]} rank={3} isAuthenticated={isAuthenticated} />}</div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Rest of Leaderboard */}
                                <Card className="glass-card border-none shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden relative min-h-[400px] flex flex-col">
                                    <CardContent className="p-0 flex-1 flex flex-col">
                                        <div className="overflow-x-auto flex-1">
                                            <table className="w-full">
                                                <thead className="bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left w-20">Rank</th>
                                                        <th className="px-6 py-4 text-left">User</th>
                                                        <th className="px-6 py-4 text-center">Level</th>
                                                        <th className="px-6 py-4 text-right">XP</th>
                                                        <th className="px-6 py-4 text-right hidden sm:table-cell">Badges</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/30">
                                                    {RestUsers.length > 0 ? RestUsers.map((user, index) => (
                                                        <tr
                                                            key={user.id}
                                                            className={cn(
                                                                "group transition-colors hover:bg-muted/20",
                                                                !isAuthenticated ? "blur-sm select-none opacity-50 pointer-events-none" : ""
                                                            )}
                                                        >
                                                            <td className="px-6 py-4 font-mono font-bold text-muted-foreground">
                                                                #{index + 4}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-bold ring-2 ring-background group-hover:ring-primary/50 transition-all">
                                                                        {isAuthenticated ? (
                                                                            user.image ? <img src={user.image} alt={user.name || ''} className="h-full w-full rounded-full object-cover" /> : (user.name || 'A')[0].toUpperCase()
                                                                        ) : '?'}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-semibold">{isAuthenticated ? (user.name || 'Anonymous') : 'Hidden User'}</div>
                                                                        <div className="text-xs text-muted-foreground">{user.challengesCompleted} challenges</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <Badge variant="secondary" className="font-mono">Lvl {user.level}</Badge>
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-bold text-primary">
                                                                {user.xp.toLocaleString()}
                                                            </td>
                                                            <td className="px-6 py-4 text-right hidden sm:table-cell">
                                                                <div className="flex justify-end gap-[-8px]">
                                                                    {user.badges.slice(0, 3).map((badge, i) => (
                                                                        <div key={i} className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center text-lg -ml-2 first:ml-0 z-10 hover:z-20 hover:scale-110 transition-transform" title={badge.name}>
                                                                            {badge.icon}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        /* Empty State Row to keep table structure if needed, or just let min-h handle it */
                                                        <tr className="h-32">
                                                            <td colSpan={5} className="text-center text-muted-foreground">
                                                                {isAuthenticated ? "No other runners yet. Invite your friends!" : ""}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Gating Overlay for Guests */}
                                        {!isAuthenticated && (
                                            <div className="absolute inset-0 top-[0px] bg-gradient-to-b from-transparent via-background/60 to-background flex flex-col items-center justify-center p-6 text-center z-10 backdrop-blur-[2px]">
                                                <Shield className="h-16 w-16 text-primary mb-4" />
                                                <h3 className="text-2xl font-bold mb-2">Join the Elite</h3>
                                                <p className="text-muted-foreground mb-6 max-w-md">
                                                    Sign in to see full rankings, track your own progress, and earn unique badges.
                                                </p>
                                                <Link to="/login" search={{ redirect: '/leaderboard' }}>
                                                    <Button size="lg" className="px-8 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all">
                                                        Sign In to Compete
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </TabsContent>
                    <TabsContent value="monthly" className="text-center py-20">
                        <div className="opacity-50">
                            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-xl font-bold mb-2">Monthly Rankings Coming Soon</h3>
                            <p>Compete for the monthly crown in the next season update!</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function PodiumCard({ user, rank, isCenter = false, isAuthenticated = false }: { user: APIUser; rank: number; isCenter?: boolean; isAuthenticated?: boolean }) {
    const borderColor = rank === 1 ? 'border-yellow-500/50' : rank === 2 ? 'border-slate-400/50' : 'border-amber-700/50';
    const bgColor = rank === 1 ? 'bg-yellow-500/10' : rank === 2 ? 'bg-slate-400/10' : 'bg-amber-700/10';
    const iconColor = rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-slate-400' : 'text-amber-700';

    // Privacy Logic: If not authenticated, blur name/avatar but show XP
    const displayName = isAuthenticated ? (user.name || 'Anonymous') : 'Hidden User';
    const displayAvatar = isAuthenticated ? user.image : null;

    return (
        <div className={cn(
            "relative flex flex-col items-center p-6 rounded-2xl glass-card border transition-all hover:-translate-y-2 duration-300",
            borderColor, bgColor,
            isCenter ? "h-[320px] shadow-[0_0_40px_-10px_rgba(234,179,8,0.3)] z-10" : "h-[280px] opacity-90 hover:opacity-100"
        )}>
            {rank === 1 && (
                <div className="absolute -top-6 animate-bounce">
                    <Crown className="h-12 w-12 text-yellow-400 drop-shadow-lg" />
                </div>
            )}
            <div className={cn(
                "font-black text-6xl mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/10",
                rank === 1 ? "scale-110" : ""
            )}>
                {rank}
            </div>

            <div className={cn(
                "h-20 w-20 rounded-full border-4 mb-4 overflow-hidden shadow-xl",
                borderColor,
                rank === 1 ? "ring-4 ring-yellow-500/20" : ""
            )}>
                {displayAvatar ? (
                    <img src={displayAvatar} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center text-3xl font-bold">
                        {isAuthenticated ? (displayName[0] ?? '?') : '?'}
                    </div>
                )}
            </div>

            <div className="text-center">
                <div className={cn("font-bold text-lg mb-1 truncate max-w-[150px]", !isAuthenticated && "blur-sm")}>
                    {displayName}
                </div>
                <div className="text-muted-foreground text-sm font-mono mb-3">{user.xp.toLocaleString()} XP</div>

                {/* Boss Badges Row */}
                <div className="flex justify-center -space-x-2">
                    {user.badges.slice(0, 3).map((badge, i) => (
                        <div key={i} className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center text-sm shadow-sm" title={badge.name}>
                            {badge.icon}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function LeaderboardSkeleton() {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[300px] items-end">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-full w-full opacity-30 rounded-2xl" />)}
            </div>
            <Card className="glass-card"><CardContent className="p-6"><Skeleton className="h-[400px] w-full" /></CardContent></Card>
        </div>
    );
}

function LeaderboardError() {
    return (
        <Card className="glass-card border-destructive/20 bg-destructive/5 backdrop-blur-md">
            <CardContent className="p-12 text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Unavailable</h3>
                <p className="text-muted-foreground mb-6">Unable to load the leaderboard at this time.</p>
                <Button variant="outline" className="btn-animate" onClick={() => window.location.reload()}>
                    Refresh Page
                </Button>
            </CardContent>
        </Card>
    );
}
