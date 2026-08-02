import { afterEach, beforeAll, describe, expect, it } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import { CourseStartHerePage } from '@/components/courses/course-start-here-page';
import {
  AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
  getCourseContent,
  getCourseManifest,
} from '@/server/course-content.server';
import {
  COURSE_START_HERE_ROUTE,
  isSupportedCourseStartHereParams,
} from '@/routes/$locale/_authenticated/courses/$courseSlug/start-here';
import type { CourseStartHereData } from '@/components/courses/course-start-here-page';

describe('AI-assisted QA Start Here orientation', () => {
  let course: CourseStartHereData;

  beforeAll(async () => {
    const [manifest, content] = await Promise.all([
      getCourseManifest(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG, 'id'),
      getCourseContent(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG, 'id'),
    ]);

    if (!manifest || !content) {
      throw new Error('Expected Indonesian Start Here course content');
    }

    course = { manifest, content };
  });

  afterEach(cleanup);

  it('uses the authenticated course route and Indonesian-only support', () => {
    expect(COURSE_START_HERE_ROUTE).toBe(
      '/$locale/_authenticated/courses/$courseSlug/start-here',
    );
    expect(
      isSupportedCourseStartHereParams(
        'id',
        AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      ),
    ).toBe(true);
    expect(
      isSupportedCourseStartHereParams(
        'en',
        AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      ),
    ).toBe(false);
    expect(isSupportedCourseStartHereParams('id', 'other-course')).toBe(false);
  });

  it('renders the complete local-first setup workflow and safety guidance', () => {
    render(<CourseStartHerePage course={course} locale="id" />);

    expect(screen.getByTestId('course-start-here')).toBeTruthy();
    expect(screen.getAllByTestId(/^course-start-here-step-/)).toHaveLength(7);
    expect(
      screen.getByTestId('course-start-here-step-node-and-npm').textContent,
    ).toContain('node --version');
    expect(
      screen.getByTestId('course-start-here-step-install-dependencies')
        .textContent,
    ).toContain('npm install');
    expect(
      screen.getByTestId('course-start-here-step-install-playwright-browsers')
        .textContent,
    ).toContain('npx playwright install');
    expect(
      screen.getByTestId('course-start-here-step-configure-target').textContent,
    ).toContain('TARGET_BASE_URL=https://<target-yang-disetujui>');
    expect(
      screen.getByTestId('course-start-here-step-run-smoke-test').textContent,
    ).toContain('npm run test:smoke');
    expect(
      screen.getByTestId('course-start-here-expected-output').textContent,
    ).toContain('1 passed');
    expect(
      screen.getByTestId('course-start-here-platform-windows'),
    ).toBeTruthy();
    expect(screen.getByTestId('course-start-here-platform-macos')).toBeTruthy();
    expect(screen.getByTestId('course-start-here-platform-linux')).toBeTruthy();
    expect(
      screen.getByTestId('course-start-here-troubleshooting'),
    ).toBeTruthy();
    expect(screen.getByTestId('course-start-here-safety')).toBeTruthy();
    expect(screen.getByTestId('course-start-here-safety').textContent).toMatch(
      /data sintetis/i,
    );
    expect(screen.getByTestId('course-start-here-safety').textContent).toMatch(
      /jangan melakukan scraping/i,
    );
  });
});
