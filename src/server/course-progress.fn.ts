import { createServerFn } from '@tanstack/react-start';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { progress, tutorials, users } from '@/db/schema';
import {
  COURSE_COMPLETION_ACHIEVEMENT_ID,
  COURSE_PROGRESS_TAG,
  applyCourseUnitCompletion,
  courseCapstoneCompletionInputSchema,
  courseCheckpointCompletionInputSchema,
  courseOverviewInputSchema,
  getCourseProgressTutorialSlug,
  isCourseCompletionEligible,
  type CourseProgressState,
  type CourseProgressUnit,
} from '@/lib/course-progress';
import { getAchievementById } from '@/lib/achievements';
import { awardAchievements, getEarnedAchievementIds } from '@/lib/stats';
import { logger } from '@/lib/logger';
import type {
  CourseCapstoneContent,
  CourseCheckpointContent,
  CourseContentDocument,
} from '@/lib/course-content.types';
import {
  AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
  getCourseContent,
  getCourseManifest,
} from './course-content.server';
import { authMiddleware } from './auth.mw';

type CourseUnitDefinition = {
  kind: CourseProgressUnit['kind'];
  id: string;
  content: CourseCheckpointContent | CourseCapstoneContent;
  order: number;
};

export const getCourseOverview = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => courseOverviewInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    if (
      data.courseSlug !== AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG ||
      data.locale !== 'id'
    ) {
      return {
        success: false,
        error: 'Course is only available in Indonesian',
      };
    }

    const [manifest, content] = await Promise.all([
      getCourseManifest(data.courseSlug, data.locale),
      getCourseContent(data.courseSlug, data.locale),
    ]);

    if (!manifest || !content) {
      return { success: false, error: 'Course overview not found' };
    }

    const unitSlugs = [
      ...manifest.checkpoints.map((checkpoint) =>
        getCourseProgressTutorialSlug(data.courseSlug, checkpoint.slug),
      ),
      getCourseProgressTutorialSlug(data.courseSlug, content.capstone.id),
    ];
    const completedRows = await db
      .select({ slug: tutorials.slug })
      .from(progress)
      .innerJoin(tutorials, eq(progress.tutorialId, tutorials.id))
      .where(
        and(
          eq(progress.userId, context.user.id),
          eq(progress.isCompleted, true),
          inArray(tutorials.slug, unitSlugs),
        ),
      );
    const completedSlugs = new Set(completedRows.map((row) => row.slug));

    return {
      success: true,
      data: {
        manifest,
        content,
        completedCheckpointSlugs: manifest.checkpoints
          .filter((checkpoint) =>
            completedSlugs.has(
              getCourseProgressTutorialSlug(data.courseSlug, checkpoint.slug),
            ),
          )
          .map((checkpoint) => checkpoint.slug),
        capstoneCompleted: completedSlugs.has(
          getCourseProgressTutorialSlug(data.courseSlug, content.capstone.id),
        ),
      },
    };
  });

function getUnitProgressSlug(courseSlug: string, unit: CourseUnitDefinition) {
  return getCourseProgressTutorialSlug(courseSlug, unit.id);
}

function getCheckpointDefinition(
  content: CourseContentDocument,
  checkpointSlug: string,
): CourseUnitDefinition | null {
  const checkpoint = content.checkpoints.find(
    (candidate) => candidate.slug === checkpointSlug,
  );
  if (!checkpoint) return null;

  return {
    kind: 'checkpoint',
    id: checkpoint.slug,
    content: checkpoint,
    order: checkpoint.order,
  };
}

function getCapstoneDefinition(
  content: CourseContentDocument,
): CourseUnitDefinition {
  return {
    kind: 'capstone',
    id: content.capstone.id,
    content: content.capstone,
    order: content.checkpoints.length + 1,
  };
}

function getCompletionIdentifiers(definition: CourseUnitDefinition): {
  completionId: string;
  reflectionId: string;
} {
  return {
    completionId: definition.content.completionAction.id,
    reflectionId: definition.content.reflectionId,
  };
}

async function recordCourseUnitCompletion({
  userId,
  courseSlug,
  content,
  definition,
}: {
  userId: string;
  courseSlug: string;
  content: CourseContentDocument;
  definition: CourseUnitDefinition;
}) {
  const checkpointSlugs = content.checkpoints.map(
    (checkpoint) => checkpoint.slug,
  );
  const unitSlug = getUnitProgressSlug(courseSlug, definition);
  const unitIds = [
    ...checkpointSlugs.map((slug) =>
      getCourseProgressTutorialSlug(courseSlug, slug),
    ),
    getCourseProgressTutorialSlug(courseSlug, content.capstone.id),
  ];

  const result = await db.transaction(async (tx) => {
    // Serialize all units for one learner/course so duplicate requests cannot
    // both award first-completion XP when the row is being created.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`${userId}:${courseSlug}`}))`,
    );

    let tutorial = await tx.query.tutorials.findFirst({
      where: eq(tutorials.slug, unitSlug),
    });

    if (!tutorial) {
      const inserted = await tx
        .insert(tutorials)
        .values({
          slug: unitSlug,
          title: { id: definition.content.title },
          order: 10000 + definition.order,
          estimatedMinutes: definition.content.video.durationMinutes,
          tags: [COURSE_PROGRESS_TAG, courseSlug],
          isPublished: false,
        })
        .returning();
      tutorial = inserted[0];
    }

    if (!tutorial) {
      throw new Error('Unable to create course progress record');
    }

    const existingProgress = await tx.query.progress.findFirst({
      where: and(
        eq(progress.userId, userId),
        eq(progress.tutorialId, tutorial.id),
      ),
    });

    const completedRows = await tx
      .select({ slug: tutorials.slug })
      .from(progress)
      .innerJoin(tutorials, eq(progress.tutorialId, tutorials.id))
      .where(
        and(
          eq(progress.userId, userId),
          eq(progress.isCompleted, true),
          inArray(tutorials.slug, unitIds),
        ),
      );
    const completedSlugs = new Set(completedRows.map((row) => row.slug));
    const state: CourseProgressState = {
      completedCheckpointSlugs: checkpointSlugs.filter((slug) =>
        completedSlugs.has(getCourseProgressTutorialSlug(courseSlug, slug)),
      ),
      capstoneCompleted: completedSlugs.has(
        getCourseProgressTutorialSlug(courseSlug, content.capstone.id),
      ),
    };

    const outcome = applyCourseUnitCompletion(
      state,
      { kind: definition.kind, id: definition.id },
      checkpointSlugs,
    );
    const now = new Date();

    if (existingProgress) {
      if (!outcome.wasAlreadyCompleted) {
        await tx
          .update(progress)
          .set({
            isCompleted: true,
            readingProgress: 100,
            completedAt: now,
            lastAccessedAt: now,
            updatedAt: now,
          })
          .where(eq(progress.id, existingProgress.id));
      }
    } else {
      await tx.insert(progress).values({
        userId,
        tutorialId: tutorial.id,
        isCompleted: true,
        readingProgress: 100,
        completedAt: now,
        lastAccessedAt: now,
        updatedAt: now,
      });
    }

    if (outcome.xpAwarded > 0) {
      // This is the same 25 XP increment used by completeTutorial().
      await tx
        .update(users)
        .set({
          xp: sql`${users.xp} + ${outcome.xpAwarded}`,
          updatedAt: now,
        })
        .where(eq(users.id, userId));
    }

    return outcome;
  });

  let newAchievements: { id: string; name: string; icon: string }[] = [];
  try {
    if (
      isCourseCompletionEligible(
        result.state,
        checkpointSlugs,
        (await getEarnedAchievementIds(userId)).has(
          COURSE_COMPLETION_ACHIEVEMENT_ID,
        ),
      )
    ) {
      await awardAchievements(userId, [COURSE_COMPLETION_ACHIEVEMENT_ID]);
      const achievement = getAchievementById(COURSE_COMPLETION_ACHIEVEMENT_ID);
      if (achievement) {
        newAchievements = [
          {
            id: achievement.id,
            name: achievement.name,
            icon: achievement.icon,
          },
        ];
      }
    }
  } catch (error) {
    logger.error('Error awarding course completion achievement:', error);
  }

  return {
    isCompleted: true,
    courseCompleted: result.courseComplete,
    xpAwarded: result.xpAwarded,
    newAchievements,
  };
}

export const completeCourseCheckpoint = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) =>
    courseCheckpointCompletionInputSchema.parse(data),
  )
  .handler(async ({ data, context }) => {
    const content = await getCourseContent(data.courseSlug, data.locale);
    const definition = content
      ? getCheckpointDefinition(content, data.checkpointSlug)
      : null;

    if (!content || !definition) {
      return { success: false, error: 'Course checkpoint not found' };
    }

    const expected = getCompletionIdentifiers(definition);
    if (
      data.completionId !== expected.completionId ||
      data.reflectionId !== expected.reflectionId
    ) {
      return { success: false, error: 'Invalid course completion contract' };
    }

    const result = await recordCourseUnitCompletion({
      userId: context.user.id,
      courseSlug: data.courseSlug,
      content,
      definition,
    });

    return { success: true, data: result };
  });

export const completeCourseCapstone = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) =>
    courseCapstoneCompletionInputSchema.parse(data),
  )
  .handler(async ({ data, context }) => {
    const content = await getCourseContent(data.courseSlug, data.locale);
    if (!content) {
      return { success: false, error: 'Course capstone not found' };
    }

    const definition = getCapstoneDefinition(content);
    const expected = getCompletionIdentifiers(definition);
    if (
      data.completionId !== expected.completionId ||
      data.reflectionId !== expected.reflectionId
    ) {
      return { success: false, error: 'Invalid course completion contract' };
    }

    const result = await recordCourseUnitCompletion({
      userId: context.user.id,
      courseSlug: data.courseSlug,
      content,
      definition,
    });

    return { success: true, data: result };
  });
