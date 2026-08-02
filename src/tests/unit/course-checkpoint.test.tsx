import { afterEach, beforeAll, describe, expect, it } from 'bun:test';
import { fireEvent, cleanup, render, screen } from '@testing-library/react';
import { CourseCheckpointPage } from '@/components/courses/course-checkpoint-page';
import {
  AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
  getCourseContent,
  getCourseManifest,
} from '@/server/course-content.server';
import {
  COURSE_CHECKPOINT_ROUTE,
  isSupportedCourseCheckpointParams,
  REQUIREMENTS_CHECKPOINT_SLUG,
} from '@/routes/$locale/_authenticated/courses/$courseSlug/checkpoints/$checkpointSlug';
import type { CourseCheckpointData } from '@/components/courses/course-checkpoint-page';

describe('AI-assisted QA requirements checkpoint', () => {
  let course: CourseCheckpointData;

  beforeAll(async () => {
    const [manifest, content] = await Promise.all([
      getCourseManifest(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG, 'id'),
      getCourseContent(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG, 'id'),
    ]);

    if (!manifest || !content) {
      throw new Error('Expected Indonesian requirements checkpoint content');
    }

    const checkpoint = content.checkpoints.find(
      (candidate) => candidate.slug === REQUIREMENTS_CHECKPOINT_SLUG,
    );

    if (!checkpoint) {
      throw new Error('Expected the requirements checkpoint');
    }

    course = {
      manifest,
      content,
      checkpoint,
      completed: false,
    };
  });

  afterEach(cleanup);

  it('uses the authenticated route and accepts only the stable Indonesian checkpoint', () => {
    expect(COURSE_CHECKPOINT_ROUTE).toBe(
      '/$locale/_authenticated/courses/$courseSlug/checkpoints/$checkpointSlug',
    );
    expect(COURSE_CHECKPOINT_ROUTE).toContain('/_authenticated/');
    expect(
      isSupportedCourseCheckpointParams(
        'id',
        AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
        REQUIREMENTS_CHECKPOINT_SLUG,
      ),
    ).toBe(true);
    expect(
      isSupportedCourseCheckpointParams(
        'en',
        AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
        REQUIREMENTS_CHECKPOINT_SLUG,
      ),
    ).toBe(false);
    expect(
      isSupportedCourseCheckpointParams(
        'id',
        AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
        '02-test-design',
      ),
    ).toBe(false);
    expect(
      isSupportedCourseCheckpointParams(
        'id',
        'other-course',
        REQUIREMENTS_CHECKPOINT_SLUG,
      ),
    ).toBe(false);
  });

  it('renders the typed checkpoint lesson, local exercise, evidence, reflection, and planned video state', () => {
    render(<CourseCheckpointPage course={course} locale="id" />);

    expect(
      screen.getByTestId('course-checkpoint-01-requirements'),
    ).toBeTruthy();
    expect(
      screen.getByTestId('course-checkpoint-objective').textContent,
    ).toContain(course.checkpoint.objective);
    expect(screen.getByTestId('course-checkpoint-video').textContent).toContain(
      course.checkpoint.video.title,
    );
    expect(screen.getByTestId('course-checkpoint-video').textContent).toContain(
      'checkpoint.videoPlanned',
    );
    expect(
      screen.getByTestId('course-checkpoint-video').querySelector('iframe'),
    ).toBeNull();
    expect(
      screen.getByTestId('course-checkpoint-written-lesson').textContent,
    ).toContain('Baca PRD fiktif');
    expect(
      screen.getByTestId('course-checkpoint-ai-activity').textContent,
    ).toContain(course.checkpoint.aiActivity.prompt);
    expect(
      screen.getByTestId('course-checkpoint-local-exercise').textContent,
    ).toContain('docs/requirements/');
    expect(
      screen.getByTestId('course-checkpoint-evidence').textContent,
    ).toContain(course.checkpoint.evidenceChecklist[0]);
    const reflectionSection = screen.getByTestId(
      'course-checkpoint-reflection',
    );
    const completionSection = screen.getByTestId(
      'course-checkpoint-completion',
    );
    expect(reflectionSection.textContent).toContain(
      course.checkpoint.reflectionPrompts[0],
    );
    expect(
      reflectionSection.compareDocumentPosition(completionSection) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      screen.getByTestId('course-checkpoint-next-link').getAttribute('href'),
    ).toBe(`/id/courses/${course.manifest.slug}/checkpoints/02-test-design`);
  });

  it('requires both self-attestation confirmations before submitting completion', () => {
    render(<CourseCheckpointPage course={course} locale="id" />);

    const completeButton = screen.getByTestId(
      'course-checkpoint-complete',
    );
    const exerciseConfirmation = screen.getByTestId(
      'course-checkpoint-exercise-confirmation',
    );
    const reflectionConfirmation = screen.getByTestId(
      'course-checkpoint-reflection-confirmation',
    );

    expect(completeButton.disabled).toBe(true);

    fireEvent.click(exerciseConfirmation);
    expect(completeButton.disabled).toBe(true);

    fireEvent.click(reflectionConfirmation);
    expect(exerciseConfirmation.checked).toBe(true);
    expect(reflectionConfirmation.checked).toBe(true);
    expect(completeButton.disabled).toBe(false);
  });

  it('renders a completed state from existing course progress', () => {
    render(
      <CourseCheckpointPage
        course={{ ...course, completed: true }}
        locale="id"
      />,
    );

    expect(screen.getByTestId('course-checkpoint-completed')).toBeTruthy();
    expect(screen.queryByTestId('course-checkpoint-complete')).toBeNull();
  });
});

describe('requirements checkpoint content contract', () => {
  it('keeps the starter-repository guidance tool-agnostic and path-based', async () => {
    const content = await getCourseContent(
      AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      'id',
    );
    const checkpoint = content?.checkpoints.find(
      (candidate) => candidate.slug === REQUIREMENTS_CHECKPOINT_SLUG,
    );

    expect(checkpoint).toBeTruthy();
    expect(checkpoint?.localExercise.repositoryPaths).toEqual([
      '01-requirements',
      'docs/requirements/',
    ]);
    expect(checkpoint?.localExercise.instructions.join(' ')).toMatch(
      /PRD.*acceptance criteria/i,
    );
    expect(checkpoint?.aiActivity.prompt).not.toMatch(
      /ChatGPT|Claude|Copilot/i,
    );
    expect(checkpoint?.video.status).toBe('planned');
    expect(checkpoint?.completionAction.selfAttested).toBe(true);
    expect(checkpoint?.completionAction.id).toBe(
      'ai-assisted-qa-workflow.checkpoints.01-requirements.completion',
    );
  });
});
