import { queryOptions } from '@tanstack/react-query';
import { getChallenges, getChallenge } from '@/server/challenges.fn';

export const challengeListQueryOptions = (filters: {
    locale: string;
    type?: 'JAVASCRIPT' | 'PLAYWRIGHT' | 'CSS_SELECTOR' | 'XPATH_SELECTOR' | 'SELECTOR';
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    search?: string;
}) =>
    queryOptions({
        queryKey: ['challenges', filters],
        queryFn: () => getChallenges({ data: filters }),
    });

export const challengeDetailQueryOptions = (slug: string, locale: string) =>
    queryOptions({
        queryKey: ['challenge', slug, locale],
        queryFn: () => getChallenge({ data: { slug, locale } }),
    });
