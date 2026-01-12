import { queryOptions } from '@tanstack/react-query';
import { getLeaderboard } from '@/server/leaderboard.fn';

export const leaderboardQueryOptions = (filters: {
    page?: number;
    limit?: number;
    period: 'all' | 'monthly' | 'weekly';
    locale: string;
}) =>
    queryOptions({
        queryKey: ['leaderboard', filters],
        queryFn: () => getLeaderboard({ data: filters }),
    });
