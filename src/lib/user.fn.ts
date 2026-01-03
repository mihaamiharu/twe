import { createServerFn } from '@tanstack/react-start';
import { db } from '@/db';
import { users, challenges, userAchievements, achievements, submissions } from '@/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { getUserStats } from '@/lib/stats';
import { logger } from '@/lib/logger';
import { z } from 'zod';

export type UserData = {
    id: string;
    email: string;
    name: string | null;
    image?: string;
    createdAt: Date;
    xp: number;
    level: number;
    xpProgress: number;
    xpNeeded: number;
    xpProgressPercentage: number;
    profileVisibility: 'PUBLIC' | 'PRIVATE';
    showOnLeaderboard: boolean;
    stats: {
        completedChallenges: number;
        completedTutorials: number;
        achievementsCount: number;
        challengesByType: Record<string, number>;
    };
    recentAchievements: {
        name: string;
        description: string;
        icon: string;
        unlockedAt: Date;
    }[];
    // heatmapData removed
    recentActivity: {
        type: 'challenge' | 'achievement';
        title: string;
        xp: number;
        date: string;
    }[];
};

export const getUserSettings = createServerFn({ method: 'GET' }).handler(
    async (): Promise<{ success: boolean; data?: UserData; error?: string }> => {
        try {
            // Dynamically import server-only modules
            const { getRequestHeaders } = await import('@tanstack/react-start/server');
            const { auth } = await import('./auth.server');

            const headers = getRequestHeaders() as Headers;
            const session = await auth.api.getSession({ headers });

            if (!session?.user?.id) {
                // Return 'Unauthorized'
                throw new Error('Unauthorized');
            }

            const userId = session.user.id;

            // Get user data
            const user = await db.query.users.findFirst({
                where: eq(users.id, userId),
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Get user stats including challengesByType
            const stats = await getUserStats(userId);
            const completedChallenges = stats.totalChallengesCompleted;
            const completedTutorials = stats.tutorialsCompleted;

            // Get user achievements
            const userAchievementsList = await db
                .select({
                    id: achievements.id,
                    slug: achievements.slug,
                    name: achievements.name,
                    description: achievements.description,
                    icon: achievements.icon,
                    category: achievements.category,
                    xpReward: achievements.xpReward,
                    unlockedAt: userAchievements.unlockedAt,
                })
                .from(userAchievements)
                .innerJoin(
                    achievements,
                    eq(userAchievements.achievementId, achievements.id)
                )
                .where(eq(userAchievements.userId, userId))
                .orderBy(desc(userAchievements.unlockedAt));

            // Get recent submissions (last 5)
            const recentSubmissions = await db
                .select({
                    id: submissions.id,
                    challengeId: submissions.challengeId,
                    challengeTitle: challenges.title,
                    challengeSlug: challenges.slug,
                    isPassed: submissions.isPassed,
                    xpEarned: submissions.xpEarned,
                    createdAt: submissions.createdAt,
                })
                .from(submissions)
                .innerJoin(challenges, eq(submissions.challengeId, challenges.id))
                .where(eq(submissions.userId, userId))
                .orderBy(desc(submissions.createdAt))
                .limit(5);

            // Heatmap logic removed
            // Heatmap logic removed

            // Calculate XP progress to next level
            const currentLevel = user.level || 1;
            const currentXP = user.xp || 0;
            const xpForCurrentLevel = 100 * Math.pow(currentLevel - 1, 2);
            const xpForNextLevel = 100 * Math.pow(currentLevel, 2);

            const xpProgress = Math.max(0, currentXP - xpForCurrentLevel);
            const xpNeeded = Math.max(100, xpForNextLevel - xpForCurrentLevel); // Ensure never 0

            const xpProgressPercentage = Math.min(100, Math.max(0, Math.round((xpProgress / xpNeeded) * 100)));

            // Construct recent activity
            const activityItems: {
                type: 'challenge' | 'achievement';
                title: string;
                xp: number;
                date: Date;
                timestamp: number;
            }[] = [];

            // Safely add submissions
            if (recentSubmissions && Array.isArray(recentSubmissions)) {
                recentSubmissions.filter(s => s.isPassed).forEach(s => {
                    activityItems.push({
                        type: 'challenge',
                        title: s.challengeTitle,
                        xp: s.xpEarned,
                        date: s.createdAt,
                        timestamp: s.createdAt.getTime(),
                    });
                });
            }

            // Safely add achievements
            if (userAchievementsList && Array.isArray(userAchievementsList)) {
                userAchievementsList.forEach(a => {
                    activityItems.push({
                        type: 'achievement',
                        title: a.name,
                        xp: a.xpReward || 0,
                        date: a.unlockedAt,
                        timestamp: a.unlockedAt.getTime(),
                    });
                });
            }

            const activity = activityItems
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                .slice(0, 10)
                .map(({ date, ...rest }) => ({
                    ...rest,
                    date: new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                    }).format(date),
                }));

            return {
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image || undefined,
                    createdAt: user.createdAt,

                    // Gamification
                    xp: user.xp,
                    level: user.level,
                    xpProgress,
                    xpNeeded,
                    xpProgressPercentage,

                    // Privacy
                    profileVisibility: user.profileVisibility,
                    showOnLeaderboard: user.showOnLeaderboard,

                    // Stats
                    stats: {
                        completedChallenges,
                        completedTutorials,
                        achievementsCount: userAchievementsList.length,
                        challengesByType: stats.challengesByType || {},
                    },

                    recentAchievements: userAchievementsList.map((a) => ({
                        name: a.name,
                        description: a.description,
                        icon: a.icon,
                        unlockedAt: a.unlockedAt,
                    })),

                    recentAchievements: userAchievementsList.map((a) => ({
                        name: a.name,
                        description: a.description,
                        icon: a.icon,
                        unlockedAt: a.unlockedAt,
                    })),

                    recentActivity: activity,
                },
            };
        } catch (error) {
            logger.error('Error fetching user profile:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
);

const updateUserSchema = z.object({
    name: z.string().optional(),
    profileVisibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
    showOnLeaderboard: z.boolean().optional(),
});

export const updateUserProfile = createServerFn({ method: 'POST' })
    .inputValidator((data: unknown) => updateUserSchema.parse(data))
    .handler(async ({ data }: { data: z.infer<typeof updateUserSchema> }): Promise<{ success: boolean; data?: any; error?: string }> => {

        try {
            const updates = data;

            // Dynamically import server-only modules
            const { getRequestHeaders } = await import('@tanstack/react-start/server');
            const { auth } = await import('./auth.server');

            const headers = getRequestHeaders() as Headers;
            const session = await auth.api.getSession({ headers });

            if (!session?.user?.id) {
                throw new Error('Unauthorized');
            }

            const userId = session.user.id;

            if (Object.keys(updates).length === 0) {
                throw new Error('No valid fields to update');
            }

            // Update user
            const [updatedUser] = await db
                .update(users)
                .set({
                    ...updates,
                    updatedAt: new Date(),
                })
                .where(eq(users.id, userId))
                .returning({
                    name: users.name,
                    profileVisibility: users.profileVisibility,
                    showOnLeaderboard: users.showOnLeaderboard,
                });

            return {
                success: true,
                data: updatedUser,
            };
        } catch (error) {
            logger.error('Error updating user profile:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    });
