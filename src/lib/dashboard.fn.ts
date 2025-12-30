import { createServerFn } from '@tanstack/react-start';
import { db } from '@/db';
import { challenges, tutorials, achievements } from '@/db/schema';
import { logger } from '@/lib/logger';
import { sql } from 'drizzle-orm';

// In-memory cache for stats (refreshed every 24 hours)
interface StatsCache {
    data: {
        challenges: number;
        tutorials: number;
        achievements: number;
        tiers: {
            basic: number;
            beginner: number;
            intermediate: number;
            expert: number;
        };
    };
    timestamp: number;
}

let cachedStats: StatsCache | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

async function fetchStats() {
    // Get counts from database
    const [challengeCount] = await db
        .select({ count: sql<number>`count(*):: int` })
        .from(challenges);

    const [tutorialCount] = await db
        .select({ count: sql<number>`count(*):: int` })
        .from(tutorials);

    const [achievementCount] = await db
        .select({ count: sql<number>`count(*):: int` })
        .from(achievements);

    // Get tier breakdown
    const tierCounts = await db
        .select({
            category: challenges.category,
            count: sql<number>`count(*):: int`,
        })
        .from(challenges)
        .groupBy(challenges.category);

    // Map categories to tiers
    const tiers = {
        basic: 0,
        beginner: 0,
        intermediate: 0,
        expert: 0,
    };

    for (const tier of tierCounts) {
        const category = tier.category?.toLowerCase() || '';
        if (category.includes('basic') || category.includes('selector')) {
            tiers.basic += tier.count;
        } else if (category.includes('beginner') || category.includes('javascript')) {
            tiers.beginner += tier.count;
        } else if (category.includes('intermediate') || category.includes('playwright')) {
            tiers.intermediate += tier.count;
        } else if (category.includes('expert') || category.includes('advanced')) {
            tiers.expert += tier.count;
        }
    }

    return {
        challenges: challengeCount.count,
        tutorials: tutorialCount.count,
        achievements: achievementCount.count,
        tiers,
    };
}

export const getDashboardStats = createServerFn({ method: 'GET' }).handler(
    async (): Promise<{ success: boolean; data?: StatsCache['data']; error?: string }> => {
        try {
            // Check if we have valid cached data
            const now = Date.now();
            if (cachedStats && (now - cachedStats.timestamp) < CACHE_TTL_MS) {
                logger.debug('[Stats Cache] Returning cached data');
                return { success: true, data: cachedStats.data };
            }

            // Fetch fresh data
            logger.debug('[Stats Cache] Fetching fresh data from database');
            const data = await fetchStats();

            // Update cache
            cachedStats = {
                data,
                timestamp: now,
            };

            return { success: true, data };
        } catch (error) {
            logger.error('Error fetching dashboard stats:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
);
