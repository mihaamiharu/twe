import { afterEach, beforeAll, describe, expect, it } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import { CourseOverviewPage } from '@/components/courses/course-overview-page';
import {
  AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
  getCourseContent,
  getCourseManifest,
} from '@/server/course-content.server';
import {
  COURSE_OVERVIEW_ROUTE,
  isSupportedCourseOverviewParams,
} from '@/routes/$locale/_authenticated/courses/$courseSlug';
import type { CourseOverviewData } from '@/components/courses/course-overview-page';

describe('AI-assisted QA course overview', () => {
  let course: CourseOverviewData;

  beforeAll(async () => {
    const [manifest, content] = await Promise.all([
      getCourseManifest(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG, 'id'),
      getCourseContent(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG, 'id'),
    ]);

    if (!manifest || !content) {
      throw new Error('Expected Indonesian course overview content');
    }

    course = {
      manifest,
      content,
      completedCheckpointSlugs: ['01-requirements'],
      capstoneCompleted: false,
    };
  });

  afterEach(cleanup);

  it('is mounted below the authenticated locale layout', () => {
    expect(COURSE_OVERVIEW_ROUTE).toBe(
      '/$locale/_authenticated/courses/$courseSlug',
    );
    expect(COURSE_OVERVIEW_ROUTE).toContain('/_authenticated/');
  });

  it('accepts only the Indonesian course slug without fallback content', () => {
    expect(
      isSupportedCourseOverviewParams(
        'id',
        AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      ),
    ).toBe(true);
    expect(
      isSupportedCourseOverviewParams(
        'en',
        AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      ),
    ).toBe(false);
    expect(isSupportedCourseOverviewParams('id', 'other-course')).toBe(false);
  });

  it('renders the localized overview requirements and all checkpoint links in order', () => {
    render(<CourseOverviewPage course={course} locale="id" />);

    expect(screen.getByTestId('course-overview')).toBeTruthy();
    expect(
      screen.getByText(course.content.overview.targetAudience),
    ).toBeTruthy();
    expect(screen.getAllByText(course.content.overview.outcome)).toHaveLength(
      2,
    );
    expect(
      screen.getByText(course.content.overview.startHere.title),
    ).toBeTruthy();
    expect(
      screen.getByTestId('course-start-here-link').getAttribute('href'),
    ).toBe(`/id/courses/${course.manifest.slug}/start-here`);
    expect(
      screen.getByText(course.content.overview.setupRequirements[0]),
    ).toBeTruthy();
    expect(screen.getByTestId('course-capstone')).toBeTruthy();

    const links = screen.getAllByTestId(/^course-checkpoint-link-/);
    expect(links).toHaveLength(7);

    for (const [index, checkpoint] of course.manifest.checkpoints.entries()) {
      const link = links.at(index);
      expect(link?.getAttribute('href')).toBe(
        `/id/courses/${course.manifest.slug}/checkpoints/${checkpoint.slug}`,
      );
    }
  });

  it('shows completed and incomplete checkpoint state from existing progress data', () => {
    render(<CourseOverviewPage course={course} locale="id" />);

    expect(
      screen
        .getByTestId('course-checkpoint-01-requirements')
        .getAttribute('data-completed'),
    ).toBe('true');
    expect(
      screen
        .getByTestId('course-checkpoint-02-test-design')
        .getAttribute('data-completed'),
    ).toBe('false');
  });
});
