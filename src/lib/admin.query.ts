import { queryOptions } from '@tanstack/react-query';
import { getAdminChallenges } from '@/server/admin.fn';

export const adminChallengesQueryOptions = queryOptions({
    queryKey: ['admin-challenges'],
    queryFn: async () => {
        const res = await getAdminChallenges();
        if (!res.success) throw new Error(res.error || 'Failed to fetch challenges');
        return res.data;
    },
});
