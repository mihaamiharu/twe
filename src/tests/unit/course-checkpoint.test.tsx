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
  EXECUTION_CHECKPOINT_SLUG,
  QUALITY_SUMMARY_CHECKPOINT_SLUG,
  REQUIREMENTS_CHECKPOINT_SLUG,
  TRIAGE_CHECKPOINT_SLUG,
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
        AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
        EXECUTION_CHECKPOINT_SLUG,
      ),
    ).toBe(true);
    expect(
      isSupportedCourseCheckpointParams(
        'id',
        AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
        TRIAGE_CHECKPOINT_SLUG,
      ),
    ).toBe(true);
    expect(
      isSupportedCourseCheckpointParams(
        'id',
        AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
        QUALITY_SUMMARY_CHECKPOINT_SLUG,
      ),
    ).toBe(true);
    expect(
      isSupportedCourseCheckpointParams(
        'en',
        AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
        QUALITY_SUMMARY_CHECKPOINT_SLUG,
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

  it('provides checkpoint-specific SEO metadata', () => {
    expect(
      getCourseCheckpointSeoMetadata(TEST_WRITING_CHECKPOINT_SLUG),
    ).toEqual({
      title: 'Checkpoint 3: Test Writing | TestingWithEkki',
      description:
        'Ubah skenario prioritas menjadi test case yang jelas, dapat diamati, dan memiliki kandidat otomasi.',
    });
    expect(getCourseCheckpointSeoMetadata(AUTOMATION_CHECKPOINT_SLUG)).toEqual({
      title: 'Checkpoint 4: Playwright Automation | TestingWithEkki',
      description:
        'Implementasikan test case terpilih dengan Playwright dan TypeScript menggunakan locator, assertion, dan struktur test yang maintainable.',
    });
    expect(getCourseCheckpointSeoMetadata(EXECUTION_CHECKPOINT_SLUG)).toEqual({
      title: 'Checkpoint 5: Test Execution and Evidence | TestingWithEkki',
      description:
        'Jalankan test Playwright secara lokal, baca hasilnya, dan kumpulkan evidence yang relevan untuk keputusan QA.',
    });
    expect(getCourseCheckpointSeoMetadata(TRIAGE_CHECKPOINT_SLUG)).toEqual({
      title: 'Checkpoint 6: Failure Triage | TestingWithEkki',
      description:
        'Investigasi failure Playwright dengan evidence, uji hipotesis, dan klasifikasikan penyebab sebagai test, product, environment, atau data issue.',
    });
    expect(
      getCourseCheckpointSeoMetadata(QUALITY_SUMMARY_CHECKPOINT_SLUG),
    ).toEqual({
      title: 'Checkpoint 7: Quality Decision and Capstone | TestingWithEkki',
      description:
        'Rangkum area yang diuji dan belum diuji, dokumentasikan evidence, keterbatasan, serta residual risk untuk membuat rekomendasi kualitas berbasis risiko dan menyelesaikan capstone.',
    });
  });

  it('renders the typed checkpoint lesson, local exercise, evidence, reflection, and planned video state', () => {
    render(<CourseCheckpointPage course={course} locale="id" />);

    expect(
      screen.getByTestId('course-checkpoint-01-requirements'),
    ).toBeTruthy();
    expect(
      screen
        .getByTestId('course-contents-item-01-requirements')
        .getAttribute('data-current'),
    ).toBe('true');
    expect(
      screen.getByTestId('course-checkpoint-objective').textContent,
    ).toContain(course.checkpoint.objective);
    expect(screen.getByTestId('course-checkpoint-video').textContent).toContain(
      course.checkpoint.video.title,
    );
    expect(screen.getByTestId('course-checkpoint-video').textContent).toContain(
      'checkpoint.videoReady',
    );
    expect(
      screen.getByTestId('course-checkpoint-video').querySelector('iframe'),
    ).toBeTruthy();
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
      screen
        .getByRole('link', { name: 'requirements-notes.md' })
        .getAttribute('href'),
    ).toBe(
      '/id/courses/ai-assisted-qa-workflow/resources?path=docs%2Frequirements%2Frequirements-notes.md',
    );
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
    expect(screen.queryByTestId('course-checkpoint-previous-link')).toBeNull();
    expect(
      screen.getByTestId('course-checkpoint-previous-boundary'),
    ).toBeTruthy();
    expect(
      screen
        .getByTestId('course-checkpoint-overview-link')
        .getAttribute('href'),
    ).toBe(`/id/courses/${course.manifest.slug}`);
    expect(
      screen
        .getByTestId('course-checkpoint-start-here-link')
        .getAttribute('href'),
    ).toBe(`/id/courses/${course.manifest.slug}/start-here`);
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

  it('uses the existing completion list to render the current checkpoint as completed', () => {
    render(
      <CourseCheckpointPage
        course={{
          ...course,
          completed: false,
          completedCheckpointSlugs: [REQUIREMENTS_CHECKPOINT_SLUG],
        }}
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
    ).toBeTruthy();
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
    ).toBeTruthy();
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
      'docs/test-cases/',
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

describe('AI-assisted QA test execution checkpoint', () => {
  let course: CourseCheckpointData;

  beforeAll(async () => {
    const [manifest, content] = await Promise.all([
      getCourseManifest(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG, 'id'),
      getCourseContent(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG, 'id'),
    ]);

    if (!manifest || !content) {
      throw new Error('Expected Indonesian execution checkpoint content');
    }

    const checkpoint = content.checkpoints.find(
      (candidate) => candidate.slug === EXECUTION_CHECKPOINT_SLUG,
    );

    if (!checkpoint) {
      throw new Error('Expected the execution checkpoint');
    }

    course = {
      manifest,
      content,
      checkpoint,
      completed: false,
    };
  });

  afterEach(cleanup);

  it('renders execution guidance, evidence sections, and links to checkpoint 6', () => {
    render(<CourseCheckpointPage course={course} locale="id" />);

    expect(screen.getByTestId('course-checkpoint-05-execution')).toBeTruthy();
    expect(
      screen.getByTestId('course-checkpoint-objective').textContent,
    ).toContain(course.checkpoint.objective);
    expect(
      screen.getByTestId('course-checkpoint-written-lesson').textContent,
    ).toMatch(/npx playwright test|show-report|show-trace|asumsi/i);
    expect(
      screen.getByTestId('course-checkpoint-ai-activity').textContent,
    ).toContain(course.checkpoint.aiActivity.prompt);
    expect(
      screen.getByTestId('course-checkpoint-local-exercise').textContent,
    ).toMatch(/Playwright|execution-report\.md|screenshots|trace/i);
    expect(
      screen.getByTestId('course-checkpoint-evidence').textContent,
    ).toMatch(/command|environment|screenshot|trace|Limitasi/i);
    expect(
      screen.getByTestId('course-checkpoint-reflection').textContent,
    ).toContain(course.checkpoint.reflectionPrompts[0]);
    expect(
      screen.getByTestId('course-checkpoint-completion').textContent,
    ).toContain(course.checkpoint.completionAction.requirements[0]);
    expect(
      screen.getByTestId('course-checkpoint-video').querySelector('iframe'),
    ).toBeTruthy();
    expect(
      screen.getByTestId('course-checkpoint-next-link').getAttribute('href'),
    ).toBe(`/id/courses/${course.manifest.slug}/checkpoints/06-triage`);
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

describe('execution checkpoint content contract', () => {
  it('covers local Playwright execution, result analysis, and sanitized evidence', async () => {
    const content = await getCourseContent(
      AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      'id',
    );
    const checkpoint = content?.checkpoints.find(
      (candidate) => candidate.slug === EXECUTION_CHECKPOINT_SLUG,
    );

    expect(checkpoint).toBeTruthy();
    expect(checkpoint?.order).toBe(5);
    expect(checkpoint?.writtenLesson).toMatch(
      /Playwright|hasil test|screenshot|trace|report|asumsi/i,
    );
    expect(checkpoint?.aiActivity.prompt).toMatch(
      /test run|report|screenshot|trace|pass\/fail|asumsi/i,
    );
    expect(checkpoint?.aiActivity.prompt).not.toMatch(
      /ChatGPT|Claude|Copilot/i,
    );
    expect(checkpoint?.localExercise.repositoryPaths).toEqual([
      '05-execution',
      'evidence/',
      'docs/reports/',
    ]);
    expect(checkpoint?.localExercise.expectedArtifacts).toEqual([
      'execution-report.md',
      'evidence/README.md',
      'screenshots atau trace yang sudah disanitasi',
    ]);
    expect(checkpoint?.localExercise.instructions.join(' ')).toMatch(
      /Playwright|output pass\/fail|observed result|asumsi/i,
    );
    expect(checkpoint?.evidenceChecklist.join(' ')).toMatch(
      /Command|environment|Pass\/fail|Screenshot|trace|Limitasi/i,
    );
    expect(checkpoint?.reflectionPrompts.length).toBeGreaterThan(0);
    expect(checkpoint?.completionAction).toMatchObject({
      id: 'ai-assisted-qa-workflow.checkpoints.05-execution.completion',
      selfAttested: true,
    });
  });
});

describe('AI-assisted QA failure triage checkpoint', () => {
  let course: CourseCheckpointData;

  beforeAll(async () => {
    const [manifest, content] = await Promise.all([
      getCourseManifest(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG, 'id'),
      getCourseContent(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG, 'id'),
    ]);

    if (!manifest || !content) {
      throw new Error('Expected Indonesian failure triage checkpoint content');
    }

    const checkpoint = content.checkpoints.find(
      (candidate) => candidate.slug === TRIAGE_CHECKPOINT_SLUG,
    );

    if (!checkpoint) {
      throw new Error('Expected the failure triage checkpoint');
    }

    course = {
      manifest,
      content,
      checkpoint,
      completed: false,
    };
  });

  afterEach(cleanup);

  it('renders evidence-first triage guidance and links to checkpoint 7', () => {
    render(<CourseCheckpointPage course={course} locale="id" />);

    expect(screen.getByTestId('course-checkpoint-06-triage')).toBeTruthy();
    expect(
      screen.getByTestId('course-checkpoint-objective').textContent,
    ).toContain(course.checkpoint.objective);
    expect(
      screen.getByTestId('course-checkpoint-written-lesson').textContent,
    ).toMatch(
      /failed Playwright|Evidence sebelum perubahan kode|empat klasifikasi/i,
    );
    expect(
      screen.getByTestId('course-checkpoint-ai-activity').textContent,
    ).toMatch(/failure packet|hipotesis|test issue|product issue/i);
    expect(
      screen.getByTestId('course-checkpoint-local-exercise').textContent,
    ).toMatch(/failure-packet|failure-analysis\.md|reproduksi|AI/i);
    expect(
      screen.getByTestId('course-checkpoint-evidence').textContent,
    ).toMatch(
      /failure packet|expected result|observed result|confidence|verifikasi/i,
    );
    expect(
      screen.getByTestId('course-checkpoint-reflection').textContent,
    ).toContain(course.checkpoint.reflectionPrompts[0]);
    expect(
      screen.getByTestId('course-checkpoint-completion').textContent,
    ).toContain(course.checkpoint.completionAction.requirements[0]);
    expect(
      screen.getByTestId('course-checkpoint-video').querySelector('iframe'),
    ).toBeTruthy();
    expect(
      screen.getByTestId('course-checkpoint-next-link').getAttribute('href'),
    ).toBe(
      `/id/courses/${course.manifest.slug}/checkpoints/07-quality-summary`,
    );
  });

  it('keeps triage completion self-attested and gated by both confirmations', () => {
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

describe('failure triage checkpoint content contract', () => {
  it('covers the failure packet, evidence-first hypotheses, four classifications, and local artifacts', async () => {
    const content = await getCourseContent(
      AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      'id',
    );
    const checkpoint = content?.checkpoints.find(
      (candidate) => candidate.slug === TRIAGE_CHECKPOINT_SLUG,
    );

    expect(checkpoint).toBeTruthy();
    expect(checkpoint?.order).toBe(6);
    expect(checkpoint?.objective).toMatch(
      /failed Playwright|evidence|hipotesis|test.*produk.*environment.*data/i,
    );
    expect(checkpoint?.writtenLesson).toMatch(
      /Evidence sebelum perubahan kode|Test issue|Product issue|Environment issue|Test-data issue|hipotesis/i,
    );
    expect(checkpoint?.aiActivity.prompt).toMatch(
      /failure packet|test issue|product issue|environment issue|test-data issue|confidence/i,
    );
    expect(checkpoint?.aiActivity.prompt).not.toMatch(
      /ChatGPT|Claude|Copilot/i,
    );
    expect(checkpoint?.localExercise.repositoryPaths).toEqual([
      '06-triage',
      'docs/reports/failure-packet.md',
      'docs/reports/',
    ]);
    expect(checkpoint?.localExercise.expectedArtifacts).toEqual([
      'failure-analysis.md',
      'triage-notes.md',
      'failure packet atau referensi packet yang digunakan',
    ]);
    expect(checkpoint?.localExercise.instructions.join(' ')).toMatch(
      /seeded|recorded|companion repository|reproduksi|AI/i,
    );
    expect(checkpoint?.evidenceChecklist.join(' ')).toMatch(
      /expected result|observed result|fakta|hipotesis|confidence|verifikasi/i,
    );
    expect(checkpoint?.reflectionPrompts.length).toBeGreaterThanOrEqual(3);
    expect(checkpoint?.completionAction).toMatchObject({
      id: 'ai-assisted-qa-workflow.checkpoints.06-triage.completion',
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
    expect(checkpoint?.video.status).toBe('ready');
    expect(checkpoint?.video.embedUrl).toBe(
      'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE',
    );
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
    ).toBeTruthy();
    expect(
      screen.getByTestId('course-checkpoint-next-link').getAttribute('href'),
    ).toBe(`/id/courses/${course.manifest.slug}/checkpoints/03-test-writing`);
  });

  it('keeps test-design activity portable, evidence-based, and self-attested', () => {
    expect(course.checkpoint.video.status).toBe('ready');
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

describe('AI-assisted QA quality decision checkpoint and capstone', () => {
  let course: CourseCheckpointData;
  let completedCourse: CourseCheckpointData;

  beforeAll(async () => {
    const [manifest, content] = await Promise.all([
      getCourseManifest(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG, 'id'),
      getCourseContent(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG, 'id'),
    ]);

    if (!manifest || !content) {
      throw new Error('Expected Indonesian quality summary checkpoint content');
    }

    const checkpoint = content.checkpoints.find(
      (candidate) => candidate.slug === QUALITY_SUMMARY_CHECKPOINT_SLUG,
    );

    if (!checkpoint) {
      throw new Error('Expected the quality summary checkpoint');
    }

    const allCheckpointSlugs = manifest.checkpoints.map(
      (candidate) => candidate.slug,
    );
    course = {
      manifest,
      content,
      checkpoint,
      completed: false,
      completedCheckpointSlugs: allCheckpointSlugs,
      capstoneCompleted: false,
    };
    completedCourse = {
      ...course,
      completed: true,
      capstoneCompleted: true,
    };
  });

  afterEach(cleanup);

  it('renders quality decision guidance and the end-to-end capstone', () => {
    render(<CourseCheckpointPage course={course} locale="id" />);

    expect(
      screen.getByTestId('course-checkpoint-07-quality-summary'),
    ).toBeTruthy();
    expect(
      screen.getByTestId('course-checkpoint-written-lesson').textContent,
    ).toMatch(/tested|untested|residual risk|release/i);
    expect(
      screen.getByTestId('course-checkpoint-ai-activity').textContent,
    ).toMatch(/quality summary|limitations|residual risk|release/i);
    expect(
      screen.getByTestId('course-checkpoint-local-exercise').textContent,
    ).toMatch(/quality-summary\.md|capstone|re-run/i);
    expect(
      screen.getByTestId('course-checkpoint-evidence').textContent,
    ).toMatch(/tested|untested|limitations|residual risk/i);
    expect(
      screen.getByTestId('course-checkpoint-reflection').textContent,
    ).toContain(course.checkpoint.reflectionPrompts[0]);

    expect(screen.getByTestId('course-capstone')).toBeTruthy();
    expect(
      screen
        .getByTestId('course-capstone-state')
        .getAttribute('data-completed'),
    ).toBe('false');
    expect(screen.getByTestId('course-capstone').textContent).toContain(
      course.content.capstone.objective,
    );
    expect(
      screen.getByTestId('course-capstone-written-lesson').textContent,
    ).toContain('Satukan artefak');
    expect(
      screen.getByTestId('course-capstone-ai-activity').textContent,
    ).toMatch(/traceability|gap|quality decision/i);
    expect(
      screen.getByTestId('course-capstone-local-exercise').textContent,
    ).toMatch(/README\.md|evidence|quality-summary\.md/i);
    expect(
      screen.getByTestId('course-capstone-evidence').textContent,
    ).toContain(course.content.capstone.evidenceChecklist[0]);
    expect(
      screen.getByTestId('course-capstone-reflection').textContent,
    ).toContain(course.content.capstone.reflectionPrompts[0]);
  });

  it('gates capstone self-attestation on its exercise and reflection confirmations', () => {
    render(<CourseCheckpointPage course={course} locale="id" />);

    const completeButton = screen.getByTestId('course-capstone-complete');
    const exerciseConfirmation = screen.getByTestId(
      'course-capstone-exercise-confirmation',
    );
    const reflectionConfirmation = screen.getByTestId(
      'course-capstone-reflection-confirmation',
    );

    expect(completeButton.disabled).toBe(true);
    fireEvent.click(exerciseConfirmation);
    expect(completeButton.disabled).toBe(true);
    fireEvent.click(reflectionConfirmation);
    expect(completeButton.disabled).toBe(false);
  });

  it('shows the recorded capstone and course completion state after all units are complete', () => {
    render(<CourseCheckpointPage course={completedCourse} locale="id" />);

    expect(screen.getByTestId('course-capstone-completed')).toBeTruthy();
    expect(screen.queryByTestId('course-capstone-complete')).toBeNull();
    expect(
      screen
        .getByTestId('course-capstone-state')
        .getAttribute('data-completed'),
    ).toBe('true');
    expect(
      screen
        .getByTestId('course-completion-state')
        .getAttribute('data-completed'),
    ).toBe('true');
    expect(screen.getByTestId('course-checkpoint-next-boundary')).toBeTruthy();
    expect(
      screen
        .getByTestId('course-checkpoint-previous-link')
        .getAttribute('href'),
    ).toBe(`/id/courses/${course.manifest.slug}/checkpoints/06-triage`);
  });
});
