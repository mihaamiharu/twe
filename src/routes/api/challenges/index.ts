import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { db } from '@/db';
import { challenges, progress } from '@/db/schema';
import { eq, and, asc, desc, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth.server';

interface ChallengeFilters {
  type?: 'JAVASCRIPT' | 'PLAYWRIGHT' | 'CSS_SELECTOR' | 'XPATH_SELECTOR';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'order' | 'difficulty' | 'xpReward' | 'completionCount';
  sortOrder?: 'asc' | 'desc';
}

export const Route = createFileRoute('/api/challenges/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const filters: ChallengeFilters = {
            type: url.searchParams.get('type') as ChallengeFilters['type'] || undefined,
            difficulty: url.searchParams.get('difficulty') as ChallengeFilters['difficulty'] || undefined,
            category: url.searchParams.get('category') || undefined,
            search: url.searchParams.get('search') || undefined,
            page: parseInt(url.searchParams.get('page') || '1'),
            limit: Math.min(parseInt(url.searchParams.get('limit') || '50'), 100),
            sortBy: url.searchParams.get('sortBy') as ChallengeFilters['sortBy'] || 'order',
            sortOrder: url.searchParams.get('sortOrder') as ChallengeFilters['sortOrder'] || 'asc',
          };

          // Build conditions array
          const conditions = [eq(challenges.isPublished, true)];

          if (filters.type) {
            conditions.push(eq(challenges.type, filters.type));
          }

          if (filters.difficulty) {
            conditions.push(eq(challenges.difficulty, filters.difficulty));
          }

          if (filters.category) {
            conditions.push(eq(challenges.category, filters.category));
          }

          if (filters.search) {
            conditions.push(
              sql`(${challenges.title} ILIKE ${`%${filters.search}%`} OR ${challenges.description} ILIKE ${`%${filters.search}%`})`
            );
          }

          // Get total count
          const countResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(challenges)
            .where(and(...conditions));

          const total = countResult[0]?.count || 0;

          // Determine sort column
          const sortColumn = {
            order: challenges.order,
            difficulty: challenges.difficulty,
            xpReward: challenges.xpReward,
            completionCount: challenges.completionCount,
          }[filters.sortBy || 'order'];

          const orderFn = filters.sortOrder === 'desc' ? desc : asc;

          // Get challenges with pagination
          const offset = ((filters.page || 1) - 1) * (filters.limit || 50);

          const challengeList = await db
            .select({
              id: challenges.id,
              slug: challenges.slug,
              title: challenges.title,
              description: challenges.description,
              type: challenges.type,
              difficulty: challenges.difficulty,
              category: challenges.category,
              xpReward: challenges.xpReward,
              order: challenges.order,
              tags: challenges.tags,
              completionCount: challenges.completionCount,
            })
            .from(challenges)
            .where(and(...conditions))
            .orderBy(orderFn(sortColumn))
            .limit(filters.limit || 50)
            .offset(offset);


          // Get user progress if authenticated
          let userProgress: Record<string, boolean> = {};
          try {
            const session = await auth.api.getSession({ headers: request.headers });
            if (session?.user?.id) {
              const progressRecords = await db
                .select({
                  challengeId: progress.challengeId,
                  isCompleted: progress.isCompleted,
                })
                .from(progress)
                .where(eq(progress.userId, session.user.id));

              userProgress = progressRecords.reduce((acc, p) => {
                if (p.challengeId) {
                  acc[p.challengeId] = p.isCompleted;
                }
                return acc;
              }, {} as Record<string, boolean>);
            }
          } catch {
            // User not authenticated, continue without progress
          }

          // Add completion status to challenges
          const challengesWithProgress = challengeList.map((challenge) => ({
            ...challenge,
            isCompleted: userProgress[challenge.id] || false,
          }));

          return json({
            success: true,
            data: challengesWithProgress,
            pagination: {
              page: filters.page || 1,
              limit: filters.limit || 20,
              total,
              totalPages: Math.ceil(total / (filters.limit || 20)),
            },
          });
        } catch (error) {
          console.error('Error fetching challenges:', error);
          return json(
            { success: false, error: 'Failed to fetch challenges' },
            { status: 500 }
          );
        }
      },
    },
  },
});
