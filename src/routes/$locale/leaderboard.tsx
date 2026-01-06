import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, AlertCircle, Crown, Shield } from 'lucide-react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { authQueryOptions } from '@/lib/auth.query';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { getLeaderboard } from '@/lib/leaderboard.fn';

interface LeaderboardEntry {
    id: string;
    name: string | null;
    image: string | null;
    xp: number;
    level: number;
    createdAt: Date | null;
    challengesCompleted: number;
    rank: number;
    displayName: string;
    badges: {
        name: string;
        icon: string;
        slug: string;
    }[];
}

export const Route = createFileRoute('/$locale/leaderboard')({
    component: LeaderboardPage,
});

function LeaderboardPage() {
    const { locale } = useParams({ from: '/$locale/leaderboard' });
    const { t } = useTranslation(['leaderboard', 'common']);
    const { data: auth } = useSuspenseQuery(authQueryOptions);
    const session = auth;
    const isAuthenticated = !!session?.user;

    const { data: leaderboardData, isLoading, error } = useQuery({
        queryKey: ['leaderboard'],
        queryFn: async () => {
            const result = await getLeaderboard({ data: { page: 1, limit: 50, period: 'all', locale } });
            if (!result.success) throw new Error(result.error);
            return result;
        },
    });

    const users: LeaderboardEntry[] = leaderboardData?.data ?? [];

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
                            {t('leaderboard:header.title')}
                        </span>
                    </h1>
                    <p className="text-muted-foreground text-xl max-w-2xl mx-auto flex items-center justify-center gap-2">
                        {t('leaderboard:header.subtitle')}
                    </p>
                </div>

                <Tabs defaultValue="all-time" className="space-y-8">
                    <div className="flex justify-center">
                        <TabsList className="bg-muted/50 p-1 h-14 rounded-2xl border-2 border-border/50">
                            <TabsTrigger value="all-time" className="px-8 h-12 text-base rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-primary/20">
                                <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                                {t('leaderboard:tabs.allTime')}
                            </TabsTrigger>
                            <TabsTrigger value="monthly" className="px-8 h-12 text-base rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-primary/20">
                                <Calendar className="h-5 w-5 mr-2 text-primary" />
                                {t('leaderboard:tabs.thisMonth')}
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
                                {TopThree.length > 0 && (
                                    <div className={cn(
                                        "grid gap-6 mb-12 items-end",
                                        TopThree.length === 1 ? "grid-cols-1 max-w-sm mx-auto" :
                                            TopThree.length === 2 ? "grid-cols-2 max-w-2xl mx-auto" :
                                                "grid-cols-1 md:grid-cols-3"
                                    )}>
                                        {TopThree.length === 2 ? (
                                            <>
                                                <PodiumCard user={TopThree[1]} rank={2} isAuthenticated={isAuthenticated} />
                                                <PodiumCard user={TopThree[0]} rank={1} isCenter isAuthenticated={isAuthenticated} />
                                            </>
                                        ) : TopThree.length === 1 ? (
                                            <PodiumCard user={TopThree[0]} rank={1} isCenter isAuthenticated={isAuthenticated} />
                                        ) : (
                                            <>
                                                <div className="order-2 md:order-1">{TopThree[1] && <PodiumCard user={TopThree[1]} rank={2} isAuthenticated={isAuthenticated} />}</div>
                                                <div className="order-1 md:order-2">{TopThree[0] && <PodiumCard user={TopThree[0]} rank={1} isCenter isAuthenticated={isAuthenticated} />}</div>
                                                <div className="order-3 md:order-3">{TopThree[2] && <PodiumCard user={TopThree[2]} rank={3} isAuthenticated={isAuthenticated} />}</div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Rest of Leaderboard */}
                                <Card className="glass-card overflow-hidden relative min-h-[400px] flex flex-col border-2 border-primary/20 bg-background/50 backdrop-blur-xl">
                                    <CardContent className="p-0 flex-1 flex flex-col">
                                        <div className="overflow-x-auto flex-1">
                                            <table className="w-full">
                                                <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left w-24">{t('common:labels.rank')}</th>
                                                        <th className="px-6 py-4 text-left">{t('common:labels.user')}</th>
                                                        <th className="px-6 py-4 text-center">{t('common:labels.level')}</th>
                                                        <th className="px-6 py-4 text-right">{t('common:labels.xp')}</th>
                                                        <th className="px-6 py-4 text-right hidden sm:table-cell">{t('common:labels.badges')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/50">
                                                    {RestUsers.length > 0 ? RestUsers.map((user, index) => (
                                                        <tr
                                                            key={user.id}
                                                            className={cn(
                                                                "group transition-all hover:bg-primary/5",
                                                                !isAuthenticated ? "blur-sm select-none opacity-50 pointer-events-none" : ""
                                                            )}
                                                        >
                                                            <td className="px-6 py-4">
                                                                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center font-black text-muted-foreground text-sm border-2 border-border/50">
                                                                    #{index + 4}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-bold border-2 border-primary/20 group-hover:border-primary/50 transition-all overflow-hidden">
                                                                        {isAuthenticated ? (
                                                                            user.image ? <img src={user.image} alt={user.name || ''} className="h-full w-full object-cover" /> : (user.name || 'A')[0].toUpperCase()
                                                                        ) : '?'}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-bold text-base">{isAuthenticated ? (user.name || t('leaderboard:table.anonymous')) : t('leaderboard:table.hiddenUser')}</div>
                                                                        <div className="text-xs text-muted-foreground font-medium">{t('leaderboard:table.challengesCount', { count: user.challengesCompleted })}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <Badge variant="secondary" className="font-bold border border-border/50">
                                                                    {t('common:labels.level')} {user.level}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-black text-primary text-lg">
                                                                {user.xp.toLocaleString()} {t('common:labels.xp')}
                                                            </td>
                                                            <td className="px-6 py-4 text-right hidden sm:table-cell">
                                                                <div className="flex justify-end gap-[-8px]">
                                                                    {user.badges.slice(0, 3).map((badge, i) => (
                                                                        <div key={i} className="h-8 w-8 rounded-full bg-background border-2 border-border flex items-center justify-center text-lg -ml-2 first:ml-0 z-10 hover:z-20 hover:scale-125 transition-transform cursor-help" title={badge.name}>
                                                                            {badge.icon}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr className="h-32">
                                                            <td colSpan={5} className="text-center text-muted-foreground font-medium">
                                                                {isAuthenticated ? t('leaderboard:table.emptyState') : ""}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Gating Overlay for Guests */}
                                        {!isAuthenticated && (
                                            <div className="absolute inset-0 top-[0px] bg-gradient-to-b from-transparent via-background/80 to-background flex flex-col items-center justify-center p-6 text-center z-10 backdrop-blur-[2px]">
                                                <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border-2 border-primary/20 animate-pulse">
                                                    <Shield className="h-10 w-10 text-primary" />
                                                </div>
                                                <h3 className="text-3xl font-black mb-3">{t('leaderboard:gating.title')}</h3>
                                                <p className="text-muted-foreground mb-8 max-w-md text-lg font-medium">
                                                    {t('leaderboard:gating.description')}
                                                </p>
                                                <Link to="/$locale/login" params={{ locale }} search={{ redirect: '/leaderboard' }}>
                                                    <Button size="lg" className="px-8 py-6 rounded-xl text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all border-2 border-primary-foreground/20">
                                                        {t('leaderboard:gating.button')}
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
                            <Calendar className="h-20 w-20 mx-auto mb-6 text-muted-foreground" />
                            <h3 className="text-2xl font-black mb-2">{t('leaderboard:monthly.comingSoon')}</h3>
                            <p className="text-lg text-muted-foreground">{t('leaderboard:monthly.description')}</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function PodiumCard({ user, rank, isCenter = false, isAuthenticated = false }: { user: LeaderboardEntry; rank: number; isCenter?: boolean; isAuthenticated?: boolean }) {
    const { t } = useTranslation(['leaderboard', 'common']);
    const borderColor = rank === 1 ? 'border-yellow-500/50' : rank === 2 ? 'border-slate-400/50' : 'border-amber-700/50';
    const bgColor = rank === 1 ? 'bg-yellow-500/10' : rank === 2 ? 'bg-slate-400/10' : 'bg-amber-700/10';
    const ringColor = rank === 1 ? 'ring-yellow-500/30' : rank === 2 ? 'ring-slate-400/30' : 'ring-amber-700/30';

    const displayName = isAuthenticated ? (user.name || t('leaderboard:table.anonymous')) : t('leaderboard:table.hiddenUser');
    const displayAvatar = isAuthenticated ? user.image : null;

    return (
        <div className={cn(
            "relative flex flex-col items-center p-6 rounded-3xl glass-card transition-all hover:-translate-y-2 duration-300 border-2",
            borderColor, bgColor,
            isCenter ? "h-[360px] shadow-[0_0_50px_-10px_rgba(234,179,8,0.2)] z-10" : "h-[300px] opacity-90 hover:opacity-100"
        )}>
            {rank === 1 && (
                <div className="absolute -top-8 animate-bounce">
                    <Crown className="h-14 w-14 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                </div>
            )}
            <div className={cn(
                "font-black text-8xl mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/5",
                rank === 1 ? "scale-110" : ""
            )}>
                {rank}
            </div>

            <div className={cn(
                "h-24 w-24 rounded-2xl border-4 mb-4 overflow-hidden shadow-xl ring-4",
                borderColor, ringColor,
                rank === 1 ? "ring-offset-2 ring-offset-background" : ""
            )}>
                {displayAvatar ? (
                    <img src={displayAvatar} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center text-4xl font-black">
                        {isAuthenticated ? (displayName[0] ?? '?') : '?'}
                    </div>
                )}
            </div>

            <div className="text-center w-full">
                <div className={cn("font-bold text-xl mb-1 truncate px-2", !isAuthenticated && "blur-sm")}>
                    {displayName}
                </div>
                <div className="text-primary font-black text-lg mb-4">{user.xp.toLocaleString()} {t('common:labels.xp')}</div>

                {/* Badges Row */}
                <div className="flex justify-center -space-x-2">
                    {user.badges.slice(0, 3).map((badge, i: number) => (
                        <div key={i} className="h-8 w-8 rounded-full bg-background border-2 border-border flex items-center justify-center text-sm shadow-sm hover:scale-125 transition-transform z-10 hover:z-20" title={badge.name}>
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
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-full w-full opacity-30 rounded-3xl" />)}
            </div>
            <Card className="glass-card rounded-3xl border-2"><CardContent className="p-6"><Skeleton className="h-[400px] w-full" /></CardContent></Card>
        </div>
    );
}

function LeaderboardError() {
    const { t } = useTranslation(['leaderboard', 'common']);
    return (
        <Card className="glass-card border-2 border-destructive/20 bg-destructive/5">
            <CardContent className="p-12 text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center border-2 border-destructive/20">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">{t('common:messages.unavailable')}</h3>
                <p className="text-muted-foreground mb-6 text-lg">{t('leaderboard:error.description')}</p>
                <Button variant="outline" size="lg" className="rounded-xl border-2 hover:bg-background" onClick={() => window.location.reload()}>
                    {t('common:actions.refresh')}
                </Button>
            </CardContent>
        </Card>
    );
}
