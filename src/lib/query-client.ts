import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { logger } from './logger';

export const createQueryClient = () => {
    return new QueryClient({
        queryCache: new QueryCache({
            onError: (error, query) => {
                logger.error(`Query Error: ${JSON.stringify(query.queryKey)}`, error);
            },
        }),
        mutationCache: new MutationCache({
            onError: (error) => {
                logger.error(`Mutation Error:`, error);
            },
        }),
        defaultOptions: {
            queries: {
                staleTime: 1000 * 60 * 5, // 5 minutes
                refetchOnWindowFocus: false,
            },
        },
    });
};

let clientQueryClient: QueryClient | undefined;

export const getQueryClient = () => {
    if (typeof window === 'undefined') {
        return createQueryClient();
    }
    if (!clientQueryClient) {
        clientQueryClient = createQueryClient();
    }
    return clientQueryClient;
};
