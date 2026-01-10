import { queryOptions } from '@tanstack/react-query';
import { getServerSession } from '@/server/auth.fn';

export const authQueryOptions = queryOptions({
  queryKey: ['auth', 'session'],
  queryFn: () => getServerSession(),
  staleTime: 1000 * 60 * 5, // 5 minutes cache
  refetchOnWindowFocus: true, // Re-validate if user comes back to tab
});
