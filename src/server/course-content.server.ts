/**
 * Course content loader.
 *
 * Course manifests are filesystem-backed and locale availability is explicit.
 * Unlike the existing tutorial loader, this contract intentionally has no
 * locale fallback: an unavailable course locale returns null.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CourseManifest } from '@/lib/course-content.types';
import { isValidLocale } from '@/lib/i18n/settings';

export const AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG =
  'ai-assisted-qa-workflow' as const;

const COURSE_MANIFEST_FILES = new Map<string, string>([
  [
    AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
    join(
      process.cwd(),
      'content',
      'courses',
      AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      'manifest.json',
    ),
  ],
]);

const manifestCache = new Map<string, CourseManifest>();

async function loadCourseManifest(
  courseSlug: string,
): Promise<CourseManifest | null> {
  const cachedManifest = manifestCache.get(courseSlug);
  if (cachedManifest) return cachedManifest;

  const manifestPath = COURSE_MANIFEST_FILES.get(courseSlug);
  if (!manifestPath) return null;

  try {
    // The path comes from the fixed manifest map above, not user input.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const content = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(content) as CourseManifest;
    manifestCache.set(courseSlug, manifest);
    return manifest;
  } catch (error) {
    console.error(
      `[CourseContent] Failed to load course manifest: ${courseSlug}`,
      error,
    );
    return null;
  }
}

/**
 * Get a course manifest only when the requested locale is explicitly
 * available. In particular, `en` does not fall back to Indonesian content.
 */
export async function getCourseManifest(
  courseSlug: string,
  locale: string,
): Promise<CourseManifest | null> {
  if (!isValidLocale(locale)) return null;

  const manifest = await loadCourseManifest(courseSlug);
  if (!manifest || !manifest.availableLocales.includes(locale)) return null;

  return manifest;
}

/** Clear cached course manifests for tests and development reloads. */
export function clearCourseManifestCache(): void {
  manifestCache.clear();
}
