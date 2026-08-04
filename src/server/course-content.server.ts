/**
 * Course content loader.
 *
 * Course manifests are filesystem-backed and locale availability is explicit.
 * Unlike the existing tutorial loader, this contract intentionally has no
 * locale fallback: an unavailable course locale returns null.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG } from '@/lib/course-content.types';
import { isAllowedCourseVideoEmbedUrl } from '@/lib/course-video';
import type {
  CourseContentDocument,
  CourseManifest,
} from '@/lib/course-content.types';
import { isValidLocale } from '@/lib/i18n/settings';

export { AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG } from '@/lib/course-content.types';

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

const COURSE_CONTENT_FILES = new Map<string, ReadonlyMap<string, string>>([
  [
    AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
    new Map([
      [
        'id',
        join(
          process.cwd(),
          'content',
          'courses',
          AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
          'id',
          'content.json',
        ),
      ],
    ]),
  ],
]);

const manifestCache = new Map<string, CourseManifest>();
const contentCache = new Map<string, CourseContentDocument>();

const courseVideoOutlineSchema = z
  .object({
    status: z.enum(['planned', 'ready']),
    title: z.string().min(1),
    durationMinutes: z.number().int().positive(),
    focus: z.string().min(1),
    embedUrl: z.string().url().optional(),
  })
  .superRefine((video, context) => {
    if (video.status === 'ready' && !video.embedUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['embedUrl'],
        message: 'Ready course videos require an embedUrl',
      });
    }

    if (video.embedUrl && !isAllowedCourseVideoEmbedUrl(video.embedUrl)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['embedUrl'],
        message: 'Course video embedUrl is not an allowed YouTube embed URL',
      });
    }
  });

const courseContentUnitSchema = z.object({
  title: z.string().min(1),
  objective: z.string().min(1),
  video: courseVideoOutlineSchema,
  writtenLesson: z.string().min(1),
  aiActivity: z.object({
    goal: z.string().min(1),
    prompt: z.string().min(1),
    learnerActions: z.array(z.string().min(1)).min(1),
    expectedOutput: z.string().min(1),
  }),
  localExercise: z.object({
    repositoryPaths: z.array(z.string().min(1)).min(1),
    instructions: z.array(z.string().min(1)).min(1),
    expectedArtifacts: z.array(z.string().min(1)).min(1),
    safetyNotes: z.array(z.string().min(1)).min(1),
  }),
  evidenceChecklist: z.array(z.string().min(1)).min(1),
  reflectionPrompts: z.array(z.string().min(1)).min(1),
  completionAction: z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    requirements: z.array(z.string().min(1)).min(1),
    selfAttested: z.boolean(),
  }),
});

const courseCheckpointContentSchema = courseContentUnitSchema.extend({
  slug: z.string().min(1),
  order: z.number().int().positive(),
  reflectionId: z.string().min(1),
  completionId: z.string().min(1),
  capstoneReference: z.string().min(1).optional(),
});

const courseContentSchema = z.object({
  courseSlug: z.string().min(1),
  locale: z.enum(['en', 'id']),
  templateVersion: z.literal(1),
  overview: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    targetAudience: z.string().min(1),
    outcome: z.string().min(1),
    prerequisites: z.array(z.string().min(1)).min(1),
    startHere: z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      steps: z.array(z.string().min(1)).min(1),
    }),
    setupRequirements: z.array(z.string().min(1)).min(1),
    recommendedSequence: z.string().min(1),
  }),
  startHere: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    introduction: z.string().min(1),
    steps: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1),
          purpose: z.string().min(1),
          instructions: z.array(z.string().min(1)).min(1),
          commands: z.array(z.string()),
          notes: z.array(z.string().min(1)),
        }),
      )
      .min(1),
    expectedOutput: z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      lines: z.array(z.string().min(1)).min(1),
    }),
    platformNotes: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1),
          notes: z.array(z.string().min(1)).min(1),
        }),
      )
      .min(1),
    troubleshooting: z
      .array(
        z.object({
          problem: z.string().min(1),
          solution: z.string().min(1),
        }),
      )
      .min(1),
    safetyRules: z.array(z.string().min(1)).min(1),
  }),
  checkpoints: z.array(courseCheckpointContentSchema).min(1),
  capstone: courseContentUnitSchema.extend({
    id: z.string().min(1),
    reflectionId: z.string().min(1),
    requirements: z.array(z.string().min(1)).min(1),
  }),
});

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

function validateCourseContent(
  rawContent: unknown,
  manifest: CourseManifest,
): CourseContentDocument | null {
  const parsedContent = courseContentSchema.safeParse(rawContent);
  if (!parsedContent.success) return null;

  const content = parsedContent.data;
  if (content.courseSlug !== manifest.slug) return null;
  if (!manifest.availableLocales.includes(content.locale)) return null;
  if (content.checkpoints.length !== manifest.checkpoints.length) return null;

  const manifestBySlug = new Map(
    manifest.checkpoints.map((checkpoint) => [checkpoint.slug, checkpoint]),
  );
  const seenSlugs = new Set<string>();

  for (const checkpoint of content.checkpoints) {
    const manifestCheckpoint = manifestBySlug.get(checkpoint.slug);
    if (!manifestCheckpoint || seenSlugs.has(checkpoint.slug)) return null;
    if (checkpoint.order !== manifestCheckpoint.order) return null;
    if (checkpoint.reflectionId !== manifestCheckpoint.reflectionId) {
      return null;
    }
    if (checkpoint.completionId !== manifestCheckpoint.completionId) {
      return null;
    }
    seenSlugs.add(checkpoint.slug);
  }

  if (seenSlugs.size !== manifest.checkpoints.length) return null;
  if (content.capstone.id !== manifest.capstone.id) return null;

  const finalCheckpoint = content.checkpoints.find(
    (checkpoint) => checkpoint.order === manifest.checkpoints.length,
  );
  if (finalCheckpoint?.capstoneReference !== content.capstone.id) return null;

  return content;
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

/**
 * Get localized course content only when the locale has an explicit content
 * file. The loader intentionally does not fall back to another locale.
 */
export async function getCourseContent(
  courseSlug: string,
  locale: string,
): Promise<CourseContentDocument | null> {
  const manifest = await getCourseManifest(courseSlug, locale);
  if (!manifest) return null;

  const contentPath = COURSE_CONTENT_FILES.get(courseSlug)?.get(locale);
  if (!contentPath) return null;

  const cacheKey = `${courseSlug}:${locale}`;
  const cachedContent = contentCache.get(cacheKey);
  if (cachedContent) return cachedContent;

  try {
    // The path comes from the fixed locale map above, not user input.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const content = await readFile(contentPath, 'utf-8');
    const validatedContent = validateCourseContent(
      JSON.parse(content) as unknown,
      manifest,
    );
    if (!validatedContent) return null;

    contentCache.set(cacheKey, validatedContent);
    return validatedContent;
  } catch (error) {
    console.error(
      `[CourseContent] Failed to load course content: ${courseSlug}/${locale}`,
      error,
    );
    return null;
  }
}

/** Clear cached course manifests for tests and development reloads. */
export function clearCourseManifestCache(): void {
  manifestCache.clear();
  contentCache.clear();
}
