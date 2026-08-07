import { queryOptions } from '@tanstack/react-query';
import { getChallenges, getChallenge } from '@/server/challenges.fn';

export interface ChallengeDetailResponse {
    success: boolean;
    data?: {
        id: string;
        slug: string;
        title: string;
        description: string;
        instructions: string;
        type: 'JAVASCRIPT' | 'PLAYWRIGHT' | 'CSS_SELECTOR' | 'XPATH_SELECTOR' | 'TYPESCRIPT';
        difficulty: 'EASY' | 'MEDIUM' | 'HARD';
        category: string;
        xpReward: number;
        order: number;
        htmlContent?: string;
        files?: Record<string, string>;
        editableFiles?: string[];
        preloadModules?: Record<string, { exports: string[]; source: string }>;
        starterCode?: string;
        tags?: string[];
        hints?: string[];
        completionCount: number;
        tutorial?: { slug: string; title: string } | null;
        testCases: {
            id: string;
            description: string;
            input: unknown;
            expectedOutput: unknown;
            isHidden?: boolean;
        }[];
        hiddenTestCaseCount: number;
        userProgress?: {
            isCompleted: boolean;
            attempts: number;
            lastAccessedAt: Date;
            usedHint: boolean;
            hintContent?: string | null;
        } | null;
        bestSubmission?: {
            code: string;
            isPassed: boolean;
            xpEarned: number;
            testsPassed: number;
            testsTotal: number;
            executionTime: number;
        } | null;
        nextChallenge?: { slug: string; title: string } | null;
        prevChallenge?: { slug: string; title: string } | null;
    };
    error?: string;
}

export const challengeListQueryOptions = (filters: {
    locale: string;
    type?: 'JAVASCRIPT' | 'PLAYWRIGHT' | 'CSS_SELECTOR' | 'XPATH_SELECTOR' | 'SELECTOR';
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    search?: string;
    limit?: number;
}) =>
    queryOptions({
        queryKey: ['challenges', filters],
        queryFn: () => getChallenges({ data: filters }),
    });

export const challengeDetailQueryOptions = (slug: string, locale: string) =>
    queryOptions<ChallengeDetailResponse>({
        queryKey: ['challenge', slug, locale],
        queryFn: () =>
            Promise.resolve(
                getChallenge({ data: { slug, locale } }) as unknown as ChallengeDetailResponse,
            ),
    });
