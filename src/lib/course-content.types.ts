import type { Locale } from './i18n/settings';

/**
 * Route patterns declared by a course manifest.
 *
 * The `$param` syntax mirrors TanStack Router's file-based route convention.
 */
export interface CourseRouteContract {
  overview: string;
  checkpoint: string;
}

/** Stable metadata for one learner-facing course checkpoint. */
export interface CourseCheckpointManifest {
  slug: string;
  order: number;
  repositoryPath: string;
  reflectionId: string;
  completionId: string;
}

/** Stable reference to the applied capstone attached to a course. */
export interface CourseCapstoneManifest {
  id: string;
  checkpointSlug: string;
}

/** Filesystem-backed contract for a course before lesson content is authored. */
export interface CourseManifest {
  slug: string;
  defaultLocale: Locale;
  availableLocales: readonly Locale[];
  requiresAuthentication: boolean;
  routes: CourseRouteContract;
  capstone: CourseCapstoneManifest;
  checkpoints: readonly CourseCheckpointManifest[];
}

/** Video metadata for a planned or ready course video. */
export interface CourseVideoOutline {
  status: 'planned' | 'ready';
  title: string;
  durationMinutes: number;
  focus: string;
}

/** Reusable shape for an AI-assisted learning activity. */
export interface CourseAiActivityOutline {
  goal: string;
  prompt: string;
  learnerActions: readonly string[];
  expectedOutput: string;
}

/** Reusable shape for a learner-run companion repository exercise. */
export interface CourseLocalExerciseOutline {
  repositoryPaths: readonly string[];
  instructions: readonly string[];
  expectedArtifacts: readonly string[];
  safetyNotes: readonly string[];
}

/** Self-attested action used to complete a course content unit. */
export interface CourseCompletionActionOutline {
  id: string;
  label: string;
  requirements: readonly string[];
  selfAttested: boolean;
}

/** Shared authoring structure for checkpoints and the capstone. */
export interface CourseContentUnit {
  title: string;
  objective: string;
  video: CourseVideoOutline;
  writtenLesson: string;
  aiActivity: CourseAiActivityOutline;
  localExercise: CourseLocalExerciseOutline;
  evidenceChecklist: readonly string[];
  reflectionPrompts: readonly string[];
  completionAction: CourseCompletionActionOutline;
}

/** Authored content outline for one course checkpoint. */
export interface CourseCheckpointContent extends CourseContentUnit {
  slug: string;
  order: number;
  reflectionId: string;
  completionId: string;
  capstoneReference?: string;
}

/** Authored content outline for the end-to-end capstone. */
export interface CourseCapstoneContent extends CourseContentUnit {
  id: string;
  reflectionId: string;
  requirements: readonly string[];
}

/** Locale-specific filesystem document containing the course outline. */
export interface CourseContentDocument {
  courseSlug: string;
  locale: Locale;
  templateVersion: 1;
  checkpoints: readonly CourseCheckpointContent[];
  capstone: CourseCapstoneContent;
}
