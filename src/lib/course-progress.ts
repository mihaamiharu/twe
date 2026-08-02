import { z } from 'zod';

/** The existing tutorial completion flow awards 25 XP on first completion. */
export const COURSE_CHECKPOINT_XP = 25 as const;

/** Marker used to keep hidden course progress out of generic tutorial stats. */
export const COURSE_PROGRESS_TAG = 'course-progress' as const;

/** Stable achievement awarded after the seven checkpoints and capstone. */
export const COURSE_COMPLETION_ACHIEVEMENT_ID =
  'ai-assisted-qa-workflow-complete' as const;

export type CourseProgressUnit =
  | { kind: 'checkpoint'; id: string }
  | { kind: 'capstone'; id: string };

export interface CourseProgressState {
  completedCheckpointSlugs: readonly string[];
  capstoneCompleted: boolean;
}

export interface CourseUnitCompletionOutcome {
  state: CourseProgressState;
  wasAlreadyCompleted: boolean;
  xpAwarded: number;
  courseComplete: boolean;
}

/**
 * The learner confirms the exercise and reflection; no review state is part of
 * the completion contract. Unknown fields are stripped by Zod and never read.
 */
const courseCompletionConfirmationSchema = {
  courseSlug: z.literal('ai-assisted-qa-workflow'),
  locale: z.literal('id'),
  completionId: z.string().min(1),
  reflectionId: z.string().min(1),
  exerciseConfirmed: z.literal(true),
  reflectionConfirmed: z.literal(true),
};

export const courseCheckpointCompletionInputSchema = z.object({
  ...courseCompletionConfirmationSchema,
  checkpointSlug: z.string().min(1),
});

export const courseCapstoneCompletionInputSchema = z.object({
  ...courseCompletionConfirmationSchema,
  capstoneId: z.literal('ai-assisted-qa-workflow.capstone'),
});

export type CourseCheckpointCompletionInput = z.infer<
  typeof courseCheckpointCompletionInputSchema
>;

export type CourseCapstoneCompletionInput = z.infer<
  typeof courseCapstoneCompletionInputSchema
>;

/** Build the deterministic hidden tutorial slug used by course progress. */
export function getCourseProgressTutorialSlug(
  courseSlug: string,
  unitId: string,
): string {
  return `course:${courseSlug}:${unitId}`;
}

export function isCourseComplete(
  state: CourseProgressState,
  checkpointSlugs: readonly string[],
): boolean {
  if (checkpointSlugs.length === 0 || !state.capstoneCompleted) return false;

  const completed = new Set(state.completedCheckpointSlugs);
  return checkpointSlugs.every((slug) => completed.has(slug));
}

/**
 * Apply one self-attested completion. The reducer is deliberately unaware of
 * AI or human review so review status cannot alter progress, XP, or eligibility.
 */
export function applyCourseUnitCompletion(
  state: CourseProgressState,
  unit: CourseProgressUnit,
  checkpointSlugs: readonly string[],
): CourseUnitCompletionOutcome {
  if (unit.kind === 'capstone') {
    const wasAlreadyCompleted = state.capstoneCompleted;
    const nextState = {
      ...state,
      capstoneCompleted: true,
    };

    return {
      state: nextState,
      wasAlreadyCompleted,
      // The capstone is required for course completion but is not a checkpoint.
      xpAwarded: 0,
      courseComplete: isCourseComplete(nextState, checkpointSlugs),
    };
  }

  const wasAlreadyCompleted = state.completedCheckpointSlugs.includes(unit.id);
  const nextState = wasAlreadyCompleted
    ? state
    : {
        ...state,
        completedCheckpointSlugs: [...state.completedCheckpointSlugs, unit.id],
      };

  return {
    state: nextState,
    wasAlreadyCompleted,
    xpAwarded: wasAlreadyCompleted ? 0 : COURSE_CHECKPOINT_XP,
    courseComplete: isCourseComplete(nextState, checkpointSlugs),
  };
}

/** Course achievement eligibility is a one-time, post-capstone condition. */
export function isCourseCompletionEligible(
  state: CourseProgressState,
  checkpointSlugs: readonly string[],
  alreadyEarned: boolean,
): boolean {
  return !alreadyEarned && isCourseComplete(state, checkpointSlugs);
}
