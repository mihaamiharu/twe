import { createServerFn } from '@tanstack/react-start';
import { adminMiddleware } from '../auth.mw';
import { db } from '@/db';
import { achievements, userAchievements } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export const getAdminAchievements = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    try {
      const list = await db
        .select({
          id: achievements.id,
          slug: achievements.slug,
          name: achievements.name,
          description: achievements.description,
          icon: achievements.icon,
          rarity: achievements.rarity,
          category: achievements.category,
          unlockCount: sql<number>`count(${userAchievements.id})::int`,
        })
        .from(achievements)
        .leftJoin(
          userAchievements,
          eq(achievements.id, userAchievements.achievementId),
        )
        .groupBy(achievements.id)
        .orderBy(achievements.slug);

      return { success: true, data: list };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to fetch achievements:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  });
