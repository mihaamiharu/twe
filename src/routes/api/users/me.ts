import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { db } from '@/db';
import { users, progress, challenges, userAchievements, achievements, submissions } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authClient } from '@/lib/auth.client';

export const Route = createFileRoute('/api/users/me')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const session = await authClient.getSession();

          if (!session.data?.user?.id) {
            return json(
              { success: false, error: 'Unauthorized' },
              { status: 401 }
            );
          }

          const userId = session.data.user.id;

          // Get user data
          const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
          });

          if (!user) {
            return json(
              { success: false, error: 'User not found' },
              { status: 404 }
            );
          }

          // Get completed challenges count
          const completedChallengesResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(progress)
            .where(
              and(
                eq(progress.userId, userId),
                eq(progress.isCompleted, true),
                sql`${progress.challengeId} IS NOT NULL`
              )
            );

          const completedChallenges = completedChallengesResult[0]?.count || 0;

          // Get completed tutorials count
          const completedTutorialsResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(progress)
            .where(
              and(
                eq(progress.userId, userId),
                eq(progress.isCompleted, true),
                sql`${progress.tutorialId} IS NOT NULL`
              )
            );

          const completedTutorials = completedTutorialsResult[0]?.count || 0;

          // Get user achievements
          const userAchievementsList = await db
            .select({
              id: achievements.id,
              slug: achievements.slug,
              name: achievements.name,
              description: achievements.description,
              icon: achievements.icon,
              category: achievements.category,
              unlockedAt: userAchievements.unlockedAt,
            })
            .from(userAchievements)
            .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
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

          // Calculate XP progress to next level
          const currentLevel = user.level;
          const currentXP = user.xp;
          const xpForCurrentLevel = 100 * Math.pow(currentLevel - 1, 2);
          const xpForNextLevel = 100 * Math.pow(currentLevel, 2);
          const xpProgress = currentXP - xpForCurrentLevel;
          const xpNeeded = xpForNextLevel - xpForCurrentLevel;

          return json({
            success: true,
            data: {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              createdAt: user.createdAt,

              // Gamification
              xp: user.xp,
              level: user.level,
              xpProgress,
              xpNeeded,
              xpProgressPercentage: Math.round((xpProgress / xpNeeded) * 100),

              // Privacy
              profileVisibility: user.profileVisibility,
              showOnLeaderboard: user.showOnLeaderboard,

              // Stats
              stats: {
                completedChallenges,
                completedTutorials,
                achievementsCount: userAchievementsList.length,
              },

              // Details
              achievements: userAchievementsList,
              recentSubmissions,
            },
          });
        } catch (error) {
          console.error('Error fetching user profile:', error);
          return json(
            { success: false, error: 'Failed to fetch user profile' },
            { status: 500 }
          );
        }
      },

      PATCH: async ({ request }) => {
        try {
          const session = await authClient.getSession();

          if (!session.data?.user?.id) {
            return json(
              { success: false, error: 'Unauthorized' },
              { status: 401 }
            );
          }

          const userId = session.data.user.id;
          const body = await request.json();

          // Validate allowed fields
          const allowedFields = ['name', 'profileVisibility', 'showOnLeaderboard'];
          const updates: Record<string, unknown> = {};

          for (const field of allowedFields) {
            if (body[field] !== undefined) {
              updates[field] = body[field];
            }
          }

          if (Object.keys(updates).length === 0) {
            return json(
              { success: false, error: 'No valid fields to update' },
              { status: 400 }
            );
          }

          // Validate profileVisibility if provided
          if (updates.profileVisibility && !['PUBLIC', 'PRIVATE'].includes(updates.profileVisibility as string)) {
            return json(
              { success: false, error: 'Invalid profileVisibility value' },
              { status: 400 }
            );
          }

          // Update user
          const updatedUser = await db
            .update(users)
            .set({
              ...updates,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
            .returning();

          return json({
            success: true,
            data: updatedUser[0],
          });
        } catch (error) {
          console.error('Error updating user profile:', error);
          return json(
            { success: false, error: 'Failed to update user profile' },
            { status: 500 }
          );
        }
      },
    },
  },
});
