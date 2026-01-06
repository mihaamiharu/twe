import { createServerFn } from '@tanstack/react-start';
import { db } from '@/db';
import { achievements } from '@/db/schema';
import { logger } from '@/lib/logger';
import { sql } from 'drizzle-orm';
import { getChallengeList, getTutorialList } from './content.server';

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
    // Get challenges and tutorials from FILESYSTEM (single source of truth)
    const allChallenges = await getChallengeList('en');
    const allTutorials = await getTutorialList('en');

    // Achievements still from DB (can be migrated to JSON later)
    const [achievementCount] = await db
        .select({ count: sql<number>`count(*):: int` })
        .from(achievements);

    // Calculate tier breakdown from filesystem data
    const tiers = {
        basic: 0,
        beginner: 0,
        intermediate: 0,
        expert: 0,
    };

    for (const challenge of allChallenges) {
        const category = challenge.category?.toLowerCase() || '';
        if (category.includes('basic') || category.includes('selector') || category.includes('xpath')) {
            tiers.basic++;
        } else if (category.includes('beginner') || category.includes('javascript') || category.startsWith('js-')) {
            tiers.beginner++;
        } else if (category.includes('intermediate') || category.includes('playwright')) {
            tiers.intermediate++;
        } else if (category.includes('expert') || category.includes('advanced')) {
            tiers.expert++;
        }
    }

    return {
        challenges: allChallenges.length,
        tutorials: allTutorials.length,
        achievements: achievementCount?.count || 0,
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
