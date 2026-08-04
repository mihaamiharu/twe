import type { Locale } from './i18n/settings';

/** Stable slug for the first localized course pilot. */
export const AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG =
  'ai-assisted-qa-workflow' as const;

/**
 * Route patterns declared by a course manifest.
 *
 * The `$param` syntax mirrors TanStack Router's file-based route convention.
 */
export interface CourseRouteContract {
  overview: string;
  checkpoint: string;
  startHere: string;
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
  embedUrl?: string;
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

/** Localized copy and setup guidance for the course overview page. */
export interface CourseOverviewContent {
  title: string;
  subtitle: string;
  targetAudience: string;
  outcome: string;
  prerequisites: readonly string[];
  startHere: {
    title: string;
    description: string;
    steps: readonly string[];
  };
  setupRequirements: readonly string[];
  recommendedSequence: string;
}

/** One concrete step in the learner's local-first setup workflow. */
export interface CourseStartHereStep {
  id: string;
  title: string;
  purpose: string;
  instructions: readonly string[];
  commands: readonly string[];
  notes: readonly string[];
}

/** Operating-system-specific guidance for a local learner environment. */
export interface CourseStartHerePlatformNote {
  id: string;
  title: string;
  notes: readonly string[];
}

/** One common setup problem and a low-risk way to investigate it. */
export interface CourseStartHereTroubleshootingItem {
  problem: string;
  solution: string;
}

/** Detailed Indonesian orientation for preparing the companion repository. */
export interface CourseStartHereContent {
  title: string;
  subtitle: string;
  introduction: string;
  steps: readonly CourseStartHereStep[];
  expectedOutput: {
    title: string;
    description: string;
    lines: readonly string[];
  };
  platformNotes: readonly CourseStartHerePlatformNote[];
  troubleshooting: readonly CourseStartHereTroubleshootingItem[];
  safetyRules: readonly string[];
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
  overview: CourseOverviewContent;
  startHere: CourseStartHereContent;
  checkpoints: readonly CourseCheckpointContent[];
  capstone: CourseCapstoneContent;
}
