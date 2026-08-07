import { beforeAll, describe, expect, it } from 'bun:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
  getCourseContent,
} from '@/server/course-content.server';
import {
  COURSE_STARTER_RESOURCE_PATHS,
  isCourseStarterResourcePath,
  resolveCourseStarterResourcePath,
} from '@/lib/course-resources';

describe('AI-assisted QA companion Markdown resources', () => {
  let content: Awaited<ReturnType<typeof getCourseContent>>;

  beforeAll(async () => {
    content = await getCourseContent(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG, 'id');
  });

  it('keeps the resource allowlist limited to existing Markdown references', () => {
    const starterRepositoryRoot = join(
      process.cwd(),
      'starter-repository',
      'ai-assisted-qa-workflow-starter',
    );

    expect(COURSE_STARTER_RESOURCE_PATHS.length).toBeGreaterThan(0);
    for (const resourcePath of COURSE_STARTER_RESOURCE_PATHS) {
      expect(existsSync(join(starterRepositoryRoot, resourcePath))).toBe(true);
    }
    expect(
      isCourseStarterResourcePath('docs/requirements/requirements-notes.md'),
    ).toBe(true);
    expect(isCourseStarterResourcePath('node_modules/package.json')).toBe(
      false,
    );
  });

  it('resolves every authored Markdown reference to a companion file', () => {
    if (!content) throw new Error('Expected Indonesian course content');

    const units = [...content.checkpoints, content.capstone];
    const references = units.flatMap((unit) => [
      ...unit.localExercise.repositoryPaths,
      ...unit.localExercise.instructions,
      ...unit.localExercise.expectedArtifacts,
    ]);
    const markdownReferences = references.filter((reference) =>
      /[A-Za-z0-9][A-Za-z0-9_./-]*\.md\b/i.test(reference),
    );

    expect(markdownReferences.length).toBeGreaterThan(0);
    for (const reference of markdownReferences) {
      const unit = units.find((candidate) =>
        [
          ...candidate.localExercise.repositoryPaths,
          ...candidate.localExercise.instructions,
          ...candidate.localExercise.expectedArtifacts,
        ].includes(reference),
      );
      if (!unit) throw new Error(`Missing unit for ${reference}`);
      const unitSlug = 'slug' in unit ? unit.slug : unit.id;

      expect(
        resolveCourseStarterResourcePath(unitSlug, reference),
      ).not.toBeNull();
    }
  });
});
