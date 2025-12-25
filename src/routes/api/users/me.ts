import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { db } from '@/db';
import { users, challenges, userAchievements, achievements, submissions } from '@/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { auth } from '@/lib/auth.server';
import { getUserStats } from '@/lib/stats';
import { logger } from '@/lib/logger';

export const Route = createFileRoute('/api/users/me')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          // Get session from request headers (server-side)
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user?.id) {
            return json(
              { success: false, error: 'Unauthorized' },
              { status: 401 }
            );
          }

          const userId = session.user.id;

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

          // Get submissions for heatmap (last 365 days)
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

          const heatmapSubmissions = await db
            .select({
              createdAt: submissions.createdAt,
            })
            .from(submissions)
            .where(
              and(
                eq(submissions.userId, userId),
                gte(submissions.createdAt, oneYearAgo),
                eq(submissions.isPassed, true)
              )
            );

          // Aggregate by date (YYYY-MM-DD)
          const heatmapMap = new Map<string, number>();
          heatmapSubmissions.forEach(sub => {
            const dateStr = sub.createdAt.toISOString().split('T')[0];
            heatmapMap.set(dateStr, (heatmapMap.get(dateStr) || 0) + 1);
          });

          const heatmapData = Array.from(heatmapMap.entries()).map(([date, count]) => ({
            date,
            count
          })).sort((a, b) => a.date.localeCompare(b.date));

          // Calculate XP progress to next level
          const currentLevel = user.level;
          const currentXP = user.xp;
          const xpForCurrentLevel = 100 * Math.pow(currentLevel - 1, 2);
          const xpForNextLevel = 100 * Math.pow(currentLevel, 2);
          const xpProgress = currentXP - xpForCurrentLevel;
          const xpNeeded = xpForNextLevel - xpForCurrentLevel;

          // Construct recent activity
          const activity = [
            // Map submissions to activity
            ...recentSubmissions
              .filter(s => s.isPassed) // Only show passed submissions in activity? Or all? Usually passed.
              .map(s => ({
                type: 'challenge' as const,
                title: s.challengeTitle,
                xp: s.xpEarned,
                date: s.createdAt,
                timestamp: s.createdAt.getTime(),
              })),
            // Map achievements to activity
            ...userAchievementsList.map(a => ({
              type: 'achievement' as const,
              title: a.name,
              xp: a.xpReward,
              date: a.unlockedAt,
              timestamp: a.unlockedAt.getTime(),
            })),
          ]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10) // Limit to 10 items
            .map(({ timestamp, date, ...rest }) => ({
              ...rest,
              date: new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
              }).format(date),
            }));

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
                challengesByType: stats.challengesByType,
              },

              // Details
              // Frontend expects 'recentAchievements', but interface says 'recentAchievements'. 
              // The original code returned 'achievements: userAchievementsList'. 
              // Let's check frontend mapping. 
              // ProfilePage interface: recentAchievements: { name, description, icon }[]
              // original code returned 'achievements: userAchievementsList'.
              // Wait, does the frontend MAP it? 
              // let's look at profile.tsx again. 
              // interface UserProfile { recentAchievements: ... }
              // The API returned 'achievements'. This implies a mismatch or I missed a mapping.
              // However, in Javascript/JSON, if the server returns 'achievements', the client sees 'achievements'.
              // If the client interface says 'recentAchievements', but the data has 'achievements', accessing 'user.recentAchievements' would be undefined.
              // Unless the fetcher maps it.
              // The fetcher is: return res.json();
              // So the API MUST return 'recentAchievements' if the client expects it.
              // OR the client interface is wrong/loose.
              // Let's return 'recentAchievements' to match the interface.
              // But wait, the original code returned 'achievements'.
              // I'll stick to 'recentAchievements: userAchievementsList'.
              recentAchievements: userAchievementsList.map(a => ({
                name: a.name,
                description: a.description,
                icon: a.icon,
                unlockedAt: a.unlockedAt
              })),
              // Actually, simpler to just map exactly what UI needs or pass the list.
              // The UI uses 'user.recentAchievements'.

              // The UI uses 'user.recentAchievements'.

              heatmapData, // { date: string, count: number }[]

              recentActivity: activity,
            },
          });
        } catch (error) {
          logger.error('Error fetching user profile:', error);
          return json(
            { success: false, error: 'Failed to fetch user profile' },
            { status: 500 }
          );
        }
      },

      PATCH: async ({ request }) => {
        try {
          // Get session from request headers (server-side)
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user?.id) {
            return json(
              { success: false, error: 'Unauthorized' },
              { status: 401 }
            );
          }

          const userId = session.user.id;
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

          return json({
            success: true,
            data: updatedUser,
          });
        } catch (error) {
          logger.error('Error updating user profile:', error);
          return json(
            { success: false, error: 'Failed to update user profile' },
            { status: 500 }
          );
        }
      },
    },
  },
});
