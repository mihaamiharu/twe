import type {
  CourseCheckpointContent,
  CourseManifest,
} from '@/lib/course-content.types';

export type CourseCheckpointNavigationItem = {
  manifestCheckpoint: CourseManifest['checkpoints'][number];
  contentCheckpoint: CourseCheckpointContent;
  href: string;
};

export type CourseCheckpointNavigation = {
  overviewHref: string;
  startHereHref: string;
  previousCheckpoint: CourseCheckpointNavigationItem | null;
  nextCheckpoint: CourseCheckpointNavigationItem | null;
};

export function getCourseOverviewHref(
  locale: 'id',
  courseSlug: string,
): string {
  return `/${locale}/courses/${courseSlug}`;
}

export function getCourseStartHereHref(
  locale: 'id',
  courseSlug: string,
): string {
  return `${getCourseOverviewHref(locale, courseSlug)}/start-here`;
}

export function getCourseCheckpointHref(
  locale: 'id',
  courseSlug: string,
  checkpointSlug: string,
): string {
  return `${getCourseOverviewHref(locale, courseSlug)}/checkpoints/${checkpointSlug}`;
}

/**
 * Resolve adjacent checkpoints from the manifest's recommended order.
 * Checkpoint pages stay freely accessible; this helper only describes links.
 */
export function getCourseCheckpointNavigation({
  manifest,
  content,
  checkpointSlug,
  locale,
}: {
  manifest: CourseManifest;
  content: { checkpoints: readonly CourseCheckpointContent[] };
  checkpointSlug: string;
  locale: 'id';
}): CourseCheckpointNavigation {
  const orderedCheckpoints = [...manifest.checkpoints].sort(
    (a, b) => a.order - b.order,
  );
  const currentIndex = orderedCheckpoints.findIndex(
    (checkpoint) => checkpoint.slug === checkpointSlug,
  );
  const contentBySlug = new Map(
    content.checkpoints.map((checkpoint) => [checkpoint.slug, checkpoint]),
  );

  const toNavigationItem = (
    manifestCheckpoint: CourseManifest['checkpoints'][number] | undefined,
  ): CourseCheckpointNavigationItem | null => {
    if (!manifestCheckpoint) return null;

    const contentCheckpoint = contentBySlug.get(manifestCheckpoint.slug);
    if (!contentCheckpoint) return null;

    return {
      manifestCheckpoint,
      contentCheckpoint,
      href: getCourseCheckpointHref(
        locale,
        manifest.slug,
        manifestCheckpoint.slug,
      ),
    };
  };

  return {
    overviewHref: getCourseOverviewHref(locale, manifest.slug),
    startHereHref: getCourseStartHereHref(locale, manifest.slug),
    previousCheckpoint:
      currentIndex > 0
        ? toNavigationItem(orderedCheckpoints[currentIndex - 1])
        : null,
    nextCheckpoint:
      currentIndex >= 0 && currentIndex < orderedCheckpoints.length - 1
        ? toNavigationItem(orderedCheckpoints[currentIndex + 1])
        : null,
  };
}
