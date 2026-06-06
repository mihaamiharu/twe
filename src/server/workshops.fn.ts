import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { db } from '@/db';
import { workshops, workshopModules, workshopProgress, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { authMiddleware } from './auth.mw';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { auth } from './auth.server';
import { getWorkshopList, getWorkshopContent, getWorkshopModuleContent } from './content.server';

export const getWorkshopsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => z.object({ locale: z.string().default('en') }).parse(data))
  .handler(async ({ data }) => {
    return await getWorkshopList(data.locale);
  });

export const getWorkshopFn = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => z.object({ slug: z.string(), locale: z.string().default('en') }).parse(data))
  .handler(async ({ data }) => {
    return await getWorkshopContent(data.slug, data.locale);
  });

export const getWorkshopModuleFn = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => z.object({ workshopSlug: z.string(), moduleSlug: z.string(), locale: z.string().default('en') }).parse(data))
  .handler(async ({ data }) => {
    const content = await getWorkshopModuleContent(data.workshopSlug, data.moduleSlug, data.locale);
    
    let isCompleted = false;
    const headers = getRequestHeaders();
    const session = await auth.api.getSession({ headers });

    if (session?.user?.id) {
       const workshopRecord = await db.query.workshops.findFirst({ where: eq(workshops.slug, data.workshopSlug) });
       if (workshopRecord) {
         const moduleRecord = await db.query.workshopModules.findFirst({ 
           where: and(eq(workshopModules.workshopId, workshopRecord.id), eq(workshopModules.slug, data.moduleSlug)) 
         });
         if (moduleRecord) {
           const progress = await db.query.workshopProgress.findFirst({
             where: and(eq(workshopProgress.userId, session.user.id), eq(workshopProgress.moduleId, moduleRecord.id))
           });
           if (progress) isCompleted = progress.isCompleted;
         }
       }
    }

    return { ...content, isCompleted };
  });

export const markWorkshopModuleComplete = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => z.object({
    workshopSlug: z.string(),
    moduleSlug: z.string(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const userId = context.user.id;
    const { workshopSlug, moduleSlug } = data;

    const workshopRecord = await db.query.workshops.findFirst({
      where: eq(workshops.slug, workshopSlug),
    });
    if (!workshopRecord) throw new Error('Workshop not found');

    const moduleRecord = await db.query.workshopModules.findFirst({
      where: and(
        eq(workshopModules.workshopId, workshopRecord.id),
        eq(workshopModules.slug, moduleSlug)
      ),
    });
    if (!moduleRecord) throw new Error('Module not found');

    return await db.transaction(async (tx) => {
      const existingProgress = await tx.query.workshopProgress.findFirst({
        where: and(
          eq(workshopProgress.userId, userId),
          eq(workshopProgress.moduleId, moduleRecord.id)
        ),
      });

      if (existingProgress?.isCompleted) {
        return { success: true, message: 'Already completed', xpEarned: 0 };
      }

      if (existingProgress) {
        await tx.update(workshopProgress)
          .set({ isCompleted: true, completedAt: new Date() })
          .where(eq(workshopProgress.id, existingProgress.id));
      } else {
        await tx.insert(workshopProgress).values({
          userId,
          workshopId: workshopRecord.id,
          moduleId: moduleRecord.id,
          isCompleted: true,
          completedAt: new Date(),
        });
      }

      await tx.update(users)
        .set({ xp: sql`${users.xp} + ${moduleRecord.xpReward}` })
        .where(eq(users.id, userId));

      return { success: true, message: 'Module completed', xpEarned: moduleRecord.xpReward };
    });
  });
