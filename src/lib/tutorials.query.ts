import { queryOptions } from '@tanstack/react-query';
import { getTutorials } from '@/server/tutorials.fn';

export const tutorialsListQueryOptions = (filters: {
    locale: string;
    search?: string;
    limit?: number;
}) =>
    queryOptions({
        queryKey: ['tutorials', filters.search],
        queryFn: () => getTutorials({ data: filters }),
    });
