import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG } from '@/lib/course-content.types';
import { isCourseStarterResourcePath } from '@/lib/course-resources';
import { authMiddleware } from './auth.mw';

const STARTER_REPOSITORY_ROOT = join(
  process.cwd(),
  'starter-repository',
  'ai-assisted-qa-workflow-starter',
);

export const getCourseResource = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      courseSlug: z.literal(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG),
      locale: z.literal('id'),
      resourcePath: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    if (!isCourseStarterResourcePath(data.resourcePath)) {
      return {
        success: false as const,
        error: 'Resource file is not available for this course',
      };
    }

    const resourcePath = join(STARTER_REPOSITORY_ROOT, data.resourcePath);

    try {
      // The requested path is checked against the fixed resource allowlist.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const content = await readFile(resourcePath, 'utf-8');

      return {
        success: true as const,
        data: {
          path: data.resourcePath,
          content,
        },
      };
    } catch (error) {
      console.error(
        `[CourseResource] Failed to load resource: ${data.resourcePath}`,
        error,
      );
      return {
        success: false as const,
        error: 'Resource file could not be loaded',
      };
    }
  });
