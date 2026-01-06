/**
 * Leaderboard - Display top users ranked by XP
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatXP, getLevelTitle } from '@/lib/gamification';
import { Trophy, Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface LeaderboardUser {
    id: string;
    rank: number;
    previousRank?: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    level: number;
    totalXP: number;
    challengesCompleted: number;
}

export interface LeaderboardProps {
    users: LeaderboardUser[];
    currentUserId?: string;
    title?: string;
    maxDisplay?: number;
    className?: string;
}

// rankIcons removed: using inline rendering for better flexibility

function getRankChange(current: number, previous?: number) {
    if (!previous) return null;
    if (current < previous) return { direction: 'up', change: previous - current };
    if (current > previous) return { direction: 'down', change: current - previous };
    return { direction: 'same', change: 0 };
}

export function Leaderboard({
    users,
    currentUserId,
    title,
    maxDisplay = 10,
    className,
}: LeaderboardProps) {
    const { t } = useTranslation(['common', 'leaderboard']);
    const displayTitle = title || t('common:navigation.leaderboard');
    const displayUsers = useMemo(() => users.slice(0, maxDisplay), [users, maxDisplay]);

    return (
        <Card className={cn('glass-card', className)}>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-400" />
                        {displayTitle}
                    </CardTitle>
                    <Badge variant="outline">{users.length} {t('common:labels.user', { count: users.length, defaultValue: 'users' })}</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border">
                    {displayUsers.map((user) => {
                        const isCurrentUser = user.id === currentUserId;
                        const rankChange = getRankChange(user.rank, user.previousRank);
                        const levelTitleKey = getLevelTitle(user.level);
                        const levelTitle = t(`common:levelTitles.${levelTitleKey}`);

                        return (
                            <div
                                key={user.id}
                                className={cn(
                                    'flex items-center gap-4 px-4 py-3 transition-colors',
                                    isCurrentUser && 'bg-primary/5 border-l-2 border-primary'
                                )}>
                                {/* Rank */}
                                <div className="flex items-center justify-center w-8 shrink-0">
                                    <span className={cn(
                                        "font-bold",
                                        user.rank === 1 && "text-yellow-400 text-lg",
                                        user.rank === 2 && "text-gray-400 text-lg",
                                        user.rank === 3 && "text-amber-600 text-lg",
                                        user.rank > 3 && "text-sm text-muted-foreground font-medium"
                                    )}>
                                        {user.rank}
                                    </span>
                                </div>

                                {/* Rank change indicator */}
                                <div className="w-6 flex items-center justify-center shrink-0">
                                    {rankChange && (
                                        <>
                                            {rankChange.direction === 'up' && (
                                                <span className="flex items-center text-emerald-400">
                                                    <TrendingUp className="h-3 w-3" />
                                                </span>
                                            )}
                                            {rankChange.direction === 'down' && (
                                                <span className="flex items-center text-red-400">
                                                    <TrendingDown className="h-3 w-3" />
                                                </span>
                                            )}
                                            {rankChange.direction === 'same' && (
                                                <Minus className="h-3 w-3 text-muted-foreground" />
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Avatar */}
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.avatarUrl} />
                                    <AvatarFallback className="bg-primary/20 text-primary">
                                        {(user.displayName || user.username).charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                {/* User info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium truncate">
                                            {user.displayName || user.username}
                                        </span>
                                        {isCurrentUser && (
                                            <Badge variant="secondary" className="text-xs">{t('common:labels.userYou', { defaultValue: 'You' })}</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Star className="h-3 w-3" />
                                            {t('common:labels.level')} {user.level} {levelTitle}
                                        </span>
                                        <span>•</span>
                                        <span>{user.challengesCompleted} {t('challenges:labels.challenges')}</span>
                                    </div>
                                </div>

                                {/* XP */}
                                <div className="text-right">
                                    <span className="font-semibold text-accent">
                                        {formatXP(user.totalXP)}
                                    </span>
                                    <span className="text-muted-foreground text-sm"> XP</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {users.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                        {t('common:messages.noResults')}
                    </div>
                )}
            </CardContent>
        </Card >
    );
}

export default Leaderboard;
