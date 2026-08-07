import { beforeAll, describe, expect, it } from 'bun:test';
import {
  AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
  getCourseContent,
  getCourseManifest,
} from '@/server/course-content.server';
import {
  getCourseCheckpointNavigation,
  getCourseCheckpointHref,
  getCourseOverviewHref,
  getCourseResourceHref,
  getCourseStartHereHref,
} from '@/lib/course-navigation';

describe('AI-assisted QA course navigation', () => {
  let manifest: Awaited<ReturnType<typeof getCourseManifest>>;
  let content: Awaited<ReturnType<typeof getCourseContent>>;

  beforeAll(async () => {
    [manifest, content] = await Promise.all([
      getCourseManifest(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG, 'id'),
      getCourseContent(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG, 'id'),
    ]);
  });

  it('builds only Indonesian course paths for overview, Start Here, and checkpoints', () => {
    expect(
      getCourseOverviewHref('id', AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG),
    ).toBe('/id/courses/ai-assisted-qa-workflow');
    expect(
      getCourseStartHereHref('id', AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG),
    ).toBe('/id/courses/ai-assisted-qa-workflow/start-here');
    expect(
      getCourseCheckpointHref(
        'id',
        AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
        '01-requirements',
      ),
    ).toBe('/id/courses/ai-assisted-qa-workflow/checkpoints/01-requirements');
    expect(
      getCourseResourceHref(
        'id',
        AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
        'docs/requirements/requirements-notes.md',
      ),
    ).toBe(
      '/id/courses/ai-assisted-qa-workflow/resources?path=docs%2Frequirements%2Frequirements-notes.md',
    );
  });

  it('has no previous link on checkpoint 1 and recommends checkpoint 2 next', () => {
    if (!manifest || !content)
      throw new Error('Expected Indonesian course data');

    const navigation = getCourseCheckpointNavigation({
      manifest,
      content,
      checkpointSlug: '01-requirements',
      locale: 'id',
    });

    expect(navigation.previousCheckpoint).toBeNull();
    expect(navigation.nextCheckpoint?.manifestCheckpoint.slug).toBe(
      '02-test-design',
    );
    expect(navigation.nextCheckpoint?.href).toBe(
      '/id/courses/ai-assisted-qa-workflow/checkpoints/02-test-design',
    );
  });

  it('has checkpoint 6 as the previous link on checkpoint 7 and no next link', () => {
    if (!manifest || !content)
      throw new Error('Expected Indonesian course data');

    const navigation = getCourseCheckpointNavigation({
      manifest,
      content,
      checkpointSlug: '07-quality-summary',
      locale: 'id',
    });

    expect(navigation.previousCheckpoint?.manifestCheckpoint.slug).toBe(
      '06-triage',
    );
    expect(navigation.previousCheckpoint?.href).toBe(
      '/id/courses/ai-assisted-qa-workflow/checkpoints/06-triage',
    );
    expect(navigation.nextCheckpoint).toBeNull();
  });

  it('keeps every available checkpoint freely reachable in recommended order', () => {
    if (!manifest || !content)
      throw new Error('Expected Indonesian course data');

    const orderedSlugs = [...manifest.checkpoints]
      .sort((a, b) => a.order - b.order)
      .map((checkpoint) => checkpoint.slug);

    for (const slug of orderedSlugs) {
      const navigation = getCourseCheckpointNavigation({
        manifest,
        content,
        checkpointSlug: slug,
        locale: 'id',
      });

      expect(navigation.overviewHref).toBe(
        '/id/courses/ai-assisted-qa-workflow',
      );
      expect(navigation.startHereHref).toBe(
        '/id/courses/ai-assisted-qa-workflow/start-here',
      );
    }
  });
});
