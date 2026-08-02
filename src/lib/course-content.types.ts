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
