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
  getCourseCheckpointSeoMetadata,
  isSupportedCourseCheckpointParams,
  AUTOMATION_CHECKPOINT_SLUG,
  REQUIREMENTS_CHECKPOINT_SLUG,
  TEST_DESIGN_CHECKPOINT_SLUG,
  TEST_WRITING_CHECKPOINT_SLUG,
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
        TEST_DESIGN_CHECKPOINT_SLUG,
      ),
    ).toBe(true);
    expect(
      isSupportedCourseCheckpointParams(
        'id',
        AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
        TEST_WRITING_CHECKPOINT_SLUG,
      ),
    ).toBe(true);
    expect(
      isSupportedCourseCheckpointParams(
        'id',
        AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
        AUTOMATION_CHECKPOINT_SLUG,
      ),
    ).toBe(true);
    expect(
      isSupportedCourseCheckpointParams(
        'id',
        'other-course',
        REQUIREMENTS_CHECKPOINT_SLUG,
      ),
    ).toBe(false);
  });

  it('provides checkpoint-specific SEO metadata', () => {
    expect(
      getCourseCheckpointSeoMetadata(TEST_WRITING_CHECKPOINT_SLUG),
    ).toEqual({
      title: 'Checkpoint 3: Test Writing | TestingWithEkki',
      description:
        'Ubah skenario prioritas menjadi test case yang jelas, dapat diamati, dan memiliki kandidat otomasi.',
    });
    expect(
      getCourseCheckpointSeoMetadata(AUTOMATION_CHECKPOINT_SLUG),
    ).toEqual({
      title: 'Checkpoint 4: Playwright Automation | TestingWithEkki',
      description:
        'Implementasikan test case terpilih dengan Playwright dan TypeScript menggunakan locator, assertion, dan struktur test yang maintainable.',
    });
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

    const completeButton = screen.getByTestId('course-checkpoint-complete');
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

describe('AI-assisted QA test-writing checkpoint', () => {
  let course: CourseCheckpointData;

  beforeAll(async () => {
    const [manifest, content] = await Promise.all([
      getCourseManifest(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG, 'id'),
      getCourseContent(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG, 'id'),
    ]);

    if (!manifest || !content) {
      throw new Error('Expected Indonesian test-writing checkpoint content');
    }

    const checkpoint = content.checkpoints.find(
      (candidate) => candidate.slug === TEST_WRITING_CHECKPOINT_SLUG,
    );

    if (!checkpoint) {
      throw new Error('Expected the test-writing checkpoint');
    }

    course = {
      manifest,
      content,
      checkpoint,
      completed: false,
    };
  });

  afterEach(cleanup);

  it('renders the typed lesson, AI activity, exercise, evidence, reflection, and next checkpoint', () => {
    render(<CourseCheckpointPage course={course} locale="id" />);

    expect(
      screen.getByTestId('course-checkpoint-03-test-writing'),
    ).toBeTruthy();
    expect(
      screen.getByTestId('course-checkpoint-objective').textContent,
    ).toContain(course.checkpoint.objective);
    expect(
      screen.getByTestId('course-checkpoint-written-lesson').textContent,
    ).toContain('Pisahkan langkah setup');
    expect(
      screen.getByTestId('course-checkpoint-ai-activity').textContent,
    ).toContain(course.checkpoint.aiActivity.prompt);
    expect(
      screen.getByTestId('course-checkpoint-local-exercise').textContent,
    ).toContain('automation-map.md');
    expect(
      screen.getByTestId('course-checkpoint-evidence').textContent,
    ).toContain(course.checkpoint.evidenceChecklist[0]);
    expect(
      screen.getByTestId('course-checkpoint-reflection').textContent,
    ).toContain(course.checkpoint.reflectionPrompts[0]);
    expect(
      screen.getByTestId('course-checkpoint-completion').textContent,
    ).toContain(course.checkpoint.completionAction.requirements[0]);
    expect(
      screen.getByTestId('course-checkpoint-video').querySelector('iframe'),
    ).toBeNull();
    expect(
      screen.getByTestId('course-checkpoint-next-link').getAttribute('href'),
    ).toBe(`/id/courses/${course.manifest.slug}/checkpoints/04-automation`);
  });

  it('requires both generic self-attestation confirmations for checkpoint completion', () => {
    render(<CourseCheckpointPage course={course} locale="id" />);

    const completeButton = screen.getByTestId('course-checkpoint-complete');
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
    expect(completeButton.disabled).toBe(false);
  });
});

describe('AI-assisted QA Playwright automation checkpoint', () => {
  let course: CourseCheckpointData;

  beforeAll(async () => {
    const [manifest, content] = await Promise.all([
      getCourseManifest(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG, 'id'),
      getCourseContent(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG, 'id'),
    ]);

    if (!manifest || !content) {
      throw new Error('Expected Indonesian automation checkpoint content');
    }

    const checkpoint = content.checkpoints.find(
      (candidate) => candidate.slug === AUTOMATION_CHECKPOINT_SLUG,
    );

    if (!checkpoint) {
      throw new Error('Expected the automation checkpoint');
    }

    course = {
      manifest,
      content,
      checkpoint,
      completed: false,
    };
  });

  afterEach(cleanup);

  it('renders the typed automation lesson and links to checkpoint 5', () => {
    render(<CourseCheckpointPage course={course} locale="id" />);

    expect(screen.getByTestId('course-checkpoint-04-automation')).toBeTruthy();
    expect(
      screen.getByTestId('course-checkpoint-written-lesson').textContent,
    ).toMatch(/Playwright \+ TypeScript|maintainable/i);
    expect(
      screen.getByTestId('course-checkpoint-ai-activity').textContent,
    ).toContain(course.checkpoint.aiActivity.prompt);
    expect(
      screen.getByTestId('course-checkpoint-local-exercise').textContent,
    ).toContain('tests/scheduling.spec.ts');
    expect(
      screen.getByTestId('course-checkpoint-evidence').textContent,
    ).toContain(course.checkpoint.evidenceChecklist[0]);
    expect(
      screen.getByTestId('course-checkpoint-reflection').textContent,
    ).toContain(course.checkpoint.reflectionPrompts[0]);
    expect(
      screen.getByTestId('course-checkpoint-completion').textContent,
    ).toContain(course.checkpoint.completionAction.requirements[0]);
    expect(
      screen.getByTestId('course-checkpoint-video').querySelector('iframe'),
    ).toBeNull();
    expect(
      screen.getByTestId('course-checkpoint-next-link').getAttribute('href'),
    ).toBe(`/id/courses/${course.manifest.slug}/checkpoints/05-execution`);
  });

  it('keeps completion self-attested and gated by exercise and reflection confirmations', () => {
    render(<CourseCheckpointPage course={course} locale="id" />);

    const completeButton = screen.getByTestId('course-checkpoint-complete');
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
    expect(completeButton.disabled).toBe(false);
  });
});

describe('automation checkpoint content contract', () => {
  it('covers Playwright fundamentals, maintainable checks, and local evidence', async () => {
    const content = await getCourseContent(
      AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      'id',
    );
    const checkpoint = content?.checkpoints.find(
      (candidate) => candidate.slug === AUTOMATION_CHECKPOINT_SLUG,
    );

    expect(checkpoint).toBeTruthy();
    expect(checkpoint?.order).toBe(4);
    expect(checkpoint?.writtenLesson).toMatch(
      /Playwright \+ TypeScript|locator|assertion|maintainable/i,
    );
    expect(checkpoint?.aiActivity.prompt).toMatch(
      /Playwright \+ TypeScript|locator|assertion/i,
    );
    expect(checkpoint?.aiActivity.prompt).not.toMatch(
      /ChatGPT|Claude|Copilot/i,
    );
    expect(checkpoint?.localExercise.repositoryPaths).toEqual([
      '04-automation',
      'tests/',
    ]);
    expect(checkpoint?.localExercise.expectedArtifacts).toEqual([
      'tests/scheduling.spec.ts',
      'automation-decision-log.md',
    ]);
    expect(checkpoint?.localExercise.instructions.join(' ')).toMatch(
      /companion repository|Playwright/i,
    );
    expect(checkpoint?.evidenceChecklist.join(' ')).toMatch(
      /ditelusuri|dijalankan ulang/i,
    );
    expect(checkpoint?.reflectionPrompts.length).toBeGreaterThan(0);
    expect(checkpoint?.completionAction).toMatchObject({
      id: 'ai-assisted-qa-workflow.checkpoints.04-automation.completion',
      selfAttested: true,
    });
  });
});

describe('test-writing checkpoint content contract', () => {
  it('turns prioritized scenarios into observable test cases and automation candidates', async () => {
    const content = await getCourseContent(
      AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      'id',
    );
    const checkpoint = content?.checkpoints.find(
      (candidate) => candidate.slug === TEST_WRITING_CHECKPOINT_SLUG,
    );

    expect(checkpoint).toBeTruthy();
    expect(checkpoint?.order).toBe(3);
    expect(checkpoint?.writtenLesson).toContain('expected result');
    expect(checkpoint?.aiActivity.goal).toMatch(/test case/i);
    expect(checkpoint?.aiActivity.expectedOutput).toMatch(/automation map/i);
    expect(checkpoint?.aiActivity.prompt).not.toMatch(
      /ChatGPT|Claude|Copilot/i,
    );
    expect(checkpoint?.localExercise.repositoryPaths).toEqual([
      '03-test-writing',
      'docs/test-cases/',
    ]);
    expect(checkpoint?.localExercise.expectedArtifacts).toEqual([
      'test-cases.md',
      'automation-map.md',
    ]);
    expect(checkpoint?.localExercise.instructions.join(' ')).toMatch(
      /kandidat otomasi/i,
    );
    expect(checkpoint?.evidenceChecklist.join(' ')).toMatch(
      /observable|diamati/i,
    );
    expect(checkpoint?.reflectionPrompts.length).toBeGreaterThan(0);
    expect(checkpoint?.completionAction).toMatchObject({
      id: 'ai-assisted-qa-workflow.checkpoints.03-test-writing.completion',
      selfAttested: true,
    });
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

describe('AI-assisted QA test-design checkpoint', () => {
  let course: CourseCheckpointData;

  beforeAll(async () => {
    const [manifest, content] = await Promise.all([
      getCourseManifest(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG, 'id'),
      getCourseContent(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG, 'id'),
    ]);

    if (!manifest || !content) {
      throw new Error('Expected Indonesian test-design checkpoint content');
    }

    const checkpoint = content.checkpoints.find(
      (candidate) => candidate.slug === TEST_DESIGN_CHECKPOINT_SLUG,
    );

    if (!checkpoint) {
      throw new Error('Expected the test-design checkpoint');
    }

    course = {
      manifest,
      content,
      checkpoint,
      completed: false,
    };
  });

  afterEach(cleanup);

  it('renders the typed lesson, AI activity, exercise, evidence, reflection, and completion flow', () => {
    render(<CourseCheckpointPage course={course} locale="id" />);

    expect(screen.getByTestId('course-checkpoint-02-test-design')).toBeTruthy();
    expect(
      screen.getByTestId('course-checkpoint-objective').textContent,
    ).toContain(course.checkpoint.objective);
    expect(
      screen.getByTestId('course-checkpoint-written-lesson').textContent,
    ).toContain('AI boleh membantu memperluas ruang kemungkinan');
    expect(
      screen.getByTestId('course-checkpoint-ai-activity').textContent,
    ).toContain(course.checkpoint.aiActivity.prompt);
    expect(
      screen.getByTestId('course-checkpoint-local-exercise').textContent,
    ).toContain('docs/test-cases/');
    expect(
      screen.getByTestId('course-checkpoint-evidence').textContent,
    ).toContain(course.checkpoint.evidenceChecklist[0]);
    expect(
      screen.getByTestId('course-checkpoint-reflection').textContent,
    ).toContain(course.checkpoint.reflectionPrompts[0]);
    expect(
      screen.getByTestId('course-checkpoint-completion').textContent,
    ).toContain(course.checkpoint.completionAction.requirements[0]);
    expect(
      screen.getByTestId('course-checkpoint-video').querySelector('iframe'),
    ).toBeNull();
    expect(
      screen.getByTestId('course-checkpoint-next-link').getAttribute('href'),
    ).toBe(`/id/courses/${course.manifest.slug}/checkpoints/03-test-writing`);
  });

  it('keeps test-design activity portable, evidence-based, and self-attested', () => {
    expect(course.checkpoint.video.status).toBe('planned');
    expect(course.checkpoint.aiActivity.learnerActions).toHaveLength(4);
    expect(course.checkpoint.aiActivity.prompt).not.toMatch(
      /ChatGPT|Claude|Copilot/i,
    );
    expect(course.checkpoint.localExercise.repositoryPaths).toEqual([
      '02-test-design',
      'docs/test-cases/',
    ]);
    expect(course.checkpoint.localExercise.expectedArtifacts).toEqual([
      'test-strategy.md',
      'prioritized-scenarios.md',
      'ai-critique.md',
    ]);
    expect(course.checkpoint.evidenceChecklist.length).toBeGreaterThan(0);
    expect(course.checkpoint.reflectionPrompts.length).toBeGreaterThan(0);
    expect(course.checkpoint.completionAction).toMatchObject({
      id: 'ai-assisted-qa-workflow.checkpoints.02-test-design.completion',
      selfAttested: true,
    });
  });
});
