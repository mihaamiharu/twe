import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { adminMiddleware } from '../auth.mw';
import { db } from '@/db';
import { courseReviews } from '@/db/schema';
import {
  COURSE_REVIEW_PROMPT_VERSION,
  createCourseReviewInputSchema,
  generateCourseReviewDraftInputSchema,
  finalizeCourseReviewInputSchema,
  updateCourseReviewInputSchema,
} from '@/lib/course-review';
import { generateCourseReviewDraft } from '@/lib/ai';
import { getCourseContent } from '@/server/course-content.server';

const REQUIRED_CHECKPOINT_SLUGS = [
  '01-requirements',
  '02-test-design',
  '03-test-writing',
  '04-automation',
  '05-execution',
  '06-triage',
  '07-quality-summary',
] as const;

export const getAdminCourseReviews = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    const reviews = await db.query.courseReviews.findMany({
      orderBy: (reviews, { desc }) => [desc(reviews.updatedAt)],
      columns: {
        id: true,
        courseSlug: true,
        repositoryUrl: true,
        reviewRound: true,
        status: true,
        checkpointDrafts: true,
        reviewerNotes: true,
        finalFeedback: true,
        finalizedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: reviews };
  });

export const createAdminCourseReview = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator((data: unknown) => createCourseReviewInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const [review] = await db
      .insert(courseReviews)
      .values({
        reviewerId: context.userId,
        courseSlug: data.courseSlug,
        repositoryUrl: data.repositoryUrl,
        reviewRound: data.reviewRound,
        reviewerNotes: data.reviewerNotes,
        checkpointDrafts: {},
      })
      .returning();

    return { success: true, data: review };
  });

export const generateAdminCourseReviewDraft = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator((data: unknown) =>
    generateCourseReviewDraftInputSchema.parse(data),
  )
  .handler(async ({ data, context }) => {
    const review = await db.query.courseReviews.findFirst({
      where: and(
        eq(courseReviews.id, data.reviewId),
        eq(courseReviews.reviewerId, context.userId),
      ),
    });

    if (!review || review.status !== 'DRAFT') {
      return { success: false, error: 'Review draft is not available.' };
    }

    const content = await getCourseContent(data.courseSlug, data.locale);
    const checkpoint = content?.checkpoints.find(
      (candidate) => candidate.slug === data.checkpointSlug,
    );
    if (!checkpoint) {
      return {
        success: false,
        error: 'Checkpoint is not part of this course.',
      };
    }

    const result = await generateCourseReviewDraft({
      checkpointSlug: data.checkpointSlug,
      files: data.files,
      reviewerNotes: data.reviewerNotes ?? review.reviewerNotes ?? undefined,
      locale: data.locale,
    });

    if (!result.success || !result.draft) {
      return {
        success: false,
        error: result.error ?? 'Draft generation failed.',
      };
    }

    const checkpointDrafts = {
      ...review.checkpointDrafts,
      [data.checkpointSlug]: {
        ...result.draft,
        promptVersion: COURSE_REVIEW_PROMPT_VERSION,
        generatedAt: new Date().toISOString(),
      },
    };

    const [updated] = await db
      .update(courseReviews)
      .set({
        checkpointDrafts,
        reviewerNotes: data.reviewerNotes ?? review.reviewerNotes,
        updatedAt: new Date(),
      })
      .where(eq(courseReviews.id, review.id))
      .returning();

    return { success: true, data: updated };
  });

export const updateAdminCourseReviewDraft = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator((data: unknown) => updateCourseReviewInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const review = await db.query.courseReviews.findFirst({
      where: and(
        eq(courseReviews.id, data.reviewId),
        eq(courseReviews.reviewerId, context.userId),
      ),
    });
    const draft = review?.checkpointDrafts[data.checkpointSlug];

    if (!review || review.status !== 'DRAFT' || !draft) {
      return { success: false, error: 'Checkpoint draft is not available.' };
    }

    const checkpointDrafts = {
      ...review.checkpointDrafts,
      [data.checkpointSlug]: {
        ...draft,
        status: data.status,
      },
    };

    const [updated] = await db
      .update(courseReviews)
      .set({
        checkpointDrafts,
        reviewerNotes: data.reviewerNotes ?? review.reviewerNotes,
        updatedAt: new Date(),
      })
      .where(eq(courseReviews.id, review.id))
      .returning();

    return { success: true, data: updated };
  });

export const finalizeAdminCourseReview = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator((data: unknown) =>
    finalizeCourseReviewInputSchema.parse(data),
  )
  .handler(async ({ data, context }) => {
    const review = await db.query.courseReviews.findFirst({
      where: and(
        eq(courseReviews.id, data.reviewId),
        eq(courseReviews.reviewerId, context.userId),
      ),
    });

    if (!review || review.status !== 'DRAFT') {
      return {
        success: false,
        error: 'Review is not available for finalization.',
      };
    }

    const draftedCheckpoints = Object.keys(review.checkpointDrafts);
    const hasEveryCheckpoint = REQUIRED_CHECKPOINT_SLUGS.every((slug) =>
      draftedCheckpoints.includes(slug),
    );
    if (!hasEveryCheckpoint) {
      return {
        success: false,
        error: 'Generate a draft for every checkpoint before finalizing.',
      };
    }

    const [updated] = await db
      .update(courseReviews)
      .set({
        status: 'FINALIZED',
        finalFeedback: data.finalFeedback,
        finalizedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(courseReviews.id, review.id))
      .returning();

    return { success: true, data: updated };
  });
