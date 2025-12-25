import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { db } from '@/db';
import { tutorials, progress } from '@/db/schema';
import { eq, and, asc, desc, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth.server';
import { logger } from '@/lib/logger';

interface TutorialFilters {
  search?: string;
  tag?: string;
  page?: number;
  limit?: number;
  sortBy?: 'order' | 'estimatedMinutes' | 'viewCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export const Route = createFileRoute('/api/tutorials/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const filters: TutorialFilters = {
            search: url.searchParams.get('search') || undefined,
            tag: url.searchParams.get('tag') || undefined,
            page: parseInt(url.searchParams.get('page') || '1'),
            limit: Math.min(parseInt(url.searchParams.get('limit') || '20'), 50),
            sortBy: url.searchParams.get('sortBy') as TutorialFilters['sortBy'] || 'order',
            sortOrder: url.searchParams.get('sortOrder') as TutorialFilters['sortOrder'] || 'asc',
          };

          // Build conditions array
          const conditions = [eq(tutorials.isPublished, true)];

          if (filters.search) {
            conditions.push(
              sql`(${tutorials.title} ILIKE ${`%${filters.search}%`} OR ${tutorials.description} ILIKE ${`%${filters.search}%`})`
            );
          }

          if (filters.tag) {
            conditions.push(sql`${filters.tag} = ANY(${tutorials.tags})`);
          }

          // Get total count
          const countResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(tutorials)
            .where(and(...conditions));

          const total = countResult[0]?.count || 0;

          // Determine sort column
          const sortColumn = {
            order: tutorials.order,
            estimatedMinutes: tutorials.estimatedMinutes,
            viewCount: tutorials.viewCount,
            createdAt: tutorials.createdAt,
          }[filters.sortBy || 'order'];

          const orderFn = filters.sortOrder === 'desc' ? desc : asc;

          // Get tutorials with pagination
          const offset = ((filters.page || 1) - 1) * (filters.limit || 20);

          const tutorialList = await db
            .select({
              id: tutorials.id,
              slug: tutorials.slug,
              title: tutorials.title,
              description: tutorials.description,
              estimatedMinutes: tutorials.estimatedMinutes,
              tags: tutorials.tags,
              viewCount: tutorials.viewCount,
              order: tutorials.order,
            })
            .from(tutorials)
            .where(and(...conditions))
            .orderBy(orderFn(sortColumn))
            .limit(filters.limit || 20)
            .offset(offset);

          // Get user progress if authenticated
          let userProgress: Record<string, { isCompleted: boolean; readingProgress: number }> = {};
          try {
            const session = await auth.api.getSession({ headers: request.headers });
            if (session?.user?.id) {
              const progressRecords = await db
                .select({
                  tutorialId: progress.tutorialId,
                  isCompleted: progress.isCompleted,
                  readingProgress: progress.readingProgress,
                })
                .from(progress)
                .where(eq(progress.userId, session.user.id));

              userProgress = progressRecords.reduce((acc, p) => {
                if (p.tutorialId) {
                  acc[p.tutorialId] = {
                    isCompleted: p.isCompleted,
                    readingProgress: p.readingProgress || 0,
                  };
                }
                return acc;
              }, {} as Record<string, { isCompleted: boolean; readingProgress: number }>);
            }
          } catch {
            // User not authenticated, continue without progress
          }

          // Add progress to tutorials
          const tutorialsWithProgress = tutorialList.map((tutorial) => ({
            ...tutorial,
            isCompleted: userProgress[tutorial.id]?.isCompleted || false,
            readingProgress: userProgress[tutorial.id]?.readingProgress || 0,
          }));

          // Get all unique tags for filtering
          const allTagsResult = await db
            .selectDistinct({ tag: sql<string>`unnest(${tutorials.tags})` })
            .from(tutorials)
            .where(eq(tutorials.isPublished, true));

          const allTags = allTagsResult.map(r => r.tag).filter(Boolean);

          return json({
            success: true,
            data: tutorialsWithProgress,
            meta: {
              availableTags: allTags,
            },
            pagination: {
              page: filters.page || 1,
              limit: filters.limit || 20,
              total,
              totalPages: Math.ceil(total / (filters.limit || 20)),
            },
          });
        } catch (error) {
          logger.error('Error fetching tutorials:', error);
          return json(
            { success: false, error: 'Failed to fetch tutorials' },
            { status: 500 }
          );
        }
      },
    },
  },
});
