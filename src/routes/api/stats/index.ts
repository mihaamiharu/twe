import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { db } from '@/db';
import { challenges, tutorials, achievements } from '@/db/schema';
import { sql } from 'drizzle-orm';

export const Route = createFileRoute('/api/stats/')({
    server: {
        handlers: {
            GET: async () => {
                try {
                    // Get counts from database
                    const [challengeCount] = await db
                        .select({ count: sql<number>`count(*)::int` })
                        .from(challenges);

                    const [tutorialCount] = await db
                        .select({ count: sql<number>`count(*)::int` })
                        .from(tutorials);

                    const [achievementCount] = await db
                        .select({ count: sql<number>`count(*)::int` })
                        .from(achievements);

                    // Get tier breakdown
                    const tierCounts = await db
                        .select({
                            category: challenges.category,
                            count: sql<number>`count(*)::int`,
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

                    return json({
                        success: true,
                        data: {
                            challenges: challengeCount.count,
                            tutorials: tutorialCount.count,
                            achievements: achievementCount.count,
                            tiers,
                        },
                    });
                } catch (error) {
                    console.error('Error fetching stats:', error);
                    return json(
                        { success: false, error: 'Failed to fetch stats' },
                        { status: 500 }
                    );
                }
            },
        },
    },
});
